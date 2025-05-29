import * as THREE from 'three';

export class Enemy {
    constructor() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6,
            -50
        )
    }

    update() {
        this.mesh.position.z += 0.3;
    }
}