import * as THREE from "three";
import * as CANNON from "cannon-es";
export function createBox(side, {x,y,z}) {
    const box = new THREE.BoxGeometry(side, side, side);
    const boxTexture = new THREE.TextureLoader().load( "../character-controller-example/textures/crate.gif" );
    boxTexture.colorSpace = THREE.SRGBColorSpace;
    const boxMat = new THREE.MeshBasicMaterial({ map: boxTexture });
    const boxMesh = new THREE.Mesh(box, boxMat);
    boxMesh.castShadow= true;
    const boxBody = new CANNON.Body({
      //shape: new CANNON.Plane(),
      mass: 2,

      shape: new CANNON.Box(new CANNON.Vec3(side/2, side/2, side/2)),
    });
    boxBody.position.set(x,y,z);

    return {mesh : boxMesh, body: boxBody, pos : {x,y,z}}
}