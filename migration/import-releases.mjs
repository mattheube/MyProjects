import fs from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
const destination=process.env.GITHUB_REPOSITORY;
if(!['mattheube/MyProjects-Public','mattheube/MyVoice-Compatibility','mattheube/MyVoice'].includes(destination))throw Error('Unexpected destination');
const token=process.env.GITHUB_TOKEN;if(!token)throw Error('Missing workflow token');
const snapshot=JSON.parse(await fs.readFile('migration/release-snapshot.json','utf8'));
const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'User-Agent':'MyProjects-release-migration'};
async function api(endpoint,method='GET',body){
 const r=await fetch('https://api.github.com/repos/'+destination+endpoint,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
 if(r.status===404&&method==='GET')return null;
 if(!r.ok)throw Error('GitHub API '+r.status+' '+method+' '+endpoint);
 return r.status===204?null:await r.json();
}
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'myprojects-release-'));
let verified=0;
try{
 for(const release of [...snapshot.releases].reverse()){
  if(!/^v\d+\.\d+\.\d+(?:-beta\.\d+)?$/.test(release.tag))throw Error('Unexpected tag');
  let remote=await api('/releases/tags/'+release.tag);
  if(!remote)remote=await api('/releases','POST',{tag_name:release.tag,target_commitish:'main',name:release.name,body:release.body,draft:true,prerelease:release.prerelease});
  for(const asset of release.assets){
   if(!/^(MyVoiceSetup\.exe|MyVoice-[\d.]+-win-x64\.zip|manifest\.json|checksums\.txt|soundpacks\.json)$/.test(asset.name))throw Error('Unexpected asset');
   if(!/^sha256:[a-f0-9]{64}$/.test(asset.digest||''))throw Error('Missing asset digest');
   const existing=remote.assets.find(x=>x.name===asset.name);
   if(existing){if(existing.size!==asset.size||existing.digest!==asset.digest)throw Error('Existing asset differs: '+release.tag+'/'+asset.name);verified++;continue;}
   const expectedUrl='https://github.com/'+snapshot.source+'/releases/download/'+release.tag+'/'+asset.name;
   if(asset.url!==expectedUrl)throw Error('Unexpected source URL');
   const file=path.join(directory,asset.name);
   const response=await fetch(asset.url,{signal:AbortSignal.timeout(600000)});
   if(!response.ok)throw Error('Download '+response.status+' '+release.tag+'/'+asset.name);
   const hash=createHash('sha256');let count=0;
   const verify=new Transform({transform(chunk,encoding,callback){count+=chunk.length;hash.update(chunk);callback(null,chunk);}});
   await pipeline(Readable.fromWeb(response.body),verify,createWriteStream(file));
   if(count!==asset.size||'sha256:'+hash.digest('hex')!==asset.digest)throw Error('Source digest mismatch');
   const upload=new URL(remote.upload_url.split('{')[0]);if(upload.origin!=='https://uploads.github.com')throw Error('Unexpected upload host');
   upload.searchParams.set('name',asset.name);
   const result=await fetch(upload,{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream','Content-Length':String(count)},body:createReadStream(file),duplex:'half',signal:AbortSignal.timeout(600000)});
   if(!result.ok)throw Error('Upload failed '+result.status);
   const uploaded=await result.json();
   if(uploaded.size!==asset.size||uploaded.digest!==asset.digest)throw Error('Uploaded digest mismatch');
   await fs.unlink(file);verified++;
  }
  if(remote.draft)await api('/releases/'+remote.id,'PATCH',{draft:false,make_latest:release.prerelease?'false':'true'});
  console.log('Verified '+release.tag+' ('+release.assets.length+' assets)');
 }
 await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,'## Migration verified\n'+snapshot.releases.length+' published releases and '+verified+' assets verified by SHA-256. Draft source releases were excluded.\n');
}finally{await fs.rm(directory,{recursive:true,force:true});}
