import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// =====================================================
// SCENE
// =====================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x102a38);
scene.fog = new THREE.Fog(0x102a38, 45, 180);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled = true;

// IMPORTANT FOR PEN / TABLET
renderer.domElement.style.touchAction = "none";
renderer.domElement.style.userSelect = "none";
renderer.domElement.style.webkitUserSelect = "none";

document
  .getElementById("game")
  .appendChild(renderer.domElement);


// =====================================================
// LIGHTING
// =====================================================

scene.add(
  new THREE.HemisphereLight(
    0xbdefff,
    0x18313d,
    2.5
  )
);

const sun = new THREE.DirectionalLight(
  0xffffff,
  3
);

sun.position.set(30, 60, 20);
sun.castShadow = true;

scene.add(sun);


// =====================================================
// GROUND
// =====================================================

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({
    color: 0x18313b,
    roughness: 0.8
  })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);


// =====================================================
// ROADS
// =====================================================

function createRoad(x, z, width, depth) {

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(
      width,
      0.15,
      depth
    ),
    new THREE.MeshStandardMaterial({
      color: 0x242d33,
      roughness: 0.9
    })
  );

  road.position.set(x, 0.08, z);

  scene.add(road);
}

createRoad(0, 0, 18, 300);
createRoad(0, 0, 300, 18);


// =====================================================
// ROAD LIGHTS
// =====================================================

function createLightPole(x, z) {

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.08,
      0.12,
      5,
      8
    ),
    new THREE.MeshStandardMaterial({
      color: 0x657d86
    })
  );

  pole.position.set(x, 2.5, z);

  scene.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.22,
      12,
      12
    ),
    new THREE.MeshBasicMaterial({
      color: 0x4df6ff
    })
  );

  lamp.position.set(x, 5.1, z);

  scene.add(lamp);

  const light = new THREE.PointLight(
    0x4df6ff,
    3,
    18
  );

  light.position.copy(lamp.position);

  scene.add(light);
}

for (let x = -60; x <= 60; x += 20) {

  createLightPole(11, x);
  createLightPole(-11, x);

}


// =====================================================
// TREES
// =====================================================

function createTree(x, z) {

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.25,
      0.35,
      2.5,
      8
    ),
    new THREE.MeshStandardMaterial({
      color: 0x5b4030
    })
  );

  trunk.position.set(x, 1.25, z);

  scene.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(
      1.5,
      12,
      12
    ),
    new THREE.MeshStandardMaterial({
      color: 0x20745d
    })
  );

  leaves.position.set(x, 3.2, z);

  scene.add(leaves);
}

for (let i = -70; i <= 70; i += 14) {

  createTree(-15, i);
  createTree(15, i);

}


// =====================================================
// CBD MODEL
// =====================================================

const loader = new GLTFLoader();

const modelURL = new URL(
  "./CBD area.glb",
  import.meta.url
).href;

loader.load(
  modelURL,

  function (gltf) {

    const city = gltf.scene;

    const box =
      new THREE.Box3().setFromObject(city);

    const size =
      box.getSize(
        new THREE.Vector3()
      );

    const center =
      box.getCenter(
        new THREE.Vector3()
      );

    city.position.x -= center.x;
    city.position.z -= center.z;

    const maxSize =
      Math.max(
        size.x,
        size.y,
        size.z
      );

    if (maxSize > 0) {

      city.scale.setScalar(
        100 / maxSize
      );

    }

    city.position.y = 0;

    city.traverse(
      function (object) {

        if (object.isMesh) {

          object.castShadow = false;
          object.receiveShadow = true;

        }

      }
    );

    scene.add(city);

    console.log(
      "CBD area loaded successfully."
    );

  },

  undefined,

  function (error) {

    console.error(
      "CBD GLB failed:",
      error
    );

  }
);


// =====================================================
// CAR
// =====================================================

const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(
    2.4,
    0.65,
    4.2
  ),
  new THREE.MeshStandardMaterial({
    color: 0x16d9ff,
    metalness: 0.5,
    roughness: 0.25
  })
);

body.position.y = 0.75;
body.castShadow = true;

car.add(body);


const roof = new THREE.Mesh(
  new THREE.BoxGeometry(
    1.7,
    0.55,
    1.8
  ),
  new THREE.MeshStandardMaterial({
    color: 0x142a35,
    metalness: 0.4,
    roughness: 0.2
  })
);

roof.position.set(
  0,
  1.25,
  -0.15
);

car.add(roof);


function createWheel(x, z) {

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.42,
      0.42,
      0.3,
      16
    ),
    new THREE.MeshStandardMaterial({
      color: 0x111111
    })
  );

  wheel.rotation.z =
    Math.PI / 2;

  wheel.position.set(
    x,
    0.45,
    z
  );

  car.add(wheel);
}

createWheel(-1.25, -1.35);
createWheel(1.25, -1.35);
createWheel(-1.25, 1.35);
createWheel(1.25, 1.35);

car.position.set(
  0,
  0,
  10
);

scene.add(car);


// =====================================================
// PORTFOLIO STATIONS
// =====================================================

const stations = [];

const stationData = [

  {
    title: "ABOUT ME",
    tag: "PROFILE",
    body:
      "Welcome to my interactive digital portfolio. Explore my background, experience and creative journey.",
    position: [-8, 1.5, -12]
  },

  {
    title: "PROJECTS",
    tag: "WORK",
    body:
      "A collection of my digital marketing, UX/UI, interactive media and creative technology projects.",
    position: [8, 1.5, -12]
  },

  {
    title: "DIGITAL SKILLS",
    tag: "SKILLS",
    body:
      "Digital marketing, UX/UI, 3D, Unreal Engine, Blender, web development and interactive design.",
    position: [-8, 1.5, 12]
  },

  {
    title: "EDUCATION",
    tag: "EDUCATION",
    body:
      "My academic journey, qualifications and current studies in Digital Marketing.",
    position: [8, 1.5, 12]
  },

  {
    title: "LINKEDIN",
    tag: "CONNECT",
    body:
      "Connect with me and view my professional profile on LinkedIn.",
    position: [0, 1.5, -28],
    link: "https://www.linkedin.com/"
  }

];


function createStation(data) {

  const group =
    new THREE.Group();

  const platform =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        2,
        2,
        0.25,
        32
      ),
      new THREE.MeshStandardMaterial({
        color: 0x163d4b,
        emissive: 0x06242e
      })
    );

  platform.position.y = 0.15;

  group.add(platform);


  const pillar =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.4,
        3,
        0.35
      ),
      new THREE.MeshStandardMaterial({
        color: 0x4df6ff,
        emissive: 0x0b7884,
        emissiveIntensity: 1
      })
    );

  pillar.position.y = 1.7;

  group.add(pillar);


  const light =
    new THREE.PointLight(
      0x4df6ff,
      2,
      12
    );

  light.position.y = 3;

  group.add(light);


  group.position.set(
    data.position[0],
    0,
    data.position[2]
  );

  group.userData = data;

  scene.add(group);

  stations.push(group);
}

stationData.forEach(
  createStation
);


// =====================================================
// KEYBOARD
// =====================================================

const keys = {};

window.addEventListener(
  "keydown",
  function (event) {

    keys[
      event.key.toLowerCase()
    ] = true;

  }
);

window.addEventListener(
  "keyup",
  function (event) {

    keys[
      event.key.toLowerCase()
    ] = false;

  }
);


// =====================================================
// MOBILE CONTROLS
// =====================================================

document
  .querySelectorAll(
    "#mobileControls button"
  )
  .forEach(button => {

    const key =
      button.dataset.key;

    button.addEventListener(
      "pointerdown",
      function (event) {

        event.preventDefault();

        keys[key] = true;

      }
    );

    button.addEventListener(
      "pointerup",
      function (event) {

        event.preventDefault();

        keys[key] = false;

      }
    );

    button.addEventListener(
      "pointercancel",
      function () {

        keys[key] = false;

      }
    );

  });


// =====================================================
// PEN / TABLET CAMERA CONTROL
// =====================================================

let cameraDistance = 11;

let cameraAngle = 0;

let cameraHeight = 6;

let pointerDown = false;

let lastX = 0;

let lastY = 0;

let dragDistance = 0;


// POINTER DOWN
// Works with mouse + pen + touch

renderer.domElement.addEventListener(
  "pointerdown",
  function (event) {

    // Ignore right mouse button
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    pointerDown = true;

    dragDistance = 0;

    lastX = event.clientX;
    lastY = event.clientY;

    try {

      renderer.domElement.setPointerCapture(
        event.pointerId
      );

    } catch (error) {}

  },
  { passive: false }
);


// POINTER MOVE

renderer.domElement.addEventListener(
  "pointermove",
  function (event) {

    if (!pointerDown)
      return;

    event.preventDefault();

    const dx =
      event.clientX - lastX;

    const dy =
      event.clientY - lastY;

    dragDistance +=
      Math.abs(dx) +
      Math.abs(dy);


    // Horizontal rotation

    cameraAngle -=
      dx * 0.008;


    // Vertical camera movement

    cameraHeight -=
      dy * 0.04;


    cameraHeight =
      THREE.MathUtils.clamp(
        cameraHeight,
        2.5,
        12
      );


    lastX =
      event.clientX;

    lastY =
      event.clientY;

  },
  { passive: false }
);


// POINTER UP

renderer.domElement.addEventListener(
  "pointerup",
  function (event) {

    event.preventDefault();

    pointerDown = false;

    try {

      renderer.domElement.releasePointerCapture(
        event.pointerId
      );

    } catch (error) {}

  },
  { passive: false }
);


// POINTER CANCEL

renderer.domElement.addEventListener(
  "pointercancel",
  function () {

    pointerDown = false;

  }
);


// =====================================================
// PEN BARREL BUTTON / RIGHT CLICK
// =====================================================

renderer.domElement.addEventListener(
  "contextmenu",
  function (event) {

    event.preventDefault();

  }
);


// =====================================================
// ZOOM
// =====================================================

renderer.domElement.addEventListener(
  "wheel",
  function (event) {

    event.preventDefault();

    cameraDistance +=
      event.deltaY * 0.01;

    cameraDistance =
      THREE.MathUtils.clamp(
        cameraDistance,
        5,
        30
      );

  },
  {
    passive: false
  }
);


// =====================================================
// PORTFOLIO PANEL
// =====================================================

const panel =
  document.getElementById(
    "panel"
  );

const panelTitle =
  document.getElementById(
    "panelTitle"
  );

const panelTag =
  document.getElementById(
    "panelTag"
  );

const panelBody =
  document.getElementById(
    "panelBody"
  );

const panelLink =
  document.getElementById(
    "panelLink"
  );


function openPanel(data) {

  if (panelTitle)
    panelTitle.textContent =
      data.title;

  if (panelTag)
    panelTag.textContent =
      data.tag;

  if (panelBody)
    panelBody.textContent =
      data.body;


  if (panelLink) {

    if (data.link) {

      panelLink.href =
        data.link;

      panelLink.style.display =
        "inline-block";

      panelLink.textContent =
        "OPEN LINK →";

    } else {

      panelLink.style.display =
        "none";

    }

  }


  if (panel)
    panel.classList.remove(
      "hidden"
    );

}


// CLOSE PANEL

document
  .getElementById(
    "closePanel"
  )
  ?.addEventListener(
    "click",
    function () {

      panel.classList.add(
        "hidden"
      );

    }
  );


// =====================================================
// STATION SELECTION
// =====================================================

const raycaster =
  new THREE.Raycaster();

const mouse =
  new THREE.Vector2();


window.addEventListener(
  "click",
  function (event) {

    // Don't open a station
    // when user was dragging camera

    if (dragDistance > 8)
      return;


    if (
      event.target.closest(
        "#panel"
      )
    )
      return;

    if (
      event.target.closest(
        "#menu"
      )
    )
      return;

    if (
      event.target.closest(
        "#menuBtn"
      )
    )
      return;


    mouse.x =
      (event.clientX /
        window.innerWidth) *
        2 -
      1;

    mouse.y =
      -(event.clientY /
        window.innerHeight) *
        2 +
      1;


    raycaster.setFromCamera(
      mouse,
      camera
    );


    const objects = [];


    stations.forEach(
      station => {

        station.traverse(
          object => {

            if (
              object.isMesh
            ) {

              objects.push(
                object
              );

            }

          }
        );

      }
    );


    const hits =
      raycaster.intersectObjects(
        objects,
        false
      );


    if (!hits.length)
      return;


    let object =
      hits[0].object;


    while (
      object.parent &&
      !object.userData.title
    ) {

      object =
        object.parent;

    }


    if (
      object.userData.title
    ) {

      openPanel(
        object.userData
      );

    }

  }
);


// =====================================================
// MENU
// =====================================================

const menu =
  document.getElementById(
    "menu"
  );


document
  .getElementById(
    "menuBtn"
  )
  ?.addEventListener(
    "click",
    function () {

      menu.classList.remove(
        "hidden"
      );

    }
  );


document
  .getElementById(
    "closeMenu"
  )
  ?.addEventListener(
    "click",
    function () {

      menu.classList.add(
        "hidden"
      );

    }
  );


document
  .querySelectorAll(
    ".menu-item"
  )
  .forEach(item => {

    item.addEventListener(
      "click",
      function () {

        const index =
          Number(
            item.dataset.index
          );

        const data =
          stationData[index];

        if (!data)
          return;


        car.position.set(
          data.position[0],
          0,
          data.position[2] + 7
        );


        menu.classList.add(
          "hidden"
        );

      }
    );

  });


// =====================================================
// GAME LOOP
// =====================================================

let speed = 0;

const clock =
  new THREE.Clock();


function animate() {

  requestAnimationFrame(
    animate
  );


  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );


  // ACCELERATION

  const moving =
    keys["w"] ||
    keys["arrowup"] ||
    keys["s"] ||
    keys["arrowdown"];


  if (moving) {

    speed +=
      18 * delta;

  } else {

    speed *=
      0.92;

  }


  speed =
    THREE.MathUtils.clamp(
      speed,
      0,
      28
    );


  // FORWARD

  if (
    keys["w"] ||
    keys["arrowup"]
  ) {

    car.translateZ(
      -speed * delta
    );

  }


  // BACKWARD

  if (
    keys["s"] ||
    keys["arrowdown"]
  ) {

    car.translateZ(
      speed * delta
    );

  }


  // STEERING

  const steering =
    1.8 * delta;


  if (
    keys["a"] ||
    keys["arrowleft"]
  ) {

    car.rotation.y +=
      steering;

  }


  if (
    keys["d"] ||
    keys["arrowright"]
  ) {

    car.rotation.y -=
      steering;

  }


  // ===================================================
  // CAMERA
  // ===================================================

  const cameraOffset =
    new THREE.Vector3(
      Math.sin(cameraAngle) *
        cameraDistance,

      cameraHeight,

      Math.cos(cameraAngle) *
        cameraDistance
    );


  const desiredCamera =
    car.position
      .clone()
      .add(cameraOffset);


  const cameraTarget =
    car.position.clone();


  cameraTarget.y +=
    1.3;


  camera.position.lerp(
    desiredCamera,
    0.08
  );


  camera.lookAt(
    cameraTarget
  );


  // ===================================================
  // SPEED DISPLAY
  // ===================================================

  const speedValue =
    document.getElementById(
      "speedValue"
    );


  if (speedValue) {

    speedValue.textContent =
      Math.round(
        speed * 4
      ) +
      " KM/H";

  }


  renderer.render(
    scene,
    camera
  );

}


animate();


// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
  "resize",
  function () {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);


// =====================================================
// LOADING SCREEN
// =====================================================

function hideLoading() {

  const loading =
    document.getElementById(
      "loading"
    );

  if (loading) {

    loading.classList.add(
      "hide"
    );

  }

}

setTimeout(
  hideLoading,
  1500
);
