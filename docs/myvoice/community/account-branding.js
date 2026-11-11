// Account pages are shared by MyVoice, MyChat and MyOpti. Product pages keep their branding.
const originals=new WeakMap();
export function setAccountBranding(document,active){
 const header=document.querySelector('header'),footer=document.querySelector('footer'),icon=document.querySelector('link[rel="icon"]');
 if(!originals.has(document))originals.set(document,{header:header.innerHTML,footer:footer.innerHTML,title:document.title,icon:icon.getAttribute('href'),active:false});
 const initial=originals.get(document);
 if(initial.active===active)return;
 initial.active=active;
 if(!active){header.innerHTML=initial.header;footer.innerHTML=initial.footer;document.title=initial.title;icon.setAttribute('href',initial.icon);return;}
 document.title='Mon compte — My Projects';
 icon.setAttribute('href','assets/projects.svg');
 header.innerHTML='<a class="brand" href="https://mattheube.github.io/MyProjects/"><img src="assets/projects.svg" width="40" height="40" alt=""><span>My Projects</span></a><nav aria-label="Applications"><a href="https://mattheube.github.io/MyProjects/myvoice/">MyVoice</a><a href="https://mattheube.github.io/MyProjects/mychat/">MyChat</a><a href="https://mattheube.github.io/MyProjects/myopti/">MyOpti</a></nav><a class="button small" href="#account">Mon compte</a>';
 footer.innerHTML='<a class="brand" href="https://mattheube.github.io/MyProjects/">My Projects</a><span>Un compte pour MyVoice, MyChat et MyOpti.</span><a href="https://mattheube.github.io/MyProjects/informations/">Informations</a>';
}
