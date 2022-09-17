import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterController } from "./characterController";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as CANNON from "cannon-es";

const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

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
  map: new THREE.TextureLoader().load(
    "../character-controller-example/textures/sand.jpg"
  ),
  side: THREE.DoubleSide,
});

const box = new THREE.BoxGeometry(5, 5, 5);
const boxMat = new THREE.LineBasicMaterial({ color: 0xffffff });
const boxMesh = new THREE.Mesh(box, boxMat);

const boxBody = new CANNON.Body({
  //shape: new CANNON.Plane(),
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(2.5, 2.5, 2.5)),
});
boxBody.position.set(10, 5, 10);
world.addBody(boxBody);
scene.add(boxMesh);
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

const loader = new GLTFLoader();
const axisHelper = new THREE.AxesHelper(9);
scene.add(axisHelper);
const gui = new GUI();

const physics = {
  togglePhysics: true,
};

const PhysicsFolder = gui.addFolder("Physics");
PhysicsFolder.add(physics, "togglePhysics")
  .listen()
  .onChange((value) => {
    value ? world.addBody(hitBody) : world.removeBody(hitBody);
  });

PhysicsFolder.open();

var characterController;
let hitBody;
let model;
const hitboxPhyMat = new CANNON.Material();
loader.load(
  "../character-controller-example/model/Robot.glb",
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
      material: hitboxPhyMat,
    });
    world.addBody(hitBody);
    hitBody.linearDamping = 0.01;

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
  // Position
  boxBody.position.setZero();
  boxBody.previousPosition.setZero();
  boxBody.interpolatedPosition.setZero();
  boxBody.initPosition.setZero();

  // orientation
  boxBody.quaternion.set(0, 0, 0, 1);
  boxBody.initQuaternion.set(0, 0, 0, 1);
  boxBody.previousQuaternion.set(0, 0, 0, 1);
  boxBody.interpolatedQuaternion.set(0, 0, 0, 1);

  // Velocity
  boxBody.velocity.setZero();
  boxBody.initVelocity.setZero();
  boxBody.angularVelocity.setZero();
  boxBody.initAngularVelocity.setZero();

  // Force
  boxBody.force.setZero();
  boxBody.torque.setZero();

  // Sleep state reset
  boxBody.sleepState = 0;
  boxBody.timeLastSleepy = 0;
  boxBody._wakeUpAfterNarrowphase = false;
  boxBody.position.set(10, 5, 10);
  // Position
  hitBody.position.setZero();
  hitBody.previousPosition.setZero();
  hitBody.interpolatedPosition.setZero();
  hitBody.initPosition.setZero();

  // orientation
  hitBody.quaternion.set(0, 0, 0, 1);
  hitBody.initQuaternion.set(0, 0, 0, 1);
  hitBody.previousQuaternion.set(0, 0, 0, 1);
  hitBody.interpolatedQuaternion.set(0, 0, 0, 1);

  // Velocity
  hitBody.velocity.setZero();
  hitBody.initVelocity.setZero();
  hitBody.angularVelocity.setZero();
  hitBody.initAngularVelocity.setZero();

  // Force
  hitBody.force.setZero();
  hitBody.torque.setZero();

  // Sleep state reset
  hitBody.sleepState = 0;
  hitBody.timeLastSleepy = 0;
  hitBody._wakeUpAfterNarrowphase = false;
  hitBody.position.set(1, 20, 1);
  characterController.updateCameraTarget(
    hitBody.position.x,
    hitBody.position.y
  );
}

var mat1_ground = new CANNON.ContactMaterial(groundPhysMat, hitboxPhyMat, {
  friction: 10,
  restitution: 0,
});
world.addContactMaterial(mat1_ground);
function animate() {
  let delta = clock.getDelta();
  if (characterController) {
    characterController.update(delta, keysPressed);
  }
  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);
  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);
  if (model) {
    if (hitBody.position.y < -20 || hitBody.position.y > 20) {
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

  render();
  requestAnimationFrame(animate);
}

function render() {
  renderer.render(scene, camera);
}

animate();
