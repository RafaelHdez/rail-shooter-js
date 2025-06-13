import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";

// Establecer puntuación máxima si es mayor
export async function updateMaxScore(userId, score) {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        // Si el documento no existe aún
        await setDoc(userRef, {
            maxScore: score
        });
    } else {
        const data = docSnap.data();
        if (score > (data.maxScore || 0)) {
            await updateDoc(userRef, {
                maxScore: score
            });
        }
    }
}

// Obtener puntuación máxima
export async function getMaxScore(userId) {
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data().maxScore || 0;
    } else {
        return 0;
    }
}