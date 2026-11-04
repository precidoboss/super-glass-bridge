/* Lamborghini Urus (redesigned): a wide, angular super-SUV with the same API the game already drives.
   Sharper wedge body, Y-signature LED headlights, hex-mesh grille, side intakes, roof scoop, rear spoiler,
   full-width light bar, quad exhausts, five-spoke rims with lime calipers and a lime sill accent.
   Front is toward -z, like the Benz. */
import * as THREE from 'three';

export const URUS_PAINTS=[
  {name:'VERDE MANTIS',color:0x7bff3a,metal:.6,rough:.22},
  {name:'ARANCIO BOREALIS',color:0xff7a1a,metal:.6,rough:.22},
  {name:'BIANCO MONOCEROS',color:0xf2f4f7,metal:.3,rough:.25},
  {name:'GIALLO AUGE',color:0xffd60a,metal:.6,rough:.22},
  {name:'NERO NOCTIS',color:0x0c0f12,metal:.7,rough:.18}
];

function makeEnv(renderer){
  const s=new THREE.Scene();
  const c=document.createElement('canvas');c.width=8;c.height=256;const x=c.getContext('2d');
  const gr=x.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#1c2630');gr.addColorStop(.40,'#56707a');gr.addColorStop(.5,'#f2fbff');gr.addColorStop(.56,'#1b2a2a');gr.addColorStop(1,'#040706');
  x.fillStyle=gr;x.fillRect(0,0,8,256);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  s.add(new THREE.Mesh(new THREE.SphereGeometry(50,32,16),new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide})));
  const box=(w,h,d,col,i,px,py,pz)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(i)}));m.position.set(px,py,pz);s.add(m)};
  box(30,.6,5,0xffffff,6,0,22,0);box(.6,10,30,0xd8ff7a,2.6,-30,8,0);box(.6,10,30,0xffffff,3.2,30,8,0);
  const pm=new THREE.PMREMGenerator(renderer);const rt=pm.fromScene(s,.03);pm.dispose();
  return rt.texture;
}

// hex-mesh grille texture (the Urus signature)
function hexGrille(){
  const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#050706';g.fillRect(0,0,256,128);
  g.strokeStyle='#3a4d44';g.lineWidth=3;
  for(let row=0;row<7;row++)for(let col=0;col<11;col++){
    const x=col*22+(row%2?11:0)+8,y=row*18+10,r=10;
    g.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;k?g.lineTo(px,py):g.moveTo(px,py)}
    g.closePath();g.stroke();
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function createUrus(renderer,opts={}){
  const env=opts.env||makeEnv(renderer);
  const group=new THREE.Group();group.name='LAMBORGHINI URUS';
  const body=new THREE.Group();group.add(body);
  const paintMat=new THREE.MeshPhysicalMaterial({color:URUS_PAINTS[0].color,metalness:URUS_PAINTS[0].metal,roughness:URUS_PAINTS[0].rough,clearcoat:1,clearcoatRoughness:.05,envMap:env,envMapIntensity:1.4});
  const dark=new THREE.MeshStandardMaterial({color:0x0b0f0d,roughness:.5,metalness:.4});
  const glass=new THREE.MeshPhysicalMaterial({color:0x0b1714,metalness:.45,roughness:.12,clearcoat:.8,envMap:env,envMapIntensity:1});
  const chrome=new THREE.MeshStandardMaterial({color:0xdde6ea,metalness:1,roughness:.15,envMap:env,envMapIntensity:1.6});
  const lampM=new THREE.MeshStandardMaterial({color:0xf4fbff,emissive:0xdff6ff,emissiveIntensity:1.6});
  const tailM=new THREE.MeshStandardMaterial({color:0x330000,emissive:0xff2a2a,emissiveIntensity:1.4});
  const barM=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xc8ff43,emissiveIntensity:1.8});
  const limeM=new THREE.MeshStandardMaterial({color:0xc8ff43,emissive:0x5a8a10,emissiveIntensity:.6,roughness:.4});
  const grilleM=new THREE.MeshStandardMaterial({map:hexGrille(),roughness:.4,metalness:.5});

  const L=4.95,W=2.0,R=.4;
  // side profile (x = length from the back, y = height), extruded across the width: sharper shoulder, lower nose
  const toCar=(g)=>{g.rotateY(Math.PI/2);g.translate(0,0,L/2+.05);return g};
  const sideOutline=[[.05,.36],[0,.7],[0,1.18],[.4,1.46],[1.2,1.52],[2.9,1.64],[3.9,1.44],[4.55,1.02],[4.86,.78],[4.95,.5],[4.9,.34]];
  const bodyG=new THREE.ExtrudeGeometry(new THREE.Shape(sideOutline.map(([x,y])=>new THREE.Vector2(x,y))),{depth:W*.92,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2,steps:1});
  bodyG.translate(0,0,-W*.46);
  body.add(new THREE.Mesh(toCar(bodyG),paintMat));
  // glass greenhouse
  const cabinG=new THREE.ExtrudeGeometry(new THREE.Shape([[1.05,1.12],[1.55,1.48],[2.8,1.52],[3.55,1.2]].map(([x,y])=>new THREE.Vector2(x,y))),{depth:W*.84,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:1,steps:1});
  cabinG.translate(0,0,-W*.42);
  body.add(new THREE.Mesh(toCar(cabinG),glass));

  const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);body.add(m);return m};

  // front: hex grille, Y-signature headlights, splitter and a lime light strip
  const grille=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.42),grilleM);grille.position.set(0,.6,-2.47);grille.rotation.y=Math.PI;body.add(grille);
  for(const s of[-1,1]){
    add(new THREE.BoxGeometry(.62,.075,.05),lampM,s*.66,.92,-2.44,0,0,-s*.22);      // main bar of the Y
    add(new THREE.BoxGeometry(.32,.075,.05),lampM,s*.92,.76,-2.44,0,0,s*.58);       // lower leg of the Y
    add(new THREE.BoxGeometry(.2,.14,.08),dark,s*.98,.45,-2.42);                    // lower air intake
    add(new THREE.BoxGeometry(.06,.3,.9),dark,s*1.0,.7,-1.0);                       // side intake
  }
  add(new THREE.BoxGeometry(1.7,.05,.12),limeM,0,.26,-2.4);                         // lime splitter line
  add(new THREE.BoxGeometry(1.5,.05,.05),lampM,0,1.0,-2.45);                        // centre light strip
  for(const x of[-1,1])add(new THREE.BoxGeometry(.22,.14,.3),dark,x*1.08,1.12,-.8); // mirror bases

  // roof: scoop and rails
  add(new THREE.BoxGeometry(.72,.14,.5),dark,0,1.6,.42);
  add(new THREE.BoxGeometry(.04,.04,2.6),chrome,-.92,1.66,.1);
  add(new THREE.BoxGeometry(.04,.04,2.6),chrome,.92,1.66,.1);

  // rear: spoiler on the deck, light bar across the full width, tail lamps, quad exhausts and diffuser
  add(new THREE.BoxGeometry(1.72,.05,.22),dark,0,1.36,2.36);
  for(const x of[-.6,.6])add(new THREE.BoxGeometry(.05,.22,.05),dark,x,1.26,2.3);
  add(new THREE.BoxGeometry(1.9,.08,.06),barM,0,1.0,2.46);
  for(const x of[-1,1])add(new THREE.BoxGeometry(.42,.2,.06),tailM,x*.72,.95,2.47);
  for(const x of[-1,1])for(const dx of[-.14,.14])add(new THREE.CylinderGeometry(.07,.07,.3,12),chrome,x*.62+dx,.3,2.42,Math.PI/2,0,0);
  add(new THREE.BoxGeometry(1.9,.16,.3),dark,0,.3,2.45);
  add(new THREE.BoxGeometry(1.92,.02,.04),limeM,0,.44,2.46);                        // lime diffuser edge
  for(const s of[-1,1])add(new THREE.BoxGeometry(.012,.012,3.6),limeM,s*.99,.5,0);  // lime sill accent

  // wheels: five-spoke rims and lime calipers, each with a steer pivot and a spin group
  const wheels=[],steer=[];
  const tireGeo=new THREE.CylinderGeometry(R,R,.34,28);tireGeo.rotateZ(Math.PI/2);
  const rimGeo=new THREE.CylinderGeometry(R*.62,R*.62,.36,22);rimGeo.rotateZ(Math.PI/2);
  const spokeGeo=new THREE.BoxGeometry(.04,.26,.1);
  const wheel=(x,z,front)=>{
    const piv=new THREE.Group();piv.position.set(x,R,z);body.add(piv);
    const spin=new THREE.Group();piv.add(spin);
    spin.add(new THREE.Mesh(tireGeo,dark));
    spin.add(new THREE.Mesh(rimGeo,chrome));
    for(let i=0;i<5;i++){const sp=new THREE.Mesh(spokeGeo,chrome);sp.position.set(x<0?.06:-.06,0,0);sp.rotation.x=i/5*Math.PI*2;spin.add(sp)}
    const cal=new THREE.Mesh(new THREE.BoxGeometry(.1,.22,.3),limeM);cal.position.set(x<0?-.12:.12,.1,z<0?-.04:.04);piv.add(cal);
    wheels.push({spin});if(front)steer.push(piv);
  };
  wheel(-.98,-1.45,true);wheel(.98,-1.45,true);wheel(-.98,1.5,false);wheel(.98,1.5,false);

  // headlight beam
  const beam=new THREE.SpotLight(0xdff6ff,0,46,.55,.7,1.4);beam.position.set(0,.8,-2.4);beam.target.position.set(0,.2,-14);
  if(!opts.noBeam){group.add(beam);group.add(beam.target)}

  let paintIdx=0;
  const api={
    group,body,wheels,steer,beam,env,paints:URUS_PAINTS,
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
