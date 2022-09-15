import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterController } from "./characterController";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as CANNON from "cannon-es";
import * as OIMO from "oimo";
import { threeToCannon, ShapeType } from "three-to-cannon";
import CannonDebugger from "cannon-es-debugger";
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
console.log(OIMO.BODY_GHOST);
const width = window.innerWidth;
const height = window.innerHeight;
var scene = new THREE.Scene();
var clock = new THREE.Clock();
var mixer;
scene.background = new THREE.Color(0xe0e0e0);
scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);
scene.background = new THREE.Color("#808080");
const fov = (180 * (2 * Math.atan(innerHeight / 2 / 800))) / Math.PI;
var camera = new THREE.PerspectiveCamera(
  fov,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
camera.position.set(0, 0, 800);

var renderer = new THREE.WebGLRenderer({ antialias: true });

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(0, 20, 10);
scene.add(dirLight);
const planeBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(50, 50, 0)),
});
planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(planeBody);
const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshPhongMaterial({
    color: 0x999999,
    depthWrite: false,
    map: new THREE.TextureLoader().load("../textures/sand.jpg"),
  })
);
mesh.rotation.x = -Math.PI / 2;
mesh.receiveShadow = true;

scene.add(mesh);
//var characterControls = new CharacterController();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 15;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.update();
document.body.appendChild(renderer.domElement);
const cannonDebugger = new CannonDebugger(scene, world);
const loader = new GLTFLoader();
const axisHelper = new THREE.AxesHelper(9);
scene.add(axisHelper);
var characterController;

loader.load(
  "../model/Robot.glb",
  function (gltf) {
    const model = gltf.scene;

    model.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
      }
    });

    const hitBody = new CANNON.Body({
      type: CANNON.Body.DYNAMIC,
      shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
      //position: new CANNON.Vec3(new CANNON.Vec3(center)),
    });
    world.addBody(hitBody);

    scene.add(model);
    gltf.scene.updateMatrixWorld(true);
    const gltfAnimations = gltf.animations;
    mixer = new THREE.AnimationMixer(model);
    const animationsMap = new Map();

    gltfAnimations
      .filter((a) => a.name != "TPose")
      .forEach((a) => {
        animationsMap.set(a.name, mixer.clipAction(a));
      });

    characterController = new CharacterController(
      model,
      mixer,
      animationsMap,
      controls,
      camera,
      "Idle"
    );
  },
  undefined,
  function (e) {
    console.error(e);
  }
);
var keysPressed = {};
document.addEventListener(
  "keydown",
  (event) => {
    if (event.shiftKey && characterController) {
      characterController.switchRunToggle();
    } else {
      keysPressed[event.key.toLowerCase()] = true;
    }
  },
  false
);
document.addEventListener(
  "keyup",
  (event) => {
    keysPressed[event.key.toLowerCase()] = false;
    characterController.calculateDeacceleration();
  },
  false
);

function animate() {
  let delta = clock.getDelta();
  if (characterController) {
    characterController.update(delta, keysPressed);
  }
  world.step(delta);
  controls.update();
  cannonDebugger.update();
  render();
  requestAnimationFrame(animate);
}

function render() {
  renderer.render(scene, camera);
}

animate();
