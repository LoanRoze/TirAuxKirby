import * as THREE from "three";
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const audioLoader = new THREE.AudioLoader();
const audioBuffer = await audioLoader.loadAsync( 'assets/kirbyhi.mp3' );

export class Kirby {
    constructor(gltf, scene, light, listener, audioLoader) {
        this.scene = scene;
        this.light = light

        this.gltfScene = SkeletonUtils.clone(gltf.scene);
        this.gltfScene.scale.set(0.005, 0.005, 0.005);
        this.gltfScene.rotation.y += Math.floor(Math.random() * 6, 2831);

        this.mixer = new THREE.AnimationMixer(this.gltfScene);
        this.running = false;
        this.walking = false;

        this.runClip = THREE.AnimationClip.findByName(gltf.animations, "Kirb_Skeleton|Run_Animation");
        this.idleClip = THREE.AnimationClip.findByName(gltf.animations, "Kirb_Skeleton|Idle_Animation");
        this.walkClip = THREE.AnimationClip.findByName(gltf.animations, "Kirb_Skeleton|Walk_Animation");
        this.run = this.mixer.clipAction(this.runClip);
        this.idle = this.mixer.clipAction(this.idleClip);
        this.walk = this.mixer.clipAction(this.walkClip);

        this.animations = [this.run, this.idle, this.walk];
        this.currentAnimation = 0;
        this.vector = new THREE.Vector3();

        this.randomSpin = 0.01

        
        this.kirbySound = new THREE.Audio( listener );
        this.kirbySound.setBuffer( audioBuffer );
        this.kirbySound.setLoop( false );
        this.kirbySound.setVolume( 0.2 );
    
    }

    createKirby(position) {
        this.scene.add(this.gltfScene);
        this.light.target = this.gltfScene;
        this.gltfScene.position.x = position[0];
        this.gltfScene.position.z = position[1];
        this.gltfScene.position.y = -0.45;




    }

    kirbyAnimation(animationId) {
        this.running = false
        this.walking = false
        this.randomSpin = [0.01, -0.01][Math.floor(Math.random() * 2)]

        for (let index = 0; index < this.animations.length; index++) {
            const animation = this.animations[index];
            animation.stop()
        }
        this.gltfScene.getWorldDirection(this.vector)
        this.animations[animationId].play()
        this.currentAnimation = animationId;
        if (animationId === 0) {
            this.running = true
        }
        if (animationId === 2) {
            this.walking = true
        }
    }

    kirbyRandom() {
        let newAnimation
        if (this.currentAnimation === 1) {
            newAnimation = [0, 2][Math.floor(Math.random() * 2)]
        }
        else {
            newAnimation = 1
        }
        return newAnimation
    }

    kirbyDeplacement() {
        setTimeout(() => {
            this.kirbyAnimation(this.kirbyRandom());

            this.kirbyDeplacement();
        }, Math.floor((Math.random() * 4000) + 3000))

    }

    kirbyUpdate() {
        this.gltfScene.getWorldDirection(this.vector)

        if ((Math.floor(Math.random() * 1000) === 1) && (this.kirbySound != null)) {
            this.kirbySound.play()
            setTimeout( () => {
                if (this.kirbySound != null) {
                    this.kirbySound.stop()
                }
            }, 1400)
        }
        if (this.running) {
            this.gltfScene.position.x += this.vector.x / 100;
            this.gltfScene.position.z += this.vector.z / 100;
        }
        else if (this.walking) {
            this.gltfScene.position.x += this.vector.x / 200;
            this.gltfScene.position.z += this.vector.z / 200;
        }
        else {
            this.gltfScene.rotation.y += this.randomSpin
        }
    }

}