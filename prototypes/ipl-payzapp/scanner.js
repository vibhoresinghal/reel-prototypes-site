import {cameraPreferences,createScannerZoom} from './camera-preferences.js?v=remember-zoom-1';
import {createCamera,scannerAperture} from './camera.js';

export function mountScannerCamera(stage,data){
 const prefs=cameraPreferences();
 let disposed=false,zoom=null,permission=null,readyVersion=0;
 const aperture=document.createElement('div');aperture.className='scanner-camera';
 const video=document.createElement('video');video.className='scanner-camera-video';video.muted=true;video.autoplay=true;video.playsInline=true;video.setAttribute('aria-label','Live rear camera');
 const notice=document.createElement('div');notice.className='camera-notice';
 const message=document.createElement('p');message.setAttribute('role','status');
 const button=document.createElement('button');button.type='button';button.textContent='Enable camera';
 const controls=document.createElement('div');controls.className='scanner-zoom';controls.hidden=true;controls.setAttribute('role','group');controls.setAttribute('aria-label','Camera zoom');
 const zoomLabel=document.createElement('span');zoomLabel.className='scanner-zoom-label';controls.append(zoomLabel);
 const buttons=[1,2,3].map(value=>{
  const b=document.createElement('button');b.type='button';b.textContent=value+'×';b.setAttribute('aria-label',value+' times zoom');
  b.onclick=event=>{event.stopPropagation();prefs.saveZoom(value);zoom?.set(value);};controls.append(b);return b;
 });
 controls.addEventListener('click',event=>event.stopPropagation());
 notice.append(message,button);aperture.append(video,notice);stage.append(aperture,controls);
 const messages={idle:'Use your camera to frame a QR code.',requesting:'Opening camera…',live:'',denied:'Camera access is blocked. Allow it in site settings, then try again.',missing:'No camera was found on this device.',busy:'The camera is in use. Close the other camera app and try again.',error:'Could not start the camera. Please try again.',ended:'The camera stopped. Tap to reconnect.',paused:'Camera paused.',insecure:'Open this scanner using the HTTPS site to use your camera.',unsupported:'This browser does not support camera access.'};
 const state=name=>{
  if(disposed)return;
  const version=++readyVersion;zoom?.dispose();zoom=null;
  controls.hidden=true;video.style.visibility='hidden';
  if(name==='live'){
   prefs.remember(true);video.style.transition='none';
   zoom=createScannerZoom({video,track:video.srcObject?.getVideoTracks()[0],onChange:({value,mode})=>{
    if(disposed||version!==readyVersion)return;
    buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===value)));
    zoomLabel.textContent=mode==='preview'?'Preview zoom':'Zoom';
   }});
   zoom.set(prefs.zoom()).then(()=>{if(disposed||version!==readyVersion)return;video.getBoundingClientRect();video.style.visibility='';video.style.transition='';notice.hidden=true;controls.hidden=false;});
   return;
  }
  if(name==='denied')prefs.remember(false);
  notice.hidden=false;message.textContent=messages[name];
  button.hidden=['requesting','insecure','unsupported'].includes(name);
  button.textContent=name==='idle'?'Enable camera':name==='paused'?'Resume camera':'Try again';
 };
 const camera=createCamera({video,secure:window.isSecureContext,getMedia:navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices),onState:state});
 const resize=()=>{const g=scannerAperture(data,stage.clientWidth,stage.clientHeight);Object.assign(aperture.style,{left:g.x+'px',top:g.y+'px',width:g.width+'px',height:g.height+'px',clipPath:`path('${g.path}')`});controls.style.top=Math.max(g.y+32,g.y+g.height-56)+'px';};
 const observer=new ResizeObserver(resize);observer.observe(stage);resize();
 button.onclick=event=>{event.stopPropagation();camera.start();};
 const reconnect=()=>{if(!disposed&&!document.hidden&&prefs.enabled())camera.start();};
 const visibility=()=>{if(document.hidden){camera.stop();state('paused');}else reconnect();};
 const permissionChanged=()=>{if(disposed)return;if(permission.state==='denied'){prefs.remember(false);camera.stop();state('denied');}};
 document.addEventListener('visibilitychange',visibility);
 state('idle');
 if(!window.isSecureContext)state('insecure');
 else{
  reconnect();
  Promise.resolve().then(()=>navigator.permissions?.query({name:'camera'})).then(result=>{
   if(disposed||!result)return;permission=result;permission.addEventListener?.('change',permissionChanged);
   if(permission.state==='denied')permissionChanged();
   else if(permission.state==='granted'&&!document.hidden)camera.start();
  }).catch(()=>{});
 }
 return ()=>{disposed=true;readyVersion++;zoom?.dispose();camera.dispose();permission?.removeEventListener?.('change',permissionChanged);observer.disconnect();document.removeEventListener('visibilitychange',visibility);aperture.remove();controls.remove();};
}
