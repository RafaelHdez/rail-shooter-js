// Importamos las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBxCeygfgK6EcQThnt8QqRvpIjDeCPdUyg",
    authDomain: "rail-shooter-three.firebaseapp.com",
    projectId: "rail-shooter-three",
    storageBucket: "rail-shooter-three.firebasestorage.app",
    messagingSenderId: "339608626491",
    appId: "1:339608626491:web:18984a6d562b09c9ab831e"
};

// Inicializamos Firebase y obtenemos la instancia de autenticación
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos la instancia de autenticación para usarla en otros módulos
export { auth };
export { db };