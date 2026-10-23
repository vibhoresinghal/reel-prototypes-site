window.prototypeAssets={"images":["assets/473-17004-e88d7.svg","assets/app-icon.svg","assets/attention/015b8.svg","assets/attention/03373.svg","assets/attention/05588.svg","assets/attention/08e71.svg","assets/attention/0b8f1.svg","assets/attention/0f0d9.svg","assets/attention/14644.svg","assets/attention/14701-c44bc.svg","assets/attention/14701-c6526.svg","assets/attention/14764-0d720.svg","assets/attention/14764-291a5.svg","assets/attention/14764-59cb1.svg","assets/attention/14764-61385.svg","assets/attention/14764-8997d.svg","assets/attention/14784-05afd.svg","assets/attention/14784-256ef.svg","assets/attention/14784-3776d.svg","assets/attention/14784-37b4d.svg","assets/attention/14784-70639.svg","assets/attention/14784-7fd32.png","assets/attention/14784-8c70f.svg","assets/attention/14784-9c170.png","assets/attention/14784-a8488.png","assets/attention/14784-b2cff.svg","assets/attention/14784-d0708.svg","assets/attention/14784-e3b6c.svg","assets/attention/14784-e506e.svg","assets/attention/14784-f1fab.png","assets/attention/14784-fa4cb.png","assets/attention/14834-037b3.svg","assets/attention/14834-1d3b9.svg","assets/attention/14834-3e4b6.svg","assets/attention/14834-52d0e.png","assets/attention/14834-5edd3.svg","assets/attention/14834-630be.svg","assets/attention/14834-7afff.png","assets/attention/14834-7b297.svg","assets/attention/14834-8a142.png","assets/attention/14834-95060.svg","assets/attention/14834-9c712.png","assets/attention/14834-abdeb.svg","assets/attention/14834-cb3d3.svg","assets/attention/14834-d70b0.svg","assets/attention/14834-ed105.svg","assets/attention/14834-f5a30.svg","assets/attention/14892-4975a.svg","assets/attention/14892-99623.svg","assets/attention/14892-ad68a.svg","assets/attention/14892-ba71c.svg","assets/attention/14910-4b9cb.svg","assets/attention/14910-4f1c8.svg","assets/attention/14910-9f946.svg","assets/attention/14910-b3108.svg","assets/attention/14910-d8d53.svg","assets/attention/14910-e146c.png","assets/attention/15438-2a1c7.svg","assets/attention/15438-41149.svg","assets/attention/15438-901d2.svg","assets/attention/15438-a37de.svg","assets/attention/15438-da6f2.svg","assets/attention/15438-dba45.svg","assets/attention/15438-e8794.svg","assets/attention/19593.svg","assets/attention/21661.svg","assets/attention/221fe.svg","assets/attention/250d9.svg","assets/attention/25cbe.svg","assets/attention/2b081.svg","assets/attention/2b16f.svg","assets/attention/2b5f6.svg","assets/attention/329c4.svg","assets/attention/3320a.svg","assets/attention/4b9cb.svg","assets/attention/4be8c.svg","assets/attention/4c462.svg","assets/attention/4c8e1.svg","assets/attention/4f1c8.svg","assets/attention/52a35.png","assets/attention/534e6.svg","assets/attention/570d6.svg","assets/attention/630e1.png","assets/attention/69e5d.svg","assets/attention/71b97.svg","assets/attention/76acb.svg","assets/attention/82bfa.png","assets/attention/843cd.svg","assets/attention/8839b.svg","assets/attention/8bcc4.svg","assets/attention/8dea3.svg","assets/attention/8edd5.svg","assets/attention/94f87.png","assets/attention/986b8.svg","assets/attention/9efe3.svg","assets/attention/9f946.svg","assets/attention/a1264.svg","assets/attention/a201e.svg","assets/attention/a91ae.svg","assets/attention/aa0d8.svg","assets/attention/add06.svg","assets/attention/b173e.svg","assets/attention/b3108.svg","assets/attention/bb220.svg","assets/attention/bc973.svg","assets/attention/cbbb5.svg","assets/attention/cfe18.svg","assets/attention/d3154.png","assets/attention/d5b9d.svg","assets/attention/d8d53.svg","assets/attention/e146c.png","assets/attention/e162b.svg","assets/attention/e4304.svg","assets/attention/e5684.svg","assets/attention/eb75c.svg","assets/attention/eda34.png","assets/attention/f3216.svg","assets/attention/f4125.svg","assets/attention/f7a13.svg","assets/attention/fa149.png","assets/attention/fd6b9.svg","assets/attention/ff41b.svg","assets/attention/node-14702.svg","assets/attention/node-14838.svg","assets/attention/node-14845.svg","assets/attention/node-14853.svg","assets/decor-473-17164.svg","assets/decor-473-17170.svg","assets/flows-192.png","assets/footer-curve.png"],"script":"attention.js?v=d5ca43edeb51","module":true};
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
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
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
