import { db, doc, getDoc } from "../src/firebase";

//Firestore의 licenses 컬렉션에서 문서 ID가 키인 항목을 찾아 valid 필드가 true인지 확인
export const validateLicenseKey = async (
  licenseKey: string
): Promise<boolean> => {
  try {
    const docRef = doc(db, "licenses", licenseKey);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() && docSnap.data()?.isActive;
  } catch (error) {
    console.error("License validation failed", error);
    return false;
  }
};
