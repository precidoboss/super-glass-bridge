/* Town services for the player: a taxi that drives you across town on the road grid, and a personal bodyguard.
   The bodyguard walks beside you on foot. His police car waits parked by the garage until you get in a car;
   then it pulls out and follows you on the roads, stopping for cars ahead. When you get out it drives back to its spot. */

export function createServices({THREE,scene,ROADS,makeCarModel,getFront,pushOut,P,getCar,cars,destinations,toast,policeSpot,traffic}){
  const snap=v=>{let b=ROADS[0],bd=Infinity;for(const r of ROADS){const d=Math.abs(v-r);if(d<bd){bd=d;b=r}}return b};
  // route on the road grid: straight to the nearest crossing, along the grid, then to the target
  function routeTo(a,b){
    const ia={x:snap(a.x),z:snap(a.z)},ib={x:snap(b.x),z:snap(b.z)};
    const pts=[ia,{x:ib.x,z:ia.z},{x:ib.x,z:ib.z},{x:b.x,z:b.z}];
    const out=[];for(const p of pts){const l=out[out.length-1];if(!l||Math.hypot(p.x-l.x,p.z-l.z)>.3)out.push({x:p.x,z:p.z})}
    return out;
  }
  // how fast an object may go right now: slow for cars ahead, stop at red lights and for people on a crosswalk
  function controlSpeed(o,fx,fz,spd){
    let v=spd;
    for(const c of cars){
      const cx=c.g.position.x-o.x,cz=c.g.position.z-o.z,a=cx*fx+cz*fz,lat=Math.abs(cx*fz-cz*fx);
      if(a>0&&a<12&&lat<2.6)v=Math.min(v,Math.max(0,(a-6)*1.5));
    }
    if(traffic&&traffic.walkerNear(o.x+fx*6,o.z+fz*6,7))v=0;
    if(traffic){
      const horiz=Math.abs(fx)>Math.abs(fz);
      const onRoad=horiz?ROADS.some(z=>Math.abs(o.z-z)<4.5):ROADS.some(x=>Math.abs(o.x-x)<4.5);
      const green=horiz?traffic.hGreen():!traffic.hGreen();
      if(onRoad&&!green){
        for(const r of ROADS){const d=horiz?(r-o.x)*Math.sign(fx):(r-o.z)*Math.sign(fz);
          if(d>0&&d<12)v=Math.min(v,Math.max(0,(d-5.5)*1.6))}
      }
    }
    return v;
  }
  // move an object along its route; returns true when the route is finished
  function follow(o,dt,spd){
    const n=o.route[0];if(!n)return true;
    const dx=n.x-o.x,dz=n.z-o.z,d=Math.hypot(dx,dz);
    if(d<.4){o.route.shift();return o.route.length===0}
    const fx=dx/d,fz=dz/d;
    const cur=o.v||0,want=controlSpeed(o,fx,fz,spd);
    // brake firmly, pull away gently; never sit forever in a jam
    o.v=cur+(want-cur)*Math.min(1,dt*(want<cur?3:1.4));
    o.stuck=(o.v<.2&&want<.5)?(o.stuck||0)+dt:0;
    if(o.stuck>25)o.v=Math.max(o.v,2);
    const st=Math.min(d,o.v*dt);o.x+=fx*st;o.z+=fz*st;o.h=Math.atan2(-fx,-fz);
    return false;
  }

  /* ---------- taxi ---------- */
  const taxiModel=makeCarModel(0xffc83d,'sedan');
  const roofSign=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,.4),new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.6,.3)}));
  roofSign.position.set(0,1.85,0);taxiModel.add(roofSign);taxiModel.visible=false;scene.add(taxiModel);
  const taxi={state:'off',x:0,z:0,h:0,route:[],spd:14,fare:0,dest:null,wait:0};
  const fareTo=d=>Math.round(10+d*.15);
  function placeTaxi(){taxiModel.visible=taxi.state!=='off';taxiModel.position.set(taxi.x,0,taxi.z);taxiModel.rotation.y=taxi.h}
  function taxiCall(from){
    if(taxi.state==='coming'||taxi.state==='waiting'||taxi.state==='riding')return toast('YOUR TAXI IS ALREADY ON ITS WAY');
    const cands=[];for(const x of ROADS)for(const z of ROADS){const d=Math.hypot(x-P.x,z-P.z);if(d>30&&d<70)cands.push({x,z})}
    const s=from||(cands.length?cands[Math.floor(Math.random()*cands.length)]:{x:P.x+30,z:P.z+30});
    taxi.x=s.x;taxi.z=s.z;taxi.route=routeTo(taxi,P);taxi.state='coming';placeTaxi();
    toast('TAXI ON THE WAY · TWO MINUTES OR SO');
  }
  function taxiCancel(){if(taxi.state==='off')return;taxi.state='off';taxi.route=[];placeTaxi();toast('TAXI CANCELLED')}
  function taxiGo(name){
    if(taxi.state!=='waiting')return toast(taxi.state==='off'?'CALL A TAXI FIRST':'THE TAXI IS STILL ON ITS WAY');
    if(getCar().on)return toast('GET OUT OF THE CAR FIRST');
    const dest=destinations.find(d=>d.name===name)||destinations[0];
    taxi.dest=dest;taxi.fare=fareTo(Math.hypot(dest.x-P.x,dest.z-P.z));
    taxi.route=routeTo(taxi,dest);taxi.state='riding';
    toast('RIDING TO '+dest.name.toUpperCase()+' · FARE '+taxi.fare+' CR');
  }
  function updateTaxi(dt){
    if(taxi.state==='coming'){
      if(!taxi.route.length)taxi.route=routeTo(taxi,P);else{const L=taxi.route[taxi.route.length-1];L.x=P.x;L.z=P.z}
      if(follow(taxi,dt,taxi.spd)&&Math.hypot(taxi.x-P.x,taxi.z-P.z)<4){taxi.state='waiting';taxi.route=[];toast('TAXI IS HERE · PHONE ▸ TAXI TO RIDE')}
    }else if(taxi.state==='riding'){
      if(follow(taxi,dt,taxi.spd)){
        taxi.state='arrived';taxi.wait=3;P.x=taxi.dest.x;P.z=taxi.dest.z+1;P.y=0;P.vx=P.vz=P.vy=0;
        toast('ARRIVED AT '+taxi.dest.name.toUpperCase()+' · FARE '+taxi.fare+' CR');
      }else{P.x=taxi.x;P.z=taxi.z;P.y=0;P.vx=P.vz=P.vy=0}
    }else if(taxi.state==='arrived'){taxi.wait-=dt;if(taxi.wait<=0)taxi.state='off'}
    placeTaxi();
  }

  /* ---------- bodyguard, and his police car ---------- */
  const guardSp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));guardSp.scale.set(2.1,2.4,1);guardSp.visible=false;scene.add(guardSp);
  const police=makeCarModel(0xf4f7fb,'sedan');
  for(const x of[-1.01,1.01]){const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.22,3.4),new THREE.MeshStandardMaterial({color:0x1e4fa3,roughness:.4}));m.position.set(x,.72,0);police.add(m)}
  const redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.2)}),blueM=new THREE.MeshBasicMaterial({color:new THREE.Color(.2,.5,3)}),offM=new THREE.MeshBasicMaterial({color:new THREE.Color(.1,.1,.1)});
  const bars=[new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.3),offM),new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.3),offM)];
  bars[0].position.set(-.3,1.85,.1);bars[1].position.set(.3,1.85,.1);police.add(bars[0],bars[1]);
  police.visible=false;scene.add(police);
  const pol={x:policeSpot.x,z:policeSpot.z,h:0,route:[],mode:'parked',replan:0};
  police.position.set(pol.x,0,pol.z);
  const guard={on:false,x:0,z:0,moving:false,ph:0,t:0};

  function guardToggle(){
    guard.on=!guard.on;
    if(guard.on){
      guard.x=P.x+2;guard.z=P.z+2;pol.x=policeSpot.x;pol.z=policeSpot.z;pol.h=policeSpot.h||0;pol.route=[];pol.mode='parked';
      police.position.set(pol.x,0,pol.z);police.visible=true;
      toast('BODYGUARD HIRED · HIS POLICE CAR IS PARKED BY THE GARAGE UNTIL YOU DRIVE');
    }else{
      guardSp.visible=false;police.visible=false;pol.mode='parked';toast('BODYGUARD DISMISSED');
    }
  }
  function updatePolice(dt,car){
    // while you are in a car, the police car pulls out and keeps a set distance behind you by road
    if(car.on){
      const tx=car.x+Math.sin(car.h)*9,tz=car.z+Math.cos(car.h)*9;
      if(pol.mode!=='follow'){pol.mode='follow';pol.route=[]}
      pol.replan-=dt;
      if(pol.replan<=0||!pol.route.length){pol.replan=.8;pol.route=routeTo(pol,{x:tx,z:tz})}
      const far=Math.hypot(tx-pol.x,tz-pol.z);
      if(far>3)follow(pol,dt,Math.min(24,8+far*1.6));
      else{pol.h=car.h}
    }else if(pol.mode==='follow'||pol.mode==='return'){
      // you got out: drive back to the parking spot by road
      pol.mode='return';
      if(!pol.route.length)pol.route=routeTo(pol,{x:policeSpot.x,z:policeSpot.z});
      if(follow(pol,dt,14)&&Math.hypot(pol.x-policeSpot.x,pol.z-policeSpot.z)<2)pol.mode='parked';
    }
    police.position.set(pol.x,0,pol.z);police.rotation.y=pol.h;
    // lights: a siren while it is moving, and a slow blink while parked
    const siren=pol.mode!=='parked';guard.t+=dt;
    const red=siren?Math.floor(guard.t*5)%2===0:Math.floor(guard.t*1)%2===0;
    bars[0].material=red?redM:offM;bars[1].material=!red?blueM:offM;
  }
  function updateGuard(dt,car){
    if(!guard.on)return;
    if(car.on){guardSp.visible=false;return}
    // on foot: the guard walks beside you
    const dx=P.x-guard.x,dz=P.z-guard.z,d=Math.hypot(dx,dz);
    guard.moving=d>3;
    if(guard.moving){const st=Math.min(d-2.5,4*dt);guard.x+=dx/d*st;guard.z+=dz/d*st}
    const o={x:guard.x,z:guard.z};pushOut(o,.6,0);guard.x=o.x;guard.z=o.z;
    guardSp.visible=true;guardSp.position.set(guard.x,1.2,guard.z);
    const front=getFront(7);if(front){guardSp.material=front[guard.moving?Math.floor(guard.ph*4+Date.now()/160)%4:3]}
    guard.ph+=dt*(guard.moving?1.5:0);
  }

  // called every frame, after the car update
  function update(dt){const car=getCar();updateTaxi(dt);updatePolice(dt,car);updateGuard(dt,car)}

  return{
    update,
    taxiCall,taxiCancel,taxiGo,guardToggle,
    get taxi(){return{state:taxi.state,fare:taxi.fare,dest:taxi.dest?taxi.dest.name:null}},
    get guardOn(){return guard.on},
    get policeMode(){return pol.mode},
    get taxiPos(){return{x:taxi.x,z:taxi.z,v:taxi.v||0}}
  };
}
