import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as KIRBY from "./kirby.js";

const map_limits = 25
const kirby_amount = 10

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.2,
  1000
);

const clock = new THREE.Clock()

const light = new THREE.DirectionalLight(0x404040, 20);
const ambientLight = new THREE.AmbientLight(0x404040, 10);
light.position.z = 100;

const listener = new THREE.AudioListener();
camera.add( listener );

scene.add(light);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let loader = new GLTFLoader();
const gltf = await loader.loadAsync("./kirby_animated_3_animations/scene.gltf");
gltf.scene.scale.set(0.001, 0.001, 0.001);

let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();

const shotgun = await loader.loadAsync("./fps_arms_remington_shotgun/scene.gltf");

const playerGroup = new THREE.Group();
playerGroup.add(camera);
playerGroup.add(shotgun.scene);
scene.add(playerGroup);

shotgun.scene.position.set(0, -0.4, -0.2)
shotgun.scene.rotation.set(0, Math.PI, 0)

camera.add(shotgun.scene);

//Shotgun animations
let mixer = new THREE.AnimationMixer(shotgun.scene);
let shotgunidleClip = THREE.AnimationClip.findByName(shotgun.animations, "Armature|SG_FPS_Idle");
let shotgunshootClip = THREE.AnimationClip.findByName(shotgun.animations, "Armature|SG_FPS_Shot");
let shotgunidle = mixer.clipAction(shotgunidleClip);
let shotgunshoot = mixer.clipAction(shotgunshootClip)
shotgunidle.play()

const shotgunSound = new THREE.Audio( listener );

const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'shotgun.mp3', function( buffer ) {
	shotgunSound.setBuffer( buffer );
	shotgunSound.setLoop( true );
	shotgunSound.setVolume( 0.5 );
});

let shooting = false
document.addEventListener( 'pointerdown', onPointerDown );



function onPointerDown( event ) {  
  if (shooting === false) {
    shotgunidle.stop()
    shotgunshoot.play()
    shotgunSound.play();
    shooting = true

    pointer.set( 0, 0 );  

    raycaster.setFromCamera( pointer, camera );
  
    const intersects = raycaster.intersectObjects( kirbyList.map((kirby) => kirby.gltfScene), true );
    console.log(intersects.length != 0);
    if(intersects.length != 0) {
      let closestKirby = intersects[0]
      if (closestKirby.distance >= 10) {
        console.log("kirby trop loin");
      }
      else {
        closestKirby = closestKirby.object
        while (closestKirby.name != "Sketchfab_Scene") {
          console.log(closestKirby);
          
          closestKirby = closestKirby.parent
        }
        scene.remove(closestKirby)
      }
    }

    setTimeout(() => {
      shotgunshoot.stop()
      shotgunidle.play()
      shotgunSound.stop();
      shooting = false
    }, 983.3333492279053)
  }

  
}


camera.position.z = 0;
renderer.render(scene, camera);


const geometry = new THREE.PlaneGeometry(map_limits, map_limits);
const material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x += 1.5708;
plane.position.y -= 1;
scene.add(plane);


//Handle Player Deplacement
const controls = new PointerLockControls(camera, document.body);
document.addEventListener("click", () => {
  controls.lock();
});


let moveForwards = false;
let moveBackwards = false;
let moveLeft = false;
let moveRight = false;

document.addEventListener("keydown", (e) => {
  switch (e.code) {
    case "KeyW": {
      moveForwards = true;
      break;
    };
    case "KeyS": {
      moveBackwards = true;
      break;
    }
    case "KeyA": {
      moveLeft = true;
      break;
    }
    case "KeyD": {
      moveRight = true;
      break;
    }
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.code) {
    case "KeyW": {
      moveForwards = false;
      break;
    };
    case "KeyS": {
      moveBackwards = false;
      break;
    }
    case "KeyA": {
      moveLeft = false;
      break;
    }
    case "KeyD": {
      moveRight = false;
      break;
    }
  }
});

//Kirbies creation
let kirbyList = [];
for (let index = 0; index < kirby_amount; index++) {
  let kirby = new KIRBY.Kirby(gltf, scene, light, listener, audioLoader);
  kirby.createKirby([Math.floor((Math.random() * 20) - 10), Math.floor((Math.random() * 20) - 10)]);
  kirby.kirbyAnimation(0);
  kirby.kirbyDeplacement();
  kirbyList.push(kirby);
}

function animate() {
  let delta = clock.getDelta()

  //Players Movements
  if (moveForwards) {
    controls.moveForward(0.1);
  }
  if (moveBackwards) {
    controls.moveForward(-0.1);
  }
  if (moveLeft) {
    controls.moveRight(-0.1);
  }
  if (moveRight) {
    controls.moveRight(0.1);
  }

  //Kirbies handler
  for (let index = 0; index < kirbyList.length; index++) {
    kirbyList[index].mixer.update(delta)
    kirbyList[index].kirbyUpdate()
  }
  mixer.update(delta)

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);