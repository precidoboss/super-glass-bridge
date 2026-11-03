/* ===================== SUPER TOWN · ENTERABLE VENUES (v2) =====================
   Super Diner (restaurant) and Super Mall: walk-in buildings with real walls and a doorway, walls that fade
   while you are inside, interactive points (menus, shop counters, kiosks), and staff who work the room.
   Staff use the same character sheet as the town's residents (getFront(variant) -> 4 front-facing frames). */

export function makeVenue({THREE,scene,labelSprite,B,cx,cz,kind='restaurant',title='SUPER DINER',getFront=()=>null}){
  const mall=kind==='mall';
  const W=mall?40:24,D=mall?26:20,H=mall?12:7,T=.5,DW=mall?8:5;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const basic=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const cyl=(p,rt,rb,h,m,x,y,z,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const sph=(p,r,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m);o.position.set(x,y,z);p.add(o);return o};
  const col=(lx,lz,w,d,h)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name:null});
  const pts=[];   // interactive points: {x,z,label,msg} or {x,z,label,enter:true}
  const pt=(lx,lz,label,msg)=>pts.push({x:cx+lx,z:cz+lz,label,msg});

  /* ---------- materials ---------- */
  const wallM=mat(mall?0x1d2b36:0x2e1f16,{roughness:.4,metalness:.5,transparent:true});
  const floorM=mat(mall?0xdfe6ea:0x4a2c1c,{roughness:.35,metalness:.2});
  const roofM=mat(0x0e1a14,{roughness:.5,metalness:.7,transparent:true});
  const woodM=mat(0x6b4a2b,{roughness:.6}),darkM=mat(0x1a1f1c,{roughness:.5,metalness:.4}),cushM=mat(0x7a1f2b,{roughness:.8});
  const steelM=mat(0xb9c2c6,{roughness:.25,metalness:.9}),greenM=mat(0x2f8a2a,{roughness:.8}),potM=mat(0x5a3a26);
  const glassM=mat(0x9fd8c6,{roughness:.1,metalness:.2,transparent:true,opacity:.28});
  const neon=[0xc8ff43,0x4dd2ff,0xffc83d,0xff6b8a,0xb08cff].map(c=>basic(c,2.2));
  const warm=basic(0xffd9a0,1.6),skyM=basic(0xe6fff4,1.1);

  /* ---------- shell ---------- */
  box(root,W,.1,D,floorM,0,0,0);
  let wallO=.97,inside=false;
  const wall=(w,d,x,z)=>{box(root,w,H,d,wallM,x,0,z);col(x,z,w,d,H)};
  wall(W,T,0,D/2);wall(T,D,-W/2,0);wall(T,D,W/2,0);
  const side=(W-DW)/2,cxs=(W+DW)/4;
  wall(side,T,-cxs,-D/2);wall(side,T,cxs,-D/2);
  const roof=box(root,W+.4,.4,D+.4,roofM,0,H,0);
  box(root,mall?W-12:W-8,.08,mall?D-10:D-8,skyM,0,H+.42,0);   // skylight
  // front windows either side of the doorway
  box(root,side-1,H-2.2,.1,glassM,-cxs,1.1,-D/2+.02);box(root,side-1,H-2.2,.1,glassM,cxs,1.1,-D/2+.02);

  /* ---------- sign ---------- */
  box(root,mall?16:11,1.4,.3,neon[0],0,H-1.9,-D/2-.05);
  const sign=labelSprite(title,{w:7,size:64,color:'#e9f6ea',glow:'#c8ff43',plate:true});
  sign.position.set(0,H+2.5,-D/2-.5);root.add(sign);

  const decor=[];    // staff stations and their zones, filled in below
  if(!mall){
    /* ===== SUPER DINER ===== */
    box(root,W-2,.02,D-2,mat(0x5a3322,{roughness:.7}),0,.08,0);                 // wood floor boards
    box(root,10,.03,6,basic(0x7a1f2b,.9),0,.1,-1);                               // rug
    // open kitchen along the back-left, with a steel pass and a hood
    box(root,9,1.1,1.5,steelM,-6.5,0,D/2-2.2);col(-6.5,D/2-2.2,9,1.5,1.1);
    box(root,9.6,.5,2.6,steelM,-6.5,H-2.9,D/2-2.2);
    box(root,9,2.9,.2,mat(0xe9efe9,{roughness:.4}),-6.5,0,D/2-.25);
    for(let i=0;i<4;i++)box(root,1.2,.6,.9,mat(0x343b38,{metalness:.6}),-9.4+i*2,1.1,D/2-2.2);  // stove tops
    // customer bar with stools, glowing top, and the menu board on the wall
    box(root,12,1.1,1.5,woodM,5,0,D/2-4.2);box(root,12.4,.12,1.9,darkM,5,1.1,D/2-4.2);col(5,D/2-4.2,12,1.5,1.1);
    box(root,12,.05,.12,basic(0xffc83d,1.4),5,1.2,D/2-3.4);
    for(let i=0;i<5;i++){cyl(root,.32,.32,.1,cushM,-.5+i*2.5,.75,D/2-2.5);cyl(root,.06,.06,.75,steelM,-.5+i*2.5,0,D/2-2.5)}
    box(root,7,2.5,.15,darkM,2,2.6,D/2-.1);box(root,6.4,2,.05,basic(0xc8ff43,.9),2,2.6,D/2-.15);
    // booths along the left wall
    for(const z of[-6,-1.5,3]){
      box(root,.5,1.9,3,cushM,-W/2+.45,0,z);
      box(root,1.6,.55,3,cushM,-W/2+1.3,0,z);
      box(root,1.1,.8,2.2,woodM,-W/2+3.2,0,z);col(-W/2+3.2,z,1.1,2.2,.8);col(-W/2+1.3,z,1.6,3,.6);
    }
    // round tables with chairs in the middle
    for(const [x,z] of[[-2,-4],[-2,2],[7,-4.5],[7,1.5],[2,-0.5]]){
      cyl(root,1.1,1.1,.08,woodM,x,.75,z);cyl(root,.12,.12,.75,darkM,x,0,z);col(x,z,1.5,1.5,1);
      for(const [dx,dz] of[[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]]){cyl(root,.36,.36,.08,cushM,x+dx,.45,z+dz);cyl(root,.05,.05,.45,darkM,x+dx,0,z+dz)}
    }
    // pendant lamps over the tables and a plant in each corner
    for(const [x,z] of[[-2,-4],[-2,2],[7,-4.5],[7,1.5],[2,-.5]])sph(root,.3,warm,x,H-1.6,z),box(root,.05,1.2,.05,darkM,x,H-2.8,z);
    for(const [x,z] of[[-W/2+1,-D/2+1.5],[W/2-1,-D/2+1.5],[-W/2+1,D/2-1.5],[W/2-1,D/2-1.5]]){cyl(root,.5,.4,.9,potM,x,0,z);sph(root,.9,greenM,x,1.3,z)}
    // neon ribbon down the left wall and OPEN light by the door
    for(let i=0;i<3;i++)box(root,.15,.14,4,neon[i+1],-W/2+.1,H-1.1,-4+i*4);
    box(root,1.6,.6,.1,neon[0],-cxs-1.8,H-1.8,-D/2+.1);
    // points: where to sit, order, and what the kitchen is up to
    pt(5,D/2-6,'SUPER DINER · ORDER AT THE BAR',"TODAY'S SPECIAL: SUPER BURGER + SHAKE · 3 CRYPTO");
    pt(-W/2+3.2,0,'BOOTH 2 · SIT DOWN',"Booth is yours. A waiter is on the way.");
    pt(-6.5,D/2-4,'OPEN KITCHEN · HEAR THE SIZZLE',"Chef Zara: 'Order up in three!'");
    pt(-2,-4,'TABLE 4 · SHARE A PIZZA',"Two pizzas, one drink each. Good call.");
    // staff: chef and cook on the line, a cashier at the bar, two waiters, a host
    decor.push(
      {role:'CHEF ZARA',variant:1,zone:[-9.5,-3.5,D/2-3.8,D/2-.8],spd:.5,station:[-6.5,D/2-3.2]},
      {role:'COOK LIO',variant:4,zone:[-9.5,-3.5,D/2-3.8,D/2-.8],spd:.5,station:[-9.5,D/2-3.2]},
      {role:'CASHIER VI',variant:6,zone:[9.5,11,D/2-4,D/2-2.4],spd:.4,station:[10.2,D/2-3]},
      {role:'WAITER ADA',variant:2,zone:[-6,9,-7,3],spd:1.1},
      {role:'WAITER MO',variant:3,zone:[-6,9,-7,3],spd:1.0},
      {role:'HOST NOA',variant:5,zone:[-3,3,-D/2+1.5,-D/2+3],spd:.4}
    );
  }else{
    /* ===== SUPER MALL ===== */
    box(root,W-2,.02,D-2,mat(0xf1f5f7,{roughness:.3}),0,.08,0);                  // polished tiles
    cyl(root,9,9,.04,basic(0xe6fff4,.5),0,.1,-2);                                  // atrium light circle
    // fountain centre-court
    cyl(root,4,4,.7,mat(0xcfd8dc,{roughness:.5}),0,0,-2);cyl(root,3.4,3.4,.05,basic(0x4dd2ff,1.4),0,.66,-2);
    cyl(root,.3,.3,3,steelM,0,.7,-2);sph(root,.5,basic(0x4dd2ff,2),0,3.9,-2);col(0,-2,8,8,.7);
    pt(0,-2,'SUPER FOUNTAIN · MAKE A WISH',"Coins in the fountain go to the Super Town park fund.");
    // benches and planters
    for(const [x,z] of[[-9,-6],[9,-6],[-9,4],[9,4]]){box(root,3,.5,.8,woodM,x,0,z);col(x,z,3,.8,.5)}
    for(const [x,z] of[[-W/2+2.2,-D/2+2.2],[W/2-2.2,-D/2+2.2],[-W/2+2.2,D/2-2.2],[W/2-2.2,D/2-2.2],[-W/2+2.2,0],[W/2-2.2,0]]){
      cyl(root,.9,.7,1,potM,x,0,z);sph(root,1.3,greenM,x,1.6,z);col(x,z,1.8,1.8,1);
    }
    // shop units down both side walls, each with its own neon
    const shops=[['LUNA BOUTIQUE','Spring drop: mint jackets, 20% off.',0x7bff3a],['PIXEL ELECTRONICS','Headphones, GPUs, a very loud sale.',0x4dd2ff],
      ['PAGE & BREW','Books and espresso. Sit a while.',0xffc83d],['ZONE SNEAKERS','Limited pair on the wall. Ask staff.',0xff6b8a],
      ['GAMEHOUSE ARCADE','Insert coin. Two plays for 1 SUPER.',0xb08cff],['NOVA JEWELS','Lab-grown gems, certified in the back.',0xc8ff43]];
    const sz=[-9,-1.5,6];
    let si=0;
    for(const side of[-1,1])for(const z of sz){
      const [name,msg,colr]=shops[si++];
      const x=side*(W/2-2.2);
      box(root,2.6,1.1,3.2,woodM,x,0,z);col(x,z,2.6,3.2,1.1);
      box(root,.25,2.2,2.8,glassM,side*(W/2-3.6),0,z);                           // glass display front
      box(root,.25,1.8,2.2,basic(colr,1.5),side*(W/2-.1),3.4,z);               // neon fascia on the wall
      cyl(root,.35,.35,1.2,mat(0xe9efe9),x,1.1,z);sph(root,.3,basic(colr,.8),x,2.45,z);   // mannequin/display
      pt(side*(W/2-5),z,name,msg);
      decor.push({role:name.split(' ')[0]+' CLERK',variant:(si%7)+1,zone:[x-side*.6-.3,x-side*.6+.3,z-.6,z+.6],spd:.35,station:[side*(W/2-4.2),z]});
    }
    // food court at the back: three kiosks with awnings and tables
    const kx=[-10,-3,4];const kiosks=['NOODLE BAR','TACO SUPER','FROZEN ORBIT'];
    kx.forEach((x,i)=>{
      box(root,4.2,1.1,1.8,woodM,x,0,D/2-3);col(x,D/2-3,4.2,1.8,1.1);
      box(root,4.6,.4,2.4,basic([0xffc83d,0xff6b8a,0x4dd2ff][i],1.2),x,2.7,D/2-3);
      pt(x,D/2-5.2,kiosks[i],['Hot noodles, extra spice. Free chopsticks.','Two tacos for the price of one, today.','Frozen treats in three flavours.'][i]);
      decor.push({role:kiosks[i].split(' ')[0]+' COOK',variant:(i+3)%7+1,zone:[x-.8,x+.8,D/2-3.6,D/2-2.6],spd:.25,station:[x,D/2-2.4]});
    });
    for(const [x,z] of[[-10,D/2-7],[-3,D/2-7],[4,D/2-7]]){cyl(root,1.5,1.5,.08,woodM,x,.75,z);cyl(root,.14,.14,.75,darkM,x,0,z);col(x,z,2.4,2.4,1)}
    // escalator (visual) at the back-right and an info desk by the entrance
    box(root,4,.5,7,steelM,W/2-7,0,-D/2+8);
    box(root,5,1.1,1.8,woodM,-W/2+7,0,-D/2+3.5);col(-W/2+7,-D/2+3.5,5,1.8,1.1);
    pt(-W/2+7,-D/2+5.2,'INFO DESK · MALL MAP',"You are here. The food court is at the back, past the fountain.");
    // gallery rail (visual) and a couple of banners
    const RX=W/2-1.2,RZ=D/2-1.2,ry=6;
    box(root,2*RX,.14,.14,steelM,0,ry,-RZ);box(root,2*RX,.14,.14,steelM,0,ry,RZ);box(root,.14,.14,2*RZ,steelM,-RX,ry,0);box(root,.14,.14,2*RZ,steelM,RX,ry,0);
    for(const x of[-RX+.5,RX-.5])box(root,.6,4.5,.6,mat(0x2a3a44),x,0,-RZ+1.5);
    for(const x of[-10,-2,6,14])box(root,.1,5.5,1.2,basic([0xc8ff43,0x4dd2ff,0xffc83d,0xff6b8a][Math.abs(x)%4],1.1),x,6.5,RZ-.3);
    // staff: the security guard and a cleaner
    decor.push({role:'GUARD MAX',variant:7,zone:[-6,6,-D/2+2.5,-D/2+4.5],spd:.6});
    decor.push({role:'CLEANER IVY',variant:2,zone:[-9,9,-6,8],spd:.7});
  }
  for(let x=-W/2+4;x<W/2-2;x+=6)for(const z of[-D/2+3,D/2-3])box(root,1.6,.08,1.6,basic(0xf4ffe0,2),x,H-.2,z);

  /* ---------- staff: they use the town's resident sprites and stay in their zone or at their station ---------- */
  const staff=decor.map(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);sp.visible=false;root.add(sp);
    const tag=labelSprite(d.role,{w:2.6,size:54,color:'#e9f6ea',glow:'#7ddc1f',plate:true});root.add(tag);
    const z=d.zone;const x=rnd(z[0],z[1]),zz=rnd(z[2],z[3]);
    return{...d,sp,tag,x,z:zz,tx:x,tz:zz,wait:rnd(0,3),ph:rnd(0,1)};
  });

  /* ---------- per-frame update ---------- */
  function update(dt,P,t){
    inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<H-.5;
    const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;
    roofM.opacity+=((inside?0:1)-roofM.opacity)*Math.min(1,dt*5);roof.visible=!inside||P.y>H;
    for(const s of staff){
      s.wait-=dt;
      const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);
      if(d<.2&&s.wait<=0){s.tx=rnd(s.zone[0],s.zone[1]);s.tz=rnd(s.zone[2],s.zone[3]);s.wait=rnd(1.5,5)}
      const moving=s.wait<=0&&d>.2;
      if(moving){const st=Math.min(d,s.spd*dt);s.x+=dx/d*st;s.z+=dz/d*st}
      const front=getFront(s.variant);
      if(front){s.sp.visible=true;s.sp.material=front[moving?Math.floor((t*6+s.ph*4))%4:3]}else s.sp.visible=false;
      s.sp.position.set(s.x,1.2,s.z);s.tag.position.set(s.x,2.9,s.z);
    }
  }

  return{
    W,D,H,cx,cz,title,kind,
    door:{x:cx,z:cz-D/2-3.6},
    lobby:{x:cx,z:cz-D/2+2.5},
    points:pts,
    staffCount:staff.length,
    get inside(){return inside},
    update
  };
}
