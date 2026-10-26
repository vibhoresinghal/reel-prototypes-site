import {mountCampaign,leaveCampaign,resetCampaign} from './campaign.js';

import {icons} from './icons.js';
const content=document.querySelector('#content');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene=['uplift','campaign'].includes(new URLSearchParams(location.search).get('scene'))?new URLSearchParams(location.search).get('scene'):'decline';
let audience='All app users',period='Last 30 days';
const labels=['Day 1','Day 3','Day 7','Day 14','Day 21','Day 30'];
const cohorts={
 'All app users':{activation:[76,69,58,49,43,38],retention:[88,73,55,41,31,24],base:50,users:'24,680'},
 'New users':{activation:[72,64,54,46,39,34],retention:[85,69,51,37,28,21],base:45,users:'12,840'},
 'Returning users':{activation:[82,76,65,57,51,46],retention:[92,81,66,53,42,35],base:60,users:'11,840'}
};
function icon(name){return icons[name]||'';}
function mountIcons(){document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));}
function stat(label,value,note,trend='',glyph='activity'){return '<article class="stat"><div class="stat-label">'+label+icon(glyph)+'</div><strong>'+value+'</strong><small>'+ (trend?'<b class="'+(scene==='uplift'?'positive':'negative')+'">'+trend+'</b>':'')+note+'</small></article>';}
function chart(title,description,values,id,green=false){
 const color=green?'#20a77d':'#df6876',w=540,h=270,left=42,right=20,top=35,bottom=40;
 const low=green?Math.floor(values[0]/5)*5-5:0,high=green?low+15:100;
 const points=values.map((v,i)=>[left+i*(w-left-right)/5,top+(high-v)/(high-low)*(h-top-bottom)]);
 // Monotone linear segments use rounded joins, avoiding spline overshoot.
 const path=points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' ');
 const area=path+' L'+points[5][0]+','+(h-bottom)+' L'+left+','+(h-bottom)+' Z';
 const endpoint=points.at(-1);
 const upliftLabel=green?'<g class="uplift-end-label" aria-label="4 percent relative activation increase" transform="translate('+(endpoint[0]-93)+','+(endpoint[1]-40)+')"><text x="0" y="14" fill="#168c70" font-family="Inter" font-size="26" font-weight="700">+4%</text><path d="M 76 13 L 83 1 L 90 13 Z" fill="#168c70"/></g>':'';
 const ticks=green?[low,low+5,low+10,high]:[0,25,50,75,100];
 return '<article class="chart-card"><div class="chart-header"><div><h2>'+title+'</h2><p>'+description+'</p></div><span class="metric-chip">'+(green?'+4% uplift':'Lifetime trend')+'</span></div><div class="chart-summary"><strong>'+values.at(-1).toFixed(green?1:0)+'%</strong><span>'+ (green?'activation after rollout':'at day 30')+'</span></div><div class="graph"><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+title+': '+values.map((v,i)=>labels[i]+' '+v+'%').join(', ')+'"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+color+'" stop-opacity=".22"/><stop offset="1" stop-color="'+color+'" stop-opacity=".015"/></linearGradient></defs>'+ticks.map(v=>{const y=top+(high-v)/(high-low)*(h-top-bottom);return '<line class="grid-line" x1="'+left+'" y1="'+y+'" x2="'+(w-right)+'" y2="'+y+'"/><text class="axis-text" x="'+(left-9)+'" y="'+(y+4)+'" text-anchor="end">'+v+'%</text>';}).join('')+'<path class="trend-area" d="'+area+'" fill="url(#'+id+')"/><path class="trend-line" d="'+path+'" pathLength="1" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+points.map((p,i)=>'<g class="point" tabindex="0" role="button" aria-label="'+labels[i]+': '+values[i]+' percent" data-value="'+values[i]+'" data-day="'+labels[i]+'" style="animation-delay:'+(reduced?0:.25+i*.32)+'s"><circle cx="'+p[0]+'" cy="'+p[1]+'" r="13" fill="transparent" stroke="none"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="white" stroke="'+color+'" stroke-width="2"/><text x="'+p[0]+'" y="'+(p[1]-14)+'" text-anchor="middle" fill="'+color+'" font-family="Inter" font-size="11" font-weight="600">'+(green?'':values[i]+'%')+'</text></g><text class="axis-text" x="'+p[0]+'" y="'+(h-16)+'" text-anchor="middle">'+(green?(i===0?'Before rollout':i===5?'After rollout':''):labels[i])+'</text>').join('')+upliftLabel+'</svg><div class="tooltip" hidden></div></div><div class="chart-foot"><span class="legend"><i></i>'+audience+'</span><span>User lifetime on app →</span></div></article>';
}
function render(){
 leaveCampaign();
 document.querySelector('.filter-bar').hidden=scene==='campaign';
 document.querySelector('.filter-bar').style.display=scene==='campaign'?'none':'';
 if(scene==='campaign'){
 document.body.classList.remove('green');
 document.querySelectorAll('[data-scene]').forEach(b=>{b.classList.toggle('active',b.dataset.scene===scene);b.setAttribute('aria-pressed',String(b.dataset.scene===scene));});
 document.querySelector('#breadcrumb').textContent='Create campaign';
 document.querySelector('#title').textContent='Create a campaign';
 document.querySelector('#subtitle').textContent='Build a campaign that brings your customers a little closer.';
 mountCampaign(content);return;
 }
 const original=cohorts[audience],shift=period==='Last 60 days'?2:period==='Last 90 days'?-2:0;
 const c={...original,base:original.base+shift,activation:original.activation.map(v=>v+shift),retention:original.retention.map(v=>v+shift),users:(Number(original.users.replace(',',''))*(period==='Last 60 days'?2:period==='Last 90 days'?3:1)).toLocaleString('en-US')},green=scene==='uplift';
 const end=+(c.base*1.04).toFixed(1);
 document.body.classList.toggle('green',green);
 document.querySelectorAll('[data-scene]').forEach(b=>{b.classList.toggle('active',b.dataset.scene===scene);b.setAttribute('aria-pressed',String(b.dataset.scene===scene));});
 document.querySelector('#breadcrumb').textContent=green?'Activation uplift':'Lifecycle overview';
 document.querySelector('#title').textContent=green?'Activation uplift':'Every journey tells a story.';
 document.querySelector('#subtitle').textContent=green?'The impact of simpler onboarding.':'Understand how activation and retention evolve across the customer lifecycle.';
 content.innerHTML='<div class="stats">'+(green?
 stat('Activation rate',end.toFixed(1)+'%','relative to baseline','+4.0%','trending-up')+stat('Baseline activation',c.base.toFixed(1)+'%','Before onboarding improvements','','target')+stat('Absolute change','+'+(end-c.base).toFixed(1)+' pp','Percentage-point increase','','chart-no-axes-combined')+stat('Users in cohort',c.users,period+' · illustrative','','users'):
 stat('Day 30 activation',c.activation.at(-1)+'%','vs day 1','−'+(c.activation[0]-c.activation.at(-1))+' pp','activity')+stat('Day 30 retention',c.retention.at(-1)+'%','vs day 1','−'+(c.retention[0]-c.retention.at(-1))+' pp','repeat-2')+stat('Users in cohort',c.users,period+' · illustrative','','users')+stat('Observation window','30 days','From first app session','','calendar-days'))+'</div>'+
 (green?'<div class="uplift-layout">'+chart('Activation growth','Simplified onboarding',[c.base,+(c.base+.3).toFixed(1),+(c.base+.7).toFixed(1),+(c.base+1).toFixed(1),+(c.base+(end-c.base)*.75).toFixed(1),end],'uplift',true)+'<aside class="experiment"><div class="label">ROLLOUT SNAPSHOT</div><h3>Less friction.<br>More first moments.</h3><dl><dt>Initiative</dt><dd>Simplified onboarding</dd><dt>Success event</dt><dd>First value completed</dd><dt>Measurement</dt><dd>30-day activation rate</dd></dl><div class="result"><strong>+4%</strong><p>Relative activation uplift<br>'+c.base+'% → '+end+'%</p></div></aside></div>':
 '<div class="chart-grid">'+chart('Activation over user lifetime','Users who complete their first meaningful action.',c.activation,'activation')+chart('Retention over user lifetime','Users who return and stay engaged with the app.',c.retention,'retention')+'</div>')+
 '<section class="insight"><i>'+icon(green?'sparkles':'lightbulb')+'</i><div><strong>'+(green?'A better beginning makes a difference.':'The first month is the opportunity.')+'</strong><p>'+(green?'Activation rose from '+c.base+'% to '+end+'% — a 4% relative uplift. The same cohort, a smoother path to value.':'Both metrics decline as users spend more time on the app. Focus on early value and reasons to return.')+'</p></div><span class="tag">'+(green?'POSITIVE MOMENTUM':'LIFECYCLE INSIGHT')+'</span></section>';
 for(const p of content.querySelectorAll('.point')){
  const show=()=>{const graph=p.closest('.graph'),tip=graph.querySelector('.tooltip'),pr=p.getBoundingClientRect(),gr=graph.getBoundingClientRect();tip.textContent=p.dataset.day+' · '+p.dataset.value+'%';tip.style.left=Math.max(70,Math.min(gr.width-70,pr.x-gr.x+pr.width/2))+'px';tip.style.top=pr.y-gr.y-8+'px';tip.hidden=false;};
  const hide=()=>p.closest('.graph').querySelector('.tooltip').hidden=true;
  p.addEventListener('pointerenter',show);p.addEventListener('pointerleave',hide);p.addEventListener('focus',show);p.addEventListener('blur',hide);
 }
}
function selectScene(next){scene=next;const url=new URL(location.href);url.searchParams.set('scene',scene);history.replaceState(null,'',url);render();}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>selectScene(b.dataset.scene)));
document.querySelector('#apply').addEventListener('click',()=>{audience=document.querySelector('#audience').value;period=document.querySelector('#period').value;render();});
document.querySelector('#replay').addEventListener('click',()=>{if(scene==='campaign')resetCampaign();render();});
document.querySelector('#record').addEventListener('click',()=>document.body.classList.add('presentation'));
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Escape')document.body.classList.remove('presentation');if(e.key.toLowerCase()==='r'){if(scene==='campaign')resetCampaign();render();}if(e.key==='1')selectScene('decline');if(e.key==='2')selectScene('uplift');if(e.key==='3')selectScene('campaign');});
mountIcons();render();
