import * as THREE from 'three';

export class Laser {
    constructor(origin, target) {
        const color = new THREE.Color("green");
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00, // Verde
            emissive: 0x00ff00, // Brillo verde (como si fuera un láser)
            emissiveIntensity: 10,
            metalness: 0.3,
            roughness: 0.2
        });

        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.copy(origin.clone());

        const direction = new THREE.Vector3().subVectors(target, origin).normalize();

        const axis = new THREE.Vector3(0, 1, 0); // Eje original del cilindro
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        this.mesh.quaternion.copy(quaternion);

        this.direction = direction;
    }

    update() {
        this.mesh.position.add(this.direction.clone().multiplyScalar(1)); // Velocidad del láser
    }
}
