import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export const arrangements:any={
 terrain:[['generic-ground-burrow-entrance',3.5,-1.3,0],['popup-irrigation-body',.95,1.45,.7]],
 utilities:[['S1-01-soil-probe',2.8,-1,0],['long-handled-spade',2.8,1.25,0]],
 tractor:[['generic-green-cab-tractor',4,0,0],['generic-hi-vis-vest',1.2,2.8,1.2]],
 tools:[['long-handled-spade',3,-2.3,-.6],['STATE-LOOSE-JOINT',3,-.5,1],['defect-tool-isolation-tray',3.8,3.1,.4]],
 chemical:[['closed-generic-reagent-bottle',1.7,0,0],['generic-green-apron',2,-1.8,.3],['ppe-full-frame-goggles',.9,1.6,.4]],
 ppe:[['ppe-long-cuff-glove',1.9,-1.5,0],['ppe-fabric-glove',1.9,1.4,0],['S1-01-respirator',.95,0,1.3]],
 communication:[['open-tool-carry-tote',2.6,-1,0],['S1-01-soil-probe',2.8,1.3,0]],
 weather:[['S1-01-shade-canopy',4,0,-.5],['generic-green-apron',1.8,-1.5,1.2],['generic-ear-protection',.9,1.6,1.1]],
};
const cache=new Map<string,Promise<any>>();
export async function stage(host:HTMLElement,key:string,opts:any={}){
 const width=opts.width||host.clientWidth||960,height=opts.height||480;
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
 renderer.setSize(width,height);renderer.setPixelRatio(opts.pixelRatio||Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.domElement.style.touchAction='none';host.appendChild(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#edf3f2');
 const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=environment.texture;scene.environmentIntensity=.65;
 const camera=new T.PerspectiveCamera(34,width/height,.05,100);camera.position.set(5,6,9);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.4,0);controls.enablePan=false;controls.minDistance=5;controls.maxDistance=18;controls.maxPolarAngle=Math.PI/2-.04;controls.enableDamping=true;
 scene.add(new T.HemisphereLight(0xffffff,0x64756b,1.7));const sun=new T.DirectionalLight(0xfff7e9,3);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:25});sun.shadow.normalBias=.015;scene.add(sun);const fill=new T.DirectionalLight(0xe3f0ff,1.1);fill.position.set(5,3,-4);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(60,60),opts.film?new T.ShadowMaterial({color:0x314f43,opacity:.12}):new T.MeshStandardMaterial({color:0xedf3f2,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const assets=await fetch('/assets.json').then(r=>r.json());const loader=new GLTFLoader();const groups:any={};let disposed=false;
 const list=arrangements[key]||arrangements.tools;
 await Promise.all(list.map(async([id,size,x,z]:any)=>{
  if(!cache.has(id))cache.set(id,loader.loadAsync(assets[id].url));
  const original=await cache.get(id);if(disposed)return;
  const source=original.scene.clone(true);source.updateMatrixWorld(true);let box=new T.Box3().setFromObject(source),extent=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const scale=size/Math.max(extent.x,extent.y,extent.z);source.scale.multiplyScalar(scale);source.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  source.traverse((n:any)=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  const group=new T.Group();group.name=id;group.add(source);group.position.set(x,.01,z);group.userData.origin=group.position.clone();scene.add(group);groups[id]=group;
 }));
 const halo=new T.Mesh(new T.TorusGeometry(.38,.016,12,64),new T.MeshBasicMaterial({color:0x009b83}));halo.rotation.y=.3;scene.add(halo);halo.visible=false;
 const target=new T.Mesh(new T.RingGeometry(.75,.83,64),new T.MeshBasicMaterial({color:0x009b83,side:T.DoubleSide,transparent:true,opacity:.8}));target.rotation.x=-Math.PI/2;target.position.set(3.1,.05,.4);target.visible=key==='tools'&&Boolean(opts.interactive);scene.add(target);
 const ray=new T.Raycaster(),mouse=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3();let drag:any=null,moved=false,ended=false,raf=0;
 function cast(e:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);}
 function down(e:PointerEvent){if(!opts.interactive||key!=='tools')return;cast(e);const loose=groups['STATE-LOOSE-JOINT'];if(loose&&ray.intersectObject(loose,true).length){drag=loose;controls.enabled=false;moved=false;renderer.domElement.setPointerCapture(e.pointerId);}}
 function move(e:PointerEvent){if(!drag)return;cast(e);if(ray.ray.intersectPlane(plane,hit)){drag.position.x=T.MathUtils.clamp(hit.x,-3,4);drag.position.z=T.MathUtils.clamp(hit.z,-1.3,1.6);moved=true;}}
 function up(){if(!drag)return;const yes=moved&&Math.hypot(drag.position.x-3.1,drag.position.z-.4)<.95;opts.onDrop?.(yes);if(yes){drag.position.set(3.1,.15,.4);target.material.color.set(0x009b83);}else drag.position.copy(drag.userData.origin);drag=null;controls.enabled=true;}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);
 function setTime(t:number){
  if(key!=='tools')return;
  const sound=groups['long-handled-spade'],loose=groups['STATE-LOOSE-JOINT'];if(!sound||!loose)return;
  for(const g of [sound,loose]){g.position.copy(g.userData.origin);g.quaternion.identity();g.visible=true;}
  scene.updateMatrixWorld(true);
  const handle=sound.getObjectByName('Hardwood_crossbar_grip'),blade=sound.getObjectByName('Steel_body_|_blade_neck_socket_continuous');
  const handleCenter=new T.Box3().setFromObject(handle).getCenter(new T.Vector3()),bladeCenter=new T.Box3().setFromObject(blade).getCenter(new T.Vector3());
  halo.visible=t>=2.02&&t<8.52;
  halo.position.copy(t<4.94?handleCenter:bladeCenter);halo.position.y+=.12;halo.rotation.set(-Math.PI/2,0,0);halo.scale.setScalar(t<4.94?.75:1);
  const p=T.MathUtils.smoothstep(t,10.6,11.86);loose.position.lerpVectors(loose.userData.origin,new T.Vector3(3.1,.15,.4),p);
  const joint=loose.getObjectByName('STATE-LOOSE-JOINT_retained_shaft_pivot');if(joint)joint.rotation.y=(t>=8.52&&t<10.6)?T.MathUtils.degToRad(.5)*Math.sin((t-8.52)*5):0;
  if(t>=12.433){loose.position.set(3.1,.15,.4);const q=T.MathUtils.smoothstep(t,12.433,14.213);sound.position.y=.01+1.6*q;const rot=new T.Quaternion().setFromUnitVectors(handleCenter.clone().sub(bladeCenter).normalize(),new T.Vector3(0,1,0));sound.quaternion.slerp(rot,q);const away=T.MathUtils.smoothstep(t,16.313,19.533);sound.position.x=-2.3-1.2*away;}
  camera.position.set(5,6,9);controls.target.set(0,.7,0);controls.update();renderer.render(scene,camera);
 }
 const smooth=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);
 const localCenter=(g:any,name:string)=>{g.updateMatrixWorld(true);const c=new T.Box3().setFromObject(g.getObjectByName(name)).getCenter(new T.Vector3());return g.worldToLocal(c);};
 const sound=groups['long-handled-spade'],loose=groups['STATE-LOOSE-JOINT'],tray=groups['defect-tool-isolation-tray'];
 const hc=sound?localCenter(sound,'Hardwood_crossbar_grip'):new T.Vector3();
 const bc=sound?localCenter(sound,'Steel_body_|_blade_neck_socket_continuous'):new T.Vector3();
 const joint=loose?.getObjectByName('STATE-LOOSE-JOINT_retained_shaft_pivot');const jointBase=joint?.quaternion.clone();const jc=joint?loose.worldToLocal(joint.getWorldPosition(new T.Vector3())):bc.clone();
 const clearance=new T.Mesh(new T.RingGeometry(1.48,1.51,96),new T.MeshBasicMaterial({color:0x009b83,side:T.DoubleSide,transparent:true,opacity:.65}));clearance.rotation.x=-Math.PI/2;clearance.position.y=.025;clearance.visible=false;scene.add(clearance);
 function filmTime(t:number){
  if(key!=='tools'||!sound||!loose||!tray)return;controls.enabled=false;
  for(const g of [sound,loose,tray]){g.position.set(0,.01,0);g.quaternion.identity();g.scale.setScalar(1);g.visible=false;}
  halo.visible=false;clearance.visible=false;target.visible=false;if(joint&&jointBase)joint.quaternion.copy(jointBase);
  let aim=new T.Vector3(0,.25,0),eye=new T.Vector3(1.5,4.3,5.7);
  if(t<8.52){
   sound.visible=true;const arrive=smooth(t,0,.85);sound.position.x=(1-arrive)*-1.8;sound.position.y=.01+(1-arrive)*.28;sound.rotation.y=(1-arrive)*-.23;
   const handle=sound.localToWorld(hc.clone()),blade=sound.localToWorld(bc.clone());
   if(t>=2.02&&t<4.94){const k=smooth(t,2.02,2.38);aim.lerp(handle,k);eye.lerp(handle.clone().add(new T.Vector3(.65,1.25,2.25)),k);halo.position.copy(handle).add(new T.Vector3(0,.1,0));halo.rotation.set(-Math.PI/2,0,0);halo.scale.setScalar(.78);halo.visible=true;}
   if(t>=4.94){const k=smooth(t,4.94,5.4);aim.copy(sound.localToWorld(hc.clone())).lerp(blade,k);eye.copy(sound.localToWorld(hc.clone()).add(new T.Vector3(.65,1.25,2.25))).lerp(blade.clone().add(new T.Vector3(.6,1.9,2.4)),k);halo.position.copy(blade).add(new T.Vector3(0,.1,0));halo.rotation.set(-Math.PI/2,0,0);halo.scale.setScalar(1.1);halo.visible=k>.85;}
  } else if(t<12.433333333333334){
   loose.visible=true;const k=smooth(t,10.75,11.65);tray.visible=t>=10.6;tray.position.set(1.8+(1-smooth(t,10.6,11.05))*2,.01,.25);loose.position.set(1.8*k,.01+smooth(t,10.6,10.95)-.86*smooth(t,11.4,11.86),.25*k);
   if(t<10.6){if(joint)joint.rotateY(T.MathUtils.degToRad(.5)*Math.sin((t-8.52)*8));loose.updateMatrixWorld(true);const c=joint?joint.getWorldPosition(new T.Vector3()):new T.Box3().setFromObject(loose).getCenter(new T.Vector3());aim.copy(c);eye.copy(c).add(new T.Vector3(.45,.85,1.35));halo.position.copy(c).add(new T.Vector3(0,.07,0));halo.rotation.set(-Math.PI/2,0,0);halo.scale.setScalar(.4);halo.material.color.set(0xd66a38);halo.visible=true;}
   else {aim.set(1,.2,.2);eye.set(2.2,4.7,5.5);}
  } else {
   const exit=smooth(t,12.433333333333334,13.4);tray.visible=loose.visible=exit<1;tray.position.set(1.8+5*exit,.01,.25);loose.position.set(1.8+5*exit,.15,.25);
   sound.visible=true;const up=smooth(t,12.433333333333334,14.213333333333333);const rot=new T.Quaternion().setFromUnitVectors(hc.clone().sub(bc).normalize(),new T.Vector3(0,1,0));rot.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-.9));sound.quaternion.slerp(rot,up);sound.updateMatrixWorld(true);const b=new T.Box3().setFromObject(sound);sound.position.y+=.14-b.min.y;const apart=smooth(t,16.313333333333333,17.5);sound.position.x=-4*(1-smooth(t,12.433333333333334,13.5))-.7*apart;aim.set(0,1.35,0);eye.set(2.5,2.9,6.7);
   if(t>=14.213333333333333&&t<16.313333333333333){const c=sound.localToWorld(bc.clone());halo.position.copy(c);halo.rotation.set(0,0,0);halo.scale.setScalar(.8);halo.visible=true;}
   if(t>=18.03333333333333){clearance.visible=true;clearance.position.x=sound.position.x;clearance.scale.setScalar(smooth(t,18.03333333333333,18.7));}
  }
  if(!(t>=8.52&&t<10.6))halo.material.color.set(0x009b83);
  // A deterministic, continuous camera path, independent of frame playback speed.
  // Every transition starts at the measured spoken cue; no audio retiming.
  const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  const socket=jc.clone().add(new T.Vector3(0,.01,0));
  const poses=[
   {start:0,end:0,target:v(0,.25,0),eye:v(1.5,4.3,5.7)},
   {start:2.02,end:2.65,target:hc.clone(),eye:hc.clone().add(v(.65,1.25,2.25))},
   {start:4.94,end:5.65,target:bc.clone(),eye:bc.clone().add(v(.6,1.9,2.4))},
   {start:8.52,end:9.05,target:socket.clone(),eye:socket.clone().add(v(.45,.85,1.35))},
   {start:9.58,end:10.6,target:v(1,.2,.2),eye:v(2.2,4.7,5.5)},
   {start:12.433333333333334,end:13.35,target:v(0,1.35,0),eye:v(2.5,2.9,6.7)},
  ];
  let prior=poses[0];aim.copy(prior.target);eye.copy(prior.eye);
  for(const pose of poses.slice(1)){if(t<pose.start)break;const blend=smooth(t,pose.start,pose.end);aim.copy(prior.target).lerp(pose.target,blend);eye.copy(prior.eye).lerp(pose.eye,blend);if(t<pose.end)break;prior=pose;}
  if(halo.visible){let start=t<4.94?2.02:t<8.52?4.94:t<10.6?8.52:14.213333333333333;halo.scale.multiplyScalar(smooth(t,start,start+.28));}
  camera.position.copy(eye);camera.lookAt(aim);camera.updateMatrixWorld(true);renderer.render(scene,camera);
 }
 function render(){if(ended)return;if(!opts.film)controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render);}render();
 const resize=()=>{if(opts.width)return;const w=host.clientWidth;renderer.setSize(w,height);camera.aspect=w/height;camera.updateProjectionMatrix();};window.addEventListener('resize',resize);
 return {renderer,scene,camera,groups,setTime:opts.film?filmTime:setTime,render:()=>renderer.render(scene,camera),capture:()=>renderer.domElement.toDataURL('image/png'),isolate:()=>{groups['STATE-LOOSE-JOINT']?.position.set(3.1,.15,.4);opts.onDrop?.(true)},reset:()=>{for(const g of Object.values(groups) as any[])g.position.copy(g.userData.origin);opts.onDrop?.(null)},dispose:()=>{disposed=true;ended=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);controls.dispose();environment.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove();}};
}
