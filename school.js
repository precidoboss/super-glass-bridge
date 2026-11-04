/* SUPER SCHOOL: a three-storey building (floor slabs and window bands, like the Super Home), with a walk-in
   ground floor: an entrance hall, reception, a trophy cabinet, a library corner and a notice board.
   The upper floors are visible from outside through the window bands. Teachers, staff and students work and
   learn in the building. Real walls, a doorway, walls that fade when you are inside. */
import {kit,makeWorkers,dressVenue} from './design.js';

export function makeSchool({THREE,scene,labelSprite,B,cx,cz,getFront=()=>null,title='SUPER SCHOOL'}){
  const W=32,D=24,FH=5.4,FLOORS=3,H=FH*FLOORS,T=.5,DW=6;
  const k=kit(THREE);
  const root=new THREE.Group();root.position.set(cx,0,cz);scene.add(root);
  const col=(lx,lz,w,d,h)=>B.push({x:cx+lx,z:cz+lz,hw:w/2,hd:d/2,h,name:null});
  const pts=[];const pt=(lx,lz,label,msg)=>pts.push({x:cx+lx,z:cz+lz,label,msg});

  /* ---------- materials and textures ---------- */
  const brick=k.tex(256,256,(g,w,h)=>{g.fillStyle='#8a3d2b';g.fillRect(0,0,w,h);for(let r=0;r<16;r++)for(let c=0;c<8;c++){g.fillStyle=`hsl(14,${40+((r*c)%7)}%,${30+((r+c)%5)*2}%)`;g.fillRect(c*32+(r%2?16:0),r*16,30,14)}
    g.strokeStyle='#c9b7a5';g.lineWidth=2;for(let r=0;r<=16;r++){g.beginPath();g.moveTo(0,r*16);g.lineTo(w,r*16);g.stroke()}});
  brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(W/6,1.6);
  const brickM=new THREE.MeshStandardMaterial({map:brick,roughness:.85});
  const winTex=k.tex(256,128,(g,w,h)=>{g.fillStyle='#d9d4c7';g.fillRect(0,0,w,h);for(let i=0;i<4;i++){const x=10+i*62;const gr=g.createLinearGradient(0,20,0,108);gr.addColorStop(0,'#9fd8e8');gr.addColorStop(1,'#2a5a6a');g.fillStyle=gr;g.fillRect(x,18,50,92);g.strokeStyle='#ffffff';g.lineWidth=5;g.strokeRect(x,18,50,92);g.beginPath();g.moveTo(x+25,18);g.lineTo(x+25,110);g.stroke()}});
  winTex.wrapS=winTex.wrapT=THREE.RepeatWrapping;winTex.repeat.set(W/8,1);
  const windowM=new THREE.MeshStandardMaterial({map:winTex,roughness:.3,metalness:.2});
  const slabM=k.mat(0xb9b2a4,{roughness:.8});
  const trim=k.mat(0x3d2c22,{roughness:.6});
  const roofM=k.mat(0x2a2624,{roughness:.7,metalness:.2,transparent:true});
  const glassM=k.mat(0x9fd8e8,{transparent:true,opacity:.22,roughness:.05,metalness:.3,depthWrite:false});
  const floorT=k.tex(256,256,(g,w,h)=>{for(let j=0;j<8;j++)for(let i=0;i<8;i++){g.fillStyle=(i+j)%2?'#e8e2d0':'#d6cfbb';g.fillRect(i*32,j*32,32,32)}});
  floorT.wrapS=floorT.wrapT=THREE.RepeatWrapping;floorT.repeat.set(W/8,D/8);
  const floorM=new THREE.MeshStandardMaterial({map:floorT,roughness:.4});
  const wallInM=k.mat(0xe8e2d0,{roughness:.6,transparent:true});
  const bright=k.basic(0xffe9b0,1.6),red=k.basic(0xff4d4f,1.4),greenN=k.basic(0x7bff3a,1.8);

  /* ---------- the three storeys: slabs, window bands and brick walls ---------- */
  let wallO=.97,inside=false;
  k.box(root,W,.4,D,slabM,0,0,0);                             // ground slab
  const slabs=[];
  for(let f=1;f<=FLOORS;f++){slabs.push(k.box(root,W+.6,.35,D+.6,slabM,0,f*FH-.35,0))}
  const outer=[];
  for(let f=0;f<FLOORS;f++){
    const y=f*FH;
    // brick walls for each storey, with a window band on each face
    const band=(w,d,x,z)=>{const m=k.box(root,w,FH-.4,d,brickM,x,y+.4,z);outer.push(m);return m};
    if(f===0){
      band(W,T,0,D/2);band(T,D,-W/2,0);band(T,D,W/2,0);
      const side=(W-DW)/2,cxs=(W+DW)/4;
      band(side,T,-cxs,-D/2);band(side,T,cxs,-D/2);
      col(0,D/2,W,T,FH);col(-W/2,0,T,D,FH);col(W/2,0,T,D,FH);col(-cxs,-D/2,side,T,FH);col(cxs,-D/2,side,T,FH);
    }else{
      band(W,T,0,D/2);band(T,D,-W/2,0);band(T,D,W/2,0);band(W,T,0,-D/2);
    }
    // window band across each face, above the entrance on the ground floor
    const winFace=(w,x,z,ry)=>{const p=k.plane(root,w-1,FH-2,windowM,x,y+FH/2+.2,z,ry);p.position.z+=0;return p};
    winFace(W-2,0,D/2+.06,Math.PI);winFace(D-2,W/2+.06,0,-Math.PI/2);winFace(D-2,-W/2-.06,0,Math.PI/2);
    if(f>0)winFace(W-2,0,-D/2-.06,0);
  }
  // front windows on the ground floor either side of the doorway (glass)
  const side=(W-DW)/2,cxs=(W+DW)/4;
  k.box(root,side-1,FH-2,.1,glassM,-cxs,1.8,-D/2-.05);k.box(root,side-1,FH-2,.1,glassM,cxs,1.8,-D/2-.05);

  /* ---------- roof, clock tower, entrance canopy and sign ---------- */
  const roof=k.box(root,W+1,.5,D+1,roofM,0,H,0);
  k.box(root,8,3,8,brickM,0,H+.5,-3);
  const clockTex=k.tex(256,256,(g,w,h)=>{g.fillStyle='#f4f1e8';g.beginPath();g.arc(128,128,120,0,6.283);g.fill();g.strokeStyle='#1e3a66';g.lineWidth=12;g.stroke();g.fillStyle='#1e3a66';for(let i=0;i<12;i++){const a=i/12*6.283;g.fillRect(128+Math.cos(a)*100-5,128+Math.sin(a)*100-5,10,10)}
    g.strokeStyle='#1e3a66';g.lineWidth=10;g.beginPath();g.moveTo(128,128);g.lineTo(128,60);g.moveTo(128,128);g.lineTo(180,128);g.stroke()});
  for(const sz of[-1,1])k.plane(root,3.2,3.2,new THREE.MeshBasicMaterial({map:clockTex}),0,H+3.6,-3+sz*4.02,sz>0?0:Math.PI);
  k.cyl(root,.12,.16,6,k.mat(0xc8d0d8,{metalness:.8}),0,H+3.5,-3);
  const canopy=k.box(root,DW+4,.4,3,trim,0,FH-.4,-D/2-1.5);
  for(const x of[-DW/2-1.8,DW/2+1.8])k.cyl(root,.12,.12,FH-.4,k.mat(0xd9d4c7),x,0,-D/2-2.7);
  k.plane(root,DW+3,1.4,new THREE.MeshBasicMaterial({map:k.sign('SUPER SCHOOL',{w:1024,h:256,bg:'#1e3a66',fg:'#f4f1e8',border:'#f2c84b',size:130})}),0,FH+.4,-D/2-.2,0);
  k.box(root,.12,.12,6,bright,0,FH+.2,-D/2-.1);
  // flag and playground outside
  k.cyl(root,.07,.09,9,k.mat(0xcfd8dc,{metalness:.6}),W/2-2.5,0,-D/2-3);
  k.plane(root,2.2,1.4,new THREE.MeshBasicMaterial({map:k.sign('',{w:256,h:160,bg:'#1e4fa3',fg:'#fff',border:'#fff',size:10})}),W/2-1.3,8.2,-D/2-3,0);
  const play=(x,z)=>{k.box(root,1.4,.2,.8,k.mat(0x3a7a3a),x,0,z);k.cyl(root,.05,.05,2.2,steelish(),x-.6,0,z);k.cyl(root,.05,.05,2.2,steelish(),x+.6,0,z)};
  function steelish(){return k.mat(0xb9c2c6,{metalness:.8,roughness:.3})}
  play(-6,D/2+4);play(2,D/2+4);
  k.box(root,8,.1,4,k.mat(0x4a8a3a),-2,0,D/2+8);
  for(let i=0;i<4;i++)k.box(root,.2,.6,.2,steelish(),W/2+3+i*.8,0,-D/2-4);

  dressVenue({THREE,root,k,W,D,H,accent:0xf2c84b,sec:0x7bff3a});
  /* ---------- ground floor interior ---------- */
  k.box(root,W-1.2,.04,D-1.2,floorM,0,.42,0);
  // trophy cabinet, library shelves, notice board and reception desk
  k.box(root,6,2.4,.8,glassM,-W/2+1.1,.4,-7);col(-W/2+1.1,-7,6,.8,2.4);
  for(let i=0;i<3;i++)k.box(root,5.4,.12,.7,k.mat(0x8a6a3c),-W/2+1.1,.9+i*.6,-7);
  k.box(root,8,1.1,1.4,k.mat(0x6b4a2b),3,.4,-6);col(3,-6,8,1.4,1.1);
  k.box(root,8.2,.1,1.6,k.mat(0xd6d0c0),3,1.5,-6);
  k.plane(root,6,2.2,new THREE.MeshBasicMaterial({map:k.sign('READ · LEARN · SHINE',{w:512,h:192,bg:'#f4f1e8',fg:'#1e3a66',border:'#1e3a66',size:50})}),W/2-.12,2.6,-2,-Math.PI/2);
  // library corner: shelves against the back-left wall
  for(let i=0;i<4;i++){k.box(root,.6,2.4,4,k.mat(0x8a6a3c),-W/2+.4,.4,8-i*0+ -2+i*0);col(-W/2+.4,6,.6,4,2.4)}
  // benches in the hall and the rubbish bin
  for(const x of[-6,-2]){k.box(root,2,.5,.7,k.mat(0x8a6a3c),x,.4,-D/2+4);col(x,-D/2+4,2,.7,.5)}
  k.cyl(root,.35,.3,.9,k.mat(0x2e7d4f),W/2-2,.4,D/2-3);
  for(let x=-W/2+4;x<W/2-2;x+=6)for(const z of[-3,3])k.box(root,1.6,.08,1.6,bright,x,FH-.25,z);
  pt(3,-4.6,'RECEPTION · ENROL YOUR CHILD',"Receptionist Jo: 'Enrolment is open. The principal will see you shortly.'");
  pt(-W/2+1.1,-7,'TROPHY CABINET',"Super School: 12 science fairs, 4 sports cups. Shine on!");
  pt(-W/2+1.4,5,'LIBRARY',"Quiet, please. Someone is reading about the Super Benz.");
  pt(-6,-D/2+4,'NOTICE BOARD',"Parents' evening on Friday. Playground fund: 300 CR to go.");
  pt(0,D/2-4,'PRINCIPAL\'S OFFICE',"Principal Ada: 'Come in. Your bodyguard may wait outside.'");

  // interior detail: chalkboard on the back wall, a class of desks and the school crest
  {
    k.plane(root,8,2.6,new THREE.MeshBasicMaterial({map:k.sign('SUPER SCHOOL · TODAY: TRY HARDER',{w:1024,h:320,bg:'#1f2a24',fg:'#f4f1e8',border:'#8a6a3c',size:76})}),-6,3.2,D/2-.25,Math.PI);
    for(let r=0;r<2;r++)for(let c=0;c<3;c++){
      const x=5+c*2.6,z=1+r*2.4;
      k.box(root,1.6,.08,1.1,k.mat(0x8a6a3c),x,.8,z);k.box(root,.08,.8,1.1,k.mat(0x3d2c22),x-.7,0,z);k.box(root,.08,.8,1.1,k.mat(0x3d2c22),x+.7,0,z);
    }
    k.plane(root,2.6,2.6,new THREE.MeshBasicMaterial({map:k.sign('SC',{w:256,h:256,bg:'#f2c84b',fg:'#1e3a66',border:'#1e3a66',size:140})}),-W/2+.14,3.6,-2,Math.PI/2);
  }
  /* ---------- workers ---------- */
  const workers=makeWorkers({THREE,root,labelSprite,getFront,defs:[
    {role:'RECEPTIONIST JO',variant:5,station:[3,-4.6],spd:0},
    {role:'PRINCIPAL ADA',variant:1,zone:[-4,4,D/2-6,D/2-3.5],spd:.5},
    {role:'TEACHER MIA',variant:6,zone:[-8,8,-6,6],spd:.8},
    {role:'JANITOR BEN',variant:4,zone:[-W/2+3,W/2-3,-D/2+3,D/2-3],spd:.6},
    {role:'STUDENT ZOE',variant:3,zone:[-10,10,-5,5],spd:1.1},
    {role:'STUDENT ELI',variant:7,zone:[-10,10,-5,5],spd:1.1}
  ]});

  function update(dt,P,t){
    inside=Math.abs(P.x-cx)<W/2-.2&&Math.abs(P.z-cz)<D/2-.2&&P.y<FH-.5;
    const tw=inside?.14:.97;wallO+=(tw-wallO)*Math.min(1,dt*5);
    for(const m of outer){m.material.transparent=true;m.material.opacity=wallO}
    for(const s of slabs)s.visible=!inside||P.y>FH;
    roof.visible=!inside||P.y>H;
    workers.update(dt,t);
  }
  return{
    W,D,H,FH,cx,cz,title,kind:'school',
    door:{x:cx,z:cz-D/2-3.6},
    lobby:{x:cx,z:cz-D/2+3},
    points:pts,
    staffCount:workers.count,
    get inside(){return inside},
    update
  };
}
