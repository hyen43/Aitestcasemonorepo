import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./ui.css";
import { db } from "./firebase";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { validateLicenseKey } from "../utils/validateLicense";
import PortOne from "@portone/browser-sdk/v2";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// openAI call api
const callOpenAI = async (description: string): Promise<string> => {
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: `당신은 숙련된 QA 엔지니어입니다. 다음 설명에 대한 테스트케이스를 작성하세요. 출력 형식:
- HTML 태그(h1, h2 등)나 CSS 스타일을 일절 사용하지 마세요.
- 각 테스트 케이스는 "설명:"과 "예상 결과:"만 포함해서 텍스트로 나열해주세요.
- 번호나 제목 없이, 순서대로 한 줄에 하나씩 작성해주세요.`,
      },
      {
        role: "user",
        content: `설명: ${description}`,
      },
    ],
  });

  console.log(response.output_text);
  return response.output_text || "응답없음";
};

// APP이 동작하는 코드
const App = () => {
  // firebase validation
  const [licenseKey, setLicenseKey] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [paymentLicenseKey, setPaymentLicenseKey] = useState("");

  //Figma 내 description 데이터 가져오기
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  //결제 테스트 연동을 위한 state
  const [paymentStatus, setPaymentStatus] = useState({
    status: "IDLE",
    message: "",
  });

  // code.ts에 저장 요청
  const saveLicense = (key: string) => {
    parent.postMessage(
      { pluginMessage: { type: "save-license", licenseKey: key } },
      "*"
    );
  };

  // 인증 후 처리
  const handleVerify = async () => {
    const trimedLicensekey = licenseKey.trim();
    console.log("trimedLicenseKey", trimedLicensekey);
    const result = await validateLicenseKey(trimedLicensekey);
    if (result) {
      saveLicense(trimedLicensekey);
      setIsVerified(true);
      setError("");
    } else {
      setError("유효하지 않은 라이센스 키입니다.");
    }
  };

  // 인증 키 로그아웃
  const handleLogout = () => {
    parent.postMessage({ pluginMessage: "clear-license" }, "*");
    setIsVerified(false);
    setLicenseKey("");
  };

  //description을 가져오는 함수
  const handleGetDescription = () => {
    parent.postMessage({ pluginMessage: { type: "get-description" } }, "*");
  };

  const handleGenerateQA = async () => {
    if (!description) {
      setError("설명을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");

    try {
      console.log("description", description);
      console.log("licenseKey", licenseKey);
      // 1) 남은 크레딧 조회
      const licenseRef = doc(db, "licenses", licenseKey);
      const licenseSnap = await getDoc(licenseRef);
      if (!licenseSnap.exists()) {
        setError("라이선스 정보를 찾을 수 없습니다.");
        return;
      }
      const { remainingCredits } = licenseSnap.data();
      console.log("remainingCredits", remainingCredits);
      if (remainingCredits <= 0) {
        setError("크레딧이 부족합니다. 충전해주세요.");
        return;
      }

      const result = await callOpenAI(description);
      // 3) 트랜잭션으로 크레딧 1회 차감
      await runTransaction(db, async (tx) => {
        const docSnap = await tx.get(licenseRef);
        if (!docSnap.exists()) throw new Error("라이선스 문서 없음");
        const current = docSnap.data().remainingCredits;
        if (current <= 0) throw new Error("크레딧 부족");
        tx.update(licenseRef, { remainingCredits: current - 1 });
      });

      //파이어베이스 토큰 차감 함수
      setResult(result);
    } catch (error) {
      console.log("error", error);
      setError("테스트케이스 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 피그마 자동로그인을 위해 저장된 license 키를 받아오는 mount함수
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-license" } }, "*");

    const handler = async (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      console.log("플러그인 메시지", msg);
      if (msg.type === "license-loaded") {
        const stored = msg.licenseKey;
        console.log("저장된 라이센스", stored);
        if (stored) {
          const valid = await validateLicenseKey(stored);
          setLicenseKey(stored);
          if (valid) {
            setIsVerified(true);
          }
        }
        setChecking(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // description을 받아오는 mount 함수
  useEffect(() => {
    window.onmessage = (event) => {
      const { type, data, error } = event.data.pluginMessage;
      if (type === "description") {
        if (error) {
          setError(error);
          setDescription("");
        } else {
          setDescription(data);
          setError("");
        }
      }
    };
  }, []);

  // 결제 테스트 연동 로직
  // 결제용 랜덤 아이디 생성 함수
  function randomId() {
    return [...crypto.getRandomValues(new Uint32Array(2))]
      .map((word) => word.toString(16).padStart(8, "0"))
      .join("");
  }

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus({ status: "PENDING", message: "pending" });
    const paymentId = randomId();
    const payment = await PortOne.requestPayment({
      storeId: process.env.STORE_ID ?? "",
      channelKey: process.env.CHANNEL_KEY,
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
        body: JSON.stringify({ paymentId: payment?.paymentId }),
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
      setPaymentLicenseKey(paymentComplete.licenseKey);
    } else {
      setPaymentStatus({
        status: "FAILED",
        message: await completeResponse.text(),
      });
    }
  };

  const isWaitingPayment = paymentStatus.status !== "IDLE";

  const handleClose = () =>
    setPaymentStatus({
      status: "IDLE",
      message: "close",
    });

  // 실제 UI 로직
  if (checking) return <p>🔍 인증 상태 확인 중...</p>;

  if (!isVerified) {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 20 }}>
            <h3>라이선스 키를 입력하세요</h3>
            <span>
              AI테스트케이스 사용을 위해서는 라이선스 키가 필요합니다.
            </span>
            <input
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="라이선스 키"
            />
            <button onClick={handleVerify}>검증</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
          </div>
          {paymentStatus.status !== "PAID" ? (
            <div>
              <form onSubmit={handlePaySubmit}>
                <button
                  type="submit"
                  aria-busy={isWaitingPayment}
                  disabled={isWaitingPayment}
                >
                  결제하기(라이선스키 얻기)
                </button>
              </form>
            </div>
          ) : (
            <div>
              라이센스키를 입력하세요.
              <p>{paymentLicenseKey}</p>
            </div>
          )}
        </div>
        {paymentStatus.status === "FAILED" && (
          <dialog open>
            <header>
              <h1>결제 실패</h1>
            </header>

            <p>{paymentStatus.message}</p>

            <button type="button" onClick={handleClose}>
              닫기
            </button>
          </dialog>
        )}

        <dialog open={paymentStatus.status === "PAID"}>
          <header>
            <h1>결제 성공</h1>
          </header>

          <p>결제에 성공했습니다.</p>

          <button type="button" onClick={handleClose}>
            닫기
          </button>
        </dialog>
      </>
    );
  } else {
    return (
      <div style={{ padding: 20 }}>
        <h3>Description 추출 테스트</h3>
        <button onClick={handleGetDescription}>디스크립션 가져오기</button>
        <button onClick={handleLogout} disabled={!isVerified}>
          로그아웃
        </button>
        {description && (
          <button onClick={handleGenerateQA} disabled={loading}>
            QA 생성 {loading && "⏳"}
          </button>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {description && (
          <>
            <h4>추출된 Description:</h4>
            <pre>{description}</pre>
          </>
        )}
        {result && (
          <>
            <h4>🧪 생성된 테스트케이스:</h4>
            <pre>{result}</pre>
          </>
        )}
      </div>
    );
  }
};

const root = createRoot(document.getElementById("react-page")!);
root.render(<App />);
