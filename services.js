/* Town services for the player: a taxi that drives you across town on the road grid, and a personal bodyguard
   who follows you on foot and rides in his own police car when you drive the Super Benz. */

export function createServices({THREE,scene,ROADS,makeCarModel,getFront,pushOut,P,car,cars,destinations,toast}){
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const snap=v=>{let b=ROADS[0],bd=Infinity;for(const r of ROADS){const d=Math.abs(v-r);if(d<bd){bd=d;b=r}}return b};
  // route on the road grid: straight to the nearest crossing, along the grid, then to the target
  function routeTo(a,b){
    const ia={x:snap(a.x),z:snap(a.z)},ib={x:snap(b.x),z:snap(b.z)};
    const pts=[ia,{x:ib.x,z:ia.z},{x:ib.x,z:ib.z},{x:b.x,z:b.z}];
    const out=[];for(const p of pts){const l=out[out.length-1];if(!l||Math.hypot(p.x-l.x,p.z-l.z)>.3)out.push({x:p.x,z:p.z})}
    return out;
  }

  /* ---------- taxi ---------- */
  const taxiModel=makeCarModel(0xffc83d,'sedan');
  const roofSign=new THREE.Mesh(new THREE.BoxGeometry(.9,.3,.4),new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.6,.3)}));
  roofSign.position.set(0,1.85,0);taxiModel.add(roofSign);taxiModel.visible=false;scene.add(taxiModel);
  const taxi={state:'off',x:0,z:0,h:0,route:[],spd:13,fare:0,dest:null,wait:0,replan:0};
  const fareTo=d=>Math.round(10+d*.15);

  function drive(dt){
    const n=taxi.route[0];if(!n)return true;
    const dx=n.x-taxi.x,dz=n.z-taxi.z,d=Math.hypot(dx,dz);
    if(d<.4){taxi.route.shift();return taxi.route.length===0}
    const fx=dx/d,fz=dz/d;
    // wait while a traffic car is just ahead in the same direction
    let block=false;
    for(const c of cars){const cx=c.g.position.x-taxi.x,cz=c.g.position.z-taxi.z,ahead=cx*fx+cz*fz,lat=Math.abs(cx*fz-cz*fx);if(ahead>0&&ahead<7&&lat<2.4){block=true;break}}
    if(!block){const st=Math.min(d,taxi.spd*dt);taxi.x+=fx*st;taxi.z+=fz*st;taxi.h=Math.atan2(-fx,-fz)}
    return false;
  }
  function placeTaxi(){taxiModel.visible=taxi.state!=='off';taxiModel.position.set(taxi.x,0,taxi.z);taxiModel.rotation.y=taxi.h}

  function taxiCall(){
    if(taxi.state==='coming'||taxi.state==='waiting'||taxi.state==='riding')return toast('YOUR TAXI IS ALREADY ON ITS WAY');
    // start from a crossing 30-60 units away, the nearest one that is not right next to you
    const cands=[];for(const x of ROADS)for(const z of ROADS){const d=Math.hypot(x-P.x,z-P.z);if(d>30&&d<70)cands.push({x,z})}
    const s=cands.length?cands[Math.floor(Math.random()*cands.length)]:{x:P.x+30,z:P.z+30};
    taxi.x=s.x;taxi.z=s.z;taxi.route=routeTo(taxi,P);taxi.state='coming';placeTaxi();
    toast('TAXI ON THE WAY · TWO MINUTES OR SO');
  }
  function taxiCancel(){if(taxi.state==='off')return;taxi.state='off';taxi.route=[];placeTaxi();toast('TAXI CANCELLED')}
  function taxiGo(name){
    if(taxi.state!=='waiting')return toast(taxi.state==='off'?'CALL A TAXI FIRST':'THE TAXI IS STILL ON ITS WAY');
    if(car.on)return toast('GET OUT OF THE BENZ FIRST');
    const dest=destinations.find(d=>d.name===name)||destinations[0];
    taxi.dest=dest;taxi.fare=fareTo(Math.hypot(dest.x-P.x,dest.z-P.z));
    taxi.route=routeTo(taxi,dest);taxi.state='riding';
    toast('RIDING TO '+dest.name.toUpperCase()+' · FARE '+taxi.fare+' CR');
  }

  function updateTaxi(dt){
    if(taxi.state==='coming'){
      // plan the road route once, then just follow the player with the last waypoint
      if(!taxi.route.length)taxi.route=routeTo(taxi,P);
      else{const L=taxi.route[taxi.route.length-1];L.x=P.x;L.z=P.z}
      if(drive(dt)&&Math.hypot(taxi.x-P.x,taxi.z-P.z)<4){taxi.state='waiting';taxi.route=[];toast('TAXI IS HERE · PHONE ▸ TAXI TO RIDE')}
    }else if(taxi.state==='riding'){
      if(drive(dt)){
        taxi.state='arrived';taxi.wait=3;P.x=taxi.dest.x;P.z=taxi.dest.z+1;P.y=0;P.vx=P.vz=P.vy=0;
        toast('ARRIVED AT '+taxi.dest.name.toUpperCase()+' · FARE '+taxi.fare+' CR');
      }else{P.x=taxi.x;P.z=taxi.z;P.y=0;P.vx=P.vz=P.vy=0}
    }else if(taxi.state==='arrived'){
      taxi.wait-=dt;if(taxi.wait<=0){taxi.state='off'}
    }
    placeTaxi();
  }

  /* ---------- bodyguard with his own police car ---------- */
  const guardSp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));guardSp.scale.set(2.1,2.4,1);guardSp.visible=false;scene.add(guardSp);
  const police=makeCarModel(0xf4f7fb,'sedan');
  const stripe=(x)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.04,.22,3.4),new THREE.MeshStandardMaterial({color:0x1e4fa3,roughness:.4}));m.position.set(x,.72,0);police.add(m)};
  stripe(-1.01);stripe(1.01);
  const redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.2)}),blueM=new THREE.MeshBasicMaterial({color:new THREE.Color(.2,.5,3)});
  const barMat=[new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.3),redM),new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.3),blueM)];
  barMat[0].position.set(-.3,1.85,.1);barMat[1].position.set(.3,1.85,.1);police.add(barMat[0],barMat[1]);
  police.visible=false;scene.add(police);
  const guard={on:false,x:0,z:0,moving:false,ph:0,lights:0};

  function guardToggle(){
    guard.on=!guard.on;
    if(guard.on){
      guard.x=P.x+2;guard.z=P.z+2;police.position.set(P.x+5,0,P.z+5);police.visible=true;
      toast('BODYGUARD HIRED · HE WILL FOLLOW YOU, AND DRIVE HIS OWN CAR WHEN YOU DO');
    }else{
      guardSp.visible=false;police.visible=false;toast('BODYGUARD DISMISSED');
    }
  }
  function updateGuard(dt){
    if(!guard.on)return;
    guard.lights+=dt;const red=Math.floor(guard.lights*4)%2===0;
    barMat[0].material=red?redM:new THREE.MeshBasicMaterial({color:new THREE.Color(.1,.1,.1)});
    barMat[1].material=!red?blueM:new THREE.MeshBasicMaterial({color:new THREE.Color(.1,.1,.1)});
    if(car.on){
      // follow the Benz in the police car, nine units behind it
      const tx=car.x+Math.sin(car.h)*9,tz=car.z+Math.cos(car.h)*9;
      police.position.x+=(tx-police.position.x)*Math.min(1,dt*3);police.position.z+=(tz-police.position.z)*Math.min(1,dt*3);
      police.rotation.y=car.h;police.visible=true;guardSp.visible=false;
    }else{
      // on foot: the guard walks beside you, and the police car parks by the curb
      const px=P.x+3,pz=P.z+3;
      const pdx=px-police.position.x,pdz=pz-police.position.z;
      police.position.x+=pdx*Math.min(1,dt*2);police.position.z+=pdz*Math.min(1,dt*2);
      police.rotation.y=Math.atan2(-pdx||0,-pdz||-1);police.visible=true;
      const dx=P.x-guard.x,dz=P.z-guard.z,d=Math.hypot(dx,dz);
      guard.moving=d>3;
      if(guard.moving){const st=Math.min(d-2.5,4*dt);guard.x+=dx/d*st;guard.z+=dz/d*st}
      const o={x:guard.x,z:guard.z};pushOut(o,.6,0);guard.x=o.x;guard.z=o.z;
      guardSp.visible=true;guardSp.position.set(guard.x,1.2,guard.z);
      const front=getFront(7);if(front){guardSp.material=front[guard.moving?Math.floor(guard.ph*4+Date.now()/160)%4:3]}
      guard.ph+=dt*(guard.moving?1.5:0);
    }
  }

  // called every frame, after the car update
  function update(dt){updateTaxi(dt);updateGuard(dt)}

  return{
    update,
    taxiCall,taxiCancel,taxiGo,guardToggle,
    get taxi(){return{state:taxi.state,fare:taxi.fare,dest:taxi.dest?taxi.dest.name:null}},
    get guardOn(){return guard.on}
  };
}
