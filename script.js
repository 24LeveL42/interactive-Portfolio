import * as THREE from "three";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";

const boot=document.querySelector("#boot");
const finish=()=>{if(boot){boot.style.opacity="0";setTimeout(()=>boot.remove(),500)}};
window.addEventListener("error",finish);
window.addEventListener("unhandledrejection",finish);

try{
const host=document.querySelector("#scene");
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9db0b7);scene.fog=new THREE.Fog(0x9db0b7,18,42);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);camera.position.set(7,7,9);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xddeeff,0x596052,2.2));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(-8,14,7);sun.castShadow=true;scene.add(sun);
const world=new THREE.Group();scene.add(world);const material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
let ground=new THREE.Mesh(new THREE.CylinderGeometry(16,17,.5,64),material(0x718566));ground.position.y=-.25;ground.receiveShadow=true;world.add(ground);
let road=new THREE.Mesh(new THREE.RingGeometry(4.2,7,64),material(0x282b28));road.rotation.x=-Math.PI/2;road.position.y=.02;world.add(road);
function box(w,h,d,c,x,y,z){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);m.castShadow=true;world.add(m);return m}
function tree(x,z){box(.3,1,.3,0x654b31,x,.5,z);let c=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,1),material(0x2d5838));c.position.set(x,1.65,z);c.castShadow=true;world.add(c)}
for(let i=0;i<16;i++){let a=i*.95,r=10.5+(i%3);tree(Math.cos(a)*r,Math.sin(a)*r)}
function building(x,z,c){box(2.6,2,2.6,c,x,1,z);box(2.9,.16,2.9,0x333333,x,2.08,z)}
building(-9,-3,0x252a30);building(8,-5,0x252a30);building(-7,6,0x252a30);building(7,5,0x252a30);

const player=new THREE.Group();world.add(player);const USE_CUSTOM_MODEL=false;
function vehicle(){let g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(1.3,.45,2),material(0x171717));b.position.y=.45;g.add(b);let c=new THREE.Mesh(new THREE.BoxGeometry(.95,.45,1),material(0xd9ff4a));c.position.y=.8;g.add(c);return g}
function addModel(m){let b=new THREE.Box3().setFromObject(m),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=1.8/(Math.max(s.x,s.y,s.z)||1);m.scale.setScalar(scale);m.position.sub(c.multiplyScalar(scale));m.position.y=.2;player.add(m)}
if(USE_CUSTOM_MODEL)new GLTFLoader().load("assets/player.glb",g=>addModel(g.scene),undefined,()=>addModel(vehicle()));else addModel(vehicle());

const locations=[
{label:"01 / ABOUT",title:"ABOUT ME",x:-9,z:-3,text:"I’m a digital creator exploring the space between people, design and technology.",tags:["UI/UX","CREATIVE TECH","3D"]},
{label:"02 / WORK",title:"SELECTED WORK",x:8,z:-5,text:"Kopi Boy, R2M and Duty Planner are examples of my product concepts and interactive work.",tags:["KOPI BOY","R2M","DUTY PLANNER"]},
{label:"03 / SKILLS",title:"MY TOOLKIT",x:-7,z:6,text:"Interface design, rapid prototyping, 3D and creative technology.",tags:["FIGMA","BLENDER","THREE.JS","UNREAL ENGINE"]},
{label:"04 / CONTACT",title:"LET'S TALK",x:7,z:5,text:"Replace this section with your real contact details before submission.",tags:["EMAIL","LINKEDIN","GITHUB"]}];
const markers=[];locations.forEach(d=>{let r=new THREE.Mesh(new THREE.TorusGeometry(1.3,.045,8,40),new THREE.MeshBasicMaterial({color:0xd9ff4a}));r.rotation.x=-Math.PI/2;r.position.set(d.x,.08,d.z);world.add(r);markers.push({d,r})});
const keys={};addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.code==="Space")keys.space=true});addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;if(e.code==="Space")keys.space=false});
let v=0,heading=0,active=null;
function panel(d){document.querySelector("#panelLabel").textContent=d.label;document.querySelector("#panelTitle").textContent=d.title;document.querySelector("#panelBody").innerHTML=`<p>${d.text}</p><div class="tags">${d.tags.map(x=>`<span>${x}</span>`).join("")}</div>`;document.querySelector("#panel").classList.add("open")}
function closePanel(){document.querySelector("#panel").classList.remove("open");active=null}
document.querySelector("#close").onclick=closePanel;
document.querySelector("#help").onclick=()=>document.querySelector("#helpPanel").classList.add("open");
document.querySelector("#closeHelp").onclick=()=>document.querySelector("#helpPanel").classList.remove("open");
function update(){let t=(keys.w?1:0)-(keys.s?.65:0);if(keys.space)t=0;v+=t*.014;v*=keys.space?.86:.96;v=THREE.MathUtils.clamp(v,-.06,.13);if(keys.a)heading+=.025*(Math.abs(v)*14+.3);if(keys.d)heading-=.025*(Math.abs(v)*14+.3);player.rotation.y=heading;player.position.x+=Math.sin(heading)*v;player.position.z+=Math.cos(heading)*v;if(Math.hypot(player.position.x,player.position.z)>13){player.position.multiplyScalar(.97);v*=-.3}camera.position.lerp(new THREE.Vector3(player.position.x-Math.sin(heading)*6,5.5,player.position.z-Math.cos(heading)*6),.055);camera.lookAt(player.position.x,1.2,player.position.z);markers.forEach(m=>m.r.rotation.z+=.01);let near=null,dist=99;markers.forEach(m=>{let d=player.position.distanceTo(new THREE.Vector3(m.d.x,0,m.d.z));if(d<2&&d<dist){near=m;dist=d}});if(near!==active){active=near;if(active)panel(active.d);else closePanel()}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}addEventListener("resize",resize);
function animate(){requestAnimationFrame(animate);update();renderer.render(scene,camera)}animate();
setTimeout(finish,1200);
}catch(e){console.error(e);finish();document.querySelector("#hint").textContent="3D could not load — refresh the page";}
