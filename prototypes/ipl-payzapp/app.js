import {mountPayment,formatAmount} from './payment.js';
import {mountScannerCamera} from './scanner.js?v=remember-zoom-1';
import {scenes} from './scenes.js?v=scan-payment-1';
const $=s=>document.querySelector(s),stage=$('#stage'),select=$('#scene'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const params=new URLSearchParams(location.search),embedded=params.get('embed')==='1'||(parent!==window&&params.get('hosted')!=='1');
if(embedded)document.body.classList.add('embedded');
let disposeCamera=null,disposePayment=null,scanPayment=false,paymentAmount='99',sceneGeneration=0;
let animations=[],jobs=[],elapsed=0,last=0,frame,media,active='splash',data=new Map(),images=[];
const asset=name=>'assets/'+name;
function later(ms,fn){jobs.push({at:elapsed+ms,fn});}
function tick(now){const generation=sceneGeneration;if(!document.hidden){elapsed+=last?Math.min(now-last,100):0;const due=jobs.filter(j=>j.at<=elapsed);jobs=jobs.filter(j=>j.at>elapsed);for(const j of due){j.fn();if(generation!==sceneGeneration)return;}}last=now;frame=requestAnimationFrame(tick);}
function el(tag,cls,parentNode=stage){const e=document.createElement(tag);e.className=cls;parentNode.append(e);return e;}
function art(name,cls='layer'){const e=el('img',cls);e.src=asset(name);e.alt='';return e;}
function hotspot(label,rect,fn,parentNode=stage){const b=el('button','hotspot',parentNode);b.setAttribute('aria-label',label);['left','top','width','height'].forEach((key,i)=>b.style[key]=rect[i]+'%');b.onclick=fn;return b;}
function animate(name,cls='',options={}){const container=el('div','anim '+cls);const a=lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,animationData:structuredClone(data.get('assets/lottie/'+name)),assetsPath:name.startsWith('User Referral/')?asset('lottie/User Referral/images/'):undefined,rendererSettings:{preserveAspectRatio:options.ratio||'xMidYMax meet'}});animations.push(a);a.addEventListener('DOMLoaded',()=>{if(reduced)a.goToAndStop(options.still??Math.max(0,a.totalFrames-1),true);else if(!document.hidden&&options.play!==false)a.play();options.ready?.(a);});a.loop=options.loop&&!reduced;return {a,container};}
function reset(){sceneGeneration++;stage.onclick=null;stage.onkeydown=null;stage.removeAttribute('role');stage.removeAttribute('tabindex');stage.setAttribute('aria-label','IPL on PayZapp prototype');disposePayment?.();disposePayment=null;stage.getAnimations().forEach(a=>a.cancel());disposeCamera?.();disposeCamera=null;cancelAnimationFrame(frame);animations.forEach(a=>a.destroy());animations=[];jobs=[];elapsed=0;last=0;media?.pause();media=null;stage.replaceChildren();}
function show(id,update=true,autoOpen=false){reset();id=({'leaderboard-new':'leaderboard','success-alt':'success','spotlight-4':'spotlight-1','spotlight-5':'spotlight-1','sheet':'sheet-alt'})[id]||id;active=scenes.some(s=>s[0]===id)||['amount','processing'].includes(id)?id:'splash';if(!['amount','processing','success'].includes(active)){scanPayment=false;paymentAmount='99';}const scene=['amount','processing'].includes(active)?'scan':active;select.value=scene;stage.dataset.scene=active;$('#hint').textContent=scenes.find(s=>s[0]===scene)[2];if(update){const u=new URL(location.href);u.searchParams.set('scene',active);history.replaceState(null,'',u);}
 if(active==='leaderboard'){const sc=el('div','scroll');const image=art('Leaderboard Page.png','art');sc.append(image);sc.tabIndex=0;sc.setAttribute('aria-label','Runs leaderboard, scroll to explore');}
 else if(active==='splash'){
 art('Home Screen.png','layer full');let started=false;
 const start=()=>{if(started)return;started=true;const cover=el('div','splash');const a=animate('splash_screen_ipl_v2.json','',{ratio:'xMidYMid meet',ready:a=>{if(reduced)later(700,finish);else a.addEventListener('complete',finish);}});cover.append(a.container);function finish(){cover.style.opacity='0';later(250,()=>show('spotlight-1'));}};
 hotspot('Open PayZapp',[25,84,25,16],start);if(autoOpen)start();
 }
 else if(active==='promo'){media=el('video','');media.src=asset('promo video.mp4');media.muted=true;media.playsInline=true;media.controls=!matchMedia('(max-width:760px)').matches&&!embedded;media.onclick=()=>{if(!media.controls){if(media.paused)media.play().catch(()=>{});else media.pause();}};media.autoplay=!reduced;media.addEventListener('ended',()=>show('leaderboard'));media.addEventListener('error',()=>{const b=el('button','');b.textContent='Retry video';b.onclick=()=>media.load();});}
 else if(active==='scan'){
 art('scan-qr-bg.png','layer full');disposeCamera=mountScannerCamera(stage,data.get('assets/lottie/scanqrIPL.json'));animate('scanqrIPL.json','',{loop:true,ratio:'xMidYMin slice',still:250});art('scan-qr-overlay.png','layer bottom scanner-controls');const header=el('div','scanner-header');const headerArt=art('scan-qr-overlay.png','layer');header.append(headerArt);hotspot('Back to PayZapp',[0,0,20,100],()=>show('spotlight-1'),header);
 const scan=()=>{if(active!=='scan')return;scanPayment=true;show('amount',false);};
 stage.tabIndex=0;stage.setAttribute('role','group');stage.setAttribute('aria-label','Stadium scanner. Tap the camera or press Enter to use a sample QR code.');
 stage.onclick=e=>{if(e.target.closest('button,.camera-notice'))return;scan();};
 stage.onkeydown=e=>{if(e.target===stage&&['Enter',' '].includes(e.key)){e.preventDefault();scan();}};
 }
 else if(active==='amount'||active==='processing'){
 scanPayment=true;
 disposePayment=mountPayment(stage,{phase:active,amount:paymentAmount,onAmount:value=>paymentAmount=value,onBack:()=>show('scan',false),onPay:value=>{if(active!=='amount')return;paymentAmount=value;show('processing',false);}});
 if(active==='processing')later(1800,()=>show('success',false));
 }
 else if(active==='success'){
 if(scanPayment){const hero=el('div','scan-success-hero');const copy=el('div','scan-success-copy',hero);copy.innerHTML='<h1>₹'+formatAmount(paymentAmount)+'</h1><p>Paid to Nirmal Stephen</p><small>07 Nov 2026, 11:00 AM</small>';}
 const receipt=art('Transacrtion Success.png','layer success-receipt');
 if(scanPayment){receipt.style.clipPath='inset(47.8% 0 12% 0)';const toolbar=el('div','scan-success-toolbar');toolbar.innerHTML='<img src="assets/payment/close.svg" alt=""><span><img src="assets/payment/share.svg" alt=""><img src="assets/payment/receipt-help.svg" alt=""></span>';}
 const actions=el('div','success-actions');const buttons=art('Transacrtion Success.png','success-button-art');actions.append(buttons);
 hotspot('View PayZapp home',[52.22,0,41.11,100],()=>show('spotlight-1'),actions);
 animate('payment success.json','success-anim',{ratio:'xMidYMin meet',loop:true});
 const overlay=animate('txnRuns.json','runs-celebration',{play:false});overlay.container.style.opacity='0';overlay.a.pause();
 const text=el('div','runs');text.innerHTML='<strong>6 Runs<br>Scored</strong><p>Book flights on PayZapp Shop, get 25 runs!</p>';
 later(4000,()=>{overlay.container.classList.add('is-visible');overlay.container.style.opacity='1';text.classList.add('is-visible');if(!reduced)overlay.a.goToAndPlay(0,true);});
 later(14000,()=>{overlay.container.classList.remove('is-visible');overlay.container.style.opacity='0';text.classList.remove('is-visible');});
 hotspot('Close success',[0,0,18,10],()=>show('spotlight-1'));
 }
 else if(active==='referral'){
 art('referral.png','layer bottom');const scrim=el('div','scrim');let endFrame=108;const ref=animate('User Referral/userReferral.json','',{ready:a=>{endFrame=a.totalFrames;if(!reduced)a.playSegments([0,15],true);}});const sheet=art('refrral bottom sheet.png','layer bottom');sheet.style.width='99%';sheet.style.opacity='0';sheet.style.transition='opacity .15s';scrim.style.opacity='1';
 later(300,()=>sheet.style.opacity='1');let holding=false;
 let dismissed=false;const exit=()=>{dismissed=true;sheet.style.opacity='0';scrim.style.opacity='0';ref.container.classList.add('scene-exit');};
 ref.a.addEventListener('complete',()=>{if(!holding){holding=true;later(3500,()=>{if(dismissed)return;sheet.style.opacity='0';ref.a.playSegments([15,endFrame],true);});}else exit();});
 if(reduced)later(4000,exit);
 hotspot('Replay referral invitation',[27,31,46,12],()=>show('referral'));hotspot('Dismiss invitation',[0,0,100,28],exit);
 }
 else if(active.startsWith('spotlight-')){
 let idx=Number(active.split('-')[1])-1;const sc=el('div','scroll spotlight-scroll');const composition=el('div','spotlight-composition',sc);composition.style.position='relative';const banners=[1,2,3].map(n=>{const im=art('spotlights/'+n+'.png','layer spot');im.style.opacity=n===idx+1?'1':'0';composition.append(im);return im;});const base=art('home spotlight.png','art');composition.append(base);base.style.position='relative';base.style.pointerEvents='none';base.style.clipPath='inset(0 0 29.14% 0)';const header=el('div','spotlight-header',composition);const headerArt=art('home spotlight.png','');header.append(headerArt);const nav=el('div','home-nav');nav.setAttribute('aria-hidden','true');hotspot('Open stadium scanner from navigation',[40,49,20,51],()=>show('scan'),nav);
 const next=delta=>{banners[idx].style.opacity='0';idx=(idx+delta+banners.length)%banners.length;banners[idx].style.opacity='1';};
 let x,moved=false;sc.addEventListener('pointerdown',e=>{x=e.clientX;moved=false;});sc.addEventListener('pointerup',e=>{if(Math.abs(e.clientX-x)>35){moved=true;next(e.clientX<x?1:-1);}});sc.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
 const heroTap=hotspot('Explore IPL season',[0,0,100,26],()=>show(idx===2?'leaderboard':'promo'),composition);heroTap.style.height='calc(62.222cqw + var(--hero-extra))';const scanTap=hotspot('Open stadium scanner',[3,26,23,12],()=>show('scan'),composition);scanTap.style.top='calc(62.222cqw + var(--hero-extra))';scanTap.style.height='31cqw';
 if(!reduced){const cycle=()=>{next(1);later(4000,cycle);};later(4000,cycle);}
 }
 else {art('Bottom Sheet.png','layer bottom');hotspot('Open campaign gift',[0,53,100,47],()=>show('promo'));hotspot('Dismiss campaign invitation',[0,0,100,45],()=>show('spotlight-1'));}
 if(!reduced&&['amount','processing','success'].includes(active)&&scanPayment)stage.animate([{opacity:.96,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,easing:'cubic-bezier(.22,.61,.36,1)'});
 frame=requestAnimationFrame(tick);
}
select.innerHTML=scenes.map(([id,title])=>`<option value="${id}">${title}</option>`).join('');select.onchange=()=>{scanPayment=false;show(select.value);};$('#replay').onclick=()=>show(scanPayment?'scan':active);
$('#opening').onclick=()=>show('splash',true,true);
$('#home').onclick=()=>show('spotlight-1');
$('#library').onclick=e=>{if(parent!==window&&params.get('hosted')==='1'){e.preventDefault();parent.postMessage({type:'flows:home'},location.origin);}};
document.addEventListener('keydown',e=>{if(e.key==='Escape')show(active==='amount'?'scan':'spotlight-1');});
let resume=[];document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){resume=animations.filter(a=>!a.isPaused);resume.forEach(a=>a.pause());if(media){media.dataset.wasPlaying=String(!media.paused);media.pause();}}else{resume.forEach(a=>{if(animations.includes(a))a.play();});if(media?.dataset.wasPlaying==='true')media.play().catch(()=>{});}});
window.addEventListener('pagehide',reset);
async function timed(p){let t;try{return await Promise.race([p,new Promise((_,reject)=>t=setTimeout(()=>reject(Error('Asset timed out')),30000))]);}finally{clearTimeout(t);}}
let loading=false;
async function load(){if(loading)return;loading=true;$('#retry').hidden=true;$('#load-label').textContent='Loading IPL artwork';try{const r=await timed(fetch('inventory.json'));if(!r.ok)throw Error('Inventory unavailable');const inventory=await r.json();let done=0;const paymentAssets=await timed(fetch('payment-assets.json').then(r=>{if(!r.ok)throw Error('Payment assets unavailable');return r.json();}));const queue=[...inventory,...Object.keys(paymentAssets)];const count=queue.length;const results=await Promise.allSettled(Array.from({length:6},async()=>{while(queue.length){const file=queue.shift();if(file.endsWith('.json')){const r=await timed(fetch(file));if(!r.ok)throw Error(file);data.set(file,await r.json());}else{const img=new Image();img.src=file;await timed(img.decode());images.push(img);}$('#loading progress').value=++done/count*100;}}));const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;await timed(document.fonts.ready);if(!window.lottie)throw Error('Animation player unavailable');$('#loading').hidden=true;show(params.get('scene')||'splash',false);}catch(e){$('#loading').hidden=false;$('#load-label').textContent='Some artwork could not load. Please try again.';$('#retry').hidden=false;console.error(e);}finally{loading=false;}}
$('#retry').onclick=load;load();
