// RAJINI METRO V1.1 — stable GitHub Pages build
(function(){
"use strict";
const loading=document.getElementById("loading");
if(typeof THREE==="undefined"){
  loading.innerHTML="<div>3D engine could not load.<br>Please refresh and check your internet connection.</div>";
  return;
}

const canvas=document.getElementById("scene");
const renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05080d);
scene.fog=new THREE.Fog(0x05080d,18,90);

const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,150);
camera.position.set(0,1.62,1.2);

const clock=new THREE.Clock(), train=new THREE.Group(), outside=new THREE.Group();
scene.add(train); scene.add(outside);

const mats={
 floor:new THREE.MeshStandardMaterial({color:0x17222d,metalness:.65,roughness:.32}),
 wall:new THREE.MeshStandardMaterial({color:0x253341,metalness:.55,roughness:.35}),
 seat:new THREE.MeshStandardMaterial({color:0x163a5d,metalness:.25,roughness:.5}),
 metal:new THREE.MeshStandardMaterial({color:0x9aa9b7,metalness:.85,roughness:.2}),
 glow:new THREE.MeshStandardMaterial({color:0x64cfff,emissive:0x1688bb,emissiveIntensity:2.2}),
 dark:new THREE.MeshStandardMaterial({color:0x071018,metalness:.6,roughness:.25}),
 glass:new THREE.MeshPhysicalMaterial({color:0x183f5d,transparent:true,opacity:.38,metalness:.1,roughness:.08})
};
function box(w,h,d,mat,x,y,z,parent){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
 m.position.set(x,y,z); (parent||train).add(m); return m;
}
let seatTemplate=null;
const seatGroup=new THREE.Group();
seatGroup.name="SEAT_SYSTEM";
train.add(seatGroup);

const seatPlacements=[];
for(let z=-18;z<=18;z+=2.8){
  seatPlacements.push([-2.35,z,false]);
  seatPlacements.push([2.35,z,true]);
}

function makePlaceholderSeat(x,z,flip){
 const g=new THREE.Group();
 g.position.set(x,0,z);
 seatGroup.add(g);
 box(1.15,.16,.48,mats.seat,0,.63,0,g);
 box(1.15,.72,.13,mats.seat,0,1.02,flip?-.22:.22,g);
 box(.10,.56,.55,mats.metal,-.48,.56,0,g);
 box(.10,.56,.55,mats.metal,.48,.56,0,g);
}
seatPlacements.forEach(p=>makePlaceholderSeat(p[0],p[1],p[2]));

function loadRealSeats(){
 if(typeof THREE.GLTFLoader==="undefined"){
   console.warn("GLTFLoader unavailable; using placeholder seats.");
   return;
 }
 const loader=new THREE.GLTFLoader();
 loader.load("assets_train_seat.glb", gltf=>{
   seatTemplate=gltf.scene;
   seatTemplate.traverse(o=>{
     if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}
   });

   const bounds=new THREE.Box3().setFromObject(seatTemplate);
   const size=bounds.getSize(new THREE.Vector3());
   const maxDim=Math.max(size.x,size.y,size.z)||1;

   // Approximate a single MRT passenger seat width.
   const targetWidth=1.35;
   const scale=targetWidth/(Math.max(size.x,size.z)||maxDim);

   seatGroup.clear();

   seatPlacements.forEach(([x,z,flip])=>{
     const s=seatTemplate.clone(true);
     s.position.set(x,0,z);
     s.scale.setScalar(scale);
     if(flip) s.rotation.y=Math.PI;
     seatGroup.add(s);
   });

   console.log("User train seat model installed.");
 }, undefined, err=>{
   console.warn("Seat GLB failed to load; keeping placeholders.",err);
 });
}

// Simple futuristic city outside
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
const key=new THREE.DirectionalLight(0xffffff,1.3);key.position.set(0,5,5);scene.add(key);
loadRealSeats();

let running=false,traveling=false,selectedStation="",lookYaw=0,lookPitch=0,zoom=72;
let dragging=false,lastX=0,lastY=0,travelStart=0;

const tabletUI=document.getElementById("tabletUI");
const stationHud=document.getElementById("stationHud");
const arrival=document.getElementById("arrival");
const arrivalTitle=document.getElementById("arrivalTitle");
const stationPanel=document.getElementById("stationPanel");
const stationTitle=document.getElementById("stationTitle");
const stationText=document.getElementById("stationText");

function updateCamera(){
 camera.fov=zoom;camera.updateProjectionMatrix();
 const target=new THREE.Vector3(Math.sin(lookYaw)*3,1.65+lookPitch,-Math.cos(lookYaw)*3);
 camera.lookAt(target);
}
function showTablet(){tabletUI.classList.remove("hidden")}
function hideTablet(){tabletUI.classList.add("hidden")}

canvas.addEventListener("pointerdown",e=>{
 dragging=true;lastX=e.clientX;lastY=e.clientY;
});
window.addEventListener("pointerup",()=>dragging=false);
window.addEventListener("pointermove",e=>{
 if(!dragging||!running||traveling)return;
 lookYaw-=(e.clientX-lastX)*.004;
 lookPitch-=(e.clientY-lastY)*.0025;
 lookPitch=Math.max(-.55,Math.min(.45,lookPitch));
 lastX=e.clientX;lastY=e.clientY;updateCamera();
});
window.addEventListener("wheel",e=>{
 if(!running)return;
 zoom=Math.max(42,Math.min(92,zoom+(e.deltaY>0?3:-3)));
 updateCamera();
},{passive:true});

document.querySelectorAll("#tabletUI button").forEach(btn=>{
 btn.addEventListener("click",function(){
  if(traveling)return;
  selectedStation=this.dataset.station;
  document.getElementById("tabletStatus").textContent="ROUTE LOCKED: "+selectedStation;
  stationHud.textContent="ROUTE: "+selectedStation;
  traveling=true;travelStart=clock.elapsedTime;hideTablet();
  arrivalTitle.textContent=selectedStation;
  arrival.classList.remove("hidden");
  setTimeout(()=>arrival.classList.add("hidden"),1200);
 });
});

document.getElementById("backTrain").addEventListener("click",function(){
 stationPanel.classList.add("hidden");
 resetDoors();
// Temporary station environment. This will be replaced by the real station model later.
const stationWorld=new THREE.Group();
stationWorld.position.set(0,0,-23.0);
scene.add(stationWorld);

const platformMat=new THREE.MeshStandardMaterial({color:0x202b35,metalness:.45,roughness:.5});
const stationSignMat=new THREE.MeshStandardMaterial({color:0x07121e,metalness:.35,roughness:.35});
const stationTextMat=new THREE.MeshStandardMaterial({color:0xffcf4a,emissive:0x8a5d00,emissiveIntensity:2});

box(12,.12,10,platformMat,0,0,0,stationWorld);
box(6,.08,.25,mats.glow,0,.1,-1.8,stationWorld);
box(6,.08,.25,mats.glow,0,.1,1.8,stationWorld);

const signBoard=box(5.4,1.1,.16,stationSignMat,0,2.5,-1.5,stationWorld);
const signLight=box(4.7,.62,.04,stationTextMat,0,2.5,-1.60,stationWorld);
signBoard.visible=false;
signLight.visible=false;

const stationPlaceholderLabel=document.createElement("div");
stationPlaceholderLabel.id="stationWorldLabel";
stationPlaceholderLabel.textContent="STATION";
document.body.appendChild(stationPlaceholderLabel);

function setStationWorld(name, visible){
  signBoard.visible=visible;
  signLight.visible=visible;
  stationWorld.visible=visible;
  stationPlaceholderLabel.textContent=name+" STATION";
  stationPlaceholderLabel.style.display=visible?"block":"none";
}
setStationWorld("",false);

 traveling=false;
 stationHud.textContent="IN TRANSIT";
 showTablet();
});

document.getElementById("startBtn").addEventListener("click",function(){
 const overlay=document.getElementById("startOverlay");
 overlay.style.opacity="0";overlay.style.pointerEvents="none";
 setTimeout(()=>overlay.style.display="none",260);
 running=true;setStationWorld("",false);showTablet();updateCamera();
});

function arrive(){
 traveling=false;
 stationHud.textContent="ARRIVED: "+selectedStation;
 openDoors();
 setStationWorld(selectedStation,true);
 stationTitle.textContent=selectedStation+" STATION";
 stationText.textContent="TRAIN STOPPED • DOORS OPEN • STATION MODEL COMING NEXT";
 stationPanel.classList.add("hidden");
}

function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.05), now=clock.elapsedTime;
 train.position.y=Math.sin(now*16)*.006;
 if(running&&traveling){
   outside.position.z=(outside.position.z+dt*18)%12;
   if(now-travelStart>4.8)arrive();
 }
 updateCamera();
 renderer.render(scene,camera);
}
animate();

window.addEventListener("resize",function(){
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
});
loading.style.display="none";
})();