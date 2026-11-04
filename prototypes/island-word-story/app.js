const words=['Island','Adventure','had','to','wait'];
const word=document.querySelector('#word');
const pace=document.querySelector('#pace');
const status=document.querySelector('#status');
let index=0,timer=0,run=0,starting=false,recording=false;
let entrance=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const measure=document.createElement('canvas').getContext('2d');
function fit(){
  // One stable type size for the whole sentence; even Adventure fits the shot.
  measure.font='700 100px Story';
  const width=measure.measureText('Adventure').width-6.5*8;
  const size=Math.min(innerWidth*.84/width*100,innerHeight*.39);
  word.style.fontSize=size+'px';
}
function enterWord(){
  entrance?.cancel();
  if(reducedMotion.matches)return;
  entrance=word.animate([
    {transform:'translateY(.18em) scale(.97)',opacity:0},
    {opacity:1,offset:.45},
    {transform:'translateY(0) scale(1)',opacity:1}
  ],{duration:Math.min(440,Number(pace.value)*.44),easing:'cubic-bezier(.16,1,.3,1)'});
}
function show(i,animate=true){index=Math.max(0,Math.min(words.length-1,i));word.textContent=words[index];if(animate)enterWord();}
function cancel(){clearTimeout(timer);entrance?.cancel();run++;starting=false;}
function controls(){cancel();recording=false;document.body.classList.remove('recording','preparing');}
async function play(fullscreen=false){
  if(starting)return;
  cancel();starting=true;const token=run;status.textContent='';
  if(fullscreen&&!document.fullscreenElement){
    try{await document.documentElement.requestFullscreen({navigationUI:'hide'});}
    catch{starting=false;status.textContent='Fullscreen is unavailable here. Open this flow in its own tab or choose Preview.';return;}
  }
  await document.fonts.ready;
  if(token!==run)return;
  starting=false;recording=true;fit();show(0,false);
  document.body.classList.add('recording','preparing');
  const beat=Number(pace.value);
  const advance=()=>{
    if(token!==run)return;
    document.body.classList.remove('preparing');
    enterWord();
    if(index===words.length-1)return; // Hold the final word until the next take.
    const duration=beat*[1.1,1.3,.75,.65][index];
    timer=setTimeout(()=>{show(index+1,false);advance();},duration);
  };
  timer=setTimeout(advance,2000);
}
document.querySelector('#record').addEventListener('click',()=>play(true));
document.querySelector('#preview').addEventListener('click',()=>play());
document.addEventListener('keydown',e=>{
  if(e.target.matches('select,input,textarea')||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  if(e.key==='Escape'){controls();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});return;}
  if(e.key.toLowerCase()==='r'||e.code==='Space'){e.preventDefault();play();}
  if(e.key.toLowerCase()==='f'){e.preventDefault();play(true);}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    e.preventDefault();cancel();recording=true;document.body.classList.add('recording');document.body.classList.remove('preparing');show(index+(e.key==='ArrowRight'?1:-1));
  }
});
document.addEventListener('fullscreenchange',()=>{fit();if(!document.fullscreenElement)controls();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)controls();});
document.addEventListener('pointerdown',e=>{if(recording&&e.target.closest('main'))play();});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)entrance?.cancel();});
addEventListener('resize',fit);document.fonts.ready.then(()=>{fit();if(!recording&&!starting)enterWord();});fit();
