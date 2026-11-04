/* Super Phone (v2): home screen with widgets, app search, badges and a dock.
   Apps: Messages, Maps, Taxi, Bodyguard, Garage, Contacts, Police, News, Music, Notes, Wallet, Guest list,
   Food order, Coin game, Camera, Settings (accent colour, text size, do-not-disturb).
   The world is reached through act(name,arg) and getState(); everything else (wallet, orders, timers,
   notes, game scores, settings) lives in the phone and survives closing it. Open with P or the phone button.
   While it is open the game's controls are paused. */
export function createPhone({host,getState,act}){
  const style=document.createElement('style');
  style.textContent=`
#twPhone{--acc:#c8ff43;--acc2:#7ddc1f;position:absolute;right:18px;bottom:60px;width:300px;height:600px;padding:10px;border-radius:46px;background:linear-gradient(160deg,#2a3440,#0b1016);box-shadow:0 24px 60px rgba(0,0,0,.65),inset 0 0 0 2px #3c4a57;display:none;flex-direction:column;z-index:40;font-family:-apple-system,system-ui,sans-serif;color:#f1f6f3;user-select:none}
#twPhone.big{font-size:115%}
#twPhone .glass{flex:1;position:relative;border-radius:36px;overflow:hidden;background:radial-gradient(120% 80% at 80% 0%,#1d4a3d 0%,#0c1f19 45%,#05100c 100%);display:flex;flex-direction:column}
#twPhone .status{display:flex;justify-content:space-between;align-items:center;padding:14px 22px 4px;font-size:12px;font-weight:700;flex:none}
#twPhone .notch{position:absolute;left:50%;top:8px;transform:translateX(-50%);width:96px;height:25px;background:#000;border-radius:14px;z-index:3}
#twPhone .screen{flex:1;overflow:auto;padding:6px 16px 14px;scrollbar-width:none;animation:twIn .22s ease-out}
#twPhone .screen::-webkit-scrollbar{display:none}
@keyframes twIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
#twPhone .hero{font-size:13px;opacity:.7;margin:10px 2px 2px}
#twPhone .title{font-size:28px;font-weight:800;letter-spacing:-.02em;margin:0 0 10px}
#twPhone .search{width:100%;background:rgba(255,255,255,.1);color:#f1f6f3;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:9px 12px;font-size:13px;outline:none;box-sizing:border-box;margin-bottom:10px}
#twPhone .widgets{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
#twPhone .wg{background:rgba(255,255,255,.08);border-radius:18px;padding:11px;min-height:64px;cursor:pointer;font-size:12px}
#twPhone .wg.wide{grid-column:span 2}
#twPhone .wg .k{font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:.08em}
#twPhone .wg .v{font-size:15px;font-weight:800;margin-top:3px}
#twPhone .apps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 6px;margin-top:4px}
#twPhone .app{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-size:10px;font-weight:600;position:relative}
#twPhone .ic{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:0 6px 16px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25)}
#twPhone .badge{position:absolute;top:-4px;right:6px;background:#ff3b30;color:#fff;border-radius:10px;min-width:18px;height:18px;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px;box-sizing:border-box}
#twPhone .dock{flex:none;margin:0 10px 6px;padding:8px;border-radius:24px;background:rgba(255,255,255,.1);display:flex;justify-content:space-around}
#twPhone .dock .app{font-size:0}
#twPhone .dock .ic{width:48px;height:48px;font-size:22px}
#twPhone .card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:14px;margin:12px 0}
#twPhone .card .k{font-size:11px;opacity:.65;text-transform:uppercase;letter-spacing:.08em}
#twPhone .card .v{font-size:17px;font-weight:800;margin-top:4px}
#twPhone .row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px}
#twPhone .row small{display:block;opacity:.6;font-size:11px;margin-top:2px}
#twPhone .btn{background:var(--acc);color:#0b1410;border:0;border-radius:14px;padding:9px 14px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
#twPhone .btn.ghost{background:rgba(255,255,255,.12);color:#f1f6f3}
#twPhone .btn.red{background:#ff6b6b;color:#fff}
#twPhone .btn[disabled]{opacity:.35;cursor:default}
#twPhone .seg{display:flex;background:rgba(255,255,255,.1);border-radius:12px;padding:3px;gap:3px;margin:8px 0}
#twPhone .seg button{flex:1;background:none;border:0;color:#f1f6f3;padding:7px 4px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer}
#twPhone .seg button.on{background:var(--acc);color:#0b1410}
#twPhone .bubble{display:inline-block;max-width:92%;padding:8px 12px;border-radius:16px;margin:4px 0;font-size:13px;background:rgba(255,255,255,.1)}
#twPhone .bubble.me{background:var(--acc);color:#0b1410;margin-left:auto;display:block;width:fit-content}
#twPhone .bubble b{font-size:11px;opacity:.7;display:block;margin-bottom:2px}
#twPhone .composer{display:flex;gap:8px;margin-top:12px}
#twPhone input,#twPhone textarea{flex:1;background:rgba(255,255,255,.1);color:#f1f6f3;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:10px 12px;font-size:13px;outline:none;font-family:inherit}
#twPhone textarea{width:100%;min-height:200px;box-sizing:border-box;resize:none}
#twPhone .hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px}
#twPhone .hdr button{background:rgba(255,255,255,.1);color:#f1f6f3;border:0;border-radius:12px;padding:6px 12px;font-size:14px;cursor:pointer}
#twPhone .hdr h2{margin:0;font-size:20px;font-weight:800}
#twPhone .game{position:relative;height:250px;border-radius:20px;background:rgba(255,255,255,.06);overflow:hidden;margin:10px 0}
#twPhone .coin{position:absolute;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3a0,#f5b400);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.4)}
#twPhone .home-bar{height:20px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px;flex:none}
#twPhone .home-bar i{width:110px;height:4px;border-radius:2px;background:rgba(255,255,255,.7)}
#twPhoneBtn{position:absolute;left:22px;bottom:16px;z-index:39;background:linear-gradient(135deg,#c8ff43,#7ddc1f);color:#0b1410;border:0;border-radius:18px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4)}
#twPhoneToast{position:absolute;top:44px;left:12px;right:12px;padding:10px 12px;border-radius:16px;background:rgba(20,30,26,.94);font-size:12px;font-weight:600;transform:translateY(-140%);transition:transform .3s;z-index:4}
#twPhoneToast.on{transform:translateY(0)}`;
  document.head.appendChild(style);

  /* ---------- the apps ---------- */
  const APPS=[
    {id:'messages',name:'Messages',emoji:'💬',grad:'linear-gradient(135deg,#4cd964,#21a048)'},
    {id:'maps',name:'Maps',emoji:'🗺',grad:'linear-gradient(135deg,#5ac8fa,#1d7fd6)'},
    {id:'taxi',name:'Taxi',emoji:'🚕',grad:'linear-gradient(135deg,#ffd60a,#ff9f0a)'},
    {id:'guard',name:'Bodyguard',emoji:'🛡',grad:'linear-gradient(135deg,#7d7aff,#4b3fd6)'},
    {id:'garage',name:'Garage',emoji:'🚗',grad:'linear-gradient(135deg,#ff6b6b,#c92a2a)'},
    {id:'contacts',name:'Contacts',emoji:'👤',grad:'linear-gradient(135deg,#63e6be,#0ca678)'},
    {id:'police',name:'Police',emoji:'🚓',grad:'linear-gradient(135deg,#4dabf7,#1c3d6e)'},
    {id:'news',name:'News',emoji:'📰',grad:'linear-gradient(135deg,#ff8787,#e03131)'},
    {id:'music',name:'Music',emoji:'🎵',grad:'linear-gradient(135deg,#f783ac,#c2255c)'},
    {id:'notes',name:'Notes',emoji:'📝',grad:'linear-gradient(135deg,#ffe066,#f59f00)'},
    {id:'wallet',name:'Wallet',emoji:'💳',grad:'linear-gradient(135deg,#96f2d7,#20c997)'},
    {id:'guest',name:'Guest list',emoji:'🎟',grad:'linear-gradient(135deg,#da77f2,#9c36b5)'},
    {id:'food',name:'Food',emoji:'🍔',grad:'linear-gradient(135deg,#ffa94d,#e8590c)'},
    {id:'games',name:'Coin game',emoji:'🪙',grad:'linear-gradient(135deg,#ffec99,#fab005)'},
    {id:'camera',name:'Camera',emoji:'📸',grad:'linear-gradient(135deg,#868e96,#343a40)'},
    {id:'flights',name:'Flights',emoji:'✈️',grad:'linear-gradient(135deg,#74c0fc,#1864ab)'},
    {id:'settings',name:'Settings',emoji:'⚙',grad:'linear-gradient(135deg,#adb5bd,#495057)'}
  ];
  const DOCK=['messages','maps','taxi','police'];
  const ACCENTS={lime:['#c8ff43','#7ddc1f'],pink:['#ff8ac7','#e64980'],cyan:['#63e6ff','#1c9bd6'],orange:['#ffb84d','#e8590c']};
  const MENU=[{n:'Super Burger',p:12},{n:'Super Fries',p:4},{n:'Shake',p:6},{n:'Bodyguard combo',p:20}];
  const STATIONS=[{n:'Super FM',bpm:110,wave:'square'},{n:'Night Drive',bpm:92,wave:'sawtooth'},{n:'Plaza Chill',bpm:78,wave:'triangle'}];

  /* ---------- the phone's own state (kept while the phone is closed) ---------- */
  const load=(k,d)=>{try{const v=JSON.parse(localStorage.getItem('twPhone.'+k));return v===null?d:v}catch(e){return d}};
  const save=(k,v)=>{try{localStorage.setItem('twPhone.'+k,JSON.stringify(v))}catch(e){}};
  const S={
    cash:load('cash',500),guest:load('guest',false),
    accent:load('accent','lime'),big:load('big',false),dnd:load('dnd',false),
    notes:load('notes',''),best:load('best',0),
    order:null,           // {item,stage,t}
    photos:load('photos',[]),
    station:0,playing:false,
    game:{on:false,t:0,score:0,coins:[]},
    seen:0,search:'',unread:0,
    news:[]
  };

  /* ---------- DOM ---------- */
  const el=document.createElement('div');el.id='twPhone';
  el.innerHTML=`<div class="glass"><div class="notch"></div><div class="status"><span class="clock"></span><span>●●● 5G 🔋</span></div><div id="twPhoneToast"></div><div class="screen"></div><div class="dock"></div><div class="home-bar"><i></i></div></div>`;
  host.appendChild(el);
  const launch=document.createElement('button');launch.id='twPhoneBtn';launch.textContent='📱 PHONE · P';host.appendChild(launch);
  const screen=el.querySelector('.screen'),clock=el.querySelector('.clock'),toastEl=el.querySelector('#twPhoneToast'),dockEl=el.querySelector('.dock');
  let open=false,view='home',tAcc=0,lastMsgs=-1,toastT=0,lastRender=0;

  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hdr=(title)=>`<div class="hdr"><button data-go="home">‹ Home</button><h2>${esc(title)}</h2></div>`;
  const money=n=>'CR '+Math.round(n).toLocaleString('en-US');
  function applyTheme(){const a=ACCENTS[S.accent]||ACCENTS.lime;el.style.setProperty('--acc',a[0]);el.style.setProperty('--acc2',a[1]);el.classList.toggle('big',!!S.big)}
  applyTheme();
  function ptoast(t,force){if(S.dnd&&!force)return;toastEl.textContent=t;toastEl.classList.add('on');toastT=2.6}
  function appById(id){return APPS.find(a=>a.id===id)}
  function icon(a,cls=''){const badge=a.id==='messages'&&S.unread>0?`<span class="badge">${S.unread}</span>`:'';return `<div class="app ${cls}" data-go="${a.id}"><span class="ic" style="background:${a.grad}">${a.emoji}</span>${badge}<span>${a.name}</span></div>`}

  /* ---------- live status helpers ---------- */
  function taxiStatus(s){
    const t=s.taxi;
    const map={off:['No taxi','Call one and it will drive to you.'],coming:['Taxi on the way','It is driving to your position.'],waiting:['Taxi is here','Pick a destination below.'],riding:['On the way','To '+(t.dest||'')+' · fare '+t.fare+' CR'],arrived:['Arrived','Thanks for riding with Super Taxi.']};
    const [a,b]=map[t.state]||map.off;return{a,b}
  }
  const defaultNews=['$SUPER UP 2.1% TODAY · SIMULATED','PRESIDENT SIGNS THE PARK FUND MEMO','SUPER SCHOOL OPENS NEW LIBRARY SHELVES','SUPER CLUB OPENS LATE THIS WEEKEND','SUPER DINER SPECIAL: SUPER BURGER + SHAKE'];
  const newsList=s=>(s&&s.news&&s.news.length?s.news:defaultNews);

  /* ---------- views ---------- */
  const VIEWS={
    home(s){
      const ts=taxiStatus(s);
      const q=S.search.trim().toLowerCase();
      const grid=APPS.filter(a=>!DOCK.includes(a.id)&&(!q||a.name.toLowerCase().includes(q))).map(a=>icon(a)).join('');
      const widgets=`<div class="widgets">
        <div class="wg wide" data-go="taxi"><div class="k">Taxi</div><div class="v">${ts.a}</div><small style="opacity:.7">${ts.b}</small></div>
        <div class="wg" data-go="wallet"><div class="k">Wallet</div><div class="v">${money(S.cash)}</div></div>
        <div class="wg" data-go="news"><div class="k">Town news</div><div class="v" style="font-size:11px;line-height:1.3">${esc(newsList(s)[0])}</div></div></div>`;
      return `<div class="hero">${esc(s.greet)}</div><div class="title">Super Phone</div>
        <input class="search" id="twPhoneSearch" placeholder="Search apps" value="${esc(S.search)}">${widgets}
        <div class="apps">${grid||'<div class="card">No app matches.</div>'}</div>`;
    },
    messages(s){
      const msgs=s.msgs.slice(-18).map(m=>m.who==='YOU'?`<div class="bubble me">${esc(m.t)}</div>`:`<div class="bubble"><b>${esc(m.who||'')}</b>${esc(m.t)}</div>`).join('')||'<div class="bubble">No messages yet. Say hi to someone nearby.</div>';
      return `${hdr('Messages')}<div>${msgs}</div><div class="composer"><input id="twPhoneIn" maxlength="120" placeholder="iMessage"><button class="btn" data-act="send">Send</button></div>`;
    },
    maps(s){
      const rows=s.places.map(p=>`<div class="row"><div>${esc(p.name)}<small>${Math.round(p.d)} m away</small></div><button class="btn ghost" data-act="taxi-go" data-arg="${esc(p.name)}">Taxi</button></div>`).join('');
      return `${hdr('Maps')}<div class="card"><div class="k">You are at</div><div class="v">${Math.round(s.pos.x)}, ${Math.round(s.pos.z)}</div></div>${rows}`;
    },
    taxi(s){
      const ts=taxiStatus(s),t=s.taxi;
      const canCall=t.state==='off',canCancel=t.state==='coming'||t.state==='waiting';
      const dests=s.destinations.map(d=>`<div class="row"><div>${esc(d.name)}<small>${Math.round(d.d)} m · about ${d.fare} CR</small></div><button class="btn" data-act="taxi-go" data-arg="${esc(d.name)}" ${t.state==='waiting'?'':'disabled'}>Go</button></div>`).join('');
      return `${hdr('Super Taxi')}<div class="card"><div class="k">Status</div><div class="v">${ts.a}</div><small style="opacity:.7">${ts.b}</small>
        <div style="margin-top:10px">${canCall?'<button class="btn" data-act="taxi-call">Call taxi</button>':''}${canCancel?'<button class="btn red" data-act="taxi-cancel">Cancel</button>':''}</div></div>
        <div class="k" style="margin:8px 0 2px">Destinations</div>${dests}`;
    },
    guard(s){
      const on=s.guard.on;
      return `${hdr('Bodyguard')}<div class="card"><div class="k">Your bodyguard</div><div class="v">${on?'On duty':'Off duty'}</div><small style="opacity:.7">He walks beside you on foot. When you drive the Super Benz, he follows in his own police car.</small>
        <div style="margin-top:12px"><button class="btn ${on?'red':''}" data-act="guard">${on?'Dismiss bodyguard':'Hire bodyguard'}</button></div></div>`;
    },
    garage(s){
      return `${hdr('Super Benz')}<div class="card"><div class="k">Speed</div><div class="v">${s.kmh} ${s.units}</div><div class="k" style="margin-top:10px">Gear</div><div class="v">${s.gear}</div></div>
        <div class="row"><div>Engine sound<small>Rev sound while you drive</small></div><button class="btn ghost" data-act="sound">${s.sound?'On':'Off'}</button></div>
        <div class="row"><div>Repaint<small>Cycle through paint jobs</small></div><button class="btn" data-act="repaint">Paint</button></div>`;
    },
    contacts(s){
      return `${hdr('Contacts')}<div class="row"><div>${s.nearby?esc(s.nearby):'No one nearby'}<small>${s.nearby?'Close enough to talk':'Walk closer to someone'}</small></div>${s.nearby?'<button class="btn" data-act="call">Call</button>':''}</div>`;
    },
    police(s){
      const st=s.places.find(p=>p.name==='Police Station');
      return `${hdr('Police')}<div class="card" style="text-align:center"><div style="font-size:40px">🚓</div><div class="v">Emergency</div><small style="opacity:.7">A patrol is alerted to your position.</small><div style="margin-top:12px"><button class="btn red" data-act="police">Call police</button></div></div>
        <div class="row"><div>Police Station<small>${st?Math.round(st.d)+' m away':''}</small></div><button class="btn ghost" data-act="taxi-go" data-arg="Police Station">Taxi</button></div>`;
    },
    flights(s){
      const j=s.jet||'ready',names={ready:'Ready for flight',fuelling:'Being fuelled',flying:'In the air',landed:'Landed in the hangar'};
      const canFly=j==='ready'||j==='landed';
      return `${hdr('Flights')}<div class="card" style="text-align:center"><div style="font-size:40px">✈️</div><div class="v">SUPER ONE</div><small style="opacity:.7">The President's private jet · ${names[j]||j}</small>
        <div style="margin-top:12px"><button class="btn ghost" data-act="jet-fuel" ${j==='ready'||j==='landed'?'':'disabled'}>Fuel up</button> <button class="btn" data-act="jet-fly" ${canFly?'':'disabled'}>Fly the loop</button></div></div>
        <small style="opacity:.6">Takes off from the airport hangar in the south-west, loops over the town, and lands back in the hangar.</small>`;
    },
    news(s){
      const list=newsList(s).map((h,i)=>`<div class="row"><div>${esc(h)}<small>Super Town News · ${i===0?'just now':i*4+' min ago'}</small></div></div>`).join('');
      return `${hdr('Town news')}<div class="card"><div class="k">Live ticker</div><div class="v">${esc(newsList(s)[0])}</div><small style="opacity:.7">Headlines rotate on the billboard in the plaza. Statements from the President's MacBook appear here too.</small></div>${list}`;
    },
    music(){
      const st=STATIONS[S.station];
      return `${hdr('Music')}<div class="card" style="text-align:center"><div style="font-size:44px">🎵</div><div class="v">${esc(st.n)}</div><small style="opacity:.7">${st.bpm} BPM · ${S.playing?'playing':'paused'}</small>
        <div style="margin-top:12px"><button class="btn" data-act="play">${S.playing?'Pause':'Play'}</button> <button class="btn ghost" data-act="next">Next station</button></div></div>
        <small style="opacity:.6">Plays a simple synth beat (sound needs a tap, then it plays).</small>`;
    },
    notes(){
      return `${hdr('Notes')}<textarea id="twPhoneNotes" placeholder="Write something…">${esc(S.notes)}</textarea><small style="opacity:.6">Saved as you type on this device.</small>`;
    },
    wallet(s){
      const cash=S.cash;
      return `${hdr('Wallet')}<div class="card"><div class="k">Cash</div><div class="v">${money(cash)}</div><small style="opacity:.7">Taxis and food come out of this wallet.</small></div>
        <div class="row"><div>Super Taxi fares<small>Billed when the ride ends</small></div><span>${s.taxi.state==='riding'?'on trip':'—'}</span></div>
        <div class="row"><div>Super Club guest list<small>${S.guest?'Active':'Not on the list'}</small></div><span>${S.guest?'✓':'—'}</span></div>
        <div class="row"><div>Top-up<small>Add CR for play</small></div><button class="btn ghost" data-act="topup">+200 CR</button></div>`;
    },
    guest(){
      const on=S.guest;
      return `${hdr('Guest list')}<div class="card" style="text-align:center"><div style="font-size:40px">🎟</div><div class="v">Super Club</div><small style="opacity:.7">Skip the queue at the door. Costs 50 CR.</small>
        <div style="margin-top:12px">${on?'<button class="btn ghost" data-act="guest-off">Leave the list</button>':'<button class="btn" data-act="guest-on" '+(S.cash<50?'disabled':'')+'>Join for 50 CR</button>'}</div></div>
        <small style="opacity:.6">${on?'You are on the list. Show at the club door.':'Not on the list yet.'}</small>`;
    },
    food(){
      const o=S.order;
      const status=o?`<div class="card"><div class="k">Your order</div><div class="v">${esc(o.item)}</div><small style="opacity:.7">${({cooking:'Cooking at Super Diner…',way:'On the way to you…',done:'Delivered. Enjoy!'})[o.stage]}</small></div>`:'';
      const rows=MENU.map(m=>`<div class="row"><div>${esc(m.n)}<small>${money(m.p)}</small></div><button class="btn" data-act="order" data-arg="${esc(m.n)}" ${o&&o.stage!=='done'?'disabled':''} ${S.cash<m.p?'disabled':''}>Order</button></div>`).join('');
      return `${hdr('Food')}${status}${rows}<small style="opacity:.6">Delivered by a Super Diner runner in about 15 seconds.</small>`;
    },
    games(){
      const g=S.game;
      if(!g.on)return `${hdr('Coin game')}<div class="card" style="text-align:center"><div class="k">Best score</div><div class="v">${S.best}</div><small style="opacity:.7">Tap the coins for 20 seconds.</small><div style="margin-top:12px"><button class="btn" data-act="gstart">Start round</button></div></div>`;
      const coins=g.coins.map((c,i)=>`<div class="coin" data-act="coin" data-arg="${i}" style="left:${c.x}%;top:${c.y}%">🪙</div>`).join('');
      return `${hdr('Coin game')}<div class="row"><div>Score<small>${Math.ceil(g.t)} s left</small></div><div class="v">${g.score}</div></div><div class="game">${coins}</div>`;
    },
    camera(s){
      const shots=S.photos.slice(-8).reverse().map(p=>`<div class="card" style="margin:6px 0"><div class="k">${esc(p.t)}</div><small style="opacity:.8">Near ${esc(p.where)}</small></div>`).join('')||'<div class="card">No photos yet.</div>';
      return `${hdr('Camera')}<div class="card" style="text-align:center"><div style="font-size:44px">📸</div><div class="v">${esc(s.nearby?'Snap '+s.nearby:'Snap the town')}</div><div style="margin-top:12px"><button class="btn" data-act="snap">Take photo</button></div></div>${shots}`;
    },
    settings(s){
      const acc=Object.keys(ACCENTS).map(k=>`<button class="${S.accent===k?'on':''}" data-act="accent" data-arg="${k}">${k}</button>`).join('');
      return `${hdr('Settings')}<div class="row"><div>Engine sound<small>Rev and roar in the Benz</small></div><button class="btn ghost" data-act="sound">${s.sound?'On':'Off'}</button></div>
        <div class="row"><div>Speed units<small>Dial and garage</small></div><button class="btn ghost" data-act="units">${s.units.toUpperCase()}</button></div>
        <div class="row"><div>Large text<small>Bigger type on the phone</small></div><button class="btn ghost" data-act="big">${S.big?'On':'Off'}</button></div>
        <div class="row"><div>Do not disturb<small>Hide banners</small></div><button class="btn ghost" data-act="dnd">${S.dnd?'On':'Off'}</button></div>
        <div class="k" style="margin:10px 0 4px">Accent colour</div><div class="seg">${acc}</div>`;
    }
  };

  function render(){
    const s=getState();
    screen.innerHTML=VIEWS[view](s);
    if(view==='messages')lastMsgs=s.msgs.length;
    if(view==='home'){const si=el.querySelector('#twPhoneSearch');if(si)si.addEventListener('input',e=>{S.search=e.target.value;render();const n=el.querySelector('#twPhoneSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}})}
    renderDock();
  }
  function renderDock(){
    dockEl.innerHTML=DOCK.map(id=>{const a=appById(id);return icon(a)}).join('');
  }
  function go(v){
    view=v;
    if(v==='messages'){S.unread=0}
    if(v!=='games')S.game.on=false;
    render();
  }

  /* ---------- events ---------- */
  screen.addEventListener('click',e=>{
    const g=e.target.closest('[data-go]');if(g)return go(g.dataset.go);
    const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
    local(b.dataset.act,b);
  });
  screen.addEventListener('input',e=>{if(e.target.id==='twPhoneNotes'){S.notes=e.target.value;save('notes',S.notes)}});
  screen.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='twPhoneIn'){e.preventDefault();const i=e.target;if(i.value.trim()){act('send',i.value);i.value=''}render()}});
  dockEl.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});
  launch.addEventListener('click',()=>api.toggle());

  function local(a,b){
    const arg=b.dataset.arg;
    if(a==='send'){const i=el.querySelector('#twPhoneIn');if(i&&i.value.trim()){act('send',i.value);i.value=''}return render()}
    if(a==='repaint'||a==='sound'||a==='units'||a==='call'||a==='taxi-call'||a==='taxi-cancel'||a==='taxi-go'||a==='guard'||a==='police'||a==='jet-fuel'||a==='jet-fly'){act(a,arg);return render()}
    if(a==='accent'){S.accent=arg;save('accent',arg);applyTheme();return render()}
    if(a==='big'){S.big=!S.big;save('big',S.big);applyTheme();return render()}
    if(a==='dnd'){S.dnd=!S.dnd;save('dnd',S.dnd);return render()}
    if(a==='topup'){S.cash+=200;save('cash',S.cash);ptoast('+200 CR added to wallet',true);return render()}
    if(a==='guest-on'){if(S.cash<50)return render();S.cash-=50;S.guest=true;save('cash',S.cash);save('guest',true);act('guest','on');ptoast('ON THE GUEST LIST',true);return render()}
    if(a==='guest-off'){S.guest=false;save('guest',false);act('guest','off');return render()}
    if(a==='order'){const m=MENU.find(x=>x.n===arg);if(!m||S.cash<m.p||(S.order&&S.order.stage!=='done'))return render();S.cash-=m.p;save('cash',S.cash);S.order={item:m.n,stage:'cooking',t:0};act('food',m.n);ptoast('Order placed · '+m.n,true);return render()}
    if(a==='play'){togglePlay();return render()}
    if(a==='next'){S.station=(S.station+1)%STATIONS.length;if(S.playing){stopBeat();startBeat()}return render()}
    if(a==='gstart'){S.game={on:true,t:20,score:0,coins:[]};spawnCoin();return render()}
    if(a==='coin'){const i=+arg;const c=S.game.coins[i];if(c&&S.game.on){S.game.coins.splice(i,1);S.game.score++;spawnCoin();}return render()}
    if(a==='snap'){const s=getState();const d=new Date();const t=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');const where=s.nearby?s.nearby:Math.round(s.pos.x)+', '+Math.round(s.pos.z);S.photos.push({t,where:String(where)});if(S.photos.length>30)S.photos.shift();save('photos',S.photos);act('snap',where);ptoast('Photo saved',true);return render()}
  }

  /* ---------- coin game ---------- */
  function spawnCoin(){if(S.game.coins.length>=4)return;S.game.coins.push({x:6+Math.random()*78,y:6+Math.random()*78})}
  function stopGame(){S.game.on=false;if(S.game.score>S.best){S.best=S.game.score;save('best',S.best);ptoast('New best: '+S.best,true)}else ptoast('Round over · '+S.game.score+' coins',true)}

  /* ---------- simple synth beat (only after a tap, so the browser allows audio) ---------- */
  let ac=null,beat=null,step=0;
  function ensureAudio(){if(ac)return ac;try{const C=window.AudioContext||window.webkitAudioContext;if(C)ac=new C()}catch(e){ac=null}return ac}
  function tone(f,type,dur,vol){if(!ac)return;try{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.value=vol;g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+dur)}catch(e){}}
  function startBeat(){const st=STATIONS[S.station];const ms=60000/st.bpm/2;step=0;beat=setInterval(()=>{const notes=[110,110,165,131];if(step%2===0)tone(55,'sine',.18,.5);tone(notes[step%4]*(step%8<4?1:1.5),st.wave,.12,.08);step++},ms)}
  function stopBeat(){if(beat)clearInterval(beat);beat=null}
  function togglePlay(){if(S.playing){stopBeat();S.playing=false;return}if(!ensureAudio()){ptoast('Audio is not available here',true);return}try{ac.resume&&ac.resume()}catch(e){}S.playing=true;startBeat()}

  /* ---------- live: the clock, the food runner, the coin round, badges ---------- */
  function timers(dt){
    if(S.order&&S.order.stage!=='done'){
      S.order.t+=dt;
      if(S.order.stage==='cooking'&&S.order.t>6){S.order.stage='way'}
      if(S.order.stage==='way'&&S.order.t>12){S.order.stage='done';ptoast('Food delivered · '+S.order.item,true);act('food-delivered',S.order.item);}
    }
    if(S.game.on){S.game.t-=dt;if(S.game.t<=0){S.game.t=0;stopGame()}}
  }

  const api={
    open(){if(open)return;open=true;el.style.display='flex';launch.style.display='none';view='home';render()},
    close(){if(!open)return;open=false;el.style.display='none';launch.style.display='block';S.game.on=false},
    toggle(){open?api.close():api.open()},
    isOpen(){return open},
    notify(t){ptoast(t)},
    tick(dt){
      const n=new Date();clock.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
      if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on')}
      timers(dt);
      const msgs=getState().msgs.length;
      if(lastMsgs<0)lastMsgs=msgs;
      if(msgs!==lastMsgs){if(view!=='messages'){S.unread+=Math.max(0,msgs-lastMsgs)}lastMsgs=msgs}
      if(!open)return;
      tAcc+=dt;if(tAcc<.25)return;tAcc=0;
      const f=document.activeElement;                                       // never redraw under a cursor that is typing
      if(f&&(f.id==='twPhoneIn'||f.id==='twPhoneNotes'||f.id==='twPhoneSearch'))return;
      if(view==='notes')return;
      render();
    }
  };
  el.style.display='none';launch.style.display='block';
  return api;
}
