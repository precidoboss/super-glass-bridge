/* ===================== SUPER TOWN · BODYGUARDS =====================
   Four bodyguards shadow the player on foot (rear + flank formation, they scan outward when you stand still,
   sprint to catch up, and wait beneath you while you fly). When the player gets into the Benz they run to
   their own two black escort Benzes, board (two per car) and the cars follow in convoy along the player's
   breadcrumb trail. When the player gets out, the convoy parks behind and the guards step out and rejoin.
   Chat: "guards off" / "guards on" (also: dismiss / call my bodyguards). */

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const SLOTS=[[-2.7,-2.2],[-2.7,2.2],[.6,-3.5],[.6,3.5]]; // [forward, right] in metres relative to the player's heading
const HOME=[{x:-32.2,z:10.6,h:Math.PI},{x:-32.2,z:4.3,h:Math.PI}]; // parked across the street from the player's Benz, facing the same way

export function makeGuards(ctx){
  const {THREE,scene,renderer,createBenz,benzMain,B,blocked,pushOut,P,car,emit,say,toast,spawnGuard,carBump,labelSprite}=ctx;
  const N=4,guards=[],cars=[];let enabled=true,wasOn=false,clock=0,heading=0,stillT=0,lastPX=P.x,lastPZ=P.z;
  const trail=[]; // breadcrumbs of the player's car

  for(let i=0;i<N;i++){const n=spawnGuard(i);n.guard=true;n.ai=null;guards.push({n,st:'foot',car:Math.floor(i/2),seat:i%2,seatT:0,scan:rnd(0,3),scanDir:1,sayCd:rnd(5,15)})}
  for(let i=0;i<2;i++){
    const b=createBenz(renderer,{env:benzMain.env,noBeam:true});b.setPaint(0);scene.add(b.group);
    const tag=labelSprite('ESCORT',{w:2.6,size:54,color:'#ffe9e9',glow:'#ff4d4f',plate:true});scene.add(tag);
    const c={b,tag,x:HOME[i].x,z:HOME[i].z,h:HOME[i].h,v:0,sa:0,roll:0,pit:0,_pv:0,state:'parked',trail:[],pt:{x:HOME[i].x,z:HOME[i].z},seated:0,settle:0};
    b.group.position.set(c.x,.02,c.z);b.group.rotation.y=c.h;cars.push(c)}

  const door=(c,side)=>({x:c.x+Math.cos(c.h)*2.1*side,z:c.z-Math.sin(c.h)*2.1*side});
  const hs=(g)=>g.n.hide=1;
  function spark(x,z){emit(x,1.2,z,10,0xff6a5a,1.8,1,2,.5)}

  /* ---------- steering for guards on foot ---------- */
  function steer(n,tx,tz,spd,dt){
    let dx=tx-n.x,dz=tz-n.z;const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;
    const hit=blocked(n.x+dx*2.4,n.z+dz*2.4,.5);
    if(hit){const side=Math.sign(dx*(hit.z-n.z)-dz*(hit.x-n.x))||1,ax=side>0?dz:-dz,az=side>0?-dx:dx;dx=dx*.3+ax;dz=dz*.3+az;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l}
    let sx=0,sz=0;for(const o of guards){if(o.n===n||o.n.hide)continue;const ex=n.x-o.n.x,ez=n.z-o.n.z,e=Math.hypot(ex,ez);if(e<1.4&&e>.01){sx+=ex/e*(1.4-e);sz+=ez/e*(1.4-e)}}
    const pe=Math.hypot(n.x-P.x,n.z-P.z);if(pe<1.5&&pe>.01){sx+=(n.x-P.x)/pe*(1.5-pe);sz+=(n.z-P.z)/pe*(1.5-pe)}
    let vx=dx+sx,vz=dz+sz;const l=Math.hypot(vx,vz)||1;vx=vx/l*spd;vz=vz/l*spd;
    n.vx+=(vx-n.vx)*Math.min(1,dt*7);n.vz+=(vz-n.vz)*Math.min(1,dt*7)}
  function halt(n,dt){n.vx*=Math.max(0,1-dt*9);n.vz*=Math.max(0,1-dt*9)}
  function look(n,dx,dz){if(Math.abs(dx)>.02)n.face=dx>0?1:-1;const [RX,RZ]=ctx.getRight();const s=dx*RX+dz*RZ;if(Math.abs(s)>.02)n.fs=s>0?1:-1}
  function placeNear(n,x,z){n.x=x;n.z=z;n.vx=n.vz=0;pushOut(n,.6,0)}

  /* ---------- car helpers ---------- */
  function parkSlot(i){ // convoy parked behind the player's Benz
    const back=7.6+i*6.8;let sx=car.x+Math.sin(car.h)*back,sz=car.z+Math.cos(car.h)*back;
    if(blocked(sx,sz,2.4)){for(const k of[3.6,-3.6,6.5,-6.5]){const ax=sx+Math.cos(car.h)*k,az=sz-Math.sin(car.h)*k;if(!blocked(ax,az,2.4)){sx=ax;sz=az;break}}}
    return{x:sx,z:sz}}
  function target(c,tx,tz,vDes,dt){
    const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz)||1;let e=wrap(Math.atan2(-dx,-dz)-c.h);
    // target is behind us and we are slow: reverse out until we are roughly pointing the right way
    if(!c.back&&Math.abs(e)>2.0&&Math.abs(c.v)<4&&d>4.5)c.back=true;if(c.back&&(Math.abs(e)<1.0||d<3.8))c.back=false;
    if(c.back){const e2=wrap(e+Math.PI),sa=clamp(-e2*1.5,-.5,.5);c.sa+=(sa-c.sa)*(1-Math.exp(-dt*7));return{d,e,vDes:-4.5}}
    // obstacle probes (left / centre / right)
    const probe=(a,L)=>blocked(c.x-Math.sin(c.h+a)*L,c.z-Math.cos(c.h+a)*L,1.7);
    if(probe(0,7)||probe(0,3.5)){const l=!probe(.55,7),r=!probe(-.55,7);e=l?.8:r?-.8:(e>=0?.8:-.8);vDes=Math.min(vDes,5)}
    else if(probe(.4,5)){e=-.5;vDes=Math.min(vDes,9)}else if(probe(-.4,5)){e=.5;vDes=Math.min(vDes,9)}
    vDes=Math.min(vDes,Math.max(4,24-Math.abs(e)*13));
    const sa=clamp(e*1.5,-.5,.5);c.sa+=(sa-c.sa)*(1-Math.exp(-dt*7));
    return{d,e,vDes}}
  function drive(c,dt,vDes,fromBrake){
    // pinned against something? back out for a moment, then try again
    if(vDes>3&&Math.abs(c.v)<1.2)c.stuckT=(c.stuckT||0)+dt;else c.stuckT=Math.max(0,(c.stuckT||0)-dt*2);
    if(c.stuckT>1.1){c.rev=1.4;c.stuckT=0}
    if(c.rev>0){c.rev-=dt;vDes=-5.5}
    const rate=vDes<c.v?30:11;c.v+=clamp(vDes-c.v,-rate*dt,rate*dt);
    const sp=Math.abs(c.v),sA=c.sa*(1-.5*clamp(sp/24,0,1));
    c.h+=(c.v/3.0)*Math.tan(sA)*dt;c.x+=-Math.sin(c.h)*c.v*dt;c.z+=-Math.cos(c.h)*c.v*dt;
    const hit=carBump(c);if(hit>.001)c.v*=Math.max(.2,1-hit*6);
    const accel=(c.v-c._pv)/Math.max(dt,.001);c._pv=c.v;
    c.roll+=((-c.sa*sp*.0045)-c.roll)*(1-Math.exp(-dt*6));c.pit+=((clamp(accel*.0035,-.05,.05))-c.pit)*(1-Math.exp(-dt*6));
    c.b.group.position.set(c.x,.02,c.z);c.b.group.rotation.y=c.h;c.b.pose(c.v,sA,dt,c.roll,c.pit);c.b.setBrake(fromBrake||vDes<c.v-1);c.b.setLights(sp>.5||c.state==='follow');
    c.pt.x=c.x;c.pt.z=c.z;c.tag.position.set(c.x,2.9,c.z)}
  function crumbs(t,x,z){const l=t[t.length-1];if(!l||Math.hypot(l.x-x,l.z-z)>1.4){t.push({x,z,id:(t.seq=(t.seq||0)+1)});if(t.length>320)t.shift()}}
  function trailTarget(lead,gap){let acc=0,px=lead.x,pz=lead.z;const t=lead.trail;for(let k=t.length-1;k>=0;k--){const q=t[k];acc+=Math.hypot(q.x-px,q.z-pz);px=q.x;pz=q.z;if(acc>=gap)return q}
    return{x:lead.x+Math.sin(lead.h)*gap,z:lead.z+Math.cos(lead.h)*gap}}

  /* follow the leader's exact path: nearest crumb to us, then a lookahead crumb; also the along-path gap to the leader */
  function pathFollow(c,lead,L){
    const t=lead.trail;if(t.length<2)return{tx:lead.x+Math.sin(lead.h)*L,tz:lead.z+Math.cos(lead.h)*L,gap:Math.hypot(lead.x-c.x,lead.z-c.z),end:true};
    const base=t[0].id;let from=c.ci!==undefined?clamp(c.ci-base-10,0,t.length-1):0,bi=from,bd=1e9;
    for(let k=from;k<t.length;k++){const d=Math.hypot(t[k].x-c.x,t[k].z-c.z);if(d<bd){bd=d;bi=k}}
    c.ci=t[bi].id;
    let acc=0,px=t[bi].x,pz=t[bi].z,k=bi,tgt=null;
    for(k=bi+1;k<t.length;k++){acc+=Math.hypot(t[k].x-px,t[k].z-pz);px=t[k].x;pz=t[k].z;if(!tgt&&acc>=L)tgt=t[k]}
    const gap=bd+acc+Math.hypot(lead.x-px,lead.z-pz);
    return{tx:tgt?tgt.x:lead.x,tz:tgt?tgt.z:lead.z,gap,end:!tgt}}

  /* ---------- transitions ---------- */
  function onEnterCar(){
    guards.forEach((g,i)=>{if(g.st==='seated')return;g.st='toCar';g.seatT=0;if(g.n.hide){g.n.hide=0}});
    cars.forEach((c,i)=>{if(Math.hypot(c.x-car.x,c.z-car.z)>45){const s=parkSlot(i);spark(c.x,c.z);c.x=s.x;c.z=s.z;c.h=car.h;c.v=0;c.state='parked';c.b.group.position.set(c.x,.02,c.z);c.b.group.rotation.y=c.h;spark(c.x,c.z)}});
    const g=pick(guards);say(g.n,pick(['To the cars!','Moving out, boss!','Escort, with me!']),2.6)}
  function onExitCar(){
    for(const g of guards)if(g.st==='toCar'){g.st='foot'}
    for(const c of cars)if(c.state==='follow')c.state='park'}

  /* ---------- per-frame ---------- */
  function update(dt){
    if(!enabled)return;clock+=dt;
    // player's heading + stillness
    const dxm=P.x-lastPX,dzm=P.z-lastPZ,pv=Math.hypot(P.vx||0,P.vz||0),mv=Math.hypot(dxm,dzm)/Math.max(dt,1e-3);lastPX=P.x;lastPZ=P.z;
    if(!car.on){if(pv>.6||mv>.8){heading=pv>.6?Math.atan2(P.vz,P.vx):Math.atan2(dzm,dxm);stillT=0}else stillT+=dt}
    if(car.on&&!wasOn)onEnterCar();if(!car.on&&wasOn)onExitCar();wasOn=car.on;
    if(car.on||Math.abs(car.v)>.5)crumbs(trail,car.x,car.z);

    /* guards */
    for(let i=0;i<guards.length;i++){const g=guards[i],n=g.n,c=cars[g.car];
      g.sayCd-=dt;
      switch(g.st){
        case 'foot':{
          const f=[Math.cos(heading),Math.sin(heading)],r=[-f[1],f[0]],sl=SLOTS[i];
          let tx=P.x+f[0]*sl[0]+r[0]*sl[1],tz=P.z+f[1]*sl[0]+r[1]*sl[1];
          if(blocked(tx,tz,.7)){tx=P.x+r[0]*sl[1]*.5;tz=P.z+r[1]*sl[1]*.5}
          const d=Math.hypot(tx-n.x,tz-n.z),dp=Math.hypot(P.x-n.x,P.z-n.z);
          if(dp>70){placeNear(n,tx,tz);spark(n.x,n.z)}
          const pspd=Math.max(pv,mv);
          if(d>.9){steer(n,tx,tz,clamp(d*2.4,0,Math.max(4.2,pspd*1.2+2.5)+(dp>14?5:0)),dt)}
          else{halt(n,dt);
            g.scan-=dt;if(stillT>1){if(g.scan<=0){g.scan=rnd(2.2,4.5);g.scanDir*=-1}const a=Math.atan2(n.z-P.z,n.x-P.x)+g.scanDir*.9;look(n,Math.cos(a),Math.sin(a))}
            else look(n,P.x-n.x+Math.cos(heading)*3,P.z-n.z+Math.sin(heading)*3)}
          if(g.sayCd<=0&&dp<9){g.sayCd=rnd(25,50);say(n,pick(['All clear.','Eyes open.','Clear on the left.','Stay close, boss.','Area secure.']),2.6)}
          break}
        case 'toCar':{
          g.seatT+=dt;const side=(n.x-c.x)*Math.cos(c.h)-(n.z-c.z)*Math.sin(c.h)>=0?1:-1,dr=door(c,side),d=Math.hypot(dr.x-n.x,dr.z-n.z);
          steer(n,dr.x,dr.z,d>12?9:6.2,dt);
          if(d<1.5||g.seatT>7){if(d>3){spark(n.x,n.z)}hs(g);g.st='seated';c.seated++;spark(c.x,c.z)}
          break}
        case 'seated':{n.vx=n.vz=0;n.x=c.x;n.z=c.z;
          if(!car.on&&c.state==='parked'&&Math.hypot(car.x-c.x,car.z-c.z)<22&&Math.abs(car.v)<.8){ // player is out and the escort has arrived: step out
            const side=g.seat?1:-1,dr=door(c,side);n.hide=0;placeNear(n,dr.x,dr.z);c.seated=Math.max(0,c.seated-1);g.st='foot';spark(n.x,n.z);g.sayCd=rnd(1,3)}
          break}
      }
      // integrate (not while hidden)
      if(!n.hide){n.x+=n.vx*dt;n.z+=n.vz*dt;pushOut(n,.6,0);const rr=Math.hypot(n.x,n.z);if(rr>104){n.x*=104/rr;n.z*=104/rr}}
      const sp=Math.hypot(n.vx,n.vz);if(sp>.25&&Math.abs(n.vx)>.2)n.face=n.vx>0?1:-1;n.ph+=dt*sp*.45}

    /* escort cars */
    cars.forEach((c,i)=>{
      const lead=i===0?{x:car.x,z:car.z,h:car.h,v:car.v,trail}:{x:cars[0].x,z:cars[0].z,h:cars[0].h,v:cars[0].v,trail:cars[0].trail};
      if(car.on&&c.seated>0&&c.state!=='follow')c.state='follow';
      if(!car.on&&c.state==='follow')c.state='park';
      if(c.state==='follow'){
        const want=i===0?9.5:8.5,dL=Math.hypot(lead.x-c.x,lead.z-c.z);
        if(dL>60){const t=trailTarget(lead,want);c.x=t.x;c.z=t.z;c.h=lead.h;c.v=lead.v;c.ci=undefined;c.back=false;spark(c.x,c.z)}
        const pf=pathFollow(c,lead,clamp(5+Math.abs(c.v)*.35,6,12)),vd0=clamp(lead.v+(pf.gap-want)*1.1,0,26),tg=target(c,pf.tx,pf.tz,vd0,dt);
        drive(c,dt,pf.gap<want*.8?Math.max(0,Math.min(lead.v*.6,tg.vDes)):tg.vDes,false)}
      else if(c.state==='park'){
        const s=parkSlot(i),tg=target(c,s.x,s.z,clamp(Math.hypot(s.x-c.x,s.z-c.z)*1.2,0,12),dt);
        drive(c,dt,tg.d<3.4?0:tg.vDes,tg.d<5);
        if(tg.d<3.6&&Math.abs(c.v)<2){c.state='parked';c.settle=0}}
      else{ // parked: settle the heading, then idle
        if(c.settle<1){c.settle+=dt;c.h+=wrap(car.h-c.h)*Math.min(1,dt*3)*(Math.hypot(car.x-c.x,car.z-c.z)<30?1:0)}
        drive(c,dt,0,true);c.sa*=.9}
      if(Math.abs(c.v)>.5)crumbs(c.trail,c.x,c.z)
    });
  }

  /* ---------- reset / toggle ---------- */
  function reset(){
    wasOn=false;trail.length=0;stillT=0;heading=-1;
    cars.forEach((c,i)=>{c.x=HOME[i].x;c.z=HOME[i].z;c.h=HOME[i].h;c.v=0;c.sa=0;c.state='parked';c.seated=0;c.trail.length=0;c.b.group.position.set(c.x,.02,c.z);c.b.group.rotation.y=c.h;c.b.group.visible=enabled;c.tag.visible=enabled});
    guards.forEach((g,i)=>{g.st='foot';const sl=SLOTS[i];g.n.hide=enabled?0:1;placeNear(g.n,P.x+sl[0]*1.2+3,P.z+sl[1]*1.2+3)})}
  function setEnabled(on){
    if(on===enabled)return;enabled=on;
    for(const c of cars){c.b.group.visible=on;c.tag.visible=on}
    if(on){reset()}else{for(const g of guards){g.n.hide=1;g.st='foot'}for(const c of cars){c.seated=0;c.v=0}}}
  const RE_OFF=/\b(guards?|bodyguards?|escort)\b.*\b(off|away|go|dismiss|stand down|leave)\b|\b(dismiss|stand down|send away)\b.*\b(guards?|bodyguards?|escort)\b/,RE_ON=/\b(guards?|bodyguards?|escort)\b.*\b(on|back|here|come|call|duty)\b|\bcall\b.*\b(guards?|bodyguards?)\b/;
  function onChat(text){const t=text.toLowerCase();
    if(!/guard|escort/.test(t))return false;
    if(RE_OFF.test(t)){setEnabled(false);toast('BODYGUARDS DISMISSED');return true}
    if(RE_ON.test(t)){const was=enabled;setEnabled(true);toast('BODYGUARDS ON DUTY');if(was)reset();return true}
    if(enabled){const g=guards.find(q=>!q.n.hide)||guards[0];setTimeout(()=>say(g.n,pick(['Yes boss.','We have you covered.','Right behind you, boss.']),3),600)}
    return false}

  return{update,reset,onChat,setEnabled,guards,cars,get enabled(){return enabled},stats(){return{enabled,guards:guards.map(g=>g.st),gpos:guards.map(g=>[+g.n.x.toFixed(1),+g.n.z.toFixed(1),g.n.hide]),cars:cars.map(c=>({s:c.state,seated:c.seated,x:+c.x.toFixed(1),z:+c.z.toFixed(1),v:+c.v.toFixed(1)}))}}};
}
