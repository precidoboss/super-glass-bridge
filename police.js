/* SUPER TOWN POLICE STATION (redesigned): a walk-in station built with the same kit as the President's office.
   Lobby with visitor benches and wanted posters, a reception counter with the desk officer, a corridor to the
   holding cells, two interview rooms, a dispatch desk and lockers. Real walls, a doorway, walls that fade inside,
   and officers who work the building. */
import {kit,makeWorkers} from './design.js';

export function makePoliceStation({THREE,scene,labelSprite,B,cx,cz,getFront=()=>null,title='POLICE STATION'}){
  const W=36,D=26,H=9,T=.6,DW=7;
  const k=kit(THREE);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const col=(lx,lz,w,d,h)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name:null});
  const pts=[];const pt=(lx,lz,label,msg)=>pts.push({x:cx+lx,z:cz+lz,label,msg});

  /* ---------- materials ---------- */
  const navy=k.mat(0x1e3a66,{roughness:.45,metalness:.2});
  const navyDark=k.mat(0x0f2440,{roughness:.5,metalness:.3});
  const greyM=k.mat(0xaab4bf,{roughness:.5,metalness:.4});
  const steel=k.mat(0xc8d0d8,{roughness:.25,metalness:.85});
  const chrome=k.mat(0xe6edf2,{roughness:.15,metalness:1});
  const black=k.mat(0x111417,{roughness:.6,metalness:.2});
  const wood=k.mat(0x5b3d24,{roughness:.6});
  const glassM=k.mat(0x9fd8e8,{transparent:true,opacity:.24,roughness:.05,metalness:.4,depthWrite:false});
  const floorTex=k.tex(256,256,(g,w,h)=>{for(let j=0;j<4;j++)for(let i=0;i<4;i++){g.fillStyle=(i+j)%2?'#e9eef3':'#c9d3de';g.fillRect(i*64,j*64,64,64);g.strokeStyle='#8fa0b3';g.strokeRect(i*64,j*64,64,64)}
    g.fillStyle='#1e3a66';g.beginPath();g.arc(128,128,46,0,6.283);g.fill();g.fillStyle='#f2c84b';g.beginPath();g.arc(128,128,30,0,6.283);g.fill()});
  floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(W/8,D/8);
  const floorM=new THREE.MeshStandardMaterial({map:floorTex,roughness:.35,metalness:.1});
  const wallM=k.mat(0x24406e,{roughness:.4,metalness:.4,transparent:true});
  const roofM=k.mat(0x16243a,{roughness:.5,metalness:.6,transparent:true});
  const blueN=k.basic(0x4dd2ff,2.2),redN=k.basic(0xff4d4f,2),goldM=k.basic(0xf2c84b,1.5);

  /* ---------- shell ---------- */
  const floor=new THREE.Mesh(new THREE.BoxGeometry(W,.12,D),floorM);floor.position.set(0,.06,0);root.add(floor);
  let wallO=.97,inside=false;
  const wall=(w,d,x,z,h=H)=>{const m=k.box(root,w,h,d,wallM,x,0,z);col(x,z,w,d,h);return m};
  wall(W,T,0,D/2);wall(T,D,-W/2,0);wall(T,D,W/2,0);
  const side=(W-DW)/2,cxs=(W+DW)/4;
  wall(side,T,-cxs,-D/2);wall(side,T,cxs,-D/2);
  const roof=k.box(root,W+1,.5,D+1,roofM,0,H,0);
  // the lintel over the doorway, and a navy band round the top
  k.box(root,DW,H-4.6,T,wallM,0,4.6,-D/2);
  k.box(root,W+.8,.5,.8,navy,0,H-.5,-D/2-.2);k.box(root,W+.8,.5,.8,navy,0,H-.5,D/2+.2);
  // glass windows either side of the door
  k.box(root,side-1.2,H-3.2,.1,glassM,-cxs,1.6,-D/2-.05);k.box(root,side-1.2,H-3.2,.1,glassM,cxs,1.6,-D/2-.05);
  // exterior: the front sign, blue lights, flags, steps and a helipad on the roof
  const frontSign=k.plane(root,W*.52,3.4,new THREE.MeshBasicMaterial({map:k.sign('POLICE',{w:1024,h:256,bg:'#0b1a33',fg:'#f2c84b',border:'#4dd2ff',size:150,sub:'SUPER TOWN · 24 / 7'})}),0,H-2.6,-D/2-.32,0);
  for(const x of[-W/2+.6,W/2-.6])k.box(root,.4,1.2,.12,blueN,x,H-.9,-D/2-.5);
  for(let i=0;i<3;i++)k.box(root,DW+4-i*2,.35,1.6-i*.4,greyM,0,i*.35,-D/2-1.2-i*.4);
  for(const x of[-W/2-1.5,W/2+1.5]){k.cyl(root,.09,.11,9,chrome,x,0,-D/2-1.6);const f=k.plane(root,2.2,1.3,new THREE.MeshBasicMaterial({map:k.sign('',{w:256,h:160,bg:'#1e4fa3',fg:'#ffffff',border:'#ffffff',size:10})}),x+1.2,7.2,-D/2-1.6)}
  const helipad=k.plane(root,8,8,new THREE.MeshBasicMaterial({map:k.sign('H',{w:256,h:256,bg:'#18243a',fg:'#f2c84b',border:'#f2c84b',size:150})}),0,H+.3,0);helipad.rotation.x=-Math.PI/2;
  k.cyl(root,.12,.18,5,steel,W/2-3,H+.5,D/2-3);k.glow(root,W/2-3,H+5.5,D/2-3,1.4,0xff4d4f,.9);
  for(const x of[-W/2+.5,W/2-.5])for(const z of[-D/2+.5,D/2-.5])k.glow(root,x,H-1.2,z,2.2,0x4dd2ff,.5);

  /* ---------- interior: lobby, reception, corridor, cells, interview rooms, dispatch, lockers ---------- */
  // lobby benches and posters
  for(const x of[-10,-6]){k.box(root,1.8,.5,.7,wood,x,0,-10.5);col(x,-10.5,1.8,.7,.5)}
  for(const x of[6,10]){k.box(root,1.8,.5,.7,wood,x,0,-10.5);col(x,-10.5,1.8,.7,.5)}
  const posters=[['WANTED','Bike thief · reward 50 SUPER'],['COMMUNITY WATCH','Lock your car. Stay safe.'],['LOST DOG','Answers to Bolt. Call the desk.']];
  posters.forEach((p,i)=>{k.plane(root,2.2,2.8,new THREE.MeshBasicMaterial({map:k.sign(p[0],{w:256,h:320,bg:'#f4f1e8',fg:'#1e3a66',border:'#1e3a66',size:34,sub:''})}),-W/2+.12,2.4,-8+i*4,Math.PI/2)});
  // reception counter with a glass screen, and the desk officer behind it
  k.box(root,16,1.1,1.8,navyDark,0,0,-6.2);col(0,-6.2,16,1.8,1.1);
  k.box(root,16.2,1.1,.12,glassM,0,1.1,-7.1);
  k.box(root,16.2,.1,1.9,steel,0,2.2,-6.2);
  for(const x of[-7,7])k.cyl(root,.08,.08,1.1,steel,x,1.1,-5.8);
  // corridor down the middle to the back of the station
  k.box(root,6,.04,D-14,k.mat(0xd0d8e0,{roughness:.6}),0,.13,2);
  // holding cells (back right): bars, benches and a jailer's post
  for(let i=0;i<3;i++){
    const cx0=7+i*4.2;
    for(let b=0;b<5;b++)k.cyl(root,.07,.07,H-2.6,steel,cx0-1.6+b*.8,0,D/2-6.8);
    col(cx0,D/2-6.8,3.8,.22,H-2.6);
    k.box(root,3,.5,.7,greyM,cx0,0,D/2-4.7);
  }
  pt(10,D/2-3.6,'HOLDING CELLS',"No visitors past the bars, friend. Ask the jailer if you have business here.");
  // interview rooms (back left): a table and four chairs in each, plus glass partitions
  for(const x of[-10,-4]){
    k.box(root,4.2,.8,2.2,wood,x,0,4.4);col(x,4.4,4.2,2.2,.8);
    for(const dz of[-1.6,1.6]){k.box(root,.6,.8,.6,navyDark,x-1.2,0,4.4+dz);k.box(root,.6,.8,.6,navyDark,x+1.2,0,4.4+dz)}
    k.box(root,4.4,2.6,.08,glassM,x,.2,2.5);
  }
  pt(-7,2.1,'INTERVIEW ROOM',"Detective Lane: 'Sit down. Tell me everything about the bike.'");
  // dispatch desk (back centre), with three screens
  k.box(root,8,1.1,1.6,black,0,0,D/2-3.4);col(0,D/2-3.4,8,1.6,1.1);
  for(let i=0;i<3;i++){k.box(root,1.4,1,.08,k.basic(0x4dd2ff,.8),-2.4+i*2.4,1.2,D/2-4.2)}
  pt(0,D/2-5.6,'DISPATCH · RADIO',"Dispatch is calm tonight. Two patrols are out on the east side.");
  // lockers down the left wall
  for(let i=0;i<6;i++){k.box(root,.9,2.4,2.3,navy,-W/2+.5,0,-9+i*2.3);col(-W/2+.5,-9+i*2.3,.9,2.3,2.4)}
  pt(-W/2+2.4,-3,'EVIDENCE LOCKERS',"Locked. Some things are better left unseen.");
  // reception point and the bodyguard call point
  pt(0,-4.8,'FILE A REPORT · DESK',"Desk officer Rosa: 'Describe the vehicle, please. Take your time.'");
  pt(-7,-10.2,'CALL YOUR BODYGUARD',"Use your phone to hire your bodyguard. His patrol car will be on the road.");
  // ceiling lights
  for(let x=-W/2+5;x<W/2-3;x+=6)for(const z of[-D/2+5,D/2-5])k.box(root,1.6,.08,1.6,k.basic(0xf4ffe0,2),x,H-.25,z);
  // a neon sign inside, and the dispatch glow
  k.box(root,8,1,.2,blueN,0,H-1.8,-D/2+.15);

  /* ---------- officers and staff ---------- */
  const workers=makeWorkers({THREE,root,labelSprite,getFront,defs:[
    {role:'DESK OFFICER ROSA',variant:6,station:[0,-4.6],spd:0},
    {role:'DISPATCH MARK',variant:3,station:[0,D/2-4.9],spd:0},
    {role:'OFFICER DAN',variant:4,zone:[-12,-2,-8,-3],spd:.8},
    {role:'OFFICER KAI',variant:3,zone:[-4,4,-2,6],spd:.7},
    {role:'DETECTIVE LANE',variant:1,zone:[-12,-2,2,6.5],spd:.5},
    {role:'JAILER TOM',variant:7,zone:[5,15,D/2-7.5,D/2-3.2],spd:.4},
    {role:'JAILER SAM',variant:2,zone:[5,15,D/2-7.5,D/2-3.2],spd:.4}
  ]});

  /* ---------- hooks for town.js (the same contract as the other venues) ---------- */
  function update(dt,P,t){
    inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<H-.5;
    const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;
    roof.visible=!inside||P.y>H;
    frontSign.rotation.z=Math.sin(t*1.2)*.004;
    workers.update(dt,t);
  }
  return{
    W,D,H,cx,cz,title,kind:'police',
    door:{x:cx,z:cz-D/2-3.6},
    lobby:{x:cx,z:cz-D/2+3},
    points:pts,
    staffCount:workers.count,
    get inside(){return inside},
    update
  };
}
