import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// A deterministic, editable physical model. All learner text is added separately.
const W=1600,H=1050;
const scene=new T.Scene();scene.background=new T.Color('#f7f5ef');
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;document.body.appendChild(renderer.domElement);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.environmentIntensity=.4;
const camera=new T.OrthographicCamera(-8,8,5.25,-5.25,.1,100);
camera.position.set(8.6,15,21);camera.lookAt(0,.1,.6);camera.updateMatrixWorld();
scene.add(new T.HemisphereLight('#fffbef','#b8aa91',1));
const key=new T.DirectionalLight('#fff7e6',2.3);key.position.set(-6,12,5);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.5,far:35});
key.shadow.bias=-.0003;key.shadow.normalBias=.035;key.shadow.radius=5;scene.add(key);
const fill=new T.DirectionalLight('#e4f0ff',.6);fill.position.set(8,6,-5);scene.add(fill);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#f4f0e6',roughness:.95}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.09;ground.receiveShadow=true;scene.add(ground);

function material(color,roughness=.4,metalness=0){return new T.MeshStandardMaterial({color,roughness,metalness});}
const cream=material('#ead8b6',.38), surface=material('#f0e2c9',.6), walnut=material('#816044',.5);
const colors={sand:'#bd9557',silt:'#719786',clay:'#b2775d'};
function mesh(geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
const verts=[[-4.25,2.45],[4.25,2.45],[0,-4.91]];
function triangular(scale,base,depth,mat,bevel,hole=0){
 const s=new T.Shape();verts.forEach(([x,z],i)=>i?s.lineTo(x*scale,-z*scale):s.moveTo(x*scale,-z*scale));s.closePath();
 if(hole){const inner=new T.Path();[...verts].reverse().forEach(([x,z],i)=>i?inner.lineTo(x*hole,-z*hole):inner.moveTo(x*hole,-z*hole));inner.closePath();s.holes.push(inner);}
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:32});
 const m=mesh(g,mat,0,base,0);m.rotation.x=-Math.PI/2;return m;
}
// Separate dark hardwood base, rounded ceramic rim, recessed warm working surface.
triangular(1.025,.12,.2,walnut,.16);
triangular(1.00,.35,.13,cream,.06,.9);
triangular(.91,.485,.025,surface,.025);
function point(a,b,c,y=.58){return new T.Vector3(a*verts[0][0]+b*verts[1][0]+c*verts[2][0],y,a*verts[0][1]+b*verts[1][1]+c*verts[2][1]);}
function rod(a,b,r,mat){const d=b.clone().sub(a);const m=mesh(new T.CylinderGeometry(r,r,d.length(),12),mat);m.position.copy(a.clone().add(b).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
const grid=material('#b9a079',.85);
for(const v of [.2,.4,.6,.8]){
 rod(point(1-v,0,v,.54),point(0,1-v,v,.54),.009,grid);
 rod(point(v,1-v,0,.54),point(v,0,1-v,.54),.009,grid);
 rod(point(1-v,v,0,.54),point(0,v,1-v,.54),.009,grid);
}
const pairs=[['clay',[.8,0,.2],[0,.8,.2]],['sand',[.4,0,.6],[.4,.6,0]],['silt',[0,.4,.6],[.6,.4,0]]];
for(const [kind,a,b] of pairs){
 const mat=material(colors[kind],.28,.22);const aa=point(...a,.625),bb=point(...b,.625);rod(aa,bb,.042,mat);
 for(const p of [aa,bb]){mesh(new T.CylinderGeometry(.105,.105,.055,32),cream,p.x,p.y,p.z);mesh(new T.CylinderGeometry(.068,.068,.035,32),mat,p.x,p.y+.04,p.z);}
}
const hit=point(.4,.4,.2,.77);
mesh(new T.CylinderGeometry(.27,.31,.09,48),material('#e8e5d6',.22,.3),hit.x,.68,hit.z);
const marker=mesh(new T.SphereGeometry(.24,40,24),new T.MeshPhysicalMaterial({color:'#467a85',roughness:.16,metalness:.35,clearcoat:1}),hit.x,.78,hit.z);marker.scale.y=.5;

// Material specimens are illustrative, not particle-size measurements.
const specimenPositions=[[-3.55,5.25],[0,5.25],[3.55,5.25]];
const grainGeo=new T.IcosahedronGeometry(1,1);
specimenPositions.forEach(([x,z],index)=>{
 mesh(new T.CylinderGeometry(.78,.72,.13,64),cream,x,.05,z);
 mesh(new T.CylinderGeometry(.67,.67,.02,64),material('#cdbb99',.8),x,.13,z);
 const kind=['sand','silt','clay'][index];
 if(kind==='clay'){
  [[0,.18,0,.4],[-.3,.1,.11,.24],[.29,.1,.1,.28],[.05,.28,-.13,.26]].forEach(([a,y,b,r])=>{
   const m=mesh(new T.IcosahedronGeometry(r,3),material('#a97256',.84),x+a,.14+y,z+b);m.scale.set(1,.9,1.08);
  });
 }else{
  const n=kind==='sand'?115:190;
  for(let i=0;i<n;i++){
   const angle=i*2.399963,r=Math.sqrt((i+.5)/n)*.59;
   const px=Math.cos(angle)*r,pz=Math.sin(angle)*r;
   const size=kind==='sand'?.048+((i*13)%17)/500:.03;
   const m=mesh(grainGeo,material(kind==='sand'?['#dfbd78','#bb914f','#cda15b'][i%3]:['#a08b6d','#ad9a7b','#8e7e65'][i%3],.9),x+px,.17+.12*(1-r/.6),z+pz);
   m.scale.set(size*1.2,size,size*.9);m.rotation.set(i*.7,i*1.1,i*.3);
  }
 }
});

renderer.render(scene,camera);
function project(v){const p=v.clone().project(camera);return [(p.x+1)*W/2,(1-p.y)*H/2];}
window.modelReady={width:W,height:H,vertices:verts.map(([x,z])=>project(new T.Vector3(x,.63,z))),hit:project(hit),specimens:specimenPositions.map(([x,z])=>project(new T.Vector3(x,.1,z))),version:'texture-solid-v3'};
window.modelPng=()=>renderer.domElement.toDataURL('image/png');
