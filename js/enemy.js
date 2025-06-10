import * as THREE from 'three';

export class Enemy {
    constructor(target) {
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff3333, // Rojo vibrante
            emissive: 0xff3333,
            emissiveIntensity: 10,
            metalness: 0.2,
            roughness: 0.7
        });
        this.mesh = new THREE.Mesh(geometry, material);

        const spawnZ = -500 - Math.random() * 30;
        this.mesh.position.set(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 32,
            spawnZ
        );

        this.speed = 1;
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
