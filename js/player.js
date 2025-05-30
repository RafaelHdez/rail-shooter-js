import * as THREE from 'three'

export class Player {
    constructor(scene) {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32)
        const material = new THREE.MeshStandardMaterial({
            color: 0x3498db, // Azul
            metalness: 0.5,
            roughness: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material)
        scene.add(this.mesh)

        // Velocidad inicial en X e Y
        this.velocity = new THREE.Vector2(0, 0)
    }

    update(keys) {
        const acceleration = 0.02
        const maxSpeed = 0.1
        const damping = 0.92 // Cuánto se "frena" naturalmente

        let input = new THREE.Vector2(0, 0)

        if (keys['KeyW']) input.y += 1
        if (keys['KeyS']) input.y -= 1
        if (keys['KeyA']) input.x -= 1
        if (keys['KeyD']) input.x += 1

        // Normaliza el input para evitar diagonales más rápidas
        if (input.length() > 0) input.normalize()

        // Aplica aceleración
        this.velocity.add(input.multiplyScalar(acceleration))

        // Limita la velocidad máxima
        this.velocity.clampLength(0, maxSpeed)

        // Aplica movimiento
        this.mesh.position.x += this.velocity.x
        this.mesh.position.y += this.velocity.y

        // Aplica frenado natural
        this.velocity.multiplyScalar(damping)
    }
}
