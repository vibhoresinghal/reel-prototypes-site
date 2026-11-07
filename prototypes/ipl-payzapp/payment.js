// Recording adapter for the existing Milestone amount and processing designs.
// All artwork is copied byte-for-byte from those screens; no payment is executed.
const asset=file=>'assets/payment/'+file;
const icon=(name,alt='')=>`<img src="${asset(name)}" alt="${alt}" draggable="false">`;
export const formatAmount=value=>new Intl.NumberFormat('en-IN',{minimumFractionDigits:Number(value)%1?2:0,maximumFractionDigits:2}).format(Number(value));
export const validAmount=value=>/^\d{1,6}(\.\d{0,2})?$/.test(value)&&Number(value)>0&&Number(value)<=100000;
export function amountKey(value,key){
  if(key==='delete')return value.slice(0,-1);
  if(key==='.'&&value.includes('.'))return value;
  const next=key==='.'?(value||'0')+'.':(value==='0'?'':value)+key;
  return /^\d{0,6}(\.\d{0,2})?$/.test(next)?next:value;
}
export function mountPayment(stage,{phase,amount='99',onAmount,onBack,onPay}){
  const screen=document.createElement('section');screen.className='ipl-payment '+phase;
  screen.setAttribute('aria-label',phase==='amount'?'Pay Nirmal Stephen':'Processing payment');
  stage.append(screen);
  let disposed=false,submitted=false,value=amount;
  if(phase==='amount'){
    screen.innerHTML=`<header class="pay-toolbar"><button data-action="back" aria-label="Back to scanner">${icon('back.svg')}</button><button data-action="help" aria-label="Payment help">${icon('help.svg')}</button></header>
      <div class="pay-recipient"><h2>Nirmal Stephen</h2><p>nirmalstep@okaxis</p><span>NS</span></div>
      <div class="pay-history"><div class="pay-history-card"><strong>₹2,000</strong>${icon('chevron.svg')}<p>${icon('received.svg')}Received</p><small>Oct 11, 8:17 PM</small></div><div class="pay-history-card sent"><strong>₹200</strong>${icon('chevron.svg')}<p>${icon('sent.svg')}Sent</p><small>Oct 12, 6:45 PM</small></div></div>
      <div class="pay-composer"><div class="pay-bank"><div class="pay-bank-icon">${icon('bank.png','HDFC Bank')}${icon('upi.png','UPI')}</div><div><b>HDFC Bank - XX 9002</b><button data-action="balance">Check Balance${icon('balance.svg')}</button></div><button class="pay-account" data-action="account" aria-label="Selected account">${icon('account.svg')}</button></div>
      <form class="pay-row"><label><span>₹</span><input aria-label="Payment amount" inputmode="none" autocomplete="off" maxlength="9"></label><button class="pay-submit" type="submit">Pay</button></form><p class="pay-error" role="status" hidden></p></div>
      <div class="pay-keypad" role="group" aria-label="Amount keyboard">${['1','2','3','-','4','5','6',',','7','8','9','delete','.','0','English','done'].map(key=>`<button data-key="${key}" aria-label="${key==='delete'?'Delete last digit':key==='done'?'Confirm amount':key}" ${['-',',','English'].includes(key)?'disabled':''}>${key==='delete'?icon('delete.svg'):key==='done'?icon('confirm.svg'):key}</button>`).join('')}</div>`;
    const input=screen.querySelector('input'),error=screen.querySelector('.pay-error');
    input.value=value;
    const notify=text=>{error.textContent=text;error.hidden=!text;};
    const update=next=>{value=next;input.value=value;onAmount(value);notify('');};
    const submit=()=>{
      if(submitted||disposed)return;
      if(!validAmount(value)){notify('Enter an amount between ₹1 and ₹1,00,000');return;}
      submitted=true;input.blur();onPay(value);
    };
    screen.querySelector('form').onsubmit=e=>{e.preventDefault();submit();};
    input.oninput=()=>/^\d{0,6}(\.\d{0,2})?$/.test(input.value)?update(input.value):input.value=value;
    screen.onclick=e=>{
      const button=e.target.closest('button');if(!button)return;
      const key=button.dataset.key,action=button.dataset.action;
      if(key==='done')submit();else if(key)update(amountKey(value,key));
      else if(action==='back')onBack();
      else if(action==='balance')notify('Demo balance: ₹12,500');
      else if(action==='account')notify('HDFC Bank ending 9002 is selected.');
      else if(action==='help')notify('Enter an amount and tap Pay to preview the IPL payment.');
    };
    screen.onkeydown=e=>{
      if(e.target===input||e.ctrlKey||e.metaKey||e.altKey)return;
      if(/^[\d.]$/.test(e.key)){e.preventDefault();update(amountKey(value,e.key));}
      else if(e.key==='Backspace'){e.preventDefault();update(amountKey(value,'delete'));}
    };
    screen.tabIndex=-1;screen.focus({preventScroll:true});
  }else{
    screen.innerHTML=`<img class="pay-processing-glow" src="${asset('processing-glow.svg')}" alt=""><div class="pay-processing-art"><picture><source media="(prefers-reduced-motion: reduce)" srcset="${asset('processing.png')}"><img src="${asset('processing.gif')}" alt=""></picture></div><div class="pay-processing-copy" role="status"><h1>₹${formatAmount(amount)}</h1><p>Processing, please wait...</p></div><div class="pay-powered"><small>POWERED BY</small>${icon('upi.png','UPI')}</div>`;
  }
  const resize=()=>{const scale=stage.clientWidth/360;screen.style.transform=`scale(${scale})`;screen.style.height=stage.clientHeight/scale+'px';screen.classList.toggle('compact',stage.clientHeight/scale<720);};
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  return()=>{disposed=true;observer.disconnect();screen.remove();};
}
