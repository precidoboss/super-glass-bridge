/* ===================== SUPER TOWN · THE WEST BRIDGE =====================
   A cable-stayed road bridge that leaves the island at its west road (x = -104) and crosses the abyss to the
   airport platform (x = -168). The deck is the road: same asphalt, a dashed centre line and lime edge lines.
   Guard rails run both sides and are real colliders, so cars and people stay on the deck. Lamp posts glow along
   the rails, two white pylons hold the deck on cable stays, and piers drop into the abyss.
   Exports BRIDGE (the x of each end) and makeBridge(). */

export const BRIDGE={gate:-104,end:-168,half:4.5,rail:4.9};

export function makeBridge({THREE,scene,B}){
  const {gate,end}=BRIDGE;
  const L=gate-end, cx=(gate+end)/2, HALF=4.5, RAIL=4.9;
  const root=new THREE.Group();scene.add(root);

  const asphalt=new THREE.MeshStandardMaterial({color:0x0b1410,roughness:.55,metalness:.4});
  const concrete=new THREE.MeshStandardMaterial({color:0x1b2320,roughness:.85,metalness:.1});
  const railM=new THREE.MeshStandardMaterial({color:0x27313a,roughness:.4,metalness:.7});
  const whiteM=new THREE.MeshStandardMaterial({color:0xe6ecf1,roughness:.35,metalness:.3});
  const limeM=new THREE.MeshBasicMaterial({color:new THREE.Color(.8,2.2,.4)});
  const redM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,.4,.9)});
  const paintW=new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,1.4,1.4)});
  const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);return t})();
  const glow=(x,y,z,s,col)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));sp.scale.set(s,s,1);sp.position.set(x,y,z);root.add(sp);return sp};
  const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);root.add(o);return o};

  /* deck: the road surface, the slab under it, and the edge lines */
  box(L,.06,HALF*2,asphalt,cx,.03,0);
  box(L,2.2,HALF*2+1.2,concrete,cx,-1.1,0);
  box(L,.07,.22,limeM,cx,.04,HALF-.3);
  box(L,.07,.22,limeM,cx,.04,-(HALF-.3));
  for(let x=gate-1.5;x>end;x-=4.5)box(2.4,.08,.22,paintW,x,.05,0);

  /* guard rails: a low barrier with a lime cap on both sides, as colliders */
  for(const s of[-1,1]){
    box(L,1.1,.3,railM,cx,.55,s*RAIL);
    box(L,.08,.4,limeM,cx,1.14,s*RAIL);
    B.push({x:cx,z:s*RAIL,hw:L/2,hd:.2,h:1.2,name:null});
    for(let x=gate-3;x>end+1;x-=8){glow(x,4.2,s*(RAIL+.2),3.2,0xc8ff43);box(.16,4,.16,railM,x,2,s*(RAIL+.2))}
  }

  /* the gate: a gantry sign across the road at the island end, so drivers see where the bridge goes */
  for(const s2 of[-1,1]){box(.6,7,.6,whiteM,gate+1.5,3.5,s2*6.3)}
  box(.6,1.4,13.2,whiteM,gate+1.5,7,0);
  {const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle='#0b1a33';g.fillRect(0,0,1024,256);g.strokeStyle='#c8ff43';g.lineWidth=12;g.strokeRect(10,10,1004,236);
   g.fillStyle='#c8ff43';g.font='bold 92px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('SUPER TOWN AIRPORT',512,100);g.fillStyle='#e9f6ea';g.font='bold 56px sans-serif';g.fillText('WEST BRIDGE',512,190);
   const t=new THREE.CanvasTexture(c);const pl=new THREE.Mesh(new THREE.PlaneGeometry(12,3),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));pl.rotation.y=Math.PI/2;pl.position.set(gate+1.9,5.9,0);root.add(pl)}
  /* two pylons outside the rails, with cable stays down to the deck */
  const dir=new THREE.Vector3();
  const stay=(x1,y1,z1,x2,y2,z2)=>{
    const len=Math.hypot(x2-x1,y2-y1,z2-z1);
    const c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,len,6),new THREE.MeshStandardMaterial({color:0xd9e1e6,metalness:.8,roughness:.3}));
    c.position.set((x1+x2)/2,(y1+y2)/2,(z1+z2)/2);
    dir.set(x2-x1,y2-y1,z2-z1).normalize();c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);root.add(c);
  };
  for(const px of[-124,-152]){
    for(const s of[-1,1]){
      box(1,27,1,whiteM,px,13.5,s*8);
      glow(px,27.6,s*8,2.2,0xff2e88);
      for(const d of[-18,-12,-6,6,12,18])stay(px,24,s*8,px+d,1.2,s*RAIL);
    }
    box(1.2,1.2,17,whiteM,px,25,0);
  }

  /* piers down into the abyss */
  for(let x=gate-8;x>end+3;x-=8){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.2,60,12),concrete);p.position.set(x,-31,0);root.add(p);
    box(3.2,1.2,HALF*2+1,concrete,x,-2.6,0);
  }
  return{x0:gate,x1:end,hw:HALF};
}
