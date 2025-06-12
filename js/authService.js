// Importamos las funciones necesarias de Auth
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut
} from "firebase/auth";

import { auth } from "./firebase.js";

const loginBtn = document.getElementById('login-button');
const registerBtn = document.getElementById('register-button');
const startBtn = document.getElementById('start-button');
const logoutBtn = document.getElementById('logout-button');
const userDisplay = document.getElementById('user-display');

let gameStarted = false;

export function handleAuthState() {
    onAuthStateChanged(auth, user => {
        if (user && !gameStarted) {
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
            userDisplay.textContent = user.displayName || user.email;
            userDisplay.classList.remove('hidden');
        } else {
            startBtn.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            loginBtn.classList.remove('hidden');
            registerBtn.classList.remove('hidden');
            userDisplay.textContent = '';
            userDisplay.classList.add('hidden');
        }
    });
}

export function logout() {
    signOut(auth).catch(err => console.error("Error cerrando sesión:", err));
}

// Permite a otros módulos indicar que el juego ya comenzó
export function setGameStarted(started) {
    gameStarted = started;
    if (started) {
        logoutBtn.classList.add('hidden');
    }
}

export async function registerUser({ email, password, nickname }) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: nickname });
    return userCredential.user;
}

export async function loginUser({ email, password }) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

export function subscribeToAuthChanges(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}