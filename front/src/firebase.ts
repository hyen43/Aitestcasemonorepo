import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  // apiKey: "AIzaSyDH4oEe6t0mKvk3CcqKaVvplhfWw2b2tjk",
  // authDomain: "aiautotestcase.firebaseapp.com",
  // projectId: "aiautotestcase",
  // storageBucket: "aiautotestcase.firebasestorage.app",
  // messagingSenderId: "662097381388",
  // appId: "1:662097381388:web:f0aad26a2589e63416c629",
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDERID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

console.log("firebaseConfig", firebaseConfig);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, doc, getDoc };
