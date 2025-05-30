import * as THREE from 'three';
import { Player } from './player.js';
import { Laser } from './laser.js';
import { Enemy } from './enemy.js';

const scene = new THREE.Scene();
const stars = createStars(scene);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl'), alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const dirLight = new THREE.DirectionalLight(0x88ccff, 0.5);
dirLight.position.set(-10, 10, -10);
scene.add(dirLight);
const backLight = new THREE.PointLight(0xff88cc, 1, 20);
backLight.position.set(0, 0, 5);
scene.add(backLight);

// UI
let score = 0;
let health = 100;
let gameOver = false;

const scoreElement = document.getElementById('score');
updateUI();

// Objetos del juego
const player = new Player(scene);
const lasers = [];
const enemies = [];

// Raycaster y Crosshair
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const aimPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), -20);

window.addEventListener('mousemove', event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Crosshair 3D
const crosshair = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.25, 60),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);
scene.add(crosshair);

// Controles
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', e => {
    if (e.button === 0) {
        const laser = new Laser(player.mesh.position, crosshair.position);
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
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
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

// UI
function updateUI() {
    updateScore(score);
    updateHealth(health);
}

function updateScore(points) {
    score = points;
    scoreElement.innerText = `Puntos: ${score}`;
}

function updateHealth(newHealth) {
    health = Math.max(0, Math.min(100, newHealth));
    document.getElementById("health-bar").style.width = `${health}%`;
}

// Animación principal
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

    // Apuntado con crosshair
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(aimPlane, intersectPoint);
    crosshair.position.copy(intersectPoint);
    crosshair.lookAt(camera.position);
    player.mesh.lookAt(intersectPoint);

    // Actualizar lasers
    lasers.forEach((laser, i) => {
        laser.update();
        if (laser.mesh.position.z > 50 || laser.mesh.position.z < -100) {
            scene.remove(laser.mesh);
            lasers.splice(i, 1);
        }
    });

    // Actualizar enemigos
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
                score += 10;
                updateUI();
            }
        });
    });

    // Colisiones: Enemigo vs Jugador
    enemies.forEach((enemy, ei) => {
        if (enemy.mesh.position.distanceTo(player.mesh.position) < 1) {
            scene.remove(enemy.mesh);
            enemies.splice(ei, 1);
            updateHealth(health - 20);
            updateUI();

            if (health <= 0 && !gameOver) {
                gameOver = true;
                alert('¡Game Over!');
                window.location.reload();
            }
        }
    });

    // Cámara sigue al jugador
    const damping = 0.05;
    camera.position.x += (player.mesh.position.x * 0.5 - camera.position.x) * damping;
    camera.position.y += (player.mesh.position.y * 0.5 - camera.position.y) * damping;
    camera.lookAt(player.mesh.position.x, player.mesh.position.y, 0);

    renderer.render(scene, camera);
}

animate();