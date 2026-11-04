/* ===================== SUPER TOWN · OFFICE OF THE PRESIDENT =====================
   A walk-in executive building on the north-east block, facing the main street (front door on the -z side):
   forecourt with flags + red carpet, columned portico, reception desk, conference room, lounge and the
   President's private office with the desk, leather chair, seal, flags and bookshelves.
   Walls are real colliders with an open doorway; they fade out when you are inside so the camera never loses you. */

const lerp=(a,b,t)=>a+(b-a)*t;

export function makeOffice({THREE,scene,labelSprite,B,cx=18,cz=56,title='PRESIDENT CRYPTO',getFront=()=>null}){
  const W=22,D=20,H=8,T=.5,DW=5;           // footprint (x, z), wall height, wall thickness, doorway width
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const basic=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
  const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const cyl=(p,rt,rb,h,m,x,y,z,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const plane=(p,w,h,m,x,y,z,ry=0)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry;p.add(o);return o};
  const col=(lx,lz,w,d,h,name=null)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name});

  /* ---------- materials ---------- */
  const wallM=mat(0x14211b,{roughness:.4,metalness:.55,transparent:true});
  const roofM=mat(0x0e1a14,{roughness:.5,metalness:.7,transparent:true});
  const limeM=basic(0xc8ff43,2.2),redGlow=basic(0xff4d4f,2);
  const gold=mat(0xd9b24a,{roughness:.28,metalness:1,emissive:0x3a2a05,emissiveIntensity:.5});
  const white=mat(0xe9efe9,{roughness:.45,metalness:.1}),dark=mat(0x1a1f1c,{roughness:.5,metalness:.4});
  const walnut=mat(0x4a2c1a,{roughness:.45,metalness:.15}),oak=mat(0x9a6a3c,{roughness:.55}),leather=mat(0x16301f,{roughness:.55,metalness:.1});
  const leatherBlk=mat(0x0d1411,{roughness:.5,metalness:.15}),leaf=mat(0x2f9a3a,{emissive:0x0a3a10,roughness:.8}),pot=mat(0x2a2a2a);
  const glass=mat(0x0a1a16,{emissive:0x5fe0a8,emissiveIntensity:.17,roughness:.1,metalness:.8});
  const marble=mat(0xffffff,{map:tex(256,256,(x,w,h)=>{for(let j=0;j<4;j++)for(let i=0;i<4;i++){x.fillStyle=(i+j)%2?'#10201a':'#1f3a2e';x.fillRect(i*64,j*64,64,64);x.strokeStyle='rgba(217,178,74,.35)';x.strokeRect(i*64+1,j*64+1,62,62)}}),roughness:.18,metalness:.35});
  marble.map.wrapS=marble.map.wrapT=THREE.RepeatWrapping;marble.map.repeat.set(W/5,D/5);
  const stoneM=mat(0x16241c,{roughness:.5,metalness:.4});

  const sealTex=tex(512,512,(x,w,h)=>{x.fillStyle='#0b1711';x.beginPath();x.arc(256,256,250,0,6.283);x.fill();
    x.strokeStyle='#d9b24a';x.lineWidth=14;x.beginPath();x.arc(256,256,238,0,6.283);x.stroke();x.lineWidth=5;x.beginPath();x.arc(256,256,160,0,6.283);x.stroke();
    x.fillStyle='#d9b24a';x.beginPath();for(let i=0;i<10;i++){const r=i%2?46:112,a=-Math.PI/2+i*Math.PI/5;x.lineTo(256+Math.cos(a)*r,256+Math.sin(a)*r)}x.closePath();x.fill();
    x.font='800 34px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#e9ffb0';
    const arc=(t,r,a0,a1,flip)=>{for(let i=0;i<t.length;i++){const a=a0+(a1-a0)*(i/(t.length-1));x.save();x.translate(256+Math.cos(a)*r,256+Math.sin(a)*r);x.rotate(a+(flip?-1:1)*Math.PI/2);x.fillText(t[i],0,0);x.restore()}};
    arc('OFFICE OF THE PRESIDENT',200,Math.PI*1.12,Math.PI*1.88);arc('SUPER TOWN',212,Math.PI*.8,Math.PI*.2,true)});
  const sealM=new THREE.MeshBasicMaterial({map:sealTex,transparent:true});
  const flagTex=tex(256,160,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#0f3a22');g.addColorStop(1,'#1c6a35');x.fillStyle=g;x.fillRect(0,0,w,h);
    x.fillStyle='#c8ff43';x.beginPath();for(let i=0;i<10;i++){const r=i%2?16:40,a=-Math.PI/2+i*Math.PI/5;x.lineTo(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r)}x.closePath();x.fill();
    x.fillStyle='#d9b24a';x.fillRect(0,0,w,8);x.fillRect(0,h-8,w,8)});
  const flagM=new THREE.MeshBasicMaterial({map:flagTex,side:THREE.DoubleSide});
  const bookTex=tex(256,256,(x,w,h)=>{x.fillStyle='#0b120e';x.fillRect(0,0,w,h);for(let r=0;r<4;r++){let px=6;while(px<w-10){const bw=7+((px*7+r*13)%9),bh=40+((px*3+r*11)%18);x.fillStyle=`hsl(${(px*17+r*53)%360},45%,${28+(px%20)}%)`;x.fillRect(px,r*62+60-bh+2,bw,bh);px+=bw+2}x.fillStyle='#d9b24a';x.fillRect(0,r*62+62,w,3)}});
  const bookM=new THREE.MeshBasicMaterial({map:bookTex});
  const chartTex=tex(512,288,(x,w,h)=>{x.fillStyle='#06120c';x.fillRect(0,0,w,h);x.strokeStyle='rgba(200,255,67,.15)';for(let i=1;i<6;i++){x.beginPath();x.moveTo(0,i*h/6);x.lineTo(w,i*h/6);x.stroke()}
    x.strokeStyle='#c8ff43';x.lineWidth=4;x.beginPath();let y=h*.8;for(let i=0;i<=48;i++){y=Math.max(h*.12,Math.min(h*.86,y-6+Math.sin(i*1.3)*10-(i>30?4:0)));i?x.lineTo(i*w/48,y):x.moveTo(0,y)}x.stroke();
    x.fillStyle='#e9ffb0';x.font='800 30px sans-serif';x.fillText('$SUPER  ▲',18,40)});
  const chartM=new THREE.MeshBasicMaterial({map:chartTex});
  const nameTex=tex(512,128,(x,w,h)=>{x.fillStyle='#d9b24a';x.fillRect(0,0,w,h);x.fillStyle='#2a1c08';x.fillRect(6,6,w-12,h-12);x.fillStyle='#f3dc8e';x.font='800 50px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(title,w/2,h/2+3)});
  const nameM=new THREE.MeshBasicMaterial({map:nameTex});
  const carpetTex=tex(128,512,(x,w,h)=>{x.fillStyle='#8d0a16';x.fillRect(0,0,w,h);x.fillStyle='#d9b24a';x.fillRect(0,0,8,h);x.fillRect(w-8,0,8,h);x.fillStyle='#6a0610';x.fillRect(16,0,6,h);x.fillRect(w-22,0,6,h)});
  const carpetM=new THREE.MeshStandardMaterial({map:carpetTex,roughness:.9});

  /* ---------- shell ---------- */
  const shell=new THREE.Group();root.add(shell);
  const wall=(w,d,x,z,hh=H,y=0)=>{box(shell,w,hh,d,wallM,x,y,z)};
  const sideW=(W-DW)/2,fz=-D/2+T/2;
  wall(sideW,T,-(DW/2+sideW/2),fz);wall(sideW,T,DW/2+sideW/2,fz);               // front, either side of the doorway
  wall(DW,T,0,fz,H-4.4,4.4);                                                       // lintel over the doorway
  wall(W,T,0,D/2-T/2);wall(T,D,-W/2+T/2,0);wall(T,D,W/2-T/2,0);                   // back + side walls
  col(-(DW/2+sideW/2),-D/2+T/2,sideW,T,H,'office');col(DW/2+sideW/2,-D/2+T/2,sideW,T,H,'office');
  col(0,D/2-T/2,W,T,H,'office');col(-W/2+T/2,0,T,D,H,'office');col(W/2-T/2,0,T,D,H,'office');
  const roof=new THREE.Group();root.add(roof);
  box(roof,W+1,.5,D+1,roofM,0,H,0);
  for(const s of[-1,1]){box(roof,W+1.2,.16,.16,limeM,0,H+.5,s*(D/2+.5));box(roof,.16,.16,D+1.2,limeM,s*(W/2+.5),H+.5,0)}
  {const pm=mat(0x17261c,{roughness:.35,metalness:.85});for(const s of[-1,1]){box(shell,W+.8,.35,.3,pm,0,0,s*(D/2+.15));box(shell,.3,.35,D+.8,pm,s*(W/2+.15),0,0)}} // plinth ring (hollow, so the floor is visible)
  for(const s of[-1,1])for(let k=0;k<3;k++){ // lit windows on the side walls
    box(shell,.12,3.4,3.2,glass,s*(W/2+.02),2.2,(k-1)*5.6)}
  for(const s of[-1,1])box(shell,sideW-2.2,3.4,.12,glass,s*(DW/2+sideW/2),2.2,-D/2-.02);
  for(let k=0;k<3;k++)box(shell,4.2,3.4,.12,glass,(k-1)*6.2,2.2,D/2+.02);
  box(shell,W+.6,.18,.18,limeM,0,H-.1,-D/2-.05);                                  // glowing cornice
  const floor=plane(root,W-T*2,D-T*2,marble,0,.03,0,-Math.PI/2);floor.rotation.x=-Math.PI/2;floor.rotation.y=0;

  /* ---------- exterior: forecourt, portico, flags, signs ---------- */
  const fzc=-D/2-2.9;
  const pad=plane(root,W+4,5.8,stoneM,0,.035,fzc,0);pad.rotation.x=-Math.PI/2;
  const runner=plane(root,3.4,6.6,carpetM,0,.06,-D/2-2.7,0);runner.rotation.x=-Math.PI/2;
  {const z0=-D/2+.6,z1=6.4-2.4,inRun=plane(root,3.4,z1-z0,carpetM,0,.07,(z0+z1)/2,0);inRun.rotation.x=-Math.PI/2}
  box(root,13,.4,5.2,white,0,5.9,-D/2-2.6);                                       // portico roof slab
  box(root,13.2,.12,5.4,gold,0,5.78,-D/2-2.6);
  for(const x of[-5.8,-3.6,3.6,5.8]){cyl(root,.36,.4,5.9,white,x,0,-D/2-4.8);col(x,-D/2-4.8,.8,.8,6,null)}
  const poleL=[];
  for(const x of[-10,10]){cyl(root,.09,.12,11,gold,x,0,-D/2-3);const fl=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.1),flagM);fl.position.set(x+(x<0?1.8:-1.8),9.6,-D/2-3);root.add(fl);poleL.push(fl);
    const bl=new THREE.Sprite(new THREE.SpriteMaterial({color:0xc8ff43,transparent:true,opacity:.9,depthWrite:false,fog:false}));bl.scale.set(.5,.5,1);bl.position.set(x,11.1,-D/2-3);root.add(bl)}
  for(const x of[-7.6,7.6])for(const z of[-D/2-5.4]){cyl(root,.2,.25,1.1,stoneM,x,0,z);box(root,.34,.14,.34,limeM,x,1.1,z)}
  {const s=labelSprite('OFFICE OF THE PRESIDENT',{w:15,size:66});s.position.set(0,H+3,-D/2);root.add(s);
   const s2=labelSprite(title,{w:8,size:58,color:'#f3dc8e',glow:'#d9b24a',plate:true});s2.position.set(0,6.9,-D/2-5.2);root.add(s2)}
  plane(root,2.6,2.6,sealM,0,3.0,-D/2-.28+.05,Math.PI).position.y=H-1.9;

  /* ---------- interior ---------- */
  const room=new THREE.Group();root.add(room);
  const R=(w,h,d,m,x,y,z,c=null)=>{const o=box(room,w,h,d,m,x,y,z);if(c)col(x,z,w,d,c);return o};
  // President's office (back third)
  const DZ=6.4;
  const rug=plane(room,7,7,new THREE.MeshBasicMaterial({map:sealTex,transparent:true,opacity:.9}),0,.08,DZ+.4,0);rug.rotation.x=-Math.PI/2;
  R(5,.2,2.3,walnut,0,1.0,DZ,1.3);R(1.4,1.0,2.0,walnut,-1.75,0,DZ);R(1.4,1.0,2.0,walnut,1.75,0,DZ);R(5,.06,.06,gold,0,1.22,DZ-1.16);
  plane(room,1.7,.42,nameM,0,1.55,DZ-1.2,Math.PI).rotation.x=-.28;
  for(const x of[-1.2,1.2]){box(room,1.1,.66,.08,dark,x,1.3,DZ+.2);plane(room,1.0,.56,chartM,x,1.63,DZ+.2-.05,Math.PI);box(room,.12,.14,.12,dark,x,1.2,DZ+.2)}
  box(room,.9,.03,.34,dark,0,1.2,DZ-.55);
  // chair (faces the door)
  const CZ=DZ+2.0;box(room,1.3,.28,1.2,leatherBlk,0,.62,CZ);box(room,1.3,1.9,.3,leatherBlk,0,.62,CZ+.6);cyl(room,.07,.07,.65,gold,0,0,CZ);cyl(room,.5,.5,.06,dark,0,0,CZ,6);
  for(const s of[-1,1])box(room,.14,.34,.9,leatherBlk,s*.7,.9,CZ);
  /* ---------- the MacBook on the desk: WORK TO DO on its screen; each sign-off ticks a task ---------- */
  const TASKS=[['Park fund memo',false],['School budget',false],['Treasury report',false],['Police patrol order',false]];
  const lc=document.createElement('canvas');lc.width=1024;lc.height=640;const lg=lc.getContext('2d');
  const lt=new THREE.CanvasTexture(lc);lt.colorSpace=THREE.SRGBColorSpace;
  function drawLaptop(){
    const w=1024,h=640,g=lg;
    g.fillStyle='#f4f5f7';g.fillRect(0,0,w,h);
    g.fillStyle='#e2e4e8';g.fillRect(0,0,w,64);
    g.fillStyle='#ff5f57';g.beginPath();g.arc(30,32,9,0,6.283);g.fill();
    g.fillStyle='#febc2e';g.beginPath();g.arc(60,32,9,0,6.283);g.fill();
    g.fillStyle='#28c840';g.beginPath();g.arc(90,32,9,0,6.283);g.fill();
    g.fillStyle='#2a2f36';g.font='bold 34px sans-serif';g.textAlign='center';g.fillText('WORK TO DO · PRESIDENT CRYPTO',w/2,44);
    g.textAlign='left';
    const done=TASKS.filter(t=>t[1]).length;
    g.font='bold 30px sans-serif';g.fillStyle='#5a6270';g.fillText(done+' of '+TASKS.length+' done',40,118);
    TASKS.forEach(([name,ok],i)=>{
      const y=190+i*84;
      g.strokeStyle='#8a94a3';g.lineWidth=4;g.strokeRect(50,y-30,40,40);
      if(ok){g.fillStyle='#28c840';g.fillRect(56,y-24,28,28);g.fillStyle='#fff';g.font='bold 30px sans-serif';g.fillText('✓',60,y)}
      g.fillStyle=ok?'#8a94a3':'#1b2430';g.font='bold 38px sans-serif';g.fillText(name,116,y);
      if(ok){g.strokeStyle='#8a94a3';g.lineWidth=3;g.beginPath();g.moveTo(116,y-12);g.lineTo(116+g.measureText(name).width,y-12);g.stroke()}
    });
    g.textAlign='center';
    if(TASKS.some(t=>!t[1])){g.fillStyle='#c8ff43';g.fillRect(300,520,424,84);g.fillStyle='#0b1a0e';g.font='bold 46px sans-serif';g.fillText('SIGN HERE',512,578)}
    else{g.fillStyle='#28c840';g.fillRect(200,520,624,84);g.fillStyle='#0b1a0e';g.font='bold 42px sans-serif';g.fillText('ALL SIGNED · GOOD WORK',512,578)}
    lt.needsUpdate=true;
  }
  drawLaptop();
  function work(name){
    const next=name?TASKS.find(t=>t[0]===name&&!t[1]):TASKS.find(t=>!t[1]);
    if(!next)return name?'ALREADY SIGNED · '+name:'ALL SIGNED · GOOD WORK, MR. PRESIDENT';
    next[1]=true;drawLaptop();
    return 'SIGNED · '+next[0];
  }
  // the MacBook: a silver base on the desk and a lid leaning back toward the chair, its screen facing the President
  const alu=mat(0xc3c9d1,{roughness:.3,metalness:.8}),keyM=mat(0x2a2f36,{roughness:.6});
  box(room,1.2,.05,.9,alu,0,1.2,DZ-.35);
  box(room,1.1,.01,.55,keyM,0,1.25,DZ-.4);
  const lid=new THREE.Group();lid.position.set(0,1.25,DZ-.8);lid.rotation.x=-.35;room.add(lid);
  const lidBody=new THREE.Mesh(new THREE.BoxGeometry(1.2,.85,.04),alu);lidBody.position.set(0,.425,0);lid.add(lidBody);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.76),new THREE.MeshBasicMaterial({map:lt}));scr.position.set(0,.425,.03);lid.add(scr);
  // the SIGN HERE memo lying on the desk
  const memoC=document.createElement('canvas');memoC.width=512;memoC.height=640;const mg=memoC.getContext('2d');
  mg.fillStyle='#fbfbf7';mg.fillRect(0,0,512,640);mg.fillStyle='#1b2430';mg.font='bold 40px sans-serif';mg.textAlign='left';mg.fillText('MEMO · FOR SIGNATURE',36,70);
  mg.font='28px sans-serif';for(let i=0;i<8;i++)mg.fillRect(36,120+i*40,440,5);
  mg.fillStyle='#c8ff43';mg.fillRect(120,520,280,70);mg.fillStyle='#0b1a0e';mg.font='bold 40px sans-serif';mg.textAlign='center';mg.fillText('SIGN HERE',260,568);
  const memoM=new THREE.Mesh(new THREE.PlaneGeometry(.5,.62),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(memoC)}));memoM.rotation.x=-Math.PI/2;memoM.position.set(.9,1.23,DZ-.45);room.add(memoM);

  // back wall: seal, flags, shelves
  plane(room,4.4,4.4,sealM,0,4.4,D/2-T-.02,Math.PI);
  for(const x of[-4.4,4.4]){cyl(room,.07,.07,6,gold,x,0,D/2-T-.8);const fl=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.7),flagM);fl.position.set(x+(x<0?1.3:-1.3),5.2,D/2-T-.8);fl.rotation.y=0;room.add(fl);poleL.push(fl)}
  for(const x of[-8,8]){R(3,4.6,.7,dark,x,0,D/2-T-.5,4.6);plane(room,2.9,4.4,bookM,x,2.3,D/2-T-.5-.37,Math.PI)}
  // lounge (right wall)
  R(2,.9,5.4,leather,W/2-T-1.2,0,-1.5,1.1);R(.5,1.5,5.4,leather,W/2-T-.35,0,-1.5);
  R(1.3,.45,2.6,walnut,W/2-T-4.2,0,-1.5,.7);
  for(const z of[-5,2]){R(1.5,.8,1.5,leather,W/2-T-4.4,0,z,1)}
  // conference table (left)
  R(2.6,.14,6.6,walnut,-W/2+T+4.2,.78,-.8,1);for(const z of[-3,1.4])cyl(room,.12,.12,.78,gold,-W/2+T+4.2,0,z);
  for(let k=0;k<3;k++)for(const s of[-1,1]){box(room,.8,.12,.8,leatherBlk,-W/2+T+4.2+s*1.9,.5,-3+k*2.7);box(room,.12,.9,.8,leatherBlk,-W/2+T+4.2+s*2.3,.5,-3+k*2.7)}
  plane(room,5.4,3.04,chartM,-W/2+T+.03,3.6,-.8,Math.PI/2);
  // reception
  R(4.4,1.1,1.2,walnut,-5.4,0,-6.8,1.2);R(4.4,.06,1.3,gold,-5.4,1.1,-6.8);box(room,4.4,.1,.1,limeM,-5.4,.5,-7.42);
  {const s=labelSprite('RECEPTION',{w:3.4,size:56,plate:true});s.position.set(-5.4,2.0,-6.8);room.add(s)}
  box(room,.5,.02,.5,dark,-6.2,1.16,-6.8);
  // plants + lamps + ceiling lights
  for(const [x,z] of[[-9.2,-8.6],[9.2,-8.6],[-9.2,8.4],[9.2,8.4],[-3.6,-1.5],[3.6,-1.5]]){cyl(room,.42,.32,.7,pot,x,0,z);const lf=new THREE.Mesh(new THREE.SphereGeometry(.7,12,10),leaf);lf.position.set(x,1.4,z);lf.scale.y=1.3;room.add(lf)}
  for(const [x,z] of[[-6,-6],[6,-6],[-6,0],[6,0],[-4,6],[4,6]])box(room,2.2,.08,1.2,basic(0xf4ffe0,2),x,H-.35,z);
  const L1=new THREE.PointLight(0xf4ffe0,0,26,1.6),L2=L1.clone();L1.position.set(0,H-1.4,-3);L2.position.set(0,H-1.4,6);root.add(L1,L2);

  /* ---------- hooks for town.js ---------- */
  // workers: a receptionist, the President's assistant, two guards at the door and a cleaner
  const rndO=(a,b)=>a+Math.random()*(b-a);
  const staff=[
    {role:'RECEPTIONIST JO',variant:5,zone:[-4,4,-6,-3.6],station:[0,-4.6],spd:.5},
    {role:'ASSISTANT LENA',variant:6,zone:[-3.5,3.5,2.6,4.6],station:[3.4,3.4],spd:.6},
    {role:'GUARD BRUNO',variant:7,zone:[-7.5,-5.5,-7,-5.2],spd:.3},
    {role:'GUARD ERIN',variant:4,zone:[5.5,7.5,-7,-5.2],spd:.3},
    {role:'CLEANER PAT',variant:2,zone:[-7,7,-2,4],spd:.8}
  ].map(d=>{
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);sp.visible=false;root.add(sp);
    const tag=labelSprite(d.role,{w:2.6,size:54,color:'#eaf7ed',glow:'#7ddc1f',plate:true});root.add(tag);
    const st=d.station||null;const x=st?st[0]:rndO(d.zone[0],d.zone[1]),z=st?st[1]:rndO(d.zone[2],d.zone[3]);
    return{...d,sp,tag,x,z,tx:x,tz:z,wait:rndO(0,3),ph:Math.random(),moving:false};
  });
  function updateStaff(dt,t){
    for(const s of staff){
      if(s.station){s.x=s.station[0];s.z=s.station[1];s.moving=false}
      else{
        s.wait-=dt;const dx=s.tx-s.x,dz=s.tz-s.z,d=Math.hypot(dx,dz);
        if(d<.2&&s.wait<=0){s.tx=rndO(s.zone[0],s.zone[1]);s.tz=rndO(s.zone[2],s.zone[3]);s.wait=rndO(2,6)}
        s.moving=s.wait<=0&&d>.2;
        if(s.moving){const st=Math.min(d,s.spd*dt);s.x+=dx/d*st;s.z+=dz/d*st}
      }
      const f=getFront(s.variant);
      if(f){s.sp.visible=true;s.sp.material=f[s.moving?Math.floor(s.ph*4+t*6)%4:3]}else s.sp.visible=false;
      s.sp.position.set(s.x,1.2,s.z);s.tag.position.set(s.x,2.9,s.z);
    }
  }
  let wallO=.97,inside=false;
  const api={
    W,D,H,cx,cz,
    door:{x:cx,z:cz-D/2-3.6},                 // the "walk in" prompt, out on the red carpet
    lobby:{x:cx,z:cz-D/2+3.2},                // where "walk in" puts you (inside, facing the desk)
    desk:{x:cx,z:cz+DZ-2.6},                  // the "take your seat" prompt, in front of the desk
    seat:{x:cx,z:cz+CZ+.2},                   // behind the desk
    get inside(){return inside},
    update(dt,P,t){
      inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<H-.5;
      const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;roofM.opacity=inside?0:1;roof.visible=!inside||P.y>H;
      const li=inside?40:0;L1.intensity+=(li-L1.intensity)*Math.min(1,dt*4);L2.intensity+=(li-L2.intensity)*Math.min(1,dt*4);
      for(let i=0;i<poleL.length;i++)poleL[i].rotation.y=Math.sin(t*1.6+i*1.7)*.18;
      updateStaff(dt,t);
    }};
  api.work=work;api.laptop={x:cx+2.8,z:cz+DZ+1.4};
  return api;
}
