import React,{useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const anchors=[[-3.7,.8,1.2],[-.6,.8,-1.2],[-3.5,2.9,-2.6],[.1,1.3,2.9],[3.5,2,-1.8],[3.5,1.8,1.7],[1.1,1.9,-3.3],[-4.8,2.2,3.7]];
const initial=[9,9.2,11.2];
export function Site3D({points,selected,onSelect,ui,done}:{points:any[],selected:number,onSelect:(n:number)=>void,ui:any,done:string[]}){
 const mount=useRef<HTMLDivElement>(null), markerRefs=useRef<(HTMLButtonElement|null)[]>([]), controller=useRef<any>(null);
 const latest=useRef({onSelect,selected}); latest.current={onSelect,selected};
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const host=mount.current!;
  let renderer:T.WebGLRenderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{setFailed(true);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75)); renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
  renderer.domElement.setAttribute('aria-hidden','true');host.prepend(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#edf3f2');scene.fog=new T.Fog('#edf3f2',30,70);
  const camera=new T.PerspectiveCamera(36,1,.1,100);camera.position.set(...initial as [number,number,number]);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.5,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=11;controls.maxDistance=31;controls.maxPolarAngle=Math.PI*.47;controls.minPolarAngle=.2;controls.enablePan=false;
  scene.add(new T.HemisphereLight('#f4fcff','#716451',2.3));
  const sun=new T.DirectionalLight('#fff4d9',4);sun.position.set(-7,14,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.1,far:50});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun);
  const fill=new T.DirectionalLight('#b7dafa',1.2);fill.position.set(10,5,-10);scene.add(fill);
  const material=(color:string,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const mats={soil:material('#9c7253'),edge:material('#bd946c'),path:material('#d8c7a6'),leaf:material('#477945'),leaf2:material('#73a656'),stem:material('#53703b'),wood:material('#9a704d'),rubber:material('#292d31',.96),metal:material('#87949b',.27,.7),blue:material('#397d91',.39,.1),red:material('#cf6c47',.46,.12),cream:material('#f3ead5'),yellow:material('#e7bd5d'),glass:new T.MeshPhysicalMaterial({color:'#c7e4eb',transparent:true,opacity:.43,roughness:.15,metalness:.1,depthWrite:false})};
  const groundCanvas=document.createElement('canvas');groundCanvas.width=groundCanvas.height=256;const ctx=groundCanvas.getContext('2d')!;
  const pixels=ctx.createImageData(256,256);let seed=27;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<pixels.data.length;i+=4){const v=130+rand()*70;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
  const grain=new T.CanvasTexture(groundCanvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(6,4);mats.soil.bumpMap=grain;mats.soil.bumpScale=.07;mats.soil.roughnessMap=grain;mats.wood.bumpMap=grain;mats.wood.bumpScale=.012;
  function mesh(geometry:T.BufferGeometry,mat:T.Material,x=0,y=0,z=0,parent:T.Object3D=scene){const obj=new T.Mesh(geometry,mat);obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;}
  function box(w:number,h:number,d:number,mat:T.Material,x:number,y:number,z:number,parent:T.Object3D=scene,r=.055){return mesh(new RoundedBoxGeometry(w,h,d,2,r),mat,x,y,z,parent);}
  function cyl(rt:number,rb:number,h:number,mat:T.Material,x:number,y:number,z:number,parent:T.Object3D=scene){return mesh(new T.CylinderGeometry(rt,rb,h,24),mat,x,y,z,parent);}
  function ball(r:number,mat:T.Material,x:number,y:number,z:number,parent:T.Object3D=scene){return mesh(new T.SphereGeometry(r,16,12),mat,x,y,z,parent);}
  box(13,.8,9.5,mats.edge,0,-.5,0,scene,.32);box(12.85,.22,9.36,mats.soil,0,0,0,scene,.2);
  box(2.15,.025,9.1,mats.path,-2.8,.13,0,scene,.06);box(12.5,.025,1.5,mats.path,0,.15,3.15);
  // Plant leaves are rounded 3D forms, with irregular orientations and visible stems.
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
   const g=new T.Group();g.position.set(-.6+row*.64,.14,-3.55+col*.64);scene.add(g);cyl(.025,.035,.31,mats.stem,0,.12,0,g);
   for(let l=0;l<5;l++){let a=l*1.26+rand()*.4;let leaf=ball(.2,l%2?mats.leaf:mats.leaf2,Math.cos(a)*.12,.25+rand()*.12,Math.sin(a)*.12,g);leaf.scale.set(.66,.42,1.35);leaf.rotation.set(.3,a,.28);}
  }
  for(let j=0;j<55;j++){const stone=ball(.035+rand()*.04,mats.edge,-6+rand()*12,.17,-4.2+rand()*8.4);stone.scale.y=.55;}
  // Trip hazard and visible irrigation fitting; these do not represent buried-service clearance.
  const hole=cyl(.3,.25,.018,material('#493e32'),-3.95,.157,1.15);hole.scale.z=.72;
  cyl(.12,.12,.28,mats.rubber,-3.25,.27,1.5);cyl(.18,.15,.08,mats.metal,-3.25,.43,1.5);
  for(const z of [-2.1,-.9]){cyl(.025,.035,.9,mats.wood,-.7,.55,z);box(.45,.27,.025,mats.yellow,-.48,.84,z);}
  // Tractor, static for observation: chassis, cab, treaded tyres and steering wheel.
  const tractor=new T.Group();tractor.position.set(-4.05,.14,-2.8);tractor.rotation.y=.2;scene.add(tractor);
  box(1.05,.38,2,mats.red,0,.66,0,tractor,.1);box(.97,.62,1.15,mats.red,0,1.05,-.5,tractor,.15);
  box(1.18,.13,1.15,mats.cream,0,2.07,.43,tractor,.06);box(.98,.84,.87,mats.glass,0,1.57,.43,tractor);
  for(const x of [-.49,.49])for(const z of [.04,.83])cyl(.035,.035,.87,mats.metal,x,1.57,z,tractor);
  box(.53,.15,.44,mats.rubber,0,1.16,.5,tractor);box(.54,.45,.12,mats.rubber,0,1.35,.74,tractor);
  for(const z of [-.7,.68])for(const x of [-.69,.69]){
   const r=z>0?.58:.37, wheel=cyl(r,r,.3,mats.rubber,x,r,z,tractor);wheel.rotation.z=Math.PI/2;
   const hub=cyl(r*.47,r*.47,.315,mats.cream,x,r,z,tractor);hub.rotation.z=Math.PI/2;
   for(let t=0;t<18;t++){const a=t*Math.PI/9;const tread=box(.32,.07,.11,mats.rubber,x,r+Math.cos(a)*r, z+Math.sin(a)*r,tractor,.018);tread.rotation.x=a;}
  }
  box(.8,.3,.07,mats.metal,0,.95,-1.12,tractor);for(const x of [-.3,.3])ball(.09,mats.cream,x,1.18,-1.1,tractor);
  cyl(.055,.055,.75,mats.rubber,.3,1.65,-.62,tractor);cyl(.06,.06,.07,mats.yellow,0,2.2,.4,tractor);
  const steering=mesh(new T.TorusGeometry(.18,.025,8,20),mats.rubber,0,1.36,.02,tractor);steering.rotation.x=-.7;
  // Fence separates the observation route from the machinery area.
  for(let z=-4;z<0;z+=1){cyl(.045,.05,.85,mats.wood,-2.1,.5,z);}
  for(const y of [.55,.87]){const bar=cyl(.022,.022,3,mats.wood,-2.1,y,-2.5);bar.rotation.x=Math.PI/2;}
  // Hand-tool rack at the near edge, with rounded steel blades and wood handles.
  box(2.05,.12,.58,mats.wood,.1,.42,3.25);for(const x of [-.7,.85])box(.1,.4,.1,mats.wood,x,.23,3.25);
  for(let i=0;i<2;i++){const g=new T.Group();g.position.set(-.55+i*.65,.2,3.22);g.rotation.z=.12-i*.13;scene.add(g);box(.33,.45,.08,mats.metal,0,.26,0,g,.09);cyl(.045,.05,1.35,mats.wood,0,1,0,g);const grip=mesh(new T.TorusGeometry(.13,.04,8,20),mats.rubber,0,1.73,0,g);grip.scale.y=.75;}
  // Workbenches, chemical container, clean glove props, splash goggles and boots.
  function table(x:number,z:number){box(2.2,.15,1.2,mats.wood,x,1.12,z);for(const dx of [-.9,.9])for(const dz of [-.44,.44])box(.1,1,.1,mats.metal,x+dx,.55,z+dz);}
  table(4,-2);table(3.9,1.85);
  const bottle=box(.49,.7,.37,mats.cream,3.7,1.52,-2,scene,.09);cyl(.13,.13,.11,mats.blue,3.7,1.93,-2);box(.28,.25,.014,mats.yellow,3.7,1.56,-1.81);
  box(.52,.06,.66,mats.cream,4.5,1.24,-2.04);box(.38,.015,.38,mats.blue,4.5,1.28,-2.04);
  function glove(x:number,z:number){const g=new T.Group();scene.add(g);g.position.set(x,1.23,z);g.rotation.y=.25;box(.24,.05,.27,mats.blue,0,0,0,g);for(let i=0;i<4;i++)box(.048,.047,.2+(i%2)*.04,mats.blue,-.09+i*.06,0,-.22,g,.019);const thumb=box(.065,.05,.2,mats.blue,.16,0,-.025,g,.025);thumb.rotation.y=-.6;box(.25,.05,.09,mats.blue,0,0,.18,g);}
  glove(3.3,1.8);glove(3.72,1.8);
  const goggles=new T.Group();goggles.position.set(4.45,1.35,1.85);goggles.rotation.x=-.4;scene.add(goggles);
  for(const x of [-.13,.13]){const rim=mesh(new T.TorusGeometry(.14,.035,10,24),mats.blue,x,0,0,goggles);rim.scale.y=.75;const lens=ball(.12,mats.glass,x,0,0,goggles);lens.scale.set(1,.72,.15);}box(.08,.04,.04,mats.blue,0,0,0,goggles);
  for(let b=0;b<2;b++){const x=3.35+b*.55;box(.36,.29,.67,mats.wood,x,.3,2.88,scene,.13);cyl(.17,.18,.57,mats.wood,x,.65,3.03);box(.4,.08,.73,mats.rubber,x,.17,2.86);cyl(.125,.13,.02,mats.rubber,x,.94,3.03);}
  // Contact station: phone and contact card; numbers are kept as editable HTML outside the scene.
  box(1.2,.1,.7,mats.wood,1.25,1.1,-3.7);box(.12,1,.12,mats.wood,1.25,.55,-3.7);box(.27,.05,.48,mats.rubber,1,1.2,-3.65);box(.22,.008,.32,mats.blue,1,1.229,-3.68);box(.32,.03,.42,mats.cream,1.5,1.2,-3.7);
  // Shade, drinking water, vegetation: illustrative context, never a fixed heat-work prescription.
  cyl(.065,.08,2,mats.wood,-5.05,1.15,3.3);const shade=mesh(new T.ConeGeometry(1.05,.55,32),mats.cream,-5.05,2.38,3.3);cyl(.22,.22,.53,mats.blue,-4.7,.4,3.15);cyl(.09,.09,.07,mats.cream,-4.7,.7,3.15);
  for(let i=0;i<4;i++){const s=ball(.21,mats.leaf,-5.8+i*.16,.32,1.3+Math.sin(i)*.2);s.scale.y=1.4;}
  const floor=mesh(new T.PlaneGeometry(200,200),material('#e4ece9'),0,-.93,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  const ring=mesh(new T.TorusGeometry(.55,.035,10,48),material('#f5ce6b',.25),0,.21,0);ring.rotation.x=Math.PI/2;
  const positions=anchors.map(a=>new T.Vector3(...a as [number,number,number]));
  let previousNarrow:boolean|null=null;
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;camera.aspect=w/h;const narrow=w/h<1.3;if(previousNarrow!==narrow){camera.position.set(...initial.map(v=>v*Math.max(1,1.45/camera.aspect)) as [number,number,number]);previousNarrow=narrow;}camera.updateProjectionMatrix();renderer.setSize(w,h);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  let stopped=false;
  function render(){if(stopped)return;controls.update();const s=anchors[latest.current.selected];ring.position.set(s[0],.22,s[2]);
   camera.updateMatrixWorld();positions.forEach((v,i)=>{const p=v.clone().project(camera),el=markerRefs.current[i];if(el){el.style.left=`${(p.x*.5+.5)*100}%`;el.style.top=`${(-p.y*.5+.5)*100}%`;el.style.visibility=p.z<1&&p.z>-1?'visible':'hidden';}});
   renderer.render(scene,camera);
  }
  renderer.setAnimationLoop(render);
  const loss=(e:Event)=>{e.preventDefault();setFailed(true);renderer.setAnimationLoop(null);};renderer.domElement.addEventListener('webglcontextlost',loss);
  controller.current={reset(){camera.position.set(...initial.map(v=>v*Math.max(1,1.45/camera.aspect)) as [number,number,number]);controls.target.set(0,.5,0);controls.update();}};
  return()=>{stopped=true;renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',loss);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});grain.dispose();renderer.dispose();renderer.domElement.remove();controller.current=null;};
 },[]);
 return <div className="site-wrap"><div className="scene-toolbar"><span>{ui.simulation}</span><button type="button" onClick={()=>controller.current?.reset()}>{ui.resetView}</button></div><div ref={mount} className="site-canvas" role="group" aria-label={ui.simulation}>
 {!failed&&points.map((p,i)=><button type="button" key={p.id} ref={el=>{markerRefs.current[i]=el}} className={`hotspot ${selected===i?'selected':''} ${done.includes(p.id)?'done':''}`} aria-label={`${i+1}. ${p.label}`} aria-pressed={selected===i} onClick={()=>onSelect(i)}><span>{i+1}</span><small>{p.label}</small></button>)}
 {failed&&<p className="fallback" role="status">{ui.unavailable3d}</p>}
 </div><p className="scene-help">{ui.drag}</p></div>;
}
