const enabledKey='payzapp-ipl-camera-enabled';
let enabled=false;
export function cameraPreferences(storage){
  if(storage===undefined)try{storage=globalThis.localStorage;}catch{storage=null;}
  const read=(key,fallback)=>{try{return storage?.getItem(key)??fallback;}catch{return fallback;}};
  const write=(key,value)=>{try{if(value===null)storage?.removeItem(key);else storage?.setItem(key,value);}catch{}};
  return {
    enabled:()=>read(enabledKey,enabled?'yes':'no')==='yes',
    remember:value=>{enabled=value;write(enabledKey,value?'yes':null);},
  };
}

// Camera constraints vary by device. Fill any unsupported part with a preview
// crop, without opening another stream or requesting extra PTZ permission.
export function createScannerZoom({video,track,onChange=()=>{}}){
  let disposed=false,desired=1,revision=0,work=null;
  const settings=()=>{try{return track?.getSettings?.()||{};}catch{return {};}};
  const capabilities=()=>{try{return track?.getCapabilities?.()||{};}catch{return {};}};
  async function drain(){
    while(!disposed){
      const token=revision,value=desired,range=capabilities().zoom;
      if(range&&Number.isFinite(range.min)&&Number.isFinite(range.max)&&range.max>=range.min&&track.applyConstraints){
        const step=range.step>0?range.step:0.1;
        const native=Math.min(range.max,Math.max(range.min,range.min+Math.round((value-range.min)/step)*step));
        try{await track.applyConstraints({...track.getConstraints?.(),advanced:[{zoom:native}]});}catch{/* Preview crop remains available. */}
      }
      if(disposed)return;
      if(token!==revision)continue;
      const reported=Number(settings().zoom),native=reported>0?reported:1;
      const crop=Math.max(1,value/native);
      video.style.transform=`scale(${crop})`;
      onChange({value,crop,native,mode:crop>1.01?'preview':'camera'});
      return;
    }
  }
  return {
    set(value){
      if(disposed)return Promise.resolve();
      desired=[1,2,3].includes(value)?value:1;revision++;
      if(!work)work=Promise.resolve().then(drain).finally(()=>{work=null;});
      return work;
    },
    dispose(){disposed=true;revision++;}
  };
}
