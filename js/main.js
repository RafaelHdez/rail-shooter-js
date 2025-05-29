import * as THREE from 'three';

import { Player } from './player.js';
import { Laser } from './laser.js';
import { Enemy } from './enemy.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 10

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl') })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Objetos principales
const player = new Player(scene)
const lasers = []
const enemies = []

// Controles
const keys = {}
window.addEventListener('keydown', e => keys[e.code] = true)
window.addEventListener('keyup', e => keys[e.code] = false)

// Disparo
window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        const laser = new Laser(player.mesh.position)
        scene.add(laser.mesh)
        lasers.push(laser)
    }
})

// Spawn de enemigos
setInterval(() => {
    const enemy = new Enemy()
    scene.add(enemy.mesh)
    enemies.push(enemy)
}, 1500)

function animate() {
    requestAnimationFrame(animate)

    player.update(keys)

    lasers.forEach((laser, i) => {
        laser.update()
        if (laser.mesh.position.z > 50) {
            scene.remove(laser.mesh)
            lasers.splice(i, 1)
        }
    })

    enemies.forEach((enemy, i) => {
        enemy.update()
        if (enemy.mesh.position.z > 10) {
            scene.remove(enemy.mesh)
            enemies.splice(i, 1)
        }
    })

    // Colisiones simples
    lasers.forEach((laser, li) => {
        enemies.forEach((enemy, ei) => {
            if (laser.mesh.position.distanceTo(enemy.mesh.position) < 1) {
                scene.remove(laser.mesh)
                scene.remove(enemy.mesh)
                lasers.splice(li, 1)
                enemies.splice(ei, 1)
            }
        })
    })

    renderer.render(scene, camera)

    // Cámara sigue al jugador con damping
    const damping = 0.05 // cuanto más bajo, más suave y lento el seguimiento

    const targetX = player.mesh.position.x * 0.5  // Sigue pero con menos intensidad
    const targetY = player.mesh.position.y * 0.5

    camera.position.x += (targetX - camera.position.x) * damping
    camera.position.y += (targetY - camera.position.y) * damping
    camera.lookAt(player.mesh.position.x, player.mesh.position.y, 0)
}

animate()