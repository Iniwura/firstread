const $=(selector)=>document.querySelector(selector);
const before={
 clock:'20:21:18',status:'NOT YET AVAILABLE',
 value:'HELD<br>OUT.',sub:'SEC FINANCIAL FIGURES<br>EXCLUDED FROM THIS INFORMATION SET',count:'0 FINANCIAL FACTS',
 explanation:'One second before the 8-K is accepted, the SEC exhibit and its financial numbers must be held out.',
 href:'/desk.html?ticker=NVDA&asOf=2026-08-26T20%3A21%3A18.000Z'
};
const after={
 clock:'20:21:19',status:'SEC EXHIBIT AVAILABLE',
 value:'$96.2B',sub:'Q2 FY2027 REVENUE<br>GAAP DILUTED EPS / $2.46',count:'E3-NVDA / SOURCE QUALIFIED',
 explanation:'At 20:21:19 UTC, the SEC-filed earnings exhibit is included. This proves filing availability, not that earnings first became public at that instant.',
 href:'/desk.html?ticker=NVDA&asOf=2026-08-26T20%3A21%3A19.000Z'
};
function selectTime(mode){
 const record=mode==='after'?after:before;
 $('#story-time').textContent=record.clock;
 $('#paper-state').textContent=record.status;
 $('#paper-value').innerHTML=record.value;
 $('#paper-sub').innerHTML=record.sub;
 $('#paper-count').textContent=record.count;
 $('#story-explanation').textContent=record.explanation;
 $('#story-link').href=record.href;
 $('#story-paper').dataset.state=mode;
 for(const button of document.querySelectorAll('[data-time-state]')){
  const active=button.dataset.timeState===mode;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
 }
}
document.querySelectorAll('[data-time-state]').forEach(button=>
 button.addEventListener('click',()=>selectTime(button.dataset.timeState)));
const menuButton=$('#menu-button');
const menu=$('#mobile-nav');
function toggleMenu(open){
 menuButton.setAttribute('aria-expanded',String(open));
 menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');
 menu.classList.toggle('is-open',open);
 menu.inert=!open;
 document.body.classList.toggle('menu-open',open);
}
menuButton.addEventListener('click',()=>toggleMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>toggleMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape')toggleMenu(false)});
const heroPhoto=$('.hero-photo');
if(heroPhoto){
 const error=()=>$('.hero-art').classList.add('no-photo');
 heroPhoto.addEventListener('error',error);
 if(heroPhoto.complete&&heroPhoto.naturalWidth===0)error();
}
