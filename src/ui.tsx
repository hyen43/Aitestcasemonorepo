import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./ui.css";
import { validateLicenseKey } from "../utils/validateLicense";

// openAI call api
const callOpenAI = async (description: string): Promise<string> => {
  const apiKey = process.env.OPENAI_API_KEY; // 이제 정상 작동!

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
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
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "응답 없음";
};

const App = () => {
  // firebase validation
  const [licenseKey, setLicenseKey] = useState("");
  const [isVerified, setIsVerified] = useStatte(false);
  //Figma 내 description 데이터 가져오기
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    const result = await validateLicenseKey(licenseKey.trim());
    if (result) {
      setIsVerified(true);
      setError("");
    } else {
      setError("유효하지 않은 라이센스 키입니다.");
    }
  };

  const handleGetDescription = () => {
    parent.postMessage({ pluginMessage: { type: "get-description" } }, "*");
  };

  const handleGenerateQR = async () => {
    if (!description) {
      setError("설명을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");

    try {
      console.log("description", description);
      const result = await callOpenAI(description);
      setResult(result);
    } catch (error) {
      console.log("error", error);
      setError("테스트케이스 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

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

  if (isVerified) {
    return <div>여기에 인증 UI 개발</div>;
  } else {
    return (
      <div style={{ padding: 20 }}>
        <h3>Description 추출 테스트</h3>
        <button onClick={handleGetDescription}>디스크립션 가져오기</button>
        {description && (
          <button onClick={handleGenerateQR} disabled={loading}>
            2. QA 생성 {loading && "⏳"}
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
