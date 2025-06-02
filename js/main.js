import * as THREE from 'three';
import { Player } from './player.js';
import { Laser } from './laser.js';
import { Enemy } from './enemy.js';
import { Explosion } from './explosion.js';

let gamepad = null;
let playerFired = false;

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
const explosions = [];

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

window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad conectado:", event.gamepad);
    gamepad = event.gamepad;
});

window.addEventListener("gamepaddisconnected", () => {
    console.log("Gamepad desconectado");
    gamepad = null;
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

// Spawn enemigos - now handled in startGame function

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
let gameStarted = false;
let enemySpawnInterval;

// Get DOM elements
const mainMenu = document.getElementById('main-menu');
const hudElement = document.getElementById('hud');
const startButton = document.getElementById('start-button');

// Hide HUD initially
hudElement.classList.add('hidden');

// Add event listener to start button
startButton.addEventListener('click', startGame);

function startGame() {
    // Hide menu and show HUD
    mainMenu.classList.add('hidden');
    hudElement.classList.remove('hidden');

    // Start the game
    gameStarted = true;

    // Start spawning enemies
    enemySpawnInterval = setInterval(() => {
        const enemy = new Enemy(player.mesh);
        scene.add(enemy.mesh);
        enemies.push(enemy);
    }, 600);

    // Start animation loop if not already running
    if (!animationFrameId) {
        animate();
    }
}

let animationFrameId;

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // Actualizar estrellas
    const positions = stars.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        positions.array[i * 3 + 2] += starSpeed;
        if (positions.array[i * 3 + 2] > camera.position.z) {
            positions.array[i * 3 + 2] = -100;
        }
    }
    positions.needsUpdate = true;

    // If game hasn't started, just render the scene without game logic
    if (!gameStarted) {
        renderer.render(scene, camera);
        return;
    }

    // Control por teclado
    player.update(keys);

    // Control por gamepad
    const pads = navigator.getGamepads();
    if (pads[0]) {
        const gp = pads[0];

        // Ejes del joystick izquierdo para mover al jugador
        const leftHorizontal = gp.axes[0]; // -1 (izq) a 1 (der)
        const leftVertical = gp.axes[1];   // -1 (arriba) a 1 (abajo)
        const speed = 0.1;

        // Mover al jugador (ajusta la velocidad si hace falta)
        player.mesh.position.x += leftHorizontal * speed;
        player.mesh.position.y += -leftVertical * speed;

        // Ejes del joystick derecho para controlar el crosshair
        const rightHorizontal = gp.axes[2]; // -1 (izq) a 1 (der)
        const rightVertical = gp.axes[3];   // -1 (arriba) a 1 (abajo)

        // Solo actualizar si hay movimiento significativo en el joystick derecho
        if (Math.abs(rightHorizontal) > 0.1 || Math.abs(rightVertical) > 0.1) {
            // Convertir los valores del joystick a coordenadas de pantalla
            mouse.x += rightHorizontal * 0.02;
            mouse.y += -rightVertical * 0.02;

            // Limitar los valores entre -1 y 1
            mouse.x = Math.max(-1, Math.min(1, mouse.x));
            mouse.y = Math.max(-1, Math.min(1, mouse.y));
        }

        // Disparar con gatillo derecho (botón 7) o botón A (botón 0)
        if (gp.buttons[7].pressed || gp.buttons[0].pressed) {
            if (!playerFired) {
                const laser = new Laser(player.mesh.position, crosshair.position);
                scene.add(laser.mesh);
                lasers.push(laser);
                playerFired = true;
            }
        } else {
            playerFired = false;
        }
    }

    // Función para encontrar el enemigo más cercano
    function findNearestEnemy() {
        if (enemies.length === 0) return null;

        let nearestEnemy = enemies[0];
        let minDistance = Infinity;

        enemies.forEach(enemy => {
            const distance = enemy.mesh.position.distanceTo(player.mesh.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        return nearestEnemy;
    }

    // Apuntado con crosshair - auto-aim al enemigo más cercano
    const nearestEnemy = findNearestEnemy();

    if (nearestEnemy) {
        // Calcular la posición en el plano de apuntado donde el rayo desde la cámara
        // intersecta con la dirección hacia el enemigo
        const targetPosition = new THREE.Vector3();
        targetPosition.copy(nearestEnemy.mesh.position);

        // Proyectar la posición del enemigo en el plano de apuntado
        raycaster.set(camera.position, targetPosition.sub(camera.position).normalize());
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(aimPlane, intersectPoint);

        // Suavizar el movimiento del crosshair
        const smoothFactor = 0.1;
        crosshair.position.lerp(intersectPoint, smoothFactor);
    } else {
        // Si no hay enemigos, usar el control manual
        raycaster.setFromCamera(mouse, camera);
        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(aimPlane, intersectPoint);
        crosshair.position.copy(intersectPoint);
    }

    crosshair.lookAt(camera.position);
    player.mesh.lookAt(crosshair.position);

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
            if (laser.mesh.position.distanceTo(enemy.mesh.position) < 5) {
                // Create explosion at enemy position
                const explosion = new Explosion(enemy.mesh.position.clone(), scene, 0xff3333);
                explosions.push(explosion);

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
            // Create explosion at enemy position
            const explosion = new Explosion(enemy.mesh.position.clone(), scene, 0xff3333);
            explosions.push(explosion);

            scene.remove(enemy.mesh);
            enemies.splice(ei, 1);
            updateHealth(health - 20);
            updateUI();

            if (health <= 0 && !gameOver) {
                gameOver = true;
                clearInterval(enemySpawnInterval);
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

    // Update explosions
    const deltaTime = 1/60; // Approximate time between frames
    for (let i = explosions.length - 1; i >= 0; i--) {
        const isActive = explosions[i].update(deltaTime);
        if (!isActive) {
            explosions.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

// Start animation loop (but not game logic)
animate();
