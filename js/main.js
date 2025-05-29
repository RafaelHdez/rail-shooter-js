import * as THREE from 'three';

import { Player } from './player.js';
import { Laser } from './laser.js';
import { Enemy } from './enemy.js';

const scene = new THREE.Scene();
const stars = createStars(scene);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// UI
let score = 0;
let lives = 10;
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
updateUI();

// Objetos del juego
const player = new Player(scene);
const lasers = [];
const enemies = [];

// Controles
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Disparo
window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        const laser = new Laser(player.mesh.position);
        scene.add(laser.mesh);
        lasers.push(laser);
    }
});

function createStars(scene, count = 300) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 120;
        const z = Math.random() * -200;
        positions.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    return stars;
}

// Spawn enemigos
setInterval(() => {
    const enemy = new Enemy(player.mesh);
    scene.add(enemy.mesh);
    enemies.push(enemy);
}, 1500);

function updateUI() {
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
}

const starSpeed = 0.5;

function animate() {
    requestAnimationFrame(animate);

    // Actualizar estrellas
    const positions = stars.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        positions.array[i * 3 + 2] += starSpeed;
        if (positions.array[i * 3 + 2] > camera.position.z) {
            positions.array[i * 3 + 2] = -100;
        }
    }
    positions.needsUpdate = true;

    player.update(keys);

    lasers.forEach((laser, i) => {
        laser.update();
        if (laser.mesh.position.z > 50) {
            scene.remove(laser.mesh);
            lasers.splice(i, 1);
        }
    });

    enemies.forEach((enemy, i) => {
        enemy.update();
        if (enemy.mesh.position.z > 10) {
            scene.remove(enemy.mesh);
            enemies.splice(i, 1);
        }
    });

    // Colisiones: Láser vs Enemigo
    lasers.forEach((laser, li) => {
        enemies.forEach((enemy, ei) => {
            if (laser.mesh.position.distanceTo(enemy.mesh.position) < 1) {
                scene.remove(laser.mesh);
                scene.remove(enemy.mesh);
                lasers.splice(li, 1);
                enemies.splice(ei, 1);
                score++;
                updateUI();
            }
        });
    });

    // Colisiones: Enemigo vs Jugador
    enemies.forEach((enemy, ei) => {
        if (enemy.mesh.position.distanceTo(player.mesh.position) < 1) {
            scene.remove(enemy.mesh);
            enemies.splice(ei, 1);
            lives--;
            updateUI();

            if (lives <= 0) {
                alert('¡Game Over!');
                window.location.reload();
            }
        }
    });

    // Cámara sigue al jugador
    const damping = 0.05;
    const targetX = player.mesh.position.x * 0.5;
    const targetY = player.mesh.position.y * 0.5;

    camera.position.x += (targetX - camera.position.x) * damping;
    camera.position.y += (targetY - camera.position.y) * damping;
    camera.lookAt(player.mesh.position.x, player.mesh.position.y, 0);

    renderer.render(scene, camera);
}

animate();
