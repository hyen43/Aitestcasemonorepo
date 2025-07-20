"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import PortOne from "@portone/browser-sdk/v2";

export default function Payment() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const router = useRouter();
  //결제 테스트 연동을 위한 state
  const [paymentStatus, setPaymentStatus] = useState({
    status: "IDLE",
    message: "",
  });

  // 결제 테스트 연동 로직
  // 결제용 랜덤 아이디 생성 함수
  function randomId() {
    return [...crypto.getRandomValues(new Uint32Array(2))]
      .map((word) => word.toString(16).padStart(8, "0"))
      .join("");
  }

  // ⭐️ 추후 전역 함수로 만들어서 페이지 별로 사용 ⭐️
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus({ status: "PENDING", message: "pending" });
    const paymentId = randomId();
    // env 변수로 수정 예정
    const payment = await PortOne.requestPayment({
      storeId: "store-8f679c08-cd81-46d8-99ad-b57014608bb2",
      channelKey: "channel-key-ce669abd-2260-49d5-8d2a-f612c199fd8b",
      paymentId,
      orderName: "AIAUTOTESTCASE",
      totalAmount: 30000,
      currency: "CURRENCY_KRW",
      payMethod: "CARD",
    });

    if (payment?.code !== undefined) {
      setPaymentStatus({
        status: "FAILED",
        message: payment.message || "결제 실패",
      });
      return;
    }

    //⭐️이제부터 결제를 위한 백엔드 api 구축 시작(여기부터 gogo)
    const completeResponse = await fetch(
      "http://localhost:4000/api/payment/complete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId: payment?.paymentId, email: email }),
      }
    );

    console.log("프론트완료반응", completeResponse);

    if (completeResponse.ok) {
      const paymentComplete = await completeResponse.json();
      console.log("paymentComplete", paymentComplete);
      setPaymentStatus({
        status: paymentComplete.status,
        message:
          paymentComplete.status === "PAID"
            ? "결제성공"
            : paymentComplete?.message || "결제실패",
      });

      router.replace(`/dashboard?id=${paymentComplete.id}`);
    } else {
      setPaymentStatus({
        status: "FAILED",
        message: await completeResponse.text(),
      });
    }
  };

  // 로그아웃 버튼 클릭 시,
  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <>
      <div className=" flex flex-col items-center justify-center gap-10 h-screen">
        {/* 상단 타이틀 */}
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-white text-2xl font-bold">Test Case AI</h2>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className=" flex items-center justify-center w-full max-w-4xl">
          <div className="grid gap-32 w-full [grid-template-columns:1fr_min-content_1fr]">
            {/* 왼쪽 영역 */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-white text-xl mb-4">AS-IS</div>
              <div className="text-white text-xl mb-4">
                QA 작성이 하루종일 걸려요
              </div>
              <div className="text-white text-xl mb-4">
                수작업으로 놓치는 테스트 케이스가 많아요
              </div>
            </div>
            <div className="flex-none w-fit flex flex-col items-center justify-center text-white">
              {" "}
              &gt;{" "}
            </div>

            {/* 오른쪽 영역 */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-white text-xl mb-4">TO-BE</div>
              <div className="text-white text-xl mb-4">
                TestCase AI가 단 몇 초 만에 수백 개의 테스트 케이스를
                만들어줘요!
              </div>
              <div className="text-white text-xl mb-4">
                AI가 놓치는 테스트 케이스 없이 꼼꼼하게 작성해줘요!
              </div>
            </div>
          </div>
        </div>

        {/* 충전 버튼 */}
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <div className="text-center text-white ">
            이 상관없이 100개의 디스크립션에 단 10,000원!
            <br /> 100토큰=100건, 만 원으로 시간과 업무 퀄리티를 높여보세요!
          </div>

          <button
            onClick={handlePaySubmit}
            className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-black transition-colors duration-200"
          >
            10,000원 결제하기
          </button>
          <button
            className="text-blue-600 hover:underline"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
