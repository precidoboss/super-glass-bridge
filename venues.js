/* ===================== SUPER TOWN · ENTERABLE VENUES (v3) =====================
   Super Diner (restaurant) and Super Mall, both walk-in.
   Restaurant: customers arrive, sit, order from the menu, a waiter takes the order, a chef and cook prepare it,
   a waiter serves it, the customer eats, pays at the register and leaves. Staff run the room.
   Mall: stocked shelves in every shop, shoppers browse the stalls and leave. Staff use the town's resident sprites. */

export function makeVenue({THREE,scene,labelSprite,B,cx,cz,kind='restaurant',title='SUPER DINER',getFront=()=>null,kit=null}){
  const mall=kind==='mall';
  const W=mall?40:24,D=mall?26:20,H=mall?12:7,T=.5,DW=mall?8:5;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const basic=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const cyl=(p,rt,rb,h,m,x,y,z,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const sph=(p,r,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m);o.position.set(x,y,z);p.add(o);return o};
  const col=(lx,lz,w,d,h)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name:null});
  const pts=[];
  // a prop is an empty slot that fills with its public-domain model once the model has loaded
  const wants=[];
  const prop=(name,x,y,z,{ry=0,s=1}={})=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;g.scale.setScalar(s);root.add(g);wants.push({name,g});return g};
  const fill=()=>{if(!kit)return;for(let i=wants.length-1;i>=0;i--){const t=kit.get(wants[i].name);if(t){wants[i].g.add(t.clone(true));wants.splice(i,1)}}};
  const pt=(lx,lz,label,msg)=>pts.push({x:cx+lx,z:cz+lz,label,msg});
  const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};

  /* ---------- materials ---------- */
  const wallM=mat(mall?0x1d2b36:0x2e1f16,{roughness:.4,metalness:.5,transparent:true});
  const floorM=mat(mall?0xdfe6ea:0x4a2c1c,{roughness:.35,metalness:.2});
  const roofM=mat(0x0e1a14,{roughness:.5,metalness:.7,transparent:true});
  const woodM=mat(0x6b4a2b,{roughness:.6}),darkM=mat(0x1a1f1c,{roughness:.5,metalness:.4}),cushM=mat(0x7a1f2b,{roughness:.8});
  const steelM=mat(0xb9c2c6,{roughness:.25,metalness:.9}),greenM=mat(0x2f8a2a,{roughness:.8}),potM=mat(0x5a3a26);
  const glassM=mat(0x9fd8c6,{roughness:.1,metalness:.2,transparent:true,opacity:.28});
  const plateM=mat(0xf4f4f0,{roughness:.2}),foodM=basic(0xff9a3d,1.2);
  const neon=[0xc8ff43,0x4dd2ff,0xffc83d,0xff6b8a,0xb08cff].map(c=>basic(c,2.2));
  const warm=basic(0xffd9a0,1.6),skyM=basic(0xe6fff4,1.1);
  const bubM={yellow:basic(0xffc83d,2),orange:basic(0xff8a3d,2),cyan:basic(0x4dd2ff,2),green:basic(0x7bff3a,2)};

  /* ---------- shell ---------- */
  box(root,W,.1,D,floorM,0,0,0);
  let wallO=.97,inside=false;
  const wall=(w,d,x,z)=>{box(root,w,H,d,wallM,x,0,z);col(x,z,w,d,H)};
  wall(W,T,0,D/2);wall(T,D,-W/2,0);wall(T,D,W/2,0);
  const side=(W-DW)/2,cxs=(W+DW)/4;
  wall(side,T,-cxs,-D/2);wall(side,T,cxs,-D/2);
  const roof=box(root,W+.4,.4,D+.4,roofM,0,H,0);
  box(root,mall?W-12:W-8,.08,mall?D-10:D-8,skyM,0,H+.42,0);
  box(root,side-1,H-2.2,.1,glassM,-cxs,1.1,-D/2+.02);box(root,side-1,H-2.2,.1,glassM,cxs,1.1,-D/2+.02);
  box(root,mall?16:11,1.4,.3,neon[0],0,H-1.9,-D/2-.05);
  const sign=labelSprite(title,{w:7,size:64,color:'#e9f6ea',glow:'#c8ff43',plate:true});
  sign.position.set(0,H+2.5,-D/2-.5);root.add(sign);

  const LOBBY={x:0,z:-D/2+2.5},OUTSIDE={x:0,z:-D/2-3.6};
  const seats=[],stops=[];
  const kitchen={tickets:[],ready:[]};
  let sales=0;
  const decor=[];

  if(!mall){
    /* ===== SUPER DINER ===== */
    box(root,W-2,.02,D-2,mat(0x5a3322,{roughness:.7}),0,.08,0);
    box(root,10,.03,6,basic(0x7a1f2b,.9),0,.1,-1);
    // open kitchen (back-left) with steel pass, hood, stove tops
    box(root,9,1.1,1.5,steelM,-6.5,0,D/2-2.2);col(-6.5,D/2-2.2,9,1.5,1.1);
    box(root,9.6,.5,2.6,steelM,-6.5,H-2.9,D/2-2.2);
    box(root,9,2.9,.2,mat(0xe9efe9,{roughness:.4}),-6.5,0,D/2-.25);
    for(let i=0;i<4;i++)box(root,1.2,.6,.9,mat(0x343b38,{metalness:.6}),-9.4+i*2,1.1,D/2-2.2);
    // customer bar with stools and a bottle shelf on the right wall
    box(root,12,1.1,1.5,woodM,5,0,D/2-4.2);box(root,12.4,.12,1.9,darkM,5,1.1,D/2-4.2);col(5,D/2-4.2,12,1.5,1.1);
    box(root,12,.05,.12,basic(0xffc83d,1.4),5,1.2,D/2-3.4);
    for(let i=0;i<5;i++)prop('stoolBar',-.5+i*2.5,0,D/2-2.5,{s:1.74});
    box(root,.4,2.2,6,darkM,W/2-.3,1,-4);
    const bottleCols=[0x7bff3a,0xff6b8a,0x4dd2ff,0xffc83d,0xb08cff];
    for(let i=0;i<3;i++)for(let j=0;j<5;j++)box(root,.25,.6,.25,basic(bottleCols[(i+j)%5],.9),W/2-.4,1+i*.7+.2,-6+j*1.1);
    // menu board on the back wall
    const menuTex=canvasTex(512,256,(g,w,h)=>{
      g.fillStyle='#0e1a14';g.fillRect(0,0,w,h);g.strokeStyle='#c8ff43';g.lineWidth=6;g.strokeRect(8,8,w-16,h-16);
      g.fillStyle='#c8ff43';g.font='bold 40px sans-serif';g.fillText('SUPER DINER · MENU',24,58);
      g.fillStyle='#e9f6ea';g.font='30px sans-serif';
      [['SUPER BURGER','12'],['PIZZA SLICE','6'],['NOODLE BOWL','9'],['FRIES','4'],['SHAKE','5'],['SALAD','7']].forEach(([a,b],i)=>{
        const y=104+i*28;g.fillText(a,28,y);g.fillText(b+' CRYPTO',w-200,y)});
    });
    box(root,6,2.4,.1,new THREE.MeshBasicMaterial({map:menuTex}),2,2.6,D/2-.05);
    // booths along the left wall
    for(const z of[-6,-1.5,3]){
      box(root,.5,1.9,3,cushM,-W/2+.45,0,z);box(root,1.6,.55,3,cushM,-W/2+1.3,0,z);
      box(root,1.1,.8,2.2,woodM,-W/2+3.2,0,z);col(-W/2+3.2,z,1.1,2.2,.8);col(-W/2+1.3,z,1.6,3,.6);
      seats.push({x:-W/2+2.1,z,table:{x:-W/2+3.2,z},c:null,food:false});
    }
    // round tables with four chairs each
    for(const [x,z] of[[-2,-4],[-2,2],[7,-4.5],[7,1.5],[2,-.5]]){
      prop('tableRound',x,0,z,{s:2.5});col(x,z,2.0,2.0,1);
      for(const [dx,dz] of[[1.45,0],[-1.45,0],[0,1.45],[0,-1.45]]){
        prop('chairRounded',x+dx,0,z+dz,{s:2.1,ry:Math.atan2(-dx,-dz)});
        seats.push({x:x+dx,z:z+dz,table:{x,z},c:null,food:false});
      }
      sph(root,.3,warm,x,H-1.6,z);box(root,.05,1.2,.05,darkM,x,H-2.8,z);
    }
    // plates for every seat, shown while a customer is eating
    for(const s of seats){
      const px=s.table.x+(s.x-s.table.x)*.55,pz=s.table.z+(s.z-s.table.z)*.55;
      s.plate=prop('plate-dinner',px,.8,pz,{s:.34});
      s.foodMesh=prop('burger',px,.84,pz,{s:.45});s.plate.visible=false;s.foodMesh.visible=false;
    }
    // chandelier, plants, neon, OPEN light
    sph(root,.8,warm,0,H-1.2,0);for(let i=0;i<6;i++){const a=i/6*6.283;sph(root,.2,warm,Math.cos(a)*1.1,H-1.3,Math.sin(a)*1.1)}
    for(const [x,z] of[[-W/2+1,-D/2+1.5],[W/2-1,-D/2+1.5],[-W/2+1,D/2-1.5],[W/2-1,D/2-1.5]])prop('pottedPlant',x,0,z,{s:1.6});
    for(let i=0;i<3;i++)box(root,.15,.14,4,neon[i+1],-W/2+.1,H-1.1,-4+i*4);
    box(root,1.6,.6,.1,neon[0],-cxs-1.8,H-1.8,-D/2+.1);
    // points on the floor
    pt(5,D/2-6,'SUPER DINER · ORDER AT THE BAR',"Tap the bar for today's special: SUPER BURGER + SHAKE · 17 CRYPTO");
    pt(-W/2+3.2,0,'BOOTH 2 · SIT DOWN',"Grab a booth. A waiter is on the way.");
    pt(-6.5,D/2-4,'OPEN KITCHEN · HEAR THE SIZZLE',"Chef Zara: 'Order up in three!'");
    pt(-2,-4,'TABLE 1 · SHARE A PIZZA',"Two pizzas, one drink each. Good call.");
    pt(10.5,D/2-5.8,'REGISTER · PAY YOUR BILL',"Thank you. Come back soon.");
    // staff
    decor.push(
      {job:'chef',role:'CHEF ZARA',variant:1,zone:[-9.5,-3.5,D/2-3.8,D/2-.8],spd:.6,station:[-6.5,D/2-3.4]},
      {job:'cook',role:'COOK LIO',variant:4,zone:[-9.5,-3.5,D/2-3.8,D/2-.8],spd:.6,station:[-9.5,D/2-3.4]},
      {job:'cashier',role:'CASHIER VI',variant:6,zone:[10,11,D/2-3.6,D/2-2.6],spd:.5,station:[10.2,D/2-2.9]},
      {job:'waiter',role:'WAITER ADA',variant:2,zone:[-6,9,-7,3],spd:1.3},
      {job:'waiter',role:'WAITER MO',variant:3,zone:[-6,9,-7,3],spd:1.2},
      {job:'host',role:'HOST NOA',variant:5,zone:[-3,3,-D/2+1.5,-D/2+3],spd:.5}
    );
  }else{
    /* ===== SUPER MALL ===== */
    box(root,W-2,.02,D-2,mat(0xf1f5f7,{roughness:.3}),0,.08,0);
    cyl(root,9,9,.04,basic(0xe6fff4,.5),0,.1,-2);
    cyl(root,4,4,.7,mat(0xcfd8dc,{roughness:.5}),0,0,-2);cyl(root,3.4,3.4,.05,basic(0x4dd2ff,1.4),0,.66,-2);
    cyl(root,.3,.3,3,steelM,0,.7,-2);sph(root,.5,basic(0x4dd2ff,2),0,3.9,-2);col(0,-2,8,8,.7);
    pt(0,-2,'SUPER FOUNTAIN · MAKE A WISH',"Coins in the fountain go to the Super Town park fund.");
    for(const [x,z] of[[-9,-6],[9,-6],[-9,4],[9,4]]){box(root,3,.5,.8,woodM,x,0,z);col(x,z,3,.8,.5)}
    for(const [x,z] of[[-W/2+2.2,-D/2+2.2],[W/2-2.2,-D/2+2.2],[-W/2+2.2,D/2-2.2],[W/2-2.2,D/2-2.2],[-W/2+2.2,0],[W/2-2.2,0]]){
      cyl(root,.9,.7,1,potM,x,0,z);sph(root,1.3,greenM,x,1.6,z);col(x,z,1.8,1.8,1);
    }
    const shops=[['LUNA BOUTIQUE','Spring drop: mint jackets, 20% off.',0x7bff3a],['PIXEL ELECTRONICS','Headphones, GPUs, a very loud sale.',0x4dd2ff],
      ['PAGE & BREW','Books and espresso. Sit a while.',0xffc83d],['ZONE SNEAKERS','Limited pair on the wall. Ask staff.',0xff6b8a],
      ['GAMEHOUSE ARCADE','Insert coin. Two plays for 1 SUPER.',0xb08cff],['NOVA JEWELS','Lab-grown gems, certified in the back.',0xc8ff43]];
    const sz=[-9,-1.5,6];
    const prodCols=[0xff6b8a,0x4dd2ff,0xffc83d,0x7bff3a,0xb08cff,0xffffff,0x2a3a50,0xc8ff43];
    const prods=[];
    let si=0;
    for(const sd of[-1,1])for(const z of sz){
      const [name,msg,colr]=shops[si];const sIdx=si++;
      const x=sd*(W/2-2.2);
      box(root,2.6,1.1,3.2,woodM,x,0,z);col(x,z,2.6,3.2,1.1);
      box(root,.25,2.2,2.8,glassM,sd*(W/2-3.6),0,z);
      box(root,.25,1.8,2.2,basic(colr,1.5),sd*(W/2-.1),3.4,z);
      cyl(root,.35,.35,1.2,mat(0xe9efe9),x,1.1,z);sph(root,.3,basic(colr,.8),x,2.45,z);
      // shelves of stock along the wall behind each shop
      for(const lv of[1.4,2.4,3.4]){
        box(root,.9,.1,2.8,woodM,sd*(W/2-.5),lv,z);
        for(const dz of[-.9,-.3,.3,.9])prods.push({x:sd*(W/2-.5),y:lv+.2,z:z+dz,c:pick(prodCols)});
      }
      prop(['bag','carton','soda-bottle','can','cocktail','mug'][sIdx],x,1.1,z,{s:1.3});
      pt(sd*(W/2-5),z,name,msg);
      stops.push({x:sd*(W/2-5),z});
      decor.push({job:'clerk',role:name.split(' ')[0]+' CLERK',variant:(sIdx%7)+1,zone:[x-sd*.6-.3,x-sd*.6+.3,z-.6,z+.6],spd:.45,station:[sd*(W/2-4.2),z]});
    }
    // stock as one instanced mesh
    if(prods.length){
      const im=new THREE.InstancedMesh(new THREE.BoxGeometry(.4,.5,.35),mat(0xffffff,{roughness:.5}),prods.length),m=new THREE.Matrix4(),c=new THREE.Color();
      prods.forEach((p,i)=>{m.makeTranslation(p.x,p.y,p.z);im.setMatrixAt(i,m);im.setColorAt(i,c.set(p.c))});
      im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;root.add(im);
    }
    // food court: three kiosks with awnings, tables and chairs
    const kx=[-10,-3,4],kiosks=['NOODLE BAR','TACO SUPER','FROZEN ORBIT'],kmsg=['Hot noodles, extra spice. Free chopsticks.','Two tacos for the price of one, today.','Frozen treats in three flavours.'];
    kx.forEach((x,i)=>{
      box(root,4.2,1.1,1.8,woodM,x,0,D/2-3);col(x,D/2-3,4.2,1.8,1.1);
      box(root,4.6,.4,2.4,basic([0xffc83d,0xff6b8a,0x4dd2ff][i],1.2),x,2.7,D/2-3);
      prop(['taco','fries','ice-cream-cup'][i],x,1.1,D/2-3,{s:1.4});
      pt(x,D/2-5.2,kiosks[i],kmsg[i]);
      stops.push({x,z:D/2-5.2});
      decor.push({job:'cook',role:kiosks[i].split(' ')[0]+' COOK',variant:(i+3)%7+1,zone:[x-.8,x+.8,D/2-3.6,D/2-2.6],spd:.3,station:[x,D/2-2.4]});
    });
    for(const [x,z] of[[-10,D/2-7],[-3,D/2-7],[4,D/2-7]]){
      prop('tableRound',x,0,z,{s:3});col(x,z,2.4,2.4,1);
      for(const [dx,dz] of[[1.6,0],[-1.6,0],[0,1.6],[0,-1.6]])prop('chairRounded',x+dx,0,z+dz,{s:2.1,ry:Math.atan2(-dx,-dz)});
    }
    // escalator (visual), info desk, gallery rail, pillars, banners
    box(root,4,.5,7,steelM,W/2-7,0,-D/2+8);
    box(root,5,1.1,1.8,woodM,-W/2+7,0,-D/2+3.5);col(-W/2+7,-D/2+3.5,5,1.8,1.1);
    pt(-W/2+7,-D/2+5.2,'INFO DESK · MALL MAP',"You are here. The food court is at the back, past the fountain.");
    const RX=W/2-1.2,RZ=D/2-1.2,ry=6;
    box(root,2*RX,.14,.14,steelM,0,ry,-RZ);box(root,2*RX,.14,.14,steelM,0,ry,RZ);box(root,.14,.14,2*RZ,steelM,-RX,ry,0);box(root,.14,.14,2*RZ,steelM,RX,ry,0);
    for(const x of[-RX+.5,RX-.5])box(root,.6,4.5,.6,mat(0x2a3a44),x,0,-RZ+1.5);
    [-10,-2,6,14].forEach((x,i)=>box(root,.1,5.5,1.2,basic([0xc8ff43,0x4dd2ff,0xffc83d,0xff6b8a][i],1.1),x,6.5,RZ-.3));
    decor.push({job:'guard',role:'GUARD MAX',variant:7,zone:[-6,6,-D/2+2.5,-D/2+4.5],spd:.6});
    decor.push({job:'clean',role:'CLEANER IVY',variant:2,zone:[-9,9,-6,8],spd:.7});
  }
  for(let x=-W/2+4;x<W/2-2;x+=6)for(const z of[-D/2+3,D/2-3])box(root,1.6,.08,1.6,basic(0xf4ffe0,2),x,H-.2,z);

  /* ---------- movement helper ---------- */
  // steps o toward (tx,tz); returns true once it has arrived
  function go(o,tx,tz,dt,spd=o.spd){
    const dx=tx-o.x,dz=tz-o.z,d=Math.hypot(dx,dz);
    if(d<.15)return true;
    const st=Math.min(d,spd*dt);o.x+=dx/d*st;o.z+=dz/d*st;return false;
  }

  /* ---------- staff ---------- */
  const staff=decor.map(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);sp.visible=false;root.add(sp);
    const tag=labelSprite(d.role,{w:2.6,size:54,color:'#e9f6ea',glow:'#7ddc1f',plate:true});root.add(tag);
    const st=d.station||null;
    const x=st?st[0]:rnd(d.zone[0],d.zone[1]),z=st?st[1]:rnd(d.zone[2],d.zone[3]);
    return{...d,sp,tag,x,z,tx:x,tz:z,wait:rnd(0,3),ph:rnd(0,1),task:null,cook:null,t2:0,moving:false};
  });
  function staffWander(s,dt){
    s.wait-=dt;const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);
    if(d<.2&&s.wait<=0){s.tx=rnd(s.zone[0],s.zone[1]);s.tz=rnd(s.zone[2],s.zone[3]);s.wait=rnd(1.5,5)}
    s.moving=s.wait<=0&&d>.2;
    if(s.moving){const st=Math.min(d,s.spd*dt);s.x+=dx/d*st;s.z+=dz/d*st}
  }
  function staffUpdate(s,dt){
    if(!mall&&s.job==='waiter'){
      if(!s.task){
        const c=customers.find(c=>c.active&&c.state==='seated'&&!c.claimed);
        if(c){c.claimed=true;s.task={type:'order',c}}
        else if(kitchen.ready.length){s.task={type:'pick'}}
      }
      const t=s.task;
      if(t&&t.type==='order'){
        s.moving=!go(s,t.c.seat.x,t.c.seat.z,dt);
        if(!s.moving){s.t2+=dt;if(s.t2>2){s.t2=0;t.c.state='ordered';t.c.bubble('orange');kitchen.tickets.push(t.c);s.task=null}}
      }else if(t&&t.type==='pick'){
        const pass={x:-6.5,z:D/2-3.6};
        s.moving=!go(s,pass.x,pass.z,dt);
        if(!s.moving){s.t2+=dt;if(s.t2>1.2){s.t2=0;const r=kitchen.ready.shift();if(r){s.task={type:'deliver',c:r}}else s.task=null}}
      }else if(t&&t.type==='deliver'){
        s.moving=!go(s,t.c.seat.x,t.c.seat.z,dt);
        if(!s.moving){t.c.serve();s.task=null}
      }else staffWander(s,dt);
    }else if(!mall&&(s.job==='chef'||s.job==='cook')){
      if(!s.cook&&kitchen.tickets.length){s.cook={c:kitchen.tickets.shift(),t:rnd(5,7)}}
      if(s.cook){
        s.moving=!go(s,s.station[0],s.station[1],dt);
        if(!s.moving){s.cook.t-=dt;if(s.cook.t<=0){kitchen.ready.push(s.cook.c);s.cook=null}}
      }else{s.moving=!go(s,s.station[0],s.station[1],dt);}
    }else if(!mall&&s.job==='cashier'){
      s.moving=!go(s,s.station[0],s.station[1],dt);
    }else if(mall&&(s.job==='clerk'||s.job==='cook')){
      s.x=s.station[0];s.z=s.station[1];s.moving=false;
    }else staffWander(s,dt);
    const front=getFront(s.variant);
    if(front){s.sp.visible=true;s.sp.material=front[s.moving?Math.floor(s.ph*4+ (Date.now()/160))%4:3]}else s.sp.visible=false;
    s.sp.position.set(s.x,1.2,s.z);s.tag.position.set(s.x,2.9,s.z);
  }

  /* ---------- customers and shoppers (pooled sprites) ---------- */
  const customers=[];
  const cap=mall?10:9;
  for(let i=0;i<cap;i++){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);sp.visible=false;root.add(sp);
    const bub=new THREE.Mesh(new THREE.BoxGeometry(.45,.45,.1),bubM.yellow);bub.visible=false;root.add(bub);
    const c={sp,bub,active:false,x:0,z:0,path:[],state:'',t:0,seat:null,variant:1+(i%7),spd:rnd(1.6,2.2),ph:rnd(0,1),wait:0,claimed:false,moving:false,
      bubble(k){if(k){bub.material=bubM[k];bub.visible=true}else bub.visible=false},
      serve(){this.state='eating';this.t=rnd(10,15);this.bubble(null);if(this.seat){this.seat.food=true;this.seat.plate.visible=true;this.seat.foodMesh.visible=true}}};
    customers.push(c);
  }
  function freeSeat(){const f=seats.filter(s=>!s.c);return f.length?pick(f):null}
  function spawn(){
    const c=customers.find(c=>!c.active);if(!c)return false;
    const seat=mall?null:freeSeat();if(!mall&&!seat)return false;
    c.active=true;c.x=OUTSIDE.x;c.z=OUTSIDE.z;c.wait=0;c.claimed=false;c.sp.visible=true;
    if(!mall){
      seat.c=c;c.seat=seat;c.state='enter';c.path=[{x:LOBBY.x,z:LOBBY.z,dwell:0},{x:seat.x,z:seat.z,act:'seat',dwell:0}];
    }else{
      c.seat=null;c.state='shop';
      const n=3+Math.floor(Math.random()*3),route=[];
      for(let k=0;k<n;k++){const st=pick(stops);route.push({x:st.x,z:st.z,dwell:rnd(3,6)})}
      c.path=[{x:LOBBY.x,z:LOBBY.z,dwell:0},...route,{x:OUTSIDE.x,z:OUTSIDE.z,act:'gone',dwell:0}];
    }
    c.bubble(mall?null:'yellow');
    return true;
  }
  // a customer's path item is reached, then they wait for its dwell and act on it
  function onAct(c,it){
    if(it.act==='seat'){c.state='seated';c.bubble('yellow')}
    else if(it.act==='pay'){
      sales+=c.bill||12;c.seat=null;c.state='leaving';c.bubble(null);
      c.path=[{x:LOBBY.x,z:LOBBY.z,dwell:0},{x:OUTSIDE.x,z:OUTSIDE.z,act:'gone',dwell:0}];
    }else if(it.act==='gone'){c.active=false;c.sp.visible=false;c.bubble(null)}
  }
  function custUpdate(c,dt){
    if(!c.active)return;
    if(c.state==='eating'){
      c.t-=dt;
      if(c.t<=0){
        c.seat.food=false;c.seat.plate.visible=false;c.seat.foodMesh.visible=false;
        c.bill=Math.round(rnd(12,38));
        // the seat is freed as the customer heads for the register
        c.seat.c=null;c.state='paying';c.wait=0;
        c.path=[{x:10.5,z:D/2-5.8,dwell:2.2,act:'pay'}];
      }
    }
    const it=c.path[0];
    c.moving=false;
    if(it){
      const arrived=go(c,it.x,it.z,dt,c.spd);
      c.moving=!arrived;
      if(arrived){c.wait+=dt;if(c.wait>=(it.dwell||0)){c.wait=0;c.path.shift();onAct(c,it)}}
    }
    if(c.active){
      const front=getFront(c.variant);
      if(front){c.sp.visible=true;c.sp.material=front[c.moving?Math.floor(c.ph*4+Date.now()/160)%4:3]}else c.sp.visible=false;
      c.sp.position.set(c.x,1.2,c.z);c.bub.position.set(c.x,3.2,c.z);
    }
  }

  /* ---------- per-frame update ---------- */
  let spawnT=2;
  function update(dt,P,t){
    if(wants.length)fill();
    inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<H-.5;
    const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;
    roofM.opacity+=((inside?0:1)-roofM.opacity)*Math.min(1,dt*5);roof.visible=!inside||P.y>H;
    spawnT-=dt;
    if(spawnT<=0){spawn();spawnT=mall?rnd(5,9):rnd(4,8)}
    for(const c of customers)custUpdate(c,dt);
    for(const s of staff)staffUpdate(s,dt);
  }

  return{
    W,D,H,cx,cz,title,kind,
    door:{x:cx,z:cz-D/2-3.6},
    lobby:{x:cx,z:cz-D/2+2.5},
    points:pts,
    staffCount:staff.length,
    get customers(){return customers.filter(c=>c.active).length},
    get sales(){return sales},
    get inside(){return inside},
    update
  };
}
