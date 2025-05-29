import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleGetDescription = () => {
    parent.postMessage({ pluginMessage: { type: "get-description" } }, "*");
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

  return (
    <div style={{ padding: 20 }}>
      <h3>Description 추출 테스트</h3>
      <button onClick={handleGetDescription}>디스크립션 가져오기</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {description && (
        <>
          <h4>추출된 Description:</h4>
          <pre>{description}</pre>
        </>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("react-page")!);
root.render(<App />);
