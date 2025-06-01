import * as THREE from 'three';

export class Explosion {
    constructor(position, scene, color = 0xff3333) {
        this.scene = scene;
        this.particles = [];
        this.lifetime = 1.0; // Lifetime in seconds
        this.age = 0;
        
        // Create particle system
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            // Create a small glowing sphere for each particle
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Set initial position at the explosion center
            particle.position.copy(position);
            
            // Random velocity in all directions
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            );
            
            particle.userData.velocity = velocity;
            particle.userData.initialScale = 1.0;
            
            this.particles.push(particle);
            this.scene.add(particle);
        }
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        
        if (this.age >= this.lifetime) {
            this.remove();
            return false; // Explosion is complete
        }
        
        // Calculate progress (0 to 1)
        const progress = this.age / this.lifetime;
        
        // Update each particle
        for (const particle of this.particles) {
            // Move particle according to its velocity
            particle.position.x += particle.userData.velocity.x * deltaTime;
            particle.position.y += particle.userData.velocity.y * deltaTime;
            particle.position.z += particle.userData.velocity.z * deltaTime;
            
            // Fade out and scale down as explosion progresses
            particle.material.opacity = 1 - progress;
            
            // Scale effect - first expand, then contract
            let scale;
            if (progress < 0.3) {
                // Expand
                scale = particle.userData.initialScale * (1 + progress * 3);
            } else {
                // Contract
                scale = particle.userData.initialScale * (1 + 0.9 - progress);
            }
            
            particle.scale.set(scale, scale, scale);
        }
        
        return true; // Explosion is still active
    }
    
    remove() {
        // Remove all particles from the scene
        for (const particle of this.particles) {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        }
        
        this.particles = [];
    }
}