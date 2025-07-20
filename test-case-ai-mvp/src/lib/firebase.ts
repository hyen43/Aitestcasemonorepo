import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, User } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDH4oEe6t0mKvk3CcqKaVvplhfWw2b2tjk",
  authDomain: "aiautotestcase.firebaseapp.com",
  projectId: "aiautotestcase",
  storageBucket: "aiautotestcase.firebasestorage.app",
  messagingSenderId: "662097381388",
  appId: "1:662097381388:web:f0aad26a2589e63416c629",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

/**
 * 로그인된 사용자를 Firestore 'users' 컬렉션에 저장
 */

export async function createUserProfile(user: User) {
  console.log("user", user);
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      email: user.email,
      displayName: user.displayName || user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  ); // 이미 존재하면 덮어쓰기 없이 필드만 병합
}
