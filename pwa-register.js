if ('serviceWorker' in navigator && window.top === window.self) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'}).catch(error => console.warn('App setup unavailable:', error)); }); }

// Keep presentation scale fixed without disabling ordinary scrolling or map dragging.
window.addEventListener('wheel',event=>{
 if(event.ctrlKey||event.metaKey)event.preventDefault();
},{passive:false});
window.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&(['+','-','=','0'].includes(event.key)||['NumpadAdd','NumpadSubtract','Numpad0'].includes(event.code)))event.preventDefault();
});
for(const type of ['gesturestart','gesturechange','gestureend'])window.addEventListener(type,event=>event.preventDefault(),{passive:false});
