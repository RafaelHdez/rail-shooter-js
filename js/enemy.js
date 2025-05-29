import * as THREE from 'three';

export class Enemy {
    constructor(target) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);

        const spawnZ = -300 - Math.random() * 30;
        this.mesh.position.set(
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 16,
            spawnZ
        );

        this.speed = 0.8;
        this.target = target;
    }

    update() {
        this.mesh.position.z += this.speed;

        if (!this.target) return;

        const direction = new THREE.Vector3().subVectors(this.target.position, this.mesh.position).normalize();
        this.mesh.position.x += direction.x * 0.5;
        this.mesh.position.y += direction.y * 0.5;
    }
}
