/* ===================== SUPER TOWN · AIRPORT HANGAR =====================
   A steel arch hangar on the south-west apron. The roll-up door rises when you walk up or when the jet
   moves. Inside: the President's jet SUPER ONE (procedural, with livery, engines, landing gear), a fuel truck
   that drives in to fuel it, two mechanics and a fuel crew (resident sprites), a workbench with pegboard, tool
   chests and a radio desk. Flights run from the MacBook (Hangar app) or the Super Phone (Flights app).
   api.setJet('fuelling' | 'flying' | 'landed' | 'ready') drives it; api.status() reports the jet state.
   The walls, roof and front face hide when you are inside, like the other buildings. */

import {kit,makeWorkers} from './design.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function makeHangar({THREE,scene,labelSprite,B,cx=-18,cz=-70,getFront=()=>null}){
  const W=25,D=30,WALLH=8,DW=12,DH=9;           // footprint, wall height, door width and height
  const R=W/2,HW=W/2,HD=D/2;                      // the arch radius is half the width
  const k=kit(THREE);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);

  /* ---------- materials ---------- */
  const shellM=k.mat(0xd7dee4,{roughness:.45,metalness:.35,side:THREE.DoubleSide});
  const roofM=k.mat(0xe6ecf1,{roughness:.4,metalness:.3,side:THREE.DoubleSide});
  const floorM=k.mat(0x4a4f57,{roughness:.9});
  const apronM=k.mat(0x6b717a,{roughness:.95});
  const doorM=k.mat(0x9aa6b2,{roughness:.5,metalness:.4});
  const paintM=k.mat(0x2b3a4a,{roughness:.6});
  const yellow=k.basic(0xf2c84b);
  const lime=k.basic(0xc8ff43);
  const blue=k.mat(0x1d4ed8,{roughness:.5});
  const white=k.mat(0xf4f7fa,{roughness:.35,metalness:.2});
  const dark=k.mat(0x0b1a33,{roughness:.2,metalness:.4});
  const steel=k.mat(0x8a949e,{roughness:.4,metalness:.7});

  /* ---------- the arch and the shell ---------- */
  // the roof is the top half of a cylinder whose axis runs front to back
  const roof=new THREE.Mesh(new THREE.CylinderGeometry(R,R,D,40,1,true,Math.PI/2,Math.PI),roofM);
  roof.rotation.x=Math.PI/2;roof.position.set(0,WALLH,0);root.add(roof);
  // front and back faces: the wall shape under the arch, with a door opening in the front
  const facade=()=>{
    const s=new THREE.Shape();s.moveTo(-HW,0);s.lineTo(HW,0);s.lineTo(HW,WALLH);s.absarc(0,WALLH,R,0,Math.PI,false);s.closePath();return s;
  };
  const frontShape=facade();
  const hole=new THREE.Path();hole.moveTo(-DW/2,0);hole.lineTo(DW/2,0);hole.lineTo(DW/2,DH);hole.lineTo(-DW/2,DH);hole.closePath();
  frontShape.holes.push(hole);
  const front=new THREE.Mesh(new THREE.ShapeGeometry(frontShape,12),shellM);front.position.set(0,0,HD);root.add(front);
  const back=new THREE.Mesh(new THREE.ShapeGeometry(facade(),12),shellM);back.position.set(0,0,-HD);back.rotation.y=Math.PI;root.add(back);
  // side walls are plain slabs under the arch
  for(const sx of[-HW,HW]){const w=new THREE.Mesh(new THREE.BoxGeometry(.4,WALLH,D),shellM);w.position.set(sx,WALLH/2,0);root.add(w)}
  // the front sign above the door
  const signTex=k.sign('AIRPORT HANGAR',{w:768,h:150,bg:'#0b1a33',fg:'#c8ff43',border:'#c8ff43',size:88});
  k.plane(root,15,2.9,new THREE.MeshBasicMaterial({map:signTex}),0,DH+1.5,HD+.12);
  // a painted apron in front of the doors
  const apron=new THREE.Mesh(new THREE.PlaneGeometry(W+6,9),apronM);apron.rotation.x=-Math.PI/2;apron.position.set(0,.02,HD+4.5);root.add(apron);
  for(let i=0;i<5;i++){const l=new THREE.Mesh(new THREE.PlaneGeometry(.35,6),yellow);l.rotation.x=-Math.PI/2;l.position.set(-12+i*6,.03,HD+4.5);root.add(l)}
  // the hangar floor
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W-.4,D-.4),floorM);floor.rotation.x=-Math.PI/2;floor.position.set(0,.03,0);root.add(floor);
  const centreLine=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,D-2),yellow);centreLine.position.set(0,.04,0);root.add(centreLine);

  /* ---------- the roll-up door ---------- */
  const door=new THREE.Mesh(new THREE.BoxGeometry(DW,DH,.35),doorM);door.position.set(0,DH/2,HD+.02);root.add(door);
  for(let i=1;i<6;i++){const rib=new THREE.Mesh(new THREE.BoxGeometry(DW,.12,.1),paintM);rib.position.set(0,i*DH/6,.2);door.add(rib)}
  let openAmt=0;

  /* ---------- the jet: SUPER ONE ---------- */
  const jet=new THREE.Group();root.add(jet);
  const fus=new THREE.Mesh(new THREE.CylinderGeometry(.9,.8,11,18),white);fus.rotation.x=Math.PI/2;fus.position.set(0,1.6,0);jet.add(fus);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(.12,.9,1.8,18),white);nose.rotation.x=Math.PI/2;nose.position.set(0,1.6,6.4);jet.add(nose);
  const cock=new THREE.Mesh(new THREE.BoxGeometry(1.4,.32,.2),dark);cock.position.set(0,2.35,5.6);jet.add(cock);
  for(const sx of[-.92,.92]){const st=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,9.5),blue);st.position.set(sx,1.25,0);jet.add(st)}
  const wing=new THREE.Mesh(new THREE.BoxGeometry(14,.16,2.8),white);wing.position.set(0,1.25,.3);jet.add(wing);
  for(const sx of[-3.8,3.8]){const e=new THREE.Mesh(new THREE.CylinderGeometry(.42,.36,2.2,14),steel);e.rotation.x=Math.PI/2;e.position.set(sx,.9,.6);jet.add(e)}
  const fin=new THREE.Mesh(new THREE.BoxGeometry(.15,2.6,2.4),white);fin.position.set(0,3.2,-4.6);jet.add(fin);
  const finStripe=new THREE.Mesh(new THREE.BoxGeometry(.17,.5,1.2),lime);finStripe.position.set(0,3.6,-4.6);jet.add(finStripe);
  const stab=new THREE.Mesh(new THREE.BoxGeometry(4.6,.14,1.4),white);stab.position.set(0,2.1,-4.4);jet.add(stab);
  for(const [x,z] of[[0,4.3],[-1.5,-.5],[1.5,-.5]]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.3,14),dark);wh.rotation.z=Math.PI/2;wh.position.set(x,.45,z);jet.add(wh)}
  jet.position.set(0,0,-4);
  const parkZ=-4;

  /* ---------- the fuel truck ---------- */
  const truck=new THREE.Group();root.add(truck);
  const tbody=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.2,3.4),k.mat(0xc92a2a,{roughness:.5}));tbody.position.set(0,.9,0);truck.add(tbody);
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,2.6,14),white);tank.rotation.x=Math.PI/2;tank.position.set(0,1.8,-.2);truck.add(tank);
  for(const [x,z] of[[-1,1.2],[1,1.2],[-1,-1.2],[1,-1.2]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.25,12),dark);w.rotation.z=Math.PI/2;w.position.set(x,.36,z);truck.add(w)}
  const truckPark={x:-8,z:8},truckFuel={x:-9,z:-4};
  truck.position.set(truckPark.x,0,truckPark.z);

  /* ---------- the interior: workbench, pegboard, tool chests, radio desk ---------- */
  const bench=new THREE.Mesh(new THREE.BoxGeometry(6,1.8,1.5),paintM);bench.position.set(7,.9,-HD+1.5);root.add(bench);
  const peg=new THREE.Mesh(new THREE.PlaneGeometry(7,4),k.mat(0x6b5a44,{roughness:.9}));peg.position.set(7,3.4,-HD+.12);root.add(peg);
  const toolCols=[0xf2c84b,0xc92a2a,0x4dd2ff,0xc8ff43,0xffffff];
  toolCols.forEach((c,i)=>{const t=new THREE.Mesh(new THREE.BoxGeometry(.25,1.1,.12),k.basic(c));t.position.set(5.6+i*.8,4,-HD+.25);root.add(t)});
  for(let i=0;i<2;i++){const tc=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.2,1.4),steel);tc.position.set(-HW+2,1.1,-HD+2+i*2.2);root.add(tc)}
  const desk=new THREE.Mesh(new THREE.BoxGeometry(3.6,1.4,1.6),paintM);desk.position.set(HW-3.2,.7,HD-3);root.add(desk);
  const radioTex=k.sign('RADIO · TOWER',{w:512,h:96,bg:'#06120c',fg:'#c8ff43',border:'#c8ff43',size:50});
  k.plane(root,3.4,.7,new THREE.MeshBasicMaterial({map:radioTex}),HW-3.2,2.4,HD-2.1,Math.PI);
  // ceiling light strips
  for(let i=-1;i<=1;i++){k.glow(root,i*7,WALLH-1,0,6,0xdfeeff,.55)}

  /* ---------- colliders: the side walls and back, and the front either side of the door ---------- */
  B.push({x:cx-HW,z:cz,hw:.4,hd:HD,h:WALLH,name:null});
  B.push({x:cx+HW,z:cz,hw:.4,hd:HD,h:WALLH,name:null});
  B.push({x:cx,z:cz-HD,hw:HW,hd:.4,h:WALLH,name:null});
  B.push({x:cx-(HW+DW/2)/2,z:cz+HD,hw:(HW-DW/2)/2,hd:.4,h:WALLH,name:null});
  B.push({x:cx+(HW+DW/2)/2,z:cz+HD,hw:(HW-DW/2)/2,hd:.4,h:WALLH,name:null});
  // the jet and the fuel truck are solid too
  B.push({x:cx,z:cz+parkZ,hw:7.2,hd:6.5,h:3,name:null});
  B.push({x:cx-8,z:cz+8,hw:1.2,hd:2,h:2,name:null});

  /* ---------- the mechanics and the fuel crew ---------- */
  // stations and zones are local to the hangar (the group sits at cx,cz)
  const workers=makeWorkers({THREE,root,labelSprite,getFront,defs:[
    {role:'CHIEF MECHANIC RAY',variant:6,station:[9.5,parkZ+1.5],spd:0},
    {role:'ENGINEER MIA',variant:3,zone:[-8,8,-12,12],spd:1.2},
    {role:'FUEL CREW JO',variant:1,zone:[-12,-5,2,12],spd:1.1}
  ]});

  /* ---------- lights ---------- */
  const lamp=new THREE.PointLight(0xfff4e0,0,70,1.2);lamp.position.set(0,WALLH-2,0);root.add(lamp);
  let lightV=0;

  /* ---------- the jet's state ---------- */
  let jstate='ready',tFly=0,fuelT=0;
  function setJet(v){
    if(v==='fuelling'){jstate='fuelling';fuelT=0}
    else if(v==='flying'){if(jstate==='flying')return;jstate='flying';tFly=0}
    else if(v==='landed'){jstate='landed'}
    else if(v==='ready'){jstate='ready'}
  }

  /* ---------- where the player is ---------- */
  const inside=(P)=>Math.abs(P.x-cx)<HW&&Math.abs(P.z-cz)<HD&&P.y<WALLH;
  let insideNow=false;

  /* ---------- the visible points ---------- */
  const pts=[
    {x:cx-8,z:cz-10,label:'HANGAR DESK · TICKETS',msg:'Book a flight from the Super Phone, or use the Hangar app on the MacBook.'},
    {x:cx+7,z:cz-HD+4,label:'WORKBENCH',msg:'Tools are labelled. Please put them back on the pegboard.'},
    {x:cx,z:cz+parkZ,label:'SUPER ONE · PRESIDENT\'S JET',msg:'SUPER ONE · READY FOR FLIGHT. Fuel it from the MacBook.'},
    {x:cx+HW-3.2,z:cz+HD-3,label:'RADIO · TOWER',msg:'Tower: runway clear. Super One may take off when ready.'}
  ];

  const api={
    W,D,H:WALLH,cx,cz,title:'AIRPORT HANGAR',kind:'hangar',
    door:{x:cx,z:cz+HD+4.5},
    lobby:{x:cx,z:cz+HD-4},
    box:{x:cx,z:cz,hw:HW,hd:HD},
    park:{x:cx,z:cz+parkZ,h:0},
    points:pts,
    staffCount:workers.count,
    get inside(){return insideNow},
    setJet,
    status(){return jstate},
    update(dt,P,t){
      insideNow=inside(P);
      // the door rises when the player is near, or while the jet is moving
      const near=Math.hypot(P.x-(cx),P.z-(cz+HD+4.5))<14;
      const wantOpen=(near||jstate==='flying'||jstate==='fuelling')?1:0;
      openAmt+=(wantOpen-openAmt)*Math.min(1,dt*2.5);
      door.position.y=DH/2+openAmt*(DH+.5);door.visible=openAmt<.98;
      // fuelling: the truck drives in for three seconds, then goes back
      const fuelling=jstate==='fuelling';
      if(fuelling){fuelT+=dt;if(fuelT>3){jstate='ready'}}
      const target=fuelling?truckFuel:truckPark;
      truck.position.x+=(target.x-truck.position.x)*Math.min(1,dt*2.2);
      truck.position.z+=(target.z-truck.position.z)*Math.min(1,dt*2.2);
      // the flight: out through the door, a loop over the town, and back to the parking place
      if(jstate==='flying'){
        tFly+=dt;const u=Math.min(1,tFly/6);
        const s=Math.sin(u*Math.PI);
        const x=6*Math.sin(u*Math.PI*2);
        const z=parkZ+s*(HD+22);
        jet.position.set(x,s*9,z);
        const dx=12*Math.PI*Math.cos(u*Math.PI*2),dz=(HD+22)*Math.PI*Math.cos(u*Math.PI);
        jet.rotation.y=Math.atan2(dx,dz);
        if(u>=1){jstate='landed';jet.position.set(0,0,parkZ);jet.rotation.y=0}
      }else{
        jet.position.set(0,0,parkZ);
        jet.rotation.y=0;
      }
      // roof and front face hide when the player is inside
      roof.visible=!insideNow||P.y>WALLH;front.visible=!insideNow||P.y>WALLH;
      // the lamp fades in while the player is inside
      lightV+=((insideNow?26:0)-lightV)*Math.min(1,dt*4);lamp.intensity=lightV;
      workers.update(dt,t);
    }
  };
  return api;
}
