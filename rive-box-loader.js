window.prototypeAssets={"images":["assets/app-icon.svg","assets/rive-box/coin.svg","assets/rive-box/expiry.svg","assets/rive-box/home-heading.svg","assets/rive-box/offer-heading.svg"],"script":"rive-box.js?v=03eb54d8d5a1","module":true};
(() => {
 const config=window.prototypeAssets;
 const label=document.querySelector('#loader-label');
 const progress=document.querySelector('#loader-progress');
 const retry=document.querySelector('#loader-retry');
 const surface=document.querySelector('#prototype-loader');
 let starting=false,reloadOnRetry=false;
 function fail(message){
  starting=false;label.textContent=message;retry.hidden=false;
  surface.setAttribute('data-state','error');
  retry.focus({preventScroll:true});
 }
 // Retain decoded images for later screens, rather than only warming HTTP cache.
 const retained=[];
 const loaded=new Set();
 const timeout=(promise)=>new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Asset timed out')),30000);
  promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
 });
 async function image(url){
  if(loaded.has(url))return;
  const img=new Image();
  const ready=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Unable to load '+url));});
  img.src=url;
  await timeout(ready);
  await timeout(img.decode());
  retained.push(img);loaded.add(url);
 }
 async function start(){
  if(starting)return;
  starting=true;
  // Failed FontFace promises and module fetches can remain rejected for this
  // document. A user-triggered reload creates a fresh loader and font set.
  if(reloadOnRetry){window.location.reload();return;}
  retry.hidden=true;label.textContent='Loading prototype';progress.value=0;
  surface.removeAttribute('data-state');
  let cursor=0,failed=false;
  const fonts=[...document.fonts];
  const jobs=[...config.images.map(url=>()=>image(url)),...fonts.map(font=>async()=>{
   try{await timeout(font.load());}catch(error){reloadOnRetry=true;throw error;}
  })];
  let done=0;
  await Promise.all(Array.from({length:8},async()=>{
   while(cursor<jobs.length){const job=jobs[cursor++];try{await job();}catch(error){failed=true;console.warn('Prototype preload:',error);}done++;progress.value=done/jobs.length*100;}
  }));
  if(failed){fail('Some assets couldn’t load');return;}
  const script=document.createElement('script');
  if(config.module)script.type='module';
  script.src=config.script;
  script.onerror=()=>{script.remove();reloadOnRetry=true;fail('Prototype couldn’t start');};
  script.onload=()=>{
   // Let React commit and layout before removing the loading surface.
   requestAnimationFrame(()=>requestAnimationFrame(async()=>{
    try{if(window.prototypeReady)await timeout(window.prototypeReady);}catch(error){reloadOnRetry=true;fail("Animation couldn’t load");return;}
    document.body.classList.remove('prototype-loading');
    document.querySelector('#prototype-loader').remove();
    window.prototypePreloadedImages=retained;
   }));
  };
  document.body.append(script);
 }
 retry.addEventListener('click',start);
 start();
})();
