// Recovery errors arrive in the fragment; remove them before loading account UI.
export function captureRecoveryError(location,history){
 const query=new URLSearchParams(location.search),fragment=new URLSearchParams(location.hash.slice(1));
 if((fragment.get('error_code')||query.get('error_code'))!=='otp_expired')return null;
 history.replaceState(null,'',location.pathname+'#account');
 return 'Ce lien de confirmation ou de réinitialisation a expiré ou a déjà été utilisé. Demandez un nouveau lien depuis MyVoice.';
}
