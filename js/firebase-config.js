import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_CTtOFJwWSS_KhMc2Mzg_jXNOQm-D5dM",
  authDomain: "warriors-project-dbb47.firebaseapp.com",
  projectId: "warriors-project-dbb47",
  storageBucket: "warriors-project-dbb47.firebasestorage.app",
  messagingSenderId: "296887185092",
  appId: "1:296887185092:web:d7d8b756453254c46c6391",
  measurementId: "G-56W3SWQJS6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
