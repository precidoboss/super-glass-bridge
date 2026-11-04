/* ===================== THE PRESIDENT'S MACBOOK =====================
   Walk up to the laptop in the President's office and press the prompt: the screen zooms in and fills the
   view. It is a working desktop with a menu bar, a dock and twelve apps:
   Documents (draw a signature to sign), Mail (approve or decline requests), Calendar (add, finish and remove
   events), Budget (split the town budget with sliders), Cabinet (vote on proposals), Treasury (a simulated
   $SUPER market), Dispatch (cop cars, a bodyguard, patrols, lockdown), Hangar (get the Super One jet ready),
   Security (CCTV tiles with lockdown), Press (statements and a press conference), Speeches (read a speech
   aloud), and Notes. Approval moves with your choices. Escape closes the laptop. The game's own keys are
   ignored while it is open. Everything is for play: no real money or accounts are involved. */

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
  #pl .side{width:170px;background:rgba(255,255,255,.04);padding:12px 8px;display:flex;flex-direction:column;gap:3px;flex:none;overflow:auto}
  #pl .side button{text-align:left;background:none;border:0;color:#cfd8e6;padding:8px 10px;border-radius:8px;font-size:13px;cursor:pointer}
  #pl .side button:hover{background:rgba(255,255,255,.07)}#pl .side button.on{background:#1d4ed8;color:#fff}
  #pl .view{flex:1;padding:16px 18px;overflow:auto;min-width:0}
  #pl h2{margin:0 0 10px;font-size:20px;color:#fff}
  #pl .card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;margin-bottom:10px}
  #pl .card.ok{opacity:.55}
  #pl .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}
  #pl button.b{background:#c8ff43;color:#0b1a0e;border:0;border-radius:8px;padding:7px 12px;font-weight:700;font-size:13px;cursor:pointer}
  #pl button.b:disabled{opacity:.35;cursor:default}
  #pl button.g{background:rgba(255,255,255,.1);color:#e9eef5;border:0;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer}
  #pl button.r{background:#ff5f57;color:#fff;border:0;border-radius:8px;padding:7px 12px;font-size:13px;cursor:pointer}
  #pl .muted{color:#8fa0b5;font-size:12px}
  #pl canvas.pad{background:#fff;border-radius:8px;width:100%;max-width:520px;height:140px;touch-action:none;display:block;margin-top:8px}
  #pl textarea,#pl input[type=text],#pl select{width:100%;background:#0a0e14;color:#e9eef5;border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:8px 10px;font-size:14px;box-sizing:border-box}
  #pl textarea{min-height:110px}
  #pl .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #pl .tile{background:#05080c;border:1px solid rgba(200,255,67,.25);border-radius:10px;padding:10px;min-height:86px;cursor:pointer}
  #pl .tile.lk{border-color:#ff5f57}
  #pl .tile b{color:#c8ff43;font-size:13px}#pl .tile div{font-size:12px;color:#9fb1c7;margin-top:4px}
  #pl .meter{height:8px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;margin-top:6px;width:200px}
  #pl .meter i{display:block;height:100%;background:#c8ff43}
  #pl .dock{flex:none;height:46px;display:flex;justify-content:center;gap:8px;align-items:center;background:rgba(255,255,255,.05);overflow:auto}
  #pl .dock button{background:rgba(255,255,255,.08);border:0;color:#fff;border-radius:10px;padding:6px 9px;font-size:11px;cursor:pointer;white-space:nowrap}
  #pl .dock button.on{background:#1d4ed8}
  #pl .close{position:absolute;top:8px;right:12px;background:rgba(255,255,255,.1);border:0;color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px;z-index:2}
  #pl .pick{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const root=document.createElement('div');root.id='pl';
  root.innerHTML=`<div class="bez"><div class="scr"><button class="close" data-act="close">Close  ✕</button>
    <div class="bar"><b>Super OS</b><span class="ap" id="plTitle">Documents</span><span class="sp"></span><span id="plAppr">Approval 60%</span><span id="plClock"></span></div>
    <div class="main"><div class="side" id="plSide"></div><div class="view" id="plView"></div></div>
    <div class="dock" id="plDock"></div></div></div>`;
  document.body.appendChild(root);

  /* ---------- state ---------- */
  const S={app:'docs',approval:60,balance:1000,price:[],notes:'',speeches:'',pr:0,ink:0,signing:null,
    budget:{park:30,school:30,police:20,club:20},
    jet:'ready',jetT:0,
    cctvLock:[false,false,false,false,false,false],cctvSel:null,
    patrol:'standing by',copTimer:null,
    docs:[
      {id:'park',title:'Park fund memo',body:'Release 300 CR from the treasury to the Super Town park fund and the school playground.',done:false},
      {id:'school',title:'School budget',body:'Approve the Super School budget for library shelves, class desks and playground repairs.',done:false},
      {id:'treasury',title:'Treasury report',body:'Confirm the quarterly $SUPER treasury report before it goes to the town council.',done:false},
      {id:'patrol',title:'Police patrol order',body:'Authorise two extra patrol cars on the east side for the nightclub district, from tonight.',done:false},
      {id:'hangar',title:'Airport hangar permit',body:'Sign the permit for the new airport hangar and the Super One jet to use the south runway.',done:false},
      {id:'club',title:'Club licence renewal',body:'Renew the Super Club licence for another year, with the 4 a.m. weekend hours.',done:false}],
    mail:[
      {id:'m1',from:'Desk Officer Rosa',subject:'Bodyguard fees',body:'Can we raise the bodyguard fee from 5 to 7 CR per trip? Demand is up.'},
      {id:'m2',from:'Principal Ada',subject:'Field trip',body:'The school wants to take 40 students to the Super Mall next Friday. Please approve.'},
      {id:'m3',from:'Chef Zara',subject:'Diner menu',body:'Add the Super Burger and shake to the weekly special? It sells out every night.'},
      {id:'m4',from:'DJ Vex',subject:'Club licence',body:'Can the club stay open until 4 a.m. on weekends? The crowd is massive.'},
      {id:'m5',from:'Mall Manager Luna',subject:'Late opening',body:'Can the Super Mall open on public holidays? Shops want the footfall.'}].map(m=>({...m,res:null})),
    cal:[{t:'09:00',title:'Cabinet briefing',done:false},{t:'11:30',title:'Meet the Police Chief',done:false},{t:'14:00',title:'Visit Super School',done:false},{t:'19:00',title:'Opening night at Super Club',done:false}],
    cabinet:[
      {id:'c1',title:'Free bus rides on the east road',votes:null},
      {id:'c2',title:'Extend the diner to 2 a.m.',votes:null},
      {id:'c3',title:'Fund a town fountain at the plaza',votes:null}]};
  for(let i=0;i<60;i++)S.price.push(100+Math.sin(i/5)*6);
  const APPS=[['docs','Documents'],['mail','Mail'],['cal','Calendar'],['budget','Budget'],['cabinet','Cabinet'],['treasury','Treasury'],['dispatch','Dispatch'],['hangar','Hangar'],['cctv','Security'],['press','Press'],['speech','Speeches'],['notes','Notes']];
  const PLACES=['Super Diner','Super Mall','Super Club','Super School','Police Station','Airport Hangar'];
  const CCTV=[['Office of the President','Quiet · 4 staff'],['Super Diner','Busy · 12 guests'],['Super Mall','Shoppers · 9'],['Police Station','Calm · 3 officers'],['Super School','Lessons · 14 kids'],['Super Club','Packed · 30 dancing']];
  const TPL=['The park fund is growing and Super Town thanks every donor. The playground opens soon.','Welcome to Super Town. Take a walk, visit the diner, and meet the community.','The President apologises for the delays on the east road. Works finish this week.'];

  function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,v))}
  function setApproval(d){S.approval=clamp(S.approval+d);root.querySelector('#plAppr').textContent='Approval '+S.approval+'%'}
  function clock(){const n=new Date();root.querySelector('#plClock').textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* ---------- the live treasury: the price moves while the laptop is open ---------- */
  let marketT=null;
  function tickMarket(){const last=S.price[S.price.length-1];S.price.push(clamp(last+(Math.random()-.5)*4,70,140));S.price.shift();if(S.app==='treasury')render()}

  const side=root.querySelector('#plSide'),view=root.querySelector('#plView'),dock=root.querySelector('#plDock');
  function renderChrome(){
    const b=APPS.map(([id,l])=>`<button data-act="app" data-id="${id}" class="${S.app===id?'on':''}">${l}</button>`).join('');
    side.innerHTML=b;dock.innerHTML=b;
    root.querySelector('#plTitle').textContent=APPS.find(a=>a[0]===S.app)[1];
  }
  const RENDER={
    docs(){
      if(S.signing){const d=S.docs.find(x=>x.id===S.signing);
        view.innerHTML=`<h2>${esc(d.title)}</h2><div class="card">${esc(d.body)}</div><div class="muted">Sign below, then submit.</div>
          <canvas class="pad" id="plPad" width="520" height="140"></canvas>
          <div class="row"><button class="b" data-act="submit" ${S.ink>40?'':'disabled'}>Submit signature</button><button class="g" data-act="clearpad">Clear</button><button class="g" data-act="back">Back</button></div>`;
        const c=root.querySelector('#plPad'),g=c.getContext('2d');g.lineWidth=3;g.lineCap='round';g.strokeStyle='#0b1a33';let drawing=false,lx=0,ly=0;
        const pos=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/(r.width||c.width),(e.clientY-r.top)*c.height/(r.height||c.height)]};
        c.addEventListener('pointerdown',e=>{drawing=true;[lx,ly]=pos(e)});
        c.addEventListener('pointermove',e=>{if(!drawing)return;const[x,y]=pos(e);g.beginPath();g.moveTo(lx,ly);g.lineTo(x,y);g.stroke();[lx,ly]=[x,y];S.ink++;if(S.ink>40){const b=root.querySelector('[data-act=submit]');if(b)b.disabled=false}});
        const stop=()=>drawing=false;c.addEventListener('pointerup',stop);c.addEventListener('pointercancel',stop);c.addEventListener('pointerleave',stop);
        return;}
      const left=S.docs.filter(d=>!d.done).length;
      view.innerHTML=`<h2>Documents</h2><div class="muted">${left} waiting for your signature</div>`+S.docs.map(d=>`<div class="card ${d.done?'ok':''}"><b>${esc(d.title)}</b>${d.done?' · SIGNED':''}<div class="muted">${esc(d.body)}</div><div class="row">${d.done?'':`<button class="b" data-act="openDoc" data-id="${d.id}">Read and sign</button>`}</div></div>`).join('');
    },
    mail(){
      view.innerHTML=`<h2>Inbox</h2>`+S.mail.map(m=>`<div class="card ${m.res?'ok':''}"><b>${esc(m.from)}</b> · ${esc(m.subject)}<div class="muted">${esc(m.body)}</div>
        <div class="row">${m.res?`<span class="muted">Answered: ${m.res}</span>`:`<button class="b" data-act="mail" data-id="${m.id}" data-r="good">Approve</button><button class="r" data-act="mail" data-id="${m.id}" data-r="bad">Decline</button>`}</div></div>`).join('');
    },
    cal(){
      view.innerHTML=`<h2>Calendar</h2>`+S.cal.map((c,i)=>`<div class="card ${c.done?'ok':''}"><b>${c.t}</b> ${esc(c.title)}${c.done?' · done':''}
        <div class="row">${c.done?'':`<button class="b" data-act="calDone" data-i="${i}">Mark done</button>`}<button class="g" data-act="calDel" data-i="${i}">Remove</button></div></div>`).join('')+
        `<div class="card"><b>Add an event</b><input type="text" id="plEvT" placeholder="Time, e.g. 16:00" style="margin-top:6px"><input type="text" id="plEvN" placeholder="What is it?" style="margin-top:6px"><div class="row"><button class="b" data-act="calAdd">Add</button></div></div>`;
    },
    budget(){
      const b=S.budget,total=b.park+b.school+b.police+b.club;
      view.innerHTML=`<h2>Town budget</h2><div class="muted">Share the budget between the town's needs. A balanced split (about 100%) lifts approval.</div>`+
        ['park','school','police','club'].map(k=>`<div class="card"><b>${({park:'Park fund',school:'Super School',police:'Police',club:'Nightlife'})[k]}</b> · ${b[k]}%<input type="range" min="0" max="60" value="${b[k]}" data-input="budget" data-k="${k}" style="width:100%"></div>`).join('')+
        `<div class="card">Total: <b>${total}%</b> ${total>100?'· over budget':total<80?'· under-spent':'· balanced'}</div><div class="row"><button class="b" data-act="budgetApply">Apply the budget</button></div>`;
    },
    cabinet(){
      view.innerHTML=`<h2>Cabinet</h2><div class="muted">Five cabinet ministers vote with you. Proposals that pass lift approval.</div>`+S.cabinet.map(p=>`<div class="card"><b>${esc(p.title)}</b>
        <div class="row">${p.votes===null?`<button class="b" data-act="vote" data-id="${p.id}" data-v="yes">Vote yes</button><button class="r" data-act="vote" data-id="${p.id}" data-v="no">Vote no</button>`:`<span>Result: <b>${p.votes.yes}–${p.votes.no}</b> · ${p.votes.yes>p.votes.no?'PASSED':'REJECTED'}</span>`}</div></div>`).join('');
    },
    treasury(){
      const last=S.price[S.price.length-1],first=S.price[0],pct=((last-first)/first*100).toFixed(2);
      view.innerHTML=`<h2>$SUPER market</h2><div class="muted">SIMULATED · not real money · price updates while you watch</div>
        <canvas id="plChart" width="640" height="200" style="width:100%;max-width:640px;background:#05080c;border-radius:10px;margin-top:8px"></canvas>
        <div class="card">Price <b>${last.toFixed(2)}</b> · change ${pct}% · Balance <b>${S.balance} SUPER</b></div>
        <div class="row"><button class="b" data-act="buy">Buy 100</button><button class="g" data-act="sell">Sell 100</button><button class="g" data-act="buyback">Announce buyback</button></div>`;
      const c=root.querySelector('#plChart');if(c){const g=c.getContext('2d');g.fillStyle='#05080c';g.fillRect(0,0,640,200);g.strokeStyle='#c8ff43';g.lineWidth=3;g.beginPath();
        S.price.forEach((p,i)=>{const x=i*(640/(S.price.length-1)),y=200-(p-60)*2.4;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()}
    },
    dispatch(){
      view.innerHTML=`<h2>Dispatch</h2><div class="muted">Status: ${esc(S.patrol)}</div>
        <div class="card"><b>Cop car 1</b> · standing by at the office<div class="row"><button class="b" data-act="cop" data-i="1">Send to me</button></div></div>
        <div class="card"><b>Cop car 2</b> · standing by at the office<div class="row"><button class="b" data-act="cop" data-i="2">Send to me</button></div></div>
        <div class="card"><b>Patrol a place</b><div class="pick">${PLACES.map(p=>`<button class="g" data-act="patrol" data-arg="${esc(p)}">${esc(p)}</button>`).join('')}</div></div>
        <div class="card"><b>Bodyguard</b><div class="row"><button class="g" data-act="bodyguard">Call or dismiss</button></div></div>
        <div class="card"><b>Office lockdown</b><div class="row"><button class="r" data-act="lockdown">Lock the office</button></div></div>`;
    },
    hangar(){
      const st={ready:'Ready for flight',fuelling:'Being fuelled',flying:'In the air',landed:'Landed'}[S.jet];
      view.innerHTML=`<h2>Airport hangar</h2><div class="card"><b>Super One</b> · the President's private jet<div class="muted">Status: ${st}</div>
        <div class="row"><button class="b" data-act="jetFuel" ${S.jet==='ready'||S.jet==='landed'?'':'disabled'}>Fuel up</button><button class="b" data-act="jetFly" ${S.jet==='ready'?'':'disabled'}>Take off to the club</button></div></div>
        <div class="card muted">Fuel takes a few seconds. The jet flies a short loop and lands back in the hangar.</div>`;
    },
    cctv(){
      view.innerHTML=`<h2>Security</h2><div class="muted">Camera tiles · simulated feeds</div><div class="grid">`+CCTV.map((c,i)=>`<div class="tile ${S.cctvLock[i]?'lk':''}" data-act="cam" data-i="${i}"><b>${esc(c[0])}</b>${S.cctvLock[i]?' · LOCKED':''}<div>${esc(c[1])}</div></div>`).join('')+`</div>
        <div class="card" id="plCam">${S.cctvSel===null?'Click a tile to focus it.':esc(CCTV[S.cctvSel][0])+': '+esc(CCTV[S.cctvSel][1])+(S.cctvLock[S.cctvSel]?' · locked down':'')}</div>
        ${S.cctvSel===null?'':`<div class="row"><button class="r" data-act="lockCam" data-i="${S.cctvSel}">${S.cctvLock[S.cctvSel]?'Lift lockdown':'Lock down this building'}</button></div>`}`;
    },
    press(){
      view.innerHTML=`<h2>Press office</h2><div class="muted">Pick a template or write your own. Sending gives a small approval boost.</div>
        <div class="row"><button class="g" data-act="tpl" data-t="0">Statement on the park</button><button class="g" data-act="tpl" data-t="1">Welcome to Super Town</button><button class="g" data-act="tpl" data-t="2">Apology</button></div>
        <textarea id="plPress" placeholder="Write your statement…"></textarea>
        <div class="row"><button class="b" data-act="sendpress">Send to the press</button><button class="g" data-act="conference">Call a press conference</button><span class="muted">Statements sent: ${S.pr}</span></div>`;
    },
    speech(){
      view.innerHTML=`<h2>Speeches</h2><textarea id="plSpeech" placeholder="Write the speech…">${esc(S.speeches)}</textarea><div class="row"><button class="b" data-act="readSpeech">Read it aloud</button></div><div class="muted">The town hears the first line.</div>`;
    },
    notes(){
      view.innerHTML=`<h2>Notes</h2><textarea id="plNotes" placeholder="Private notes…">${esc(S.notes)}</textarea><div class="muted">Saved as you type.</div>`;
    }
  };
  function render(){
    renderChrome();
    if(RENDER[S.app])RENDER[S.app]();
    if(S.app==='treasury')renderMarketCanvas();
  }
  function renderMarketCanvas(){}

  /* ---------- actions ---------- */
  function act(a,el){
    const id=el&&el.dataset.id;
    if(a==='close'){close();return}
    if(a==='app'){S.app=id;S.signing=null;render();return}
    if(a==='openDoc'){S.signing=id;S.ink=0;render();return}
    if(a==='back'){S.signing=null;render();return}
    if(a==='clearpad'){S.ink=0;S.signing=S.signing;render();return}
    if(a==='submit'){const d=S.docs.find(x=>x.id===S.signing);if(!d||S.ink<=40)return;d.done=true;S.signing=null;setApproval(3);onEffect('sign',d.title);toast('SIGNED · '+d.title);render();return}
    if(a==='mail'){const m=S.mail.find(x=>x.id===id);if(!m||m.res)return;const good=el.dataset.r==='good';m.res=good?'Approved':'Declined';setApproval(good?4:-4);onEffect('mail',{id,good});toast(m.res+' · '+m.from);render();return}
    if(a==='calDone'){const c=S.cal[+el.dataset.i];if(c){c.done=true;setApproval(1);render()}return}
    if(a==='calDel'){S.cal.splice(+el.dataset.i,1);render();return}
    if(a==='calAdd'){const t=(root.querySelector('#plEvT').value||'').trim(),n=(root.querySelector('#plEvN').value||'').trim();if(!t||!n){toast('Add a time and a title');return}S.cal.push({t,title:n,done:false});toast('Event added');render();return}
    if(a==='budgetApply'){const b=S.budget,total=b.park+b.school+b.police+b.club;const good=total>=80&&total<=100;setApproval(good?3:-3);onEffect('budget',{...b});toast(good?'Budget approved · balanced':'Budget needs balancing');render();return}
    if(a==='vote'){const p=S.cabinet.find(x=>x.id===id);if(!p||p.votes)return;const others=[0,1,2,3,4].map(()=>Math.random()<.55);const yes=others.filter(Boolean).length+(el.dataset.v==='yes'?1:0);const no=5+1-yes;p.votes={yes,no};const passed=yes>no;setApproval(passed?2:-2);onEffect('cabinet',{title:p.title,passed});toast(passed?'Proposal passed':'Proposal rejected');render();return}
    if(a==='buy'){if(S.balance>=100){S.balance-=100;setApproval(0);toast('Bought 100 SUPER (simulated)')}else toast('Not enough SUPER (simulated)');render();return}
    if(a==='sell'){S.balance+=100;toast('Sold 100 SUPER (simulated)');render();return}
    if(a==='buyback'){setApproval(2);toast('Buyback announced · approval up');return}
    if(a==='cop'){onEffect('cop',+el.dataset.i);S.patrol='cop car '+el.dataset.i+' on the way';toast('Cop car '+el.dataset.i+' dispatched');render();return}
    if(a==='patrol'){onEffect('patrol',el.dataset.arg);S.patrol='patrol heading to '+el.dataset.arg;toast('Patrol sent to '+el.dataset.arg);render();return}
    if(a==='bodyguard'){onEffect('bodyguard');toast('Bodyguard call toggled');return}
    if(a==='lockdown'){onEffect('lockdown');toast('Office locked down · staff notified');return}
    if(a==='jetFuel'){if(S.jet==='flying')return;S.jet='fuelling';render();setTimeout(()=>{S.jet='ready';if(root.classList.contains('on')&&S.app==='hangar')render()},3000);toast('Fuelling the Super One');return}
    if(a==='jetFly'){if(S.jet!=='ready')return;S.jet='flying';onEffect('jet','flying');toast('Super One takes off');render();setTimeout(()=>{S.jet='landed';onEffect('jet','landed');if(root.classList.contains('on')&&S.app==='hangar')render()},6000);return}
    if(a==='cam'){S.cctvSel=+el.dataset.i;render();return}
    if(a==='lockCam'){const i=+el.dataset.i;S.cctvLock[i]=!S.cctvLock[i];onEffect('lock',{i,on:S.cctvLock[i]});toast(S.cctvLock[i]?'Building locked down':'Lockdown lifted');render();return}
    if(a==='tpl'){const ta=root.querySelector('#plPress');if(ta)ta.value=TPL[+el.dataset.t];return}
    if(a==='sendpress'){const ta=root.querySelector('#plPress');if(!ta||!ta.value.trim()){toast('Write something first');return}S.pr++;setApproval(2);onEffect('press',ta.value.trim());toast('Statement sent to the press');ta.value='';render();return}
    if(a==='conference'){setApproval(3);S.pr++;onEffect('press','Press conference called');toast('Press conference called · approval up');render();return}
    if(a==='readSpeech'){const txt=(root.querySelector('#plSpeech')||{value:S.speeches}).value.trim();if(!txt){toast('Write the speech first');return}const first=txt.split(/[.!?\n]/)[0];setApproval(1);onEffect('speech',first);toast('“'+first.slice(0,60)+'”');return}
  }
  root.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el)act(el.dataset.act,el)});
  root.addEventListener('input',e=>{const t=e.target;if(t.id==='plNotes')S.notes=t.value;else if(t.id==='plSpeech')S.speeches=t.value;else if(t.dataset&&t.dataset.input==='budget'){S.budget[t.dataset.k]=+t.value}});
  root.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.input==='budget'){render()}});
  root.addEventListener('mousedown',e=>{if(e.target===root)close()});

  /* ---------- open and close ---------- */
  let isOn=false,hangarTimer=null;
  function open(){isOn=true;root.classList.add('on');clock();render();window.__laptopOpen=true;clearInterval(marketT);marketT=setInterval(tickMarket,1500)}
  function close(){isOn=false;root.classList.remove('on');window.__laptopOpen=false;clearInterval(marketT);marketT=null}
  addEventListener('keydown',e=>{if(!isOn)return;if(e.key==='Escape'){e.preventDefault();close()}},true);
  setInterval(()=>{if(isOn)clock()},1000);
  return{open,close,isOpen:()=>isOn,approval:()=>S.approval,_state:S,_root:root};
}
