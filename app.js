import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const $=id=>document.getElementById(id);
const loading=$("loading");

const canvas=$("scene");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05080d);
scene.fog=new THREE.Fog(0x05080d,18,95);

const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,150);
camera.position.set(0,1.58,1.3);

const clock=new THREE.Clock();
const train=new THREE.Group();
const outside=new THREE.Group();
scene.add(train,outside);

const mats={
 floor:new THREE.MeshStandardMaterial({color:0x17222d,metalness:.65,roughness:.32}),
 wall:new THREE.MeshStandardMaterial({color:0x253341,metalness:.55,roughness:.35}),
 seat:new THREE.MeshStandardMaterial({color:0x163a5d,metalness:.25,roughness:.5}),
 metal:new THREE.MeshStandardMaterial({color:0x9aa9b7,metalness:.85,roughness:.2}),
 glow:new THREE.MeshStandardMaterial({color:0x64cfff,emissive:0x1688bb,emissiveIntensity:2.2}),
 dark:new THREE.MeshStandardMaterial({color:0x071018,metalness:.6,roughness:.25}),
 glass:new THREE.MeshPhysicalMaterial({color:0x183f5d,transparent:true,opacity:.38,metalness:.1,roughness:.08})
};

function box(w,h,d,mat,x,y,z,parent=train){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 m.position.set(x,y,z); parent.add(m); return m;
}

// Complete carriage shell
box(6,.12,42,mats.floor,0,0,0);
box(.12,2.8,42,mats.wall,-3.05,1.4,0);
box(.12,2.8,42,mats.wall,3.05,1.4,0);
box(6,.12,42,mats.dark,0,3.05,0);

for(let z=-19;z<=19;z+=3.2){
 box(.16,.05,2.3,mats.glow,-1.35,2.92,z);
 box(.16,.05,2.3,mats.glow,1.35,2.92,z);
}
for(let z=-18.5;z<=18.5;z+=4.2){
 box(.04,1.25,3.15,mats.glass,-3.01,1.85,z);
 box(.04,1.25,3.15,mats.glass,3.01,1.85,z);
}

// Real seat system
const seatGroup=new THREE.Group();
seatGroup.name="REAL_USER_SEATS";
train.add(seatGroup);

const seatPlacements=[];
for(let z=-18;z<=18;z+=2.8){
 seatPlacements.push([-2.35,z,false]);
 seatPlacements.push([2.35,z,true]);
}

function addSeatModel(sceneRoot,x,z,flip){
 const s=sceneRoot.clone(true);
 s.position.set(x,0,z);
 if(flip)s.rotation.y=Math.PI;
 seatGroup.add(s);
}

function addFallbackSeat(x,z,flip){
 const g=new THREE.Group();
 g.position.set(x,0,z);
 seatGroup.add(g);
 box(1.15,.16,.48,mats.seat,0,.63,0,g);
 box(1.15,.72,.13,mats.seat,0,1.02,flip?-.22:.22,g);
 box(.10,.56,.55,mats.metal,-.48,.56,0,g);
 box(.10,.56,.55,mats.metal,.48,.56,0,g);
}

function loadSeats(){
 const loader=new GLTFLoader();
 loader.load(
  "assets_train_seat.glb",
  gltf=>{
   const model=gltf.scene;
   model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
   const bounds=new THREE.Box3().setFromObject(model);
   const size=bounds.getSize(new THREE.Vector3());
   const maxXZ=Math.max(size.x,size.z)||1;
   const scale=1.35/maxXZ;

   seatGroup.clear();
   seatPlacements.forEach(([x,z,flip])=>{
    const s=model.clone(true);
    s.scale.setScalar(scale);
    s.position.set(x,0,z);
    if(flip)s.rotation.y=Math.PI;
    seatGroup.add(s);
   });
   console.log("REAL SEAT MODEL LOADED");
  },
  undefined,
  err=>{
   console.error("Seat GLB failed:",err);
   seatGroup.clear();
   seatPlacements.forEach(p=>addFallbackSeat(p[0],p[1],p[2]));
  }
 );
}
loadSeats();

// Poles
for(let z=-19;z<=19;z+=3.2){
 box(.06,2.35,.06,mats.metal,-1.15,1.25,z);
 box(.06,2.35,.06,mats.metal,1.15,1.25,z);
 box(5.2,.05,.05,mats.metal,0,2.38,z);
}

// Front/rear door frames
function doorFrame(z){
 box(2.5,2.3,.14,mats.dark,0,1.45,z);
 box(.07,2.2,.20,mats.glow,-1.3,1.45,z-.12);
 box(.07,2.2,.20,mats.glow,1.3,1.45,z-.12);
}
doorFrame(-20.65);doorFrame(20.65);

// Sliding front station doors
const doorL=box(1.1,2.05,.18,mats.glass,-.56,1.45,-20.78);
const doorR=box(1.1,2.05,.18,mats.glass,.56,1.45,-20.78);
const closedL=-.56, closedR=.56;
function closeDoors(){doorL.position.x=closedL;doorR.position.x=closedR;}
function openDoors(){doorL.position.x=-1.18;doorR.position.x=1.18;}
closeDoors();

// Physical tablet prop
const tabletProp=new THREE.Group();
tabletProp.position.set(1.55,1.25,1.0);
tabletProp.rotation.y=-.22;
train.add(tabletProp);
box(1.55,1.1,.12,mats.dark,0,0,0,tabletProp);
box(1.35,.88,.03,mats.glow,0,0,.07,tabletProp);
box(1.43,.08,.12,mats.metal,0,-.62,0,tabletProp);

// Outside city
const cityMats=[0x10243a,0x17334b,0x0d1a29,0x20455f];
for(let i=0;i<90;i++){
 const h=2+Math.random()*12,w=1.2+Math.random()*3,d=1.5+Math.random()*3;
 const mat=new THREE.MeshStandardMaterial({color:cityMats[i%cityMats.length],metalness:.25,roughness:.65});
 const b=box(w,h,d,mat,0,0,0,outside);
 b.position.set((Math.random()<.5?-1:1)*(7+Math.random()*18),h/2,Math.random()*180-90);
}
for(let z=-90;z<90;z+=5){
 box(.12,.12,1.4,mats.glow,-5.3,2.4,z,outside);
 box(.12,.12,1.4,mats.glow,5.3,2.4,z,outside);
}

scene.add(new THREE.HemisphereLight(0x9acbff,0x05070a,1.7));
const key=new THREE.DirectionalLight(0xffffff,1.3);
key.position.set(0,5,5);scene.add(key);

// Temporary station visible through the open doors
const station=new THREE.Group();
station.position.set(0,0,-23);
scene.add(station);
const platformMat=new THREE.MeshStandardMaterial({color:0x202b35,metalness:.45,roughness:.5});
box(12,.12,10,platformMat,0,0,0,station);
box(6,.08,.25,mats.glow,0,.1,-1.8,station);
box(6,.08,.25,mats.glow,0,.1,1.8,station);

const stationSign=box(5.6,1.0,.16,mats.dark,0,2.55,-1.5,station);
const stationGlow=box(4.9,.56,.04,mats.glow,0,2.55,-1.60,station);
station.visible=false;

const stationLabel=document.createElement("div");
stationLabel.id="stationWorldLabel";
stationLabel.textContent="STATION";
document.body.appendChild(stationLabel);

function showStation(name){
 station.visible=true;
 stationLabel.textContent=name+" STATION";
 stationLabel.style.display="block";
}
function hideStation(){
 station.visible=false;
 stationLabel.style.display="none";
}

// Interaction
let running=false,traveling=false,selectedStation="";
let lookYaw=0,lookPitch=0,zoom=72;
let dragging=false,lastX=0,lastY=0,travelStart=0;

function updateCamera(){
 camera.fov=zoom;
 camera.updateProjectionMatrix();
 const target=new THREE.Vector3(
  Math.sin(lookYaw)*3,
  1.65+lookPitch,
  -Math.cos(lookYaw)*3
 );
 camera.lookAt(target);
}

function showTablet(){$("tabletUI").classList.remove("hidden")}
function hideTablet(){$("tabletUI").classList.add("hidden")}

canvas.addEventListener("pointerdown",e=>{
 if(!running||traveling)return;
 dragging=true;lastX=e.clientX;lastY=e.clientY;
});
window.addEventListener("pointerup",()=>dragging=false);
window.addEventListener("pointermove",e=>{
 if(!dragging||!running||traveling)return;
 lookYaw-=(e.clientX-lastX)*.004;
 lookPitch-=(e.clientY-lastY)*.0025;
 lookPitch=Math.max(-.55,Math.min(.45,lookPitch));
 lastX=e.clientX;lastY=e.clientY;
 updateCamera();
});
window.addEventListener("wheel",e=>{
 if(!running)return;
 zoom=Math.max(42,Math.min(92,zoom+(e.deltaY>0?3:-3)));
 updateCamera();
},{passive:true});

document.querySelectorAll("#tabletUI button").forEach(btn=>{
 btn.addEventListener("click",()=>{
  if(traveling)return;
  selectedStation=btn.dataset.station;
  $("tabletStatus").textContent="ROUTE LOCKED: "+selectedStation;
  $("stationHud").textContent="TRAVELLING TO "+selectedStation;
  traveling=true;
  travelStart=clock.elapsedTime;
  hideTablet();
  $("arrivalTitle").textContent=selectedStation;
  $("arrival").classList.remove("hidden");
  setTimeout(()=>$("arrival").classList.add("hidden"),1200);
 });
});

$("startBtn").addEventListener("click",()=>{
 const overlay=$("startOverlay");
 overlay.style.opacity="0";
 overlay.style.pointerEvents="none";
 setTimeout(()=>overlay.style.display="none",260);
 running=true;
 $("stationHud").textContent="IN TRANSIT";
 showTablet();
 updateCamera();
});

function arrive(){
 traveling=false;
 $("stationHud").textContent="ARRIVED — "+selectedStation;
 openDoors();
 showStation(selectedStation);
}

function returnToTrain(){
 closeDoors();
 hideStation();
 $("stationHud").textContent="IN TRANSIT";
 showTablet();
}

// Keyboard escape returns to train after arrival.
window.addEventListener("keydown",e=>{
 if(e.key==="Escape" && !traveling){
  returnToTrain();
 }
});

function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.05);
 const now=clock.elapsedTime;

 if(running){
  train.position.y=Math.sin(now*16)*.006;
 }
 if(running&&traveling){
  outside.position.z=(outside.position.z+dt*18)%12;
  if(now-travelStart>4.8)arrive();
 }
 updateCamera();
 renderer.render(scene,camera);
}

window.addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
});

loading.style.display="none";
animate();
