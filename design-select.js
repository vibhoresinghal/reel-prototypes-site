// Shared accessible site menu; native selects remain the application state bridge.
const style=document.createElement('style');
style.textContent=`
select[data-site-select]{display:none!important}
.select-wrap:has([data-site-select])>svg{display:none!important}
button.site-select{display:flex!important;align-items:center;justify-content:space-between;gap:20px;width:100%;min-height:42px;padding:12px 14px;margin:0;border:1px solid #d3ddce;border-radius:10px;background:#fff;color:#254530;font:400 12px/1.5 Inter,Arial,sans-serif;text-align:left;cursor:pointer}
button.site-select:hover{border-color:#78927e;background:#fafcf8}
button.site-select:focus-visible,.site-option:focus-visible{outline:2px solid #749782;outline-offset:3px}
.site-select svg{width:18px;height:18px;flex:none;transition:transform .15s}
.site-select[aria-expanded=true] svg{transform:rotate(180deg)}
.site-menu{position:fixed;z-index:10000;box-sizing:border-box;padding:5px;margin:0;border:1px solid #d3ddce;border-radius:12px;background:#fff;box-shadow:0 12px 32px #173a2b24;overflow:auto;overscroll-behavior:contain}
button.site-option{display:flex;align-items:center;justify-content:space-between;gap:16px;box-sizing:border-box;width:100%;border:0;border-radius:7px;background:transparent;padding:11px 12px;color:#254530;font:400 12px/1.5 Inter,Arial,sans-serif;text-align:left;cursor:pointer}
button.site-option:hover,button.site-option:focus{background:#f0f4ec;outline:none}
button.site-option[aria-selected=true]{background:#e5eddf;color:#254d35;font-weight:600}
.site-option svg{width:16px;height:16px;flex:none}
`;
document.head.append(style);
let closeMenu=()=>{};
let serial=0;
const chevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg>';
const enhanced=new Map();
function enhance(select){
 select.dataset.siteSelect='';select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 const button=document.createElement('button');button.type='button';button.className='site-select';
 const labelNode=select.labels?.[0]?.cloneNode(true);labelNode?.querySelectorAll('select,button,svg').forEach(n=>n.remove());
 const label=labelNode?.textContent.trim()||'Choose an option';
 button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
 if(select.getAttribute('aria-describedby'))button.setAttribute('aria-describedby',select.getAttribute('aria-describedby'));
 const text=document.createElement('span');button.append(text);button.insertAdjacentHTML('beforeend',chevron);
 select.after(button);
 const sync=()=>{const title=select.selectedOptions[0]?.textContent||'';if(text.textContent!==title)text.textContent=title;const name=label+': '+title;if(button.getAttribute('aria-label')!==name)button.setAttribute('aria-label',name);button.disabled=select.disabled;};
 enhanced.set(select,sync);new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true});sync();select.addEventListener('change',sync);
 select.labels?.forEach(l=>l.addEventListener('click',e=>{if(e.target===l){e.preventDefault();button.focus();}}));
 function open(){
  closeMenu();sync();const menu=document.createElement('div');menu.className='site-menu';menu.id='site-menu-'+(++serial);menu.setAttribute('role','listbox');menu.setAttribute('aria-label',label);
  button.setAttribute('aria-controls',menu.id);button.setAttribute('aria-expanded','true');
  const options=[...select.options].filter(o=>!o.disabled);let items=[];
  function close(focus=false){menu.remove();button.setAttribute('aria-expanded','false');button.removeAttribute('aria-controls');document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',scroll,true);if(focus)button.focus();closeMenu=()=>{};}
  const outside=e=>{if(!menu.contains(e.target)&&!button.contains(e.target))close();};const dismiss=()=>close();const scroll=e=>{if(!menu.contains(e.target))close();};
  closeMenu=close;
  options.forEach(o=>{const item=document.createElement('button');item.type='button';item.className='site-option';item.setAttribute('role','option');item.setAttribute('aria-selected',String(o.selected));item.tabIndex=-1;const span=document.createElement('span');span.textContent=o.textContent;item.append(span);if(o.selected)item.insertAdjacentHTML('beforeend',check);item.onclick=()=>{select.value=o.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));sync();close(true);};menu.append(item);items.push(item);});
  document.body.append(menu);const r=button.getBoundingClientRect();const room=innerHeight-r.bottom-12;const above=room<160&&r.top>room;menu.style.width=Math.min(Math.max(r.width,180),innerWidth-16)+'px';menu.style.left=Math.max(8,Math.min(r.left,innerWidth-menu.offsetWidth-8))+'px';menu.style.maxHeight=Math.min(340,above?r.top-16:room)+'px';if(above)menu.style.bottom=(innerHeight-r.top+6)+'px';else menu.style.top=(r.bottom+6)+'px';
  let index=Math.max(0,options.findIndex(o=>o.selected));items[index]?.focus();
  let typed='',timer;
  menu.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close(true);}else if(e.key==='Tab'){close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();index=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[index]?.focus();}else if(e.key.length===1&&e.key!==' '){typed+=e.key.toLowerCase();clearTimeout(timer);timer=setTimeout(()=>typed='',600);const found=options.findIndex(o=>o.textContent.toLowerCase().startsWith(typed));if(found>=0){index=found;items[index].focus();}}};
  document.addEventListener('pointerdown',outside);window.addEventListener('resize',dismiss);window.addEventListener('scroll',scroll,true);
 }
 button.onclick=()=>button.getAttribute('aria-expanded')==='true'?closeMenu():open();
 button.onkeydown=e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();open();}};
}
function refresh(){document.querySelectorAll('select:not([data-site-select])').forEach(enhance);for(const [select,sync] of enhanced){if(select.isConnected)sync();else enhanced.delete(select);}}
const discovery=new MutationObserver(()=>{refresh();if(enhanced.size)discovery.disconnect();});
discovery.observe(document.body,{childList:true,subtree:true});refresh();if(enhanced.size)discovery.disconnect();
document.addEventListener('click',()=>setTimeout(()=>{for(const sync of enhanced.values())sync();},0));
