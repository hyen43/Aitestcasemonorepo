"use client";
import React, { useEffect } from "react";
import { auth, googleProvider, createUserProfile, db } from "@/lib/firebase";
import Image from "next/image";
import { signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";

// main 화면 - 로그인 / 회원가입 기능 추가
// 로그인 후
// 1) 결제를 한 상태면 dashboard 화면으로 이동
// 2) 결제를 하지 않은 상태면 결제 화면으로 이동

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    //cypress 분기처리
    const isCypress = typeof window !== "undefined" && (window as any).Cypress;
    if (isCypress) {
      const win = window as any;
      const mockUser = win.Cypress?.mockUser || {
        uid: "default_user",
        email: "default@example.com",
        credits: 0,
      };

      // ✅ credit 수에 따라 분기
      if (mockUser.credits === 0) {
        router.push("/payment");
      } else {
        router.push("/dashboard");
      }

      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firestore에 사용자 프로필 저장
        await createUserProfile(user as User);
        // licenses 조회
        const license = query(
          collection(db, "licenses"),
          where("email", "==", user.email)
        );

        const snap = await getDocs(license);

        if (snap.empty) {
          router.replace(`/payment?email=${user.email}`);
          return;
        } else {
          //queryString으로 전달
          const snapId = snap.docs[0].id;
          router.replace(`/dashboard?id=${snapId}`);
          return;
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google 로그인 실패:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen gap-5 px-10">
        <h1 className="text-3xl font-bold text-white">Test Case AI </h1>
        <p className="text-center text-white ">
          AI가 10초 만에 테스트 케이스를 자동으로 만들어줘요!
          <br />
          피그마 기획서의 설명(description)을 클릭만하면, 완성도 높은 테스트
          케이스 출력해줍니다.
        </p>

        <button
          className="mt-10 px-4 py-2 border flex gap-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150"
          onClick={handleGoogleLogin}
          data-cy="google-login-btn"
        >
          <Image
            className="w-6 h-6 hover:cursor-pointer"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google logo"
            width={24}
            height={24}
          />
          <span>Google로 계속하기</span>
        </button>
      </div>
    </>
  );
}
