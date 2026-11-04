/* Super Benz engine: a WebAudio engine that revs with throttle and shifts through five gears.
   Browsers only allow sound after a user gesture, so the audio context starts on the first key press. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// five gears, each covering a band of road speed; the rpm climbs through a band and drops on the shift
const BANDS=[[0,3.5],[2.5,6.5],[5.5,9.5],[8.5,13],[12,18]];
export function gearRpm(speed,throttle){
  const sp=Math.max(0,speed);let g=0;
  for(let i=0;i<BANDS.length;i++)if(sp>=BANDS[i][0])g=i;
  const[lo,hi]=BANDS[g];
  const frac=clamp((sp-lo)/(hi-lo),0,1);
  return{gear:g+1,rpm:clamp(900+frac*5200+clamp(throttle,0,1)*900,900,7000)};
}

export function createEngine(){
  let ctx=null,master=null,osc=null,osc2=null,filt=null,ng=null,nOn=false;
  function ensure(){
    if(ctx)return true;
    const AC=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
    if(!AC)return false;
    ctx=new AC();
    master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    filt=ctx.createBiquadFilter();filt.type='lowpass';filt.Q.value=3;filt.frequency.value=600;filt.connect(master);
    // main pulse (sawtooth) plus a square an octave down for the body
    osc=ctx.createOscillator();osc.type='sawtooth';osc.frequency.value=50;
    const g1=ctx.createGain();g1.gain.value=.3;osc.connect(g1);g1.connect(filt);osc.start();
    osc2=ctx.createOscillator();osc2.type='square';osc2.frequency.value=25;
    const g2=ctx.createGain();g2.gain.value=.14;osc2.connect(g2);g2.connect(filt);osc2.start();
    // exhaust roar: looping noise through a band-pass
    const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=320;bp.Q.value=.9;
    ng=ctx.createGain();ng.gain.value=.1;src.connect(bp);bp.connect(ng);ng.connect(filt);src.start();nOn=true;
    return true;
  }
  return{
    resume(){if(ensure()&&ctx.state==='suspended')ctx.resume()},
    // call every frame: speed in road units/s, throttle 0..1, on = engine running and sound enabled
    update(dt,speed,throttle,on){
      if(!ctx)return;
      const{rpm}=gearRpm(speed,throttle);const t=ctx.currentTime;
      master.gain.setTargetAtTime(on?.16+clamp(throttle,0,1)*.2:0,t,.06);
      osc.frequency.setTargetAtTime(rpm/60*3,t,.03);
      osc2.frequency.setTargetAtTime(rpm/60*1.5,t,.03);
      filt.frequency.setTargetAtTime(380+clamp(throttle,0,1)*1600+rpm/9,t,.05);
      ng.gain.setTargetAtTime(.06+clamp(throttle,0,1)*.14,t,.05);
    }
  };
}
