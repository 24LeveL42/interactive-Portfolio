import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x79cfe3);
scene.fog = new THREE.Fog(0x78cddd, 25, 90);

const camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, .1, 200);
camera.position.set(10, 8, 13);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
document.getElementById('game').appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xe9ffff,0x397083,2.7));
const sun = new THREE.DirectionalLight(0xffffff,2.3);
sun.position.set(-15,25,10); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100,100),
  new THREE.MeshStandardMaterial({color:0x31535f,roughness:.7,metalness:.12})
);
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

// Road
function box(w,h,d,color,x,y,z,rough=.75){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:rough}));
  m.position.set(x,y,z); m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
box(16,.04,100,0x19353f,0,0,-15);
box(100,.04,16,0x19353f,0,0,-15);

const lineMat=new THREE.MeshBasicMaterial({color:0x626876});
for(let z=-60;z<50;z+=4) box(.07,.045,1.6,0x8af8ff,0,.03,z,.5);
for(let x=-48;x<52;x+=4) box(1.6,.045,.07,0x8af8ff,x,.03,-15,.5);

// Buildings / blocks
for(let i=0;i<22;i++){
  const side=i%2===0?1:-1;
  const x=side*(12+Math.random()*12);
  const z=-38+i*3.6;
  const h=2+Math.random()*7;
  const b=box(3+Math.random()*4,h,2.5+Math.random()*4,0x3d6875,x,h/2,z);
  const windows=new THREE.MeshStandardMaterial({color:0x62f4e6,emissive:0x124e49,emissiveIntensity:1});
  for(let yy=.8;yy<h;yy+=1.2){
    const w=box(.05,.25,1.2,0x62f4e6,x-side*2.01,yy,z,.3);
    w.material=windows;
  }
}

// Simple trees
function tree(x,z){
  const trunk=box(.25,1.2,.25,0x47382f,x,.6,z);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,1),new THREE.MeshStandardMaterial({color:0x287d77,roughness:.85}));
  crown.position.set(x,2,z); crown.castShadow=true; scene.add(crown);
}
for(let i=0;i<18;i++) tree((Math.random()>.5?1:-1)*(10+Math.random()*4),-35+Math.random()*70);


// Sci-fi skyline accents
for(let i=0;i<14;i++){
  const x=(i%2===0?1:-1)*(11.5+Math.random()*7);
  const z=-48+Math.random()*55;
  const h=5+Math.random()*9;
  const tower=box(1.2,h,.9,0x6fabb7,x,h/2,z,.35);
  const glowMat=new THREE.MeshStandardMaterial({color:0x4df6ff,emissive:0x4df6ff,emissiveIntensity:2});
  const strip=box(.08,h*.8,.04,0x4df6ff,x+(x>0?-0.62:0.62),h/2,z,.2);
  strip.material=glowMat;
}
const skyRing=new THREE.Mesh(new THREE.TorusGeometry(18,.08,10,80),new THREE.MeshBasicMaterial({color:0x4df6ff,transparent:true,opacity:.35}));
skyRing.rotation.x=Math.PI/2; skyRing.position.set(0,13,-28); scene.add(skyRing);

// Station data
const stations=[
 {id:'about',title:'About Me',tag:'01 / PROFILE',color:0x62f4e6,pos:new THREE.Vector3(-7,1,-5),
  body:'I am a digital marketing student and creative technologist building practical digital experiences across marketing, UX/UI, 3D, branding and interactive media. This portfolio is designed as an experience rather than a traditional page.',link:'',label:''},
 {id:'projects',title:'Projects',tag:'02 / WORK',color:0xffd35a,pos:new THREE.Vector3(7,1,-10),
  body:'Selected work includes Kopi Boy — a delivery platform concept for home cooks and hawkers; R2M — an interactive number-grid application; and creative 3D / visual projects using Blender, Unreal Engine and generative tools.',link:'',label:''},
 {id:'skills',title:'Digital Skills',tag:'03 / CAPABILITIES',color:0x9d8cff,pos:new THREE.Vector3(-7,1,-24),
  body:'Digital marketing • UX/UI design • Content strategy • Social media • Branding • Interactive web • 3D & Blender • Unreal Engine • Prototyping • Presentation design • AI-assisted creative production',link:'',label:''},
 {id:'education',title:'Education',tag:'04 / BCU',color:0xff6ca8,pos:new THREE.Vector3(7,1,-28),
  body:'BA (Hons) Digital Marketing — Birmingham City University, UK. This interactive portfolio forms part of my continuing digital marketing studies and demonstrates how creative technology can support personal branding.',link:'',label:''},
 {id:'linkedin',title:'LinkedIn',tag:'05 / CONNECT',color:0x4aa8ff,pos:new THREE.Vector3(0,1,-42),
  body:'Connect with me professionally and view my latest experience, education and projects on LinkedIn.',link:'https://www.linkedin.com/',label:'OPEN LINKEDIN ↗'}
];

const stationMeshes=[];
const labels=[];

function makeStation(s){
  const group=new THREE.Group(); group.position.copy(s.pos);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,.18,32),new THREE.MeshStandardMaterial({color:0x161a22,metalness:.35,roughness:.45}));
  base.position.y=-.9; base.receiveShadow=true;group.add(base);

  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.055,8,40),new THREE.MeshBasicMaterial({color:s.color}));
  ring.rotation.x=Math.PI/2; ring.position.y=-.76;group.add(ring);

  const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),new THREE.MeshStandardMaterial({color:s.color,emissive:s.color,emissiveIntensity:.45,roughness:.3,metalness:.15}));
  orb.position.y=.25; orb.castShadow=true; group.add(orb);

  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.6,8),new THREE.MeshBasicMaterial({color:s.color,transparent:true,opacity:.35}));
  beam.position.y=.8; group.add(beam);

  group.userData.station=s;
  scene.add(group); stationMeshes.push(group);

  // Label canvas
  const c=document.createElement('canvas'); c.width=512;c.height=128;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,512,128);
  ctx.font='700 34px Arial';ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.fillText(s.title.toUpperCase(),256,55);
  ctx.font='500 17px Arial';ctx.fillStyle='#8e96a6';ctx.fillText(s.tag,256,88);
  const tex=new THREE.CanvasTexture(c);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sp.scale.set(5,1.25,1);sp.position.set(0,2.15,0);group.add(sp);labels.push(sp);
}
stations.forEach(makeStation);

// Car
const car=new THREE.Group(); car.position.set(0,.35,5); scene.add(car);
const body=box(2.1,.55,3.5,0x55f7ff,0,0,0,.28); body.parent.remove(body); car.add(body); body.position.y=0;
const cabin=box(1.55,.6,1.7,0x1a1d26,0,.52,-.15,.25); cabin.parent.remove(cabin); car.add(cabin);
const windshield=box(1.4,.03,.65,0x78a6ad,0,.77,-.55,.1); windshield.parent.remove(windshield);car.add(windshield);
const wheelGeo=new THREE.CylinderGeometry(.42,.42,.22,20);
for(const x of [-1.05,1.05]) for(const z of [-1.05,1.05]){
  const w=new THREE.Mesh(wheelGeo,new THREE.MeshStandardMaterial({color:0x0a0b0e,roughness:.8}));
  w.rotation.z=Math.PI/2;w.position.set(x, -.35,z);w.castShadow=true;car.add(w);
}

// Player controls
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

document.querySelectorAll('#mobileControls button').forEach(b=>{
  const k=b.dataset.key;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false));
});

let speed=0, steering=0;

function updateCar(dt){
  const forward=keys.w||keys.arrowup, back=keys.s||keys.arrowdown;
  const left=keys.a||keys.arrowleft, right=keys.d||keys.arrowright;

  // Faster arcade-style driving
  if(forward) speed += dt*24;
  if(back) speed -= dt*18;

  // Stronger drag, but keeps momentum
  speed *= Math.pow(0.18,dt);

  // Much higher top speed
  speed = Math.max(-10, Math.min(28, speed));

  if(Math.abs(speed)>.2){
    const steer=(right?1:0)-(left?1:0);
    const steerStrength = 2.45 * Math.min(Math.abs(speed)/8,1.25);
    car.rotation.y -= steer*dt*steerStrength*(speed >= 0 ? 1 : -1);
  }

  car.translateZ(-speed*dt);

  // Keep vehicle inside the playable city
  car.position.x=THREE.MathUtils.clamp(car.position.x,-10,10);
  car.position.z=THREE.MathUtils.clamp(car.position.z,-60,12);
}

const raycaster=new THREE.Raycaster(), mouse=new THREE.Vector2();
function pick(e){
  mouse.x=(e.clientX/innerWidth)*2-1; mouse.y=-(e.clientY/innerHeight)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hits=raycaster.intersectObjects(stationMeshes,true);
  if(hits.length){
    let o=hits[0].object; while(o.parent&&!o.userData.station)o=o.parent;
    if(o.userData.station) openPanel(o.userData.station);
  }
}
renderer.domElement.addEventListener('click',pick);

const panel=document.getElementById('panel');
function openPanel(s){
  document.getElementById('panelTag').textContent=s.tag;
  document.getElementById('panelTitle').textContent=s.title;
  document.getElementById('panelBody').textContent=s.body;
  const a=document.getElementById('panelLink');a.textContent=s.label||'';a.href=s.link||'#';
  panel.classList.remove('hidden');
}
document.getElementById('closePanel').onclick=()=>panel.classList.add('hidden');

const menu=document.getElementById('menu');
document.getElementById('menuBtn').onclick=()=>menu.classList.remove('hidden');
document.getElementById('closeMenu').onclick=()=>menu.classList.add('hidden');
document.querySelectorAll('.menu-item').forEach(item=>{
  item.onclick=()=>{
    const s=stations.find(x=>x.id===item.dataset.target);
    if(s){car.position.copy(s.pos.clone().add(new THREE.Vector3(0,0,4)));car.position.y=.35;openPanel(s);menu.classList.add('hidden')}
  };
});

// Camera
const controls=new OrbitControls(camera,renderer.domElement);
controls.enablePan=false; controls.enableZoom=false; controls.enableDamping=true;
controls.minPolarAngle=.75;controls.maxPolarAngle=1.38;
let follow=true;
renderer.domElement.addEventListener('pointerdown',()=>follow=false);

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  updateCar(dt);
  const speedEl=document.getElementById('speedValue'); if(speedEl) speedEl.textContent=String(Math.round(Math.abs(speed)*6)).padStart(3,'0');
  stationMeshes.forEach((g,i)=>{
    g.rotation.y+=dt*.25;
    const orb=g.children[2];
    orb.position.y=.25+Math.sin(performance.now()*.0018+i)*.12;
  });
  if(follow){
    const target=car.position.clone();
    target.y+=.6;
    const desired=car.position.clone().add(new THREE.Vector3(8,6,10).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y));
    camera.position.lerp(desired,.06);
    controls.target.lerp(target,.08);
  }else controls.target.lerp(car.position.clone().add(new THREE.Vector3(0,.5,0)),.08);
  controls.update();
  renderer.render(scene,camera);
}
const clock=new THREE.Clock();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
setTimeout(()=>document.getElementById('loading').classList.add('hide'),900);
animate();
