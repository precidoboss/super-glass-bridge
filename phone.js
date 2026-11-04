/* Phone for the player: Messages, Maps, Garage, Contacts and Settings.
   Opened with P (or the phone button). While it is open the game's controls are paused. */
export function createPhone({host,getState,act}){
  const style=document.createElement('style');
  style.textContent=`#twPhone{position:absolute;right:16px;bottom:16px;width:272px;height:540px;background:#0b1410;border:6px solid #1e2c25;border-radius:34px;box-shadow:0 18px 50px rgba(0,0,0,.6);display:none;flex-direction:column;overflow:hidden;z-index:40;color:#eaf7ed;font-family:system-ui,sans-serif;font-size:13px}
#twPhone .top{display:flex;justify-content:space-between;padding:12px 18px 4px;font-size:12px;opacity:.85}
#twPhone .screen{flex:1;overflow:auto;padding:8px 14px}
#twPhone .bar{height:44px;display:flex;align-items:center;justify-content:center}
#twPhone .bar button{background:#1e2c25;color:#eaf7ed;border:0;border-radius:12px;padding:6px 16px;cursor:pointer}
#twPhone h3{margin:6px 0 10px;font-size:15px;color:#c8ff43}
#twPhone .apps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px}
#twPhone .app{background:#16231d;border-radius:18px;padding:14px 4px;text-align:center;cursor:pointer;font-size:12px}
#twPhone .app b{display:block;font-size:22px;margin-bottom:4px}
#twPhone .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e2c25}
#twPhone .msg{padding:6px 0;border-bottom:1px solid #1e2c25;font-size:12px;word-wrap:break-word}
#twPhone .msg b{color:#c8ff43}
#twPhone input{flex:1;background:#16231d;color:#eaf7ed;border:1px solid #2b3d34;border-radius:10px;padding:7px;font-size:12px}
#twPhone .btn{background:#c8ff43;color:#0b1410;border:0;border-radius:10px;padding:7px 12px;font-weight:700;cursor:pointer;margin-top:8px}
#twPhoneBtn{position:absolute;right:16px;bottom:16px;z-index:39;background:#1e2c25;color:#eaf7ed;border:0;border-radius:14px;padding:8px 12px;font-size:12px;cursor:pointer}`;
  document.head.appendChild(style);
  const el=document.createElement('div');el.id='twPhone';
  el.innerHTML=`<div class="top"><span class="clock"></span><span>5G ▮▮▮</span></div><div class="screen"></div><div class="bar"><button data-go="home">⌂ HOME</button></div>`;
  host.appendChild(el);
  const launch=document.createElement('button');launch.id='twPhoneBtn';launch.textContent='📱 PHONE (P)';host.appendChild(launch);
  const screen=el.querySelector('.screen'),clock=el.querySelector('.clock');
  let open=false,view='home',tAcc=0,lastMsgs=-1;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const S=()=>getState();

  function render(){
    const s=S();
    if(view==='home'){
      screen.innerHTML=`<h3>SUPER PHONE</h3><div class="apps">
        <div class="app" data-go="messages"><b>✉</b>Messages</div>
        <div class="app" data-go="maps"><b>🗺</b>Maps</div>
        <div class="app" data-go="garage"><b>🚗</b>Garage</div>
        <div class="app" data-go="contacts"><b>📞</b>Contacts</div>
        <div class="app" data-go="settings"><b>⚙</b>Settings</div></div>`;
    }else if(view==='messages'){
      const msgs=s.msgs.slice(-14).map(m=>`<div class="msg"><b>${esc(m.who||'')}</b> ${esc(m.t)}</div>`).join('')||'<div class="msg">No messages yet. Say hi to someone.</div>';
      screen.innerHTML=`<h3>Messages</h3>${msgs}<div style="display:flex;gap:6px;margin-top:10px"><input id="twPhoneIn" maxlength="120" placeholder="Type a message"><button class="btn" data-act="send">SEND</button></div>`;
      lastMsgs=s.msgs.length;
    }else if(view==='maps'){
      const rows=s.places.map(p=>`<div class="row"><span>${esc(p.name)}</span><span>${Math.round(p.d)} m</span></div>`).join('');
      screen.innerHTML=`<h3>Maps</h3><div class="row"><span>You are at</span><span>${Math.round(s.pos.x)}, ${Math.round(s.pos.z)}</span></div>${rows}`;
    }else if(view==='garage'){
      screen.innerHTML=`<h3>Super Benz</h3><div class="row"><span>Speed</span><span>${s.kmh} km/h</span></div><div class="row"><span>Gear</span><span>${s.gear}</span></div><div class="row"><span>Engine sound</span><span>${s.sound?'ON':'OFF'}</span></div><button class="btn" data-act="repaint">REPAINT</button><p style="opacity:.7;font-size:11px">Get in the car to drive. Speed shows on the dial.</p>`;
    }else if(view==='contacts'){
      screen.innerHTML=`<h3>Contacts</h3><div class="row"><span>${s.nearby?esc(s.nearby):'No one nearby'}</span>${s.nearby?'<button class="btn" data-act="call" style="margin:0">CALL</button>':''}</div>`;
    }else if(view==='settings'){
      screen.innerHTML=`<h3>Settings</h3><div class="row"><span>Engine sound</span><button class="btn" style="margin:0" data-act="sound">${s.sound?'ON':'OFF'}</button></div><div class="row"><span>Speed units</span><button class="btn" style="margin:0" data-act="units">${s.units.toUpperCase()}</button></div>`;
    }
  }
  function go(v){view=v;render()}
  screen.addEventListener('click',e=>{
    const b=e.target.closest('[data-go],[data-act]');if(!b)return;
    if(b.dataset.go)return go(b.dataset.go);
    const a=b.dataset.act;
    if(a==='send'){const i=el.querySelector('#twPhoneIn');if(i&&i.value.trim()){act('send',i.value);i.value='';render()}}
    else{act(a);render()}
  });
  el.querySelector('.bar').addEventListener('click',e=>{if(e.target.closest('[data-go]'))go('home')});
  launch.addEventListener('click',()=>api.toggle());
  const api={
    open(){if(open)return;open=true;el.style.display='flex';launch.style.display='none';view='home';render()},
    close(){if(!open)return;open=false;el.style.display='none';launch.style.display='block'},
    toggle(){open?api.close():api.open()},
    isOpen(){return open},
    // refresh the live screens a few times a second
    tick(dt){
      const n=new Date();clock.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
      if(!open)return;
      tAcc+=dt;if(tAcc<.25)return;tAcc=0;
      if(view==='messages'&&S().msgs.length!==lastMsgs){render()}
      else if(view==='maps'||view==='garage'||view==='contacts')render();
    }
  };
  el.style.display='none';launch.style.display='block';
  return api;
}
