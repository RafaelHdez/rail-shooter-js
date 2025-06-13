import * as THREE from 'three'
import {GLTFLoader} from "three/addons";

export class Player {
    constructor(scene) {
        this.mesh = new THREE.Group();
        this.velocity = new THREE.Vector2(0, 0);
        scene.add(this.mesh);

        // Cargar el modelo GLB
        const loader = new GLTFLoader();
        loader.load('/models/Nave.glb', (gltf) => {
            console.log('Modelo cargado:', gltf);
            const model = gltf.scene;
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(0, 0, 0);
            this.mesh.add(model);
        }, undefined, (error) => {
            console.error('Error cargando nave:', error);
        });
    }

    update(keys) {
        const acceleration = 0.02;
        const maxSpeed = 0.1;
        const damping = 0.92;

        let input = new THREE.Vector2(0, 0);

        if (keys['KeyW']) input.y += 1;
        if (keys['KeyS']) input.y -= 1;
        if (keys['KeyA']) input.x -= 1;
        if (keys['KeyD']) input.x += 1;

        if (input.length() > 0) input.normalize();

        this.velocity.add(input.multiplyScalar(acceleration));
        this.velocity.clampLength(0, maxSpeed);

        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;

        this.velocity.multiplyScalar(damping);
    }
}
