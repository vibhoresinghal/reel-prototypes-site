if ('serviceWorker' in navigator && window.top === window.self) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'}).catch(error => console.warn('App setup unavailable:', error)); }); }

// Keep presentation scale fixed without disabling ordinary scrolling or map dragging.
window.addEventListener('wheel',event=>{
 if(event.ctrlKey||event.metaKey)event.preventDefault();
},{passive:false});
window.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&(['+','-','=','0'].includes(event.key)||['NumpadAdd','NumpadSubtract','Numpad0'].includes(event.code)))event.preventDefault();
});
for(const type of ['gesturestart','gesturechange','gestureend'])window.addEventListener(type,event=>event.preventDefault(),{passive:false});

// Android's installed launch mode can retain a cutout strip after Back.
// A user-initiated Fullscreen API request gives Chrome a fresh fullscreen frame.
if(window.top===window.self && /Android/i.test(navigator.userAgent) &&
 (matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches) && document.fullscreenEnabled){
 const button=document.createElement('button');
 button.type='button';button.textContent='Fill screen';button.setAttribute('aria-label','Fill screen and hide system bars');
 button.style.cssText='position:fixed;z-index:10000;top:calc(env(safe-area-inset-top,0px) + 22px);left:50%;transform:translateX(-50%);border:1px solid #173a2b30;border-radius:20px;padding:8px 14px;background:#ffffffed;color:#173a2b;font:600 12px system-ui;box-shadow:0 2px 8px #0001';
 document.body.append(button);
 const update=()=>{
  const stage=document.querySelector('.stage');
  button.hidden=!!document.fullscreenElement||!!(stage&&stage.dataset.screen!=='home')||document.documentElement.classList.contains('reference');
 };
 button.addEventListener('click',async()=>{
  try{await document.documentElement.requestFullscreen({navigationUI:'hide'});update();}
  catch(error){button.textContent='Try fullscreen again';button.title='Chrome could not enter fullscreen. Tap to retry.';}
 });
 document.addEventListener('fullscreenchange',update);
 window.addEventListener('pageshow',update);
 const observer=new MutationObserver(update);
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-screen']});
 update();
}
