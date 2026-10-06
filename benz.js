import * as THREE from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';

/* ===================== SUPER BENZ =====================
   A procedurally lofted luxury sedan: smooth body shell built from cross-sections,
   tinted glass, AMG-style wheels with brakes, LED head/tail lamps, star badges,
   an interior with a seat for the super character, and a lime underglow. */

export const PAINTS=[
  {name:'OBSIDIAN BLACK',color:0x07090a,metal:.7,rough:.26},
  {name:'SELENITE SILVER',color:0xb7bfc4,metal:.95,rough:.3},
  {name:'EMERALD GREEN',color:0x0b5a38,metal:.85,rough:.3},
  {name:'CARDINAL RED',color:0x8d0a16,metal:.8,rough:.3}
];

const L=5.1,HL=L/2,HW=1.0,R=.38,AX=1.5,YB=.22;
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
const zOf=t=>-HL+t*L;

function curve1D(keys){
  const n=keys.length,m=[];
  for(let i=0;i<n;i++){const a=keys[Math.max(0,i-1)],b=keys[Math.min(n-1,i+1)];m[i]=(b[1]-a[1])/(b[0]-a[0])}
  return x=>{
    if(x<=keys[0][0])return keys[0][1];if(x>=keys[n-1][0])return keys[n-1][1];
    let i=0;while(x>keys[i+1][0])i++;
    const x0=keys[i][0],x1=keys[i+1][0],h=x1-x0,t=(x-x0)/h,t2=t*t,t3=t2*t;
    return(2*t3-3*t2+1)*keys[i][1]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*keys[i+1][1]+(t3-t2)*h*m[i+1];
  };
}

/* roofline / hood / deck height along the car (t: 0 = nose, 1 = tail) */
const Ytop=curve1D([[0,.60],[.012,.70],[.05,.82],[.12,.90],[.26,.955],[.35,.98],[.40,1.06],[.45,1.22],[.50,1.35],[.56,1.425],[.63,1.43],[.70,1.33],[.76,1.15],[.82,1.04],[.90,.985],[.965,.94],[.99,.86],[1,.74]]);
const edgeF=t=>Math.min(1,t/.08,(1-t)/.07);
const easeE=e=>Math.sqrt(Math.max(0,1-(1-e)*(1-e)));
const widthAt=t=>HW*easeE(edgeF(t))*(1-.2*(1-smooth(0,.14,t)))*(1-.12*smooth(.86,1,t));

function section(t){
  const w=widthAt(t),yt=Ytop(t),e=edgeF(t);
  const yb=YB+.14*Math.pow(1-e,2);
  const ysh=Math.min(yt-.02,.93+.07*t),hc=yt-ysh,f=smooth(.03,.26,hc);
  const ys=[yb,yb,yb+.035,yb+.12,ysh-.2,ysh-.075,ysh];
  const xs=[0,w*.88,w*.995,w,w,w*.985,w*.935];
  const cx=[[.88,.82],[.62,.71],[.42,.58],[.2,.28],[0,0]];
  const cy=[ysh+lerp(.012,.04,f),lerp(yt-.012,ysh+.04+Math.max(0,hc-.04)*.55,f),lerp(yt-.006,yt-.05,f),yt-.004*f,yt];
  const P=[];
  for(let i=0;i<7;i++)P.push([xs[i],ys[i]]);
  for(let i=0;i<5;i++)P.push([w*lerp(cx[i][0],cx[i][1],f),cy[i]]);
  for(let i=1;i<P.length;i++)P[i][1]=Math.max(P[i][1],P[i-1][1]);
  for(let i=0;i<P.length-1;i++)P[i][1]=Math.min(P[i][1],yt-.002);
  return P;
}

function buildBody(){
  const N=84,rings=[],ts=[];
  for(let i=0;i<=N;i++){
    const t=(1-Math.cos(Math.PI*i/N))/2;ts.push(t);
    const P=section(t),z=zOf(t),ring=[];
    for(let j=0;j<12;j++)ring.push(new THREE.Vector3(P[j][0],P[j][1],z));
    for(let j=10;j>=1;j--)ring.push(new THREE.Vector3(-P[j][0],P[j][1],z));
    rings.push(ring);
  }
  const M=rings[0].length,paint=[],glass=[];
  const segOf=r=>r<=10?r:(21-r+ (r===21?0:0));
  const isGlass=(s,tm)=>{
    if(s===7||s===8){if((tm>=.485&&tm<=.572)||(tm>=.598&&tm<=.705))return true}
    if(s>=8&&s<=10&&tm>=.375&&tm<=.485)return true;
    if((s===9||s===10)&&tm>=.655&&tm<=.80)return true;
    return false;
  };
  const push=(arr,a,b,c)=>{arr.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z)};
  for(let i=0;i<N;i++){
    const tm=(ts[i]+ts[i+1])/2;
    for(let r=0;r<M;r++){
      const r2=(r+1)%M,a=rings[i][r],c=rings[i][r2],b=rings[i+1][r],d=rings[i+1][r2];
      const s=r<=10?r:(r===21?0:21-r);
      const arr=isGlass(s,tm)?glass:paint;
      push(arr,a,c,b);push(arr,c,d,b);
    }
  }
  const cap=(ring,front)=>{
    const c=new THREE.Vector3();for(const v of ring)c.add(v);c.multiplyScalar(1/ring.length);
    for(let r=0;r<M;r++){const a=ring[r],b=ring[(r+1)%M];if(front)push(paint,c,b,a);else push(paint,c,a,b)}
  };
  cap(rings[0],true);cap(rings[N],false);
  const pos=new Float32Array(paint.length+glass.length);pos.set(paint,0);pos.set(glass,paint.length);
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.addGroup(0,paint.length/3,0);g.addGroup(paint.length/3,glass.length/3,1);
  g=toCreasedNormals(g,Math.PI/4.2);
  return g;
}

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
  box(18,.6,.6,0xffffff,4,0,10,-28);box(18,.6,.6,0xffe2b0,3,0,10,28);
  const pm=new THREE.PMREMGenerator(renderer);const rt=pm.fromScene(s,.03);pm.dispose();
  return rt.texture;
}

function starMesh(r,mat){
  const sh=new THREE.Shape();
  for(let i=0;i<3;i++){
    const a=i*2*Math.PI/3+Math.PI/2,b=a+Math.PI/3;
    const tx=Math.cos(a)*r,ty=Math.sin(a)*r,ix=Math.cos(b)*r*.17,iy=Math.sin(b)*r*.17;
    if(i===0)sh.moveTo(tx,ty);else sh.lineTo(tx,ty);
    sh.lineTo(ix,iy);
  }
  sh.closePath();
  const g=new THREE.Group();
  const star=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:r*.08,bevelEnabled:false}),mat);g.add(star);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r*1.12,r*.075,8,40),mat);ring.position.z=r*.04;g.add(ring);
  return g;
}

export function createBenz(renderer,opts={}){
  const env=opts.env||makeEnv(renderer);
  const group=new THREE.Group();group.name='SUPER HOME BENZ';
  const body=new THREE.Group();group.add(body);

  const paintMat=new THREE.MeshPhysicalMaterial({color:PAINTS[0].color,metalness:PAINTS[0].metal,roughness:PAINTS[0].rough,clearcoat:1,clearcoatRoughness:.04,envMap:env,envMapIntensity:1.5});
  const glassMat=new THREE.MeshPhysicalMaterial({color:0x07130e,metalness:.55,roughness:.04,envMap:env,envMapIntensity:1.55,transparent:true,opacity:.62,depthWrite:false,depthTest:true});glassMat.forceSinglePass=true;
  const chrome=new THREE.MeshStandardMaterial({color:0xe3eaee,metalness:1,roughness:.12,envMap:env,envMapIntensity:1.7});
  const blackGloss=new THREE.MeshPhysicalMaterial({color:0x040506,metalness:.6,roughness:.18,clearcoat:1,envMap:env,envMapIntensity:1});
  const rubber=new THREE.MeshStandardMaterial({color:0x0b0c0d,metalness:0,roughness:.85});
  const matte=new THREE.MeshStandardMaterial({color:0x020303,metalness:.1,roughness:.95});
  const gun=new THREE.MeshStandardMaterial({color:0x6c7479,metalness:1,roughness:.3,envMap:env,envMapIntensity:1.3});
  const limeM=new THREE.MeshBasicMaterial({color:0xc8ff43});

  const shell=new THREE.Mesh(buildBody(),[paintMat,glassMat]);body.add(shell);

  /* ---- helpers tied to the body shape ---- */
  const topAt=t=>Ytop(t),wAt=t=>widthAt(t);
  const tOfZ=z=>(z+HL)/L;

  /* headlights: sleek LED lenses + DRL eyebrow */
  const lampM=new THREE.MeshStandardMaterial({color:0xeaf8ff,emissive:0xbfe8ff,emissiveIntensity:2.2,metalness:.3,roughness:.1});
  const drlM=new THREE.MeshBasicMaterial({color:0xcff4ff});
  const lamps=[];
  for(const sd of[-1,1]){
    const t=.075,z=zOf(t),x=wAt(t)*.66,y=topAt(t)-.1;
    const lens=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),lampM);
    lens.scale.set(.34,.065,.15);lens.position.set(sd*x,y,z+.02);lens.rotation.y=-sd*.42;lens.rotation.x=.1;body.add(lens);
    const drl=new THREE.Mesh(new THREE.BoxGeometry(.44,.016,.02),drlM);
    drl.position.set(sd*(x+.02),y+.05,z-.05);drl.rotation.y=-sd*.42;body.add(drl);
    lamps.push(lens);
  }
  /* grille + star + lower intake */
  {
    const t=.03,z=zOf(t),y=topAt(t)-.085;
    const grille=new THREE.Mesh(new THREE.BoxGeometry(1.1,.17,.05),blackGloss);grille.position.set(0,y,z-.01);grille.rotation.x=.55;body.add(grille);
    for(let i=0;i<3;i++){const sl=new THREE.Mesh(new THREE.BoxGeometry(1.06,.012,.02),chrome);sl.position.set(0,y-.055+i*.055,z-.04+i*.0);sl.rotation.x=.55;body.add(sl)}
    const st=starMesh(.075,chrome);st.position.set(0,y+.015,z-.06);st.rotation.x=-.6;body.add(st);
  }
  /* tail lights: light bar + corner lamps */
  const tailM=new THREE.MeshStandardMaterial({color:0x6a0a12,emissive:0xff1426,emissiveIntensity:1.6,roughness:.2,metalness:.2});
  {
    const t=.955,z=zOf(t)+.03,w=wAt(t);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(w*1.45,.035,.03),tailM);bar.position.set(0,topAt(t)-.1,z);body.add(bar);
    for(const sd of[-1,1]){
      const l=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),tailM);l.scale.set(.2,.065,.05);l.position.set(sd*w*.76,topAt(t)-.1,z-.02);l.rotation.y=sd*.5;body.add(l);
    }
    const st=starMesh(.05,chrome);st.position.set(0,topAt(t)+.015,zOf(.935));st.rotation.x=-Math.PI/2+.25;body.add(st);
  }
  /* exhaust tips + diffuser */
  for(const sd of[-1,1]){
    const tip=new THREE.Mesh(new THREE.CylinderGeometry(.052,.058,.12,16,1,true),chrome);tip.rotation.x=Math.PI/2;tip.position.set(sd*.58,.3,zOf(.985));body.add(tip);
    const hole=new THREE.Mesh(new THREE.CircleGeometry(.05,14),matte);hole.position.set(sd*.58,.3,zOf(.985)+.062);body.add(hole);
  }
  /* door seams, handles, window trim, mirrors */
  for(const sd of[-1,1]){
    for(const t of[.405,.585,.745]){
      const w=wAt(t),line=new THREE.Mesh(new THREE.BoxGeometry(.012,.5,.012),matte);
      line.position.set(sd*(w+.004),.62,zOf(t));body.add(line);
    }
    for(const t of[.5,.66]){
      const w=wAt(t),h=new THREE.Mesh(new THREE.CapsuleGeometry(.014,.17,3,8),chrome);h.rotation.x=Math.PI/2;h.position.set(sd*(w+.006),.84,zOf(t));body.add(h);
    }
    const pts=[];for(let k=0;k<=24;k++){const t=.486+k/24*(.705-.486);const P=section(t);pts.push(new THREE.Vector3(sd*(P[7][0]+.003),P[7][1]+.004,zOf(t)))}
    body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.009,6),chrome));
    const mt=.405,P=section(mt);
    const mir=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),paintMat);mir.scale.set(.15,.1,.07);mir.position.set(sd*(P[7][0]+.15),P[7][1]+.1,zOf(mt)+.05);body.add(mir);
    const stalk=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.03),matte);stalk.position.set(sd*(P[7][0]+.06),P[7][1]+.06,zOf(mt)+.07);body.add(stalk);
    /* lime signature accent along the sill */
    const sill=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,2.6),limeM);sill.position.set(sd*(widthAt(.5)+.002),YB+.07,0);body.add(sill);
  }
  /* wheel arches: dark liner + painted lip so the wheels sit in real openings */
  const archW=widthAt(.5);
  for(const sd of[-1,1])for(const az of[-AX,AX]){
    const liner=new THREE.Mesh(new THREE.CircleGeometry(.5,40,-.33,Math.PI+.66),matte);
    liner.position.set(sd*(archW+.008),R,az);liner.rotation.y=sd*Math.PI/2;body.add(liner);
    const lg=new THREE.TorusGeometry(.505,.02,8,40,Math.PI+.66);lg.rotateZ(-.33);
    const lip=new THREE.Mesh(lg,paintMat);lip.position.set(sd*(archW+.012),R,az);lip.rotation.y=sd*Math.PI/2;body.add(lip);
  }

  /* interior */
  const leather=new THREE.MeshStandardMaterial({color:0x14181a,roughness:.7,metalness:.1});
  const cream=new THREE.MeshStandardMaterial({color:0x6a5a46,roughness:.7});
  const dash=new THREE.Mesh(new THREE.BoxGeometry(1.6,.16,.4),leather);dash.position.set(0,.80,-.5);dash.rotation.x=-.1;body.add(dash);
  const dashStrip=new THREE.Mesh(new THREE.BoxGeometry(1.6,.012,.012),limeM);dashStrip.position.set(0,.89,-.3);body.add(dashStrip);
  const tunnel=new THREE.Mesh(new THREE.BoxGeometry(.28,.2,1.7),leather);tunnel.position.set(0,.5,.1);body.add(tunnel);
  const floor=new THREE.Mesh(new THREE.BoxGeometry(1.7,.06,3),matte);floor.position.set(0,.42,.05);body.add(floor);
  for(const sd of[-1,1]){
    const cushion=new THREE.Mesh(new THREE.BoxGeometry(.52,.14,.56),sd<0?cream:leather);cushion.position.set(sd*.42,.58,.25);body.add(cushion);
    const back=new THREE.Mesh(new THREE.BoxGeometry(.5,.62,.12),sd<0?cream:leather);back.position.set(sd*.42,.88,.5);back.rotation.x=.18;body.add(back);
    const head=new THREE.Mesh(new THREE.BoxGeometry(.28,.18,.1),leather);head.position.set(sd*.42,1.22,.55);body.add(head);
  }
  const rb=new THREE.Mesh(new THREE.BoxGeometry(1.6,.14,.56),leather);rb.position.set(0,.55,.86);body.add(rb);
  const rbk=new THREE.Mesh(new THREE.BoxGeometry(1.5,.5,.12),leather);rbk.position.set(0,.8,1.1);rbk.rotation.x=.22;body.add(rbk);
  const wheelRim=new THREE.Mesh(new THREE.TorusGeometry(.17,.016,8,28),gun);
  wheelRim.position.set(-.42,.96,-.3);wheelRim.rotation.x=1.15;body.add(wheelRim);
  const column=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.3,8),matte);column.position.set(-.42,.9,-.38);column.rotation.x=1.15;body.add(column);

  /* ---- wheels ---- */
  const wheels=[],steer=[];
  const tireGeo=new THREE.LatheGeometry([[.25,-.125],[.33,-.13],[.365,-.1],[.38,-.05],[.38,.05],[.365,.1],[.33,.13],[.25,.125]].map(p=>new THREE.Vector2(p[0],p[1])),36);
  tireGeo.rotateZ(-Math.PI/2);
  const barrel=new THREE.CylinderGeometry(.262,.262,.24,32,1,true);barrel.rotateZ(-Math.PI/2);
  const face=new THREE.CylinderGeometry(.262,.262,.02,32);face.rotateZ(-Math.PI/2);
  const discGeo=new THREE.CylinderGeometry(.215,.215,.025,32);discGeo.rotateZ(-Math.PI/2);
  const spokeGeo=new THREE.BoxGeometry(.03,.215,.05);
  const capGeo=new THREE.CylinderGeometry(.06,.06,.03,20);capGeo.rotateZ(-Math.PI/2);
  const caliperGeo=new THREE.BoxGeometry(.05,.11,.16);
  for(const sd of[-1,1])for(const az of[-AX,AX]){
    const pivot=new THREE.Group();pivot.position.set(sd*(archW-.05),R,az);group.add(pivot);
    const spin=new THREE.Group();pivot.add(spin);
    const dish=new THREE.Group();dish.rotation.y=sd<0?Math.PI:0;spin.add(dish);
    dish.add(new THREE.Mesh(tireGeo,rubber));
    dish.add(new THREE.Mesh(barrel,gun));
    const fc=new THREE.Mesh(face,gun);fc.position.x=.095;dish.add(fc);
    for(let i=0;i<10;i++){
      const sg=new THREE.Group();sg.rotation.x=i/10*Math.PI*2;
      const sp=new THREE.Mesh(spokeGeo,chrome);sp.position.set(.1,.14,0);sg.add(sp);dish.add(sg);
    }
    const cap=new THREE.Mesh(capGeo,limeM);cap.position.x=.108;dish.add(cap);
    const disc=new THREE.Mesh(discGeo,gun);disc.position.x=.03;dish.add(disc);
    const cal=new THREE.Mesh(caliperGeo,new THREE.MeshStandardMaterial({color:0xc8ff43,roughness:.4,metalness:.3,emissive:0x364d0e}));
    cal.position.set(sd*.06,.17,az<0?-.04:.04);pivot.add(cal);
    wheels.push({pivot,spin,sd});if(az<0)steer.push(pivot);
  }

  /* underglow */
  const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d');
  const gg=gx.createRadialGradient(64,64,4,64,64,64);gg.addColorStop(0,'rgba(200,255,67,.95)');gg.addColorStop(.5,'rgba(120,255,90,.35)');gg.addColorStop(1,'rgba(0,0,0,0)');gx.fillStyle=gg;gx.fillRect(0,0,128,128);
  const glowTex=new THREE.CanvasTexture(gc);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(3.2,6.6),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  glow.rotation.x=-Math.PI/2;glow.position.y=.04;group.add(glow);

  /* headlight beam */
  const beam=new THREE.SpotLight(0xdff6ff,0,46,.55,.7,1.4);beam.position.set(0,.8,-2.3);beam.target.position.set(0,.2,-14);if(!opts.noBeam){group.add(beam);group.add(beam.target)}

  let paintIdx=0;
  const api={
    group,body,wheels,steer,beam,env,paints:PAINTS,
    dims:{L,W:HW*2,R,AX},
    seat:{x:-.42,y:.62,z:.3},
    setPaint(i){paintIdx=((i%PAINTS.length)+PAINTS.length)%PAINTS.length;const p=PAINTS[paintIdx];paintMat.color.setHex(p.color);paintMat.metalness=p.metal;paintMat.roughness=p.rough;return p},
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
