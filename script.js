import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import {OrbitControls} from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";

const boot=document.querySelector("#boot"), sceneHost=document.querySelector("#scene");
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9db0b7);
scene.fog=new THREE.Fog(0x9db0b7,18,42);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);
camera.position.set(7,7,9);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace;
sceneHost.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xddeeff,0x596052,2.2));
const sun=new THREE.DirectionalLight(0xffffff,3.2); sun.position.set(-8,14,7); sun.castShadow=true; scene.add(sun);

const world=new THREE.Group(); scene.add(world);
const mat=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(48,48),mat(0x5f7659)); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; world.add(ground);

// Island / roads
const island=new THREE.Mesh(new THREE.CylinderGeometry(16,17,.5,64),mat(0x718566)); island.position.y=-.25; island.receiveShadow=true; world.add(island);
const roadMat=mat(0x282b28);
const road=new THREE.Mesh(new THREE.RingGeometry(4.2,7.0,64),roadMat); road.rotation.x=-Math.PI/2; road.position.y=.015; world.add(road);
const innerRoad=new THREE.Mesh(new THREE.RingGeometry(0,2.2,48),roadMat); innerRoad.rotation.x=-Math.PI/2; innerRoad.position.y=.02; world.add(innerRoad);

function box(w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;world.add(m);return m}
function tree(x,z){const trunk=box(.35,1,.35,0x654b31,x,.5,z);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,1),mat(0x2d5838));crown.position.set(x,1.75,z);crown.castShadow=true;world.add(crown)}
for(let i=0;i<18;i++){const a=i*.9;const r=10.5+(i%3)*1.4;tree(Math.cos(a)*r,Math.sin(a)*r)}
// Simple buildings
function building(x,z,c,name){box(2.7,2,2.7,c,x,1,z);box(2.95,.18,2.95,0x333333,x,2.09,z);const sign=box(1.8,.4,.08,0xd9ff4a,x,1.45,z+1.38);sign.name=name}
building(-9,-3,0x252a30,"ABOUT"); building(8,-5,0x252a30,"WORK"); building(-7,6,0x252a30,"SKILLS"); building(7,5,0x252a30,"CONTACT");

// Decorative central sculpture
const sculpture=new THREE.Mesh(new THREE.TorusKnotGeometry(1.1,.25,80,12),new THREE.MeshStandardMaterial({color:0xd9ff4a,metalness:.25,roughness:.28,emissive:0x1b2204}));
sculpture.position.y=1.8; sculpture.castShadow=true; world.add(sculpture);

// Replaceable player model
const player=new THREE.Group(); world.add(player);
let playerVisual;
const USE_CUSTOM_MODEL=false; // set true when assets/player.glb exists
function makeVehicle(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(1.3,.45,2),mat(0x171717));body.position.y=.45;body.castShadow=true;g.add(body);const cabin=new THREE.Mesh(new THREE.BoxGeometry(.95,.45,1),mat(0xd9ff4a));cabin.position.y=.8;cabin.castShadow=true;g.add(cabin);for(const x of[-.55,.55])for(const z of[-.65,.65]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.12,16),mat(0x080808));w.rotation.z=Math.PI/2;w.position.set(x,.28,z);g.add(w)}return g}
function fitModel(m){const b=new THREE.Box3().setFromObject(m),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=1.8/(Math.max(s.x,s.y,s.z)||1);m.scale.setScalar(scale);m.position.sub(c.multiplyScalar(scale));m.position.y=.2;player.add(m)}
if(USE_CUSTOM_MODEL)new GLTFLoader().load("assets/player.glb",g=>fitModel(g.scene),undefined,()=>fitModel(makeVehicle()));else fitModel(makeVehicle());

// Portfolio locations
const locations=[
 {key:"about",title:"ABOUT ME",label:"01 / ABOUT",pos:new THREE.Vector3(-9,0,-3),text:"I’m a digital creator exploring the space between people, design and technology. Welcome to my small interactive portfolio world.",tags:["UI/UX","CREATIVE TECH","3D"]},
 {key:"work",title:"SELECTED WORK",label:"02 / WORK",pos:new THREE.Vector3(8,0,-5),text:"A collection of product concepts and interactive experiences. Kopi Boy, R2M and Duty Planner are examples of my design and prototyping work.",tags:["KOPI BOY","R2M","DUTY PLANNER"]},
 {key:"skills",title:"MY TOOLKIT",label:"03 / SKILLS",pos:new THREE.Vector3(-7,0,6),text:"I work across interface design, rapid prototyping, 3D and creative technology.",tags:["FIGMA","BLENDER","THREE.JS","UNREAL ENGINE","HTML / CSS / JS"]},
 {key:"contact",title:"LET'S TALK",label:"04 / CONTACT",pos:new THREE.Vector3(7,0,5),text:"Have an idea or project? Replace this text with your real contact details before submitting your portfolio.",tags:["EMAIL","LINKEDIN","GITHUB"]}
];
const markers=[];
locations.forEach((l,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.045,8,40),new THREE.MeshBasicMaterial({color:0xd9ff4a}));ring.rotation.x=Math.PI/2;ring.position.copy(l.pos);ring.position.y=.08;world.add(ring);const pole=box(.06,2.1,.06,0xd9ff4a,l.pos.x,1,l.pos.z);const orb=new THREE.Mesh(new THREE.SphereGeometry(.22,16,10),new THREE.MeshBasicMaterial({color:0xd9ff4a}));orb.position.set(l.pos.x,2.15,l.pos.z);world.add(orb);markers.push({data:l,ring,orb})});

const keys={}; addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.code==="Space")keys.space=true});addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;if(e.code==="Space")keys.space=false});
let velocity=0, heading=0, active=null;
const ray=new THREE.Raycaster();
function updatePlayer(){let throttle=(keys.w?1:0)-(keys.s?0.65:0);if(keys.space)throttle=0;velocity+=(throttle*.014);velocity*=keys.space?.86:.96;velocity=THREE.MathUtils.clamp(velocity,-.06,.13);if(keys.a)heading+=.028*(Math.abs(velocity)*14+.3);if(keys.d)heading-=.028*(Math.abs(velocity)*14+.3);player.rotation.y=heading;player.position.x+=Math.sin(heading)*velocity;player.position.z+=Math.cos(heading)*velocity;const len=Math.hypot(player.position.x,player.position.z);if(len>13){player.position.x*=.97;player.position.z*=.97;velocity*=-.3}const target=new THREE.Vector3(player.position.x,player.position.y+1.3,player.position.z);camera.position.lerp(new THREE.Vector3(player.position.x-Math.sin(heading)*6,5.5,player.position.z-Math.cos(heading)*6),.055);camera.lookAt(target);sculpture.rotation.y+=.008;markers.forEach(m=>{m.ring.rotation.z+=.01;m.orb.position.y=2.15+Math.sin(performance.now()*.002+m.data.pos.x)*.12});checkLocation()}
function checkLocation(){let nearest=null,dist=99;for(const m of markers){const d=player.position.distanceTo(m.data.pos);if(d<2.0&&d<dist){nearest=m;dist=d}}if(nearest!==active){active=nearest;if(active){openPanel(active.data)}else closePanel()}}
function openPanel(d){document.querySelector("#panelLabel").textContent=d.label;document.querySelector("#panelTitle").textContent=d.title;document.querySelector("#panelBody").innerHTML=`<p>${d.text}</p><div class="tags">${d.tags.map(x=>`<span>${x}</span>`).join("")}</div>`;document.querySelector("#panel").classList.add("open");document.querySelector("#panel").setAttribute("aria-hidden","false");document.querySelector("#hint").style.opacity=".2"}}
function closePanel(){document.querySelector("#panel").classList.remove("open");document.querySelector("#panel").setAttribute("aria-hidden","true");document.querySelector("#hint").style.opacity="1"}
document.querySelector("#close").onclick=()=>{active=null;closePanel()};

const help=document.querySelector("#help"),helpPanel=document.querySelector("#helpPanel");help.onclick=()=>helpPanel.classList.add("open");document.querySelector("#closeHelp").onclick=()=>helpPanel.classList.remove("open");

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}addEventListener("resize",resize);
function animate(){requestAnimationFrame(animate);updatePlayer();renderer.render(scene,camera)}animate();
setTimeout(()=>{boot.style.opacity="0";setTimeout(()=>boot.remove(),700)},700);
