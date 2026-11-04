/* Super Phone: messages, maps, taxi, bodyguard, garage, contacts, police and settings.
   Opened with P (or the phone button). While it is open the game's controls are paused. */
export function createPhone({host,getState,act}){
  const style=document.createElement('style');
  style.textContent=`
#twPhone{position:absolute;right:18px;bottom:18px;width:290px;height:580px;padding:10px;border-radius:44px;background:linear-gradient(160deg,#2a3440,#0b1016);box-shadow:0 24px 60px rgba(0,0,0,.65),inset 0 0 0 2px #3c4a57;display:none;flex-direction:column;z-index:40;font-family:-apple-system,system-ui,sans-serif;color:#f1f6f3;user-select:none}
#twPhone .glass{flex:1;position:relative;border-radius:34px;overflow:hidden;background:radial-gradient(120% 80% at 80% 0%,#1d4a3d 0%,#0c1f19 45%,#05100c 100%);display:flex;flex-direction:column}
#twPhone .status{display:flex;justify-content:space-between;align-items:center;padding:14px 22px 4px;font-size:12px;font-weight:700}
#twPhone .notch{position:absolute;left:50%;top:8px;transform:translateX(-50%);width:92px;height:24px;background:#000;border-radius:14px}
#twPhone .screen{flex:1;overflow:auto;padding:6px 16px 14px;scrollbar-width:none}
#twPhone .screen::-webkit-scrollbar{display:none}
#twPhone .hero{font-size:13px;opacity:.7;margin:10px 2px 2px}
#twPhone .title{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0 0 12px}
#twPhone .apps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;margin-top:6px}
#twPhone .app{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font-size:10.5px;font-weight:600}
#twPhone .ic{width:54px;height:54px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:0 6px 16px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.25)}
#twPhone .card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:14px;margin:12px 0}
#twPhone .card .k{font-size:11px;opacity:.65;text-transform:uppercase;letter-spacing:.08em}
#twPhone .card .v{font-size:17px;font-weight:800;margin-top:4px}
#twPhone .row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px}
#twPhone .row small{display:block;opacity:.6;font-size:11px;margin-top:2px}
#twPhone .btn{background:#c8ff43;color:#0b1410;border:0;border-radius:14px;padding:9px 14px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
#twPhone .btn.ghost{background:rgba(255,255,255,.12);color:#f1f6f3}
#twPhone .btn.red{background:#ff6b6b;color:#fff}
#twPhone .btn[disabled]{opacity:.35;cursor:default}
#twPhone .bubble{display:inline-block;max-width:92%;padding:8px 12px;border-radius:16px;margin:4px 0;font-size:13px;background:rgba(255,255,255,.1)}
#twPhone .bubble.me{background:#c8ff43;color:#0b1410;margin-left:auto;display:block;width:fit-content}
#twPhone .bubble b{font-size:11px;opacity:.7;display:block;margin-bottom:2px}
#twPhone .composer{display:flex;gap:8px;margin-top:12px}
#twPhone input{flex:1;background:rgba(255,255,255,.1);color:#f1f6f3;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:10px 12px;font-size:13px;outline:none}
#twPhone .hdr{display:flex;align-items:center;gap:8px;margin-bottom:8px}
#twPhone .hdr button{background:rgba(255,255,255,.1);color:#f1f6f3;border:0;border-radius:12px;padding:6px 12px;font-size:14px;cursor:pointer}
#twPhone .hdr h2{margin:0;font-size:20px;font-weight:800}
#twPhone .home-bar{height:22px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6px}
#twPhone .home-bar i{width:110px;height:4px;border-radius:2px;background:rgba(255,255,255,.7)}
#twPhoneBtn{position:absolute;right:18px;bottom:18px;z-index:39;background:linear-gradient(135deg,#c8ff43,#7ddc1f);color:#0b1410;border:0;border-radius:18px;padding:10px 14px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4)}
#twPhoneToast{position:absolute;top:44px;left:12px;right:12px;padding:10px 12px;border-radius:16px;background:rgba(20,30,26,.92);font-size:12px;font-weight:600;transform:translateY(-140%);transition:transform .3s;z-index:2}
#twPhoneToast.on{transform:translateY(0)}`;
  document.head.appendChild(style);

  const APPS=[
    {id:'messages',name:'Messages',emoji:'💬',grad:'linear-gradient(135deg,#4cd964,#21a048)'},
    {id:'maps',name:'Maps',emoji:'🗺',grad:'linear-gradient(135deg,#5ac8fa,#1d7fd6)'},
    {id:'taxi',name:'Taxi',emoji:'🚕',grad:'linear-gradient(135deg,#ffd60a,#ff9f0a)'},
    {id:'guard',name:'Bodyguard',emoji:'🛡',grad:'linear-gradient(135deg,#7d7aff,#4b3fd6)'},
    {id:'garage',name:'Garage',emoji:'🚗',grad:'linear-gradient(135deg,#ff6b6b,#c92a2a)'},
    {id:'contacts',name:'Contacts',emoji:'👤',grad:'linear-gradient(135deg,#63e6be,#0ca678)'},
    {id:'police',name:'Police',emoji:'🚓',grad:'linear-gradient(135deg,#4dabf7,#1c3d6e)'},
    {id:'settings',name:'Settings',emoji:'⚙',grad:'linear-gradient(135deg,#adb5bd,#495057)'}
  ];
  const el=document.createElement('div');el.id='twPhone';
  el.innerHTML=`<div class="glass"><div class="notch"></div><div class="status"><span class="clock"></span><span>●●● 5G 🔋</span></div><div id="twPhoneToast"></div><div class="screen"></div><div class="home-bar"><i></i></div></div>`;
  host.appendChild(el);
  const launch=document.createElement('button');launch.id='twPhoneBtn';launch.textContent='📱 PHONE · P';host.appendChild(launch);
  const screen=el.querySelector('.screen'),clock=el.querySelector('.clock'),toastEl=el.querySelector('#twPhoneToast');
  let open=false,view='home',tAcc=0,lastMsgs=-1,toastT=0;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hdr=(title)=>`<div class="hdr"><button data-go="home">‹ Home</button><h2>${title}</h2></div>`;
  const inMaps=(s,name)=>s.places.find(p=>p.name===name);
  function ptoast(t){toastEl.textContent=t;toastEl.classList.add('on');toastT=2.6}

  function taxiStatus(s){
    const t=s.taxi;
    const map={off:['No taxi','Call one and it will drive to you.'],coming:['Taxi on the way','It is driving to your position.'],waiting:['Taxi is here','Pick a destination below.'],riding:['On the way','To '+(t.dest||'')+' · fare '+t.fare+' CR'],arrived:['Arrived','Thanks for riding with Super Taxi.']};
    const [a,b]=map[t.state]||map.off;return{a,b}
  }

  function render(){
    const s=getState();
    if(view==='home'){
      const ts=taxiStatus(s);
      const live=s.taxi.state!=='off'?`<div class="card" style="margin-top:6px"><div class="k">Live</div><div class="v">${ts.a}</div><small style="opacity:.7">${ts.b}</small></div>`:'';
      screen.innerHTML=`<div class="hero">${s.greet}</div><div class="title">Super Phone</div>${live}
        <div class="apps">${APPS.map(a=>`<div class="app" data-go="${a.id}"><span class="ic" style="background:${a.grad}">${a.emoji}</span>${a.name}</div>`).join('')}</div>`;
    }
    else if(view==='messages'){
      const msgs=s.msgs.slice(-18).map(m=>m.who==='YOU'?`<div class="bubble me">${esc(m.t)}</div>`:`<div class="bubble"><b>${esc(m.who||'')}</b>${esc(m.t)}</div>`).join('')||'<div class="bubble">No messages yet. Say hi to someone nearby.</div>';
      screen.innerHTML=`${hdr('Messages')}<div>${msgs}</div><div class="composer"><input id="twPhoneIn" maxlength="120" placeholder="iMessage"><button class="btn" data-act="send">Send</button></div>`;
      lastMsgs=s.msgs.length;
    }
    else if(view==='maps'){
      const rows=s.places.map(p=>`<div class="row"><div>${esc(p.name)}<small>${Math.round(p.d)} m away</small></div><button class="btn ghost" data-act="taxi-go" data-arg="${esc(p.name)}">Taxi</button></div>`).join('');
      screen.innerHTML=`${hdr('Maps')}<div class="card"><div class="k">You are at</div><div class="v">${Math.round(s.pos.x)}, ${Math.round(s.pos.z)}</div></div>${rows}`;
    }
    else if(view==='taxi'){
      const ts=taxiStatus(s),t=s.taxi;
      const canCall=t.state==='off',canCancel=t.state==='coming'||t.state==='waiting';
      const dests=s.destinations.map(d=>`<div class="row"><div>${esc(d.name)}<small>${Math.round(d.d)} m · about ${d.fare} CR</small></div><button class="btn" data-act="taxi-go" data-arg="${esc(d.name)}" ${t.state==='waiting'?'':'disabled'}>Go</button></div>`).join('');
      screen.innerHTML=`${hdr('Super Taxi')}<div class="card"><div class="k">Status</div><div class="v">${ts.a}</div><small style="opacity:.7">${ts.b}</small>
        <div style="margin-top:10px">${canCall?'<button class="btn" data-act="taxi-call">Call taxi</button>':''}${canCancel?'<button class="btn red" data-act="taxi-cancel">Cancel</button>':''}</div></div>
        <div class="k" style="margin:8px 0 2px">Destinations</div>${dests}`;
    }
    else if(view==='guard'){
      const on=s.guard.on;
      screen.innerHTML=`${hdr('Bodyguard')}<div class="card"><div class="k">Your bodyguard</div><div class="v">${on?'On duty':'Off duty'}</div><small style="opacity:.7">He walks beside you on foot. When you drive the Super Benz, he follows in his own police car.</small>
        <div style="margin-top:12px"><button class="btn ${on?'red':''}" data-act="guard">${on?'Dismiss bodyguard':'Hire bodyguard'}</button></div></div>`;
    }
    else if(view==='garage'){
      screen.innerHTML=`${hdr('Super Benz')}<div class="card"><div class="k">Speed</div><div class="v">${s.kmh} km/h</div><div class="k" style="margin-top:10px">Gear</div><div class="v">${s.gear}</div></div>
        <div class="row"><div>Engine sound<small>Rev sound while you drive</small></div><button class="btn ghost" data-act="sound">${s.sound?'On':'Off'}</button></div>
        <div class="row"><div>Repaint<small>Cycle through paint jobs</small></div><button class="btn" data-act="repaint">Paint</button></div>`;
    }
    else if(view==='contacts'){
      screen.innerHTML=`${hdr('Contacts')}<div class="row"><div>${s.nearby?esc(s.nearby):'No one nearby'}<small>${s.nearby?'Close enough to talk':'Walk closer to someone'}</small></div>${s.nearby?'<button class="btn" data-act="call">Call</button>':''}</div>`;
    }
    else if(view==='police'){
      const st=s.places.find(p=>p.name==='Police Station');
      screen.innerHTML=`${hdr('Police')}<div class="card" style="text-align:center"><div style="font-size:40px">🚓</div><div class="v">Emergency</div><small style="opacity:.7">A patrol is alerted to your position.</small><div style="margin-top:12px"><button class="btn red" data-act="police">Call police</button></div></div>
        <div class="row"><div>Police Station<small>${st?Math.round(st.d)+' m away':''}</small></div><button class="btn ghost" data-act="taxi-go" data-arg="Police Station">Taxi</button></div>`;
    }
    else if(view==='settings'){
      screen.innerHTML=`${hdr('Settings')}<div class="row"><div>Engine sound<small>Rev and roar in the Benz</small></div><button class="btn ghost" data-act="sound">${s.sound?'On':'Off'}</button></div>
        <div class="row"><div>Speed units<small>Dial and garage</small></div><button class="btn ghost" data-act="units">${s.units.toUpperCase()}</button></div>`;
    }
  }
  function go(v){view=v;render()}

  screen.addEventListener('click',e=>{
    const g=e.target.closest('[data-go]');if(g)return go(g.dataset.go);
    const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
    const a=b.dataset.act;
    if(a==='send'){const i=el.querySelector('#twPhoneIn');if(i&&i.value.trim()){act('send',i.value);i.value=''}render();return}
    act(a,b.dataset.arg);render();
  });
  screen.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='twPhoneIn'){e.preventDefault();const i=e.target;if(i.value.trim()){act('send',i.value);i.value=''}render()}});
  launch.addEventListener('click',()=>api.toggle());

  const api={
    open(){if(open)return;open=true;el.style.display='flex';launch.style.display='none';view='home';render()},
    close(){if(!open)return;open=false;el.style.display='none';launch.style.display='block'},
    toggle(){open?api.close():api.open()},
    isOpen(){return open},
    notify(t){ptoast(t)},
    tick(dt){
      const n=new Date();clock.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
      if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on')}
      if(!open)return;
      tAcc+=dt;if(tAcc<.25)return;tAcc=0;
      if(view==='messages'){if(getState().msgs.length!==lastMsgs)render()}
      else if(view!=='home'&&view!=='settings')render();
      else if(view==='home')render();
    }
  };
  el.style.display='none';launch.style.display='block';
  return api;
}
