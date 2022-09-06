import * as THREE from "three";
import { GUI } from "dat.gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Perlin from "./perlin";
import { TextureLoader } from "three";

const width = window.innerWidth;
const height = window.innerHeight;
var scene = new THREE.Scene();
scene.background = new THREE.Color("#808080");
var camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
var cameraTarget = { x: 0, y: 0, z: 0 };
camera.position.y = 70;
camera.position.z = 500;
camera.rotation.x = (-15 * Math.PI) / 180;
var renderer = new THREE.WebGLRenderer();

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

var light = new THREE.AmbientLight(0xffffff, 1.3);
light.position
  .set(camera.position.x, camera.position.y + 500, camera.position.z + 500)
  .normalize();
scene.add(light);
const controls = new OrbitControls(camera, renderer.domElement);
var geometry = new THREE.PlaneBufferGeometry(100, 100, 256, 256);
var material = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  map: new THREE.TextureLoader().load("../textures/sand.jpg"),
});
var plain = new THREE.Mesh(geometry, material);
plain.rotation.x = -Math.PI / 2;
scene.add(plain);
const loader = new GLTFLoader();
loader.load(
  "../model/RobotExpressive.glb",
  function (gltf) {
    var model = gltf.scene;
    scene.add(model);
  },
  undefined,
  function (e) {
    console.error(e);
  }
);
var perlin = new Perlin();
plain.peak = 60;
plain.smooth = 500;
console.log(plain);
function refreshVertices() {
  var vertices = plain.geometry.attributes.position.array;
  for (var i = 0; i <= vertices.length; i += 3) {
    vertices[i + 2] =
      plain.peak *
      perlin.noise(
        (plain.position.x + vertices[i]) / plain.smooth,
        (plain.position.z + vertices[i + 1]) / plain.smooth
      );
  }
  plain.geometry.attributes.position.needsUpdate = true;
  plain.geometry.computeVertexNormals();
}

const gui = new GUI();
const plainFolder = gui.addFolder("plain");

plainFolder.add(plain.scale, "x", 0, 10).name("width");
plainFolder.add(plain.scale, "y", 0, 10).name("height");
plainFolder.add(plain, "smooth", 10, 600);
plainFolder.add(plain, "peak", 10, 600);
plainFolder.open();
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(controls, "reset").name("Reset Camera");
cameraFolder.add(camera.position, "z", 0, 100);
cameraFolder.open();

function animate() {
  requestAnimationFrame(animate);
  refreshVertices();
  render();
}
var clock = new THREE.Clock();
var movementSpeed = 0.1;
// function update() {
//   var delta = clock.getDelta();
//   plain.rotation.z += movementSpeed * delta;
//   refreshVertices();
// }

function render() {
  renderer.render(scene, camera);
}

animate();
