// server/index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  PortOneClient,
  Errors: PortOneErrors,
  Webhook,
} = require("@portone/server-sdk");
const admin = require("firebase-admin");

// 1) Firebase Admin SDK 초기화
const serviceAccount = require("./serviceAccountKey.json");
const { BillingKey } = require("@portone/server-sdk/payment");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// 2) PortOne 클라이언트 초기화
const portone = new PortOneClient({
  secret: process.env.PORTONE_SECRET_KEY,
});

// 3) Express 앱 세팅
const app = express();
// CORS 전역 적용 → 브라우저/플러그인에서 API 호출 허용
app.use(cors());
// JSON 바디 파싱
app.use(bodyParser.json());
// Webhook 전용 raw 텍스트 파싱 (verify 위해)
app.use(
  "/api/payment/webhook",
  bodyParser.text({
    type: "application/json",
  })
);

// 4) 핑 엔드포인트 (헬스체크)
app.get("/ping", (req, res) => {
  console.log("▶️  /ping 요청 받음");
  res.send("PONG");
});

// 5) 클라이언트용 결제 완료 확인 API
app.post("/api/payment/complete", async (req, res, next) => {
  console.log("▶️  /api/payment/complete 요청 바디:", req.body);
  try {
    const { paymentId, email } = req.body;
    if (typeof paymentId !== "string") {
      return res.status(400).json({ error: "paymentId (string) is required." });
    }

    // 포트원 결제 연동 로직으로 테스트 시도
    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET_KEY}`,
        },
      }
    );
    if (!paymentResponse.ok)
      throw new Error(`paymentResponse: ${await paymentResponse.json()}`);
    const payment = await paymentResponse.json();

    console.log("payment", payment);

    const docRef = db.collection("licenses").doc(paymentId);

    switch (payment.status) {
      case "PAID": {
        await docRef.set({
          valid: true,
          email: email,
          remainingCredits: 100,
          merchantId: payment.merchantId,
          paymentId: payment.id,
          transactionId: payment.transactionId,
          issuedAt: new Date().toISOString(),
        });
        console.info(`🔑 라이선스 발급 완료: ${docRef.id}`);
        return res.json({
          status: "PAID",
          id: docRef.id,
        });
      }
    }
  } catch (err) {
    return next(err);
  }
});

// 6) PortOne Webhook 처리
app.post("/api/payment/webhook", async (req, res, next) => {
  try {
    let event;
    try {
      event = await Webhook.verify(
        process.env.PORTONE_WEBHOOK_SECRET,
        req.body,
        req.headers
      );
    } catch (e) {
      if (e instanceof Webhook.WebhookVerificationError) {
        return res.status(400).end();
      }
      throw e;
    }

    console.log("▶️  Webhook 이벤트 받음:", event.type);

    // if (event.data && typeof event.data.paymentId === "string") {
    //   await syncPayment(event.data.paymentId);
    // }
    return res.status(200).end();
  } catch (err) {
    return next(err);
  }
});

// 7) 에러 핸들러 (signature: err, req, res, next)
app.use((err, req, res, next) => {
  console.error("❌ 서버 에러:", err);
  res.status(500).json({ error: err.message });
});

// 8) 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Payment server running at http://localhost:${PORT}`);
});
