// Derive the aperture from the original Lottie matte, preserving its Bezier corners.
export function scannerAperture(data,width,height){
 const layer=data.layers.find(l=>l.nm==='Scanner Window Outlines 2');
 const group=layer.shapes.find(s=>s.ty==='gr');
 const shape=group.it.find(s=>s.ty==='sh').ks.k;
 const tr=group.it.find(s=>s.ty==='tr');
 const scale=Math.max(width/data.w,height/data.h),left=(width-data.w*scale)/2;
 const point=p=>p.map((n,i)=>((n+tr.p.k[i]-layer.ks.a.k[i])*layer.ks.s.k[i]/100+layer.ks.p.k[i])*scale+(i===0?left:0));
 const vertices=shape.v.map(point);const xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]);
 const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 const local=p=>[p[0]-x,p[1]-y].join(' ');
 let path='M '+local(vertices[0]);
 for(let i=0;i<vertices.length;i++){const j=(i+1)%vertices.length;const c1=point(shape.v[i].map((v,k)=>v+shape.o[i][k])),c2=point(shape.v[j].map((v,k)=>v+shape.i[j][k]));path+=' C '+local(c1)+' '+local(c2)+' '+local(vertices[j]);}
 return {x,y,width:w,height:h,path:path+' Z'};
}

// Own the stream so late permission resolutions cannot leave a camera running.
export function createCamera({video,getMedia,secure=true,onState=()=>{}}){
 let stream=null,generation=0,disposed=false,pending=false;
 const release=s=>s?.getTracks().forEach(t=>t.stop());
 function stop(){generation++;pending=false;release(stream);stream=null;video.srcObject=null;}
 async function start(){
  if(disposed||pending||stream)return;
  if(!secure){onState('insecure');return;}
  if(!getMedia){onState('unsupported');return;}
  const request=++generation;pending=true;onState('requesting');
  let acquired;
  try{
   acquired=await getMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});
   if(disposed||request!==generation){release(acquired);return;}
   stream=acquired;video.srcObject=stream;await video.play();
   if(disposed||request!==generation)return;
   stream.getVideoTracks().forEach(track=>track.addEventListener?.('ended',()=>{if(stream===acquired){stop();onState('ended');}},{once:true}));
   onState('live');
  }catch(error){
   release(acquired);
   if(disposed||request!==generation)return;
   stream=null;video.srcObject=null;
   onState(error.name==='NotAllowedError'?'denied':error.name==='NotFoundError'?'missing':error.name==='NotReadableError'?'busy':'error');
  }finally{if(request===generation)pending=false;}
 }
 return {start,stop,dispose(){disposed=true;stop();}};
}

export function mountScannerCamera(stage,data){
 const aperture=document.createElement('div');aperture.className='scanner-camera';
 const video=document.createElement('video');video.className='scanner-camera-video';video.muted=true;video.autoplay=true;video.playsInline=true;video.setAttribute('aria-label','Live rear camera');
 const notice=document.createElement('div');notice.className='camera-notice';
 const message=document.createElement('p');message.setAttribute('role','status');
 const button=document.createElement('button');button.type='button';button.textContent='Enable camera';
 notice.append(message,button);aperture.append(video,notice);stage.append(aperture);
 const messages={idle:'Use your camera to frame a QR code.',requesting:'Allow camera access in your browser.',live:'',denied:'Camera access is blocked. Allow it in site settings, then try again.',missing:'No camera was found on this device.',busy:'The camera is in use. Close the other camera app and try again.',error:'Could not start the camera. Please try again.',ended:'The camera stopped. Tap to reconnect.',paused:'Camera paused.',insecure:'Open this scanner using the HTTPS site to use your camera.',unsupported:'This browser does not support camera access.'};
 const state=name=>{notice.hidden=name==='live';message.textContent=messages[name];button.hidden=['requesting','insecure','unsupported'].includes(name);button.textContent=name==='idle'?'Enable camera':name==='paused'?'Resume camera':'Try again';};
 const camera=createCamera({video,secure:window.isSecureContext,getMedia:navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices),onState:state});
 const resize=()=>{const g=scannerAperture(data,stage.clientWidth,stage.clientHeight);Object.assign(aperture.style,{left:g.x+'px',top:g.y+'px',width:g.width+'px',height:g.height+'px',clipPath:`path('${g.path}')`});};
 const observer=new ResizeObserver(resize);observer.observe(stage);resize();
 button.onclick=()=>camera.start();
 const visibility=()=>{if(document.hidden){camera.stop();state('paused');}};
 document.addEventListener('visibilitychange',visibility);
 state('idle');if(!window.isSecureContext)state('insecure');
 return ()=>{camera.dispose();observer.disconnect();document.removeEventListener('visibilitychange',visibility);aperture.remove();};
}
