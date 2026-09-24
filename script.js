import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";

const sceneHost = document.querySelector("#scene");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080808);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.3, 6.8);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneHost.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 4;
controls.maxDistance = 9;
controls.target.set(0, 1, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.7;

scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 4);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.PointLight(0xd9ff4a, 14, 12);
rim.position.set(-3, 2, -2);
scene.add(rim);

const group = new THREE.Group();
scene.add(group);

// DEFAULT PLACEHOLDER MODEL
// Replace assets/default-model.glb with your own .glb, then set USE_CUSTOM_MODEL = true.
const USE_CUSTOM_MODEL = false;

function createDefaultModel(){
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({color:0xeeeeea, metalness:.15, roughness:.35});
  const darkMat = new THREE.MeshStandardMaterial({color:0x151515, metalness:.4, roughness:.25});
  const accentMat = new THREE.MeshStandardMaterial({color:0xd9ff4a, emissive:0x202800, roughness:.3});

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.62, 1.15, 8, 18), bodyMat);
  body.position.y = 1.45; g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(.48, 24, 16), darkMat);
  head.position.y = 2.7; g.add(head);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 12, 0, Math.PI*2, .15, 1.05), accentMat);
  visor.scale.set(1.15,.65,.55); visor.position.set(0,2.72,.39); g.add(visor);

  for(const side of [-1,1]){
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.16,.72,6,12), bodyMat);
    arm.rotation.z = side * -.3; arm.position.set(side*.75,1.55,0); g.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.2,.85,6,12), darkMat);
    leg.position.set(side*.32,.45,0); g.add(leg);
  }

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05,.025,8,80), accentMat);
  ring.rotation.x = Math.PI/2; ring.position.y = .05; g.add(ring);
  return g;
}

function addModel(model){
  model.traverse(o => { if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; }});
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 3.0 / Math.max(size.x,size.y,size.z);
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  model.position.y = .2;
  group.add(model);
}

if(USE_CUSTOM_MODEL){
  new GLTFLoader().load("assets/default-model.glb", gltf => addModel(gltf.scene),
    undefined, () => addModel(createDefaultModel()));
}else{
  addModel(createDefaultModel());
}

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.2,64),
  new THREE.MeshBasicMaterial({color:0x151515,transparent:true,opacity:.7})
);
floor.rotation.x = -Math.PI/2; floor.position.y = -.02; scene.add(floor);

function resize(){
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}
addEventListener("resize",resize);

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  group.rotation.y += 0.0015;
  renderer.render(scene,camera);
}
animate();

setTimeout(()=>{ const l=document.querySelector("#loader"); l.style.opacity="0"; setTimeout(()=>l.remove(),650); },700);

const modal=document.querySelector("#projectModal");
const title=document.querySelector("#modalTitle");
const text=document.querySelector("#modalText");
const descriptions={
  "Kopi Boy":"A community-first delivery platform concept connecting customers with home cooks and hawkers. Focus: simple onboarding, transparent pricing and a low-friction ordering journey.",
  "R2M":"An interactive number-grid concept designed around selection, highlighting, subsets and combination logic. Focus: clear visual feedback and controlled workflows.",
  "Duty Planner":"A duty-planning interface concept for scheduling people around preferred dates, unavailable dates and reserve requirements."
};
document.querySelectorAll(".project-card").forEach(card=>{
  card.addEventListener("click",()=>{
    const name=card.dataset.project;
    title.textContent=name;
    text.textContent=descriptions[name] || "Interactive case study coming soon.";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  });
});
function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
document.querySelector("#closeModal").addEventListener("click",closeModal);
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

document.querySelector("#soundBtn").addEventListener("click",e=>{
  e.currentTarget.textContent=e.currentTarget.textContent==="◉"?"○":"◉";
});
