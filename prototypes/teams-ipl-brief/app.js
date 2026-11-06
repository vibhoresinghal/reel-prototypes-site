const message=document.querySelector('#message'),typing=document.querySelector('#typing'),preview=document.querySelector('#chat-preview'),dot=document.querySelector('#unread-dot');
const status=document.querySelector('#status');
let timers=[],generation=0,starting=false;
function scrollToLatest(){requestAnimationFrame(()=>{const thread=document.querySelector('.thread');thread.scrollTop=thread.scrollHeight;});}
function cancel(){timers.forEach(clearTimeout);timers=[];generation++;starting=false;message.classList.remove('arriving');}
function reset(){cancel();message.hidden=true;typing.hidden=true;dot.hidden=true;preview.textContent="You: Agreed. Let's keep it light…";scrollToLatest();}
function showMessage(){typing.hidden=true;message.hidden=false;message.classList.add('arriving');preview.textContent='Anoop: @Vibhore, please lead…';dot.hidden=false;scrollToLatest();}
async function play(fullscreen=false){
  if(starting)return;
  reset();starting=true;const token=generation;
  if(fullscreen&&!document.fullscreenElement){try{await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch{starting=false;showMessage();status.textContent='Open this flow in its own tab for fullscreen. Replay works here.';return;}}
  await Promise.all([document.fonts.ready,...[...document.images].map(img=>img.decode().catch(()=>{}))]);
  if(token!==generation)return;
  starting=false;document.body.classList.add('recording');
  scrollToLatest();
  timers.push(setTimeout(()=>{if(token===generation)typing.hidden=false;},2000));
  timers.push(setTimeout(()=>{if(token===generation)showMessage();},3400));
}
function restore(){cancel();typing.hidden=true;document.body.classList.remove('recording');showMessage();message.classList.remove('arriving');status.textContent='R replay · F fullscreen · Esc controls';}
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
