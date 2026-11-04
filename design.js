/* Shared building kit, in the same style as the President's office and the Super Home:
   canvas-drawn textures and signs, glow sprites, a worker system for people who live in a building,
   and a parking lot builder. Every building that uses this kit has real walls and colliders. */

export function kit(THREE){
  const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const basic=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const cyl=(p,rt,rb,h,m,x,y,z,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const plane=(p,w,h,m,x,y,z,ry=0)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry;p.add(o);return o};
  // a sign panel with lettering drawn on canvas
  const sign=(text,{w=512,h=128,bg='#0b1a33',fg='#f2c84b',border='#f2c84b',size=72,sub=null}={})=>tex(w,h,(g,W,H)=>{
    g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle=border;g.lineWidth=Math.max(6,H*.05);g.strokeRect(8,8,W-16,H-16);
    g.fillStyle=fg;g.font=`bold ${size}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,sub?H*.42:H/2);
    if(sub){g.font=`bold ${Math.round(size*.36)}px sans-serif`;g.fillText(sub,W/2,H*.76)}});
  // a glow sprite, for lamps and neon
  const glowTex=tex(64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
  const glow=(p,x,y,z,s,c,op=.7)=>{const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:op}));g.scale.set(s,s,1);g.position.set(x,y,z);p.add(g);return g};
  return{tex,mat,basic,box,cyl,plane,sign,glow};
}

/* Workers: people who live in a building. Each has a station (they stay at it) or a zone (they wander in it).
   They use the town's resident sprite sheets through getFront(variant). */
export function makeWorkers({THREE,root,labelSprite,getFront,defs}){
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const list=defs.map(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);sp.visible=false;root.add(sp);
    const tag=labelSprite(d.role,{w:2.6,size:54,color:'#eaf7ed',glow:'#7ddc1f',plate:true});root.add(tag);
    const st=d.station||null,z0=d.zone||[0,0,0,0];
    const x=st?st[0]:rnd(z0[0],z0[1]),z=st?st[1]:rnd(z0[2],z0[3]);
    return{...d,sp,tag,x,z,tx:x,tz:z,wait:rnd(0,3),ph:Math.random(),moving:false};
  });
  return{
    count:list.length,
    update(dt,t){
      for(const s of list){
        if(s.station){s.x=s.station[0];s.z=s.station[1];s.moving=false}
        else{
          s.wait-=dt;const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);
          if(d<.2&&s.wait<=0){s.tx=rnd(s.zone[0],s.zone[1]);s.tz=rnd(s.zone[2],s.zone[3]);s.wait=rnd(2,6)}
          s.moving=s.wait<=0&&d>.2;
          if(s.moving){const st=Math.min(d,s.spd*dt);s.x+=dx/d*st;s.z+=dz/d*st}
        }
        const f=getFront(s.variant);
        if(f){s.sp.visible=true;s.sp.material=f[s.moving?Math.floor(s.ph*4+t*6)%4:3]}else s.sp.visible=false;
        s.sp.position.set(s.x,1.2,s.z);s.tag.position.set(s.x,2.9,s.z);
      }
    }
  };
}

/* A parking lot: asphalt, painted bays, parked cars with colliders, and an optional reserved bay with a sign. */
export function makeParkingLot({THREE,scene,B,makeCarModel,cx,cz,W,D,reserved=null,cars=[]}){
  const k=kit(THREE);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const asphalt=k.tex(256,256,(g,w,h)=>{g.fillStyle='#2a2f33';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=`rgba(${Math.random()*40|0},${Math.random()*40|0},${Math.random()*40|0},.35)`;g.fillRect(Math.random()*w,Math.random()*h,2,2)}});
  asphalt.wrapS=asphalt.wrapT=THREE.RepeatWrapping;asphalt.repeat.set(W/10,D/10);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:asphalt,roughness:.9}));
  ground.rotation.x=-Math.PI/2;ground.position.y=.03;root.add(ground);
  const paint=new THREE.MeshBasicMaterial({color:new THREE.Color(.92,.95,.92)});
  const bayW=3.2,bayD=5.6,rows=[-(D/2-bayD/2-1),(D/2-bayD/2-1)];
  const bays=[];
  for(const rz of rows){
    const n=Math.floor((W-2)/bayW);
    for(let i=0;i<n;i++){
      const bx=-W/2+1+bayW*i+bayW/2;bays.push({x:bx,z:rz,face:rz<0?0:Math.PI});
    }
  }
  // painted lines: one line per bay edge, and the aisle markings
  for(const rz of rows){
    for(let i=0;i<=Math.floor((W-2)/bayW);i++){const bx=-W/2+1+bayW*i;const b=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,bayD),paint);b.position.set(bx,.05,rz);root.add(b)}
    const l=new THREE.Mesh(new THREE.BoxGeometry(W-2,.03,.12),paint);l.position.set(0,.05,rz+(rz<0?bayD/2:-bayD/2));root.add(l);
  }
  // parked cars, and collision for each one
  const COLS=[0xe9f4ea,0x4dd2ff,0xff4d4f,0x1a2a24,0xffc83d,0x7bff3a];
  bays.forEach((b,i)=>{
    if(i%3===1)return;               // some bays stay empty
    if(reserved&&i===reserved.bay)return;
    const car=makeCarModel(COLS[i%COLS.length],i%2?'suv':'sedan');
    car.position.set(b.x,0,b.z);car.rotation.y=b.face;root.add(car);
    B.push({x:cx+b.x,z:cz+b.z,hw:1,hd:2.2,h:1.6,name:null});
  });
  // the reserved bay: gold outline, a sign and a car, for the President
  if(reserved){
    const b=bays[reserved.bay];
    const gold=new THREE.MeshStandardMaterial({color:0xd9b24a,roughness:.3,metalness:.9});
    const frame=new THREE.Mesh(new THREE.BoxGeometry(bayW,.05,bayD),gold);frame.position.set(b.x,.06,b.z);root.add(frame);
    const sg=k.plane(root,2.6,.7,new THREE.MeshBasicMaterial({map:k.sign('RESERVED',{w:512,h:140,bg:'#1a1408',fg:'#f2c84b',border:'#d9b24a',size:76,sub:'PRESIDENT'})}),b.x,1.6,b.z+(b.z<0?-bayD/2+.1:bayD/2-.1),b.face);
    sg.rotation.x=0;
    const posts=[-1,1].map(s=>k.box(root,.12,1.6,.12,gold,b.x+s*1.25,0,b.z+(b.z<0?-bayD/2+.2:bayD/2-.2)));
  }
  // light poles along the front edge
  for(const x of[-W/2+3,0,W/2-3]){k.cyl(root,.08,.1,6,new THREE.MeshStandardMaterial({color:0x2a3035,metalness:.6}),x,0,D/2-.5);k.glow(root,x,6.2,D/2-.5,3,0xffe9b0,.8)}
  return{root,bays,W,D};
}

/* Exterior dressing shared by the venues and public buildings (same look as the Super Home):
   lit roofline trims, corner glow, a glowing ground strip, a striped awning over the entrance and an optional
   canvas-drawn floor pattern laid over the existing floor. */
export function dressVenue({THREE,root,k,W,D,H,accent=0xc8ff43,sec=0xff4d4f,awningColor=null,floor=null}){
  const acc=k.basic(accent,2),second=k.basic(sec,1.6);
  k.box(root,W+.5,.14,.14,acc,0,H+.15,-D/2-.2);
  k.box(root,W+.5,.14,.14,second,0,H+.15,D/2+.2);
  k.box(root,.14,.14,D+.5,acc,-W/2-.2,H+.15,0);
  k.box(root,.14,.14,D+.5,acc,W/2+.2,H+.15,0);
  for(const x of[-W/2,W/2])for(const z of[-D/2,D/2])k.glow(root,x,H+.3,z,3.2,accent,.45);
  k.box(root,W,.08,.12,acc,0,.12,-D/2-.1);
  if(awningColor){
    const t=k.tex(256,64,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#ffffff':awningColor;g.fillRect(i*w/8,0,w/8,h)}});
    k.box(root,8,.3,2.4,new THREE.MeshStandardMaterial({map:t,roughness:.6}),0,H*.5,-D/2-1.2);
  }
  if(floor){
    const t=k.tex(256,256,floor);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(W/8,D/8);
    const p=k.plane(root,W-2,D-2,new THREE.MeshStandardMaterial({map:t,roughness:.35}),0,.11,0,0);p.rotation.x=-Math.PI/2;
  }
}

/* Super Home furniture, shared so other rooms can use the same chairs and tables.
   Same construction as the Super Home: a dark padded seat on steel legs, oak tops on steel pedestals. */
export function homeKit(THREE){
  const m=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const steel=m(0xb8c4bc,{roughness:.25,metalness:.9});
  const darkM=m(0x1a1f1c,{roughness:.5,metalness:.4});
  const oakM=m(0x9a6a3c,{roughness:.55});
  const limeEm=new THREE.MeshBasicMaterial({color:0xc8ff43});
  const bx=(p,w,h,d,mt,x,y,z,ry=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);o.position.set(x,y+h/2,z);o.rotation.y=ry;p.add(o);return o};
  const cyl=(p,rt,rb,h,mt,x,y,z,seg=18)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mt);o.position.set(x,y+h/2,z);p.add(o);return o};
  // a chair facing direction ry (the sitter faces +z when ry is 0)
  function chair(p,x,y,z,ry,mt=darkM){
    const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);
    bx(g,.9,.12,.9,mt,0,.55,0);bx(g,.9,1,.12,mt,0,.6,-.4);
    for(const [a,b] of[[-.38,-.38],[.38,-.38],[-.38,.38],[.38,.38]])bx(g,.08,.55,.08,steel,a,0,b);
    return g;
  }
  // a round table: oak top on a steel pedestal, with a lime edge light
  function roundTable(p,x,y,z,r,h,topM=oakM){
    cyl(p,r,r,.1,topM,x,h-.1,z);cyl(p,.12,.12,h-.1,steel,x,y,z);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.025,8,40),limeEm);ring.rotation.x=Math.PI/2;ring.position.set(x,h+.01,z);p.add(ring);
    return p;
  }
  return{bx,cyl,chair,roundTable,steel,darkM,oakM,limeEm};
}
