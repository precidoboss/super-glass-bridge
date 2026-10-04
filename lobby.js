import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

/* ===================== SUPER SHIP LOBBY =====================
   A chill deck on the Super Ship: panoramic view of the canyon outside, a hologram of the $SUPER chart + stats,
   community holograms, a rolling front/back hero hologram, and portals to every game. */

if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
const BASE=new URL('.',import.meta.url).href;
const PAIR='0x017c5608a8ab29ab23093726cf7c64e5ef88e191';
const DEX_URL='https://dexscreener.com/avalanche/'+PAIR;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=x=>x*x*(3-2*x);
const RAD=16,SH=2.5;

const CSS=`
.lb{position:fixed;inset:0;z-index:12;background:#030804;color:#eaf6ec;font-family:'Space Grotesk',system-ui,sans-serif;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.lb.lb-off{display:none}.lb *{box-sizing:border-box}
.lb-stage{position:absolute;inset:0}.lb-stage canvas{display:block;width:100%;height:100%}
.lb-top{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;padding:14px clamp(12px,3vw,34px);z-index:3;pointer-events:none;gap:10px}
.lb-brand{display:flex;align-items:center;gap:12px;padding:8px 16px 8px 8px;border-radius:18px;border:1px solid rgba(190,255,90,.16);background:linear-gradient(145deg,rgba(16,38,21,.8),rgba(5,12,7,.88));backdrop-filter:blur(14px);font-weight:700;letter-spacing:.2em;font-size:13px}
.lb-brand img{width:44px;height:44px;border-radius:12px;object-fit:cover}.lb-brand small{display:block;font:9px 'DM Mono',monospace;letter-spacing:.24em;color:#9bb7a0;margin-top:3px}
.lb-tick{padding:10px 16px;border-radius:999px;border:1px solid rgba(190,255,90,.2);background:rgba(7,17,10,.85);font:700 12px 'DM Mono',monospace;letter-spacing:.1em;backdrop-filter:blur(12px);white-space:nowrap;pointer-events:auto;cursor:pointer}
.lb-tick b{color:#d4ff3a}.lb-tick .up{color:#7bff3a}.lb-tick .dn{color:#ff6b6e}
.lb-tf{position:absolute;right:clamp(12px,3vw,34px);top:84px;display:flex;gap:6px;z-index:3;align-items:center}
.lb-tf button,.lb-tf a,.lb-bar button{font:700 10px 'Space Grotesk';letter-spacing:.16em;padding:10px 13px;border-radius:12px;border:1px solid rgba(185,255,90,.25);background:rgba(11,22,14,.85);color:#d6e9d9;cursor:pointer;backdrop-filter:blur(10px);text-decoration:none}
.lb-tf button.on{border-color:#d4ff3a;color:#d4ff3a;background:rgba(212,255,58,.1)}.lb-tf button:hover,.lb-tf a:hover,.lb-bar button:hover{border-color:#d4ff3a;color:#d4ff3a}
.lb-bar{position:absolute;right:clamp(12px,3vw,34px);bottom:16px;display:flex;gap:8px;z-index:4}
.lb-hint{position:absolute;left:clamp(12px,3vw,34px);bottom:22px;font:9px 'DM Mono',monospace;letter-spacing:.2em;color:#8aa690;z-index:2;pointer-events:none;line-height:1.9}
.lb-hint b{display:inline-block;padding:3px 7px;border-radius:6px;border:1px solid rgba(185,255,90,.25);background:#0e1d12;color:#eef9ea;margin:0 3px}
.lb-toast{position:absolute;left:50%;bottom:92px;transform:translateX(-50%);padding:10px 18px;border-radius:999px;background:rgba(7,17,10,.9);border:1px solid rgba(190,255,90,.3);font:700 11px 'Space Grotesk';letter-spacing:.16em;opacity:0;transition:opacity .25s;pointer-events:none;z-index:5;white-space:nowrap;color:#d4ff3a}
.lb-toast.on{opacity:1}
.lb-joy{position:absolute;left:26px;bottom:26px;width:132px;height:132px;border-radius:50%;border:1px solid rgba(190,255,90,.28);background:radial-gradient(rgba(125,220,31,.1),rgba(5,12,7,.4));display:none;z-index:4;touch-action:none}
.lb-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px;border-radius:50%;background:linear-gradient(#e6ff58,#7ddc1f);box-shadow:0 0 24px rgba(125,220,31,.6)}
@media(pointer:coarse){.lb-joy{display:block}.lb-hint{display:none}.lb-bar{bottom:auto;top:84px;right:auto;left:12px}.lb-tf{top:auto;bottom:24px;right:12px}}
.lb-flash{position:absolute;inset:0;background:radial-gradient(circle,#eaffc0,#7ddc1f 60%,#041006);opacity:0;pointer-events:none;z-index:8;transition:opacity .35s}
.lb-light{position:absolute;inset:0;z-index:9;background:rgba(2,8,4,.88);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;cursor:zoom-out}
.lb-light.on{display:flex}.lb-light img{max-width:92vw;max-height:88vh;border-radius:18px;border:1px solid rgba(212,255,58,.4);box-shadow:0 0 90px rgba(125,220,31,.35)}
.lb-light span{position:absolute;bottom:22px;font:9px 'DM Mono',monospace;letter-spacing:.3em;color:#8aa690}
@media(max-width:650px){.lb-brand{font-size:11px}.lb-brand img{width:36px;height:36px}.lb-tick{font-size:10px;padding:8px 11px}}
`;
const HTML=`
<div class="lb-stage"></div>
<div class="lb-top"><div class="lb-brand"><img src="${BASE}assets/lobby/supercycle-logo-sm.png" alt=""><div>SUPER SHIP<small>LOBBY · CHILL ZONE</small></div></div><div class="lb-tick" id="lbTick">$SUPER · loading…</div></div>
<div class="lb-tf" id="lbTf"><button data-tf="24H" class="on">24H</button><button data-tf="7D">7D</button><button data-tf="90D">90D</button><a href="${DEX_URL}" target="_blank" rel="noopener">DEXSCREENER ↗</a></div>
<div class="lb-hint"><b>W A S D</b> / <b>ARROWS</b> WALK &nbsp;·&nbsp; <b>SPACE</b> FLY UP<br>WALK INTO A PORTAL OR TAP IT · TAP HOLOGRAMS TO INSPECT</div>
<div class="lb-joy" id="lbJoy"><i></i></div>
<div class="lb-bar"><button id="lbAll">◂ ALL GAMES</button><button id="lbSound">SOUND: ON</button></div>
<div class="lb-toast" id="lbToast"></div><div class="lb-flash" id="lbFlash"></div>
<div class="lb-light" id="lbLight"><img alt=""><span>TAP ANYWHERE TO CLOSE</span></div>`;

function create(){
  const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
  const root=document.createElement('section');root.id='lb';root.className='lb lb-off';root.innerHTML=HTML;document.body.appendChild(root);
  const $=s=>root.querySelector(s);
  const api={onExit:null,onPortal:null};
  let visible=false,raf=0,last=0,time=0,booted=false,soundOn=true,entering=false;

  /* ---------- renderer ---------- */
  const stage=$('.lb-stage');
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  let pr=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pr);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07140c,.0075);
  const camera=new THREE.PerspectiveCamera(52,1,.1,700);
  const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:2}));
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.55,.6,1.0);composer.addPass(bloom);
  const U={time:{value:0}};
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},ca:{value:.0011},vig:{value:.55}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform float time,ca,vig;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=dot(c,c);vec2 off=c*ca*(.5+d*4.);
      vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);col*=1.-vig*smoothstep(.1,.55,d*2.);
      col+=(fract(sin(dot(vUv*(time+1.),vec2(12.9898,78.233)))*43758.5453)-.5)*.016;gl_FragColor=vec4(col,1.);}`});
  composer.addPass(grade);composer.addPass(new OutputPass());
  let baseFov=52;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;baseFov=w/h<.8?66:52;camera.fov=baseFov;camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);

  /* ---------- helpers ---------- */
  const at=(o,x,y,z)=>{o.position.set(x,y,z);return o};
  const radialTex=(stops,size=128)=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const glowTex=radialTex([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,0)']]);
  const tl=new THREE.TextureLoader();
  const loadTex=(u,cb)=>tl.load(BASE+u,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;cb&&cb(t)});
  const labelSprite=(text,{w=4.4,size=64,color='#e9ffb0',glow='#c8ff43',sub}={})=>{
    const c=document.createElement('canvas');c.width=512;c.height=sub?160:112;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.shadowColor=glow;x.shadowBlur=20;x.fillStyle=color;x.font='800 '+size+'px sans-serif';x.fillText(text,256,sub?54:56);
    if(sub){x.shadowBlur=8;x.fillStyle='#9fc7a8';x.font='600 28px monospace';x.fillText(sub,256,122)}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));s.scale.set(w,w*c.height/512,1);return s};

  // hologram material: scanlines + flicker + edge glow. mode 'img' (opaque pictures) or 'sprite' (cut-out characters, additive)
  const SHADER_V=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  function holoMat(map,{mode='img',tint=[.5,1,.65],map2=null,off=[0,0,1,1],off2=[0,0,1,1],op=1}={}){
    return new THREE.ShaderMaterial({uniforms:{map:{value:map},map2:{value:map2||map},two:{value:map2?1:0},time:U.time,tint:{value:new THREE.Vector3(...tint)},mode:{value:mode==='sprite'?1:0},op:{value:op},r1:{value:new THREE.Vector4(...off)},r2:{value:new THREE.Vector4(...off2)}},
      vertexShader:SHADER_V,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:mode==='sprite'?THREE.AdditiveBlending:THREE.NormalBlending,
      fragmentShader:`uniform sampler2D map,map2;uniform float two,time,mode,op;uniform vec3 tint;uniform vec4 r1,r2;varying vec2 vUv;
      void main(){vec2 uv=vUv;vec4 t;
        if(two>.5){if(gl_FrontFacing)t=texture2D(map,uv*r1.zw+r1.xy);else t=texture2D(map2,vec2(1.-uv.x,uv.y)*r2.zw+r2.xy);}else t=texture2D(map,uv*r1.zw+r1.xy);
        float scan=.8+.2*sin(uv.y*260.+time*7.);float flick=.9+.1*sin(time*31.+uv.y*7.);float sweep=exp(-pow((fract(time*.33)-uv.y)*14.,2.));
        float gl=step(.992,fract(sin(floor(time*9.)*91.7)*43758.5));uv.x+=gl*.02;
        if(mode>.5){float l=dot(t.rgb,vec3(.3,.59,.11));vec3 col=mix(vec3(l),t.rgb,.5)*tint*2.0;col+=tint*sweep*.8;float a=t.a*scan*flick*op;gl_FragColor=vec4(col,a);}
        else{float e=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));float edge=smoothstep(.035,0.,e);vec3 col=mix(t.rgb,t.rgb*tint*1.5+tint*.08,.3)*scan;col+=tint*edge*1.6+tint*sweep*.3;gl_FragColor=vec4(col,(.92+.08*scan)*op);}}`});
  }

  /* ---------- outside: sky, stars, moon, canyon, abyss ---------- */
  const skyMat=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:SHADER_V.replace('vUv=uv;','vP=normalize(position);').replace('varying vec2 vUv;','varying vec3 vP;'),
    fragmentShader:`varying vec3 vP;uniform float time;void main(){float h=vP.y;vec3 hor=vec3(.03,.11,.07),mid=vec3(.008,.04,.035),top=vec3(.002,.01,.012),low=vec3(.01,.025,.02);
      vec3 c=mix(hor,mid,smoothstep(0.,.4,h));c=mix(c,top,smoothstep(.35,1.,h));c=mix(c,low,smoothstep(0.,-.3,h));
      float a=smoothstep(.08,.4,h)*(1.-smoothstep(.5,.85,h));float w=.5+.5*sin(vP.x*7.+time*.2+sin(vP.z*5.+time*.12)*2.);
      c+=vec3(.05,.45,.2)*a*w*.4+vec3(.4,.05,.08)*a*(1.-w)*.14;gl_FragColor=vec4(c,1.);}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(500,32,16),skyMat);sky.renderOrder=-10;scene.add(sky);
  const starsG=new THREE.Group();scene.add(starsG);
  {const n=2400,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*6.283,y=Math.random()*1.5-.5,s=Math.sqrt(Math.max(0,1-y*y)),r=480;p.set([Math.cos(th)*s*r,y*r,Math.sin(th)*s*r],i*3);const k=rnd(.5,1),t=Math.random();c.set(t<.15?[k*.7,k*.95,k]:t<.25?[k,k*.9,k*.7]:[k,k,k],i*3)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
    starsG.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.8,sizeAttenuation:false,vertexColors:true,fog:false,transparent:true,opacity:.9,depthWrite:false})))}
  {const m=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTex([[0,'rgba(235,255,240,1)'],[.12,'rgba(210,255,225,1)'],[.16,'rgba(150,255,200,.35)'],[.5,'rgba(90,255,150,.08)'],[1,'rgba(90,255,150,0)']],256),fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));m.scale.set(180,180,1);m.position.set(-120,110,-300);scene.add(m)}
  // glowing grid far below + canyon pillars rising out of it
  const abyss=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.ShaderMaterial({uniforms:U,
    vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float time;void main(){vec2 p=vec2(vW.x,vW.z+time*2.)/4.;vec2 g=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(g.x,g.y),1.);float d=length(vW.xz);float pulse=.5+.5*sin(d*.15-time*1.2);
      vec3 col=vec3(.004,.02,.012)+vec3(.45,1.,.2)*line*(.15+.45*pulse)*exp(-d*.008);col+=vec3(.02,.3,.1)*exp(-d*.02)*.6;gl_FragColor=vec4(col,1.);}`}));
  abyss.rotation.x=-Math.PI/2;abyss.position.y=-46;scene.add(abyss);
  const rockM=new THREE.MeshStandardMaterial({color:0x0d1a12,roughness:.95,flatShading:true});
  {const n=120,im=new THREE.InstancedMesh(new THREE.CylinderGeometry(.55,1.2,1,6,1),rockM,n),d=new THREE.Object3D();
   for(let i=0;i<n;i++){const a=rnd(0,6.283),r=rnd(30,170),top=rnd(-34,10),h=top+52,w=rnd(2,7);d.position.set(Math.cos(a)*r,top-h/2,Math.sin(a)*r);d.scale.set(w,h,w);d.rotation.y=Math.random()*6;d.updateMatrix();im.setMatrixAt(i,d.matrix)}scene.add(im)}
  const cm=[new THREE.MeshBasicMaterial({color:new THREE.Color(.8,2.8,.4)}),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.4,.45)})];
  for(let i=0;i<50;i++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(1),cm[i%2]),a=rnd(0,6.283),r=rnd(22,90);c.scale.set(rnd(.2,.6),rnd(1,3.4),rnd(.2,.6));c.position.set(Math.cos(a)*r,rnd(-30,6),Math.sin(a)*r);c.rotation.set(rnd(-.4,.4),Math.random()*6,rnd(-.4,.4));scene.add(c)}
  const floaters=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),rockM),a=rnd(0,6.283),r=rnd(24,70);m.scale.set(rnd(1,4),rnd(.8,2.4),rnd(1,4));m.position.set(Math.cos(a)*r,rnd(-14,8),Math.sin(a)*r);m.userData={y:m.position.y,ph:rnd(0,6),sp:rnd(.2,.5)};scene.add(m);floaters.push(m)}
  // the Glass Bridge, far outside
  {const g=new THREE.Group();g.position.set(30,-8,-120);g.rotation.y=.5;const m=new THREE.MeshStandardMaterial({color:0x17261c,roughness:.4,metalness:.8});g.add(new THREE.Mesh(new THREE.BoxGeometry(4,.4,220),m));
   for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,220),new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.6,.8)}));l.position.set(s*1.9,.3,0);g.add(l)}
   for(let i=0;i<8;i++){const a=new THREE.Mesh(new THREE.TorusGeometry(2.2,.06,6,40,Math.PI),i%2?cm[1]:cm[0]);a.position.set(0,.2,-100+i*28);g.add(a)}scene.add(g)}
  // meteors
  const meteors=[];{const c=document.createElement('canvas');c.width=128;c.height=8;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,128,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,1)');x.fillStyle=g;x.fillRect(0,2,128,4);const t=new THREE.CanvasTexture(c);
   for(let i=0;i<3;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,opacity:0}));s.scale.set(22,.6,1);s.visible=false;scene.add(s);meteors.push({s,life:0,vx:0,vy:0})}}
  let meteorT=2;

  /* ---------- the ship deck ---------- */
  const metalM=new THREE.MeshStandardMaterial({color:0x17261c,roughness:.35,metalness:.85});
  const limeM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,3,.5)}),redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.4,.45)}),greenM=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.6,.8)});
  const floorTex=(()=>{const S=1024,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),h=S/2;
    const g=x.createRadialGradient(h,h,0,h,h,h);g.addColorStop(0,'#17381e');g.addColorStop(.6,'#0d2214');g.addColorStop(1,'#061009');x.fillStyle=g;x.fillRect(0,0,S,S);
    x.strokeStyle='rgba(190,255,70,.3)';x.lineWidth=3;for(const f of[.14,.34,.56,.8,.96]){x.beginPath();x.arc(h,h,h*f,0,6.283);x.stroke()}
    x.strokeStyle='rgba(190,255,70,.13)';x.lineWidth=2;for(let i=0;i<32;i++){const a=i/32*6.283;x.beginPath();x.moveTo(h+Math.cos(a)*h*.14,h+Math.sin(a)*h*.14);x.lineTo(h+Math.cos(a)*h*.96,h+Math.sin(a)*h*.96);x.stroke()}
    for(let i=0;i<48;i++){const a=i/48*6.283,r=h*.985;x.fillStyle=i%2?'rgba(255,77,79,.75)':'rgba(204,255,0,.75)';x.save();x.translate(h+Math.cos(a)*r,h+Math.sin(a)*r);x.rotate(a);x.fillRect(-16,-6,32,12);x.restore()}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t})();
  const floor=new THREE.Mesh(new THREE.CircleGeometry(RAD,96),new THREE.MeshStandardMaterial({map:floorTex,roughness:.5,metalness:.35}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const hull=new THREE.Mesh(new THREE.CylinderGeometry(RAD+.2,RAD-4,3,64,1,true),new THREE.MeshStandardMaterial({color:0x0f1e16,roughness:.5,metalness:.8,side:THREE.DoubleSide}));hull.position.y=-1.5;scene.add(hull);
  // low parapet + LED rail so you can see over the edge
  {const pa=new THREE.Mesh(new THREE.CylinderGeometry(RAD+.15,RAD+.15,1.1,96,1,true),new THREE.MeshStandardMaterial({color:0x10201a,roughness:.4,metalness:.8,side:THREE.DoubleSide,transparent:true,opacity:.55}));pa.position.y=.55;scene.add(pa);
   const rt=new THREE.Mesh(new THREE.TorusGeometry(RAD+.15,.07,8,128),limeM);rt.rotation.x=Math.PI/2;rt.position.y=1.12;scene.add(rt);const rb=new THREE.Mesh(new THREE.TorusGeometry(RAD+.15,.05,8,128),redM);rb.rotation.x=Math.PI/2;rb.position.y=.12;scene.add(rb)}
  // dome ribs: you can see the stars between them
  for(let i=0;i<7;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(RAD+.2,.1,6,72,Math.PI),metalM);r.rotation.y=i*Math.PI/7;scene.add(r);const l=new THREE.Mesh(new THREE.TorusGeometry(RAD+.1,.03,6,72,Math.PI),i%2?redM:greenM);l.rotation.y=i*Math.PI/7;scene.add(l)}
  {const ap=new THREE.Mesh(new THREE.TorusGeometry(2.4,.12,8,48),limeM);ap.rotation.x=Math.PI/2;ap.position.y=RAD+.2;scene.add(ap)}
  // lights
  scene.add(new THREE.HemisphereLight(0x7fd08f,0x08120c,.9));
  const moonL=new THREE.DirectionalLight(0xa6e8b8,1.6);moonL.position.set(-20,40,16);scene.add(moonL);
  const spot=new THREE.PointLight(0xc8ff43,40,26,2);spot.position.set(0,6,0);scene.add(spot);

  /* ---------- hero hologram: rolls front -> back -> front ---------- */
  const station={x:0,z:1.2};
  const hologramGroup=new THREE.Group();hologramGroup.position.set(station.x,0,station.z);scene.add(hologramGroup);
  hologramGroup.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.9,2.3,.5,40),metalM),0,.25,0));
  for(const [r,m,y] of[[1.85,limeM,.52],[1.5,redM,.54]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,64),m);t.rotation.x=Math.PI/2;t.position.y=y;hologramGroup.add(t)}
  const beamM=new THREE.MeshBasicMaterial({color:0x7bff3a,transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  hologramGroup.add(at(new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,4.8,32,1,true),beamM),0,2.9,0));
  const heroPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.86),new THREE.MeshBasicMaterial({visible:false}));heroPlane.position.y=2.75;hologramGroup.add(heroPlane);
  const heroLabel=labelSprite('SUPER HERO',{w:3.4,size:58,sub:'HOLOGRAM · LIVE'});heroLabel.position.set(0,4.35,0);hologramGroup.add(heroLabel);
  const rings=[];for(let i=0;i<3;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(1.55-i*.16,.025,6,64),i%2?redM:limeM);t.rotation.x=Math.PI/2;hologramGroup.add(t);rings.push(t)}

  /* ---------- the flyer: 4 angles x 4 frames (row 0 = flying right, 1 = front, 2 = flying left, 3 = back) ---------- */
  const FL={cw:392,ch:311},FH=2.6,FW=FH*FL.cw/FL.ch;
  const flyF=[];
  const heroSpriteMat=new THREE.SpriteMaterial({transparent:true,alphaTest:.25,fog:false});let heroInit=false;
  const player={x:0,z:9.5,vx:0,vz:0,ph:0,alt:1.3,vy:0,row:1,moving:false};
  const hero=new THREE.Sprite(heroSpriteMat);hero.scale.set(FW,FH,1);hero.renderOrder=3;scene.add(hero);
  const heroShadow=new THREE.Mesh(new THREE.CircleGeometry(.8,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));heroShadow.rotation.x=-Math.PI/2;heroShadow.position.y=.03;scene.add(heroShadow);
  const arrowM=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xd4ff3a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));arrowM.scale.set(.9,.9,1);scene.add(arrowM);
  const ROLL=[1,3,0,2];let rollAng=0,rollIdx=0,lastEdge=0,faceF=1,faceB=3;
  loadTex('assets/lobby/flyer.webp',t=>{
    for(let r=0;r<4;r++){flyF[r]=[];for(let c=0;c<4;c++){const x=t.clone();x.needsUpdate=true;x.repeat.set(.25,.25);x.offset.set(c*.25,1-(r+1)*.25);flyF[r][c]=x}}
    heroPlane.material=holoMat(t,{mode:'sprite',tint:[.5,1,.6],map2:t,off:[0,1-2*.25,.25,.25],off2:[0,1-4*.25,.25,.25]});
  });
  // the hologram rolls: front -> (edge-on) back -> side -> other side -> front... every angle of the flyer gets its turn
  function rollHologram(dt){
    rollAng+=dt*1.1;heroPlane.rotation.y=rollAng;const m=heroPlane.material;if(!m.uniforms)return;
    const k=Math.floor((rollAng+Math.PI/2)/Math.PI);
    if(k!==lastEdge){lastEdge=k;rollIdx=(rollIdx+1)%4;if(k%2)faceB=ROLL[rollIdx];else faceF=ROLL[rollIdx]}
    const fr=Math.floor(time*8)%4;
    m.uniforms.r1.value.set(fr*.25,1-(faceF+1)*.25,.25,.25);m.uniforms.r2.value.set(fr*.25,1-(faceB+1)*.25,.25,.25);
  }

  /* ---------- $SUPER chart station (left) ---------- */
  const chart=new THREE.Group();chart.position.set(-10.2,0,-3.2);scene.add(chart);
  chart.add(at(new THREE.Mesh(new THREE.CylinderGeometry(3.6,4,.45,48),metalM),0,.22,0));
  for(const [r,m] of[[3.5,limeM],[2.9,redM]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,72),m);t.rotation.x=Math.PI/2;t.position.y=.47;chart.add(t)}
  const cLabel=labelSprite('$SUPER',{w:4.6,size:76,sub:'LIVE ON AVALANCHE'});cLabel.position.set(0,6.1,0);chart.add(cLabel);
  const holoBox=new THREE.Group();holoBox.position.set(-1.6,.8,0);chart.add(holoBox);
  const lineM=new THREE.LineBasicMaterial({color:0x7bff3a,transparent:true,opacity:.55});
  holoBox.add(at(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.4,3.3,1.2)),lineM),0,1.65,0));
  {const pts=[];for(let i=1;i<4;i++){const y=i*3.3/4;pts.push(new THREE.Vector3(-2.7,y,-.6),new THREE.Vector3(2.7,y,-.6))}for(let i=1;i<9;i++){const x=-2.7+i*5.4/9;pts.push(new THREE.Vector3(x,0,-.6),new THREE.Vector3(x,3.3,-.6))}
   holoBox.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x7bff3a,transparent:true,opacity:.16})))}
  const candles=new THREE.Group();holoBox.add(candles);
  const chartBeam=new THREE.Mesh(new THREE.PlaneGeometry(5.4,3.3),new THREE.MeshBasicMaterial({color:0x7bff3a,transparent:true,opacity:.04,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));chartBeam.position.set(0,1.65,-.6);holoBox.add(chartBeam);
  let chartGrow=0,priceLabels=[];
  const panelCv=document.createElement('canvas');panelCv.width=1024;panelCv.height=760;const panelTex=new THREE.CanvasTexture(panelCv);panelTex.colorSpace=THREE.SRGBColorSpace;panelTex.anisotropy=4;
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.12),holoMat(panelTex,{tint:[.55,1,.7]}));panel.position.set(3.65,2.4,0);chart.add(panel);
  chart.userData.link=true;panel.userData.link=true;
  const logoImg=new Image();logoImg.src=BASE+'assets/lobby/supercycle-logo-sm.png';logoImg.onload=()=>drawPanel();
  let info=null,ohlc=null,tf='24H',loadingNote='CONNECTING TO DEXSCREENER…';
  const fmtBig=n=>{n=+n;if(!isFinite(n))return '—';if(n>=1e9)return '$'+(n/1e9).toFixed(2)+'B';if(n>=1e6)return '$'+(n/1e6).toFixed(2)+'M';if(n>=1e3)return '$'+(n/1e3).toFixed(1)+'K';return '$'+n.toFixed(0)};
  const sub='₀₁₂₃₄₅₆₇₈₉';
  const fmtP=p=>{p=+p;if(!isFinite(p)||p<=0)return '—';if(p>=1)return '$'+p.toFixed(p>=100?2:4);if(p>=.01)return '$'+p.toFixed(5);const m=p.toFixed(20).match(/^0\.(0+)(\d{1,4})/);if(m&&m[1].length>=3)return '$0.0'+String(m[1].length).split('').map(d=>sub[+d]).join('')+m[2];return '$'+p.toPrecision(4)};
  const fmtPct=v=>(v==null||!isFinite(+v))?'—':((+v>=0?'+':'')+(+v).toFixed(2)+'%');
  const age=ms=>{if(!ms)return '—';const d=(Date.now()-ms)/864e5;return d>=1?Math.floor(d)+' DAYS':Math.max(1,Math.floor(d*24))+' HRS'};
  function drawPanel(){
    const x=panelCv.getContext('2d'),W=1024,H=760;x.clearRect(0,0,W,H);
    x.fillStyle='rgba(4,16,9,.88)';x.beginPath();x.roundRect(8,8,W-16,H-16,34);x.fill();x.strokeStyle='rgba(180,255,90,.7)';x.lineWidth=5;x.stroke();
    if(logoImg.complete&&logoImg.naturalWidth)x.drawImage(logoImg,34,34,110,110);
    x.textBaseline='alphabetic';x.fillStyle='#eaffb8';x.font='800 58px sans-serif';x.fillText(info?info.baseToken.name.toUpperCase().slice(0,16):'SUPERCYCLE',166,86);
    x.fillStyle='#9fc7a8';x.font='600 30px monospace';x.fillText('$'+(info?info.baseToken.symbol:'SUPER')+' · '+(info?String(info.dexId).toUpperCase():'AVALANCHE')+' · AVAX',168,130);
    if(!info){x.fillStyle='#d4ff3a';x.font='700 38px monospace';x.fillText(loadingNote,40,300);x.fillStyle='#8aa690';x.font='600 26px monospace';x.fillText('TAP THIS PANEL TO OPEN DEXSCREENER',40,360);panelTex.needsUpdate=true;return}
    x.fillStyle='#fff';x.font='800 96px sans-serif';x.fillText(fmtP(info.priceUsd),36,262);
    const chg=[['5M',info.priceChange?.m5],['1H',info.priceChange?.h1],['6H',info.priceChange?.h6],['24H',info.priceChange?.h24]];
    chg.forEach(([k,v],i)=>{const px=36+i*238,up=+v>=0;x.fillStyle='rgba(255,255,255,.06)';x.beginPath();x.roundRect(px,292,222,92,18);x.fill();x.fillStyle='#8aa690';x.font='600 24px monospace';x.fillText(k,px+16,324);x.fillStyle=v==null?'#9fc7a8':up?'#7bff3a':'#ff6b6e';x.font='800 38px sans-serif';x.fillText(fmtPct(v),px+16,368)});
    const rows=[['24H VOLUME',fmtBig(info.volume?.h24)],['LIQUIDITY',fmtBig(info.liquidity?.usd)],['FDV',fmtBig(info.fdv)],['MARKET CAP',fmtBig(info.marketCap||info.fdv)],['24H TXNS',(info.txns?.h24?.buys??'—')+' B / '+(info.txns?.h24?.sells??'—')+' S'],['PAIR AGE',age(info.pairCreatedAt)]];
    rows.forEach(([k,v],i)=>{const col=i%2,row=(i/2)|0,px=36+col*490,py=418+row*100;x.fillStyle='#8aa690';x.font='600 24px monospace';x.fillText(k,px,py);x.fillStyle='#eaffb8';x.font='800 44px sans-serif';x.fillText(v,px,py+48)});
    x.fillStyle='#d4ff3a';x.font='700 24px monospace';x.fillText('TAP TO OPEN DEXSCREENER ↗',36,732);
    panelTex.needsUpdate=true;
  }
  const upCol=new THREE.Color(1.2,3,.5),dnCol=new THREE.Color(3,.5,.55);
  function clearChart(){while(candles.children.length){const c=candles.children[0];candles.remove(c);c.geometry&&c.geometry.dispose();c.material&&!c.material.shared&&c.material.dispose()}for(const s of priceLabels){holoBox.remove(s)}priceLabels=[]}
  function buildChart(list){
    clearChart();if(!list||list.length<2){chartBeam.material.opacity=.04;return}
    const n=list.length,W=5.2,Hh=3.0,yb=.15;let hi=-1e99,lo=1e99;for(const k of list){hi=Math.max(hi,k[2]);lo=Math.min(lo,k[3])}
    const pad=(hi-lo)*.08||hi*.02||1e-12,Y=v=>yb+(v-lo+pad)/(hi-lo+2*pad)*Hh,step=W/n,bw=Math.max(.014,step*.62);
    const bodies=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff}),n),wicks=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff}),n),d=new THREE.Object3D(),pts=[];
    bodies.material.shared=false;
    list.forEach((k,i)=>{const [,o,h,l,c]=k,x=-W/2+(i+.5)*step,up=c>=o,yo=Y(o),yc=Y(c),top=Math.max(yo,yc),bot=Math.min(yo,yc),col=up?upCol:dnCol;
      d.position.set(x,(top+bot)/2,0);d.scale.set(bw,Math.max(.012,top-bot),bw);d.updateMatrix();bodies.setMatrixAt(i,d.matrix);bodies.setColorAt(i,col);
      d.position.set(x,(Y(h)+Y(l))/2,0);d.scale.set(bw*.22,Math.max(.012,Y(h)-Y(l)),bw*.22);d.updateMatrix();wicks.setMatrixAt(i,d.matrix);wicks.setColorAt(i,col);pts.push(new THREE.Vector3(x,yc,.04))});
    bodies.instanceColor.needsUpdate=true;wicks.instanceColor.needsUpdate=true;candles.add(bodies,wicks);
    const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:new THREE.Color(2.2,3,1.2)}));candles.add(ln);
    const last=list[n-1][4],first=list[0][1],up=last>=first;chartBeam.material.color.set(up?0x7bff3a:0xff4d4f);
    const hiL=labelSprite(fmtP(hi),{w:1.5,size:46,color:'#bfe6c6',glow:'#7bff3a'}),loL=labelSprite(fmtP(lo),{w:1.5,size:46,color:'#bfe6c6',glow:'#7bff3a'});
    hiL.position.set(3.55,Y(hi),0);loL.position.set(3.55,Y(lo),0);holoBox.add(hiL,loL);priceLabels.push(hiL,loL);
    chartGrow=0;
  }
  async function getJson(u){try{const r=await fetch(u);if(!r.ok)return null;return await r.json()}catch{return null}}
  async function refreshInfo(){
    const j=await getJson('https://api.dexscreener.com/latest/dex/pairs/avalanche/'+PAIR);const p=j&&j.pairs&&j.pairs[0];
    if(p){info=p;const up=+(p.priceChange?.h24)>=0;$('#lbTick').innerHTML='<b>$'+p.baseToken.symbol+'</b> · '+fmtP(p.priceUsd)+' · <span class="'+(up?'up':'dn')+'">'+fmtPct(p.priceChange?.h24)+'</span>'}
    else if(!info){loadingNote='LIVE DATA UNAVAILABLE';$('#lbTick').textContent='$SUPER · open chart ↗'}
    drawPanel();
  }
  async function refreshChart(){
    const map={'24H':['minute',15,96],'7D':['hour',1,168],'90D':['day',1,90]},[unit,agg,lim]=map[tf];
    const j=await getJson(`https://api.geckoterminal.com/api/v2/networks/avax/pools/${PAIR}/ohlcv/${unit}?aggregate=${agg}&limit=${lim}&currency=usd`);
    const l=j&&j.data&&j.data.attributes&&j.data.attributes.ohlcv_list;
    if(l&&l.length>1){ohlc=l.slice().reverse();buildChart(ohlc)}
    else if(!ohlc){const w=[];let p=1;for(let i=0;i<60;i++){const o=p;p*=1+Math.sin(i*.4)*.03+rnd(-.02,.02);w.push([i,o,Math.max(o,p)*1.01,Math.min(o,p)*.99,p,0])}buildChart(w)}
  }
  root.querySelectorAll('[data-tf]').forEach(b=>b.onclick=()=>{tf=b.dataset.tf;root.querySelectorAll('[data-tf]').forEach(x=>x.classList.toggle('on',x===b));refreshChart()});
  let pollT=0;

  /* ---------- community gallery (right) ---------- */
  const gallery=new THREE.Group();gallery.position.set(10.2,0,-3.2);scene.add(gallery);
  gallery.add(at(new THREE.Mesh(new THREE.CylinderGeometry(3.6,4,.45,48),metalM),0,.22,0));
  for(const [r,m] of[[3.5,redM],[2.9,limeM]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,72),m);t.rotation.x=Math.PI/2;t.position.y=.47;gallery.add(t)}
  const gLabel=labelSprite('COMMUNITY',{w:4.6,size:76,sub:'HOLOGRAM WALL · TAP TO INSPECT'});gLabel.position.set(0,6.1,0);gallery.add(gLabel);
  gallery.add(at(new THREE.Mesh(new THREE.CylinderGeometry(2.8,3.1,5,40,1,true),new THREE.MeshBasicMaterial({color:0x7bff3a,transparent:true,opacity:.04,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false})),0,3,0));
  const carousel=new THREE.Group();carousel.position.y=2.75;gallery.add(carousel);
  const IMGS=['community-1','community-2','community-3','community-4'];const galleryPlanes=[];
  IMGS.forEach((n,i)=>{loadTex('assets/lobby/'+n+'.webp',t=>{const a=t.image.width/t.image.height,h=a>1?2.1:2.7,w=h*a;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),holoMat(t,{tint:[.6,1,.7]}));const ang=i/IMGS.length*Math.PI*2;m.position.set(Math.sin(ang)*2.7,0,Math.cos(ang)*2.7);m.rotation.y=ang;m.userData={img:'assets/lobby/'+n+'.webp',ang};carousel.add(m);galleryPlanes.push(m)})});
  const lightbox=$('#lbLight');lightbox.onclick=()=>lightbox.classList.remove('on');

  /* ---------- logo sign over the portals ---------- */
  loadTex('assets/lobby/supercycle-logo.webp',t=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6),holoMat(t,{tint:[.7,1,.75]}));s.position.set(0,9.6,-(RAD-1.4));scene.add(s);
    const lr=new THREE.Mesh(new THREE.TorusGeometry(2.7,.05,8,80),limeM);lr.position.copy(s.position);scene.add(lr);logoRing=lr});
  let logoRing=null;

  /* ---------- portals to the games (south wall) ---------- */
  const portals=[];
  const PDEF=[{k:'bridge',name:'GLASS BRIDGE',sub:'12 STAGES · AVAX × ROBINHOOD',x:-7.2,col:0x7bff3a,img:'assets/previews/glass-bridge.jpg'},{k:'rl',name:'RED LIGHT · GREEN LIGHT',sub:'5 ROUNDS · DON\'T MOVE',x:0,col:0xff4d4f,img:'assets/previews/red-light.jpg'},{k:'mingle',name:'MINGLE',sub:'30 PLAYERS · FORM GROUPS',x:7.2,col:0xc8ff43,img:'assets/previews/mingle.jpg'}];
  for(const d of PDEF){
    const g=new THREE.Group();g.position.set(d.x,0,-(RAD-2.6)+Math.abs(d.x)*.22);scene.add(g);
    const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(d.col).multiplyScalar(2.4)});
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.14,12,72),mat);ring.position.y=2.45;g.add(ring);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.8,.04,8,72),mat);ring2.position.y=2.45;g.add(ring2);
    for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.35,.5,.35),metalM);p.position.set(s*2.1,.25,0);g.add(p)}
    const pad=new THREE.Mesh(new THREE.RingGeometry(1.2,2.3,48),new THREE.MeshBasicMaterial({color:d.col,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.set(0,.05,1.6);g.add(pad);
    const pm=new THREE.ShaderMaterial({uniforms:{map:{value:null},time:U.time,col:{value:new THREE.Color(d.col)}},vertexShader:SHADER_V,transparent:true,depthWrite:false,side:THREE.DoubleSide,
      fragmentShader:`uniform sampler2D map;uniform float time;uniform vec3 col;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);
        vec2 uv=vUv+vec2(sin(vUv.y*14.+time*2.)*.012,cos(vUv.x*14.+time*2.)*.012);vec3 c=texture2D(map,uv).rgb;float sw=.5+.5*sin(a*3.+r*18.-time*3.);
        vec3 o=c*.85+col*sw*.22*(1.-r*1.2);o*=.8+.2*sin(vUv.y*220.+time*6.);o+=col*smoothstep(.36,.5,r)*.9;gl_FragColor=vec4(o,smoothstep(.5,.46,r));}`});
    const disc=new THREE.Mesh(new THREE.CircleGeometry(2.04,56),pm);disc.position.y=2.45;disc.userData={portal:d.k};g.add(disc);
    loadTex(d.img,t=>{pm.uniforms.map.value=t});
    const lab=labelSprite(d.name,{w:4.8,size:d.name.length>18?36:d.name.length>10?52:62,sub:d.sub,color:'#fff',glow:'#'+d.col.toString(16).padStart(6,'0')});lab.position.set(0,5.2,.1);lab.rotation.y=0;g.add(lab);
    const pl=new THREE.PointLight(d.col,18,12,2);pl.position.set(0,2.5,1.5);g.add(pl);
    portals.push({d,g,disc,ring,ring2,wx:g.position.x,wz:g.position.z});
  }

  /* ---------- particles ---------- */
  const MAXP=300,pPos=new Float32Array(MAXP*3),pCol=new Float32Array(MAXP*3),pVel=new Float32Array(MAXP*3),pLife=new Float32Array(MAXP),pMax=new Float32Array(MAXP),pBase=new Float32Array(MAXP*3);pPos.fill(-999);let pHead=0;
  const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  const pPts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.4,map:glowTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));pPts.frustumCulled=false;scene.add(pPts);
  function emit(x,y,z,n,color,sp=1.2,up=1){const c=new THREE.Color(color);for(let k=0;k<n;k++){const i=pHead;pHead=(pHead+1)%MAXP;const a=rnd(0,6.283),s=sp*rnd(.3,1);pPos.set([x,y,z],i*3);pVel.set([Math.cos(a)*s,rnd(.3,1)*up*sp,Math.sin(a)*s],i*3);pBase.set([c.r,c.g,c.b],i*3);pLife[i]=pMax[i]=rnd(.6,1.4)}}
  function updParticles(dt){for(let i=0;i<MAXP;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;if(pLife[i]<=0){pPos[j+1]=-999;pCol[j]=pCol[j+1]=pCol[j+2]=0;continue}pVel[j+1]-=2*dt;pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f*2;pCol[j+1]=pBase[j+1]*f*2;pCol[j+2]=pBase[j+2]*f*2}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
  const motes=[];for(let i=0;i<60;i++)motes.push({x:rnd(-RAD,RAD),y:rnd(.5,9),z:rnd(-RAD,RAD),s:rnd(.1,.3)});
  const mGeo=new THREE.BufferGeometry(),mP=new Float32Array(motes.length*3);mGeo.setAttribute('position',new THREE.BufferAttribute(mP,3));
  scene.add(Object.assign(new THREE.Points(mGeo,new THREE.PointsMaterial({size:.14,map:glowTex,color:0xa6ff6a,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),{frustumCulled:false}));

  /* ---------- audio ---------- */
  const music=new Audio(BASE+'Avalanche_Route.mp3');music.loop=true;music.volume=.32;music.preload='auto';
  $('#lbSound').onclick=()=>{soundOn=!soundOn;$('#lbSound').textContent='SOUND: '+(soundOn?'ON':'OFF');soundOn?music.play().catch(()=>{}):music.pause()};
  let actx=null;const tone=(f,d,type='sine',v=.05,f2)=>{if(!soundOn)return;try{actx??=new (window.AudioContext||window.webkitAudioContext)();const a=actx,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,a.currentTime);if(f2)o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+d);g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}catch{}};

  /* ---------- input ---------- */
  const keys=new Set();let joy={x:0,z:0};
  const kd=e=>{if(!visible)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)){e.preventDefault();e.stopImmediatePropagation();keys.add(k)}
    if(k==='escape'){if(lightbox.classList.contains('on'))lightbox.classList.remove('on');else if(api.onExit)api.onExit()}};
  addEventListener('keydown',kd,true);addEventListener('keyup',e=>{if(visible)keys.delete(e.key.toLowerCase())},true);addEventListener('blur',()=>keys.clear());
  const joyEl=$('#lbJoy'),knob=joyEl.firstElementChild;let jid=null;
  const jset=e=>{const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}joy.x=dx;joy.z=dy;knob.style.transform=`translate(${dx*38}px,${dy*38}px)`};
  joyEl.addEventListener('pointerdown',e=>{jid=e.pointerId;joyEl.setPointerCapture(jid);jset(e);e.preventDefault()});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
  for(const ev of['pointerup','pointercancel'])joyEl.addEventListener(ev,()=>{jid=null;joy.x=joy.z=0;knob.style.transform=''});
  const toastEl=$('#lbToast');let toastT=0;const toast=t=>{toastEl.textContent=t;toastEl.classList.add('on');toastT=1.6};
  $('#lbAll').onclick=()=>api.onExit&&api.onExit();
  $('#lbTick').onclick=()=>window.open(DEX_URL,'_blank','noopener');
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let downAt=null;
  renderer.domElement.addEventListener('pointerdown',e=>{downAt={x:e.clientX,y:e.clientY,t:performance.now()}});
  renderer.domElement.addEventListener('pointerup',e=>{if(!downAt||Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>8)return;downAt=null;
    const r=renderer.domElement.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);
    const targets=[...portals.map(p=>p.disc),...galleryPlanes,panel];const hit=ray.intersectObjects(targets,false)[0];if(!hit)return;const u=hit.object.userData;
    if(u.portal)enterPortal(u.portal);else if(u.img){lightbox.querySelector('img').src=BASE+u.img;lightbox.classList.add('on')}else if(u.link)window.open(DEX_URL,'_blank','noopener')});
  const flash=$('#lbFlash');
  function enterPortal(k){if(entering)return;entering=true;const p=PDEF.find(x=>x.k===k);toast('ENTERING '+p.name+'…');tone(300,.5,'sawtooth',.05,1200);emit(player.x,1.2,player.z,40,p.col,3,1);flash.style.opacity=1;setTimeout(()=>{if(api.onPortal)api.onPortal(k);setTimeout(()=>{flash.style.opacity=0;entering=false},500)},420)}

  /* ---------- simulation ---------- */
  const colliders=[{x:station.x,z:station.z,r:2.6},{x:-10.2,z:-3.2,r:3.9},{x:10.2,z:-3.2,r:3.9}];
  function update(dt){
    time+=dt;U.time.value=time;grade.uniforms.time.value=time%100;
    let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    ix+=joy.x;iz+=joy.z;const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m}
    const ctl=!entering&&!lightbox.classList.contains('on'),sp=5.2,k=1-Math.exp(-dt*12);
    player.vx+=((ctl?ix*sp:0)-player.vx)*k;player.vz+=((ctl?iz*sp:0)-player.vz)*k;
    player.x+=player.vx*dt;player.z+=player.vz*dt;
    const d=Math.hypot(player.x,player.z);if(d>RAD-1.1){player.x*=(RAD-1.1)/d;player.z*=(RAD-1.1)/d}
    for(const c of colliders){const dx=player.x-c.x,dz=player.z-c.z,dd=Math.hypot(dx,dz);if(dd<c.r){const kk=c.r/Math.max(dd,.01);player.x=c.x+dx*kk;player.z=c.z+dz*kk}}
    const spd=Math.hypot(player.vx,player.vz);player.moving=spd>.6;
    if(player.moving)player.row=Math.abs(player.vx)>Math.abs(player.vz)*.8?(player.vx>0?0:2):(player.vz>0?1:3);else player.row=1;
    player.ph+=dt*(player.moving?11:6);
    const rise=ctl&&keys.has(' ');player.vy+=((rise?4.4:(player.alt>1.45?-2.6:0))-player.vy)*Math.min(1,dt*6);player.alt=clamp(player.alt+player.vy*dt,1.3,6.6);if(!rise&&player.alt<=1.3)player.vy=0;
    if(rise&&Math.random()<dt*30)emit(player.x+rnd(-.3,.3),player.alt-.9,player.z+rnd(-.2,.2),1,0xc8ff43,1.2,-.3);
    // portals: walk in
    for(const p of portals){const dx=player.x-p.wx,dz=player.z-(p.wz+1.0);if(Math.abs(dx)<1.5&&dz>-1.2&&dz<1.2&&ctl&&player.alt<5.2)enterPortal(p.d.k)}
    // hologram rolling
    rollHologram(dt);
    rings.forEach((r,i)=>{r.position.y=.9+((time*.5+i*.33)%1)*3.6;r.material.opacity=1});
    holoBox.rotation.y=0;
    // stations face the player a bit
    const faceY=(g)=>Math.atan2(player.x-g.position.x,player.z-g.position.z);
    chart.rotation.y+=((clamp(faceY(chart),-.9,.9))-chart.rotation.y)*Math.min(1,dt*2);
    carousel.rotation.y+=dt*.28;gallery.rotation.y=0;
    for(const m2 of galleryPlanes){const wa=m2.userData.ang+carousel.rotation.y;const f=Math.cos(wa-0)*.5+.5;m2.scale.setScalar(.86+.18*f)}
    if(chartGrow<1){chartGrow=Math.min(1,chartGrow+dt*1.2);candles.scale.y=Math.max(.001,ease(chartGrow))}
    pollT+=dt;if(pollT>45){pollT=0;refreshInfo();refreshChart()}
    if(logoRing){logoRing.rotation.z+=dt*.15}
    for(const p of portals){p.ring.rotation.z+=dt*.5;p.ring2.rotation.z-=dt*.8;p.disc.scale.setScalar(1+.012*Math.sin(time*3+p.wx))}
    starsG.rotation.y+=dt*.004;for(const f of floaters)f.position.y=f.userData.y+Math.sin(time*f.userData.sp+f.userData.ph)*.6;
    meteorT-=dt;if(meteorT<=0){meteorT=rnd(3,7);const mt=meteors.find(x=>x.life<=0);if(mt){mt.life=1.2;mt.s.visible=true;mt.s.position.set(rnd(-200,200),rnd(60,160),-300);const sp2=rnd(90,150)*(Math.random()<.5?-1:1);mt.vx=sp2;mt.vy=-rnd(25,60);mt.s.material.rotation=Math.atan2(mt.vy,mt.vx)}}
    for(const mt of meteors)if(mt.life>0){mt.life-=dt;mt.s.position.x+=mt.vx*dt;mt.s.position.y+=mt.vy*dt;mt.s.material.opacity=Math.max(0,Math.min(1,mt.life*2))*.9;if(mt.life<=0)mt.s.visible=false}
    for(let i=0;i<motes.length;i++){const mo=motes[i];mo.y+=mo.s*dt;if(mo.y>9.5)mo.y=.4;mP[i*3]=mo.x+Math.sin(time*.5+i)*.4;mP[i*3+1]=mo.y;mP[i*3+2]=mo.z}mGeo.attributes.position.needsUpdate=true;
    if(player.moving&&Math.random()<dt*18)emit(player.x+rnd(-.25,.25),player.alt-.8,player.z+rnd(-.25,.25),1,0x7bff3a,.6,.2);
    updParticles(dt);
    if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on')}
  }
  function renderHero(){
    const fr=Math.floor(player.ph)%4;
    if(flyF[player.row]){heroSpriteMat.map=flyF[player.row][fr];if(!heroInit){heroSpriteMat.needsUpdate=true;heroInit=true}}
    const bob=Math.sin(time*2.4)*.12;
    hero.position.set(player.x,player.alt+bob+FH*.05,player.z);
    const sh=Math.max(.35,1-(player.alt-1.3)*.12);heroShadow.position.set(player.x,.04,player.z);heroShadow.scale.setScalar(sh*1.3);heroShadow.material.opacity=.42*sh;
    arrowM.position.set(player.x,player.alt+FH*.64+Math.sin(time*5)*.1,player.z);
  }
  const camLook=new THREE.Vector3(0,1.5,0);camera.position.set(0,8,15);
  function camUpdate(dt){
    const px=player.x*.55,pz=player.z*.55;const tx=px,ty=8.4+(player.alt-1.3)*.35,tz=Math.min(pz+9.8,RAD-1.1),lx=px*.9,lz=pz-4;
    const k=1-Math.exp(-dt*3.2);camera.position.x+=(tx-camera.position.x)*k;camera.position.y+=(ty-camera.position.y)*k;camera.position.z+=(tz-camera.position.z)*k;
    camLook.x+=(lx-camLook.x)*k;camLook.z+=(lz-camLook.z)*k;camLook.y=1.9+(player.alt-1.3)*.4;camera.lookAt(camLook);
  }
  const perf={a:0,n:0,t:performance.now()};
  function frame(now){
    raf=requestAnimationFrame(frame);const nt=now||performance.now(),dt=Math.min((nt-last)/1000,.05);last=nt;
    update(dt);renderHero();camUpdate(dt);composer.render();
    perf.a+=(nt-perf.t)/1000;perf.t=nt;perf.n++;if(perf.a>2.5){const fps=perf.n/perf.a;perf.a=0;perf.n=0;if(fps<42&&pr>1){pr=Math.max(1,pr-.25);renderer.setPixelRatio(pr);composer.setPixelRatio(pr);resize()}else if(fps<26&&bloom.enabled){bloom.enabled=false;grade.enabled=false}}
  }

  /* ---------- public ---------- */
  api.show=()=>{
    root.classList.remove('lb-off');visible=true;resize();entering=false;flash.style.opacity=0;lightbox.classList.remove('on');
    player.x=player.z>0?player.x:0;if(!booted){booted=true;refreshInfo();refreshChart()}
    // spawn in front of the portals, away from the one you just used
    player.x=0;player.z=6.2;player.vx=player.vz=0;
    if(soundOn)music.play().catch(()=>{});last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
    toast('WELCOME ABOARD THE SUPER SHIP');
  };
  api.hide=()=>{visible=false;cancelAnimationFrame(raf);root.classList.add('lb-off');music.pause();keys.clear()};
  return api;
}

let inst=null;
export function open(cb){if(!inst)inst=create();inst.onExit=cb.onExit;inst.onPortal=cb.onPortal;inst.show()}
export function close(){if(inst)inst.hide()}
