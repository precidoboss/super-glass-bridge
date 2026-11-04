/* Lamborghini Urus: a wide, angular super-SUV built the same way as the Super Benz (same parts and controls):
   an extruded side silhouette, a glass greenhouse, hexagonal-style headlights, a full-width light bar,
   quad exhausts and a rear diffuser. Front is toward -z, like the Benz. */
import * as THREE from 'three';

export const URUS_PAINTS=[
  {name:'VERDE MANTIS',color:0x7bff3a,metal:.6,rough:.22},
  {name:'ARANCIO BOREALIS',color:0xff7a1a,metal:.6,rough:.22},
  {name:'BIANCO MONOCEROS',color:0xf2f4f7,metal:.3,rough:.25},
  {name:'GIALLO AUGE',color:0xffd60a,metal:.6,rough:.22},
  {name:'NERO NOCTIS',color:0x0c0f12,metal:.7,rough:.18}
];

export function createUrus(renderer,opts={}){
  const group=new THREE.Group();group.name='LAMBORGHINI URUS';
  const body=new THREE.Group();group.add(body);
  const paintMat=new THREE.MeshPhysicalMaterial({color:URUS_PAINTS[0].color,metalness:URUS_PAINTS[0].metal,roughness:URUS_PAINTS[0].rough,clearcoat:1,clearcoatRoughness:.05});
  const dark=new THREE.MeshStandardMaterial({color:0x0b0f0d,roughness:.5,metalness:.4});
  const glass=new THREE.MeshPhysicalMaterial({color:0x0b1714,metalness:.4,roughness:.12,clearcoat:.8});
  const chrome=new THREE.MeshStandardMaterial({color:0xdde6ea,metalness:1,roughness:.15});
  const lampM=new THREE.MeshStandardMaterial({color:0xf4fbff,emissive:0xdff6ff,emissiveIntensity:1.6});
  const tailM=new THREE.MeshStandardMaterial({color:0x330000,emissive:0xff2a2a,emissiveIntensity:1.4});
  const barM=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xc8ff43,emissiveIntensity:1.8});

  const L=4.95,W=2.0,R=.4;
  // the silhouette is drawn in side profile (x = length from the back, y = height), then extruded across the width
  const toCar=(g)=>{g.rotateY(Math.PI/2);g.translate(0,0,L/2+.05);return g};
  const sideOutline=[[.05,.38],[0,.72],[0,1.22],[.45,1.5],[2.9,1.62],[3.9,1.42],[4.55,1.05],[4.86,.8],[4.95,.5],[4.9,.36]];
  const bodyG=new THREE.ExtrudeGeometry(new THREE.Shape(sideOutline.map(([x,y])=>new THREE.Vector2(x,y))),{depth:W*.92,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2,steps:1});
  bodyG.translate(0,0,-W*.46);
  const bodyMesh=new THREE.Mesh(toCar(bodyG),paintMat);body.add(bodyMesh);
  // glass greenhouse
  const cabinG=new THREE.ExtrudeGeometry(new THREE.Shape([[1.05,1.12],[1.55,1.46],[2.8,1.5],[3.55,1.2]].map(([x,y])=>new THREE.Vector2(x,y))),{depth:W*.84,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:1,steps:1});
  cabinG.translate(0,0,-W*.42);
  body.add(new THREE.Mesh(toCar(cabinG),glass));

  const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);body.add(m);return m};
  // front: grille, headlights with light strip, side intakes, mirrors
  add(new THREE.BoxGeometry(1.2,.22,.06),dark,0,.56,-2.46);
  add(new THREE.BoxGeometry(.5,.16,.08),lampM,-.68,.84,-2.44);
  add(new THREE.BoxGeometry(.5,.16,.08),lampM,.68,.84,-2.44);
  add(new THREE.BoxGeometry(1.5,.05,.05),lampM,0,.92,-2.45);
  for(const x of[-1,1])add(new THREE.BoxGeometry(.3,.3,.1),dark,x*.98,.52,-2.42);
  for(const x of[-1,1])add(new THREE.BoxGeometry(.22,.14,.3),dark,x*1.08,1.12,-.8);
  // rear: light bar across the full width, tail lamps, quad exhausts and diffuser
  add(new THREE.BoxGeometry(1.9,.08,.06),barM,0,1.0,2.46);
  for(const x of[-1,1])add(new THREE.BoxGeometry(.4,.18,.06),tailM,x*.72,.95,2.47);
  for(const x of[-1,1])for(const dx of[-.14,.14])add(new THREE.CylinderGeometry(.07,.07,.3,12),chrome,x*.62+dx,.3,2.42,Math.PI/2,0,0);
  add(new THREE.BoxGeometry(1.9,.16,.3),dark,0,.3,2.45);
  // wheels: each wheel has a steer pivot and a spin group, like the Benz
  const wheels=[],steer=[];
  const wheel=(x,z,front)=>{
    const piv=new THREE.Group();piv.position.set(x,R,z);body.add(piv);
    const spin=new THREE.Group();piv.add(spin);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(R,R,.34,22),dark);tire.rotation.z=Math.PI/2;spin.add(tire);
    const rim=new THREE.Mesh(new THREE.CylinderGeometry(R*.62,R*.62,.36,18),chrome);rim.rotation.z=Math.PI/2;spin.add(rim);
    wheels.push({spin});if(front)steer.push(piv);
  };
  wheel(-.98,-1.45,true);wheel(.98,-1.45,true);wheel(-.98,1.5,false);wheel(.98,1.5,false);

  // headlight beam
  const beam=new THREE.SpotLight(0xdff6ff,0,46,.55,.7,1.4);beam.position.set(0,.8,-2.4);beam.target.position.set(0,.2,-14);
  if(!opts.noBeam){group.add(beam);group.add(beam.target)}

  let paintIdx=0;
  const api={
    group,body,wheels,steer,beam,env:null,paints:URUS_PAINTS,
    dims:{L,W,R},
    seat:{x:-.42,y:.7,z:.2},
    setPaint(i){paintIdx=((i%URUS_PAINTS.length)+URUS_PAINTS.length)%URUS_PAINTS.length;const p=URUS_PAINTS[paintIdx];paintMat.color.setHex(p.color);paintMat.metalness=p.metal;paintMat.roughness=p.rough;return p},
    nextPaint(){return api.setPaint(paintIdx+1)},
    setBrake(on){tailM.emissiveIntensity+=((on?4.2:1.4)-tailM.emissiveIntensity)*.35},
    setLights(on){beam.intensity+=((on?70:0)-beam.intensity)*.2;lampM.emissiveIntensity=on?3.4:1.6},
    pose(v,steerAngle,dt,roll,pitch){
      for(const w of wheels)w.spin.rotation.x-=v*dt/R;
      for(const p of steer)p.rotation.y=steerAngle;
      body.rotation.z=roll;body.rotation.x=pitch;
    }
  };
  return api;
}
