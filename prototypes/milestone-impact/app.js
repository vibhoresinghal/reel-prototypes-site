const story=document.querySelector('#story');const reduced=matchMedia('(prefers-reduced-motion: reduce)');
for(const [id,total,delay] of [['before',5,300],['after',33,1100]]){document.getElementById(id).innerHTML=Array.from({length:100},(_,i)=>`<svg class="person ${i<total?'active':''}" style="--delay:${delay+i*23}ms" viewBox="0 0 18 28"><circle cx="9" cy="4" r="3.3" fill="currentColor"/><path d="M5 25v-8H3V12a6 6 0 0 1 12 0v5h-2v8h-3V17H8v8Z" fill="currentColor"/></svg>`).join('');}
function replay(){story.classList.remove('playing');void story.offsetWidth;if(!reduced.matches)story.classList.add('playing');}
function still(){story.classList.remove('playing');}
async function present(){document.body.classList.add('presenting');try{await document.documentElement.requestFullscreen();}catch{}replay();}
document.querySelector('#replay').onclick=replay;document.querySelector('#still').onclick=still;document.querySelector('#present').onclick=present;
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('presenting');});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;if(e.key.toLowerCase()==='r'){e.preventDefault();replay();}if(e.key.toLowerCase()==='s')still();if(e.key.toLowerCase()==='f')present();if(e.key==='Escape')document.body.classList.remove('presenting');});
reduced.addEventListener('change',still);document.fonts.ready.then(replay);
