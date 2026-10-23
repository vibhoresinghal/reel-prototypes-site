window.prototypeAssets={"images":["assets/473-16816-0befa.png","assets/473-16816-0dcd4.png","assets/473-16816-50510.svg","assets/473-16816-5652d.svg","assets/473-16816-5f6e9.svg","assets/473-16816-8eda3.svg","assets/473-16816-c72e7.svg","assets/473-16816-cf98c.png","assets/473-16816-d3f71.svg","assets/473-16816-e9dc5.svg","assets/473-16856-193e1.png","assets/473-16856-6713c.svg","assets/473-16856-74f4b.png","assets/473-16856-7fd32.png","assets/473-16856-9fc0a.png","assets/473-16872-4c462.svg","assets/473-16872-71b97.svg","assets/473-16872-8bcc4.svg","assets/473-16872-a1264.svg","assets/473-16872-a201e.svg","assets/473-16872-cfe18.svg","assets/473-16872-e162b.svg","assets/473-16872-ff41b.svg","assets/473-16913-52d0e.png","assets/473-16913-7afff.png","assets/473-16913-8a142.png","assets/473-16913-95060.svg","assets/473-16913-9c712.png","assets/473-16913-abdeb.svg","assets/473-16913-d70b0.svg","assets/473-16913-ed105.svg","assets/473-16932-31a61.svg","assets/473-16932-5b392.svg","assets/473-16932-8e015.svg","assets/473-16932-cb735.svg","assets/473-16949-0ad9f.svg","assets/473-16949-6c863.svg","assets/473-16949-a73a0.svg","assets/473-16949-d1cb1.svg","assets/473-16958-84cff.svg","assets/473-16958-ebb81.svg","assets/473-16958-f222c.svg","assets/473-17004-21661.svg","assets/473-17004-221fe.svg","assets/473-17004-2f1e7.svg","assets/473-17004-35271.svg","assets/473-17004-388b3.svg","assets/473-17004-534e6.svg","assets/473-17004-53895.svg","assets/473-17004-570d6.svg","assets/473-17004-64074.svg","assets/473-17004-833ae.png","assets/473-17004-843cd.svg","assets/473-17004-aa0d8.svg","assets/473-17004-add06.svg","assets/473-17004-b173e.svg","assets/473-17004-cbbb5.svg","assets/473-17004-d5b9d.svg","assets/473-17004-e88d7.svg","assets/473-17004-f3216.svg","assets/473-17004-f4125.svg","assets/473-17190-015b8.svg","assets/473-17190-03373.svg","assets/473-17190-0b8f1.svg","assets/473-17190-19593.svg","assets/473-17190-69e5d.svg","assets/473-17190-8839b.svg","assets/473-17190-8c29b.svg","assets/473-17190-9efe3.svg","assets/473-17190-fd6b9.svg","assets/473-17240-2a1c7.svg","assets/473-17240-41149.svg","assets/473-17240-901d2.svg","assets/473-17240-a37de.svg","assets/473-17240-da6f2.svg","assets/473-17240-dba45.svg","assets/473-17240-e8794.svg","assets/473-17470-07bf2.svg","assets/473-17470-0aa1c.svg","assets/473-17470-19c87.svg","assets/473-17470-95c2b.svg","assets/473-17470-9dd33.svg","assets/473-17470-ad0ee.svg","assets/473-17470-d86c5.svg","assets/app-icon.svg","assets/crafted-wordmark.png","assets/decor-473-17164.svg","assets/decor-473-17170.svg","assets/flows-192.png","assets/footer-curve.png","assets/node-473-16915.png","assets/node-473-16920.png","assets/node-473-16922.png","assets/node-473-16930.png","assets/node-473-16934.png","assets/node-473-16939.png","assets/node-473-16942.png","assets/node-473-16946.png","assets/node-473-17225.png","assets/node-473-17236.png"],"script":"app.js","module":false};
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
