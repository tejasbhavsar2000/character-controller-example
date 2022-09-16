import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { A, D, DIRECTIONS, S, W } from "./basicKeys";

export class CharacterController {
  model;
  mixer;
  animationsMap = new Map(); // Walk, Run, Idle
  orbitControl;
  camera;
  // state
  toggleRun = true;
  currentAction;
  hitBody;

  // temporary data
  walkDirection = new THREE.Vector3();
  rotateAngle = new THREE.Vector3(0, 1, 0);
  rotateQuarternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  // constants
  fadeDuration = 0.2;
  maxRunningVelocity = 10;
  maxWalkingVelocity = 5;
  accTime = 200;
  deaccTime = 50;

  accelRatePerSecForWalking;
  accelRatePerSecForRunning;
  deaccelRatePerSecForWalking;
  deaccelRatePerSecForRunning;
  velocity = 0;

  constructor(
    model,
    mixer,
    animationsMap,
    orbitControl,
    camera,
    currentAction,
    hitBody
    //startPosition
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animationsMap = animationsMap;
    this.currentAction = currentAction;
    this.animationsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play();
      }
    });

    this.accelRatePerSecForWalking = this.maxWalkingVelocity / this.accTime;
    this.accelRatePerSecForRunning = this.maxRunningVelocity / this.accTime;
    this.deaccelRatePerSecForWalking =
      -this.maxWalkingVelocity / this.deaccTime;
    this.deaccelRatePerSecForRunning =
      -this.maxRunningVelocity / this.deaccTime;
    this.orbitControl = orbitControl;
    this.camera = camera;
    this.hitBody = hitBody;
    this.updateCameraTarget(0, 0);
  }

  switchRunToggle() {
    this.toggleRun = !this.toggleRun;
  }

  calculateAcceleration() {
    if (this.currentAction == "Running") {
      this.velocity += this.accelRatePerSecForRunning;
      this.velocity = Math.min(this.maxRunningVelocity, this.velocity);
    } else if (this.currentAction == "Walking") {
      this.velocity += this.accelRatePerSecForWalking;
      this.velocity = Math.min(this.maxWalkingVelocity, this.velocity);
    }
  }
  calculateDeacceleration() {
    if (this.currentAction == "Idle") {
      this.velocity += this.deaccelRatePerSecForRunning;
      this.velocity = Math.max(0, this.velocity);
    } else if (this.currentAction == "Idle") {
      this.velocity += this.deaccelRatePerSecForWalking;
      this.velocity = Math.max(0, this.velocity);
    }
  }

  update(delta, keysPressed) {
    const directionPressed = DIRECTIONS.some((key) => keysPressed[key] == true);

    var play = "";
    if (directionPressed && this.toggleRun) {
      play = "Running";
    } else if (directionPressed) {
      play = "Walking";
    } else {
      play = "Idle";
    }

    if (this.currentAction != play) {
      const toPlay = this.animationsMap.get(play);
      const current = this.animationsMap.get(this.currentAction);

      current.fadeOut(this.fadeDuration);
      toPlay.reset().fadeIn(this.fadeDuration).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);

    if (this.currentAction == "Running" || this.currentAction == "Walking") {
      // calculate towards camera direction
      var angleYCameraDirection = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z
      );
      // diagonal movement angle offset
      var directionOffset = this.directionOffset(keysPressed);

      // rotate model
      this.rotateQuarternion.setFromAxisAngle(
        this.rotateAngle,
        angleYCameraDirection + directionOffset
      );
      this.model.quaternion.slerp(this.rotateQuarternion, 0.05);
      //this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);

      // calculate direction
      this.camera.getWorldDirection(this.walkDirection);
      this.walkDirection.y = 0;
      this.walkDirection.normalize();
      this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);
      // run/walk velocity\
      console.log(this.currentAction);
      this.calculateAcceleration();

      console.log(this.velocity);

      const moveX = this.walkDirection.x * this.velocity * delta;
      const moveZ = this.walkDirection.z * this.velocity * delta;
      this.hitBody.position.x += moveX;
      this.hitBody.position.z += moveZ;
      this.updateCameraTarget(moveX, moveZ);
    } else if (this.currentAction == "Idle" && this.velocity > 0) {
      this.calculateDeacceleration();
      const moveX = this.walkDirection.x * this.velocity * delta;
      const moveZ = this.walkDirection.z * this.velocity * delta;
      this.hitBody.position.x += moveX;
      this.hitBody.position.z += moveZ;
      this.updateCameraTarget(moveX, moveZ);
    }
  }

  updateCameraTarget(moveX, moveZ) {
    // move camera
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;

    // update camera target
    this.cameraTarget.x = this.model.position.x;
    this.cameraTarget.y = this.model.position.y + 1;
    this.cameraTarget.z = this.model.position.z;
    this.orbitControl.target = this.cameraTarget;
  }

  directionOffset(keysPressed) {
    var directionOffset = 0; // w

    if (keysPressed[W]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4; // w+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4; // w+d
      }
    } else if (keysPressed[S]) {
      if (keysPressed[A]) {
        directionOffset = Math.PI / 4 + Math.PI / 2; // s+a
      } else if (keysPressed[D]) {
        directionOffset = -Math.PI / 4 - Math.PI / 2; // s+d
      } else {
        directionOffset = Math.PI; // s
      }
    } else if (keysPressed[A]) {
      directionOffset = Math.PI / 2; // a
    } else if (keysPressed[D]) {
      directionOffset = -Math.PI / 2; // d
    }

    return directionOffset;
  }
}
