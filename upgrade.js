/* ===================== SUPER TOWN · VISUAL UPGRADE =====================
   Decor-only layer for the town: dressed facades (shop fronts, awnings, ledges, corner pilasters),
   rooftop kit (HVAC, solar, glass setback towers), street trees, crosswalks, parked cars, and a fuller
   car lineup (sedan, SUV, sports car, pickup). Nothing here adds collision, so movement is unchanged. */
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const SHOP=[0xc8ff43,0x4dd2ff,0xffc83d,0xff6b8a];
const rnd=(a,b)=>a+Math.random()*(b-a);
const place=(g,x,y,z)=>g.applyMatrix4(new THREE.Matrix4().makeTranslation(x,y,z));

/* shared materials */
const MAT={
  trim:new THREE.MeshStandardMaterial({color:0x2a4034,roughness:.4,metalness:.7}),
  ledge:new THREE.MeshStandardMaterial({color:0x14241b,roughness:.6,metalness:.5}),
  hvac:new THREE.MeshStandardMaterial({color:0x3d4f46,roughness:.55,metalness:.8}),
  solar:new THREE.MeshStandardMaterial({color:0x0b1c3a,roughness:.2,metalness:.9}),
  glass:new THREE.MeshStandardMaterial({color:0x0c2a1f,roughness:.12,metalness:.9,emissive:0x08321e,emissiveIntensity:.5}),
  trunk:new THREE.MeshStandardMaterial({color:0x2b1d12,roughness:.9}),
  canopy:new THREE.MeshStandardMaterial({color:0x2f8a2a,emissive:0x1a5a14,emissiveIntensity:.6,roughness:.7}),
  awn:SHOP.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.5,metalness:.2,emissive:c,emissiveIntensity:.25})),
  shop:SHOP.map(c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2)})),
  stripe:new THREE.MeshBasicMaterial({color:new THREE.Color(.9,.95,.92)}),
  black:new THREE.MeshStandardMaterial({color:0x0a0e0c,roughness:.6,metalness:.2}),
  chrome:new THREE.MeshStandardMaterial({color:0xbfd8c8,roughness:.2,metalness:.95}),
  carGlass:new THREE.MeshStandardMaterial({color:0x06120e,roughness:.06,metalness:.95}),
  head:new THREE.MeshBasicMaterial({color:new THREE.Color(3,3,2.4)}),
  tail:new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.25)}),
};

/* car profiles: body length/height/y, cabin size/position, wheel placement */
const CAR={
  sedan: {bl:4.2,bh:.66,by:.6, cw:1.72,ch:.6,cl:2.1, cy:1.22,cz:.15, wz:1.35,wr:.42},
  suv:   {bl:4.3,bh:.8, by:.66,cw:1.9, ch:.7,cl:2.9, cy:1.36,cz:-.15,wz:1.35,wr:.46,rack:true},
  sports:{bl:4.0,bh:.46,by:.46,cw:1.6, ch:.42,cl:1.9,cy:.84,cz:.25, wz:1.3, wr:.38,spoiler:true},
  truck: {bl:4.4,bh:.8, by:.66,cw:1.9, ch:.72,cl:1.7,cy:1.3,cz:-1.1, wz:1.35,wr:.46,bed:true},
};
const GEO={};
const geo=(k,f)=>GEO[k]||(GEO[k]=f());

/* a car model facing -z (headlights at the front), ready to add to the scene */
export function makeCarModel(col,type='sedan'){
  const P=CAR[type]||CAR.sedan,g=new THREE.Group();g.userData.type=type;
  const paint=new THREE.MeshStandardMaterial({color:col,roughness:.22,metalness:.65,emissive:col,emissiveIntensity:.14});
  const add=(m,x,y,z)=>{m.position.set(x,y,z);g.add(m);return m};
  add(new THREE.Mesh(geo('body'+type,()=>new RoundedBoxGeometry(2,P.bh,P.bl,2,.18)),paint),0,P.by,0);
  add(new THREE.Mesh(geo('cab'+type,()=>new RoundedBoxGeometry(P.cw,P.ch,P.cl,2,.25)),MAT.carGlass),0,P.cy,P.cz);
  add(new THREE.Mesh(geo('roof'+type,()=>new THREE.BoxGeometry(P.cw-.1,.08,P.cl-.3)),paint),0,P.cy+P.ch/2+.02,P.cz);
  for(const x of[-1,1])for(const z of[-P.wz,P.wz]){
    add(new THREE.Mesh(geo('tire'+type,()=>new THREE.CylinderGeometry(P.wr,P.wr,.36,14)),MAT.black),x*1.02,P.wr,z).rotation.z=Math.PI/2;
    add(new THREE.Mesh(geo('rim'+type,()=>new THREE.CylinderGeometry(P.wr*.55,P.wr*.55,.4,10)),MAT.chrome),x*1.04,P.wr,z).rotation.z=Math.PI/2;
  }
  const hz=-P.bl/2-.02,tz=P.bl/2+.02;
  for(const x of[-.66,.66]){
    add(new THREE.Mesh(geo('lamp',()=>new THREE.BoxGeometry(.46,.16,.08)),MAT.head),x,P.by+.06,hz);
    add(new THREE.Mesh(geo('lamp',()=>new THREE.BoxGeometry(.46,.16,.08)),MAT.tail),x,P.by+.06,tz);
  }
  add(new THREE.Mesh(geo('grille',()=>new THREE.BoxGeometry(1.2,.18,.06)),MAT.black),0,P.by-.16,hz+.01);
  for(const x of[-1,1])add(new THREE.Mesh(geo('mirror',()=>new THREE.BoxGeometry(.22,.14,.24)),MAT.black),x*(P.cw/2+.14),P.cy-.05,P.cz-.5);
  if(P.rack)add(new THREE.Mesh(geo('rack',()=>new THREE.BoxGeometry(1.7,.06,2.4)),MAT.black),0,P.cy+P.ch/2+.2,P.cz);
  if(P.spoiler){
    add(new THREE.Mesh(geo('wing',()=>new THREE.BoxGeometry(1.9,.07,.32)),MAT.black),0,P.by+P.bh/2+.24,P.bl/2-.4);
    for(const x of[-.7,.7])add(new THREE.Mesh(geo('post',()=>new THREE.BoxGeometry(.08,.24,.08)),MAT.black),x,P.by+P.bh/2+.12,P.bl/2-.4);
  }
  if(P.bed){
    const top=P.by+P.bh/2;
    add(new THREE.Mesh(geo('bed',()=>new THREE.BoxGeometry(1.9,.1,2.2)),MAT.black),0,top+.04,1.1);
    for(const x of[-.95,.95])add(new THREE.Mesh(geo('bedwall',()=>new THREE.BoxGeometry(.1,.42,2.2)),paint),x,top+.25,1.1);
    add(new THREE.Mesh(geo('bedgate',()=>new THREE.BoxGeometry(1.9,.42,.1)),paint),0,top+.25,2.2);
  }
  return g;
}

/* builds all the decor for the town: call dressBlocks / streetscape, then flush once */
export function createTownUpgrade(scene){
  // building decor is collected per material and merged into a handful of draw calls
  const buckets=new Map();
  const put=(mat,g,x,y,z)=>{let b=buckets.get(mat);if(!b)buckets.set(mat,b=[]);b.push(place(g,x,y,z))};

  function dress(x,z,w,d,h,seed){
    const hw=w/2,hd=d/2,s=Math.abs(seed)%SHOP.length;
    // shop-front glow strip and awning on each of the four faces
    for(const[nx,nz,dist,len]of[[0,1,hd,w],[0,-1,hd,w],[1,0,hw,d],[-1,0,hw,d]]){
      const alongX=nx===0,L=Math.max(2,len-3.5),px=x+nx*(dist+.04),pz=z+nz*(dist+.04);
      put(MAT.shop[s],new THREE.BoxGeometry(alongX?L:.12,1.1,alongX?.12:L),px,1.3,pz);
      put(MAT.awn[s],new THREE.BoxGeometry(alongX?L+.8:1.3,.16,alongX?1.3:L+.8),px+nx*.65,2.9,pz+nz*.65);
    }
    // stone ledges every few floors on taller blocks
    if(h>22)for(let y=14;y<h-5;y+=9){
      put(MAT.ledge,new THREE.BoxGeometry(w+1,.4,.6),x,y,z+hd+.2);
      put(MAT.ledge,new THREE.BoxGeometry(w+1,.4,.6),x,y,z-hd-.2);
      put(MAT.ledge,new THREE.BoxGeometry(.6,.4,d+1),x+hw+.2,y,z);
      put(MAT.ledge,new THREE.BoxGeometry(.6,.4,d+1),x-hw-.2,y,z);
    }
    // corner pilasters
    if(h>12)for(const sx of[-1,1])for(const sz of[-1,1])put(MAT.trim,new THREE.BoxGeometry(.35,h,.35),x+sx*(hw+.12),h/2,z+sz*(hd+.12));
    // rooftop kit
    const tower=h>30&&w>=12;
    for(let i=0,n=h>30?4:2+(Math.abs(seed)%2);i<n;i++){
      const bw=rnd(2,3.4),bd=rnd(1.8,3),bh=rnd(1.2,1.8);
      put(MAT.hvac,new THREE.BoxGeometry(bw,bh,bd),x+rnd(-hw+2,hw-2),h+.35+bh/2,z+rnd(-hd+2,hd-2));
    }
    if(Math.abs(seed)%3===0&&!tower)put(MAT.solar,new THREE.BoxGeometry(w*.5,.14,d*.42),x,h+.45,z);
    // glass setback tower on the taller blocks
    if(tower){
      const sw=w*.6,sd=d*.6,sh=Math.min(16,h*.2);
      put(MAT.glass,new THREE.BoxGeometry(sw,sh,sd),x,h+sh/2,z);
      put(MAT.trim,new THREE.BoxGeometry(sw+.4,.3,sd+.4),x,h+sh+.15,z);
      put(MAT.trim,new THREE.CylinderGeometry(.08,.12,5,6),x,h+sh+2.5,z);
    }
  }
  function dressBlocks(list){
    for(const b of list)dress(b.x,b.z,b.hw*2,b.hd*2,b.h,Math.round(Math.abs(b.x)*3+Math.abs(b.z)*5));
  }

  // merged building decor goes in as one mesh per material
  function flush(){
    for(const[mat,list]of buckets){
      const m=mergeGeometries(list,false);if(m)scene.add(new THREE.Mesh(m,mat));
      list.forEach(g=>g.dispose());
    }
    buckets.clear();
  }

  // street trees, crosswalks and parked cars
  function streetscape(ROADS,RW,B,ISL){
    const near=(x,z,pad)=>B.some(b=>Math.abs(x-b.x)<b.hw+pad&&Math.abs(z-b.z)<b.hd+pad);

    // street trees on both sides of every avenue, skipping intersections, the plaza and buildings
    const tOff=RW/2+1.5;
    for(const c of ROADS)for(const horiz of[true,false])for(const s of[-1,1])for(let t=-100;t<=100;t+=12){
      const jt=t+rnd(-1.5,1.5);
      if(ROADS.some(r=>Math.abs(jt-r)<RW/2+3))continue;
      const x=horiz?jt:c+s*tOff,z=horiz?c+s*tOff:jt;
      if(Math.hypot(x,z)<14||Math.hypot(x,z)>ISL*.9||near(x,z,1.5))continue;
      const sc=rnd(.85,1.25);
      put(MAT.trunk,new THREE.CylinderGeometry(.18*sc,.26*sc,2.2*sc,6),x,1.1*sc,z);
      put(MAT.canopy,new THREE.ConeGeometry(1.5*sc,4.2*sc,8),x,3.9*sc,z);
    }

    // crosswalk stripes on every arm of every intersection (the plaza stays clear)
    const H=[],V=[];
    for(const ix of ROADS)for(const iz of ROADS){
      if(ix===0&&iz===0)continue;
      for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]])for(let k=0;k<3;k++){
        const o=RW/2+1.6+k*1.3;
        if(dx)H.push([ix+dx*o,iz]);else V.push([ix,iz+dz*o]);
      }
    }
    const stripes=(list,sx,sz)=>{
      if(!list.length)return;
      const im=new THREE.InstancedMesh(new THREE.BoxGeometry(sx,.04,sz),MAT.stripe,list.length),m=new THREE.Matrix4();
      list.forEach(([x,z],i)=>im.setMatrixAt(i,m.makeTranslation(x,.07,z)));
      scene.add(im);
    };
    stripes(H,.6,RW-1.6);stripes(V,RW-1.6,.6);

    // parked cars along the outer stretches of the two outer avenues (kept clear of the traffic loop)
    const TYPES=['sedan','suv','sedan','sports','truck'],COLS=[0xe9f4ea,0x4dd2ff,0xff4d4f,0xffc83d,0x7bff3a,0x1a2a24,0xff2a9a];
    let k=0;
    const park=(x,z,ry)=>{
      if(near(x,z,1.2))return;
      const g=makeCarModel(COLS[k%COLS.length],TYPES[k%TYPES.length]);k++;
      g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
    };
    for(const c of[-36,36])for(const s of[-1,1])for(const sx of[-1,1])for(let t=42;t<=94;t+=11)
      if(Math.random()<.6)park(sx*(t+rnd(-.8,.8)),c+s*(RW/2-1.9),Math.random()<.5?Math.PI/2:-Math.PI/2);
  }

  return{dressBlocks,streetscape,flush};
}
