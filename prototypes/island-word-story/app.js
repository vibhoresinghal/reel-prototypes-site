const words=['Island','Adventure','had','to','wait'];
const word=document.querySelector('#word');
const pace=document.querySelector('#pace');
const status=document.querySelector('#status');
let index=0,timer=0,run=0,starting=false,recording=false;
let entrance=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const entranceDuration=()=>reducedMotion.matches?0:Math.min(300,Number(pace.value)*.23);
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
    {transform:'translateY(.07em) scale(.86)',offset:0,easing:'cubic-bezier(.2,.75,.3,1)'},
    {transform:'translateY(-.018em) scale(1.045)',offset:.55,easing:'ease-in-out'},
    {transform:'translateY(.006em) scale(.99)',offset:.82,easing:'ease-out'},
    {transform:'translateY(0) scale(1)',offset:1}
  ],{duration:entranceDuration(),easing:'linear'});
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
    // Reading time begins after the entrance settles, even at the quick pace.
    const hold=beat*[.3,.42,.16,.12,.65][index];
    const last=index===words.length-1;
    timer=setTimeout(()=>{
      if(token!==run)return;
      // Replace on the same frame: solid words, no fade or blank between beats.
      show(last?0:index+1,false);
      advance();
    },entranceDuration()+hold+(last?220:0));
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
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches&&entrance?.playState==='running')entrance.finish();});
addEventListener('resize',fit);document.fonts.ready.then(()=>{fit();if(!recording&&!starting)enterWord();});fit();
