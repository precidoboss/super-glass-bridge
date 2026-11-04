/* ===================== SUPER CLUB · NIGHTCLUB =====================
   A walk-in nightclub on the east side of town. Velvet-rope entrance with bouncers and a queue, a coat check,
   restrooms, a long back-lit bar with bartenders, a colour-cycling LED dance floor, a raised DJ booth with
   decks, speaker stacks and a DJ, a mirror ball, moving-head beams, laser sweeps, smoke, a balcony with
   dancers above, and VIP booths with bottle service. Dancers bob to the beat; staff work the room.
   Real walls and colliders, walls fade inside, the same contract as the other buildings. */
import {kit,homeKit} from './design.js';

export function makeNightclub({THREE,scene,labelSprite,B,cx,cz,getFront=()=>null,title='SUPER CLUB'}){
  const W=30,D=24,H=10,T=.5,DW=7;
  const k=kit(THREE);
  const HK=homeKit(THREE);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const col=(lx,lz,w,d,h)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name:null});
  const pts=[];const pt=(lx,lz,label,msg)=>pts.push({x:cx+lx,z:cz+lz,label,msg});
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  /* ---------- materials ---------- */
  const wallM=k.mat(0x0e0a1a,{roughness:.5,metalness:.4,transparent:true});
  const floorM=k.mat(0x120c20,{roughness:.2,metalness:.5});
  const chrome=k.mat(0xdfe6ea,{roughness:.12,metalness:1});
  const black=k.mat(0x08070c,{roughness:.4,metalness:.3});
  const velvet=k.mat(0x5a0f2a,{roughness:.9});
  const velvetB=k.mat(0x1d2f6b,{roughness:.9});
  const wood=k.mat(0x3a2418,{roughness:.5});
  const gold=k.mat(0xd9b24a,{roughness:.3,metalness:1});
  const glassM=k.mat(0x0a0818,{transparent:true,opacity:.35,roughness:.05,metalness:.3,depthWrite:false});
  const neon=[0xff2e88,0x00e5ff,0xc8ff43,0xb08cff].map(c=>k.basic(c,2.4));
  const roofM=k.mat(0x0a0814,{roughness:.5,metalness:.6,transparent:true});
  const beamCols=[0xff2e88,0x00e5ff,0xc8ff43,0xffc83d];

  /* ---------- shell ---------- */
  const floor=k.plane(root,W-.4,D-.4,floorM,0,.06,0,0);floor.rotation.x=-Math.PI/2;
  let wallO=.97,inside=false;
  const wall=(w,d,x,z,h=H)=>{k.box(root,w,h,d,wallM,x,0,z);col(x,z,w,d,h)};
  wall(W,T,0,D/2);wall(T,D,-W/2,0);wall(T,D,W/2,0);
  const side=(W-DW)/2,cxs=(W+DW)/4;
  wall(side,T,-cxs,-D/2);wall(side,T,cxs,-D/2);
  const roof=k.box(root,W+1,.5,D+1,roofM,0,H,0);
  k.box(root,DW,H-4.4,T,wallM,0,4.4,-D/2);                                   // lintel over the doorway
  k.box(root,W+.8,.25,.8,neon[0],0,H-.3,-D/2-.2);k.box(root,W+.8,.25,.8,neon[1],0,H-.3,D/2+.2);
  dressVenueLite();
  function dressVenueLite(){
    for(const x of[-W/2,W/2])for(const z of[-D/2,D/2])k.glow(root,x,H+.3,z,3.4,0xff2e88,.45);
    k.box(root,W,.1,.12,neon[1],0,.12,-D/2-.1);
  }
  // front glass either side of the door, with neon outline
  k.box(root,side-1,H-3.6,.1,glassM,-cxs,1.8,-D/2-.05);k.box(root,side-1,H-3.6,.1,glassM,cxs,1.8,-D/2-.05);
  // exterior: marquee, LED facade screens, lit flags and the rope line out front
  k.plane(root,W*.62,2.4,new THREE.MeshBasicMaterial({map:k.sign('SUPER CLUB',{w:1024,h:300,bg:'#06040c',fg:'#ff2e88',border:'#00e5ff',size:150,sub:'LIVE · EVERY NIGHT'})}),0,H-2.2,-D/2-.32,0);
  for(const s of[-1,1]){
    const scr=k.plane(root,4.6,5.6,new THREE.MeshBasicMaterial({map:k.sign('',{w:256,h:320,bg:'#0a0616',fg:'#ff2e88',border:'#00e5ff',size:10})}),s*(W/2-2.4),4.6,-D/2-.1,0);
    scr.userData.led=true;
  }
  for(const x of[-W/2+1.5,W/2-1.5]){k.cyl(root,.09,.11,11,chrome,x,0,-D/2-2.4);k.box(root,1.6,.9,.1,neon[x<0?0:1],x,10.2,-D/2-2.4)}
  // velvet rope posts and rope out front (the queue walks along it)
  const ropeM=k.mat(0x7a1f2b,{roughness:.8});
  for(const s of[-1,1]){for(let i=0;i<4;i++){k.cyl(root,.08,.1,1.1,gold,s*(DW/2+1.5),0,-D/2-3-i*3);k.box(root,.26,.26,.26,gold,s*(DW/2+1.5),1.1,-D/2-3-i*3)}}
  for(let i=0;i<3;i++){k.box(root,.06,.06,3,ropeM,-DW/2-1.5,1.0,-D/2-4.5-i*3,0)}
  for(let i=0;i<3;i++){k.box(root,.06,.06,3,ropeM,DW/2+1.5,1.0,-D/2-4.5-i*3,0)}

  /* ---------- interior: LED floor, bar, DJ booth, VIP booths, balcony ---------- */
  // LED dance floor: an 8 x 6 grid of tiles whose colours cycle with the beat
  const LF={x0:-6.5,x1:7,z0:-3,z1:6.5,cols:8,rows:6};
  const tiles=[];
  for(let i=0;i<LF.cols;i++)for(let j=0;j<LF.rows;j++){
    const tw=(LF.x1-LF.x0)/LF.cols,td=(LF.z1-LF.z0)/LF.rows;
    const m=new THREE.MeshBasicMaterial({color:0x14122a});
    const t=k.plane(root,tw-.06,td-.06,m,LF.x0+tw*(i+.5),.09,LF.z0+td*(j+.5),0);t.rotation.x=-Math.PI/2;tiles.push({m,i,j});
  }
  const palette=[0xff2e88,0x00e5ff,0xc8ff43,0xb08cff,0xffc83d,0xff6b3d];
  // bar along the left wall: back-lit shelves with bottles, a long counter and stools
  const barX=-W/2+3.4;
  k.box(root,1.8,1.1,11,black,barX,0,-1);col(barX,-1,1.8,11,1.1);
  k.box(root,2,.1,11.4,k.mat(0x2a1e18,{roughness:.2,metalness:.4}),barX,1.1,-1);
  k.box(root,.12,.04,11.2,neon[2],barX+1.0,1.16,-1);                          // lime counter edge
  k.box(root,.7,2.6,11.4,wood,-W/2+.45,0,-1);
  const bottleCols=[0x7bff3a,0xff2e88,0x00e5ff,0xffc83d,0xb08cff,0xff6b3d];
  const bottles=[];for(let i=0;i<3;i++)for(let j=0;j<9;j++)bottles.push({x:-W/2+.45,y:.5+i*.8,z:-6+j*1.1,c:bottleCols[(i+j)%bottleCols.length]});
  const bIM=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.6,.3),k.mat(0xffffff,{roughness:.2}),bottles.length),bm=new THREE.Matrix4(),bcol=new THREE.Color();
  bottles.forEach((b,i)=>{bm.makeTranslation(b.x,b.y+.3,b.z);bIM.setMatrixAt(i,bm);bIM.setColorAt(i,bcol.set(b.c))});
  bIM.instanceMatrix.needsUpdate=true;if(bIM.instanceColor)bIM.instanceColor.needsUpdate=true;root.add(bIM);
  for(let j=0;j<6;j++){k.cyl(root,.28,.28,.08,velvet,barX+1.6,0,-5+j*1.8);k.cyl(root,.05,.05,.8,chrome,barX+1.6,0,-5+j*1.8)}
  pt(barX+2.2,-1,'BAR · ORDER A DRINK',"Bartender Nia: 'Two shots of something blue, or the house special?'");
  // DJ booth on a raised stage at the back: decks, mixer, two speaker stacks and a logo wall
  const DJ={x:0,z:D/2-4.8,h:1.2};
  k.box(root,8,DJ.h,3.4,black,DJ.x,0,DJ.z);col(DJ.x,DJ.z,8,3.4,DJ.h);
  k.box(root,8.2,.1,3.6,neon[1],DJ.x,DJ.h,DJ.z);
  const deckM=k.mat(0x17141f,{roughness:.4,metalness:.6});
  const turntables=[];
  for(const x of[-1.7,1.7]){
    k.box(root,2.4,.2,1.6,deckM,x,DJ.h,DJ.z);
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.06,30),k.mat(0x0c0c10,{roughness:.3}));disc.position.set(x,DJ.h+.2,DJ.z);root.add(disc);
    const lab=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.07,20),neon[x<0?0:1]);lab.position.set(x,DJ.h+.22,DJ.z);root.add(lab);
    turntables.push({disc,lab});
  }
  k.box(root,1.2,.2,1.2,deckM,0,DJ.h,DJ.z);                                   // mixer
  for(let i=0;i<4;i++)k.box(root,.12,.12,.12,neon[i%4],-.4+i*.27,DJ.h+.2,DJ.z+.3);
  for(const x of[-DJ.x-5.2,5.2]){k.box(root,1.6,3,1.4,black,x,DJ.h,DJ.z+.4);k.cyl(root,.6,.6,.06,k.mat(0x111111),x,DJ.h+2.6,DJ.z-.1)}
  k.plane(root,6.2,2.2,new THREE.MeshBasicMaterial({map:k.sign('DJ · SUPER CLUB',{w:1024,h:360,bg:'#06040c',fg:'#c8ff43',border:'#ff2e88',size:120})}),0,DJ.h+3.2,D/2-.2,Math.PI);
  pt(0,DJ.z-2.4,'DJ BOOTH · REQUEST A SONG',"DJ Vex: 'Tell me what you want to hear. Two-step, afrobeats, or the drop?'");
  // the balcony above the back of the room (visual, with a rail and dancers)
  const BAL={x0:-9,x1:9,z0:D/2-6,z1:D/2-1.2,h:5};
  k.box(root,BAL.x1-BAL.x0,.3,BAL.z1-BAL.z0,wood,(BAL.x0+BAL.x1)/2,BAL.h,(BAL.z0+BAL.z1)/2);
  k.box(root,BAL.x1-BAL.x0,1.1,.1,chrome,(BAL.x0+BAL.x1)/2,BAL.h+.3,BAL.z0);
  k.box(root,.1,1.1,BAL.z1-BAL.z0,chrome,BAL.x0,BAL.h+.3,(BAL.z0+BAL.z1)/2);
  k.box(root,.1,1.1,BAL.z1-BAL.z0,chrome,BAL.x1,BAL.h+.3,(BAL.z0+BAL.z1)/2);
  // VIP booths along the right wall: velvet banquettes and bottle service tables
  const vipZ=[-8,-3,2];
  for(const z of vipZ){
    k.box(root,.9,.9,4,velvet,W/2-1.2,0,z);k.box(root,1.3,.6,4,velvet,W/2-1.9,.9,z);col(W/2-1.2,z,1.6,4,1.5);
    k.box(root,2.2,.8,1.6,gold,W/2-4.4,0,z);col(W/2-4.4,z,2.2,1.6,.8);
    for(let i=0;i<3;i++){k.box(root,.18,.5,.18,neon[i%4],W/2-4.4+(i-1)*.5,.8,z)}   // bottle service candles
  }
  pt(W/2-4.4,-3,'VIP BOOTH · BOTTLE SERVICE',"Bottle service: 80 CRYPTO. The DJ will shout your name.");
  // coat check and restrooms, back-left and front-right
  k.box(root,4.2,1.1,1.2,wood,-W/2+4.2,0,-D/2+2.2);col(-W/2+4.2,-D/2+2.2,4.2,1.2,1.1);
  k.plane(root,2.2,1,new THREE.MeshBasicMaterial({map:k.sign('COAT CHECK',{w:512,h:192,bg:'#06040c',fg:'#c8ff43',border:'#c8ff43',size:70})}),-W/2+4.2,2.4,-D/2+.25,0);
  pt(-W/2+4.2,-D/2+3.6,'COAT CHECK',"Check your coat: 1 CRYPTO. Please keep your ticket.");
  k.plane(root,2.2,1,new THREE.MeshBasicMaterial({map:k.sign('RESTROOMS',{w:512,h:192,bg:'#06040c',fg:'#00e5ff',border:'#00e5ff',size:66})}),W/2-3,2.4,-D/2+.25,0);
  pt(W/2-3,-D/2+3,'RESTROOMS',"Clean, dim, and very loud from here.");
  // ceiling: moving-head rig along the truss, a mirror ball, laser sweeps and the lighting rig
  const truss=k.box(root,16,.2,.2,chrome,0,H-1.2,4);
  const beams=[];
  for(let i=0;i<6;i++){
    const pivot=new THREE.Group();pivot.position.set(-7.5+i*3,H-1.5,4);root.add(pivot);
    const cone=new THREE.Mesh(new THREE.CylinderGeometry(.18,2.4,H-2.5,18,1,true),new THREE.MeshBasicMaterial({color:beamCols[i%beamCols.length],transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    cone.position.y=-(H-2.5)/2;pivot.add(cone);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.4,14),neon[i%4]);head.position.y=-.1;pivot.add(head);
    beams.push({pivot,i});
  }
  const ball=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),new THREE.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.05}));
  ball.position.set(0,H-2.8,1);root.add(ball);
  k.cyl(root,.05,.05,1.8,chrome,0,H-1.2,1);
  const lasers=[];
  for(let i=0;i<8;i++){
    const pv=new THREE.Group();pv.position.set(-9+i*2.6,H-.8,-3+(i%2)*2);root.add(pv);
    const ln=new THREE.Mesh(new THREE.BoxGeometry(.04,H+1,.04),new THREE.MeshBasicMaterial({color:beamCols[i%beamCols.length],transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
    ln.position.y=-(H+1)/2;pv.add(ln);lasers.push({pv,i});
  }
  // smoke puffs rising from the dance floor
  const puffs=[];
  for(let i=0;i<14;i++){const s=k.glow(root,rnd(-6,6),rnd(0,3),rnd(-2,6),rnd(2,4),0x9aa0c8,.12);puffs.push({s,ph:rnd(0,1)})}
  // a single hanging light bar over the room (in the lighting rig)
  k.box(root,W-6,.12,.12,neon[3],0,H-.9,-D/2+5);

  /* ---------- people: bouncers, bartenders, DJ, dancers, balcony dancers, VIP guests ---------- */
  const people=[];
  const person=(role,variant,x,y,z,mode,zone=null,spd=.25)=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);sp.visible=false;root.add(sp);
    const tag=role?labelSprite(role,{w:2.6,size:54,color:'#f1e9ff',glow:'#ff2e88',plate:true}):null;if(tag)root.add(tag);
    const p={sp,tag,variant,x,y,z,mode,zone,spd,tx:x,tz:z,wait:rnd(0,2),ph:rnd(0,6),moving:false};
    people.push(p);return p;
  };
  person('BOUNCER JOE',7,-DW/2-1.8,0,-D/2+1.4,'static');
  person('BOUNCER MIKE',4,DW/2+1.8,0,-D/2+1.4,'static');
  person('BARTENDER NIA',5,-W/2+2.9,0,-2.2,'static');
  person('BARTENDER REX',2,-W/2+2.9,0,.8,'static');
  person('DJ VEX',1,DJ.x,DJ.h,DJ.z+.1,'dj');
  person('HOST ZOE',6,-4,0,-D/2+3.2,'static');
  person('WAITER LIO',3,W/2-6,0,-4,'wander',[W/2-7.5,W/2-2.5,-7,3],.8);
  person('WAITER KAI',5,W/2-6,0,2,'wander',[W/2-7.5,W/2-2.5,-7,3],.8);
  person('CLEANER IVY',2,0,0,-D/2+3,'wander',[-10,10,-D/2+2.5,-D/2+5],.6);
  // dancers on the LED floor, bobbing in a loose crowd
  for(let i=0;i<14;i++)person(null,1+(i%7),rnd(LF.x0+1,LF.x1-1),0,rnd(LF.z0+1,LF.z1-1),'dance',[LF.x0+.8,LF.x1-.8,LF.z0+.6,LF.z1-.6],.35);
  // dancers on the balcony and VIP guests seated in the booths
  for(let i=0;i<4;i++)person(null,2+i,rnd(BAL.x0+1,BAL.x1-1),BAL.h,rnd(BAL.z0+.8,BAL.z1-.8),'dance',[BAL.x0+1,BAL.x1-1,BAL.z0+.6,BAL.z1-.6],.2);
  for(const z of vipZ)person(null,pick([1,3,5,7]),W/2-2.8,0,z,'vip');

  // the queue out front: a few people waiting along the rope
  for(let i=0;i<3;i++)person(null,pick([1,2,3,4,5,6,7]),DW/2+.6+.5*Math.sin(i),0,-D/2-5-i*2.2,'queue');

  /* ---------- hooks for town.js ---------- */
  pt(W/2-7,D/2-2.4,'DANCE FLOOR · JOIN THE CROWD',"The bass drops. Everyone's moving.");
  pt(0,-D/2+3.6,'ENTRANCE · VELVET ROPE',"Bouncer Joe: 'Name on the list, or 2 CRYPTO at the door.'");
  function update(dt,P,t){
    inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<H-.5;
    const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;
    roof.visible=!inside||P.y>H;
    // LED floor: colours cycle on the beat (4 steps a second)
    const beat=Math.floor(t*4);
    for(const tl of tiles){const c=palette[(tl.i+tl.j+beat)%palette.length];tl.m.color.setHex(c);tl.m.color.multiplyScalar(.55+.45*Math.abs(Math.sin(t*4+tl.i*.6+tl.j*.4)))}
    // beams sweep, the mirror ball turns, lasers swing, turntables spin, smoke rises
    for(const b of beams){b.pivot.rotation.z=Math.sin(t*(.9+b.i*.12)+b.i)*.7;b.pivot.rotation.x=Math.cos(t*.7+b.i)*.25}
    ball.rotation.y=t*.6;
    for(const l of lasers){l.pv.rotation.z=Math.sin(t*(.8+l.i*.1)+l.i*1.3)*.9;l.pv.rotation.x=Math.cos(t*.5+l.i)*.4}
    for(const tt of turntables){tt.disc.rotation.y=t*2.2;tt.lab.rotation.y=t*2.2}
    for(const p of puffs){p.ph=(p.ph+dt*.12)%1;p.s.position.y=p.s.position.y;p.s.material.opacity=.12*Math.sin(p.ph*Math.PI);p.s.position.y=.5+p.ph*6}
    // people: dancers bob on the beat, wander a little, and the DJ bobs on the decks
    const beatT=t*2.2;
    for(const p of people){
      if(p.mode==='wander'||p.mode==='dance'){
        if(p.zone){
          p.wait-=dt;const dx=p.tx-p.x,dz=p.tz-p.z,d=Math.hypot(dx,dz);
          if(d<.2&&p.wait<=0){p.tx=rnd(p.zone[0],p.zone[1]);p.tz=rnd(p.zone[2],p.zone[3]);p.wait=rnd(1,3)}
          p.moving=p.wait<=0&&d>.2;
          if(p.moving){const st=Math.min(d,p.spd*dt);p.x+=dx/d*st;p.z+=dz/d*st}
        }
      }
      const f=getFront(p.variant);
      if(!f){p.sp.visible=false;if(p.tag)p.tag.visible=false;continue}
      p.sp.visible=true;if(p.tag)p.tag.visible=true;
      const bob=p.mode==='dance'||p.mode==='dj'||p.mode==='vip'?Math.abs(Math.sin(beatT+p.ph))*.18:0;
      // dancers alternate their two poses on the beat; everyone else stands in the idle pose or walks
      let frame=3;
      if(p.mode==='dance')frame=Math.floor(beatT+p.ph)%2?0:2;
      else if(p.moving)frame=Math.floor(t*6+p.ph)%4;
      p.sp.material=f[frame];
      p.sp.position.set(p.x,(p.y||0)+1.2+bob,p.z);
      if(p.tag)p.tag.position.set(p.x,(p.y||0)+2.9+bob,p.z);
    }
  }
  return{
    W,D,H,cx,cz,title,kind:'club',
    door:{x:cx,z:cz-D/2-3.6},
    lobby:{x:cx,z:cz-D/2+3},
    points:pts,
    staffCount:people.filter(p=>p.tag).length,
    get inside(){return inside},
    update
  };
}
