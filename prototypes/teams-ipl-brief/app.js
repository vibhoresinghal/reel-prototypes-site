const message=document.querySelector('#message'),typing=document.querySelector('#typing'),preview=document.querySelector('#chat-preview'),dot=document.querySelector('#unread-dot');
const status=document.querySelector('#status');
let timers=[],generation=0,starting=false;
let soundContext;
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
function scrollToLatest(){requestAnimationFrame(()=>{const thread=document.querySelector('.thread');thread.scrollTop=thread.scrollHeight;});}
function cancel(){timers.forEach(clearTimeout);timers=[];stopChime();generation++;starting=false;message.classList.remove('arriving');}
function reset(){cancel();message.hidden=true;typing.hidden=true;dot.hidden=true;preview.textContent="You: Agreed. Let's keep it light…";scrollToLatest();}
function showMessage(notify=false){typing.hidden=true;message.hidden=false;message.classList.add('arriving');preview.textContent='Anoop: @Vibhore, please lead…';dot.hidden=false;scrollToLatest();if(notify)chime();}
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
  timers.push(setTimeout(()=>{if(token===generation)typing.hidden=false;},3600));
  timers.push(setTimeout(()=>{if(token===generation)showMessage(true);},5000));
}
function restore(){cancel();typing.hidden=true;document.body.classList.remove('recording');showMessage();message.classList.remove('arriving');status.textContent='5s lead-in · Sound on · R replay · Esc controls';}
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
document.addEventListener('animationend',e=>{if(e.target===message)message.classList.remove('arriving');});
showMessage();message.classList.remove('arriving');
document.fonts.ready.then(scrollToLatest);
addEventListener('resize',scrollToLatest);
