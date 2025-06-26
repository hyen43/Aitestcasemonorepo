import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "aiautotestcase.firebaseapp.com",
  projectId: "aiautotestcase",
  storageBucket: "aiautotestcase.firebasestorage.app",
  messagingSenderId: "662097381388",
  appId: "1:662097381388:web:f0aad26a2589e63416c629",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, doc, getDoc };
