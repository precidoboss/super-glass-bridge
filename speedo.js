/* Speedometer for the Super Benz: a dial with speed, gear and an rpm bar. Shown only while you drive. */
export function createSpeedo(host){
  const style=document.createElement('style');
  style.textContent=`#twSpeedo{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:200px;pointer-events:none;color:#eaf7ed;font-family:system-ui,sans-serif;text-align:center;display:none;z-index:30;text-shadow:0 1px 6px #000}
#twSpeedo svg{width:200px;height:112px;overflow:visible;display:block}
#twSpeedo .num{font-size:40px;font-weight:800;margin-top:-38px;letter-spacing:.02em;text-shadow:0 0 14px #c8ff43}
#twSpeedo .unit{font-size:11px;letter-spacing:.22em;opacity:.75}
#twSpeedo .row{display:flex;justify-content:space-between;font-size:12px;margin:6px 6px 0;padding:0 6px}
#twSpeedo .rpm{height:6px;background:rgba(255,255,255,.14);border-radius:3px;margin:6px 10px 0;overflow:hidden}
#twSpeedo .rpm i{display:block;height:100%;width:0;background:linear-gradient(90deg,#c8ff43,#ff6b8a)}`;
  document.head.appendChild(style);
  const el=document.createElement('div');el.id='twSpeedo';
  el.innerHTML=`<svg viewBox="0 0 200 112"><path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="12" stroke-linecap="round"/><path class="arc" d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="#c8ff43" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg><div class="num">0</div><div class="unit">KM/H</div><div class="row"><span class="gear">GEAR 1</span><span class="rpmv">900 RPM</span></div><div class="rpm"><i></i></div>`;
  host.appendChild(el);
  const arc=el.querySelector('.arc'),num=el.querySelector('.num'),unit=el.querySelector('.unit'),gear=el.querySelector('.gear'),rpmv=el.querySelector('.rpmv'),bar=el.querySelector('.rpm i');
  let shown=false;
  return{
    show(on){if(on!==shown){shown=on;el.style.display=on?'block':'none'}},
    // kmh is the internal speed in km/h; units is 'kmh' or 'mph'
    set(kmh,units,g,rpm){
      const top=units==='mph'?160:260;
      const v=units==='mph'?kmh*.621:kmh;
      arc.setAttribute('stroke-dashoffset',String(100*(1-Math.min(v/top,1))));
      num.textContent=Math.round(v);unit.textContent=units==='mph'?'MPH':'KM/H';
      gear.textContent='GEAR '+g;rpmv.textContent=Math.round(rpm)+' RPM';
      bar.style.width=Math.min(rpm/7000,1)*100+'%';
    }
  };
}
