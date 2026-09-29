import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86d8e8);
scene.fog = new THREE.Fog(0x86d8e8, 35, 125);

const camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, .1, 250);
camera.position.set(8,5,9);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
document.getElementById('game').appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xeaffff,0x427381,2.8));
const sun=new THREE.DirectionalLight(0xffffff,2.4);
sun.position.set(-25,35,18); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
scene.add(sun);

// Ground around the imported CBD model
const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(180,180),
  new THREE.MeshStandardMaterial({color:0x477681,roughness:.9,metalness:.03})
);
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

// Roads
function box(w,h,d,color,x,y,z,rough=.75){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color,roughness:rough}));
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
}
const roadMat=0x263e47;
box(15,.06,150,roadMat,0,.035,0);
box(150,.06,15,roadMat,0,.035,0);
box(9,.065,150,roadMat,25,.04,0);
box(150,.065,9,roadMat,0,.04,25);

for(let z=-70;z<=70;z+=4){
  box(.09,.075,1.7,0x9afaff,0,.09,z,.35);
  box(.09,.075,1.7,0x9afaff,25,.095,z,.35);
}
for(let x=-70;x<=70;x+=4){
  box(1.7,.075,.09,0x9afaff,x,.09,0,.35);
  box(1.7,.075,.09,0x9afaff,x,.095,25,.35);
}

// IMPORT USER'S CBD ENVIRONMENT
const world=new THREE.Group();
scene.add(world);

const loader=new GLTFLoader();
loader.load('./CBD%20area.glb',(gltf)=>{
  const model=gltf.scene;
  model.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true; o.receiveShadow=true;
      if(o.material){
        o.material.roughness=Math.min(o.material.roughness ?? .7,.85);
      }
    }
  });

  // Normalize the supplied GLB to a useful portfolio-world size.
  const box3=new THREE.Box3().setFromObject(model);
  const size=box3.getSize(new THREE.Vector3());
  const maxXZ=Math.max(size.x,size.z);
  const targetXZ=48;
  const scale=targetXZ/maxXZ;
  model.scale.setScalar(scale);

  // Recalculate and place its bottom on the ground.
  const b2=new THREE.Box3().setFromObject(model);
  const center=b2.getCenter(new THREE.Vector3());
  model.position.x-=center.x;
  model.position.z-=center.z;
  model.position.y-=b2.min.y;

  world.add(model);

  // A soft cyan platform ring around the CBD model.
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(27,.08,12,96),
    new THREE.MeshBasicMaterial({color:0x4df6ff,transparent:true,opacity:.55})
  );
  ring.rotation.x=Math.PI/2; ring.position.y=.09; scene.add(ring);
},undefined,(err)=>{
  console.error('CBD GLB failed to load:',err);
});

// TREES / GREENERY AROUND THE WORLD
function tree(x,z,s=1){
  const trunk=box(.28*s,1.4*s,.28*s,0x60483b,x,.7*s,z);
  const crown=new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25*s,1),
    new THREE.MeshStandardMaterial({color:0x2c8b79,roughness:.9})
  );
  crown.position.set(x,2.1*s,z); crown.castShadow=true; scene.add(crown);
}
const treeSpots=[
  [-11,-28,1.1],[11,-28,1.1],[-11,-12,.8],[11,-12,.9],
  [-11,10,1],[11,10,.9],[-11,30,.9],[11,30,1.1],
  [-30,-30,.9],[-30,0,1.1],[-30,30,.8],[38,-28,1],
  [38,0,.9],[38,30,1]
];
treeSpots.forEach(v=>tree(...v));

// SCI-FI LIGHT POLES
function pole(x,z){
  box(.09,4,.09,0x476c78,x,2,z,.4);
  const lamp=box(.5,.08,.18,0x4df6ff,x,4.05,z,.2);
  lamp.material=new THREE.MeshStandardMaterial({color:0x4df6ff,emissive:0x4df6ff,emissiveIntensity:3});
}
for(let z=-45;z<=45;z+=9){ pole(-9,z); pole(9,z); }
for(let x=-45;x<=45;x+=9){ pole(x,9); }

// STATIONS
const stations=[
 {id:'about',title:'About Me',tag:'01 / PROFILE',color:0x4df6ff,pos:new THREE.Vector3(-6,1,-7),
 body:'I am a digital marketing student and creative technologist building practical digital experiences across marketing, UX/UI, 3D, branding and interactive media.',link:'',label:''},
 {id:'projects',title:'Projects',tag:'02 / WORK',color:0xffdf5a,pos:new THREE.Vector3(7,1,-13),
 body:'Selected work includes Kopi Boy, R2M, interactive web experiences and creative 3D projects using Blender, Unreal Engine and generative tools.',link:'',label:''},
 {id:'skills',title:'Digital Skills',tag:'03 / CAPABILITIES',color:0x9d8cff,pos:new THREE.Vector3(-7,1,17),
 body:'Digital marketing • UX/UI • Content strategy • Social media • Branding • Interactive web • 3D • Blender • Unreal Engine • Prototyping • AI-assisted creative production',link:'',label:''},
 {id:'education',title:'Education',tag:'04 / BCU',color:0xff75bd,pos:new THREE.Vector3(7,1,28),
 body:'BA (Hons) Digital Marketing — Birmingham City University, UK. This interactive portfolio demonstrates creative technology applied to digital communication and personal branding.',link:'',label:''},
 {id:'linkedin',title:'LinkedIn',tag:'05 / CONNECT',color:0x4aa8ff,pos:new THREE.Vector3(0,1,43),
 body:'Connect with me professionally and view my latest experience, education and projects on LinkedIn.',link:'https://www.linkedin.com/',label:'OPEN LINKEDIN ↗'}
];

const stationMeshes=[];
function makeStation(s){
 const g=new THREE.Group(); g.position.copy(s.pos);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,.18,32),
   new THREE.MeshStandardMaterial({color:0x18313b,metalness:.35,roughness:.4}));
 base.position.y=-.9; g.add(base);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.08,.06,8,40),
   new THREE.MeshBasicMaterial({color:s.color}));
 ring.rotation.x=Math.PI/2; ring.position.y=-.76; g.add(ring);
 const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),
   new THREE.MeshStandardMaterial({color:s.color,emissive:s.color,emissiveIntensity:.55,roughness:.25}));
 orb.position.y=.25; orb.castShadow=true; g.add(orb);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.8,8),
   new THREE.MeshBasicMaterial({color:s.color,transparent:true,opacity:.4}));
 beam.position.y=.8; g.add(beam);
 g.userData.station=s; scene.add(g); stationMeshes.push(g);
}
stations.forEach(makeStation);

// CAR
const car=new THREE.Group(); car.position.set(0,.45,8); scene.add(car);
function carPart(geo,mat,pos){
 const m=new THREE.Mesh(geo,mat); m.position.copy(pos); m.castShadow=true; car.add(m); return m;
}
carPart(new THREE.BoxGeometry(2.1,.55,3.5),new THREE.MeshStandardMaterial({color:0x55f7ff,emissive:0x0d6970,emissiveIntensity:.35,metalness:.45,roughness:.28}),new THREE.Vector3(0,0,0));
carPart(new THREE.BoxGeometry(1.55,.6,1.7),new THREE.MeshStandardMaterial({color:0x12313b,metalness:.45,roughness:.2}),new THREE.Vector3(0,.52,-.15));
const wheelMat=new THREE.MeshStandardMaterial({color:0x071015,roughness:.75});
for(const x of [-1.05,1.05]) for(const z of [-1.05,1.05]){
 const w=carPart(new THREE.CylinderGeometry(.42,.42,.22,20),wheelMat,new THREE.Vector3(x,-.35,z));
 w.rotation.z=Math.PI/2;
}

// CONTROLS
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('#mobileControls button').forEach(b=>{
 const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});
 ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));
});

let speed=0;
function updateCar(dt){
 const f=keys.w||keys.arrowup, back=keys.s||keys.arrowdown;
 const left=keys.a||keys.arrowleft, right=keys.d||keys.arrowright;
 if(f) speed+=dt*24; if(back) speed-=dt*18;
 speed*=Math.pow(.18,dt); speed=Math.max(-10,Math.min(28,speed));
 if(Math.abs(speed)>.2){
   const steer=(right?1:0)-(left?1:0);
   car.rotation.y-=steer*dt*2.45*Math.min(Math.abs(speed)/8,1.25)*(speed>=0?1:-1);
 }
 car.translateZ(-speed*dt);
 car.position.x=THREE.MathUtils.clamp(car.position.x,-13,38);
 car.position.z=THREE.MathUtils.clamp(car.position.z,-55,55);
}

// CAMERA / ZOOM
let cameraDistance=6.2, cameraHeight=3.8;
const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false; controls.enableZoom=false; controls.enableDamping=true;
controls.minPolarAngle=.72; controls.maxPolarAngle=1.4;

renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();
 cameraDistance=THREE.MathUtils.clamp(cameraDistance+e.deltaY*.008,2.8,11);
 cameraHeight=THREE.MathUtils.clamp(cameraDistance*.60,1.8,6.5);
},{passive:false});

// CLICK STATIONS
const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2();
const panel=document.getElementById('panel');
function openPanel(s){
 document.getElementById('panelTag').textContent=s.tag;
 document.getElementById('panelTitle').textContent=s.title;
 document.getElementById('panelBody').textContent=s.body;
 const a=document.getElementById('panelLink');a.textContent=s.label||'';a.href=s.link||'#';
 panel.classList.remove('hidden');
}
document.getElementById('closePanel').onclick=()=>panel.classList.add('hidden');
renderer.domElement.addEventListener('click',e=>{
 mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;
 raycaster.setFromCamera(mouse,camera);
 const hit=raycaster.intersectObjects(stationMeshes,true)[0];
 if(hit){let o=hit.object;while(o.parent&&!o.userData.station)o=o.parent;if(o.userData.station)openPanel(o.userData.station);}
});

// MENU
const menu=document.getElementById('menu');
document.getElementById('menuBtn').onclick=()=>menu.classList.remove('hidden');
document.getElementById('closeMenu').onclick=()=>menu.classList.add('hidden');
document.querySelectorAll('.menu-item').forEach(item=>item.onclick=()=>{
 const s=stations.find(x=>x.id===item.dataset.target);
 if(s){car.position.copy(s.pos.clone().add(new THREE.Vector3(0,0,4)));openPanel(s);menu.classList.add('hidden')}
});

// ANIMATION
const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.05);
 updateCar(dt);
 const speedEl=document.getElementById('speedValue');if(speedEl)speedEl.textContent=String(Math.round(Math.abs(speed)*6)).padStart(3,'0');
 stationMeshes.forEach((g,i)=>{g.rotation.y+=dt*.25;g.children[2].position.y=.25+Math.sin(performance.now()*.0018+i)*.12});
 const target=car.position.clone();target.y+=.6;
 const desired=car.position.clone().add(new THREE.Vector3(cameraDistance*.72,cameraHeight,cameraDistance).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y));
 camera.position.lerp(desired,.08);controls.target.lerp(target,.1);controls.update();
 renderer.render(scene,camera);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>document.getElementById('loading').classList.add('hide'),1000);
animate();
