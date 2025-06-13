import * as THREE from 'three';
import { Player } from './player.js';
import { Laser } from './laser.js';
import { Enemy } from './enemy.js';
import { Explosion } from './explosion.js';
import { AudioListener, Audio, AudioLoader } from 'three';
import {setupAuthUI} from "./authUI";
import { loginUser, registerUser, subscribeToAuthChanges, handleAuthState, setGameStarted, logout } from "./authService.js";
import {getMaxScore, updateMaxScore} from "./scoreService";
import {getAuth} from "firebase/auth";

// Autenticación
const auth = setupAuthUI();
const authInstance = getAuth();

let gamepad = null;
let playerFired = false;
let joystick, joystickVector = { x: 0, y: 0 };

const scene = new THREE.Scene();
const stars = createStars(scene);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl'), alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

const listener = new AudioListener();
camera.add(listener);

const audioLoader = new AudioLoader();

// Sonidos
const laserSound = new Audio(listener);
const explosionSound = new Audio(listener);
const damageSound = new Audio(listener);
const bgMusic = new Audio(listener);

// Cargar sonidos
audioLoader.load('Audios/laser.WAV', buffer => {
    laserSound.setBuffer(buffer);
    laserSound.setVolume(0.3);
});
audioLoader.load('Audios/explosion.wav', buffer => {
    explosionSound.setBuffer(buffer);
    explosionSound.setVolume(0.2);
});
audioLoader.load('Audios/damage.wav', buffer => {
    damageSound.setBuffer(buffer);
    damageSound.setVolume(0.5);
});
audioLoader.load('Audios/music.mp3', buffer => {
    bgMusic.setBuffer(buffer);
    bgMusic.setLoop(true);
    bgMusic.setVolume(0.2);
    bgMusic.play();
});

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

        if (laserSound.isPlaying) laserSound.stop();
        laserSound.play();
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

// Crear un contenedor para el usuario en HTML
const userInfo = document.createElement("div");
userInfo.id = "user-info";
userInfo.style.position = "fixed";
userInfo.style.top = "10px";
userInfo.style.right = "20px";
userInfo.style.zIndex = "1000";
userInfo.style.color = "white";
userInfo.style.fontSize = "1rem";
document.body.appendChild(userInfo);

// Escuchar envíos del formulario
auth.onSubmit(async (mode, { email, password, nickname }) => {
    try {
        if (mode === "register") {
            await registerUser({ email, password, nickname });
        } else {
            await loginUser({ email, password });
        }
        auth.closeModal();
    } catch (err) {
        alert("Error: " + err.message);
    }
});

// Escuchar cambios de sesión
subscribeToAuthChanges(async (user) => {
    if (user) {
        // Mostrar solo botón de Start Game y el nombre del usuario
        document.getElementById("login-button").style.display = "none";
        document.getElementById("register-button").style.display = "none";
        userInfo.textContent = `Usuario: ${user.displayName || user.email}`;
        startButton.style.display = "block";

        const maxScore = await getMaxScore(user.uid);
        const maxScoreElement = document.getElementById("max-score");
        if (maxScoreElement) {
            maxScoreElement.textContent = `Max-Score: ${maxScore}`;
        }

    } else {
        // Si no está logueado, mostrar opciones
        document.getElementById("login-button").style.display = "inline-block";
        document.getElementById("register-button").style.display = "inline-block";
        userInfo.textContent = "";
        startButton.style.display = "none";
        // Deshabilitamos el texto de puntuación máxima
        document.getElementById("max-score").textContent = "";
    }
});

document.addEventListener('DOMContentLoaded', () => {
    handleAuthState();

    const startButton = document.getElementById('start-button');
    const logoutButton = document.getElementById('logout-button');

    startButton.addEventListener('click', () => {
        // Aquí va la lógica para iniciar el juego
        setGameStarted(true);
        document.getElementById('main-menu').classList.add('hidden');
        if (isMobile()) {
            document.getElementById('shoot-button').classList.remove('hidden');
        }
    });

    logoutButton.addEventListener('click', () => {
        logout();
    });
});

// Hide HUD initially
hudElement.classList.add('hidden');

// Add event listener to start button
startButton.addEventListener('click', startGame);

function startGame() {
    lasers.forEach(l => scene.remove(l.mesh));
    lasers.length = 0;

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

// Nueva función para manejar el game over
async function handleGameOver() {
    gameOver = true;
    clearInterval(enemySpawnInterval);
    bgMusic.pause();

    const user = authInstance.currentUser;
    if (user) {
        await updateMaxScore(user.uid, score);
        const updatedMaxScore = await getMaxScore(user.uid);
        const maxScoreElement = document.getElementById("max-score");
        if (maxScoreElement) {
            maxScoreElement.textContent = `Max-Score: ${updatedMaxScore}`;
        }
    }

    alert('¡Game Over!');
    window.location.reload();
}

function shootLaser() {
    const laser = new Laser(player.mesh.position, crosshair.position);
    scene.add(laser.mesh);
    lasers.push(laser);

    if (laserSound.isPlaying) laserSound.stop();
    laserSound.play();
}

const shootButton = document.getElementById('shoot-button');
shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault(); // evita que el navegador interprete el toque
    shootLaser();
});

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

                if (laserSound.isPlaying) laserSound.stop();
                laserSound.play();
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

                if (explosionSound.isPlaying) explosionSound.stop();
                explosionSound.play();

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
    for (const enemy of enemies) {
        const ei = enemies.indexOf(enemy);
        if (enemy.mesh.position.distanceTo(player.mesh.position) < 1) {
            // Create explosion at enemy position
            const explosion = new Explosion(enemy.mesh.position.clone(), scene, 0xff3333);
            explosions.push(explosion);

            if (damageSound.isPlaying) damageSound.stop();
            damageSound.play();

            scene.remove(enemy.mesh);
            enemies.splice(ei, 1);
            updateHealth(health - 20);
            updateUI();

            if (health <= 0 && !gameOver) {
                // Llama a la función asíncrona pero no esperes su resultado
                handleGameOver()
                    .catch(error => console.error("Error en handleGameOver:", error));
                return; // Sal del bucle de animación inmediatamente
            }
        }
    }

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

    // Movimiento táctil desde joystick virtual
    if (joystickVector.x !== 0 || joystickVector.y !== 0) {
        const speed = 0.1; // puedes ajustar esto si va muy rápido o lento
        player.mesh.position.x += joystickVector.x * speed;
        player.mesh.position.y += joystickVector.y * speed;
    }
}

// Start animation loop (but not game logic)
animate();

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

if (isMobile()) {
    initJoystick();
}

function initJoystick() {
    const container = document.getElementById('joystick-container');
    container.classList.remove('hidden');

    const joystick = nipplejs.create({
        zone: container,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white'
    });

    joystick.on('move', (evt, data) => {
        if (data.vector) {
            joystickVector.x = data.vector.x;
            joystickVector.y = data.vector.y;
        }
    });

    joystick.on('end', () => {
        joystickVector.x = 0;
        joystickVector.y = 0;
    });
}