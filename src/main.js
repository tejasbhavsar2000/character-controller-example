import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterController } from "./lib/characterController";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger';
import { createBox } from "./lib/builder";

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
camera.position.set(0, 300, 800);

const renderer = new THREE.WebGLRenderer({antialias: true});

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(0, 20, 10);
scene.add(dirLight);

const groundPhysMat = new CANNON.Material();
const groundBody = new CANNON.Body({
  //shape: new CANNON.Plane(),
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(50, 50, 0.1)),
  type: CANNON.Body.STATIC,
  material: groundPhysMat,
});
world.addBody(groundBody);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

const groundGeo = new THREE.BoxGeometry(100, 100);
var groundTexture = new THREE.TextureLoader().load("../character-controller-example/textures/stone_floor2.jpg" );
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(10,10)

groundTexture.anisotropy = 16;
groundTexture.encoding = THREE.sRGBEncoding;
const groundMat = new THREE.MeshPhongMaterial({
  depthWrite: false ,
  color: 0x8c8c80,
  map: groundTexture,

});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow=true;
scene.add(groundMesh);




const box1 = createBox(5,{x: 10, y : 5,z: 10});
const box2 = createBox(5,{x: 10, y : 5,z: -10})
const box3 = createBox(5,{x: -10, y : 5,z: 10})
const box4 = createBox(5,{x: -10, y : 5,z: -10})
const boxArray = [box1,box2,box3,box4]

boxArray.forEach((box)=>{
  world.addBody(box.body)
  scene.add(box.mesh);
})



//var characterControls = new CharacterController();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 15;
controls.maxDistance = 15;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.update();
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();

const gui = new GUI();

const gameplay = {
  Reset: function(){ reset() },
};

const GamplayFolder = gui.addFolder("gameplay");
GamplayFolder.add(gameplay, "Reset");

GamplayFolder.open();

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
      mass:30,
      shape: new CANNON.Box(new CANNON.Vec3(1.5, 2.2, 1)),
      
      position: new CANNON.Vec3(0, 3, 0),
      material: hitboxPhyMat,
      
    });
    world.addBody(hitBody);
     hitBody.linearDamping = 0.01;

   
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
    const key = event.key.toLowerCase();
    if(key == 'w' || key == 'a' || key == 's' || key == 'd' ){
      const svgborder = document.getElementById(`${key}-b`);
      const svgtext = document.getElementById(`${key}-t`);
      svgborder.classList.add('press-border');
      svgtext.classList.add('press-text');
    } 

    if (event.shiftKey && characterController) {
      characterController.switchRunToggle();
    }
    
     else {
      keysPressed[key] = true;
      
    }
  },
  false
);
document.addEventListener(
  "keyup",
  (event) => {
    const key = event.key.toLowerCase()
    if(key == 'w' || key == 'a' || key == 's' || key == 'd' ){
      const svgborder = document.getElementById(`${key}-b`);
      const svgtext = document.getElementById(`${key}-t`);
      svgborder.classList.remove('press-border');
      svgtext.classList.remove('press-text');
    } 
    keysPressed[key] = false;
    characterController.calculateDeacceleration();
  },
  false
);

const mat1_ground = new CANNON.ContactMaterial(groundPhysMat, hitboxPhyMat, {

  friction: 1000,
  restitution: 0,
});
world.addContactMaterial(mat1_ground);


















// World Reset

function reset() {
  boxArray.forEach((box) =>{
    box.body.position.setZero();
    box.body.previousPosition.setZero();
    box.body.interpolatedPosition.setZero();
    box.body.initPosition.setZero();

    // orientation
    box.body.quaternion.set(0, 0, 0, 1);
    box.body.initQuaternion.set(0, 0, 0, 1);
    box.body.previousQuaternion.set(0, 0, 0, 1);
    box.body.interpolatedQuaternion.set(0, 0, 0, 1);

    // Velocity
    box.body.velocity.setZero();
    box.body.initVelocity.setZero();
    box.body.angularVelocity.setZero();
    box.body.initAngularVelocity.setZero();

    // Force
    box.body.force.setZero();
    box.body.torque.setZero();

    // Sleep state reset
    box.body.sleepState = 0;
    box.body.timeLastSleepy = 0;
    box.body._wakeUpAfterNarrowphase = false;
    box.body.position.set(box.pos['x'], box.pos['y'], box.pos['z']);
  })
  // Position
  
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
  hitBody.position.set(1, 5, 1);
  characterController.updateCameraTarget(
    hitBody.position.x,
    hitBody.position.y
  );
}





const cannonDebugger = new CannonDebugger(scene, world, {
  // options...
})
let delta = 0;
function animate() {
  delta = Math.min(clock.getDelta(), 0.1)
  if (characterController) {
    characterController.update(delta, keysPressed);
  }
  boxArray.forEach((value)=>{
    value.mesh.position.copy(value.body.position);
    value.mesh.quaternion.copy(value.body.quaternion);
  })
  
  groundMesh.position.copy(groundBody.position);
  groundMesh.quaternion.copy(groundBody.quaternion);
  if (model) {
    if (hitBody.position.y < -20 || hitBody.position.y > 20) {
      
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
 world.step(delta);
 
  //cannonDebugger.update()
  controls.update();

  render();
  
   requestAnimationFrame(animate);
}

function render() {
  renderer.render(scene, camera);
}

animate();
