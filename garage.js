/* ===================== SUPER TOWN · SUPER HOME GARAGE =====================
   A walled garage annex on the west side of Super Home (it shares the house's west wall). The door faces the
   north street (z=36 road) and rolls up on its own when you or the Benz come near. Inside: epoxy floor with the
   Benz bay + turntable ring, tri-star emblem, workbench + pegboard, rolling toolbox, tire rack, EV charger,
   ceiling light strips. Walls are real colliders (with the doorway open only while the door is up); like the
   house and the office, the walls fade and the roof hides when you are inside so the camera never loses you. */

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function makeGarage({THREE,scene,labelSprite,B,gx=-73.2,gz=19}){
  const W=14,D=18,H=4.8,T=.4,DW=5.6,DH=3.5,HW=W/2,HD=D/2;     // interior footprint, wall height/thickness, doorway size
  const root=new THREE.Group();root.position.set(gx,0,gz);scene.add(root);

  /* ---------- helpers ---------- */
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
  const basic=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
  const tex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
  const box=(p,w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const cyl=(p,rt,rb,h,m,x,y,z,seg=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
  const glowTex=tex(64,64,(x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,w)});
  const glow=(p,x,y,z,s,c,op=.6)=>{const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:op}));g.scale.set(s,s,1);g.position.set(x,y,z);p.add(g);return g};

  const wallM=mat(0x1b2822,{roughness:.5,metalness:.5,transparent:true,depthWrite:true});
  const roofM=mat(0x141c18,{roughness:.55,metalness:.5,transparent:true,depthWrite:true});
  const doorM=new THREE.MeshStandardMaterial({map:tex(256,128,(x,w,h)=>{x.fillStyle='#202f28';x.fillRect(0,0,w,h);for(let i=0;i<5;i++){x.fillStyle=i%2?'#1a2620':'#243529';x.fillRect(0,i*h/5,w,h/5-3);x.fillStyle='rgba(200,255,67,.55)';x.fillRect(0,i*h/5+h/5-3,w,3)}x.fillStyle='rgba(200,255,67,.9)';for(let k=0;k<6;k++)x.fillRect(22+k*38,h*.4,26,7)}),roughness:.45,metalness:.55,transparent:true});
  const steel=mat(0xb8c4bc,{roughness:.25,metalness:.9}),dark=mat(0x1a1f1c,{roughness:.5,metalness:.4}),oak=mat(0x6a4a2a,{roughness:.6}),redM=mat(0xb02a30,{roughness:.45,metalness:.4});
  const limeEm=basic(0xc8ff43,2.2),redEm=basic(0xff4d4f,2.4),cyanEm=basic(0x4dd2ff,2.2),greenEm=basic(0x7bff3a,2.0),warmEm=basic(0xfff0c0,2.6);
  const wallMats=[wallM,roofM,doorM];

  /* ---------- floor (epoxy tiles + the Benz bay, turntable ring and arrows painted on) ---------- */
  const FT=28,BAYZ=-3.2;
  const floorT=tex(W*FT,D*FT,(x,w,h)=>{
    x.fillStyle='#101a15';x.fillRect(0,0,w,h);
    x.strokeStyle='rgba(120,255,90,.08)';x.lineWidth=2;for(let i=0;i<=W;i+=2){x.beginPath();x.moveTo(i*FT,0);x.lineTo(i*FT,h);x.stroke()}for(let j=0;j<=D;j+=2){x.beginPath();x.moveTo(0,j*FT);x.lineTo(w,j*FT);x.stroke()}
    for(let i=0;i<900;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.025})`;x.fillRect(Math.random()*w,Math.random()*h,2,2)}
    const cx=HW*FT,cy=(BAYZ+HD)*FT;
    x.strokeStyle='rgba(200,255,67,.35)';x.lineWidth=3;x.setLineDash([14,10]);x.beginPath();x.arc(cx,cy,3.9*FT,0,6.283);x.stroke();x.setLineDash([]);
    x.strokeStyle='#c8ff43';x.lineWidth=5;x.strokeRect(cx-1.65*FT,cy-3.15*FT,3.3*FT,6.3*FT);
    x.lineWidth=2;x.strokeStyle='rgba(200,255,67,.5)';for(let k=-3;k<=3;k++){x.beginPath();x.moveTo(cx-1.65*FT,cy+k*.9*FT);x.lineTo(cx-.9*FT,cy+k*.9*FT+.5*FT);x.stroke();x.beginPath();x.moveTo(cx+1.65*FT,cy+k*.9*FT);x.lineTo(cx+.9*FT,cy+k*.9*FT+.5*FT);x.stroke()}
    x.fillStyle='rgba(200,255,67,.7)';for(let k=0;k<3;k++){const y=(BAYZ+HD+4.8+k*1.5)*FT;x.beginPath();x.moveTo(cx-.7*FT,y);x.lineTo(cx,y+.7*FT);x.lineTo(cx+.7*FT,y);x.lineTo(cx+.7*FT,y-.25*FT);x.lineTo(cx,y+.4*FT-.25*FT);x.lineTo(cx-.7*FT,y-.25*FT);x.closePath();x.fill()}
    x.fillStyle='rgba(255,77,79,.6)';x.fillRect(0,0,w,6);x.fillRect(0,0,6,h);
  });
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({map:floorT,roughness:.32,metalness:.5}));floor.rotation.x=-Math.PI/2;floor.position.y=.035;root.add(floor);

  /* ---------- shell: west / south / north walls (the east side is the house's own wall) ---------- */
  box(root,T,H,D+2*T,wallM,-HW-T/2,0,0);                                  // west
  box(root,W+T,H,T,wallM,-T/2,0,-HD-T/2);                                 // south (back)
  const nl=(HW+T-DW/2),nr=(HW-DW/2);
  box(root,nl,H,T,wallM,-DW/2-nl/2,0,HD+T/2);                             // north, left of the door
  box(root,nr,H,T,wallM,DW/2+nr/2,0,HD+T/2);                              // north, right of the door
  box(root,DW,H-DH,T,wallM,0,DH,HD+T/2);                                  // lintel
  // trim: door frame, roofline and wall accent strips
  for(const s of[-1,1])box(root,.16,DH,.14,limeEm,s*(DW/2+.04),0,HD+T+.04);
  box(root,DW+.34,.16,.14,limeEm,0,DH-.02,HD+T+.04);
  box(root,W+2*T,.12,.1,redEm,-T/2,H-.45,HD+T+.04);
  box(root,.1,.1,D+2*T,limeEm,-HW-T-.04,1.2,0);box(root,W+T,.1,.1,limeEm,-T/2,1.2,-HD-T-.04);
  box(root,.1,.1,D,limeEm,-HW+.06,1.1,0);box(root,W,.1,.1,limeEm,0,1.1,-HD+.06);
  box(root,.1,.1,D,redEm,-HW+.06,4.25,0);box(root,W,.1,.1,redEm,0,4.25,-HD+.06);
  // roof (hides when you are inside) + parapet glow
  const roof=new THREE.Group();root.add(roof);
  box(roof,W+2*T+.5,.35,D+2*T+.5,roofM,-T/2,H,0);
  box(roof,W+2*T+.5,.1,.1,limeEm,-T/2,H+.35,HD+T+.22);box(roof,W+2*T+.5,.1,.1,limeEm,-T/2,H+.35,-HD-T-.22);box(roof,.1,.1,D+2*T+.5,limeEm,-HW-T-.2,H+.35,0);box(roof,.1,.1,D+2*T+.5,limeEm,HW+.05,H+.35,0);
  box(roof,2.2,.9,1.6,steel,-3,H+.35,-3);box(roof,2.2,.9,1.6,steel,2,H+.35,-5);cyl(roof,.12,.12,2.4,steel,4,H+.35,3);
  // ceiling light strips
  const strips=new THREE.Group();root.add(strips);
  for(const z of[-6,-1,4]){box(strips,10.5,.08,.34,warmEm,0,H-.12,z);glow(strips,-3,H-.5,z,3.2,0xfff0c0,.35);glow(strips,3,H-.5,z,3.2,0xfff0c0,.35)}

  /* ---------- the roll-up door ---------- */
  const doorG=new THREE.Group();doorG.position.set(0,DH,HD+T/2+.1);root.add(doorG);
  {const d=new THREE.Mesh(new THREE.BoxGeometry(DW-.05,DH,.12),doorM);d.position.y=-DH/2;doorG.add(d)}
  const light=glow(root,DW/2+.9,DH+.6,HD+T+.3,1.3,0xff3a3a,.95);
  {const s=labelSprite('SUPER GARAGE',{w:6.2,size:84,color:'#eaf7ed',glow:'#c8ff43',plate:true});s.position.set(0,H+1.5,HD+T+.3);root.add(s)}

  /* ---------- apron + outdoor bollard lights ---------- */
  {const ap=new THREE.Mesh(new THREE.PlaneGeometry(DW+2.8,4.8),new THREE.MeshStandardMaterial({map:tex(256,128,(x,w,h)=>{x.fillStyle='#0d1511';x.fillRect(0,0,w,h);x.strokeStyle='rgba(200,255,67,.8)';x.lineWidth=5;x.strokeRect(6,3,w-12,h-3);x.lineWidth=3;x.strokeStyle='rgba(200,255,67,.4)';for(let k=0;k<7;k++){x.beginPath();x.moveTo(20+k*34,h-4);x.lineTo(46+k*34,h/2);x.stroke()}}),roughness:.5,metalness:.3}));
   ap.rotation.x=-Math.PI/2;ap.position.set(0,.045,HD+T+2.4);root.add(ap);
   for(const s of[-1,1]){cyl(root,.09,.11,1.1,steel,s*(DW/2+1.5),0,HD+T+1.2);box(root,.22,.14,.22,limeEm,s*(DW/2+1.5),1.1,HD+T+1.2);glow(root,s*(DW/2+1.5),1.35,HD+T+1.2,1.6,0xc8ff43,.55)}}

  /* ---------- interior: back wall emblem + sign ---------- */
  {const ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.07,10,40),limeEm);ring.position.set(0,2.65,-HD+.14);root.add(ring);
   for(let k=0;k<3;k++){const g=new THREE.Group();g.position.set(0,2.65,-HD+.14);g.rotation.z=k*Math.PI*2/3;const sp=new THREE.Mesh(new THREE.BoxGeometry(.09,.95,.06),limeEm);sp.position.y=.475;g.add(sp);root.add(g)}
   glow(root,0,2.65,-HD+.5,4.2,0xc8ff43,.35);
   const s=labelSprite('SUPER HOME GARAGE',{w:6.6,size:80,color:'#fff',glow:'#7bff3a'});s.position.set(0,4.0,-HD+.3);root.add(s)}
  // wheel stop behind the bay + storage cabinets on the back wall
  box(root,3.0,.16,.35,mat(0xffc83d,{roughness:.6}),0,.03,BAYZ-3.7);
  for(const x of[-4.9,4.9]){box(root,1.9,1.9,.7,dark,x,0,-HD+.4);box(root,1.7,.06,.04,limeEm,x,1.2,-HD+.77);box(root,1.7,.06,.04,limeEm,x,.6,-HD+.77)}

  /* ---------- west wall: pegboard + workbench + toolbox + tire rack ---------- */
  box(root,.08,2.3,6.2,mat(0x24342b,{roughness:.8}),-HW+.07,1.4,-5);
  {const cols=[0xc8ff43,0xff4d4f,0x4dd2ff,0xffc83d,0xe9efe9];for(let i=0;i<22;i++){const z=-7.9+Math.random()*5.6,y=1.7+Math.random()*1.7,c=basic(cols[i%cols.length],.9);
     if(i%3===0)box(root,.07,.5+Math.random()*.4,.07,c,-HW+.16,y,z);else if(i%3===1){box(root,.07,.07,.5,c,-HW+.16,y,z);box(root,.1,.3,.12,steel,-HW+.16,y-.28,z+.25)}else cyl(root,.09,.09,.3,mat(cols[i%cols.length],{roughness:.5}),-HW+.16,y,z,8)}}
  box(root,1.2,.12,6.0,oak,-HW+.75,1.0,-5);                               // bench top
  for(const z of[-7.8,-2.2])for(const x of[-HW+.25,-HW+1.25])box(root,.1,1.0,.1,steel,x,0,z);
  for(let i=0;i<3;i++){box(root,.95,.62,1.85,dark,-HW+.75,.3,-7.05+i*2.0);box(root,.04,.06,1.2,limeEm,-HW+1.24,.55,-7.05+i*2.0)}   // drawers
  box(root,.4,.5,.4,steel,-HW+.7,1.12,-3.2);box(root,.12,.25,.12,redM,-HW+.7,1.62,-3.2);     // vise
  box(root,.2,.5,.3,limeEm,-HW+.5,1.12,-6.3);glow(root,-HW+.5,1.5,-6.3,1.4,0xc8ff43,.4);        // bench lamp
  box(root,.9,1.2,1.6,redM,-HW+.7,0,.7);box(root,1.0,.1,1.7,dark,-HW+.7,1.2,.7);                // rolling toolbox
  for(let i=0;i<4;i++)box(root,.04,.06,1.1,limeEm,-HW+1.17,.25+i*.27,.7);
  for(const [x,z] of[[-HW+.35,-.05],[-HW+1.05,-.05],[-HW+.35,1.45],[-HW+1.05,1.45]])cyl(root,.07,.07,.1,dark,x,-.02,z,8);
  // tire rack
  for(const z of[3,8])box(root,.1,2.2,.1,steel,-HW+.2,0,z);box(root,1.0,.08,5.2,steel,-HW+.7,.25,5.5);box(root,1.0,.08,5.2,steel,-HW+.7,1.35,5.5);box(root,.08,2.2,5.2,dark,-HW+.1,0,5.5);
  for(const y of[.33,1.43])for(const z of[3.9,5.5,7.1]){const t=new THREE.Mesh(new THREE.TorusGeometry(.4,.17,12,24),mat(0x0b0d0c,{roughness:.9}));t.rotation.x=Math.PI/2;t.position.set(-HW+.72,y+.18,z);root.add(t);const r=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.12,16),steel);r.position.set(-HW+.72,y+.18,z);root.add(r)}
  { // one tire leaning against the rack
    const t=new THREE.Mesh(new THREE.TorusGeometry(.4,.17,12,24),mat(0x0b0d0c,{roughness:.9}));t.rotation.y=Math.PI/2;t.rotation.z=.18;t.position.set(-HW+2.4,.5,2.2);root.add(t)}

  /* ---------- east side (the house wall): EV charger + extinguisher ---------- */
  box(root,.34,1.8,.28,steel,HW-.45,0,BAYZ);box(root,.05,.55,.3,greenEm,HW-.64,1.0,BAYZ);box(root,.05,.1,.2,limeEm,HW-.64,1.6,BAYZ);glow(root,HW-.9,1.3,BAYZ,1.8,0x7bff3a,.5);
  {const c=new THREE.CatmullRomCurve3([[HW-.6,1.0,BAYZ],[HW-.95,.7,BAYZ+.2],[HW-1.5,.1,BAYZ+.7],[HW-2.1,.07,BAYZ+.2],[HW-1.7,.07,BAYZ-.6],[HW-1.1,.07,BAYZ-.3]].map(a=>new THREE.Vector3(...a)));
   const t=new THREE.Mesh(new THREE.TubeGeometry(c,24,.04,6),mat(0x0f1311,{roughness:.6}));root.add(t);
   const plug=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),limeEm);plug.position.set(HW-1.1,.1,BAYZ-.3);root.add(plug)}
  cyl(root,.13,.13,.6,redM,HW-.3,0,2.4,12);box(root,.3,.2,.04,redEm,HW-.08,1.2,2.4);
  // welcome mat inside the door
  box(root,3.6,.03,1.3,mat(0x16301f,{roughness:1}),0,.04,HD-1.4);

  /* ---------- light + colliders ---------- */
  const L=new THREE.PointLight(0xe6fff0,0,26,2);L.position.set(0,H-.6,0);root.add(L);
  const hit=(x,z,hw,hd)=>{const b={x:gx+x,z:gz+z,hw,hd,h:H,name:'garage'};B.push(b);return b};
  hit(-HW-T/2,0,T/2,HD+T);hit(-T/2,-HD-T/2,(W+T)/2,T/2);
  hit(-DW/2-nl/2,HD+T/2,nl/2,T/2);hit(DW/2+nr/2,HD+T/2,nr/2,T/2);
  const dc=hit(0,HD+T/2,DW/2,T/2),dcx=dc.x;

  /* ---------- runtime ---------- */
  let open=0,openTgt=0,closeT=0,inside=false,wallO=.97,lightV=0;
  const api={
    park:{x:gx,z:gz+BAYZ,h:Math.PI},
    box:{x:gx,z:gz,hw:HW+T,hd:HD+T},
    door:{x:gx,z:gz+HD+T/2},
    get inside(){return inside},
    get open(){return open},
    update(dt,P,t){
      inside=Math.abs(P.x-gx)<HW-.2&&Math.abs(P.z-gz)<HD-.2&&P.y<H-.5;
      const near=Math.hypot(P.x-gx,P.z-(gz+HD+1))<11&&P.y<8;
      if(near||inside){openTgt=1;closeT=0}else{closeT+=dt;if(closeT>1.6)openTgt=0}
      open+=clamp(openTgt-open,-dt*1.5,dt*1.7);
      doorG.scale.y=Math.max(.03,1-open*.97);                               // rolls up into the lintel (anchored at the top)
      dc.x=open>.5?1e6:dcx;                                                  // the doorway is only passable while the door is up
      light.material.color.set(open>.9?0x55ff77:open>.05?0xffc83d:0xff3a3a);
      const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);
      for(const m of wallMats){m.opacity=wallO;m.depthWrite=wallO>.9}
      roof.visible=!inside||P.y>H;strips.visible=true;
      const li=inside?32:0;lightV+=(li-lightV)*Math.min(1,dt*4);L.intensity=lightV;
    }};
  return api;
}
