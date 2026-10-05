import * as THREE from 'three';

/* ===================== SUPER TOWN · SCENERY UPGRADE =====================
   dress(ctx) adds a layer of detail on top of the base town: sidewalks + curbs, crosswalks, traffic lights,
   benches/bins/bollards/planters, bus stops, storefronts + shop signs + awnings, building crowns / neon fins /
   floor bands / rooftop gear, park paths + lanterns + blossom trees + flowers, fountain ripples, fireflies,
   sky lanterns and distant floating islands. Everything repeated is instanced (a handful of draw calls).
   It also returns the town's points of interest (POIs) for the NPC brain. */

export function dress(ctx){
  const {scene,B,ROADS,RW,ISL,U,limeM,redM,greenM,metalM,roofM,BMAT,glowTex,labelSprite,specials,parkCenters}=ctx;
  const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
  let sd=11;const R=()=>{sd=(sd*16807)%2147483647;return(sd-1)/2147483646}; // deterministic layout
  const pois=[];const poi=(type,x,z,extra={})=>{const p={type,x,z,...extra};pois.push(p);return p};
  const tickers=[];

  /* ---- instancing helper: collect matrices, flush into InstancedMeshes ---- */
  const batches=[];
  function batch(geo,mat){const b={geo,mat,m:[],col:null};batches.push(b);return b}
  const _o=new THREE.Object3D();
  function put(b,x,y,z,sx=1,sy=1,sz=1,ry=0,color=null){_o.position.set(x,y,z);_o.scale.set(sx,sy,sz);_o.rotation.set(0,ry,0);_o.updateMatrix();b.m.push(_o.matrix.clone());if(color){(b.col??=[]).push(color)}}
  function flush(){for(const b of batches){if(!b.m.length)continue;const im=new THREE.InstancedMesh(b.geo,b.mat,b.m.length);b.m.forEach((m,i)=>im.setMatrixAt(i,m));if(b.col){const c=new THREE.Color();b.col.forEach((h,i)=>{c.set(h);im.setColorAt(i,c)})}im.instanceMatrix.needsUpdate=true;scene.add(im)}}

  const box=new THREE.BoxGeometry(1,1,1),cyl=new THREE.CylinderGeometry(1,1,1,10),sph=new THREE.IcosahedronGeometry(1,1),cone=new THREE.ConeGeometry(1,1,8);
  const slabM=new THREE.MeshStandardMaterial({color:0x1b2c22,roughness:.7,metalness:.2});
  const curbM=new THREE.MeshBasicMaterial({color:new THREE.Color(.45,1.5,.35)});
  const zebraM=new THREE.MeshBasicMaterial({color:new THREE.Color(1.1,1.5,1.0)});
  const woodM=new THREE.MeshStandardMaterial({color:0x3a2a1c,roughness:.8});
  const binM=new THREE.MeshStandardMaterial({color:0x22362b,roughness:.5,metalness:.6});
  const shrubM=new THREE.MeshStandardMaterial({color:0x2c9a3a,emissive:0x15602a,emissiveIntensity:.8,roughness:.8});
  const warmM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,1.9,.6)});
  const cyanM=new THREE.MeshBasicMaterial({color:new THREE.Color(.4,1.9,2.4)});
  const pinkM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,.6,1.6)});
  const bandM=new THREE.MeshBasicMaterial({color:new THREE.Color(.3,1.0,.28)});
  const finM=[limeM,redM,cyanM];

  /* ---- sidewalks + glowing curbs (segmented so they never cover the cross streets) ---- */
  {const sw=batch(box,slabM),cb=batch(box,curbM),L=100,SWD=2.2,off=RW/2+SWD/2;
   for(const c of ROADS){
     const cuts=[-L];for(const c2 of ROADS){cuts.push(c2-RW/2,c2+RW/2)}cuts.push(L);
     for(let i=0;i<cuts.length;i+=2){const a=cuts[i],b2=cuts[i+1],len=b2-a,mid=(a+b2)/2;if(len<1)continue;
       for(const s of[-1,1]){
         put(sw,mid,.09,c+s*off,len,.18,SWD);put(sw,c+s*off,.09,mid,SWD,.18,len);
         put(cb,mid,.19,c+s*(RW/2+.04),len,.04,.08);put(cb,c+s*(RW/2+.04),.19,mid,.08,.04,len);
       }}}
  }

  /* ---- crosswalks (skip the roundabout) + traffic lights ---- */
  const lights=[];
  {const zb=batch(box,zebraM),pole=batch(cyl,metalM);
   for(const cx of ROADS)for(const cz of ROADS){if(!cx&&!cz)continue;
     for(const [dx,dz] of[[1,0],[-1,0],[0,1],[0,-1]]){
       const d=RW/2+1.6;for(let k=-3;k<=3;k++){const px=cx+dx*d+(dz?k*1.15:0),pz=cz+dz*d+(dx?k*1.15:0);put(zb,px,.075,pz,dx?.9:.7,.02,dz?.9:.7)}}
     for(const [sx,sz] of[[1,1],[1,-1],[-1,1],[-1,-1]]){const px=cx+sx*(RW/2+.9),pz=cz+sz*(RW/2+.9);put(pole,px,2.1,pz,.07,4.2,.07);
       const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0x66ff66,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));sp.scale.set(1.5,1.5,1);sp.position.set(px,4.35,pz);scene.add(sp);
       lights.push({sp,ns:(sx*sz>0)})}}
  }
  let lightPhase=-1;
  tickers.push((dt,t)=>{const ph=Math.floor(t/7)%4; // 0 NS green,1 NS amber,2 EW green,3 EW amber
    if(ph===lightPhase)return;lightPhase=ph;for(const l of lights){const green=(l.ns?ph===0:ph===2),amber=(l.ns?ph===1:ph===3);l.sp.material.color.set(green?0x55ff77:amber?0xffc83d:0xff4d4f)}});

  /* ---- street furniture along the sidewalks (benches are NPC seats) ---- */
  {const seat=batch(box,woodM),back=batch(box,woodM),leg=batch(box,metalM),bins=batch(cyl,binM),bol=batch(cyl,metalM),bolL=batch(sph,warmM),pl=batch(box,binM),sh=batch(sph,shrubM),lampT=batch(sph,warmM);
   const off=RW/2+1.1;
   const bench=(x,z,face)=>{ // face = direction the sitter looks (radians, 0 = +x)
     const fx=Math.cos(face),fz=Math.sin(face),ry=-face+Math.PI/2;
     put(seat,x,.5,z,1.9,.12,.6,ry);put(back,x-fx*.28,.85,z-fz*.28,1.9,.5,.1,ry);put(leg,x+Math.sin(face)*.8,.25,z-Math.cos(face)*.8,.1,.5,.45,ry);put(leg,x-Math.sin(face)*.8,.25,z+Math.cos(face)*.8,.1,.5,.45,ry);
     poi('bench',x,z,{face,taken:null})};
   for(const c of ROADS)for(const s of[-1,1]){
     for(let t=-86;t<=86;t+=22+Math.floor(R()*10)){
       if(ROADS.some(r=>Math.abs(t-r)<RW/2+4))continue; // keep crossings clear
       const kind=R();
       // horizontal street (z=c), sidewalk at z=c+s*off, bench faces the road
       const hx=t+R()*3,hz=c+s*(off+.2);if(!inBlock(hx,hz)){ if(kind<.45)bench(hx,hz,s>0?-Math.PI/2:Math.PI/2);else if(kind<.7){put(bins,hx,.45,hz,.3,.9,.3)}else{put(pl,hx,.3,hz,1.6,.6,.8);put(sh,hx,.85,hz,.7,.5,.5)}}
       const vx=c+s*(off+.2),vz=t+R()*3;if(!inBlock(vx,vz)){ if(kind<.4)bench(vx,vz,s>0?Math.PI:0);else if(kind<.65){put(bins,vx,.45,vz,.3,.9,.3)}else{put(pl,vx,.3,vz,.8,.6,1.6);put(sh,vx,.85,vz,.5,.5,.7)}}
     }
     // bollards with warm caps at every crossing
     for(const c2 of ROADS){const bx=c2+(RW/2+.2),bz=c+s*(RW/2+.35);put(bol,bx,.4,bz,.1,.8,.1);put(bolL,bx,.85,bz,.12,.12,.12);put(bol,c+s*(RW/2+.35),.4,c2+(RW/2+.2),.1,.8,.1);put(bolL,c+s*(RW/2+.35),.85,c2+(RW/2+.2),.12,.12,.12)}
   }
   // bus stops: shelter + glowing ad panel (NPC waiting spots)
   for(const [x,z,ry] of[[-12,-RW/2-1.1-.4,0],[14,RW/2+1.1+.4,Math.PI],[-RW/2-1.1-.4,22,Math.PI/2],[RW/2+1.1+.4,-24,-Math.PI/2]]){
     const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;
     const roof=new THREE.Mesh(box,metalM);roof.scale.set(3.2,.12,1.4);roof.position.y=2.4;g.add(roof);
     for(const sx of[-1.5,1.5]){const p=new THREE.Mesh(box,metalM);p.scale.set(.08,2.4,.08);p.position.set(sx,1.2,.55);g.add(p)}
     const ad=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.7),new THREE.MeshBasicMaterial({color:new THREE.Color(.7,2.1,1.1)}));ad.position.set(0,1.35,.66);g.add(ad);
     const bn=new THREE.Mesh(box,woodM);bn.scale.set(2.4,.1,.5);bn.position.set(0,.5,.3);g.add(bn);scene.add(g);poi('stop',x+Math.sin(ry)*.2,z-Math.cos(ry)*(-1.1),{face:-ry+Math.PI/2})}
   function inBlock(x,z){for(const b of B)if(Math.abs(x-b.x)<b.hw+1&&Math.abs(z-b.z)<b.hd+1)return true;return false}
  }

  /* ---- buildings: storefronts, crowns, neon fins, floor bands, rooftop gear, signs, awnings ---- */
  const fin=[batch(box,limeM),batch(box,redM),batch(box,cyanM)],band=batch(box,bandM),ac=batch(box,metalM),tank=batch(cyl,woodM),crownB=batch(box,roofM);
  function shopTex(rep,seed){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.fillStyle='#07100b';x.fillRect(0,0,256,64);
    for(let i=0;i<8;i++){const hue=pick([45,95,170,12]);x.fillStyle=`hsl(${hue},85%,${58+((i*7+seed)%3)*8}%)`;x.globalAlpha=.8;x.fillRect(i*32+4,10,24,44);x.globalAlpha=1;x.fillStyle='rgba(0,0,0,.35)';x.fillRect(i*32+15,10,2,44)}
    const t=new THREE.CanvasTexture(x.canvas||c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.repeat.set(rep,1);return t}
  const SHOPS=['NOODLE BAR','PIXEL CAFE','$SUPER MART','SKY GYM','GLASS BANK','MOCHI SHOP','VINYL ROOM','FLYER GEAR','BOBA WORLD','COIN LAUNDRY','NEON BARBER','ARCADE SNACKS'];let shopI=0;
  const awnM=[new THREE.MeshStandardMaterial({color:0x2a9a3a,emissive:0x1a6a28,emissiveIntensity:.9}),new THREE.MeshStandardMaterial({color:0xc83a44,emissive:0x8a1a28,emissiveIntensity:.9}),new THREE.MeshStandardMaterial({color:0xd6a02a,emissive:0x8a6414,emissiveIntensity:.9})];
  const signs=[];
  for(const b of B){
    const {x,z,hw,hd,h}=b,w=hw*2,d=hd*2;
    // storefront plinth with lit windows (ground floor)
    const sf=1.1; // plinth only on the long faces so it never fights the base geometry
    for(const [fw,fd,rx,rz] of[[w+.3,.16,0,hd+.08],[w+.3,.16,0,-hd-.08],[.16,d+.3,hw+.08,0],[.16,d+.3,-hw-.08,0]]){
      const along=fw>fd?fw:fd,m=new THREE.MeshStandardMaterial({map:shopTex(Math.max(1,Math.round(along/8)),shopI++),emissiveMap:null,emissive:0xffffff,emissiveIntensity:.0,roughness:.4,metalness:.3});m.emissiveMap=m.map;m.emissiveIntensity=.75;
      const p=new THREE.Mesh(new THREE.BoxGeometry(fw,3.2,fd),m);p.position.set(x+rx,1.6,z+rz);scene.add(p)}
    if(h>12){ // vertical neon fins on the four corners
      let k=(Math.abs(Math.floor(x+z))%3);for(const [sx,sz] of[[1,1],[1,-1],[-1,1],[-1,-1]]){put(fin[k%3],x+sx*(hw+.12),h*.5,z+sz*(hd+.12),.22,h*.94,.22);k++}
      for(let y=9;y<h-3;y+=9.5){for(const sz of[-1,1])put(band,x,y,z+sz*(hd+.07),w+.25,.12,.12);for(const sx of[-1,1])put(band,x+sx*(hw+.07),y,z,.12,.12,d+.25)}}
    if(h>16){ // stepped crown + glowing cap
      put(crownB,x,h+.35+2.2,z,w*.62,4.4,d*.62);const cw=w*.62+.2,cd=d*.62+.2,ek=fin[(Math.abs(Math.floor(x))%2)?0:2];
      for(const sz of[-1,1])put(ek,x,h+.35+4.45,z+sz*cd/2,cw,.12,.12);for(const sx of[-1,1])put(ek,x+sx*cw/2,h+.35+4.45,z,.12,.12,cd)}
    // rooftop gear
    const nAC=2+Math.floor(R()*3);for(let i=0;i<nAC;i++){put(ac,x+(R()-.5)*(w-4),h+.35+.55,z+(R()-.5)*(d-4),1.8,1.1,1.4,R()*3)}
    if(R()<.7){const tx=x+(R()-.5)*(w-5),tz=z+(R()-.5)*(d-5);put(tank,tx,h+.35+1.3,tz,.9,2.2,.9);put(crownB,tx,h+.35+.2,tz,1.4,.4,1.4)}
    // shop door, sign and awning on the face that looks at the nearest street
    if(b.name===null||b.name==='exchange'){
      const dz=ROADS.reduce((a,c)=>Math.abs(z-c)<Math.abs(z-a)?c:a,ROADS[0]),dx=ROADS.reduce((a,c)=>Math.abs(x-c)<Math.abs(x-a)?c:a,ROADS[0]);
      const gz=Math.abs(z-dz)-hd,gx=Math.abs(x-dx)-hw,alongX=gz<=gx;
      const sgn=alongX?Math.sign(dz-z||1):Math.sign(dx-x||1);
      const fx=alongX?x:x+sgn*(hw+.15),fz=alongX?z+sgn*(hd+.15):z,ry=alongX?(sgn>0?0:Math.PI):(sgn>0?Math.PI/2:-Math.PI/2);
      const aw=new THREE.Mesh(box,awnM[Math.abs(Math.floor(x*3+z))%3]);aw.scale.set(5.5,.14,1.9);aw.rotation.set(0,ry,.0);aw.position.set(fx+(alongX?0:sgn*.95),3.5,fz+(alongX?sgn*.95:0));if(!alongX)aw.rotation.y=Math.PI/2;scene.add(aw);
      const name=b.name==='exchange'?null:SHOPS[shopI++%SHOPS.length];
      if(name){const sp=labelSprite(name,{w:5.4,size:56,color:'#fff3cf',glow:pick(['#ffd15c','#7bff3a','#4dd2ff','#ff6ec7']),plate:true});sp.position.set(fx+(alongX?0:sgn*.4),4.6,fz+(alongX?sgn*.4:0));scene.add(sp);signs.push(sp)}
      const door=poi(b.name==='exchange'?'exchange':'shop',fx+(alongX?0:sgn*2.6),fz+(alongX?sgn*2.6:0),{name:name||'EXCHANGE',bx:x,bz:z,enter:true});
    }
  }
  // road-facing specials become enterable POIs for the NPCs
  if(specials){for(const k of['hq','arcade','dock','exchange']){const s=specials[k];if(s&&!pois.some(p=>p.type===k))poi(k,s.x,s.z,{name:k.toUpperCase(),enter:k!=='dock'})}}
  tickers.push((dt,t)=>{const dc=ctx.camera.position;for(const s of signs){const q=Math.hypot(s.position.x-dc.x,s.position.z-dc.z);s.visible=q<60}
    for(let i=0;i<BMAT.length;i++)BMAT[i].emissiveIntensity=.85+.1*Math.sin(t*.6+i*1.7)});

  /* ---- plaza: fountain ripples, bench ring, statue/fountain POIs ---- */
  {const rip=[0,1,2].map(i=>{const m=new THREE.Mesh(new THREE.TorusGeometry(1,.05,6,48),new THREE.MeshBasicMaterial({color:new THREE.Color(.4,1.8,2.2),transparent:true,opacity:.6,depthWrite:false}));m.rotation.x=Math.PI/2;m.position.y=.54;scene.add(m);return m});
   tickers.push((dt,t)=>{rip.forEach((m,i)=>{const k=((t*.35+i/3)%1);m.scale.setScalar(1.2+k*5.2);m.material.opacity=.7*(1-k)})});
   const sd2=batch(box,woodM),sl=batch(box,woodM);
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2,r=11.3,x=Math.cos(a)*r,z=Math.sin(a)*r;put(sd2,x,.5,z,1.9,.12,.6,-a+Math.PI/2);put(sl,x+Math.cos(a)*.28,.85,z+Math.sin(a)*.28,1.9,.5,.1,-a+Math.PI/2);poi('bench',x,z,{face:a+Math.PI,taken:null})}
   for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=12.6;poi('fountain',Math.cos(a)*r,Math.sin(a)*r,{face:a+Math.PI})}
   poi('statue',0,13,{face:-Math.PI/2});
  }

  /* ---- parks: paths, lanterns, blossom trees, flowers, pond rim spots ---- */
  {const lant=batch(sph,warmM),post=batch(cyl,metalM),blos=[batch(sph,pinkM),batch(sph,cyanM)],stem=batch(cyl,woodM),flw=[batch(sph,pinkM),batch(sph,warmM),batch(sph,cyanM)],path=batch(box,slabM);
   const centers=parkCenters||[[-54,-54],[54,-54],[-54,54],[54,54]];
   for(const [cx,cz] of centers){
     // stepping-stone ring + 4 spokes to the pond
     for(let i=0;i<28;i++){const a=i/28*Math.PI*2;put(path,cx+Math.cos(a)*10.5,.07,cz+Math.sin(a)*10.5,1.5,.1,1.0,-a+Math.PI/2)}
     for(let s=0;s<4;s++){const a=s*Math.PI/2+.4;for(let k=0;k<6;k++){const r=7+k*2.4;put(path,cx+Math.cos(a)*r,.07,cz+Math.sin(a)*r,1.2,.1,1.2,-a)}}
     for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2,x=cx+Math.cos(a)*12.2,z=cz+Math.sin(a)*12.2;put(post,x,1.4,z,.06,2.8,.06);put(lant,x,3,z,.32,.32,.32)}
     for(let i=0;i<9;i++){const a=R()*6.28,r=14+R()*8,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,s=.9+R()*.7;put(stem,x,1.1*s,z,.16,2.2*s,.16);put(blos[i%2],x,2.8*s,z,1.5*s,1.2*s,1.5*s)}
     for(let i=0;i<46;i++){const a=R()*6.28,r=7.2+R()*3.6;put(flw[i%3],cx+Math.cos(a)*r,.18,cz+Math.sin(a)*r,.2,.2,.2)}
     for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.5;poi('pond',cx+Math.cos(a)*8.2,cz+Math.sin(a)*8.2,{face:a+Math.PI});}
     poi('park',cx+rnd(-6,6),cz+rnd(-6,6),{});
     for(let i=0;i<2;i++){const a=i*Math.PI+.9;const x=cx+Math.cos(a)*10.5,z=cz+Math.sin(a)*10.5;const sd3=batch(box,woodM);put(sd3,x,.5,z,1.9,.12,.6,-a+Math.PI/2);poi('bench',x,z,{face:a+Math.PI,taken:null})}
   }
  }

  /* ---- ambience: fireflies, sky lanterns ---- */
  function motes({n,rMax,hMin,hMax,size,kind,color}){
    const pos=new Float32Array(n*3),sd4=new Float32Array(n);for(let i=0;i<n;i++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*rMax;pos.set([Math.cos(a)*r,hMin+Math.random()*(hMax-hMin),Math.sin(a)*r],i*3);sd4[i]=Math.random()*100}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSeed',new THREE.BufferAttribute(sd4,1));
    const mat=new THREE.ShaderMaterial({uniforms:{time:U.time,size:{value:size},kind:{value:kind},col:{value:new THREE.Color(color)},hMin:{value:hMin},hMax:{value:hMax}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute float aSeed;uniform float time,size,kind,hMin,hMax;varying float vA;void main(){vec3 p=position;float t=time+aSeed;
        if(kind>.5){p.y=hMin+mod(position.y-hMin+time*(1.2+fract(aSeed)*.9),hMax-hMin);p.x+=sin(t*.4+aSeed)*3.;p.z+=cos(t*.33+aSeed)*3.;vA=smoothstep(0.,6.,p.y-hMin)*(1.-smoothstep(hMax-hMin-10.,hMax-hMin,p.y-hMin));}
        else{p.x+=sin(t*.9)*1.6+sin(t*2.1)*.4;p.z+=cos(t*.8)*1.6;p.y+=sin(t*1.3)*.7;vA=.4+.6*sin(t*3.+aSeed*7.);}
        vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=size*(260./-mv.z);}`,
      fragmentShader:`uniform vec3 col;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d)*vA;gl_FragColor=vec4(col*1.6,a);}`});
    const p=new THREE.Points(g,mat);p.frustumCulled=false;scene.add(p);return p}
  motes({n:260,rMax:100,hMin:.6,hMax:4.5,size:.35,kind:0,color:0xb6ff5a});
  motes({n:90,rMax:105,hMin:2,hMax:95,size:1.1,kind:1,color:0xffb347});

  /* ---- distant floating islands: depth and skyline for the void ---- */
  const isles=[];
  for(let i=0;i<9;i++){
    const g=new THREE.Group(),a=i/9*Math.PI*2+R()*.5,r=200+R()*190,s=.7+R()*1.1;
    const rock=new THREE.Mesh(new THREE.ConeGeometry(14,26,7,1),new THREE.MeshStandardMaterial({color:0x0f1b14,roughness:.95,flatShading:true}));rock.rotation.x=Math.PI;rock.position.y=-13;g.add(rock);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(14,14.5,1.2,24),new THREE.MeshStandardMaterial({color:0x143222,roughness:.6,metalness:.3,emissive:0x0c2a16,emissiveIntensity:.6}));g.add(top);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(14.2,.25,6,36),i%2?redM:limeM);rim.rotation.x=Math.PI/2;rim.position.y=.6;g.add(rim);
    const nT=2+Math.floor(R()*4);for(let k=0;k<nT;k++){const th=4+R()*14,tw=2.5+R()*2.5,aa=R()*6.28,rr=R()*8;const t=new THREE.Mesh(new THREE.BoxGeometry(tw,th,tw),BMAT[k%4]);t.position.set(Math.cos(aa)*rr,.6+th/2,Math.sin(aa)*rr);g.add(t)}
    for(let k=0;k<5;k++){const aa=R()*6.28,rr=4+R()*8;const tr=new THREE.Mesh(new THREE.ConeGeometry(1.1,3,7),shrubM);tr.position.set(Math.cos(aa)*rr,2.1,Math.sin(aa)*rr);g.add(tr)}
    g.scale.setScalar(s);g.position.set(Math.cos(a)*r,-10+R()*90,Math.sin(a)*r);g.rotation.y=R()*6;scene.add(g);isles.push({g,y:g.position.y,ph:R()*6,sp:.15+R()*.2})}
  tickers.push((dt,t)=>{for(const o of isles){o.g.position.y=o.y+Math.sin(t*o.sp+o.ph)*3.2;o.g.rotation.y+=dt*.01}});

  flush();
  return {pois,tick(dt,t){for(const f of tickers)f(dt,t)}};
}
