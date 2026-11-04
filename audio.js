/* Super Benz engine: layered and distorted, so it growls on the way up and crackles when you lift off.
   Five gears: the rpm climbs through each band and drops on the shift, and the engine dips for a moment on each shift.
   Browsers only allow sound after a user gesture, so the audio context starts on the first key press. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const BANDS=[[0,3.5],[2.5,6.5],[5.5,9.5],[8.5,13],[12,18]];
export function gearRpm(speed,throttle){
  const sp=Math.max(0,speed);let g=0;
  for(let i=0;i<BANDS.length;i++)if(sp>=BANDS[i][0])g=i;
  const[lo,hi]=BANDS[g];
  const frac=clamp((sp-lo)/(hi-lo),0,1);
  return{gear:g+1,rpm:clamp(900+frac*5200+clamp(throttle,0,1)*900,900,7000)};
}

function driveCurve(k){
  const n=1024,c=new Float32Array(n);
  for(let i=0;i<n;i++){const x=i*2/n-1;c[i]=Math.tanh(k*x)/Math.tanh(k)}
  return c;
}

export function createEngine(){
  let ctx=null,master=null,dry=null,filt=null,drive=null,roar=null,roarF=null,roarG=null,o1=null,o2=null,o3=null,lfo=null,lfoG=null;
  let noiseSrc=null,crackG=null,lastGear=1,lastThr=0,noiseBuf=null,shiftT=0;
  function ensure(){
    if(ctx)return true;
    const AC=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
    if(!AC)return false;
    ctx=new AC();
    master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    // engine body -> lowpass -> soft distortion -> master
    drive=ctx.createWaveShaper();drive.curve=driveCurve(3.2);drive.oversample='2x';
    filt=ctx.createBiquadFilter();filt.type='lowpass';filt.Q.value=5;filt.frequency.value=500;
    dry=ctx.createGain();dry.gain.value=.5;
    filt.connect(drive);drive.connect(dry);dry.connect(master);
    // three oscillators: two detuned sawtooths for the main roar, and a square an octave down for weight
    o1=ctx.createOscillator();o1.type='sawtooth';o1.frequency.value=50;
    o2=ctx.createOscillator();o2.type='sawtooth';o2.frequency.value=50;o2.detune.value=9;
    o3=ctx.createOscillator();o3.type='square';o3.frequency.value=25;
    const g1=ctx.createGain();g1.gain.value=.22;const g2=ctx.createGain();g2.gain.value=.18;const g3=ctx.createGain();g3.gain.value=.12;
    o1.connect(g1);o2.connect(g2);o3.connect(g3);g1.connect(filt);g2.connect(filt);g3.connect(filt);
    // slow wobble in the idle, so the engine is never perfectly flat
    lfo=ctx.createOscillator();lfo.frequency.value=5.5;lfoG=ctx.createGain();lfoG.gain.value=1.5;lfo.connect(lfoG);lfoG.connect(o1.frequency);
    o1.start();o2.start();o3.start();lfo.start();
    // exhaust roar: looping noise through a band-pass whose frequency follows the rpm
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    noiseSrc=ctx.createBufferSource();noiseSrc.buffer=noiseBuf;noiseSrc.loop=true;
    roarF=ctx.createBiquadFilter();roarF.type='bandpass';roarF.frequency.value=320;roarF.Q.value=.8;
    roarG=ctx.createGain();roarG.gain.value=.08;
    noiseSrc.connect(roarF);roarF.connect(roarG);roarG.connect(master);noiseSrc.start();
    // lift-off crackle: a short burst of noise through its own envelope
    crackG=ctx.createGain();crackG.gain.value=0;const cf=ctx.createBiquadFilter();cf.type='highpass';cf.frequency.value=1200;
    const cs=ctx.createBufferSource();cs.buffer=noiseBuf;cs.loop=true;cs.connect(cf);cf.connect(crackG);crackG.connect(master);cs.start();
    return true;
  }
  function burst(level){
    const t=ctx.currentTime;crackG.gain.cancelScheduledValues(t);crackG.gain.setValueAtTime(level,t);crackG.gain.exponentialRampToValueAtTime(.001,t+.09);
  }
  return{
    resume(){if(ensure()&&ctx.state==='suspended')ctx.resume()},
    // call every frame: speed in road units/s, throttle 0..1, on = engine running and sound enabled
    update(dt,speed,throttle,on){
      if(!ctx)return;
      const thr=clamp(throttle,0,1);const{rpm,gear}=gearRpm(speed,thr);const t=ctx.currentTime;
      // a gear change dips the engine briefly, like a real shift
      if(gear!==lastGear){lastGear=gear;shiftT=.14}
      shiftT=Math.max(0,shiftT-dt);
      const dip=shiftT>0?.35:1;
      master.gain.setTargetAtTime(on?(.14+thr*.22)*dip:0,t,.05);
      const f=rpm/60*3;      // six cylinders: three firing pulses per revolution
      o1.frequency.setTargetAtTime(f,t,.02);o2.frequency.setTargetAtTime(f*1.004,t,.02);o3.frequency.setTargetAtTime(f/2,t,.03);
      filt.frequency.setTargetAtTime(340+thr*2200+rpm/6,t,.04);
      filt.Q.setTargetAtTime(3+thr*3,t,.1);
      roarF.frequency.setTargetAtTime(220+rpm/12,t,.05);
      roarG.gain.setTargetAtTime(.05+thr*.16,t,.05);
      // lifting off at high rpm: crackle on the overrun
      if(on&&lastThr>.5&&thr<.2&&rpm>3200)burst(.12+rpm/60000);
      lastThr=thr;
    }
  };
}
