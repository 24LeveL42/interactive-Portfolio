import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js";

const $ = id => document.getElementById(id);
const canvas = $("scene");
canvas.tabIndex = 0;
const loading = $("loading");
const loadingMessage = $("loadingMessage");
const destinations = [
  { id: "about-me", title: "ABOUT ME", stationName: "About Me", description: "A little about Rajini", placeholderContent: "About Me station coming soon", modelPath: null, futureModelPath: "about.glb" },
  { id: "3d-art", title: "3D ART", stationName: "3D Art", description: "Selected 3D work", placeholderContent: "Selected 3D work", modelPath: "3d_set_4_station.glb", futureModelPath: "3dart.glb" },
  { id: "web-development", title: "WEB DEVELOPMENT", stationName: "Web Development", description: "Web projects and experiments", placeholderContent: "Web Development station coming soon", modelPath: "website_station_new.glb", futureModelPath: "web.glb" },
  { id: "kopi-boy", title: "KOPI BOY", stationName: "Kopi Boy", description: "The next big delivery platform is in the making", placeholderContent: "I’m building a faster, smarter way to connect people, riders and local businesses — one delivery at a time.", modelPath: null, futureModelPath: "kopi-boy.glb" },
  { id: "contact", title: "CONTACT", stationName: "Contact", description: "Get in touch with Rajini", placeholderContent: "Contact station coming soon", modelPath: null, futureModelPath: "contact.glb" }
];
const aboutPlayers = [
  { name: "CASUAL", model: "about_casual_animated.glb", card: "about_card_casual.png", accent: 0x35b8ff },
  { name: "FITNESS", model: "about_fitness_animated.glb", card: "about_card_fitness.png", accent: 0xe65aff },
  { name: "SAF WARRIOR", model: "about_army_animated.glb", card: "about_card_army.png", accent: 0x8eff59, facingOffset: Math.PI / 2 },
  { name: "FUTURE VISION", model: "about_future_animated.glb", card: "about_card_future.png", accent: 0xda61ff }
];
const aboutProfileCardScale = 2.5;
const aboutProfileCardWidth = 2.68 * aboutProfileCardScale;
const aboutProfileCardHeight = 1.508 * aboutProfileCardScale;

let renderer, scene, camera, clock, train, trainModelRoot, outside, station, stationContent;
let aboutSelectionPairs = [], aboutSelectionIndex = 0, aboutSelectionMotion = null, aboutSelectionGeneration = 0;
let flyingBikes = [], artSpinPivots = [];
const aboutSelectionBaseZ = -0.5;
let creatorStampsFloat = null;
let kopiBoyFireworks = null, kopiBoyRider = null;
let daySkyDome, nightSkyDome, hdrSkyDome, worldHemisphereLight, worldKeyLight, stationNightMode = false;
let cyberpunkTemplate = null, cyberpunkLoading = false;
let cyberpunkCityInstances = [], cyberpunkCityScroll = 0, cyberpunkCityStep = 48, cyberpunkCityRingLength = 336;
let partitionPanel = null, partitionBaseY = 0, partitionLift = 0, partitionWorldZ = -10.5;
let partitionProgress = 0, partitionTarget = 0;
let sideDoorPanels = [];
let trainHalfWidth = 1.8;
let assetsReady = 0, assetsRequired = 1;
let running = false, traveling = false, outsideStation = false;
let portfolioMusicEnabled = false;
let selectedDestination = null;
const fpvPosition = new THREE.Vector3(0, 1.58, 1.35);
let stationStopZ = 0;
const pressedKeys = new Set();
const activeTouchTurns = new Set();
let fpvBounds = { minX: -2.1, maxX: 2.1, minZ: -19, maxZ: 19 };
let trainCarriageLength = 18;
let yaw = 0, pitch = 0, zoom = 72, dragging = false, lastX = 0, lastY = 0;
let travelStart = 0, doorProgress = 0, doorTarget = 0;
const vehicleHasDoors = false;
let travelPhase = "idle";
let updateDoors = () => {};
let updatePartition = () => {};
let setDoorTarget = () => { doorTarget = 0; doorProgress = 0; };
const CLOSED_LEFT = -.56, CLOSED_RIGHT = .56;

function setLoading(message, error = false) {
  loadingMessage.textContent = message;
  loading.classList.toggle("loadingError", error);
  loading.style.display = "flex";
}

function finishLoading() { loading.style.display = "none"; }

async function setPortfolioMusic(enabled) {
  const audio = $("portfolioMusic");
  const button = $("musicToggle");
  if (enabled) {
    try {
      await audio.play();
      portfolioMusicEnabled = true;
    } catch (error) {
      portfolioMusicEnabled = false;
      console.info("Music playback needs another user interaction or an available audio file.", error);
    }
  } else {
    audio.pause();
    portfolioMusicEnabled = false;
  }
  button.setAttribute("aria-pressed", String(portfolioMusicEnabled));
  button.setAttribute("aria-label", portfolioMusicEnabled ? "Turn music off" : "Turn music on");
  button.querySelector("span").textContent = portfolioMusicEnabled ? "SOUND ON" : "SOUND OFF";
}
function markAssetReady() {
  assetsReady++;
  if (assetsReady >= assetsRequired) finishLoading();
}
function showFatalError(message) {
  setLoading(message, true);
  const retry = $("reloadBtn");
  retry.hidden = false;
}

const mats = {
  floor: new THREE.MeshStandardMaterial({ color: 0xd8e0e5, metalness: .18, roughness: .55 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xeaf0f3, metalness: .16, roughness: .48 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf3f6f8, metalness: .2, roughness: .42 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xaab8c2, metalness: .72, roughness: .25 }),
  glow: new THREE.MeshStandardMaterial({ color: 0x8ce3ff, emissive: 0x32b7ff, emissiveIntensity: 2.6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x445663, metalness: .38, roughness: .32 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xc4eaf7, transparent: true, opacity: .14, metalness: .02, roughness: .1, depthWrite: false }),
  windowFrame: new THREE.MeshStandardMaterial({ color: 0xeaf2f6, metalness: .38, roughness: .28 }),
  platform: new THREE.MeshStandardMaterial({ color: 0xb5c0c6, metalness: .23, roughness: .56 }),
  seat: new THREE.MeshStandardMaterial({ color: 0x3a718b, metalness: .22, roughness: .4 })
};

function box(w, h, d, mat, x, y, z, parent = train) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function createSkyDome() {
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 1536; skyCanvas.height = 768;
  const ctx = skyCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
  gradient.addColorStop(0, "#3979a8");
  gradient.addColorStop(.34, "#76b5dc");
  gradient.addColorStop(.53, "#dff4ff");
  gradient.addColorStop(1, "#91c4df");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  // Soft cloud banks are painted into the procedural equirectangular sky texture.
  for (let i = 0; i < 32; i++) {
    const x = 35 + Math.random() * (skyCanvas.width - 70);
    const y = 270 + Math.random() * 150;
    const cloudWidth = 48 + Math.random() * 95;
    const puffs = 3 + Math.floor(Math.random() * 4);
    for (let puff = 0; puff < puffs; puff++) {
      const px = x + (Math.random() - .5) * cloudWidth;
      const py = y + (Math.random() - .5) * 24;
      const radius = 12 + Math.random() * 28;
      const cloud = ctx.createRadialGradient(px, py, 2, px, py, radius);
      cloud.addColorStop(0, "rgba(255,255,255,.92)");
      cloud.addColorStop(.56, "rgba(250,253,255,.68)");
      cloud.addColorStop(1, "rgba(245,252,255,0)");
      ctx.fillStyle = cloud;
      ctx.beginPath(); ctx.ellipse(px, py, radius * 1.35, radius * .68, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(skyCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(190, 48, 32),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false })
  );
  dome.name = "Procedural sky and cloud dome";
  dome.renderOrder = -1;
  return dome;
}

function createNightSkyDome() {
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 1536; skyCanvas.height = 768;
  const ctx = skyCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
  gradient.addColorStop(0, "#030714");
  gradient.addColorStop(.48, "#101d3d");
  gradient.addColorStop(.76, "#242448");
  gradient.addColorStop(1, "#101522");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * skyCanvas.width, y = Math.random() * 520;
    const radius = Math.random() < .1 ? 1.8 : .65 + Math.random() * .65;
    ctx.fillStyle = `rgba(210,232,255,${.35 + Math.random() * .6})`;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
  const moonGlow = ctx.createRadialGradient(1260, 160, 8, 1260, 160, 115);
  moonGlow.addColorStop(0, "rgba(154,213,255,.46)");
  moonGlow.addColorStop(1, "rgba(62,132,200,0)");
  ctx.fillStyle = moonGlow; ctx.fillRect(1135, 35, 250, 250);
  ctx.fillStyle = "#d9eeff";
  ctx.beginPath(); ctx.arc(1260, 160, 32, 0, Math.PI * 2); ctx.fill();

  const texture = new THREE.CanvasTexture(skyCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(190, 48, 32),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false })
  );
  dome.name = "Procedural night sky with stars and moon";
  dome.renderOrder = -1;
  dome.visible = false;
  return dome;
}

function loadHdrSky() {
  new RGBELoader().load("SKY HDR pp.hdr", texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.environmentIntensity = .35;

    hdrSkyDome = new THREE.Mesh(
      new THREE.SphereGeometry(190, 64, 40),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false, fog: false })
    );
    hdrSkyDome.name = "Supplied HDR exterior sky";
    hdrSkyDome.renderOrder = -2;
    hdrSkyDome.visible = true;
    scene.add(hdrSkyDome);
    if (daySkyDome) daySkyDome.visible = false;
    if (nightSkyDome) nightSkyDome.visible = false;
  }, undefined, error => {
    console.warn("The supplied HDR sky could not be loaded; using the procedural sky instead.", error);
  });
}

function setStationNightMode(active) {
  if (stationNightMode === active) return;
  stationNightMode = active;
  if (daySkyDome) daySkyDome.visible = !hdrSkyDome && !active;
  if (nightSkyDome) nightSkyDome.visible = !hdrSkyDome && active;
  if (hdrSkyDome) hdrSkyDome.visible = true;
  if (scene.environment) scene.environmentIntensity = .35;
  const skyColor = active ? 0x081226 : 0x9fb8c9;
  scene.background.set(skyColor);
  scene.fog.color.set(skyColor);
  if (worldHemisphereLight) worldHemisphereLight.intensity = active ? 1.25 : 2.3;
  if (worldKeyLight) worldKeyLight.intensity = active ? 1.05 : 2.4;
  if (outside) outside.traverse(node => {
    if (!node.isMesh || node.name !== "Repeating grass ground") return;
    const material = node.material;
    material.userData.stationDayColor ??= material.color.clone();
    material.color.copy(active ? new THREE.Color(0x263039) : material.userData.stationDayColor);
  });
  if (stationContent) stationContent.traverse(node => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      updateStationNightMaterial(material, active);
    }
  });
}

function updateStationNightMaterial(material, active) {
  const state = material?.userData?.stationNight;
  if (!state || !material.emissive) return;
  if (active) {
    // Preserve GLB-authored emissive maps (especially the Web Development
    // model's neon surfaces) and use the albedo map only when no emissive map exists.
    material.emissiveMap = state.originalMap || state.albedoMap;
    material.emissive.set(0xffffff);
    material.emissiveIntensity = state.originalMap
      ? Math.min(state.originalIntensity, .7)
      : .9;
  } else {
    material.emissiveMap = state.originalMap;
    material.emissive.copy(state.originalColor);
    material.emissiveIntensity = state.originalIntensity;
  }
  material.needsUpdate = true;
}

function prepareStationNightMaterial(material, map = material?.map) {
  if (!material?.emissive) return;
  const state = material.userData.stationNight ??= {
    originalMap: material.emissiveMap ?? null,
    originalColor: material.emissive.clone(),
    originalIntensity: material.emissiveIntensity,
    albedoMap: map ?? null
  };
  if (map) state.albedoMap = map;
  updateStationNightMaterial(material, stationNightMode);
}

function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb8c9);
  scene.fog = new THREE.Fog(0x9fb8c9, 35, 150);
  camera = new THREE.PerspectiveCamera(zoom, innerWidth / innerHeight, .05, 220);
  camera.position.set(0, 1.58, 1.35);
  clock = new THREE.Clock();
  train = new THREE.Group(); train.name = "MRT carriage";
  outside = new THREE.Group(); outside.name = "Moving exterior";
  daySkyDome = createSkyDome();
  nightSkyDome = createNightSkyDome();
  scene.add(daySkyDome, nightSkyDome, train, outside);
  loadHdrSky();

  box(6, .12, 42, mats.floor, 0, 0, 0);
  // Split side walls around the glazing so the windows are genuine openings.
  for (const side of [-1, 1]) {
    box(.12, 1.0, 42, mats.wall, side * 3.05, .5, 0);
    box(.12, .36, 42, mats.wall, side * 3.05, 2.82, 0);
  }
  box(6, .12, 42, mats.ceiling, 0, 3.05, 0);
  for (let z = -18.5; z <= 18.5; z += 4.2) {
    for (const side of [-1, 1]) {
      const wallFace = side * 2.978;
      box(.045, 1.54, 3.9, mats.glass, wallFace, 1.82, z);
      box(.07, .08, 3.98, mats.windowFrame, side * 2.965, 1.04, z);
      box(.07, .08, 3.98, mats.windowFrame, side * 2.965, 2.60, z);
      box(.07, 1.62, .08, mats.windowFrame, side * 2.965, 1.82, z - 2.0);
      box(.07, 1.62, .08, mats.windowFrame, side * 2.965, 1.82, z + 2.0);
      box(.035, .035, 3.84, mats.glow, side * 2.94, 1.09, z);
    }
  }
  for (let z = -19; z <= 19; z += 3.2) {
    box(.3, .06, 2.8, mats.glow, -1.15, 2.91, z);
    box(.3, .06, 2.8, mats.glow, 1.15, 2.91, z);
    box(5.1, .035, .07, mats.glow, 0, 2.65, z);
  }
  for (let z = -18; z <= 18; z += 4.5) {
    box(.04, .08, 2.9, mats.glow, -2.94, 2.34, z);
    box(.04, .08, 2.9, mats.glow, 2.94, 2.34, z);
  }

  const seatGroup = new THREE.Group(); seatGroup.name = "USER_SEATS"; train.add(seatGroup);
  const seatPlacements = [];
  for (let z = -18; z <= 18; z += 2.8) { seatPlacements.push([-2.35, z, false]); seatPlacements.push([2.35, z, true]); }
  function fallbackSeat(x, z, flip) {
    const g = new THREE.Group(); g.position.set(x, 0, z); seatGroup.add(g);
    box(1.15, .16, .48, mats.seat, 0, .63, 0, g);
    box(1.15, .72, .13, mats.seat, 0, 1.02, flip ? -.22 : .22, g);
    box(.1, .56, .55, mats.metal, -.48, .56, 0, g);
    box(.1, .56, .55, mats.metal, .48, .56, 0, g);
  }
  function useFallbackSeats() {
    seatGroup.clear();
    seatPlacements.forEach(p => fallbackSeat(p[0], p[1], p[2]));
  }

  box(2.5, 2.3, .14, mats.dark, 0, 1.45, -20.65);
  box(2.5, 2.3, .14, mats.dark, 0, 1.45, 20.65);
  box(.07, 2.2, .2, mats.glow, -1.3, 1.45, -20.77);
  box(.07, 2.2, .2, mats.glow, 1.3, 1.45, -20.77);
  box(1.1, 2.05, .18, mats.glass, CLOSED_LEFT, 1.45, 20.78);
  box(1.1, 2.05, .18, mats.glass, CLOSED_RIGHT, 1.45, 20.78);
  const doorL = box(1.1, 2.05, .18, mats.glass, CLOSED_LEFT, 1.45, -20.78);
  const doorR = box(1.1, 2.05, .18, mats.glass, CLOSED_RIGHT, 1.45, -20.78);
  const closedDoorY = 1.45, doorLift = 2.12;
  setDoorTarget = () => { doorTarget = 0; doorProgress = 0; };
  updateDoors = dt => {
    if (!vehicleHasDoors) { doorTarget = 0; doorProgress = 0; return; }
    doorProgress = THREE.MathUtils.damp(doorProgress, doorTarget, 3.2, dt);
    doorL.position.x = CLOSED_LEFT;
    doorR.position.x = CLOSED_RIGHT;
    doorL.position.y = closedDoorY + doorLift * doorProgress;
    doorR.position.y = closedDoorY + doorLift * doorProgress;
    sideDoorPanels.forEach(door => {
      if (door.hinge) door.group.rotation.x = door.openAngle * doorProgress;
      else door.group.position.x = door.baseX + door.direction * door.travel * doorProgress;
    });
  };

  // The interior divider sits between the two fallback carriage halves.
  const fallbackDividerZ = -10.5, passageWidth = 1.55, dividerHeight = 2.35;
  const wingWidth = (5.6 - passageWidth) / 2;
  for (const side of [-1, 1]) {
    box(wingWidth, dividerHeight, .14, mats.dark, side * (passageWidth + wingWidth) / 2, dividerHeight / 2, fallbackDividerZ, train);
  }
  box(5.6, .28, .14, mats.dark, 0, dividerHeight + .14, fallbackDividerZ, train);
  partitionPanel = new THREE.Group();
  partitionPanel.position.set(0, .05, fallbackDividerZ);
  train.add(partitionPanel);
  box(passageWidth, dividerHeight - .1, .12, mats.windowFrame, 0, (dividerHeight - .1) / 2, 0, partitionPanel);
  box(passageWidth * .78, dividerHeight * .42, .035, mats.glass, 0, dividerHeight * .53, .078, partitionPanel);
  partitionBaseY = partitionPanel.position.y;
  partitionLift = dividerHeight + .3;
  partitionWorldZ = fallbackDividerZ;
  updatePartition = dt => {
    const delta = partitionTarget - partitionProgress, step = dt * 1.8;
    partitionProgress = Math.abs(delta) <= step ? partitionTarget : partitionProgress + Math.sign(delta) * step;
    partitionPanel.position.y = partitionBaseY + partitionLift * partitionProgress;
  };
  const tabletProp = new THREE.Group(); tabletProp.position.set(1.55, 1.25, 1); tabletProp.rotation.y = -.22; train.add(tabletProp);
  box(1.55, 1.1, .12, mats.dark, 0, 0, 0, tabletProp);
  box(1.35, .88, .03, mats.glow, 0, 0, .07, tabletProp);
  box(1.43, .08, .12, mats.metal, 0, -.62, 0, tabletProp);

  // A repeating grass tile keeps the exterior grounded as the train moves.
  const grass = new THREE.MeshStandardMaterial({ color: 0x66845d, roughness: 1 });
  const ballast = new THREE.MeshStandardMaterial({ color: 0x4f5960, roughness: .96 });
  const sleeper = new THREE.MeshStandardMaterial({ color: 0x725d4b, roughness: .9 });
  const rail = new THREE.MeshStandardMaterial({ color: 0xb9c6cb, metalness: .8, roughness: .24 });
  const groundGeometry = new THREE.PlaneGeometry(100, 240);
  groundGeometry.rotateX(-Math.PI / 2);
  for (const z of [-480, -240, 0, 240]) {
    const ground = new THREE.Mesh(groundGeometry, grass);
    ground.position.set(0, -.12, z);
    ground.name = "Repeating grass ground";
    outside.add(ground);
  }
  // The carriage now has a closed cabin floor; keep the exterior free of exposed track geometry.
  for (let z = -90; z < 90; z += 5) {
    box(.12, .12, 1.4, mats.glow, -5.3, 2.4, z, outside);
    box(.12, .12, 1.4, mats.glow, 5.3, 2.4, z, outside);
  }
  worldHemisphereLight = new THREE.HemisphereLight(0xf2fbff, 0x718393, 2.3); scene.add(worldHemisphereLight);
  worldKeyLight = new THREE.DirectionalLight(0xffffff, 2.4); worldKeyLight.position.set(0, 8, 5); scene.add(worldKeyLight);
  const fillL = new THREE.PointLight(0x8bdbff, 4.5, 18); fillL.position.set(-2.2, 2.3, 2); train.add(fillL);
  const fillR = new THREE.PointLight(0x8bdbff, 4.5, 18); fillR.position.set(2.2, 2.3, 2); train.add(fillR);

  station = new THREE.Group(); station.name = "Station placeholder (replaceable)"; station.position.set(0, 0, -9.5); outside.add(station);
  stationContent = new THREE.Group(); station.add(stationContent);
  buildPlaceholderStation(stationContent);
  station.visible = false;
  loadCyberpunkEnvironment();
  loadFlyingBikes();
  loadMonsterTruck();
  return { seatGroup, fallbackSeat, doorL, doorR, updateDoors, setDoorTarget };
}

function loadFlyingBikes() {
  new GLTFLoader().load("flying_bike.glb", gltf => {
    const template = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(template);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    template.position.sub(center);
    const modelScale = 2.7 / Math.max(size.x, size.y, size.z, .001);
    for (let index = 0; index < 5; index++) {
      const root = new THREE.Group();
      root.name = `Flying bike ${index + 1}`;
      const bike = template.clone(true);
      bike.scale.setScalar(modelScale);
      root.add(bike);
      scene.add(root);
      const direction = index % 2 ? -1 : 1;
      flyingBikes.push({
        root,
        phase: index * (Math.PI * 2 / 5) + Math.random() * .45,
        speed: direction * (.12 + Math.random() * .095),
        radiusX: 10 + index * 2.25,
        radiusZ: 13 + (index % 3) * 4.5,
        height: 3.4 + (index % 3) * 1.05,
        bob: .45 + Math.random() * .35
      });
    }
    console.info("Loaded five flying bikes for the full portfolio journey.");
  }, undefined, error => {
    console.error("Flying bike GLB failed to load.", error);
  });
}

function updateFlyingBikes(now) {
  for (const flyer of flyingBikes) {
    const angle = now * flyer.speed + flyer.phase;
    const x = fpvPosition.x + Math.cos(angle) * flyer.radiusX;
    const z = fpvPosition.z + Math.sin(angle) * flyer.radiusZ;
    const y = flyer.height + Math.sin(angle * 1.7 + flyer.phase) * flyer.bob;
    flyer.root.position.set(x, y, z);
    const velocityX = -Math.sin(angle) * flyer.radiusX * flyer.speed;
    const velocityZ = Math.cos(angle) * flyer.radiusZ * flyer.speed;
    flyer.root.rotation.y = Math.atan2(velocityX, velocityZ);
    flyer.root.rotation.x = Math.cos(angle * 1.7 + flyer.phase) * .025;
  }
}

function prepareArtStationSpinners(model) {
  artSpinPivots = [];
  const spinNodes = [];
  model.traverse(node => {
    if (node.isMesh && (/^tripo_node_/i.test(node.name) || /^circle/i.test(node.name))) spinNodes.push(node);
  });
  spinNodes.forEach((node, index) => {
    const parent = node.parent;
    if (!parent) return;
    const authoredPosition = node.position.clone();
    const authoredYaw = new THREE.Euler().setFromQuaternion(node.quaternion, "YXZ").y;
    node.geometry.computeBoundingBox();
    const geometryCenter = node.geometry.boundingBox.getCenter(new THREE.Vector3());
    node.updateWorldMatrix(true, false);
    parent.updateWorldMatrix(true, false);
    const centerWorld = node.localToWorld(geometryCenter.clone());
    const pivotPosition = parent.worldToLocal(centerWorld.clone());
    const pivot = new THREE.Group();
    pivot.name = `${node.name} slow spin pivot`;
    pivot.position.copy(pivotPosition);
    parent.add(pivot);
    pivot.attach(node);
    // Recentering the mesh geometry makes its object origin coincide with the
    // fixed pivot, even though this GLB bakes the exhibit positions into vertices.
    node.geometry = node.geometry.clone();
    const position = node.geometry.getAttribute("position");
    const childCenterOffset = geometryCenter.clone()
      .multiply(node.scale)
      .applyQuaternion(node.quaternion);
    node.position.add(childCenterOffset);
    for (let vertex = 0; vertex < position.count; vertex++) {
      position.setXYZ(
        vertex,
        position.getX(vertex) - geometryCenter.x,
        position.getY(vertex) - geometryCenter.y,
        position.getZ(vertex) - geometryCenter.z
      );
    }
    position.needsUpdate = true;
    node.geometry.computeBoundingBox();
    node.geometry.computeBoundingSphere();
    const isCircle = /^circle/i.test(node.name);
    node.position.set(0, 0, 0);
    const magnitude = isCircle ? .12 + Math.random() * .12 : .07 + Math.random() * .08;
    const direction = Math.random() < .5 ? -1 : 1;
    artSpinPivots.push({
      pivot, node, isCircle, authoredPosition, authoredYaw,
      speed: direction * magnitude, phase: index * .37, elapsed: 0
    });
  });
  arrangeArtStationRow();
  sizeArtStationDisplays(1);
  console.info(`Prepared ${artSpinPivots.length} 3D Art models and display circles for slow random-direction spins.`);
}

function arrangeArtStationRow() {
  const figures = artSpinPivots.filter(spinner => !spinner.isCircle);
  const circles = artSpinPivots.filter(spinner => spinner.isCircle);
  const usedCircles = new Set();
  const rowSpacing = 4.1;
  figures.forEach((figure, index) => {
    const circle = circles.find(candidate => !usedCircles.has(candidate)
      && candidate.authoredPosition.distanceTo(figure.authoredPosition) < .002)
      ?? circles.find(candidate => !usedCircles.has(candidate));
    if (!circle) return;
    usedCircles.add(circle);
    const rowZ = (index - (figures.length - 1) / 2) * rowSpacing;
    figure.pivot.position.set(0, 1.65, rowZ);
    // The welcome line runs alongside the truck's lane. Imported characters
    // face +Z; turn them toward the truck from the lineup's +X side (-X).
    figure.baseYaw = -Math.PI / 2 - figure.authoredYaw;
    figure.pivot.rotation.set(0, figure.baseYaw, 0);
    circle.pivot.position.set(0, 0, rowZ);
    circle.pivot.rotation.y = 0;
  });
}

function sizeArtStationDisplays(sceneScale) {
  // Make the figures read as full-size people from the truck-side camera.
  // World-space bounds account for baked parent scales in the supplied GLB.
  const figureHeight = 3.3;
  const displayDiameter = 1.15;
  for (const spinner of artSpinPivots) {
    const { node, isCircle } = spinner;
    node.updateWorldMatrix(true, false);
    const worldBounds = new THREE.Box3().setFromObject(node);
    const size = worldBounds.getSize(new THREE.Vector3());
    if (isCircle) {
      const currentDiameter = Math.max(size.x, size.z) * sceneScale;
      node.scale.multiplyScalar(displayDiameter / Math.max(currentDiameter, .001));
    } else {
      const currentHeight = size.y * sceneScale;
      node.scale.multiplyScalar(figureHeight / Math.max(currentHeight, .001));
      spinner.pivot.position.y = figureHeight / 2;
    }
  }
}

function updateArtStationSpinners(dt) {
  for (const spinner of artSpinPivots) {
    if (spinner.isCircle) {
      spinner.pivot.rotation.y += spinner.speed * dt;
      continue;
    }
    spinner.elapsed += spinner.speed * dt;
    spinner.pivot.rotation.y = spinner.baseYaw + Math.sin(spinner.elapsed + spinner.phase) * .08;
  }
}

function loadArtInfoBoard(parent, displayOffset, requestId) {
  new GLTFLoader().load("mrt_station_board_3D.glb", gltf => {
    if (requestId !== aboutSelectionGeneration) return;
    const board = gltf.scene;
    const dashboardTexture = new THREE.TextureLoader().load("3d_art_station_dashboard.png");
    dashboardTexture.colorSpace = THREE.SRGBColorSpace;
    board.traverse(node => {
      if (!node.isMesh) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => {
        prepareStationNightMaterial(material);
        if (material?.name !== "Material.009") return;
        const position = node.geometry.getAttribute("position");
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let index = 0; index < position.count; index++) {
          const x = position.getX(index), y = position.getY(index);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        const uv = new Float32Array(position.count * 2);
        const width = Math.max(maxX - minX, .0001), height = Math.max(maxY - minY, .0001);
        for (let index = 0; index < position.count; index++) {
          uv[index * 2] = (position.getX(index) - minX) / width;
          uv[index * 2 + 1] = (position.getY(index) - minY) / height;
        }
        node.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        material.map = dashboardTexture;
        material.color?.set(0xffffff);
        material.metalness = 0;
        material.roughness = .78;
        prepareStationNightMaterial(material, dashboardTexture);
        material.needsUpdate = true;
      });
    });
    const bounds = new THREE.Box3().setFromObject(board);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const boardScale = 3;
    const placement = new THREE.Group();
    placement.name = "3D Art information board (3x scale)";
    placement.rotation.y = Math.PI / 2;
    placement.position.set(-(trainHalfWidth + displayOffset + 4.5), size.y * boardScale / 2 + .05, -6.5);
    board.scale.setScalar(boardScale);
    board.position.copy(center).multiplyScalar(-boardScale);
    placement.add(board);
    parent.add(placement);
  console.info("Loaded the 3D Art information board at 3x scale beside the welcome lineup.");
  }, undefined, error => {
    console.warn("Could not load the 3D Art information board.", error);
  });
}

function loadMonsterTruck() {
  const loader = new GLTFLoader();
  loader.load("monster_truck.glb", gltf => {
    const car = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(car);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    car.position.x -= center.x;
    car.position.z -= center.z;
    car.position.y -= bounds.min.y;

    // The supplied GLB is Y-up. Its longest horizontal axis is local X;
    // rotate it so the truck's front faces the driver's forward (+Z) view.
    const modelScale = 4.3 / Math.max(size.x, size.z, .001);
    trainModelRoot = new THREE.Group();
    trainModelRoot.name = "Monster truck vehicle";
    trainModelRoot.rotation.y = -Math.PI / 2;
    trainModelRoot.scale.setScalar(modelScale);
    trainModelRoot.add(car);
    scene.add(trainModelRoot);
    trainModelRoot.updateMatrixWorld(true);

    trainHalfWidth = size.z * modelScale / 2;
    trainCarriageLength = size.x * modelScale;
    fpvBounds = {
      minX: -trainHalfWidth + .18, maxX: trainHalfWidth - .18,
      minZ: -trainCarriageLength / 2 + .25, maxZ: trainCarriageLength / 2 - .25
    };
    // Place the driver view at the raised, forward position inside the cab.
    const driverEyeHeight = size.y * modelScale * .90;
    fpvPosition.set(-.38, Math.min(size.y * modelScale * .94, driverEyeHeight), -.92);
    // The truck's nose points toward local -Z after the model alignment;
    // face the FPV through the windshield instead of toward the rear cabin.
    yaw = 0;
    pitch = 0;
    train.visible = false;
    trainModelRoot.updateMatrixWorld(true);

    sideDoorPanels = [];
    console.info("Monster truck GLB loaded.", { dimensions: size, scale: modelScale, upAxis: "Y" });
    markAssetReady();
  }, undefined, error => {
    console.error("Monster truck GLB failed; keeping the procedural carriage available.", error);
    setLoading("Monster truck unavailable. Check that monster_truck.glb is included.", true);
    $("continueBtn").hidden = false;
    markAssetReady();
  });
}

function separateHingedCarDoors(car) {
  car.updateMatrixWorld(true);
  const carInverse = car.matrixWorld.clone().invert();
  const hingePositions = {
    [-1]: new THREE.Vector3(-.145, .18, .13),
    [1]: new THREE.Vector3(.145, .18, .13)
  };
  const pivots = new Map();
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = side < 0 ? "Driver scissor door hinge" : "Passenger scissor door hinge";
    pivot.position.copy(hingePositions[side]);
    pivot.userData.carDoorHinge = true;
    car.add(pivot);
    pivots.set(side, pivot);
  }

  let extractedTriangles = 0;
  const sourceMeshes = [];
  car.traverse(node => { if (node.isMesh) sourceMeshes.push(node); });
  for (const mesh of sourceMeshes) {
    const source = mesh.geometry;
    if (!mesh.isMesh || !source?.attributes?.position || !source.index) continue;
    const position = source.attributes.position;
    const meshToCar = carInverse.clone().multiply(mesh.matrixWorld);
    const sourceIndices = source.index.array;

    // Keep separately-meshed side-door details, including the interior
    // armrest, attached to the moving door as complete objects.
    const componentBounds = new THREE.Box3().setFromBufferAttribute(position).applyMatrix4(meshToCar);
    const componentSize = componentBounds.getSize(new THREE.Vector3());
    const componentCenter = componentBounds.getCenter(new THREE.Vector3());
    const componentSide = Math.sign(componentCenter.x);
    const isDoorAccessory = componentSide && componentSize.x < .2 && componentSize.y < .22 &&
      componentSize.z < .1 && Math.abs(componentCenter.x) > .16 &&
      componentCenter.y > .16 && componentCenter.y < .42 && Math.abs(componentCenter.z) < .2;
    if (isDoorAccessory) {
      const accessoryGeometry = source.clone();
      accessoryGeometry.applyMatrix4(meshToCar);
      accessoryGeometry.translate(
        -hingePositions[componentSide].x,
        -hingePositions[componentSide].y,
        -hingePositions[componentSide].z
      );
      const accessory = new THREE.Mesh(accessoryGeometry, mesh.material);
      accessory.name = `${componentSide < 0 ? "Driver" : "Passenger"} door armrest and trim`;
      accessory.castShadow = true;
      accessory.receiveShadow = true;
      pivots.get(componentSide).add(accessory);
      mesh.visible = false;
      continue;
    }
    const remainingByMaterial = new Map();
    const doorByMaterial = { [-1]: new Map(), [1]: new Map() };
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

    const materialForTriangle = triangleStart => {
      const group = source.groups.find(item => triangleStart >= item.start && triangleStart < item.start + item.count);
      return group?.materialIndex ?? 0;
    };
    const appendTriangle = (map, materialIndex, ids) => {
      if (!map.has(materialIndex)) map.set(materialIndex, []);
      map.get(materialIndex).push(...ids);
    };

    for (let i = 0; i + 2 < sourceIndices.length; i += 3) {
      const ids = [sourceIndices[i], sourceIndices[i + 1], sourceIndices[i + 2]];
      a.fromBufferAttribute(position, ids[0]).applyMatrix4(meshToCar);
      b.fromBufferAttribute(position, ids[1]).applyMatrix4(meshToCar);
      c.fromBufferAttribute(position, ids[2]).applyMatrix4(meshToCar);
      const x = (a.x + b.x + c.x) / 3;
      const y = (a.y + b.y + c.y) / 3;
      const z = (a.z + b.z + c.z) / 3;
      const side = Math.sign(x);
      // The side window, mirror, and lower door skin occupy this side band;
      // exclude the wheel zones at either end of the car.
      const belongsToDoor = Math.abs(x) > .115 && y > .015 && y < .36 && Math.abs(z) < .14;
      const materialIndex = materialForTriangle(i);
      if (belongsToDoor && side) appendTriangle(doorByMaterial[side], materialIndex, ids);
      else appendTriangle(remainingByMaterial, materialIndex, ids);
    }

    for (const side of [-1, 1]) {
      const groups = doorByMaterial[side];
      if (!groups.size) continue;
      const doorGeometry = source.clone();
      const indices = [];
      doorGeometry.clearGroups();
      for (const [materialIndex, groupIndices] of groups) {
        doorGeometry.addGroup(indices.length, groupIndices.length, materialIndex);
        indices.push(...groupIndices);
      }
      doorGeometry.setIndex(indices);
      doorGeometry.applyMatrix4(meshToCar);
      doorGeometry.translate(-hingePositions[side].x, -hingePositions[side].y, -hingePositions[side].z);
      doorGeometry.computeBoundingBox();
      doorGeometry.computeBoundingSphere();
      const panel = new THREE.Mesh(doorGeometry, mesh.material);
      panel.name = side < 0 ? "Driver door and window panel" : "Passenger door and window panel";
      panel.castShadow = true;
      panel.receiveShadow = true;
      pivots.get(side).add(panel);
      extractedTriangles += indices.length / 3;
    }

    if (doorByMaterial[-1].size || doorByMaterial[1].size) {
      const remaining = [];
      source.clearGroups();
      for (const [materialIndex, groupIndices] of remainingByMaterial) {
        source.addGroup(remaining.length, groupIndices.length, materialIndex);
        remaining.push(...groupIndices);
      }
      source.setIndex(remaining);
      source.computeBoundingBox();
      source.computeBoundingSphere();
    }
  }

  console.info("Separated side door/window geometry for scissor hinges.", { doors: pivots.size, extractedTriangles });
  return [-1, 1].map(side => ({
    pivot: pivots.get(side),
    // High front hinges lift the panels above the roof, matching the reference.
    // Both panels swing forward on the requested X axis.
    openAngle: 1.7,
    extractedTriangles
  }));
}

function buildPlaceholderStation(parent) {
  parent.clear();
  const add = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x8e9da4, roughness: .82, metalness: .12 });
  const safetyMaterial = new THREE.MeshStandardMaterial({ color: 0xf2c94c, emissive: 0x6c4a08, emissiveIntensity: .28, roughness: .58 });
  const platformCenterX = -(trainHalfWidth + 2.55);
  add(5.1, .14, 18, platformMaterial, platformCenterX, -.07, 0);
  add(.15, .035, 18, safetyMaterial, -(trainHalfWidth + .12), .015, 0);

  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024; signCanvas.height = 256;
  const ctx = signCanvas.getContext("2d");
  ctx.fillStyle = "#09263a"; ctx.fillRect(0, 0, signCanvas.width, signCanvas.height);
  ctx.fillStyle = "#29c5ef"; ctx.fillRect(0, 0, 18, signCanvas.height);
  ctx.fillStyle = "#effaff"; ctx.font = "700 70px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(`${selectedDestination?.stationName ?? "RAJINI METRO"} STATION`, 530, 104, 900);
  ctx.fillStyle = "#71d8f4"; ctx.font = "600 30px Arial";
  ctx.fillText("RAJINI METRO • PLATFORM 1", 530, 194, 900);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture, side: THREE.DoubleSide });
  const signPost = add(.13, 1.02, 2.8, mats.dark, -(trainHalfWidth + 1.25), 2.45, 0);
  signPost.name = "Placeholder station sign post";
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.7, .78), signMaterial);
  sign.name = "Destination station sign";
  sign.rotation.y = Math.PI / 2;
  sign.position.set(-(trainHalfWidth + .68), 2.45, 0);
  parent.add(sign);
}

function withCyberpunkTemplate(callback) {
  if (cyberpunkTemplate) { callback(cyberpunkTemplate); return; }
  if (!cyberpunkLoading) {
    cyberpunkLoading = true;
    new GLTFLoader().load("cyberpunk_station.glb", gltf => {
      cyberpunkTemplate = gltf.scene;
      cyberpunkLoading = false;
      callback(cyberpunkTemplate);
    }, undefined, error => {
      cyberpunkLoading = false;
      console.warn("Could not load the supplied cyberpunk station/building model.", error);
      callback(null);
    });
    return;
  }
  const waitForTemplate = () => {
    if (cyberpunkTemplate) callback(cyberpunkTemplate);
    else if (!cyberpunkLoading) callback(null);
    else requestAnimationFrame(waitForTemplate);
  };
  waitForTemplate();
}

function makeCyberpunkModule(template, targetHeight = 16) {
  const model = template.clone(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, .001);
  model.scale.multiplyScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  const module = new THREE.Group();
  module.name = "Cyberpunk station building module";
  module.add(model);
  return { module, width: size.x * scale, depth: size.z * scale, height: size.y * scale };
}

function loadCyberpunkEnvironment() {
  withCyberpunkTemplate(template => {
    if (!template) return;
    const { module, width, depth } = makeCyberpunkModule(template, 16);
    const repeatCount = Math.max(4, Math.round(240 / Math.max(depth, 1)));
    cyberpunkCityStep = 240 / repeatCount;
    cyberpunkCityRingLength = cyberpunkCityStep * 7;
    const city = new THREE.Group();
    city.name = "Repeating cyberpunk buildings outside the train";
    scene.add(city);
    // The exterior can finish loading before the imported carriage does, so
    // use a conservative width until trainHalfWidth has its measured value.
    const sideOffset = Math.max(trainHalfWidth, 3) + width / 2 + 5;
    for (const side of [-1, 1]) {
      for (let slot = -3; slot <= 3; slot++) {
        const building = module.clone(true);
        building.name = `Cyberpunk exterior building ${side < 0 ? "left" : "right"} ${slot + 4}`;
        building.position.set(side * sideOffset, 0, slot * cyberpunkCityStep);
        if (side > 0) building.rotation.y = Math.PI;
        city.add(building);
        cyberpunkCityInstances.push({ building, baseZ: slot * cyberpunkCityStep });
      }
    }
    console.info(`Loaded and repeated the cyberpunk building model outside the carriage (${cyberpunkCityInstances.length} instances).`);
  });
}

function updateCyberpunkEnvironment(dt) {
  if (!cyberpunkCityInstances.length) return;
  if (traveling) cyberpunkCityScroll += dt * 24;
  const ringStart = -cyberpunkCityRingLength / 2;
  for (const item of cyberpunkCityInstances) {
    const wrapped = ((item.baseZ + cyberpunkCityScroll - ringStart) % cyberpunkCityRingLength + cyberpunkCityRingLength) % cyberpunkCityRingLength;
    item.building.position.z = ringStart + wrapped;
  }
}

function loadStationBuilding(parent) {
  withCyberpunkTemplate(template => {
    if (!template) return;
    const { module, depth } = makeCyberpunkModule(template, 14);
    const landmark = new THREE.Group();
    landmark.name = "Cyberpunk landmark beyond the 3D Art sign board";
    landmark.rotation.y = Math.PI / 2;
    // Keep the imported station sign and its view line clear; the new landmark
    // sits farther down the platform with an open gap between the two models.
    landmark.position.set(-(trainHalfWidth + depth / 2 + 8), 0, 0);
    landmark.add(module);
    parent.add(landmark);
    console.info("Loaded the cyberpunk station landmark beyond the unchanged 3D Art sign board.");
  });
}

function loadCreatorStamps(parent) {
  creatorStampsFloat = null;
  new GLTFLoader().load("creator_stamps.glb", gltf => {
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 3.8 / Math.max(size.x, size.y, size.z, .001);
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
    const facingTrain = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    model.children.slice().forEach((part, index) => {
      const pivot = new THREE.Group();
      pivot.name = `Creator stamp ${index + 1} float pivot`;
      pivot.position.copy(part.position);
      pivot.quaternion.copy(part.quaternion).premultiply(facingTrain);
      pivot.scale.copy(part.scale);
      part.position.set(0, 0, 0);
      part.quaternion.identity();
      part.scale.set(1, 1, 1);
      model.remove(part);
      pivot.add(part);
      model.add(pivot);
    });
    const pieces = [];
    const clusters = [
      { z: -4.1, x: .15, y: -.05 },
      { z: 4.2, x: 0, y: 0 },
      { z: 7.7, x: -.2, y: .12 }
    ];
    let texturedMeshes = 0;
    clusters.forEach((layout, clusterIndex) => {
      const cluster = new THREE.Group();
      cluster.name = `Creator stamps floating cluster ${clusterIndex + 1}`;
      cluster.position.set(-(trainHalfWidth + 5.1) + layout.x, 3.45 + layout.y, layout.z);
      const instance = clusterIndex === 0 ? model : model.clone(true);
      cluster.add(instance);
      parent.add(cluster);
      instance.traverse(node => {
        if (node.isMesh && (Array.isArray(node.material) ? node.material : [node.material]).some(material => material?.map)) texturedMeshes++;
        if (!node.name.endsWith("float pivot")) return;
        pieces.push({
          pivot: node,
          base: node.position.clone(),
          phase: Math.random() * Math.PI * 2,
          speed: .2 + Math.random() * .2,
          xDrift: .32 + Math.random() * .22,
          yDrift: .13 + Math.random() * .1,
          zDrift: .38 + Math.random() * .25
        });
      });
    });
    creatorStampsFloat = { items: pieces, scale };
    console.info(`Loaded ${clusters.length} creator-stamp clusters (${pieces.length} independently drifting pieces, ${texturedMeshes} textured meshes); all face the train.`);
  }, undefined, error => {
    console.warn("Could not load creator stamps model; station scene remains available.", error);
  });
}

function addKopiBoyFireworks(parent) {
  const burstCount = 7, particlesPerBurst = 38, total = burstCount * particlesPerBurst;
  const positions = new Float32Array(total * 3), colors = new Float32Array(total * 3);
  const bursts = [];
  const palette = [0x43eaff, 0xff53cb, 0xffdb4b, 0x71ff9a, 0x9b70ff, 0xff7e43, 0x65a7ff];
  for (let burstIndex = 0; burstIndex < burstCount; burstIndex++) {
    const origin = new THREE.Vector3(-(trainHalfWidth + 8.2 + Math.random() * 3), 4 + Math.random() * 3.2, -9 + Math.random() * 18);
    const color = new THREE.Color(palette[burstIndex]);
    const directions = [];
    for (let p = 0; p < particlesPerBurst; p++) {
      const y = Math.random() * 2 - 1, angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(1 - y * y);
      directions.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      const i = (burstIndex * particlesPerBurst + p) * 3;
      const tint = color.clone().offsetHSL((Math.random() - .5) * .12, 0, (Math.random() - .5) * .12);
      colors[i] = tint.r; colors[i + 1] = tint.g; colors[i + 2] = tint.b;
    }
    bursts.push({ origin, directions, offset: burstIndex * .57, period: 4.1, lifetime: 1.55, speed: 2.2 + Math.random() * .8 });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: .19, sizeAttenuation: true, vertexColors: true, transparent: true,
    opacity: .94, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  points.name = "Colorful Kopi Boy celebration fireworks";
  points.frustumCulled = false;
  parent.add(points);
  kopiBoyFireworks = { points, bursts, particlesPerBurst, baseColors: colors.slice() };
}

function addKopiBoyLaunchBanner(parent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#07152d");
  background.addColorStop(.52, "#171034");
  background.addColorStop(1, "#082137");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#40dfff";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 48px Arial, sans-serif";
  ctx.fillStyle = "#b7efff";
  ctx.shadowColor = "#3acfff";
  ctx.shadowBlur = 18;
  ctx.fillText("NEXT PROJECT", canvas.width / 2, 83);
  const launch = ctx.createLinearGradient(220, 0, 804, 0);
  launch.addColorStop(0, "#ff67ef");
  launch.addColorStop(.52, "#fff08a");
  launch.addColorStop(1, "#ff9f50");
  ctx.font = "900 76px Arial, sans-serif";
  ctx.fillStyle = launch;
  ctx.shadowColor = "#ed57ff";
  ctx.shadowBlur = 24;
  ctx.fillText("LAUNCHING SOON", canvas.width / 2, 183);

  const banner = new THREE.Group();
  banner.name = "Kopi Boy next project launch banner";
  banner.position.set(-(trainHalfWidth + 4), 4.45, -1);
  banner.rotation.y = Math.PI / 2;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(6.2, 1.72, .2),
    new THREE.MeshStandardMaterial({
      color: 0x11142b, emissive: 0x6d27cf, emissiveIntensity: .85,
      metalness: .55, roughness: .3
    })
  );
  frame.name = "Neon launch banner frame";
  banner.add(frame);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.95, 1.48),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })
  );
  sign.name = "Designing upcoming project 2027 launch sign face";
  sign.position.z = .112;
  banner.add(sign);
  parent.add(banner);
}

function loadKopiBoyStation(parent, requestId) {
  kopiBoyRider = null;
  addKopiBoyFireworks(parent);
  addKopiBoyLaunchBanner(parent);

  const desktop = new THREE.Group();
  desktop.name = "Kopi Boy supplied desktop model scaled 26.67x, farther right and 1 step back";
  // Shift two more steps to screen-right and one step back from the current placement.
  desktop.position.set(-(trainHalfWidth + 5), 0, -2);
  desktop.rotation.y = Math.PI / 2;
  desktop.scale.setScalar(26.6666667);
  parent.add(desktop);
  new GLTFLoader().load("KB desktop LARGE Vsn.glb", gltf => {
    if (requestId !== aboutSelectionGeneration) return;
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    if (size.length() < .001 || !model.children.length) {
      console.error("KB desk top.glb contains no visible model geometry.");
      return;
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const baseScale = 1.3 / Math.max(size.x, size.z, .001);
    model.scale.setScalar(baseScale);
    model.position.set(-center.x * baseScale, -bounds.min.y * baseScale, -center.z * baseScale);
    model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    desktop.add(model);
    console.info("Loaded the supplied desktop model at half its previous displayed size, three steps screen-right.");
  }, undefined, error => console.error("Could not load KB desk top.glb.", error));

  new GLTFLoader().load("kb_rider.glb", gltf => {
    if (requestId !== aboutSelectionGeneration) return;
    const rider = new THREE.Group();
    rider.name = "Kopi Boy delivery rider cruising from screen right to left";
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const modelScale = 1.55 / Math.max(size.y, .001);
    model.scale.setScalar(modelScale);
    model.position.set(-center.x * modelScale, -bounds.min.y * modelScale, -center.z * modelScale);
    model.traverse(node => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
    // Keep the current rider rotation unchanged; move it from screen-right
    // to screen-left along +Z from the platform-facing view.
    rider.rotation.y = 0;
    rider.position.set(-(trainHalfWidth + 1.5), 0, -10.5);
    rider.userData.cruiseSpeed = 2.05;
    rider.add(model);
    parent.add(rider);
    kopiBoyRider = rider;
    console.info("Loaded the Kopi Boy rider in front of the desktop, cruising faster in a side profile from screen-right to screen-left.");
  }, undefined, error => console.error("Could not load KB rider.glb for the Kopi Boy station.", error));
}

function updateKopiBoyStation(dt, now) {
  if (kopiBoyRider && station?.visible && selectedDestination?.id === "kopi-boy") {
    kopiBoyRider.position.z += kopiBoyRider.userData.cruiseSpeed * dt;
    if (kopiBoyRider.position.z > 10.5) kopiBoyRider.position.z = -10.5;
    kopiBoyRider.position.y = Math.sin(now * 1.5) * .018;
  }
  if (!kopiBoyFireworks || !station?.visible || selectedDestination?.id !== "kopi-boy") return;
  const { points, bursts, particlesPerBurst, baseColors } = kopiBoyFireworks;
  const positions = points.geometry.attributes.position.array;
  const colors = points.geometry.attributes.color.array;
  bursts.forEach((burst, burstIndex) => {
    const age = (now + burst.offset) % burst.period;
    const active = age < burst.lifetime;
    const fade = active ? 1 - age / burst.lifetime : 0;
    for (let particle = 0; particle < particlesPerBurst; particle++) {
      const i = burstIndex * particlesPerBurst + particle, offset = i * 3;
      if (active) {
        const distance = burst.speed * age * (.82 + (particle % 7) * .035);
        const direction = burst.directions[particle];
        positions[offset] = burst.origin.x + direction.x * distance;
        positions[offset + 1] = burst.origin.y + direction.y * distance - 1.2 * age * age;
        positions[offset + 2] = burst.origin.z + direction.z * distance;
        colors[offset] = baseColors[offset] * fade;
        colors[offset + 1] = baseColors[offset + 1] * fade;
        colors[offset + 2] = baseColors[offset + 2] * fade;
      } else {
        positions[offset] = 0; positions[offset + 1] = -1000; positions[offset + 2] = 0;
      }
    }
  });
  points.geometry.attributes.position.needsUpdate = true;
  points.geometry.attributes.color.needsUpdate = true;
}

async function loadStationModel(destination) {
  const requestId = ++aboutSelectionGeneration;
  creatorStampsFloat = null;
  artSpinPivots = [];
  aboutSelectionPairs = [];
  aboutSelectionIndex = 0;
  aboutSelectionMotion = null;
  // Kopi Boy uses the supplied models and fireworks without our generated
  // platform, safety strip, station sign, or post.
  if (destination?.id === "kopi-boy") stationContent.clear();
  else buildPlaceholderStation(stationContent);
  if (destination?.id === "about-me") {
    buildAboutMeSelection(stationContent, requestId);
    return true;
  }
  if (destination?.id === "kopi-boy") {
    loadKopiBoyStation(stationContent, requestId);
    return true;
  }
  if (!destination?.modelPath) return false;
  stationContent.children
    .filter(child => child.name === "Destination station sign" || child.name === "Placeholder station sign post")
    .forEach(child => stationContent.remove(child));
  return new Promise(resolve => {
    new GLTFLoader().load(destination.modelPath, gltf => {
      const model = gltf.scene;
      const mappedMaterials = new Set();
      const isArtStation = destination.id === "3d-art";
      model.traverse(node => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(material => {
          if (material?.map) mappedMaterials.add(material);
          prepareStationNightMaterial(material);
        });
      });
      if (isArtStation) prepareArtStationSpinners(model);
      console.info(`Loaded ${destination.stationName} model with ${mappedMaterials.size} original embedded-texture materials.`);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const targetWidth = destination.id === "web-development" ? 10 : 2.8;
      const scale = isArtStation ? 1 : targetWidth / Math.max(size.x, .001);
      const placement = new THREE.Group();
      placement.name = `${destination.stationName} station model placement`;
      placement.rotation.y = destination.id === "web-development"
        ? -Math.PI / 2
        : isArtStation ? 0 : Math.PI / 2;
      // The Art lineup runs front-to-back beside the vehicle lane; all other
      // station models remain at their usual outer platform edge.
      const platformOffset = isArtStation ? 11 : destination.id === "web-development" ? 2.55 : 4;
      const alongPlatform = 0;
      placement.position.set(
        isArtStation ? trainHalfWidth + platformOffset : -(trainHalfWidth + platformOffset),
        isArtStation ? .05 : size.y * scale / 2 + .05,
        alongPlatform
      );
      model.scale.setScalar(scale);
      if (isArtStation) model.position.set(0, 0, 0);
      else model.position.copy(center).multiplyScalar(-scale);
      placement.add(model);
      stationContent.add(placement);
      if (isArtStation) loadArtInfoBoard(stationContent, platformOffset, requestId);
      console.info(`Loaded ${destination.stationName} station model, centered on platform and facing the vehicle.`);
      resolve(true);
    }, undefined, error => {
      console.warn(`Could not load station model for ${destination.title}; keeping placeholder.`, error);
      buildPlaceholderStation(stationContent); resolve(false);
    });
  });
}

function buildAboutMeSelection(parent, requestId) {
  parent.children
    .filter(child => child.name === "Destination station sign" || child.name === "Placeholder station sign post")
    .forEach(child => parent.remove(child));

  const loader = new GLTFLoader();
  aboutPlayers.forEach((profile, index) => {
    loader.load(profile.model, gltf => {
      if (requestId !== aboutSelectionGeneration) return;
      const pair = new THREE.Group();
      pair.name = `About Me player ${profile.name} model and hero card`;
      pair.visible = index === aboutSelectionIndex;

      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x07111c,
        emissive: profile.accent,
        emissiveIntensity: .22,
        metalness: .5,
        roughness: .38
      });
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(.13, aboutProfileCardHeight + .17, aboutProfileCardWidth + .14),
        frameMaterial
      );
      frame.name = `${profile.name} hero card frame`;
      frame.position.set(-5.55, 2.08, 0);
      pair.add(frame);

      const cardTexture = new THREE.TextureLoader().load(
        profile.card,
        texture => { texture.colorSpace = THREE.SRGBColorSpace; }
      );
      cardTexture.colorSpace = THREE.SRGBColorSpace;
      cardTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(aboutProfileCardWidth, aboutProfileCardHeight),
        new THREE.MeshBasicMaterial({ map: cardTexture, side: THREE.DoubleSide, toneMapped: false })
      );
      card.name = `${profile.name} hero card`;
      card.rotation.y = Math.PI / 2;
      card.position.set(-5.475, 2.08, 0);
      pair.add(card);

      const avatar = new THREE.Group();
      avatar.name = `${profile.name} player model`;
      avatar.position.set(-4.52, 0, 2);
      const model = gltf.scene;
      const authoredRoot = model.children.find(child => child.isMesh || child.children.length) ?? model;
      const authoredYaw = new THREE.Euler().setFromQuaternion(authoredRoot.quaternion, "YXZ").y;
      // The supplied GLBs use different baked-in heading rotations. Counter
      // each one so every character presents its front toward the train.
      avatar.rotation.y = Math.PI / 2 + (profile.facingOffset ?? 0) - authoredYaw;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const modelScale = 2.2 / Math.max(size.y, .001);
      model.scale.setScalar(modelScale);
      model.position.set(-center.x * modelScale, -bounds.min.y * modelScale, -center.z * modelScale);
      model.traverse(node => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
      });
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
        pair.userData.animationMixer = mixer;
        console.info(`Playing ${gltf.animations[0].name} on the ${profile.name} player model.`);
      } else {
        console.warn(`The ${profile.name} model loaded without an animation clip.`);
      }
      avatar.add(model);
      pair.add(avatar);
      pair.position.z = aboutSelectionBaseZ;
      parent.add(pair);
      aboutSelectionPairs[index] = pair;
      updateAboutPlayerSelector();
    }, undefined, error => {
      if (requestId !== aboutSelectionGeneration) return;
      console.warn(`Could not load the ${profile.name} player model.`, error);
      updateAboutPlayerSelector();
    });
  });
  updateAboutPlayerSelector();
}

function updateAboutPlayerSelector() {
  const selector = $("aboutSelector");
  if (!selector) return;
  const player = aboutPlayers[aboutSelectionIndex];
  const atAboutMe = selectedDestination?.id === "about-me" && !traveling && !outsideStation &&
    (travelPhase === "doorsOpening" || travelPhase === "arrived");
  selector.hidden = !atAboutMe;
  $("aboutPlayerName").textContent = player.name;
  $("aboutPlayerCount").textContent = `PLAYER ${String(aboutSelectionIndex + 1).padStart(2, "0")} / 04`;
  const ready = aboutSelectionPairs.length === aboutPlayers.length && aboutSelectionPairs.every(Boolean);
  $("aboutPrev").disabled = !atAboutMe || !ready || Boolean(aboutSelectionMotion);
  $("aboutNext").disabled = !atAboutMe || !ready || Boolean(aboutSelectionMotion);
  selector.dataset.player = player.name.toLowerCase().replaceAll(" ", "-");
}

function changeAboutPlayer(direction) {
  if (aboutSelectionMotion || aboutSelectionPairs.length !== aboutPlayers.length || !aboutSelectionPairs.every(Boolean)) return;
  const nextIndex = (aboutSelectionIndex + direction + aboutPlayers.length) % aboutPlayers.length;
  const outgoing = aboutSelectionPairs[aboutSelectionIndex];
  const incoming = aboutSelectionPairs[nextIndex];
  if (!outgoing || !incoming) return;
  const incomingFrom = direction > 0 ? -1.7 : 1.7;
  incoming.visible = true;
  incoming.position.z = aboutSelectionBaseZ + incomingFrom;
  incoming.scale.setScalar(.96);
  aboutSelectionMotion = { outgoing, incoming, incomingFrom, elapsed: 0, duration: .58 };
  aboutSelectionIndex = nextIndex;
  updateAboutPlayerSelector();
}

function updateAboutPlayerSelection(dt) {
  if (!aboutSelectionMotion) return;
  const motion = aboutSelectionMotion;
  motion.elapsed += dt;
  const t = THREE.MathUtils.clamp(motion.elapsed / motion.duration, 0, 1);
  const eased = t * t * (3 - 2 * t);
  motion.outgoing.position.z = aboutSelectionBaseZ - motion.incomingFrom * eased;
  motion.incoming.position.z = aboutSelectionBaseZ + motion.incomingFrom * (1 - eased);
  motion.outgoing.scale.setScalar(1 - .04 * eased);
  motion.incoming.scale.setScalar(.96 + .04 * eased);
  if (t >= 1) {
    motion.outgoing.visible = false;
    motion.outgoing.position.z = aboutSelectionBaseZ;
    motion.outgoing.scale.setScalar(1);
    motion.incoming.position.z = aboutSelectionBaseZ;
    motion.incoming.scale.setScalar(1);
    aboutSelectionMotion = null;
    updateAboutPlayerSelector();
  }
}

function updateCamera() {
  camera.fov = zoom; camera.updateProjectionMatrix();
  camera.position.copy(fpvPosition);
  const cp = Math.cos(pitch);
  const direction = new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
  camera.lookAt(camera.position.clone().add(direction));
}

function updateFpvMovement(dt) {
  if (!running || traveling) return;
  const forwardAxis = Number(pressedKeys.has("w") || pressedKeys.has("arrowup"))
    - Number(pressedKeys.has("s") || pressedKeys.has("arrowdown"));
  const strafeAxis = Number(pressedKeys.has("d") || pressedKeys.has("arrowright"))
    - Number(pressedKeys.has("a") || pressedKeys.has("arrowleft"));
  if (!forwardAxis && !strafeAxis) return;

  const forwardX = Math.sin(yaw), forwardZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw), rightZ = Math.sin(yaw);
  const direction = new THREE.Vector3(
    forwardX * forwardAxis + rightX * strafeAxis,
    0,
    forwardZ * forwardAxis + rightZ * strafeAxis
  ).normalize();
  const speed = pressedKeys.has("shift") ? 5.5 : 3.2;
  const atStation = travelPhase === "arrived";
  let nextX = fpvPosition.x + direction.x * speed * dt;
  let nextZ = fpvPosition.z + direction.z * speed * dt;
  if (!atStation) {
    fpvPosition.x = THREE.MathUtils.clamp(nextX, fpvBounds.minX, fpvBounds.maxX);
    fpvPosition.z = THREE.MathUtils.clamp(nextZ, fpvBounds.minZ, fpvBounds.maxZ);
    return;
  }
  const platformDoors = sideDoorPanels.filter(door => door.side < 0);
  const doorPlaneX = platformDoors.length
    ? platformDoors.reduce((sum, door) => sum + door.worldX, 0) / platformDoors.length
    : -trainHalfWidth;
    nextZ = THREE.MathUtils.clamp(nextZ, fpvBounds.minZ, fpvBounds.maxZ);
    const doorsOpen = !vehicleHasDoors || (doorTarget > .5 && doorProgress > .94);
    const alignedWithOpenDoor = doorsOpen && (!vehicleHasDoors || platformDoors.some(door => Math.abs(door.worldZ - nextZ) < 1.05));
  if (!outsideStation) {
      const insideLimit = alignedWithOpenDoor ? doorPlaneX - .45 : doorPlaneX + .16;
      nextX = THREE.MathUtils.clamp(nextX, Math.min(fpvBounds.minX, insideLimit), fpvBounds.maxX);
      if (nextX < doorPlaneX - .18) {
        if (alignedWithOpenDoor) {
        outsideStation = true;
        $("stationInfo").hidden = true;
          $("stationHud").textContent = `${selectedDestination.title} • ON PLATFORM`;
        setTabletState();
        } else nextX = doorPlaneX + .16;
    }
  } else {
      const outsideLimit = alignedWithOpenDoor ? doorPlaneX + .45 : doorPlaneX - .18;
      nextX = THREE.MathUtils.clamp(nextX, doorPlaneX - 4.8, outsideLimit);
    nextZ = THREE.MathUtils.clamp(nextZ, stationStopZ - 8.1, stationStopZ + 8.1);
      if (nextX > doorPlaneX + .18) {
      if (alignedWithOpenDoor) {
        outsideStation = false;
        setDoorTarget(false);
        $("stationHud").textContent = "BACK IN CAR • CLOSING DOORS";
        setTabletState();
        } else nextX = doorPlaneX - .18;
    }
  }
  fpvPosition.x = nextX;
  fpvPosition.z = nextZ;
}

function setTabletState() {
  if (outsideStation) $("tabletStatus").textContent = `AT DESTINATION • ${selectedDestination?.title ?? "STOP"}`;
  else if (travelPhase === "doorsClosingForTravel") $("tabletStatus").textContent = "PREPARING TO DRIVE…";
  else if (traveling) $("tabletStatus").textContent = `DRIVING TO ${selectedDestination?.title ?? "DESTINATION"}`;
  else if (travelPhase === "doorsOpening") $("tabletStatus").textContent = "ARRIVING…";
  else if (travelPhase === "arrived") $("tabletStatus").textContent = "DESTINATION REACHED • STEP OUT WHEN READY";
  else $("tabletStatus").textContent = "VEHICLE READY";
  document.querySelectorAll("[data-station]").forEach(button => { button.disabled = traveling || outsideStation || travelPhase === "doorsClosing"; });
  updateAboutPlayerSelector();
}
function setJourneyPanelOpen(isOpen, persist = true) {
  const panel = $("tabletUI"), toggle = $("journeyToggle");
  panel.hidden = !isOpen;
  toggle.hidden = isOpen;
  toggle.setAttribute("aria-expanded", String(isOpen));
  if (persist) {
    try { localStorage.setItem("rajiniMetroJourneyPanel", isOpen ? "open" : "closed"); }
    catch (error) { console.warn("Could not save the journey panel preference.", error); }
  }
}
function showStation() {
  station.visible = true;
  // Keep the station at its world position while the exterior scrolls past it.
  station.position.set(0, 0, fpvPosition.z - outside.position.z);
  loadStationModel(selectedDestination);
  const kopiBoyStop = selectedDestination?.id === "kopi-boy";
  $("hud").classList.toggle("kopiBoyNoHud", kopiBoyStop);
  $("stationWorldLabel").textContent = `${selectedDestination.stationName.toUpperCase()} STATION`;
  $("stationWorldLabel").style.display = kopiBoyStop ? "none" : "block";
  $("stationDescription").textContent = selectedDestination.description;
  const contactStop = selectedDestination?.id === "contact";
  $("stationContent").textContent = contactStop
    ? "Thanks for visiting my portfolio. Connect with me on GitHub."
    : selectedDestination.placeholderContent;
  $("stationContactLink").hidden = !contactStop;
  $("stationInfo").hidden = !contactStop;
}
function hideStation() { station.visible = false; $("hud").classList.remove("kopiBoyNoHud"); $("stationWorldLabel").style.display = "none"; $("stationInfo").hidden = true; }
function beginTravel(destination) {
  if (!destination || traveling || outsideStation || travelPhase === "doorsClosing") return;
  selectedDestination = destination;
  $("hud").classList.remove("kopiBoyNoHud");
  traveling = true; travelPhase = "doorsClosingForTravel";
  setDoorTarget(false);
  $("stationHud").textContent = "PREPARING TO DEPART";
  setTabletState();
}
function arrive() {
  traveling = false; travelPhase = "doorsOpening"; setDoorTarget(true);
  // Keep the camera at the driver seat and preserve its exact arrival position.
  stationStopZ = fpvPosition.z;
  showStation();
  $("stationHud").textContent = `ARRIVED — ${selectedDestination.title}`;
  setTabletState();
}
function visitStationDirectly(destination) {
  if (!destination || traveling || outsideStation) return;
  $("startOverlay").classList.add("startHidden");
  $("arrival").classList.add("hidden");
  document.body.classList.add("portfolioStarted");
  running = true;
  traveling = false;
  outsideStation = false;
  selectedDestination = destination;
  travelPhase = "doorsOpening";
  stationStopZ = fpvPosition.z;
  setDoorTarget(true);
  showStation();
  $("stationHud").textContent = `ARRIVED — ${destination.title}`;
  setTabletState();
  updateCamera();
  canvas.focus({ preventScroll: true });
  setPortfolioMusic(true);
}
function setupInput() {
  const navigationKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
  let journeyPanelOpen = true;
  try { journeyPanelOpen = localStorage.getItem("rajiniMetroJourneyPanel") !== "closed"; } catch {}
  setJourneyPanelOpen(journeyPanelOpen, false);
  $("journeyClose").addEventListener("click", event => {
    event.stopPropagation();
    setJourneyPanelOpen(false);
  });
  $("journeyToggle").addEventListener("click", event => {
    event.stopPropagation();
    setJourneyPanelOpen(true);
  });
  canvas.addEventListener("pointerdown", e => {
    if (!running || e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  });
  document.querySelectorAll("#touchControls [data-move]").forEach(button => {
    const key = button.dataset.move;
    const release = event => {
      event.preventDefault();
      pressedKeys.delete(key);
      button.classList.remove("pressed");
    };
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      if (!running) return;
      pressedKeys.add(key);
      button.classList.add("pressed");
      button.setPointerCapture?.(event.pointerId);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, release);
  });
  document.querySelectorAll("#touchControls [data-turn]").forEach(button => {
    const direction = button.dataset.turn;
    const release = event => {
      event.preventDefault();
      activeTouchTurns.delete(direction);
      button.classList.remove("pressed");
    };
    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      if (!running) return;
      activeTouchTurns.add(direction);
      button.classList.add("pressed");
      button.setPointerCapture?.(event.pointerId);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, release);
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  canvas.addEventListener("pointermove", e => {
    if (!dragging || !running) return;
    yaw -= (e.clientX - lastX) * .004;
    pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastY) * .0025, -1.15, 1.05);
    lastX = e.clientX; lastY = e.clientY; updateCamera();
  });
  window.addEventListener("pointerup", () => { dragging = false; });
  window.addEventListener("wheel", e => {
    if (!running) return;
    // Ctrl+wheel and ordinary wheel both zoom, while events over the tablet remain native.
    if (e.target.closest?.("#tabletUI")) return;
    zoom = THREE.MathUtils.clamp(zoom + (e.deltaY > 0 ? 4 : -4), 20, 112);
    updateCamera();
  }, { passive: true });
  document.querySelectorAll("#tabletUI button[data-station]").forEach(button => {
    button.addEventListener("click", () => {
      if (traveling || outsideStation) return;
      const destination = destinations.find(item => item.id === button.dataset.station);
      beginTravel(destination);
      canvas.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll("#landingDestinations [data-direct-station]").forEach(button => {
    button.addEventListener("click", () => {
      const destination = destinations.find(item => item.id === button.dataset.directStation);
      visitStationDirectly(destination);
    });
  });
  $("musicToggle").addEventListener("click", () => setPortfolioMusic(!portfolioMusicEnabled));
  $("aboutPrev").addEventListener("click", event => { event.stopPropagation(); changeAboutPlayer(-1); });
  $("aboutNext").addEventListener("click", event => { event.stopPropagation(); changeAboutPlayer(1); });
  $("startBtn").addEventListener("click", () => {
    $("startOverlay").classList.add("startHidden"); document.body.classList.add("portfolioStarted"); running = true;
    setPortfolioMusic(true);
    $("stationHud").textContent = "DRIVING"; setTabletState(); updateCamera();
  });
  $("landingFullscreen").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("Fullscreen mode is unavailable in this browser.", error);
    }
  });
  $("continueBtn").addEventListener("click", () => { finishLoading(); $("continueBtn").hidden = true; });
  $("reloadBtn").addEventListener("click", () => location.reload());
  window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (!running || e.target.closest?.("#tabletUI")) return;
    if (navigationKeys.has(key)) {
      const firstPress = !pressedKeys.has(key);
      pressedKeys.add(key);
      if (firstPress) updateFpvMovement(.08);
      e.preventDefault();
    } else if (key === "shift") pressedKeys.add("shift");
  });
  window.addEventListener("keyup", e => pressedKeys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => {
    pressedKeys.clear(); dragging = false;
    activeTouchTurns.clear();
    document.querySelectorAll("#touchControls .pressed").forEach(button => button.classList.remove("pressed"));
  });
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getDelta();
  const dt = Math.min(elapsed, .05), now = clock.elapsedTime;
  if (running && activeTouchTurns.size) {
    const turnAxis = Number(activeTouchTurns.has("right")) - Number(activeTouchTurns.has("left"));
    yaw += turnAxis * 1.8 * dt;
  }
  if (creatorStampsFloat) {
    const { items, scale } = creatorStampsFloat;
    for (const item of items) {
      const { pivot, base, phase, speed, xDrift, yDrift, zDrift } = item;
      const t = now * speed + phase;
      pivot.position.x = base.x + Math.sin(t) * xDrift / scale;
      pivot.position.y = base.y + Math.sin(t * .73 + phase) * yDrift / scale;
      pivot.position.z = base.z + Math.cos(t * .87 + phase) * zDrift / scale;
    }
  }
  updateDoors(dt);
  updatePartition(elapsed);
  updateAboutPlayerSelection(dt);
  for (const pair of aboutSelectionPairs) {
    if (pair?.visible && pair.userData.animationMixer) pair.userData.animationMixer.update(dt);
  }
  updateFlyingBikes(now);
  updateArtStationSpinners(dt);
  updateKopiBoyStation(dt, now);
  updateFpvMovement(dt);
  if (running && !outsideStation) {
    const activeTrain = trainModelRoot || train;
    activeTrain.position.y = traveling ? Math.sin(now * 19) * .018 : Math.sin(now * 9) * .004;
    activeTrain.rotation.x = traveling ? Math.sin(now * 7) * .0012 : 0;
  }
  if (traveling && travelPhase === "doorsClosingForTravel" && doorProgress < .03) {
    travelPhase = "travelling"; travelStart = now;
    $("stationHud").textContent = `DRIVING TO ${selectedDestination.title}`;
    $("arrivalTitle").textContent = selectedDestination.title;
    $("arrival").classList.remove("hidden");
    window.setTimeout(() => $("arrival").classList.add("hidden"), 1400);
    setTabletState();
  }
  if (running && traveling && travelPhase === "travelling") {
    outside.position.z = (outside.position.z + dt * 24) % 240;
    updateCyberpunkEnvironment(dt);
    scene.background.setHSL(.56, .18, .48 + .11 * Math.sin(now * 1.4));
    scene.fog.color.copy(scene.background);
    if (now - travelStart > 4.2) arrive();
  } else if (!stationNightMode) {
    scene.background.set(0x9fb8c9); scene.fog.color.set(0x9fb8c9);
  }
  const atNightStation = Boolean(selectedDestination) && !traveling &&
    (travelPhase === "doorsOpening" || travelPhase === "arrived" || outsideStation);
  setStationNightMode(atNightStation);
  const atWebDevelopmentStation = selectedDestination?.id === "web-development" && !traveling &&
    (travelPhase === "doorsOpening" || travelPhase === "arrived" || outsideStation);
  for (const item of cyberpunkCityInstances) item.building.visible = !atWebDevelopmentStation;
  if (travelPhase === "doorsOpening" && (!vehicleHasDoors || doorProgress > .97)) { travelPhase = "arrived"; setTabletState(); }
  if (travelPhase === "doorsClosing" && doorProgress < .03) { travelPhase = "idle"; selectedDestination = null; setTabletState(); }
  if (travelPhase === "arrived") {
    $("tabletStatus").textContent = "DESTINATION REACHED • STEP OUT WHEN READY";
  }
  updateCamera();
  renderer.render(scene, camera);
}

async function initialize() {
  setLoading("INITIALISING RAJINI PORTFOLIO…");
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } catch (error) {
    console.error("WebGL renderer could not be created.", error);
    showFatalError("This browser could not start WebGL. Try an updated browser with hardware acceleration enabled.");
    return;
  }
  try {
    buildScene();
    setupInput();
    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    });
    clock.start();
    // Seat GLB callback controls when the ready state is shown.
    animate();
  } catch (error) {
    console.error("Application initialization failed.", error);
    showFatalError("Rajini Portfolio could not finish starting. Check the browser console for details.");
  }
}

initialize();
