import * as THREE from 'three';

export class Laser {
    constructor(position) {
        const verde = new THREE.Color("green"); // Color rojo para el láser
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 32);
        const material = new THREE.MeshBasicMaterial({ color: verde });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.z = -1;
        this.mesh.rotation.x = Math.PI / 2
    }

    update() {
        this.mesh.position.z -= 0.5;
    }
}