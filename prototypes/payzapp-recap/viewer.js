import {scenes} from './scenes.js';
const params=new URLSearchParams(location.search),select=document.getElementById('scene'),frame=document.getElementById('experience');
if(params.get('embed')==='1'||(parent!==window&&params.get('hosted')!=='1'))document.body.classList.add('embedded');
for(const [id,title] of scenes){const o=new Option(title,id);select.add(o);}
let active='intro';
function show(id){const scene=scenes.find(s=>s[0]===id)||scenes[0];active=scene[0];select.value=active;document.getElementById('hint').textContent=scene[2];const outer=new URL(location.href);outer.searchParams.set('scene',active);history.replaceState(null,'',outer);const inner=new URL('experience.html',location.href);inner.searchParams.set('scene',active);frame.src=inner.href;}
function home(){if(parent!==window&&params.get('hosted')==='1')parent.postMessage({type:'flows:home'},location.origin);else location.href='../../';}
select.onchange=()=>show(select.value);document.getElementById('replay').onclick=()=>show(active);document.getElementById('opening').onclick=()=>show('intro');document.getElementById('library').onclick=e=>{e.preventDefault();home();};window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='recap:home')home();});show(params.get('scene')||'intro');

const phone=document.getElementById('phone');
function fit(){const desktop=innerWidth>760&&!document.body.classList.contains('embedded');const scale=desktop?phone.clientWidth/360:1;frame.style.width=desktop?'360px':'100%';frame.style.height=desktop?(phone.clientHeight/scale)+'px':'100%';frame.style.transformOrigin='top left';frame.style.transform=desktop?`scale(${scale})`:'none';}
new ResizeObserver(fit).observe(phone);fit();
