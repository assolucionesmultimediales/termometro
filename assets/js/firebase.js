// assets/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCA582PCay_dTgvpaabChpbYNMDRcy_GmY",
  authDomain: "termometro-fb438.firebaseapp.com",
  projectId: "termometro-fb438",
  storageBucket: "termometro-fb438.appspot.com",
  messagingSenderId: "290969926203",
  appId: "1:290969926203:web:a331797df13d72d89f7a1e",
  measurementId: "G-GGEGE5BFGN"
};

// inicializo Firebase
const app = initializeApp(firebaseConfig);

// conecto con firestore
const db = getFirestore(app);

export { db };
