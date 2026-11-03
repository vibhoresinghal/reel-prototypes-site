const story=document.querySelector('#story');const reduced=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.people').forEach((group,side)=>{const share=side?6.6:1;group.innerHTML=Array.from({length:20},(_,i)=>{const fill=Math.max(0,Math.min(1,share-i))*100;const id=`person-${side}-${i}`;return `<svg class="${fill>0?'highlighted':''}" style="--person-delay:${i*45}ms" viewBox="0 0 18 28"><defs><linearGradient id="${id}"><stop offset="${fill}%" stop-color="${side?'#087d43':'#203128'}"/><stop offset="${fill}%" stop-color="#dce5df"/></linearGradient></defs><g fill="url(#${id})"><circle cx="9" cy="4" r="3.3"/><path d="M5 25v-8H3V12a6 6 0 0 1 12 0v5h-2v8h-3V17H8v8Z"/></g></svg>`;}).join('');});
function replay(){story.classList.remove('playing');void story.offsetWidth;if(!reduced.matches)story.classList.add('playing');}
function still(){story.classList.remove('playing');}
async function present(){document.body.classList.add('presenting');try{await document.documentElement.requestFullscreen();}catch{}replay();}
document.querySelector('#replay').onclick=replay;document.querySelector('#still').onclick=still;document.querySelector('#present').onclick=present;
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('presenting');});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;if(e.key.toLowerCase()==='r'){e.preventDefault();replay();}if(e.key.toLowerCase()==='s')still();if(e.key.toLowerCase()==='f')present();if(e.key==='Escape')document.body.classList.remove('presenting');});
reduced.addEventListener('change',still);document.fonts.ready.then(replay);
