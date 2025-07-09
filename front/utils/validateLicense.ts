import { db, doc, getDoc } from "../src/firebase";

//Firestore의 licenses 컬렉션에서 문서 data가 email 인 항목을 찾아 valid 필드가 true인지 확인
export const validateLicenseKey = async (
  email: string
): Promise<boolean> => {
  console.log("licenseKey", email);
  try {
    const docRef = doc(db, "licenses", email);
    console.log("docRef", docRef);
    const docSnap = await getDoc(docRef);
    console.log("Firestore에서 가져온 snapshot:", docSnap.data());
    return docSnap.exists() && docSnap.data()?.valid === true;
  } catch (error) {
    console.error("License validation failed", error);
    return false;
  }
};
