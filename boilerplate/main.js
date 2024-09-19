import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as KIRBY from "./kirby.js";

const map_limits = 50
const kirby_amount = 30

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 
  75,
  window.innerWidth / window.innerHeight,
  0.2,
  1000
);
camera.position.y += 1

const clock = new THREE.Clock()

const light = new THREE.DirectionalLight(0x404040, 20);
const ambientLight = new THREE.AmbientLight(0x404040, 10);
light.position.y = 100;

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

const flatWorld = await loader.loadAsync("./minecraft_flat_world/scene.gltf");
flatWorld.scene.scale.set(10, 10, 10);
scene.add(flatWorld.scene)
flatWorld.scene.position.y = -21

const skyboxLoader = new THREE.TextureLoader();
const skyboxtexture = await skyboxLoader.loadAsync("./free_-_skybox_blue_desert/textures/Scene_-_Root_diffuse.jpeg");
skyboxtexture.mapping = THREE.EquirectangularReflectionMapping;
skyboxtexture.colorSpace = THREE.SRGBColorSpace;
skyboxtexture.flipY = false;

scene.background = skyboxtexture;


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
const kirbyFalling = new THREE.Audio( listener );
const kirbyTheme = new THREE.Audio( listener );

const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'assets/shotgun.mp3', function( buffer ) {
	shotgunSound.setBuffer( buffer );
	shotgunSound.setLoop( false );
	shotgunSound.setVolume( 0.5 );
});
audioLoader.load( 'assets/kirby-falling.mp3', function( buffer ) {
	kirbyFalling.setBuffer( buffer );
	kirbyFalling.setLoop( false );
	kirbyFalling.setVolume( 0.3 );
});
audioLoader.load( 'assets/kirbytheme.mp3', function( buffer ) {
	kirbyTheme.setBuffer( buffer );
	kirbyTheme.setLoop( true );
	kirbyTheme.setVolume( 0.1 );
  kirbyTheme.play()
});


let shooting = false
document.addEventListener( 'pointerdown', onPointerDown );

function onPointerDown() {  
  if (shooting === false) {
    shotgunidle.stop()
    shotgunshoot.play()
    shotgunSound.play();
    shooting = true

    pointer.set( 0, 0 );  

    raycaster.setFromCamera( pointer, camera );
  
    const intersects = raycaster.intersectObjects( kirbyList.map((kirby) => kirby.gltfScene), true );

    if(intersects.length != 0) {
      kirbyFalling.play()
      let closestKirby = intersects[0]
      if (closestKirby.distance <= 10) {
        closestKirby = closestKirby.object
        while (closestKirby.name != "Sketchfab_Scene") {          
          closestKirby = closestKirby.parent
        }        
        
        scene.remove(closestKirby)
        for (let index = 0; index < kirbyList.length; index++) {
          if (kirbyList[index].gltfScene.uuid === closestKirby.uuid) {
            kirbyList[index].kirbySound = null
            kirbyList.splice(index, 1)
          }
        }   
      }
    }
    setTimeout(() => {
      shotgunshoot.stop()
      shotgunidle.play()
      shooting = false
    }, 983.3333492279053)
  }

  
}

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
  kirby.createKirby([Math.floor((Math.random() * map_limits) - map_limits/2), Math.floor((Math.random() * map_limits) - map_limits/2)]);
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

  //Kirbies updater
  for (let index = 0; index < kirbyList.length; index++) {
    kirbyList[index].mixer.update(delta)
    kirbyList[index].kirbyUpdate()
  }
  mixer.update(delta)

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);