/* ===================== SUPER TOWN · ENTERABLE VENUES =====================
   Walk-in buildings: Super Diner (restaurant) and Super Mall (shopping mall).
   Same contract as the office: real wall colliders with a doorway, walls fade while you are inside,
   and staff who work in the rooms. The mall is one large open floor with a visual gallery rail. */

export function makeVenue({THREE,scene,labelSprite,B,cx,cz,kind='restaurant',title='SUPER DINER'}){
  const mall=kind==='mall';
  const W=mall?34:20,D=mall?22:18,H=mall?10:7,T=.5,DW=5;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const basic=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const cyl=(p,rt,rb,h,m,x,y,z,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const col=(lx,lz,w,d,h)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name:null});

  /* ---------- materials ---------- */
  const wallM=mat(mall?0x1c2a33:0x2a1d18,{roughness:.4,metalness:.5,transparent:true});
  const floorM=mat(mall?0xd9dfe3:0x3a2418,{roughness:.35,metalness:.2});
  const roofM=mat(0x0e1a14,{roughness:.5,metalness:.7,transparent:true});
  const woodM=mat(0x6b4a2b,{roughness:.6}),darkM=mat(0x1a1f1c,{roughness:.5,metalness:.4}),chairM=mat(0x2b2f2d);
  const railM=mat(0x9aa5a0,{roughness:.3,metalness:.8});
  const neon=[0xc8ff43,0x4dd2ff,0xffc83d,0xff6b8a].map(c=>basic(c,2.2));
  const skyM=basic(0xe6fff4,1.1);

  /* ---------- shell: floor, four walls with a doorway on the street side, roof ---------- */
  box(root,W,.1,D,floorM,0,0,0);
  let wallO=.97,inside=false;
  const wall=(w,d,x,z)=>{box(root,w,H,d,wallM,x,0,z);col(x,z,w,d,H)};
  wall(W,T,0,D/2);                       // back
  wall(T,D,-W/2,0);wall(T,D,W/2,0);      // sides
  const side=(W-DW)/2,cxs=(W+DW)/4;      // front wall, left and right of the doorway
  wall(side,T,-cxs,-D/2);wall(side,T,cxs,-D/2);
  const roof=box(root,W+.4,.4,D+.4,roofM,0,H,0);
  if(mall)box(root,W-8,.08,D-8,skyM,0,H+.42,0); // skylight, seen from above

  /* ---------- sign ---------- */
  box(root,mall?12:8,1.1,.3,neon[0],0,H-1.7,-D/2-.05);
  const sign=labelSprite(title,{w:6,size:64,color:'#e9f6ea',glow:'#c8ff43',plate:true});
  sign.position.set(0,H+2.4,-D/2-.5);root.add(sign);

  /* ---------- interior dressing ---------- */
  if(!mall){
    // bar with stools, four tables with chairs, ceiling lights
    box(root,12,1.1,1.6,woodM,-2,0,D/2-3);box(root,12.4,.1,1.9,darkM,-2,1.1,D/2-3);col(-2,D/2-3,12,1.6,1.1);
    for(let i=0;i<4;i++)cyl(root,.35,.35,.8,chairM,-7+i*2.4,0,D/2-1.7);
    for(const [x,z] of[[-6,-2],[6,-2],[-6,3],[6,3]]){
      cyl(root,1.2,1.2,.1,woodM,x,.75,z);cyl(root,.12,.12,.75,darkM,x,0,z);col(x,z,1.4,1.4,1.2);
      for(const [dx,dz] of[[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]])box(root,.5,.5,.5,chairM,x+dx,0,z+dz);
    }
    for(let i=0;i<3;i++)box(root,.2,1.8,2.8,neon[i+1],-W/2+.15,2.6,-3+i*3);
  }else{
    // a row of shop fronts down both sides, a fountain in the middle, a gallery rail
    const zs=[-7,-2.5,2.5,7];
    zs.forEach((z,i)=>{for(const sx of[-1,1]){
      const x=sx*(W/2-1.2);box(root,.8,1.1,2.6,woodM,x,0,z);col(x,z,.8,2.6,1.1);
      box(root,.2,1.6,2.4,neon[(i+(sx>0?2:0))%4],sx*(W/2-.1),3.4,z);
    }});
    cyl(root,3.2,3.2,.6,mat(0xcfd8dc),0,0,0);cyl(root,2.8,2.8,.05,basic(0x4dd2ff,1.4),0,.6,0);col(0,0,6.4,6.4,.6);
    for(const z of[-9.5,9.5])box(root,3,.5,.8,woodM,0,0,z);
    const RX=W/2-1.2,RZ=D/2-1.2,ry=5;   // gallery rail, visual only
    box(root,2*RX,.12,.12,railM,0,ry,-RZ);box(root,2*RX,.12,.12,railM,0,ry,RZ);
    box(root,.12,.12,2*RZ,railM,-RX,ry,0);box(root,.12,.12,2*RZ,railM,RX,ry,0);
  }
  for(let x=-W/2+4;x<W/2-2;x+=6)for(const z of[-D/2+3,D/2-3])box(root,1.6,.08,1.6,basic(0xf4ffe0,2),x,H-.2,z);

  /* ---------- staff: they work the room and move around their zone ---------- */
  const figTex=(shirt,apron)=>{
    const c=document.createElement('canvas');c.width=64;c.height=96;const g=c.getContext('2d');
    g.fillStyle='#1a1410';g.fillRect(24,70,7,22);g.fillRect(34,70,7,22);
    g.fillStyle='#'+shirt.toString(16).padStart(6,'0');g.fillRect(20,38,24,34);
    g.fillStyle='#'+apron.toString(16).padStart(6,'0');g.fillRect(22,50,20,22);
    g.fillStyle='#e8c4a0';g.beginPath();g.arc(32,26,12,0,6.283);g.fill();
    g.fillStyle='#2a1a10';g.beginPath();g.arc(32,20,12,Math.PI,0);g.fill();
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const staffDef=mall?[
    {name:'CLERK ZOE',shirt:0x7bff3a,apron:0x1a2a24,zone:[-W/2+2.4,-W/2+4,-8,8]},
    {name:'CLERK RAY',shirt:0x4dd2ff,apron:0x1a2a24,zone:[W/2-4,W/2-2.4,-8,8]},
    {name:'CLERK IVY',shirt:0xff6b8a,apron:0x1a2a24,zone:[W/2-4,W/2-2.4,-8,8]},
    {name:'GUARD MAX',shirt:0x2a3a50,apron:0x2a3a50,zone:[-6,6,-6,6]},
    {name:'CASHIER LEO',shirt:0xffc83d,apron:0x1a2a24,zone:[-4,4,-D/2+2,-D/2+3.5]}
  ]:[
    {name:'WAITER ADA',shirt:0xffffff,apron:0x2a1d18,zone:[-7,7,-3.5,4]},
    {name:'WAITER MO',shirt:0xffffff,apron:0x2a1d18,zone:[-7,7,-3.5,4]},
    {name:'CHEF ZARA',shirt:0xe9e9e9,apron:0x7bff3a,zone:[-8,-3,D/2-1.9,D/2-.6]}
  ];
  const staff=staffDef.map(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:figTex(d.shirt,d.apron),alphaTest:.3,fog:true}));
    sp.scale.set(1.9,2.6,1);root.add(sp);
    const tag=labelSprite(d.name,{w:2.6,size:54,color:'#e9f6ea',glow:'#7ddc1f',plate:true});root.add(tag);
    const x=rnd(d.zone[0],d.zone[1]),z=rnd(d.zone[2],d.zone[3]);
    return{...d,sp,tag,x,z,tx:x,tz:z,wait:rnd(0,3),spd:rnd(.8,1.3)};
  });

  /* ---------- hooks for town.js ---------- */
  function update(dt,P,t){
    inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<H-.5;
    const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;
    roofM.opacity+=((inside?0:1)-roofM.opacity)*Math.min(1,dt*5);roof.visible=!inside||P.y>H;
    for(const s of staff){
      s.wait-=dt;
      const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);
      if(d<.3&&s.wait<=0){s.tx=rnd(s.zone[0],s.zone[1]);s.tz=rnd(s.zone[2],s.zone[3]);s.wait=rnd(2,6)}
      if(s.wait<=0&&d>.05){const st=Math.min(d,s.spd*dt);s.x+=dx/d*st;s.z+=dz/d*st}
      s.sp.position.set(s.x,1.3+Math.sin(t*3+s.x)*.03,s.z);s.tag.position.set(s.x,3,s.z);
    }
  }
  return{
    W,D,H,cx,cz,title,
    door:{x:cx,z:cz-D/2-3.6},           // the "walk in" prompt, out front
    lobby:{x:cx,z:cz-D/2+2.5},          // where "walk in" puts you, just inside the doorway
    get inside(){return inside},
    update
  };
}
