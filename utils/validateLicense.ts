import { db, doc, getDoc } from "../src/firebase";

//Firestore의 licenses 컬렉션에서 문서 ID가 키인 항목을 찾아 valid 필드가 true인지 확인
export const validateLicenseKey = async (
  licenseKey: string
): Promise<boolean> => {
  console.log("licenseKey", licenseKey);
  try {
    const docRef = doc(db, "licenses", licenseKey);
    console.log("docRef", docRef);
    const docSnap = await getDoc(docRef);
    console.log("Firestore에서 가져온 snapshot:", docSnap.data());
    return docSnap.exists() && docSnap.data()?.valid === true;
  } catch (error) {
    console.error("License validation failed", error);
    return false;
  }
};
