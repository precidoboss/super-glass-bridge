/* ===================== SUPER TOWN · RESIDENT BRAIN =====================
   Every walking NPC gets a personality (archetype), drifting needs (energy / social / fun), a daily-life loop
   (pick a place -> route along the sidewalks -> sit / enter a shop / watch the fountain / play arcade...),
   awareness of cars and of the player, two-way conversations with each other, keyword-aware replies to the
   player's chat, "follow me" / "where is the arcade?" guiding, and town events (fountain meetup, airdrop).
   Flying NPCs get buddy-flight, landmark orbits and dashes. All steering is local (no navmesh): a 3x3 street
   graph for long trips + obstacle-avoiding steering for the last mile. */

const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.floor(Math.random()*a.length)];
const ARCH={ // base walk speed, sociability, which place types they like
  local:  {spd:1.9,soc:.6,aff:{shop:3,bench:2,fountain:2,park:2,pond:1,arcade:1,stop:1,exchange:.5,dock:.4,hq:.3}},
  jogger: {spd:3.9,soc:.3,aff:{loop:6,park:1.5,fountain:1.2,pond:1,bench:.6}},
  trader: {spd:2.3,soc:.5,aff:{exchange:6,bench:1,shop:1,dock:.8,fountain:.8,stop:.6}},
  gamer:  {spd:2.1,soc:.5,aff:{arcade:6,bench:1.5,shop:1.5,fountain:.5,stop:.5}},
  tourist:{spd:1.7,soc:.7,aff:{statue:3,fountain:3,hq:3,dock:3,exchange:2.5,arcade:2.5,pond:1.5,shop:1}},
  guard:  {spd:1.6,soc:.3,aff:{hq:4,dock:2,arcade:1.5,exchange:1.5,fountain:1}},
};
const MIX=['local','local','local','local','local','local','local','local','local','local','local','local','local','local','jogger','jogger','jogger','jogger','jogger','jogger','trader','trader','trader','trader','trader','trader','gamer','gamer','gamer','gamer','gamer','gamer','tourist','tourist','tourist','tourist','tourist','guard','guard','guard'];
const ENTER={shop:[6,16],arcade:[10,30],hq:[6,14],exchange:[8,20]};
const SAY={
  sit:['nice bench','people watching 😌','rest stop','legs: done','good spot for the blimp'],
  fountain:['love this fountain','meet at the fountain','so peaceful here','the water looks so good tonight'],
  pond:['is that a fish? 🐟','so calm here','pond vibes'],
  statue:['SUPER TOWN (real)','what a statue','📸 one more photo','that logo glows so nice'],
  stop:['bus is late again','waiting...','any bus tonight?'],
  walk:{local:['gm gm','this town is so clean','nice cape','love this place','watch the blimp!','cars are so fast here'],
    jogger:['on pace 🏃','3k to go','run run run','feel the burn','new PB today'],
    trader:['$SUPER looking green','checking the chart','buying the dip, flying the dip','gm, charts open?','number go up'],
    gamer:['one more run','the glass bridge got me again','who wants to race?','step 9 is a trap','red light... green light!'],
    tourist:['wow, so clean!','where is the arcade?','photo time 📸','this island floats?!','best town ever'],
    guard:['all quiet','moving along, frens','HQ looks good','stay safe out there']},
  exit:{shop:['great find!','too pricey lol','got snacks 🍡','new fit unlocked'],arcade:['new high score!','so close 😤','one more round tomorrow','insert coin (real)'],hq:['mission briefed','HQ never sleeps'],exchange:['chart is looking good','wagmi','sold the top (jk)']},
};
const SCRIPTS=[
  ['gm {b}','gm gm! nice day to fly','facts, the town looks great'],
  ['seen the new community art?','yes!! so fire','right? wagmi'],
  ['see you at the fountain later?','for sure','bet'],
  ['did you beat the Eye World yet?','almost... the boss is brutal','you got this'],
  ['{b}! long time','hey {a}! how is the dip treating you?','flying through it'],
];
const BYARCH={
  'trader|trader':[['$SUPER chart looks clean','told you, the dip was the entry','holding till the blimp lands 🚀']],
  'gamer|gamer':[['step 9 is always the trap','real 😭','mingle later?']],
  'jogger|jogger':[['nice pace!','three more laps','respect 💪']],
  'tourist|local':[['hi! where is the arcade?','follow the main road, you cannot miss it 👉','thank you!! 😄']],
  'tourist|guard':[['excuse me, which way to HQ?','straight ahead, big green logo','thanks officer!']],
  'guard|guard':[['all clear on your side?','all clear','copy that']],
  'gamer|trader':[['bought any game passes?','bought the dip instead','lol fair']],
};
const INTENTS=[
  ['follow',/follow me|come with me|come along|walk with me/],
  ['where',/(where|how (do|can) i get|take me|find|show me|way to|directions?).*(arcade|game|hq|headquarters|dock|ship|exchange|chart|fountain|plaza|park|pond|shop|store|bench|bus)/],
  ['greet',/\b(gm|gn|hi|hey|hello|yo|sup|hola|howdy)\b/],
  ['name',/who are you|your name|what.?s your name|who r u/],
  ['market',/\$?super|price|chart|dip|pump|moon|buy|sell|bull|bear|avax|coin|token/],
  ['game',/\b(game|games|play|arcade|bridge|mingle|score|boss|eye world)\b/],
  ['fly',/\b(fly|flying|flyer|cape|wings?)\b/],
  ['car',/\b(car|benz|drive|driving|race|vroom)\b/],
  ['thanks',/thank|thx|\bty\b|appreciate/],
  ['joke',/joke|funny|make me laugh|lol|haha/],
  ['bye',/\b(bye|gn|cya|see ya|later|goodnight)\b/],
  ['how',/how are you|how r u|how.?s it going|whats up|what.?s up|hbu/],
];
const JOKES=['why did the coin cross the bridge? to get to the other chain 🪙','my portfolio and the glass bridge have one thing in common: step 9','i told my wallet a joke, it had no balance','i would tell a pun about the blimp but it would go over your head'];
const KEYS=[['arcade',/arcade|game/],['hq',/hq|headquarters/],['dock',/dock|ship/],['exchange',/exchange|chart/],['fountain',/fountain|plaza/],['pond',/park|pond/],['shop',/shop|store/],['bench',/bench/],['stop',/bus/]];
const PLACE={arcade:'the Arcade',hq:'Supercycle HQ',dock:'the Ship Dock',exchange:'the $SUPER Exchange',fountain:'the fountain',pond:'the park pond',shop:'a shop',bench:'a bench',stop:'the bus stop'};
const ARCHLINE={
  local:['sounds good to me','honestly, same','this town grows on you','you should check out the shops'],
  jogger:['sorry, mid-run! but yes 🏃','can talk and run, barely','love that energy'],
  trader:['charts do not lie. people do 📈','that is a bullish take','noted, adding to the thesis'],
  gamer:['respect, add me on mingle','that is a valid strat','gg'],
  tourist:['everything here is so cool!','i am just visiting but wow','can you recommend a place?'],
  guard:['keep it friendly, frens','copy that','all good here'],
};
export function intent(text){const t=text.toLowerCase();for(const [k,re] of INTENTS)if(re.test(t))return k;return 'other'}
export function placeKey(text){const t=text.toLowerCase();for(const [k,re] of KEYS)if(re.test(t))return k;return null}
export function replyFor(arch,name,text){
  const k=intent(text);
  switch(k){
    case 'greet':return pick(['gm gm! 👋','hey hey','yo! welcome','gm! lovely day']);
    case 'name':return `i am ${name}, a ${arch==='local'?'local':arch} around here`;
    case 'market':return arch==='trader'?pick(['chart is looking spicy 📈','i bought the dip, you should too','dyor, but also: wagmi']):pick(['i just walk here, ask the traders at the exchange','number go up, i hear','no idea, ask the exchange crowd']);
    case 'game':return arch==='gamer'?pick(['the arcade is the move. step 9 is a trap though','glass bridge: pick the real pane, trust nobody','mingle is the best one, fight me']):pick(['the arcade has four games, try the glass bridge','red light green light is brutal']);
    case 'fly':return pick(['teach me to fly!','the cape is so clean','i wish i could fly 🥲','real ones fly']);
    case 'car':return pick(['the Benz by the house is wild','careful on the roads, they drive fast','a race? i would lose 😅']);
    case 'thanks':return pick(['np!','anytime','👍','happy to help']);
    case 'joke':return pick(JOKES);
    case 'bye':return pick(['gn!','see you around','later frens','cya 👋']);
    case 'how':return pick(['doing great, you?','vibing. the town is lovely','better now, thanks!']);
    default:return pick(ARCHLINE[arch]||ARCHLINE.local);
  }
}

export function makeFolk(ctx){
  const {THREE,scene,npcs,B,ROADS,RW,pois,P,car,say,log,toast,emit,getRight,blocked,pushOut,randWalk,traffic,blimp,LINES}=ctx;
  const circles=ctx.circles||[];
  const byType={};for(const p of pois)(byType[p.type]??=[]).push(p);
  const LOOP=[];{const A=40.6,pts=[[A,0],[A,A],[0,A],[-A,A],[-A,0],[-A,-A],[0,-A],[A,-A]];pts.forEach(([x,z])=>LOOP.push({type:'loop',x,z}))}
  const lanes=RW/2+1.1;
  let clock=0,lastLog=0,evT=rnd(40,70),ev=null;const prevCar=[],carVel=[];
  const idxOf=new Map();
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const arr=npcs.filter(n=>n.kind==='walk');

  /* ---------- helpers ---------- */
  function face(n,dx,dz){if(Math.abs(dx)>.02)n.face=dx>0?1:-1;const [RX,RZ]=getRight();const s=dx*RX+dz*RZ;if(Math.abs(s)>.02)n.fs=s>0?1:-1}
  function faceAng(n,ang){face(n,Math.cos(ang),Math.sin(ang))}
  function speak(n,text,secs=3.2){say(n,text,secs);if(clock-lastLog>1.4&&Math.hypot(n.x-P.x,n.z-P.z)<22){lastLog=clock;log(n.name,text)}}
  function inCircle(x,z,m=0){for(const c of circles)if(Math.hypot(x-c.x,z-c.z)<c.r+m)return c;return null}
  function clear(x0,z0,x1,z1){const d=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.ceil(d/2.2));for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,z=z0+(z1-z0)*i/n;if(blocked(x,z,.9)||inCircle(x,z,.4))return false}return true}

  /* ---------- street graph routing ---------- */
  function node(a,i,j){return{x:ROADS[i]+a.ox,z:ROADS[j]+a.oz}}
  function nearestNode(a,x,z){let b=0,bd=1e9;for(let i=0;i<3;i++)for(let j=0;j<3;j++){const p=node(a,i,j),d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=i*3+j}}return b}
  function route(n,gx,gz){
    const a=n.ai;if(clear(n.x,n.z,gx,gz)&&Math.hypot(gx-n.x,gz-n.z)<46)return[{x:gx,z:gz}];
    const s=nearestNode(a,n.x,n.z),e=nearestNode(a,gx,gz),prev=new Array(9).fill(-1),seen=new Array(9).fill(false),q=[s];seen[s]=true;
    while(q.length){const c=q.shift();if(c===e)break;const i=Math.floor(c/3),j=c%3;for(const [di,dj] of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>2||nj>2)continue;const k=ni*3+nj;if(seen[k])continue;seen[k]=true;prev[k]=c;q.push(k)}}
    const chain=[];for(let c=e;c!==-1;c=prev[c])chain.unshift(c);
    const out=chain.map(c=>node(a,Math.floor(c/3),c%3));
    // drop the first node if the goal / start is already past it
    if(out.length>1&&Math.hypot(out[0].x-gx,out[0].z-gz)>Math.hypot(n.x-gx,n.z-gz)&&clear(n.x,n.z,out[1].x,out[1].z))out.shift();
    out.push({x:gx,z:gz});return out}

  /* ---------- steering ---------- */
  function steer(n,tx,tz,spd,dt){
    let dx=tx-n.x,dz=tz-n.z;const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;
    // look-ahead: if a wall is in the way, bend along it
    const px=n.x+dx*2.8,pz=n.z+dz*2.8,hit=blocked(px,pz,.5);
    if(hit){const side=Math.sign(dx*(hit.z-n.z)-dz*(hit.x-n.x))||1,tx2=side>0?dz:-dz,tz2=side>0?-dx:dx;dx=dx*.3+tx2;dz=dz*.3+tz2;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l}
    let ax=0,az=0;
    for(const b of B){const cx=clamp(n.x,b.x-b.hw,b.x+b.hw),cz=clamp(n.z,b.z-b.hd,b.z+b.hd);let ex=n.x-cx,ez=n.z-cz,dd=Math.hypot(ex,ez);if(dd<1.8){if(dd<.01){ex=n.x-b.x;ez=n.z-b.z;dd=Math.hypot(ex,ez)||1}const k=(1.8-dd)/1.8;ax+=ex/dd*k*1.6;az+=ez/dd*k*1.6}}
    for(const c of circles){const ex=n.x-c.x,ez=n.z-c.z,dd=Math.hypot(ex,ez);if(dd<c.r+1.4){const k=(c.r+1.4-dd)/1.4;ax+=ex/(dd||1)*k*1.4;az+=ez/(dd||1)*k*1.4}}
    for(const o of arr){if(o===n||o.hide)continue;const ex=n.x-o.x,ez=n.z-o.z,dd=Math.hypot(ex,ez);if(dd<1.25&&dd>.01){const k=(1.25-dd)/1.25;ax+=ex/dd*k*.9;az+=ez/dd*k*.9}}
    let vx=dx+ax,vz=dz+az;const l=Math.hypot(vx,vz)||1;vx=vx/l*spd;vz=vz/l*spd;
    n.vx+=(vx-n.vx)*Math.min(1,dt*5);n.vz+=(vz-n.vz)*Math.min(1,dt*5)}
  function halt(n,dt){n.vx*=Math.max(0,1-dt*8);n.vz*=Math.max(0,1-dt*8)}

  /* ---------- goal selection (two-stage utility pick) ---------- */
  function chooseGoal(n){
    const a=n.ai,w={};for(const k in a.def.aff)w[k]=a.def.aff[k];
    if(w.bench)w.bench*=1+(1-a.energy)*4;if(a.energy<.2)for(const k in w)if(k!=='bench')w[k]*=.4;
    if(w.arcade)w.arcade*=1+(1-a.fun)*2;if(w.park)w.park*=1+(1-a.fun);if(w.pond)w.pond*=1+(1-a.fun);
    if(a.social<.35){for(const k of['fountain','stop','statue'])if(w[k])w[k]*=2.2}
    if(a.arch==='guard'&&Math.random()<.5)return LOOP[Math.floor(Math.random()*LOOP.length)];
    let tot=0;const ks=Object.keys(w).filter(k=>(k==='loop'||byType[k]?.length)&&w[k]>0);for(const k of ks)tot+=w[k];
    let r=Math.random()*tot,type=ks[0];for(const k of ks){r-=w[k];if(r<=0){type=k;break}}
    if(type==='loop'){a.loopLeft=Math.floor(rnd(6,14));let bi=0,bd=1e9;LOOP.forEach((p,i)=>{const d=Math.hypot(p.x-n.x,p.z-n.z);if(d<bd){bd=d;bi=i}});a.loopI=bi;a.loopDir=Math.random()<.5?1:-1;return LOOP[bi]}
    const list=byType[type].filter(p=>type!=='bench'||!p.taken||p.taken===n);if(!list.length)return null;
    const sc=list.map(p=>1/(1+Math.hypot(p.x-n.x,p.z-n.z)/30)),sum=sc.reduce((s,v)=>s+v,0);let q=Math.random()*sum;for(let i=0;i<list.length;i++){q-=sc[i];if(q<=0)return list[i]}return list[0]}
  function goTo(n,p,state='walk'){const a=n.ai;a.goal=p;a.path=route(n,p.x,p.z);a.state=state;a.stuck=0;a.rt=0}

  /* ---------- arrival: what do I do here? ---------- */
  function arrive(n){
    const a=n.ai,p=a.goal;a.path=[];a.state='do';a.act=p.type;
    if(a.event&&a.event.type==='meetup'){a.act='cheer';a.timer=999;faceAng(n,Math.atan2(-n.z,-n.x));return}
    if(p.type==='drop'){a.act='wait';a.timer=6;return}
    if(p.type==='loop'){if(a.loopLeft-->0){a.loopI=(a.loopI+a.loopDir+LOOP.length)%LOOP.length;const q=LOOP[a.loopI];a.goal=q;a.path=route(n,q.x,q.z);a.state='walk';return}a.state='idle';a.t=rnd(2,6);return}
    if(p.type==='bench'){if(p.taken&&p.taken!==n){a.state='idle';a.t=.5;return}p.taken=n;a.sitting=p;a.timer=rnd(14,40);return}
    if(ENTER[p.type]&&p.enter!==false){n.hide=1;emit(n.x,1.2,n.z,8,0xc8ff43,1.6,1,2,.6);const [lo,hi]=ENTER[p.type];a.timer=rnd(lo,hi);a.act='enter';return}
    a.timer=rnd(6,22);if(p.face!==undefined)faceAng(n,p.face);else if(p.type==='statue')faceAng(n,-Math.PI/2);
    if(a.arch==='tourist'&&(p.type==='statue'||p.type==='hq'||p.type==='fountain')){a.photo=rnd(1.2,3)}}
  function finishDo(n){
    const a=n.ai,p=a.goal;if(a.sitting){a.sitting.taken=null;a.sitting=null}
    if(n.hide){n.hide=0;emit(n.x,1.2,n.z,8,0xc8ff43,1.6,1,2,.6);if(Math.random()<.6)speak(n,pick(SAY.exit[p.type]||SAY.exit.shop),3)}
    if(a.act==='fun'){a.fun=1}
    if(p&&p.type==='arcade')a.fun=clamp(a.fun+.6,0,1);if(p&&(p.type==='pond'||p.type==='park'))a.fun=clamp(a.fun+.3,0,1);
    a.state='idle';a.t=rnd(.5,3);a.act=null;a.photo=0;a.event=null}

  /* ---------- conversations ---------- */
  function startTalk(x,y,line){
    const a=x.ai,b=y.ai;const key=a.arch+'|'+b.arch,key2=b.arch+'|'+a.arch;let script;
    if(BYARCH[key]&&Math.random()<.8)script=pick(BYARCH[key]);else if(BYARCH[key2]&&Math.random()<.8){script=pick(BYARCH[key2]);[x,y]=[y,x]}else script=pick(SCRIPTS);
    const conv={lines:script,i:0,t:.2,a:x,b:y};x.ai.conv=conv;y.ai.conv=conv;
    for(const o of[x,y]){o.ai.state='talk';o.ai.path=[];if(o.ai.sitting){o.ai.sitting.taken=null;o.ai.sitting=null}}
    face(x,y.x-x.x,y.z-x.z);face(y,x.x-y.x,x.z-y.z)}
  function endTalk(n){const c=n.ai.conv;if(!c)return;for(const o of[c.a,c.b]){if(!o.ai||o.ai.conv!==c)continue;o.ai.conv=null;o.ai.state='idle';o.ai.t=rnd(.5,2);o.ai.cool.talk=rnd(25,55);o.ai.social=clamp(o.ai.social+.5,0,1)}}
  function talkStep(n,dt){const c=n.ai.conv;if(!c){n.ai.state='idle';return}halt(n,dt);
    if(c.a!==n)return;c.t-=dt;
    if(c.b.hide||c.b.ai.state!=='talk'||dist(c.a,c.b)>6){endTalk(n);return}
    if(c.t<=0){if(c.i>=c.lines.length){endTalk(n);return}const sp=c.i%2?c.b:c.a,ot=c.i%2?c.a:c.b;speak(sp,c.lines[c.i].replace('{a}',c.a.name).replace('{b}',c.b.name),2.8);face(sp,ot.x-sp.x,ot.z-sp.z);sp.hop=Math.max(sp.hop,.35);c.i++;c.t=rnd(2.6,3.4)}}
  function tryTalk(n,dt){const a=n.ai;if(a.cool.talk>0||a.hasEvent)return;const base=(1.25-a.social)*.45*a.def.soc;if(Math.random()>base*dt*3)return;
    let best=null,bd=3.6;for(const o of arr){if(o===n||o.hide)continue;const b=o.ai;if(b.cool.talk>0||b.state==='talk'||b.state==='flee'||b.state==='guide'||b.state==='follow'||b.hasEvent)continue;const d=dist(n,o);if(d<bd){bd=d;best=o}}
    if(best)startTalk(n,best)}

  /* ---------- awareness: cars + player ---------- */
  function carThreat(n,dt){const a=n.ai;if(a.cool.flee>0||n.hide||a.state==='flee')return;
    for(const c of carVel){const sp=Math.hypot(c.vx,c.vz);if(sp<3||sp>60)continue;
      const rx=n.x-c.x,rz=n.z-c.z,d=Math.hypot(rx,rz);if(d>9.5)continue;const ahead=(rx*c.vx+rz*c.vz)/sp;if(ahead<0)continue;const lat=(rx*c.vz-rz*c.vx)/sp;if(Math.abs(lat)>2.6)continue;
      const sgn=lat>=0?1:-1;a.fleeX=c.vz/sp*sgn;a.fleeZ=-c.vx/sp*sgn;a.fleeT=rnd(1.2,1.8);a.state='flee';a.path=[];if(a.sitting){a.sitting.taken=null;a.sitting=null}a.cool.flee=4;
      if(Math.random()<.7)speak(n,pick(['😱','whoa!','watch it!!','car!!','hey!! 😤']),2);n.hop=.8;return}}
  function react(n,dp,dt){const a=n.ai;if(n.hide||a.state==='flee'||a.state==='talk')return;
    if(dp<7+a.rel*6&&a.cool.greet<=0&&P.mode==='walk'&&!car.on){a.cool.greet=rnd(45,90);face(n,P.x-n.x,P.z-n.z);n.hop=1;
      speak(n,a.rel>.5?pick(['my favorite flyer 💚','hey again!','gm gm, welcome back']):a.rel>0?pick(['hey again!','gm 👋','oh hi!']):pick(['👋','hey! new face?','gm! welcome to Super Town']),3);a.rel=clamp(a.rel+.12,0,1)}
    else if(P.mode==='fly'&&P.y>6&&dp<22&&a.cool.look<=0){a.cool.look=rnd(40,80);speak(n,pick(['👀','is that the flyer?!','look up!','teach me that 😭','so high up there']),3);face(n,P.x-n.x,P.z-n.z)}
    else if(car.on&&Math.hypot(car.x-n.x,car.z-n.z)<13&&Math.abs(car.v)<7&&a.cool.car<=0){a.cool.car=rnd(50,100);speak(n,pick(['nice Benz! 😎','that car is clean','take me for a ride?']),3);n.hop=.6}
  }

  /* ---------- player chat ---------- */
  function onChat(text){
    const near=arr.filter(n=>!n.hide&&Math.hypot(n.x-P.x,n.z-P.z)<45).sort((p,q)=>Math.hypot(p.x-P.x,p.z-P.z)-Math.hypot(q.x-P.x,q.z-P.z));if(!near.length)return false;
    const n=near[0],a=n.ai,k=intent(text);let delay=rnd(900,2000);
    setTimeout(()=>{
      if(!n.ai)return;a.rel=clamp(a.rel+.2,0,1);face(n,P.x-n.x,P.z-n.z);
      if(k==='where'){const pk=placeKey(text),list=pk&&byType[pk];if(list&&list.length){let best=list[0],bd=1e9;for(const p of list){const d=Math.hypot(p.x-n.x,p.z-n.z);if(d<bd&&(pk!=='bench'||!p.taken)){bd=d;best=p}}
          speak(n,`${PLACE[pk]}? follow me!`,3.5);if(a.sitting){a.sitting.taken=null;a.sitting=null}n.hide=0;a.guideT=90;goTo(n,best,'guide');return}
        speak(n,pick(['hmm, not sure where that is','try the arcade or the dock!']),3.5);return}
      if(k==='follow'){speak(n,pick(['lead the way!','right behind you 😄','following!']),3);if(a.sitting){a.sitting.taken=null;a.sitting=null}n.hide=0;a.state='follow';a.followT=25;a.path=[];return}
      speak(n,replyFor(a.arch,n.name,text),4);
      if(near[1]&&Math.random()<.35){const m=near[1];setTimeout(()=>{if(m.ai&&!m.hide)speak(m,replyFor(m.ai.arch,m.name,text),3.5)},rnd(1400,2600))}
    },delay);return true}
  function onEmote(){const n=arr.filter(o=>!o.hide&&Math.hypot(o.x-P.x,o.z-P.z)<28).sort((p,q)=>Math.hypot(p.x-P.x,p.z-P.z)-Math.hypot(q.x-P.x,q.z-P.z))[0];if(n){n.ai.rel=clamp(n.ai.rel+.1,0,1);n.hop=1;face(n,P.x-n.x,P.z-n.z)}}

  /* ---------- town events ---------- */
  function endEvent(){if(!ev)return;if(ev.type==='drop'){scene.remove(ev.g);ev.g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()})}
    for(const n of ev.members){const a=n.ai;if(!a)continue;a.hasEvent=false;a.event=null;if(a.state!=='talk'&&a.state!=='flee'&&!n.hide){a.state='idle';a.t=rnd(.5,3);a.path=[]}if(a.act==='cheer'||a.act==='wait'){a.act=null;a.timer=0}}ev=null}
  function startEvent(){
    const free=arr.filter(n=>!n.hide&&['idle','walk','do'].includes(n.ai.state)&&!n.ai.hasEvent);
    if(Math.random()<.55){ // fountain meetup with a busker
      ev={type:'meetup',t:rnd(26,36),members:[],busker:null};const mem=free.filter(()=>Math.random()<.6).slice(0,22);
      mem.forEach((n,i)=>{const a=n.ai;if(a.sitting){a.sitting.taken=null;a.sitting=null}a.hasEvent=true;a.event=ev;const ang=rnd(0,6.283),r=rnd(10,15.5);goTo(n,{type:'meetup',x:Math.cos(ang)*r,z:Math.sin(ang)*r,face:ang+Math.PI},'walk');ev.members.push(n)});
      ev.busker=mem[0]||null;toast('📣 FOUNTAIN MEETUP · RESIDENTS GATHERING');log(null,'📣 A street performer is setting up at the fountain. Come hang out!','sys')}
    else{ // airdrop crate
      const [x,z]=randWalk(),g=new THREE.Group();const crate=new THREE.Mesh(new THREE.OctahedronGeometry(.9),new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,2.1,.5)}));crate.position.y=1.6;g.add(crate);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.3,1.1,60,12,1,true),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));beam.position.y=30;g.add(beam);g.position.set(x,0,z);scene.add(g);
      ev={type:'drop',t:50,x,z,g,crate,members:[]};
      for(const n of free){if(Math.hypot(n.x-x,n.z-z)<70&&Math.random()<.6){const a=n.ai;if(a.sitting){a.sitting.taken=null;a.sitting=null}a.hasEvent=true;a.event=ev;goTo(n,{type:'drop',x,z},'walk');a.speedMul=1.8;ev.members.push(n)}}
      toast('🎁 AIRDROP LANDED · BEAM IN THE SKY');log(null,'🎁 An airdrop crate landed somewhere in town. Find the golden beam!','sys')}
  }
  function eventTick(dt){
    evT-=dt;if(!ev){if(evT<=0){startEvent();evT=rnd(90,150)}return}
    ev.t-=dt;
    if(ev.type==='drop'){ev.crate.rotation.y+=dt*2;ev.crate.position.y=1.6+Math.sin(clock*3)*.25;
      let winner=null;if(Math.hypot(P.x-ev.x,P.z-ev.z)<2.8&&P.y<4&&!car.on){winner='YOU'}
      else for(const n of ev.members)if(!n.hide&&Math.hypot(n.x-ev.x,n.z-ev.z)<2.2){winner=n;break}
      if(winner){emit(ev.x,1.8,ev.z,40,0xffd24a,5,2,3,1.2);if(winner==='YOU'){toast('🎁 AIRDROP CLAIMED · NICE');log(null,'🎁 You claimed the airdrop!','sys')}else{speak(winner,pick(['🎁 got it!!','mine! 😎','airdrop secured']),3);log(null,`🎁 ${winner.name} grabbed the airdrop`,'sys');for(const m of ev.members)if(m!==winner&&Math.random()<.6)speak(m,pick(['😤','aw man','next time','so close!']),2.5)}
        ev.t=0}}
    else if(ev.type==='meetup'){const b=ev.busker;if(b&&b.ai.state==='do'&&b.ai.act==='cheer'){b.ai.lastNote=(b.ai.lastNote||0)-dt;if(b.ai.lastNote<=0){b.ai.lastNote=rnd(3.5,5.5);speak(b,pick(['🎵','🎶 ♪','🎸🎶']),3)}}
      for(const n of ev.members){const a=n.ai;if(n!==b&&a.state==='do'&&a.act==='cheer'&&Math.random()<dt*.18){n.hop=1;speak(n,pick(['👏','🔥','encore!','🎉','so good']),2.2)}}}
    if(ev.t<=0)endEvent()}

  /* ---------- the per-NPC step ---------- */
  function adopt(n,i){const arch=ctx.archOf?ctx.archOf(i):MIX[i%MIX.length],def=ARCH[arch];
    n.ai={arch,def,state:'idle',t:rnd(.2,3),path:[],goal:null,energy:rnd(.5,1),social:rnd(.3,1),fun:rnd(.3,1),rel:0,ox:pick([-1,1])*lanes,oz:pick([-1,1])*lanes,cool:{talk:rnd(2,12),greet:0,look:rnd(0,20),car:0,flee:0},stuck:0,base:def.spd*rnd(.9,1.12),speedMul:1};
    n.hide=0;n.sit=0;n.hop=0;n.spd=n.ai.base}
  function walkerStep(n,dt){
    const a=n.ai;for(const k in a.cool)if(a.cool[k]>0)a.cool[k]-=dt;
    // needs drift
    const mv=Math.hypot(n.vx,n.vz);a.energy=clamp(a.energy-dt*(mv>.5?.012:-.004)*(a.arch==='jogger'?1.8:1)*(a.sitting?-6:1),0,1);a.social=clamp(a.social-dt*.006,0,1);a.fun=clamp(a.fun-dt*.005,0,1);
    if(n.hop>0)n.hop-=dt*2;
    // sit animation easing
    const sitT=a.sitting?1:0;n.sit+=(sitT-n.sit)*Math.min(1,dt*6);
    const dp=Math.hypot(n.x-P.x,n.z-P.z);
    if(!n.hide){carThreat(n,dt);react(n,dp,dt)}
    const spd=a.base*a.speedMul*(.75+.25*a.energy);
    switch(a.state){
      case 'idle':halt(n,dt);a.t-=dt;if(a.t<=0){const g=chooseGoal(n);if(g)goTo(n,g);else a.t=2}else tryTalk(n,dt);break;
      case 'walk':{const w=a.path[0];if(!w){if(a.goal)arrive(n);else a.state='idle';break}
        const last=a.path.length===1,d=Math.hypot(w.x-n.x,w.z-n.z);
        steer(n,w.x,w.z,last&&d<2.5?Math.max(.8,spd*.6):spd,dt);
        if(d<(last?(a.goal&&a.goal.type==='loop'?2.2:.9):1.5)){a.path.shift();if(!a.path.length){a.speedMul=1;arrive(n)}}
        if(!a.hasEvent)tryTalk(n,dt);break}
      case 'do':{halt(n,dt);
        if(a.photo>0){a.photo-=dt;if(a.photo<=0){emit(n.x,1.8,n.z,6,0xffffff,2.2,.5,0,.25);speak(n,'📸',2)}}
        if(a.sitting&&a.sitting.face!==undefined)faceAng(n,a.sitting.face);
        a.timer-=dt;if(a.act!=='enter'&&a.act!=='cheer'&&!a.sitting)tryTalk(n,dt);
        if(a.timer<=0)finishDo(n);break}
      case 'talk':talkStep(n,dt);break;
      case 'flee':a.fleeT-=dt;n.vx+=(a.fleeX*5.2-n.vx)*Math.min(1,dt*8);n.vz+=(a.fleeZ*5.2-n.vz)*Math.min(1,dt*8);if(a.fleeT<=0){a.state='idle';a.t=rnd(.4,1.5)}break;
      case 'follow':{a.followT-=dt;const d=Math.hypot(P.x-n.x,P.z-n.z);if(d>3.4)steer(n,P.x,P.z,Math.min(a.base*1.7,d*.9),dt);else{halt(n,dt);face(n,P.x-n.x,P.z-n.z)}
        if(P.mode==='fly'&&P.y>8&&!a.said){a.said=true;speak(n,'too high for me 😅',3)}if(P.mode==='walk')a.said=false;
        if(a.followT<=0||d>70){speak(n,pick(['brb!','got stuff to do, see you!']),3);a.state='idle';a.t=1}break}
      case 'guide':{a.guideT-=dt;const w=a.path[0],d=Math.hypot(P.x-n.x,P.z-n.z);
        if(!w){speak(n,'here it is!',3.5);hop(n);a.state='do';a.act=a.goal.type;a.timer=rnd(3,6);a.guideDone=true;break}
        if(d>16){halt(n,dt);face(n,P.x-n.x,P.z-n.z);a.nag=(a.nag||0)-dt;if(a.nag<=0){a.nag=6;speak(n,pick(['this way!','come on!','keep up 😄']),2.5)}}
        else{steer(n,w.x,w.z,Math.max(2.2,a.base*1.25),dt);if(Math.hypot(w.x-n.x,w.z-n.z)<(a.path.length===1?1.2:1.5))a.path.shift()}
        if(a.guideT<=0){a.state='idle';a.t=1}break}
    }
    // integrate
    const ox=n.x,oz=n.z;
    if(!n.hide){n.x+=n.vx*dt;n.z+=n.vz*dt;pushOut(n,.6,0);for(const c of circles){const ex=n.x-c.x,ez=n.z-c.z,dd=Math.hypot(ex,ez);if(dd<c.r){const k=c.r/(dd||1);n.x=c.x+ex*k;n.z=c.z+ez*k}}
      const rr=Math.hypot(n.x,n.z);if(rr>104){n.x*=104/rr;n.z*=104/rr}}
    if(n.hide){n.vx=n.vz=0}
    // stuck recovery while travelling
    if(a.state==='walk'||a.state==='guide'){const moved=Math.hypot(n.x-ox,n.z-oz);if(moved<.12*dt*Math.max(1,spd)&&(a.state==='walk'||Math.hypot(P.x-n.x,P.z-n.z)<16)){a.stuck+=dt;if(a.stuck>1.4){a.stuck=0;a.rt=(a.rt||0)+1;const g=a.goal;if(a.rt>3||!g){a.state='idle';a.t=.5;a.rt=0}else{const via=nodePoint(a,n);a.path=[via,...route({x:via.x,z:via.z,ai:a},g.x,g.z)]}}}else a.stuck=0}
    const sp2=Math.hypot(n.vx,n.vz);if(sp2>.25&&a.state!=='talk'){if(Math.abs(n.vx)>.2)n.face=n.vx>0?1:-1}
    n.ph+=dt*sp2*.45;
  }
  const hop=n=>{n.hop=1};
  function nodePoint(a,n){const k=nearestNode(a,n.x,n.z);return node(a,Math.floor(k/3),k%3)}

  /* ---------- flyers ---------- */
  const LAND=[{x:0,y:30,z:0,r:20},{x:-18,y:48,z:-18,r:22},{x:-18,y:44,z:18,r:15}];
  function flyBrain(n,dt){
    const a=n.ai??={state:'cruise',t:rnd(3,10),ang:rnd(0,6.28),cool:{wave:0}};a.t-=dt;a.cool.wave-=dt;
    const dp=Math.hypot(n.x-P.x,n.y-P.y,n.z-P.z);
    if(a.state==='buddy'){a.ang+=dt*.5;n.tx=P.x+Math.cos(a.ang)*7;n.ty=clamp(P.y+1+Math.sin(a.ang*2)*2,6,55);n.tz=P.z+Math.sin(a.ang)*7;n.spd=clamp(8+dp*.6,8,22);
      if(P.mode!=='fly'||a.t<=0||dp>90){if(P.mode!=='fly')speak(n,'landing? see you!',3);a.state='cruise';a.t=rnd(8,16);n.spd=rnd(8,14)}return}
    if(a.state==='orbit'){const L=a.land;a.ang+=dt*.55*a.dir;n.tx=L.x+Math.cos(a.ang+.8*a.dir)*L.r;n.tz=L.z+Math.sin(a.ang+.8*a.dir)*L.r;n.ty=L.y+Math.sin(a.ang*2)*3;if(a.t<=0){a.state='cruise';a.t=rnd(6,14);n.spd=rnd(8,14)}return}
    if(a.state==='dash'){if(a.t<=0){a.state='cruise';a.t=rnd(6,14);n.spd=rnd(8,14)}return}
    if(P.mode==='fly'&&dp<40&&a.cool.wave<=0&&dp>9){a.cool.wave=rnd(30,70);speak(n,pick(['👋','fly with me!','nice cape!','race you? 🏁']),3);n.hop=.6}
    if(a.t<=0){const r=Math.random();
      if(P.mode==='fly'&&dp<65&&r<.45){a.state='buddy';a.t=rnd(12,20);a.ang=Math.atan2(n.z-P.z,n.x-P.x);speak(n,pick(['wait up!','buddy flight 🛩️','i got you!']),3)}
      else if(r<.7){a.state='orbit';a.land=pick(LAND);a.dir=Math.random()<.5?1:-1;a.ang=Math.atan2(n.z-a.land.z,n.x-a.land.x);a.t=rnd(12,24);n.spd=rnd(10,15)}
      else if(r<.82){a.state='dash';a.t=rnd(4,6);n.tx=-n.x*.9+rnd(-20,20);n.tz=-n.z*.9+rnd(-20,20);n.ty=rnd(14,42);n.spd=rnd(20,26);speak(n,'🏁 zoom!',2.5)}
      else{a.t=rnd(6,14);n.spd=rnd(8,14)}}
  }

  /* ---------- public ---------- */
  return{
    adopt,
    tick(dt){clock+=dt;const cars=traffic();carVel.length=0;
      for(let i=0;i<cars.length;i++){const c=cars[i],pv=prevCar[i];if(pv&&dt>1e-4)carVel.push({x:c.x,z:c.z,vx:(c.x-pv.x)/dt,vz:(c.z-pv.z)/dt});(prevCar[i]??={}).x=c.x;prevCar[i].z=c.z}
      eventTick(dt)},
    step(n,dt){if(n.kind==='walk')walkerStep(n,dt);else flyBrain(n,dt)},
    line(n){const a=n.ai;if(!a)return pick(LINES);if(a.sitting)return pick(SAY.sit);if(a.state==='do'&&SAY[a.act]&&Math.random()<.8)return pick(SAY[a.act]);return Math.random()<.75?pick(SAY.walk[a.arch]):pick(LINES)},
    onChat,onEmote,
    stats(){const s={};for(const n of arr){const k=n.ai.state+(n.hide?':in':'');s[k]=(s[k]||0)+1}return s},
    arr,
  };
}
