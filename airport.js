/* ===================== SUPER TOWN · SUPER TOWN AIRPORT =====================
   A flat platform west of the town, over the abyss, reached by the West Bridge and an access road.
   It has a 120-unit runway with markings and approach lights, a taxiway down to the President's hangar, a
   control tower, a windsock, and a walk-in terminal with a Super Air check-in desk, a departures board and
   benches. Staff use the resident sprite sheets. Exports AIRPORT (the bounds) and makeAirport(). */

import {kit,makeWorkers} from './design.js';

export const AIRPORT={x0:-302,x1:-162,z0:-70,z1:70};
const TERM={cx:-200,cz:-17,W:28,D:14,H:8};

export function makeAirport({THREE,scene,labelSprite,B,getFront=()=>null}){
  const k=kit(THREE);
  const {x0,x1,z0,z1}=AIRPORT;
  const cxA=(x0+x1)/2,czA=(z0+z1)/2,LX=x1-x0,LZ=z1-z0;
  const root=new THREE.Group();scene.add(root);
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const flat=(p,w,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,.07,d),m);o.position.set(x,y,z);p.add(o);return o};
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  const glow=(x,y,z,s,col)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));sp.scale.set(s,s,1);sp.position.set(x,y,z);root.add(sp);return sp};
  const M={
    concrete:new THREE.MeshStandardMaterial({color:0x101a15,roughness:.95}),
    slab:new THREE.MeshStandardMaterial({color:0x0f1e16,roughness:.5,metalness:.8,side:THREE.DoubleSide}),
    asphalt:new THREE.MeshStandardMaterial({color:0x17191d,roughness:.8,metalness:.2}),
    taxi:new THREE.MeshStandardMaterial({color:0x1b1e23,roughness:.8,metalness:.2}),
    white:new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,1.5,1.5)}),
    yellow:new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.7,.3)}),
    lime:new THREE.MeshBasicMaterial({color:new THREE.Color(.8,2.2,.4)}),
    red:new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,.4,.9)}),
    tower:new THREE.MeshStandardMaterial({color:0xe6ecf1,roughness:.4,metalness:.3}),
    glass:new THREE.MeshStandardMaterial({color:0x2d5b6e,roughness:.1,metalness:.6,transparent:true,opacity:.42,side:THREE.DoubleSide}),
    trim:new THREE.MeshStandardMaterial({color:0x222b33,roughness:.5,metalness:.6}),
    floor:new THREE.MeshStandardMaterial({color:0x1d2630,roughness:.6}),
    plant:new THREE.MeshStandardMaterial({color:0x2f7a3a,roughness:.9})
  };

  /* ---------- the platform: ground, lime and red rim, dark skirt into the abyss ---------- */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(LX,LZ),M.concrete);ground.rotation.x=-Math.PI/2;ground.position.set(cxA,0,czA);root.add(ground);
  const skirt=new THREE.Mesh(new THREE.BoxGeometry(LX,34,LZ),M.slab);skirt.position.set(cxA,-17,czA);root.add(skirt);
  for(const [w,d,x,z] of[[LX,.5,cxA,z0],[LX,.5,cxA,z1],[.5,LZ,x0,czA],[.5,LZ,x1,czA]]){const r=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),M.lime);r.position.set(x,.08,z);root.add(r)}

  /* ---------- the access road from the bridge to the terminal forecourt, and the forecourt ---------- */
  flat(root,44,9,M.asphalt,-190,.035,0);                     // x -212..-168, z -4.5..4.5
  flat(root,28,4.5,M.asphalt,-200,.035,-6.75);               // forecourt in front of the terminal
  for(let x=-172;x>-210;x-=4.5)flat(root,2.4,.22,M.white,x,.05,0);
  flat(root,44,.22,M.lime,-190,.045,4.2);flat(root,44,.22,M.lime,-190,.045,-4.2);
  // kerb and forecourt edge
  flat(root,28,.22,M.lime,-200,.045,-9);

  /* ---------- the runway: 120 long, markings, numbers, approach and edge lights ---------- */
  const RZ=44,RX0=-296,RX1=-176;
  flat(root,RX1-RX0,14,M.asphalt,(RX0+RX1)/2,.035,RZ);
  for(let x=RX0+6;x<RX1-6;x+=8)flat(root,4,.3,M.white,x,.05,RZ);
  for(const x of[RX0+2,RX1-2]){for(let i=-3;i<=3;i++)flat(root,1.2,.8,M.white,x,.05,RZ+i*1.6)}
  for(const [s,t] of[[RX0+12,'27'],[RX1-12,'09']]){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#17191d';g.fillRect(0,0,256,256);g.fillStyle='#ffffff';g.font='bold 170px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,140);
    const tx=new THREE.CanvasTexture(c);const pl=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({map:tx}));pl.rotation.x=-Math.PI/2;pl.position.set(s,.05,RZ);root.add(pl)}
  for(let x=RX0+2;x<=RX1-2;x+=8){glow(x,.4,RZ-7.6,1.1,0xc8ff43);glow(x,.4,RZ+7.6,1.1,0xc8ff43)}
  for(let x=RX0;x>RX0-5;x-=2)glow(x,.4,RZ,1.4,0xffffff);       // approach lights at the far end

  /* ---------- the taxiway from the hangar apron across to the runway ---------- */
  const TX=-240;
  flat(root,10,53,M.taxi,TX,.035,10.5);                       // z -16..37
  for(let z=-13;z<36;z+=4)flat(root,.3,2,M.yellow,TX,.05,z);
  flat(root,10,.25,M.yellow,TX,.05,37.5);

  /* ---------- lamp posts along the access road and the forecourt ---------- */
  for(const x of[-176,-188,-200,-212]){for(const z of[-5.6,5.6]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,5.2,8),M.trim);pole.position.set(x,2.6,z);root.add(pole);glow(x,5.4,z,2.4,0xfff1c4)}}

  /* ---------- the control tower ---------- */
  const TW={x:-204,z:28};
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(1.9,2.4,20,16),M.tower);shaft.position.set(TW.x,10,TW.z);root.add(shaft);
  const cab=new THREE.Mesh(new THREE.CylinderGeometry(3.9,3.4,2.6,20),M.glass);cab.position.set(TW.x,21.3,TW.z);root.add(cab);
  const cabBand=new THREE.Mesh(new THREE.CylinderGeometry(4.0,4.0,.25,20),M.lime);cabBand.position.set(TW.x,20,TW.z);root.add(cabBand);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(4.6,1.6,20),M.trim);roof.position.set(TW.x,23.5,TW.z);root.add(roof);
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,5,6),M.trim);ant.position.set(TW.x,26.5,TW.z);root.add(ant);
  glow(TW.x,29.2,TW.z,2.6,0xff2e88);
  B.push({x:TW.x,z:TW.z,hw:2.4,hd:2.4,h:20,name:null});

  /* ---------- the windsock ---------- */
  const ws=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,8,8),M.tower);ws.position.set(-270,4,20);root.add(ws);
  const sock=new THREE.Mesh(new THREE.ConeGeometry(.7,3.4,12,1,true),new THREE.MeshBasicMaterial({color:0xff7a1a,side:THREE.DoubleSide}));
  sock.rotation.z=-Math.PI/2;sock.position.set(-268.4,7.6,20);root.add(sock);

  /* ---------- the walk-in terminal: Super Air check-in, departures board, benches, glass front ---------- */
  const T=new THREE.Group();T.position.set(TERM.cx,0,TERM.cz);root.add(T);
  const {W,D,H}=TERM,HW=W/2,HD=D/2;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,D),M.floor);floor.rotation.x=-Math.PI/2;floor.position.set(0,.04,0);T.add(floor);
  box(T,W,H,.5,M.tower,0,0,-HD);                              // back wall
  box(T,.5,H,D,M.tower,-HW,0,0);box(T,.5,H,D,M.tower,HW,0,0); // side walls
  // glass front with a 6-wide doorway in the middle
  for(const s of[-1,1]){const g=new THREE.Mesh(new THREE.PlaneGeometry(HW-3,H-.6),M.glass);g.position.set(s*(HW+3)/2,H/2,HD);T.add(g);box(T,HW-3,.3,.3,M.trim,s*(HW+3)/2,0,HD)}
  box(T,6,H-5,.5,M.tower,0,5,HD);                             // lintel over the door
  box(T,W+2,.6,D+2,M.trim,0,H,0);                             // roof slab
  box(T,9,.35,3.4,M.trim,0,5.2,HD+1.7);                       // entrance canopy
  box(T,9,.12,3.4,M.lime,0,5.55,HD+1.7);                      // lime edge on the canopy
  box(T,W+2,.16,.2,M.lime,0,H-.2,HD+1);                       // lime trim on the roof edge
  const sign=k.sign('SUPER TOWN AIRPORT',{w:1024,h:160,bg:'#0b1a33',fg:'#c8ff43',border:'#c8ff43',size:74});
  const sp=new THREE.Mesh(new THREE.PlaneGeometry(14,2.2),new THREE.MeshBasicMaterial({map:sign}));sp.position.set(0,6.4,HD+.3);T.add(sp);
  // Super Air check-in counter with a lime top and a sign
  box(T,16,1.2,1.6,M.trim,0,0,-3.2);box(T,16,.12,1.8,M.lime,0,1.2,-3.2);
  const cSign=k.sign('SUPER AIR · CHECK-IN',{w:512,h:96,bg:'#06120c',fg:'#c8ff43',border:'#c8ff43',size:50});
  const cs=new THREE.Mesh(new THREE.PlaneGeometry(8,1.5),new THREE.MeshBasicMaterial({map:cSign}));cs.position.set(0,2.9,-HD+.02);T.add(cs);
  // departures board on the back wall
  const bc=document.createElement('canvas');bc.width=512;bc.height=192;const bg=bc.getContext('2d');
  bg.fillStyle='#04100a';bg.fillRect(0,0,512,192);bg.fillStyle='#c8ff43';bg.font='bold 34px monospace';bg.fillText('DEPARTURES',18,40);bg.fillStyle='#e9f6ea';bg.font='bold 30px monospace';
  bg.fillText('SA1  SUPER CLUB   ON TIME',18,92);bg.fillText('SA2  DOWNTOWN      BOARDING',18,136);bg.fillStyle='#ff2e88';bg.fillText('SA3  HANGAR       CLOSED',18,176);
  const bt=new THREE.CanvasTexture(bc);const board=new THREE.Mesh(new THREE.PlaneGeometry(9,3.4),new THREE.MeshBasicMaterial({map:bt}));board.position.set(0,4.4,-HD+.04);T.add(board);
  // benches and plants
  for(const x of[-9,-3,3,9]){box(T,3.6,.5,1.1,M.trim,x,.4,2.5);box(T,3.6,1.2,.25,M.trim,x,.9,3.0)}
  for(const [x,z] of[[-12.5,-5],[12.5,-5],[-12.5,4.5],[12.5,4.5]]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.5,.6,.9,10),M.trim);pot.position.set(x,.45,z);T.add(pot);const bush=new THREE.Mesh(new THREE.SphereGeometry(.9,12,10),M.plant);bush.position.set(x,1.5,z);T.add(bush)}
  // terminal colliders (world space)
  const WX=TERM.cx,WZ=TERM.cz;
  B.push({x:WX,z:WZ-HD,hw:HW,hd:.4,h:H,name:null});
  B.push({x:WX-HW,z:WZ,hw:.4,hd:HD,h:H,name:null});
  B.push({x:WX+HW,z:WZ,hw:.4,hd:HD,h:H,name:null});
  B.push({x:WX-(HW+3)/2,z:WZ+HD,hw:(HW-3)/2,hd:.4,h:H,name:null});
  B.push({x:WX+(HW+3)/2,z:WZ+HD,hw:(HW-3)/2,hd:.4,h:H,name:null});
  B.push({x:WX,z:WZ-3.2,hw:8,hd:.8,h:1.2,name:null});
  for(const x of[-9,-3,3,9])B.push({x:WX+x,z:WZ+2.5,hw:1.8,hd:.55,h:1,name:null});
  // staff: the Super Air desk agent and a lounge host
  const workers=makeWorkers({THREE,root:T,labelSprite,getFront,defs:[
    {role:'SUPER AIR · MIA',variant:2,station:[0,-4.4],spd:0},
    {role:'LOUNGE HOST LEO',variant:5,zone:[-10,10,-1,5],spd:1}
  ]});
  // the terminal's world points and walk-in door
  const points=[
    {x:WX,z:WZ-1.6,label:'SUPER AIR · CHECK-IN',msg:'Super Air is open. Book a flight from the Flights app on your phone.'},
    {x:WX-8,z:WZ+3.8,label:'DEPARTURES BOARD',msg:'SA1 to the Super Club is on time. Boarding from the hangar.'},
    {x:WX+9,z:WZ+3.8,label:'LOUNGE BENCH',msg:'Take a seat and wait for your flight.'}
  ];
  let inside=false;
  return{
    box:{x0,x1,z0,z1},
    door:{x:WX,z:WZ+HD+1.8},
    lobby:{x:WX,z:WZ+HD-3},
    points,
    staffCount:workers.count,
    get inside(){return inside},
    update(dt,P,t){
      inside=Math.abs(P.x-WX)<HW&&Math.abs(P.z-WZ)<HD&&P.y<H;
      workers.update(dt,t);
    }
  };
}
