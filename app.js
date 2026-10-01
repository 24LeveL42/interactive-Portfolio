import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const $ = id => document.getElementById(id);
const canvas = $("scene");
const loading = $("loading");

const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07101a);
scene.fog = new THREE.Fog(0x07101a, 20, 105);

const camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, .05, 160);
camera.position.set(0, 1.58, 1.35);

const clock = new THREE.Clock();
const train = new THREE.Group();
const outside = new THREE.Group();
scene.add(train, outside);

const mats = {
 floor:new THREE.MeshStandardMaterial({color:0x25323e,metalness:.58,roughness:.30}),
 wall:new THREE.MeshStandardMaterial({color:0x334654,metalness:.48,roughness:.30}),
 ceiling:new THREE.MeshStandardMaterial({color:0x1d2934,metalness:.60,roughness:.25}),
 metal:new THREE.MeshStandardMaterial({color:0xaebbc6,metalness:.86,roughness:.18}),
 glow:new THREE.MeshStandardMaterial({color:0x77d8ff,emissive:0x1598d0,emissiveIntensity:2.4}),
 dark:new THREE.MeshStandardMaterial({color:0x071018,metalness:.55,roughness:.24}),
 glass:new THREE.MeshPhysicalMaterial({color:0x2d6584,transparent:true,opacity:.28,metalness:.08,roughness:.08}),
 platform:new THREE.MeshStandardMaterial({color:0x2a343b,metalness:.40,roughness:.52})
};

function box(w,h,d,mat,x,y,z,parent=train){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 m.position.set(x,y,z);
 parent.add(m);
 return m;
}

// =========================
// TRAIN CAR
// =========================
box(6,.12,42,mats.floor,0,0,0);
box(.12,2.8,42,mats.wall,-3.05,1.4,0);
box(.12,2.8,42,mats.wall,3.05,1.4,0);
box(6,.12,42,mats.ceiling,0,3.05,0);

// Window panels
for(let z=-18.5;z<=18.5;z+=4.2){
 box(.04,1.30,3.15,mats.glass,-3.01,1.85,z);
 box(.04,1.30,3.15,mats.glass,3.01,1.85,z);
}

// =========================
// CEILING LIGHTING — brighter
// =========================
for(let z=-19;z<=19;z+=3.2){
 box(.22,.055,2.55,mats.glow,-1.15,2.91,z);
 box(.22,.055,2.55,mats.glow,1.15,2.91,z);
 box(5.1,.035,.07,mats.glow,0,2.60,z);
}

// Extra side ambient light strips
for(let z=-18;z<=18;z+=4.5){
 box(.04,.08,2.7,mats.glow,-2.94,2.32,z);
 box(.04,.08,2.7,mats.glow,2.94,2.32,z);
}

// NO VERTICAL POLES / NO HORIZONTAL GRAB BARS.
// The previous bar system has deliberately been removed.

// =========================
// REAL USER SEATS
// =========================
const seatGroup = new THREE.Group();
seatGroup.name = "USER_SEATS";
train.add(seatGroup);

const seatPlacements=[];
for(let z=-18; z<=18; z+=2.8){
 seatPlacements.push([-2.35,z,false]);
 seatPlacements.push([ 2.35,z,true]);
}

function fallbackSeat(x,z,flip){
 const g=new THREE.Group();
 g.position.set(x,0,z);
 seatGroup.add(g);
 box(1.15,.16,.48,mats.seat,0,.63,0,g);
 box(1.15,.72,.13,mats.seat,0,1.02,flip?-.22:.22,g);
 box(.10,.56,.55,mats.metal,-.48,.56,0,g);
 box(.10,.56,.55,mats.metal,.48,.56,0,g);
}

function loadSeats(){
 const loader = new GLTFLoader();
 loader.load(
   "assets_train_seat.glb",
   gltf=>{
     const model=gltf.scene;
     model.traverse(o=>{
       if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}
     });

     const bounds=new THREE.Box3().setFromObject(model);
     const size=bounds.getSize(new THREE.Vector3());
     const maxXZ=Math.max(size.x,size.z)||1;
     const scale=1.35/maxXZ;

     seatGroup.clear();

     seatPlacements.forEach(([x,z,flip])=>{
       const s=model.clone(true);
       s.scale.setScalar(scale);

       // User requested 90-degree Z rotation.
       s.rotation.z=Math.PI/2;

       // Mirror the opposite row across the carriage.
       if(flip) s.rotation.y=Math.PI;

       s.position.set(x,0,z);
       seatGroup.add(s);
     });

     console.log("✓ REAL SEAT MODEL LOADED");
   },
   undefined,
   error=>{
     console.error("Seat GLB failed to load:",error);
     seatGroup.clear();
     seatPlacements.forEach(p=>fallbackSeat(p[0],p[1],p[2]));
   }
 );
}
loadSeats();

// =========================
// FRONT / REAR DOOR FRAME
// =========================
function doorFrame(z){
 box(2.5,2.3,.14,mats.dark,0,1.45,z);
 box(.07,2.2,.20,mats.glow,-1.30,1.45,z-.12);
 box(.07,2.2,.20,mats.glow, 1.30,1.45,z-.12);
}
doorFrame(-20.65);
doorFrame(20.65);

// Sliding doors at the front end
const doorL=box(1.10,2.05,.18,mats.glass,-.56,1.45,-20.78);
const doorR=box(1.10,2.05,.18,mats.glass, .56,1.45,-20.78);
const CLOSED_L=-.56, CLOSED_R=.56;
function closeDoors(){doorL.position.x=CLOSED_L;doorR.position.x=CLOSED_R;}
function openDoors(){doorL.position.x=-1.22;doorR.position.x=1.22;}
closeDoors();

// =========================
// TABLET PROP
// =========================
const tabletProp=new THREE.Group();
tabletProp.position.set(1.55,1.25,1.0);
tabletProp.rotation.y=-.22;
train.add(tabletProp);
box(1.55,1.10,.12,mats.dark,0,0,0,tabletProp);
box(1.35,.88,.03,mats.glow,0,0,.07,tabletProp);
box(1.43,.08,.12,mats.metal,0,-.62,0,tabletProp);

// =========================
// MOVING FUTURISTIC CITY
// =========================
const cityMats=[0x142b42,0x1a3c55,0x10243a,0x24556d];
for(let i=0;i<90;i++){
 const h=2+Math.random()*12;
 const w=1.2+Math.random()*3;
 const d=1.5+Math.random()*3;
 const mat=new THREE.MeshStandardMaterial({
   color:cityMats[i%cityMats.length],metalness:.20,roughness:.62
 });
 const b=box(w,h,d,mat,0,0,0,outside);
 b.position.set((Math.random()<.5?-1:1)*(7+Math.random()*18),h/2,Math.random()*180-90);
}
for(let z=-90;z<90;z+=5){
 box(.12,.12,1.4,mats.glow,-5.3,2.4,z,outside);
 box(.12,.12,1.4,mats.glow, 5.3,2.4,z,outside);
}

// =========================
// LIGHTING — much brighter
// =========================
scene.add(new THREE.HemisphereLight(0xd8efff,0x263746,2.2));

const key=new THREE.DirectionalLight(0xffffff,2.1);
key.position.set(0,6,5);
scene.add(key);

const fillL=new THREE.PointLight(0x75cfff,5.0,15);
fillL.position.set(-2.2,2.3,2);
train.add(fillL);

const fillR=new THREE.PointLight(0x75cfff,5.0,15);
fillR.position.set(2.2,2.3,2);
train.add(fillR);

// =========================
// TEMPORARY STATION
// =========================
const station=new THREE.Group();
station.position.set(0,0,-23);
scene.add(station);

box(12,.12,10,mats.platform,0,0,0,station);
box(6,.08,.25,mats.glow,0,.1,-1.8,station);
box(6,.08,.25,mats.glow,0,.1,1.8,station);

// Station wall / portal for now
box(10,3,.18,mats.dark,0,1.5,-4.0,station);
box(7,1.0,.05,mats.glow,0,2.55,-4.12,station);
station.visible=false;

// =========================
// STATE
// =========================
let running=false;
let traveling=false;
let outsideStation=false;
let selectedStation="";
let lookYaw=0;
let lookPitch=0;
let zoom=72;
let dragging=false;
let lastX=0,lastY=0;
let travelStart=0;

function updateCamera(){
 camera.fov=zoom;
 camera.updateProjectionMatrix();

 let target;
 if(outsideStation){
   // After exiting, place the viewer on the station platform facing the train.
   target=new THREE.Vector3(0,1.55,-20.4);
 }else{
   target=new THREE.Vector3(
     Math.sin(lookYaw)*3,
     1.65+lookPitch,
     -Math.cos(lookYaw)*3
   );
 }
 camera.lookAt(target);
}

function setTabletState(){
 $("exitBtn").disabled = !(selectedStation && !traveling && !outsideStation);
 $("returnBtn").disabled = !outsideStation;

 if(outsideStation){
   $("tabletStatus").textContent="ON PLATFORM • "+selectedStation;
 }else if(traveling){
   $("tabletStatus").textContent="TRAVELLING TO "+selectedStation;
 }else{
   $("tabletStatus").textContent="TRAIN READY";
 }
}

function showStation(){
 station.visible=true;
 $("stationWorldLabel").textContent=selectedStation+" STATION";
 $("stationWorldLabel").style.display="block";
}

function hideStation(){
 station.visible=false;
 $("stationWorldLabel").style.display="none";
}

function beginTravel(){
 if(!selectedStation || traveling || outsideStation) return;

 traveling=true;
 travelStart=clock.elapsedTime;
 closeDoors();

 $("stationHud").textContent="TRAVELLING TO "+selectedStation;
 $("arrivalTitle").textContent=selectedStation;
 $("arrival").classList.remove("hidden");
 setTabletState();

 setTimeout(()=>$("arrival").classList.add("hidden"),1200);
}

function arrive(){
 traveling=false;
 openDoors();
 showStation();

 $("stationHud").textContent="ARRIVED — "+selectedStation;
 $("tabletStatus").textContent="DOORS OPEN • CHOOSE EXIT";
 setTabletState();
}

function exitAtStation(){
 if(traveling || !selectedStation || outsideStation) return;

 outsideStation=true;
 openDoors();
 showStation();

 // Put the viewer just outside the carriage.
 camera.position.set(0,1.58,-22.2);
 lookYaw=0;
 lookPitch=0;
 zoom=72;

 $("stationHud").textContent=selectedStation+" • ON PLATFORM";
 $("tabletStatus").textContent="EXPLORE STATION";
 setTabletState();
 updateCamera();
}

function returnToSeat(){
 if(!outsideStation) return;

 outsideStation=false;
 hideStation();
 closeDoors();

 camera.position.set(0,1.58,1.35);
 lookYaw=0;
 lookPitch=0;
 zoom=72;

 $("stationHud").textContent="BACK ON TRAIN";
 $("tabletStatus").textContent="READY FOR NEXT DESTINATION";
 setTabletState();
 updateCamera();
}

// =========================
// INPUT
// =========================
canvas.addEventListener("pointerdown",e=>{
 if(!running || traveling) return;
 dragging=true;
 lastX=e.clientX;
 lastY=e.clientY;
});
window.addEventListener("pointerup",()=>dragging=false);

window.addEventListener("pointermove",e=>{
 if(!dragging || !running || traveling || outsideStation) return;

 lookYaw-=(e.clientX-lastX)*.004;
 lookPitch-=(e.clientY-lastY)*.0025;
 lookPitch=Math.max(-.55,Math.min(.45,lookPitch));

 lastX=e.clientX;
 lastY=e.clientY;
 updateCamera();
});

window.addEventListener("wheel",e=>{
 if(!running || outsideStation) return;

 zoom=Math.max(42,Math.min(92,zoom+(e.deltaY>0?3:-3)));
 updateCamera();
},{passive:true});

// Tablet buttons
document.querySelectorAll("#tabletUI button[data-station]").forEach(btn=>{
 btn.addEventListener("click",()=>beginTravel());
 // Keep station value separate so beginTravel gets the clicked destination.
 btn.addEventListener("click",()=>{selectedStation=btn.dataset.station;});
});

// Replace above event ordering with a delegated safe handler.
document.querySelectorAll("#tabletUI button[data-station]").forEach(btn=>{
 btn.onclick=()=>{
   if(traveling || outsideStation) return;
   selectedStation=btn.dataset.station;
   beginTravel();
 };
});

$("exitBtn").onclick=exitAtStation;
$("returnBtn").onclick=returnToSeat;

$("startBtn").onclick=()=>{
 $("startOverlay").style.opacity="0";
 $("startOverlay").style.pointerEvents="none";
 setTimeout(()=>$("startOverlay").style.display="none",260);

 running=true;
 $("stationHud").textContent="IN TRANSIT";
 setTabletState();
 updateCamera();
};

window.addEventListener("keydown",e=>{
 if(e.key==="Escape" && outsideStation) returnToSeat();
});

// =========================
// LOOP
// =========================
function animate(){
 requestAnimationFrame(animate);

 const dt=Math.min(clock.getDelta(),.05);
 const now=clock.elapsedTime;

 if(running && !outsideStation){
   train.position.y=Math.sin(now*16)*.006;
 }

 if(running && traveling){
   outside.position.z=(outside.position.z+dt*18)%12;

   if(now-travelStart>4.8){
     arrive();
   }
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
