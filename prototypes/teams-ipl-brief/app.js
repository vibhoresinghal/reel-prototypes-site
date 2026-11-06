const message=document.querySelector('#message'),slot=document.querySelector('.arrival-slot'),preview=document.querySelector('#chat-preview'),dot=document.querySelector('#unread-dot');
const status=document.querySelector('#status'),thread=document.querySelector('.thread'),history=document.querySelector('.message-space');
let timers=[],generation=0,starting=false;
let soundContext;
let arrivalMotions=[];
const arrivalTiming={duration:560,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'};
const voices=new Set();
function prepareSound(){
  try{
    soundContext??=new (window.AudioContext||window.webkitAudioContext)();
    soundContext.resume().catch(()=>{});
  }catch{/* The visual recording still works if audio is unavailable. */}
}
function stopChime(){
  for(const voice of voices){try{voice.oscillator.stop();}catch{}voice.oscillator.disconnect();voice.gain.disconnect();}
  voices.clear();
}
function chime(){
  if(soundContext?.state!=='running')return;
  stopChime();
  const now=soundContext.currentTime;
  // A quiet, original two-note cue with soft attacks and short bell-like tails.
  for(const [frequency,delay,level] of [[740,0,.045],[988,.085,.032]]){
    const oscillator=soundContext.createOscillator(),gain=soundContext.createGain();
    const at=now+delay,voice={oscillator,gain};
    oscillator.type='sine';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(level,at+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.3);
    gain.gain.linearRampToValueAtTime(0,at+.34);
    oscillator.connect(gain);gain.connect(soundContext.destination);
    voices.add(voice);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();voices.delete(voice);};
    oscillator.start(at);oscillator.stop(at+.35);
  }
}
function finishArrival(){
  const motions=arrivalMotions;
  arrivalMotions=[];
  for(const motion of motions){motion.onfinish=null;motion.cancel();}
}
function scrollToLatest(){
  if(!arrivalMotions.length)thread.scrollTop=thread.scrollHeight;
}
function cancel(){
  finishArrival();
  timers.forEach(clearTimeout);timers=[];stopChime();generation++;starting=false;
}
function reset(){
  cancel();message.hidden=true;slot.hidden=true;dot.hidden=true;
  preview.textContent="You: Agreed. Let's keep it light...";
  scrollToLatest();
}
function showMessage(notify=false){
  finishArrival();
  const previousScroll=thread.scrollTop;
  slot.hidden=false;message.hidden=false;
  preview.textContent='Anoop: @Vibhore, please lead...';dot.hidden=false;
  scrollToLatest();
  if(!notify)return;
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    // Commit the final layout once, then visually carry the entire conversation
    // from its previous position. No growing clip or per-frame scroll writes.
    const distance=thread.scrollTop-previousScroll;
    const conversation=history.animate([
      {transform:'translateY('+distance+'px)'},{transform:'translateY(0)'}
    ],arrivalTiming);
    const incoming=message.animate([
      {transform:'translateY(12px)',opacity:.94},{transform:'translateY(0)',opacity:1}
    ],arrivalTiming);
    // Both effects use the exact same clock, duration and easing.
    const start=document.timeline.currentTime;
    conversation.startTime=start;incoming.startTime=start;
    arrivalMotions=[conversation,incoming];
    conversation.onfinish=()=>{
      if(arrivalMotions[0]!==conversation)return;
      finishArrival();scrollToLatest();
    };
  }
  chime();
}
async function play(fullscreen=false){
  if(starting)return;
  reset();starting=true;const token=generation;
  // Unlock audio within the same click/key gesture as the fullscreen request.
  prepareSound();
  if(fullscreen&&!document.fullscreenElement){try{await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch{starting=false;showMessage();status.textContent='Open this flow in its own tab for fullscreen. Replay works here.';return;}}
  await Promise.all([document.fonts.ready,...[...document.images].map(img=>img.decode().catch(()=>{}))]);
  if(token!==generation)return;
  starting=false;document.body.classList.add('recording');
  scrollToLatest();
  timers.push(setTimeout(()=>{if(token===generation)showMessage(true);},5000));
}
function restore(){cancel();document.body.classList.remove('recording');showMessage();status.textContent='5s lead-in · Sound on · R replay · Esc controls';}
document.querySelector('#replay').addEventListener('click',()=>play());
document.querySelector('#record').addEventListener('click',()=>play(true));
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.target.closest?.('input,textarea,select,[contenteditable=true]'))return;
  if(e.key==='Escape'){restore();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
  if(e.key.toLowerCase()==='r'){e.preventDefault();play();}
  if(e.key.toLowerCase()==='f'){e.preventDefault();play(true);}
});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)restore();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)restore();});
showMessage();
document.fonts.ready.then(scrollToLatest);
addEventListener('resize',()=>{finishArrival();scrollToLatest();});
