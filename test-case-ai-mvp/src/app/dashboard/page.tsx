"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [licenses, setLicenses] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("user", user);
      if (!user) {
        router.replace("/payment");
        return;
      }

      if (id) {
        const docRef = doc(db, "licenses", id); // 'licenses' 컬렉션
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();
        const credits = data?.remainingCredits || 0;
        setLicenses(id);
        setCredits(credits);
        console.log("db", db);
        return;
      }
    });
    return unsub;
  }, [router, id]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <>
      <div className=" flex flex-col items-center justify-center gap-10 h-screen">
        {/* 상단 타이틀 */}
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-white text-2xl font-bold">마이페이지</h2>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className=" flex items-center justify-center w-full max-w-4xl">
          <div className="grid grid-cols-2 gap-32 w-full">
            {/* 왼쪽 영역 */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-white text-xl mb-4">라이선스 키</div>
              <div className="text-white text-xl mb-4">남은 토큰</div>
            </div>

            {/* 오른쪽 영역 */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-white text-xl mb-4">{licenses}</div>
              <div className="text-white text-xl mb-4">{credits}개</div>
            </div>
          </div>
        </div>

        {/* 충전 버튼 */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <button className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-black transition-colors duration-200">
            10,000원 추가 결제하기
          </button>

          {/* <button className="text-gray-400 underline text-sm hover:text-white transition-colors duration-200">
            결제 취소 / 환불 문의하기
          </button> */}
          <button
            className="text-blue-600 hover:underline"
            onClick={handleLogout}
            data-cy="logout-btn"
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
