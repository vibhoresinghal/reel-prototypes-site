import {icons} from './icons.js';
import {exampleCode,highlight,advancePosition} from './model.js';
const $=id=>document.getElementById(id);
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icons[el.dataset.icon]||'');
const workspace=$('workspace'),viewport=$('code-viewport'),code=$('code');
const defaults={size:20,speed:65,length:64,palette:'mint',accent:'#8ee5be',ink:'#e0e4e8',background:'#151719',delay:2,loop:true,filename:'MilestoneJourney.tsx',prompt:$('prompt').value,'custom-code':''};
const palettes={mint:['#8ee5be','#e0e4e8','#151719','#1c1e20','#191b1d','#8e969e','#ffffff13','#c8b3ef','#a8d6b4','#e9c38d','#7b8791'],violet:['#c6adff','#e8e3f1','#191620','#211d29','#1d1925','#9d92ac','#ffffff14','#b9bdff','#a8d3c0','#e6bd91','#8a819a'],amber:['#efc27e','#eee5d6','#1c1915','#25211b','#211d18','#a69a88','#ffffff14','#d5b4e8','#c6cf9a','#e6a582','#938675'],light:['#247b5b','#26362e','#fafbf8','#f0f2ec','#f5f6f1','#728075','#1b302b18','#7956a1','#3f7751','#a06825','#8b968d']};
const vars=['accent','ink','editor','chrome','panel','muted','border','keyword','string','number','comment'];
let settings={...defaults};try{const saved=JSON.parse(localStorage.getItem('codex-code-studio')||'{}');for(const key of Object.keys(defaults))if(typeof saved[key]===typeof defaults[key])settings[key]=saved[key];}catch{}
for(const [key,min,max] of [['size',12,34],['speed',15,200],['length',48,160],['delay',0,5]])settings[key]=Math.max(min,Math.min(max,settings[key]));
if(!palettes[settings.palette])settings.palette='mint';
for(const key of ['accent','ink','background'])if(!/^#[0-9a-f]{6}$/i.test(settings[key]))settings[key]=defaults[key];
settings['custom-code']=settings['custom-code'].slice(0,24000);settings.prompt=settings.prompt.slice(0,400);settings.filename=settings.filename.slice(0,60);
let source='',position=0,rendered=-1,rows=[],phase='ready',beforePause='typing',elapsed=0,budget=0,last=0,targetScroll=0,leadDelay=0,request=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const active=()=>['lead','typing','hold'].includes(phase);
function save(){try{localStorage.setItem('codex-code-studio',JSON.stringify(settings));}catch{}}
function appearance(){
 vars.forEach((v,i)=>workspace.style.setProperty('--'+v,palettes[settings.palette][i]));
 workspace.style.setProperty('--accent',settings.accent);workspace.style.setProperty('--ink',settings.ink);workspace.style.setProperty('--editor',settings.background);workspace.style.setProperty('--font-size',settings.size+'px');document.body.style.setProperty('--record-bg',settings.background);
 for(const key of ['size','speed','length'])$(key+'-value').textContent=settings[key]+(key==='size'?' px':key==='speed'?' chars/s':' lines');
 $('length').disabled=!!settings['custom-code'].trim();
 const seconds=Math.round(source.length/settings.speed*1.08);
 $('duration-note').textContent=(settings['custom-code'].trim()?'Custom code · '+source.split('\n').length+' lines · ':'')+'About '+seconds+' seconds per take';
 for(const id of ['file-tab','path-file','changed-file'])$(id).textContent=settings.filename||defaults.filename;
 $('prompt-copy').textContent=settings.prompt||defaults.prompt;
}
function controlsFromSettings(){for(const [key,value] of Object.entries(settings)){if(key==='loop')$(key).checked=value;else $(key).value=value;}}
function setState(next){
 phase=next;workspace.dataset.state=next==='hold'?'complete':next;
 const labels={ready:['Ready to build','Ready to generate'],lead:['Preparing your changes','Starting shortly'],typing:['Writing the implementation','Generating code'],paused:['Generation paused','Paused'],hold:['Implementation ready','Code generated'],complete:['Implementation ready','Code generated']};
 const [task,status]=labels[next];$('task-copy').textContent=task;$('editor-status').textContent=status;
 $('status-icon').innerHTML=icons[next==='hold'||next==='complete'?'Check':'Terminal'];
 $('play').innerHTML=icons[active()?'Pause':'Play']+'<span>'+(active()?'Pause':next==='paused'?'Resume':'Preview')+'</span>';
}
function empty(){position=0;rendered=-1;rows=[];budget=0;targetScroll=0;code.replaceChildren();viewport.scrollTop=0;viewport.scrollLeft=0;$('progress').style.width='0%';}
function render(){
 if(rendered===position)return;
 const lines=source.slice(0,position).split('\n');
 rows.forEach((row,i)=>{if(i===rows.length-1)row.classList.remove('current');});
 // Only update the previous partial line and any newly streamed lines.
 for(let i=Math.max(0,rows.length-1);i<lines.length;i++){
  let row=rows[i];if(!row){row=document.createElement('div');row.className='code-line';const number=document.createElement('span');number.className='line-number';number.textContent=String(i+1);const text=document.createElement('span');text.className='line-text';row.append(number,text);code.append(row);rows.push(row);}
  row.lastElementChild.innerHTML=highlight(lines[i]);
 }
 const current=rows.at(-1);current.classList.add('current');const caret=document.createElement('span');caret.className='caret';current.lastElementChild.append(caret);
 $('line-count').textContent='+'+(position?lines.length:0);$('position').textContent='Ln '+lines.length+', Col '+(lines.at(-1).length+1);$('progress').style.width=100*position/source.length+'%';
 targetScroll=Math.max(0,Math.min(viewport.scrollHeight-viewport.clientHeight,(lines.length-1)*settings.size*1.7-viewport.clientHeight*.62));rendered=position;
}
function prepare(){request++;source=settings['custom-code'].trim()?settings['custom-code'].replace(/\r\n?/g,'\n'):exampleCode(settings.length);empty();setState('ready');appearance();position=Math.min(source.length,source.split('\n').slice(0,14).join('\n').length);render();$('progress').style.width='0%';}
function begin(){empty();elapsed=0;leadDelay=settings.delay*1000;setState(leadDelay?'lead':'typing');render();}
async function start(fullscreen=false){
 const token=++request;$('notice').textContent='';
 if(fullscreen){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch{$('notice').textContent='Fullscreen is unavailable here. Open this flow in its own tab, or use Preview.';return;}if(token!==request)return;document.body.classList.add('recording');}
 await document.fonts.ready;if(token!==request)return;begin();
}
function pause(){if(phase==='paused'){setState(beforePause);return;}if(active()){beforePause=phase;setState('paused');}else start();}
function exitRecording(){request++;document.body.classList.remove('recording');if(active()){beforePause=phase;setState('paused');}}
function tick(time){
 const dt=Math.min(64,time-(last||time));last=time;
 if(!document.hidden){
  if(phase==='lead'){elapsed+=dt;if(elapsed>=leadDelay){elapsed=0;setState('typing');}}
  else if(phase==='typing'){
   const rhythm=.88+.2*Math.sin(position*.035)+.12*Math.cos(position*.081);
   budget+=dt/1000*settings.speed*rhythm;
   const next=advancePosition(source,position,budget);budget-=next-position;position=next;render();
   if(position>=source.length){elapsed=0;setState('hold');}
  }else if(phase==='hold'){elapsed+=dt;if(elapsed>=3000){if(settings.loop)begin();else setState('complete');}}
  if(['typing','hold'].includes(phase)&&Math.abs(viewport.scrollTop-targetScroll)>.3)viewport.scrollTop=reduced.matches?targetScroll:viewport.scrollTop+(targetScroll-viewport.scrollTop)*(1-Math.exp(-dt/95));
 }
 requestAnimationFrame(tick);
}
controlsFromSettings();prepare();requestAnimationFrame(tick);
for(const key of Object.keys(defaults))$(key).addEventListener('input',()=>{
 const el=$(key);settings[key]=key==='loop'?el.checked:typeof defaults[key]==='number'?Number(el.value):el.value;
 if(key==='palette'){[settings.accent,settings.ink,settings.background]=palettes[settings.palette];controlsFromSettings();}
 if(['length','custom-code'].includes(key))prepare();else appearance();
 if(key==='size'){rendered=-1;render();}save();
});
$('play').onclick=pause;$('restart').onclick=()=>start();$('record').onclick=()=>start(true);
$('reset').onclick=()=>{settings={...defaults};controlsFromSettings();prepare();save();};
document.addEventListener('keydown',event=>{
 if(event.target.closest('input,textarea,select,summary')||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
 const key=event.key.toLowerCase();
 if(key==='r'){event.preventDefault();start();}else if(event.code==='Space'){event.preventDefault();pause();}else if(key==='f'){event.preventDefault();start(true);}else if(key==='escape'){exitRecording();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)exitRecording();});
window.addEventListener('resize',()=>{rendered=-1;render();});
