const reference=new URLSearchParams(location.search).has('reference');
function size(){document.documentElement.style.setProperty('--scale',reference?1:Math.min(innerWidth,480)/360)}size();addEventListener('resize',size);
const dialog=document.querySelector('dialog');let opener;
function close(){dialog.close();opener?.focus({preventScroll:true})}
document.querySelector('.close-sheet').onclick=close;document.querySelector('.sheet-done').onclick=close;
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientY<r.top)close()}});
function show(label,el){opener=el;document.querySelector('#sheet-title').textContent=label;dialog.showModal()}
const actions={'294:13867':'Learn more','473:16804':'Profile','473:16811':'Notifications','473:16914':'Scan any QR','473:16918':'Pay Anyone','473:16921':'Bank Transfer','473:16928':'Check Balance','473:16933':'Bills & Recharges','473:16937':'Offers & Cashpoints','473:16941':'PayZapp Wallet','473:16945':'Passbook & Insights','473:16958':'Pixel Home','473:16818':'Zoomcar offer','473:16855':'Offers & rewards','473:16859':'BESCOM','473:16863':'Jaya','473:16866':'Rahul','473:16869':'Airtel','473:16875':'All bills & recharges','473:16878':'Electricity','473:16882':'Credit Card Payment','473:16888':'Mobile Postpaid','473:16892':'Mobile Recharge','473:16897':'FASTag','473:16901':'DTH','473:16905':'Gas Cylinder','473:16909':'All categories','473:17194':'SmartBuy','473:17008':'Credit cards','473:17179':'Invite friends','473:17244':'Scan any QR','473:17271':'Cards','473:17279':'Shop','473:17288':'Bank'};
for(const [id,label] of Object.entries(actions)){const el=document.querySelector(`[data-node-id="${id}"]`);if(!el)throw Error('Missing interaction '+id);el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',label);el.setAttribute('aria-haspopup','dialog');el.addEventListener('click',()=>show(label,el));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(label,el)}})}
const pay=document.querySelector('[data-node-id="473:17263"]');pay.setAttribute('role','button');pay.setAttribute('tabindex','0');pay.setAttribute('aria-label','Pay, return to top');pay.onclick=()=>scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});pay.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pay.click()}};
document.querySelector('[data-node-id="473:16949"]').setAttribute('aria-label','UPI ID: 8281908756@pz');

// Return through the parent library so its fullscreen session stays alive.
if(window.parent!==window&&new URLSearchParams(location.search).get('hosted')==='1'){
 const home=document.createElement('a');home.href='./';home.className='library-return';home.textContent='← Flows';home.setAttribute('aria-label','Back to prototype library');document.body.append(home);
}
