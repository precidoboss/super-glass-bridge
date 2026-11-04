/* ===================== THE PRESIDENT'S MACBOOK =====================
   Walk up to the laptop in the President's office and press the prompt: the screen zooms in and fills the
   view. It is a working desktop with a menu bar, a dock and these apps:
   - Documents: read a document, draw your signature on the pad, and submit it. Signing ticks off the office
     screen too.
   - Mail: read the inbox and approve or decline each request; your approval rating moves with each choice.
   - Calendar: today's appointments; mark each one done or cancel it.
   - Treasury: a simulated $SUPER market (not real money): buy, sell and announce a buyback.
   - Dispatch: send one of the two cop cars on standby, call the bodyguard, or lock the office.
   - Security: CCTV tiles for the town's buildings with live-looking headcounts.
   - Press: write a statement from a template or your own words and send it.
   - Notes: a private notepad.
   Escape closes the laptop. Everything here is for play; no real money or accounts are involved. */

export function createLaptop({toast=()=>{},onEffect=()=>{}}={}){
  const css=`
  #pl{position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(3,6,8,.9);font-family:-apple-system,system-ui,Segoe UI,sans-serif;color:#e9eef5}
  #pl.on{display:flex}
  #pl .bez{width:min(94vw,1120px);aspect-ratio:16/10;background:linear-gradient(#2a2d33,#17181c);border-radius:26px;padding:3.2%;box-shadow:0 30px 90px rgba(0,0,0,.7);transform:scale(.25) translateY(20%);opacity:0;transition:transform .75s cubic-bezier(.2,.8,.2,1),opacity .4s}
  #pl.on .bez{transform:none;opacity:1}
  #pl .scr{position:relative;width:100%;height:100%;background:#0d1119;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
  #pl .bar{height:30px;background:rgba(255,255,255,.06);display:flex;align-items:center;gap:14px;padding:0 14px;font-size:13px;flex:none}
  #pl .bar b{color:#fff}#pl .bar .sp{flex:1}#pl .bar .ap{color:#c8ff43;font-weight:700}
  #pl .main{flex:1;display:flex;min-height:0}
  #pl .side{width:170px;background:rgba(255,255,255,.04);padding:12px 8px;display:flex;flex-direction:column;gap:4px;flex:none}
  #pl .side button{text-align:left;background:none;border:0;color:#cfd8e6;padding:9px 10px;border-radius:8px;font-size:14px;cursor:pointer}
  #pl .side button:hover{background:rgba(255,255,255,.07)}#pl .side button.on{background:#1d4ed8;color:#fff}
  #pl .view{flex:1;padding:18px 20px;overflow:auto;min-width:0}
  #pl h2{margin:0 0 12px;font-size:20px;color:#fff}
  #pl .card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin-bottom:10px}
  #pl .card.ok{opacity:.55}
  #pl .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}
  #pl button.b{background:#c8ff43;color:#0b1a0e;border:0;border-radius:8px;padding:7px 12px;font-weight:700;font-size:13px;cursor:pointer}
  #pl button.b:disabled{opacity:.35;cursor:default}
  #pl button.g{background:rgba(255,255,255,.1);color:#e9eef5;border:0;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer}
  #pl button.r{background:#ff5f57;color:#fff;border:0;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer}
  #pl .muted{color:#8fa0b5;font-size:12px}
  #pl canvas.pad{background:#fff;border-radius:8px;width:100%;max-width:520px;height:140px;touch-action:none;display:block;margin-top:8px}
  #pl textarea{width:100%;min-height:120px;background:#0a0e14;color:#e9eef5;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:10px;font-size:14px;box-sizing:border-box}
  #pl .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #pl .tile{background:#05080c;border:1px solid rgba(200,255,67,.25);border-radius:10px;padding:10px;min-height:86px;cursor:pointer}
  #pl .tile b{color:#c8ff43;font-size:13px}#pl .tile div{font-size:12px;color:#9fb1c7;margin-top:4px}
  #pl .meter{height:8px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;margin-top:6px;width:200px}
  #pl .meter i{display:block;height:100%;background:#c8ff43}
  #pl .dock{flex:none;height:46px;display:flex;justify-content:center;gap:10px;align-items:center;background:rgba(255,255,255,.05)}
  #pl .dock button{background:rgba(255,255,255,.08);border:0;color:#fff;border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer}
  #pl .dock button.on{background:#1d4ed8}
  #pl .close{position:absolute;top:8px;right:12px;background:rgba(255,255,255,.1);border:0;color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;z-index:2}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const root=document.createElement('div');root.id='pl';
  root.innerHTML=`<div class="bez"><div class="scr"><button class="close" data-act="close">Close  ✕</button>
    <div class="bar"><b>Super OS</b><span class="ap" id="plTitle">Documents</span><span class="sp"></span><span id="plAppr">Approval 60%</span><span id="plClock"></span></div>
    <div class="main"><div class="side" id="plSide"></div><div class="view" id="plView"></div></div>
    <div class="dock" id="plDock"></div></div></div>`;
  document.body.appendChild(root);

  /* ---------- state ---------- */
  const S={app:'docs',approval:60,balance:1000,price:[],notes:'',pr:0,ink:0,signing:null,cctv:null,
    docs:[
      {id:'park',title:'Park fund memo',body:'Release 300 CR from the treasury to the Super Town park fund and the playground at the school.',done:false},
      {id:'school',title:'School budget',body:'Approve the Super School budget for the new library shelves, class desks and the playground repairs.',done:false},
      {id:'treasury',title:'Treasury report',body:'Confirm the quarterly $SUPER treasury report before it goes to the town council.',done:false},
      {id:'patrol',title:'Police patrol order',body:'Authorise two extra patrol cars on the east side for the nightclub district, from tonight.',done:false}],
    mail:[
      {id:'m1',from:'Desk Officer Rosa',subject:'Bodyguard fees',body:'Can we raise the bodyguard fee from 5 to 7 CR per trip? Demand is up.',res:null,good:['Approve'],bad:['Decline']},
      {id:'m2',from:'Principal Ada',subject:'Field trip',body:'The school wants to take 40 students to the Super Mall next Friday. Please approve.',res:null,good:['Approve'],bad:['Decline']},
      {id:'m3',from:'Chef Zara',subject:'Diner menu',body:'Add the Super Burger and shake to the special for the week? It sells out every night.',res:null,good:['Approve'],bad:['Decline']},
      {id:'m4',from:'DJ Vex',subject:'Club licence',body:'Can the club stay open until 4 a.m. on weekends? The crowd is massive.',res:null,good:['Approve'],bad:['Decline']}],
    cal:[{t:'09:00',title:'Cabinet briefing',done:false},{t:'11:30',title:'Meet the Police Chief',done:false},{t:'14:00',title:'Visit Super School',done:false},{t:'19:00',title:'Opening night at Super Club',done:false}]};
  for(let i=0;i<60;i++)S.price.push(100+Math.sin(i/5)*6+(i?0:0));
  const APPS=[['docs','Documents'],['mail','Mail'],['cal','Calendar'],['treasury','Treasury'],['dispatch','Dispatch'],['cctv','Security'],['press','Press'],['notes','Notes']];
  const CCTV=[['Office of the President','Quiet · 4 staff'],['Super Diner','Busy · 12 guests'],['Super Mall','Shoppers · 9'],['Police Station','Calm · 3 officers'],['Super School','Lessons · 14 kids'],['Super Club','Packed · 30 dancing']];

  function clamp(v){return Math.max(0,Math.min(100,v))}
  function setApproval(d){S.approval=clamp(S.approval+d);root.querySelector('#plAppr').textContent='Approval '+S.approval+'%'}
  function clock(){const n=new Date();root.querySelector('#plClock').textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')}
  setInterval(()=>{if(root.classList.contains('on'))clock()},1000);

  /* ---------- rendering ---------- */
  const side=root.querySelector('#plSide'),view=root.querySelector('#plView'),dock=root.querySelector('#plDock');
  function renderChrome(){
    side.innerHTML=APPS.map(([id,l])=>`<button data-act="app" data-id="${id}" class="${S.app===id?'on':''}">${l}</button>`).join('');
    dock.innerHTML=APPS.map(([id,l])=>`<button data-act="app" data-id="${id}" class="${S.app===id?'on':''}">${l}</button>`).join('');
    root.querySelector('#plTitle').textContent=APPS.find(a=>a[0]===S.app)[1];
  }
  function render(){
    renderChrome();
    const v=({docs:renderDocs,mail:renderMail,cal:renderCal,treasury:renderTreasury,dispatch:renderDispatch,cctv:renderCctv,press:renderPress,notes:renderNotes})[S.app];
    v();
  }
  function renderDocs(){
    if(S.signing){const d=S.docs.find(x=>x.id===S.signing);
      view.innerHTML=`<h2>${d.title}</h2><div class="card">${d.body}</div><div class="muted">Sign below, then submit.</div>
        <canvas class="pad" id="plPad" width="520" height="140"></canvas>
        <div class="row"><button class="b" data-act="submit" ${S.ink>40?'':'disabled'}>Submit signature</button><button class="g" data-act="clearpad">Clear</button><button class="g" data-act="back">Back</button></div>`;
      const c=root.querySelector('#plPad'),g=c.getContext('2d');g.lineWidth=3;g.lineCap='round';g.strokeStyle='#0b1a33';let drawing=false,lx=0,ly=0;
      const pos=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]};
      c.onpointerdown=e=>{drawing=true;[lx,ly]=pos(e);c.setPointerCapture(e.pointerId)};
      c.onpointermove=e=>{if(!drawing)return;const[x,y]=pos(e);g.beginPath();g.moveTo(lx,ly);g.lineTo(x,y);g.stroke();[lx,ly]=[x,y];S.ink++;if(S.ink>40){const b=root.querySelector('[data-act=submit]');if(b)b.disabled=false}};
      c.onpointerup=c.onpointercancel=()=>drawing=false;
      return;}
    const left=S.docs.filter(d=>!d.done).length;
    view.innerHTML=`<h2>Documents</h2><div class="muted">${left} waiting for your signature</div>`+S.docs.map(d=>`<div class="card ${d.done?'ok':''}"><b>${d.title}</b> ${d.done?'· SIGNED':''}<div class="muted">${d.body}</div><div class="row">${d.done?'':`<button class="b" data-act="openDoc" data-id="${d.id}">Read and sign</button>`}</div></div>`).join('');
  }
  function renderMail(){
    view.innerHTML=`<h2>Inbox</h2>`+S.mail.map(m=>`<div class="card ${m.res?'ok':''}"><b>${m.from}</b> · ${m.subject}<div class="muted">${m.body}</div>
      <div class="row">${m.res?`<span class="muted">Answered: ${m.res}</span>`:`<button class="b" data-act="mail" data-id="${m.id}" data-r="good">${m.good[0]}</button><button class="r" data-act="mail" data-id="${m.id}" data-r="bad">${m.bad[0]}</button>`}</div></div>`).join('');
  }
  function renderCal(){
    view.innerHTML=`<h2>Today</h2>`+S.cal.map((c,i)=>`<div class="card ${c.done?'ok':''}"><b>${c.t}</b> ${c.title}${c.done?' · done':''}<div class="row">${c.done?'':`<button class="b" data-act="cal" data-i="${i}">Mark done</button>`}</div></div>`).join('');
  }
  function renderTreasury(){
    view.innerHTML=`<h2>$SUPER market</h2><div class="muted">SIMULATED · not real money</div>
      <canvas id="plChart" width="640" height="200" style="width:100%;max-width:640px;background:#05080c;border-radius:10px;margin-top:8px"></canvas>
      <div class="card">Balance: <b>${S.balance} SUPER</b></div>
      <div class="row"><button class="b" data-act="buy">Buy 100</button><button class="g" data-act="sell">Sell 100</button><button class="g" data-act="buyback">Announce buyback</button></div>`;
    const c=root.querySelector('#plChart'),g=c.getContext('2d');g.fillStyle='#05080c';g.fillRect(0,0,640,200);g.strokeStyle='#c8ff43';g.lineWidth=3;g.beginPath();
    S.price.forEach((p,i)=>{const x=i*(640/(S.price.length-1)),y=200-(p-80)*3;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke();
  }
  function renderDispatch(){
    view.innerHTML=`<h2>Dispatch</h2>
      <div class="card"><b>Cop car 1</b> · on standby at the office<div class="row"><button class="b" data-act="cop" data-i="1">Send to me</button></div></div>
      <div class="card"><b>Cop car 2</b> · on standby at the office<div class="row"><button class="b" data-act="cop" data-i="2">Send to me</button></div></div>
      <div class="card"><b>Bodyguard</b><div class="row"><button class="g" data-act="bodyguard">Call or dismiss</button></div></div>
      <div class="card"><b>Office lockdown</b><div class="row"><button class="r" data-act="lockdown">Lock the office</button></div></div>`;
  }
  function renderCctv(){
    view.innerHTML=`<h2>Security</h2><div class="muted">Live-style camera tiles · simulated</div><div class="grid">`+CCTV.map((c,i)=>`<div class="tile" data-act="cam" data-i="${i}"><b>${c[0]}</b><div>${c[1]}</div></div>`).join('')+`</div><div class="muted" id="plCam" style="margin-top:10px">Click a tile to focus.</div>`;
  }
  function renderPress(){
    view.innerHTML=`<h2>Press office</h2><div class="muted">Pick a template or write your own. Sending gives a small approval boost.</div>
      <div class="row"><button class="g" data-act="tpl" data-t="0">Statement on the park</button><button class="g" data-act="tpl" data-t="1">Welcome to Super Town</button><button class="g" data-act="tpl" data-t="2">Apology</button></div>
      <textarea id="plPress" placeholder="Write your statement…"></textarea>
      <div class="row"><button class="b" data-act="sendpress">Send to the press</button><span class="muted">Sent: ${S.pr}</span></div>`;
  }
  function renderNotes(){
    view.innerHTML=`<h2>Notes</h2><textarea id="plNotes" placeholder="Private notes…">${S.notes}</textarea><div class="muted">Saved as you type.</div>`;
  }

  /* ---------- actions ---------- */
  const TPL=['The park fund is growing and Super Town thanks every donor. The playground opens soon.','Welcome to Super Town. Take a walk, visit the diner, and meet the community.','The President apologises for the delays on the east road. Works finish this week.'];
  function act(a,el){
    const id=el&&el.dataset.id;
    if(a==='close'){close();return}
    if(a==='app'){S.app=id;S.signing=null;render();return}
    if(a==='openDoc'){S.signing=id;S.ink=0;render();return}
    if(a==='back'){S.signing=null;render();return}
    if(a==='clearpad'){S.ink=0;render();S.signing=id||S.signing;render();return}
    if(a==='submit'){const d=S.docs.find(x=>x.id===S.signing);if(!d||S.ink<=40)return;d.done=true;S.signing=null;setApproval(3);onEffect('sign',d.title);toast('SIGNED · '+d.title);render();return}
    if(a==='mail'){const m=S.mail.find(x=>x.id===id);if(!m||m.res)return;const r=el.dataset.r;m.res=r==='good'?m.good[0]:m.bad[0];setApproval(r==='good'?4:-4);toast(m.res+' · '+m.from);render();return}
    if(a==='cal'){const c=S.cal[+el.dataset.i];if(c){c.done=true;setApproval(1);render()}return}
    if(a==='buy'){if(S.balance>=100){S.balance-=100;S.price.push(S.price[S.price.length-1]+2);S.price.shift();setApproval(0);toast('Bought 100 SUPER (simulated)')}else toast('Not enough SUPER (simulated)');render();return}
    if(a==='sell'){if(S.balance>=0){S.balance+=100;S.price.push(S.price[S.price.length-1]-2);S.price.shift();toast('Sold 100 SUPER (simulated)')}render();return}
    if(a==='buyback'){setApproval(2);toast('Buyback announced · approval up');return}
    if(a==='cop'){onEffect('cop',+el.dataset.i);toast('Cop car '+el.dataset.i+' dispatched · lights on');return}
    if(a==='bodyguard'){onEffect('bodyguard');toast('Bodyguard call toggled');return}
    if(a==='lockdown'){onEffect('lockdown');toast('Office locked down · staff notified');return}
    if(a==='cam'){const c=CCTV[+el.dataset.i];const e=root.querySelector('#plCam');if(e)e.textContent=c[0]+': '+c[1]+' · all quiet on this feed';return}
    if(a==='tpl'){const ta=root.querySelector('#plPress');if(ta)ta.value=TPL[+el.dataset.t];return}
    if(a==='sendpress'){const ta=root.querySelector('#plPress');if(!ta||!ta.value.trim()){toast('Write something first');return}S.pr++;setApproval(2);onEffect('press',ta.value.trim());toast('Statement sent to the press');ta.value='';render();return}
  }
  root.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el)act(el.dataset.act,el)});
  root.addEventListener('input',e=>{if(e.target.id==='plNotes')S.notes=e.target.value});
  root.addEventListener('mousedown',e=>{if(e.target===root)close()});

  /* ---------- open and close ---------- */
  let isOn=false;
  function open(){isOn=true;root.classList.add('on');clock();S.app=S.app||'docs';render();window.__laptopOpen=true}
  function close(){isOn=false;root.classList.remove('on');window.__laptopOpen=false}
  // Escape closes the laptop; while it is open, the game's keys are ignored
  addEventListener('keydown',e=>{if(!isOn)return;if(e.key==='Escape'){e.preventDefault();close()}else if(e.key!=='Tab'){/* typing in notes or press */}},true);
  return{open,close,isOpen:()=>isOn,approval:()=>S.approval};
}
