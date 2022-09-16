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

const groundPhysMat = new CANNON.Material();

const groundBody = new CANNON.Body({
  //shape: new CANNON.Plane(),
  //mass: 10
  shape: new CANNON.Box(new CANNON.Vec3(50, 50, 0.1)),
  type: CANNON.Body.STATIC,
  material: groundPhysMat,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  map: new THREE.TextureLoader().load("../textures/sand.jpg"),
  side: THREE.DoubleSide,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
scene.add(groundMesh);

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
let hitBody;
let model;
loader.load(
  "../model/Robot.glb",
  function (gltf) {
    model = gltf.scene;

    model.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
      }
    });

    hitBody = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(1.5, 2.2, 1)),
      position: new CANNON.Vec3(0, 3, 0),
      //material: hitboxPhyMat,
    });
    world.addBody(hitBody);
    console.log(model);
    scene.add(model);

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
      "Idle",
      hitBody
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
function reset() {
  hitBody.position.set(1, 20, 1);
}
function animate() {
  let delta = clock.getDelta();
  if (characterController) {
    characterController.update(delta, keysPressed);
  }

  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);
  if (model) {
    if (hitBody.position.y < -20) {
      console.log(hitBody.position.y);
      reset();
    } else {
      model.position.set(
        hitBody.position.x,
        hitBody.position.y - 2.2,
        hitBody.position.z
      );
      hitBody.quaternion.set(
        model.quaternion.x,
        model.quaternion.y,
        model.quaternion.z,
        model.quaternion.w
      );
    }
  }
  if (delta > 0) world.step(delta);
  controls.update();
  cannonDebugger.update();
  render();
  requestAnimationFrame(animate);
}

function render() {
  renderer.render(scene, camera);
}

animate();
