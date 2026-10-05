import * as THREE from 'three';

export function createSuperHouse({scene,player,labelSprite,toast}){
  const H={x:72,z:-72,w:30,d:24,floorH:7.5,floors:3};
  const g=new THREE.Group();g.position.set(H.x,0,H.z);scene.add(g);
  const mats={
    wall:new THREE.MeshStandardMaterial({color:0x17231b,roughness:.72,metalness:.12}),
    trim:new THREE.MeshStandardMaterial({color:0x243c2b,roughness:.42,metalness:.45}),
    glass:new THREE.MeshStandardMaterial({color:0x75ff9c,roughness:.08,metalness:.2,transparent:true,opacity:.2,emissive:0x164d2b,emissiveIntensity:.8}),
    wood:new THREE.MeshStandardMaterial({color:0x6a4329,roughness:.55}),
    cream:new THREE.MeshStandardMaterial({color:0xd9e4d4,roughness:.8}),
    dark:new THREE.MeshStandardMaterial({color:0x0b120e,roughness:.45,metalness:.65}),
    gold:new THREE.MeshStandardMaterial({color:0xd4a84f,roughness:.28,metalness:.7,emissive:0x4b2d08,emissiveIntensity:.3}),
    neon:new THREE.MeshBasicMaterial({color:0xbaff58}),
    rug:new THREE.MeshStandardMaterial({color:0x263b2c,roughness:.9})
  };
  const box=(w,h,d,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o};
  const cyl=(r,h,m,x=0,y=0,z=0,seg=20)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),m);o.position.set(x,y,z);g.add(o);return o};

  box(H.w,.7,H.d,mats.dark,0,.35,0);
  for(let f=0;f<3;f++){const y=.8+f*H.floorH;box(H.w-.8,.28,H.d-.8,mats.trim,0,y,0);box(H.w-.9,.08,H.d-.9,mats.cream,0,y+.16,0)}

  const wallT=.65;
  box(wallT,H.floorH*3,H.d,mats.wall,-H.w/2+wallT/2,H.floorH*1.5,0);
  box(wallT,H.floorH*3,H.d,mats.wall,H.w/2-wallT/2,H.floorH*1.5,0);
  box(H.w,H.floorH*3,wallT,mats.wall,0,H.floorH*1.5,H.d/2-wallT/2);
  for(let f=0;f<3;f++){const y=.95+f*H.floorH;box(H.w-.5,.22,.45,mats.gold,0,y,H.d/2+.05);box(H.w-.5,.12,.16,mats.neon,0,y+.17,H.d/2+.1)}

  for(let f=0;f<3;f++){const y=1.7+f*H.floorH;box(.35,3,.35,mats.gold,-H.w/2+.8,y,-H.d/2+.5);box(.35,3,.35,mats.gold,H.w/2-.8,y,-H.d/2+.5);box(H.w-1.6,.16,.16,mats.neon,0,y+1.5,-H.d/2+.55)}

  const ex=0,ez=1.5;
  box(5.4,H.floorH*3-1,5.2,mats.glass,ex,H.floorH*1.5,ez);
  box(5.8,.18,5.6,mats.gold,ex,.95,ez);
  box(.16,H.floorH*3-1,.16,mats.neon,ex-2.55,H.floorH*1.5,ez-2.55);
  const car=box(4.1,.22,4.1,mats.dark,ex,1.08,ez);
  const liftRing=new THREE.Mesh(new THREE.TorusGeometry(1.8,.09,8,48),mats.neon);liftRing.rotation.x=Math.PI/2;liftRing.position.set(ex,1.22,ez);g.add(liftRing);
  const doors=[];
  for(let f=0;f<3;f++){const y=1.1+f*H.floorH;for(const sx of[-1,1])doors.push(box(1.05,2.5,.08,mats.dark,sx*1.05,y+.9,ez-2.62));box(2.5,.06,.12,mats.neon,0,y+2.25,ez-2.68)}

  function rug(x,z,w,d,y){box(w,.08,d,mats.rug,x,y+.05,z)}
  function sofa(x,z,y,rot=0){
    const s=new THREE.Group();s.position.set(x,y,z);s.rotation.y=rot;g.add(s);
    const b=new THREE.Mesh(new THREE.BoxGeometry(5.2,1.2,1.5),mats.cream);b.position.y=.7;s.add(b);
    const back=new THREE.Mesh(new THREE.BoxGeometry(5.2,2,.55),mats.wall);back.position.set(0,1.35,.55);s.add(back);
    for(const sx of[-2.15,2.15]){const a=new THREE.Mesh(new THREE.BoxGeometry(.5,1.7,1.7),mats.wall);a.position.set(sx,1,0);s.add(a)}
  }
  function table(x,z,y,w=3,d=1.6){
    box(w,.25,d,mats.wood,x,y+1,z);for(const sx of[-1,1])for(const sz of[-1,1])box(.16,1,.16,mats.dark,x+sx*(w/2-.25),y+.5,z+sz*(d/2-.25))
  }
  function bed(x,z,y,rot=0){
    const b=new THREE.Group();b.position.set(x,y,z);b.rotation.y=rot;g.add(b);
    const mattress=new THREE.Mesh(new THREE.BoxGeometry(5.2,.55,3.3),mats.cream);mattress.position.y=.65;b.add(mattress);
    const frame=new THREE.Mesh(new THREE.BoxGeometry(5.6,1,3.7),mats.wood);frame.position.y=.35;b.add(frame);
    const head=new THREE.Mesh(new THREE.BoxGeometry(5.6,3.2,.3),mats.wall);head.position.set(0,1.7,1.7);b.add(head);
    const pillow=new THREE.Mesh(new THREE.BoxGeometry(1.4,.35,.8),mats.gold);pillow.position.set(-1.5,1.05,.8);b.add(pillow);
  }
  function lamp(x,z,y){cyl(.18,2,mats.gold,x,y+1,z,12);cyl(.65,.45,mats.neon,x,y+2.1,z,16)}
  function plant(x,z,y){cyl(.45,.65,mats.wood,x,y+.32,z,16);const c=new THREE.Mesh(new THREE.SphereGeometry(1.05,12,10),new THREE.MeshStandardMaterial({color:0x3e8b45,roughness:.8}));c.position.set(x,y+1.35,z);g.add(c)}
  function tv(x,z,y,rot=0){
    const s=box(4.2,2.5,.18,mats.dark,x,y+1.7,z);s.rotation.y=rot;
    const glow=box(3.7,2,.05,mats.neon,x,y+1.7,z);glow.material=new THREE.MeshBasicMaterial({color:0x74ffb0,transparent:true,opacity:.22});glow.rotation.y=rot;
  }

  rug(7,-5,11,8,0);sofa(7,-5,0,0);table(7,0,0,4,2);tv(7,6,0,Math.PI);plant(-8,-7,0);plant(10,7,0);lamp(3,-7,0);
  box(9,.7,5,mats.wood,7,1.15,8);box(9,2.2,.35,mats.wall,7,2.4,10.2);
  for(let i=0;i<3;i++)cyl(.18,1.6,mats.gold,4+i*3,1.95,7,12);
  const homeSign=labelSprite('SUPER HOME',{w:9,size:68,glow:'#d4ff3a',plate:true});homeSign.position.set(0,24.4,-12.5);g.add(homeSign);

  bed(-7,-4,H.floorH,0);bed(8,-5,H.floorH,Math.PI);rug(-7,-4,8,6,H.floorH);rug(8,-5,8,6,H.floorH);table(7,5,H.floorH,5,2);lamp(-11,7,H.floorH);plant(10,8,H.floorH);box(3,.9,2.8,mats.wood,-10,9.2,0);box(3,1.8,.2,mats.dark,-10,10.3,-1.3);

  rug(-7,3,10,8,H.floorH*2);sofa(-6,3,H.floorH*2,Math.PI/2);table(-1,3,H.floorH*2,3,2);tv(-10,3,H.floorH*2,Math.PI/2);plant(10,-5,H.floorH*2);
  box(8,.3,5,mats.glass,7,17.1,5);box(8,1.8,.25,mats.gold,7,18,7.3);for(let i=0;i<5;i++)box(.8,.3,.8,mats.neon,4+i*1.4,18.3,6.8);lamp(-8,-7,H.floorH*2);lamp(9,-7,H.floorH*2);

  box(H.w-.8,.3,H.d-.8,mats.dark,0,H.floorH*3+.3,0);
  const roofRing=new THREE.Mesh(new THREE.TorusGeometry(9,.13,8,64),mats.neon);roofRing.rotation.x=Math.PI/2;roofRing.position.set(0,H.floorH*3+.55,0);g.add(roofRing);
  const sign=labelSprite('SUPER TOWN RESIDENCE',{w:15,size:58,glow:'#baff58',plate:true});sign.position.set(0,25.8,-H.d/2-.3);g.add(sign);

  const spawn=new THREE.Mesh(new THREE.CylinderGeometry(3.4,.2,32),new THREE.MeshStandardMaterial({color:0x203826,metalness:.65,roughness:.25,emissive:0x173b1e,emissiveIntensity:.7}));
  spawn.position.set(0,.18,-H.d/2-4);g.add(spawn);
  const sr=new THREE.Mesh(new THREE.TorusGeometry(3.4,.12,8,48),mats.neon);sr.rotation.x=Math.PI/2;sr.position.copy(spawn.position);g.add(sr);
  const sl=labelSprite('SPAWN',{w:5,size:58,glow:'#d4ff3a',plate:true});sl.position.set(0,3,-H.d/2-4);g.add(sl);

  let floor=0,liftY=1.08,targetY=1.08;
  function floorForY(y){return Math.max(0,Math.min(2,Math.round((y-1.6)/H.floorH)))}
  function nearElevator(){return Math.abs(player.x-(H.x+ex))<4.4&&Math.abs(player.z-(H.z+ez))<4.8&&player.y<24}
  function interact(){if(!nearElevator())return false;floor=(floor+1)%3;targetY=1.08+floor*H.floorH;toast?.('ELEVATOR · FLOOR '+(floor+1));return true}
  function update(dt){
    liftY+=(targetY-liftY)*(1-Math.exp(-dt*5));car.position.y=liftY;liftRing.position.y=liftY+.14;
    if(nearElevator()&&Math.abs(player.y-(1.6+floor*H.floorH))<1.4)player.y=1.6+floor*H.floorH;
  }
  function resolve(p){
    if(Math.abs(p.x-H.x)>=H.w/2-.8||Math.abs(p.z-H.z)>=H.d/2-.8||p.y>=24.5)return;
    const side=H.w/2-.9,back=H.d/2-.9;
    if(p.x<H.x-side)p.x=H.x-side;if(p.x>H.x+side)p.x=H.x+side;if(p.z>H.z+back)p.z=H.z+back;
  }
  function prompt(){return nearElevator()?'F · ELEVATOR · CHANGE FLOOR':null}
  return {house:H,spawn:{x:H.x,z:H.z-H.d/2-4,y:1.6},update,resolve,interact,prompt,isInside:()=>Math.abs(player.x-H.x)<H.w/2&&Math.abs(player.z-H.z)<H.d/2&&player.y<24.5};
}
