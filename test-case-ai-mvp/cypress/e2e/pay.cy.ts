describe("결제 시나리오", () => {
  beforeEach(() => {
    cy.visit("/payment", {
      onBeforeLoad(win) {
        win.Cypress = win.Cypress || {};
        win.Cypress.mockUser = {
          uid: "pay_user_001",
          email: "payuser@example.com",
          credit: 0,
        };
      },
    });
  });

  it("결제하기 클릭 시, portone iframe이 뜨고 결제 완료 후 서버에서 credit 발급", () => {
    cy.intercept("POST", "http://localhost:4000/api/payment/complete", {
      statusCode: 200,
      body: {
        status: "PAID",
        id: "mocked-license-456",
      },
    }).as("paymentComplete");
    // 클릭 후 요청 발생 → 기다림
    cy.get('[data-cy="payment-btn"]').click();
    cy.get("iframe#imp-iframe").should("exist");

    // ✅ 실제 결제 성공 콜백을 Cypress에서 강제로 실행
    cy.window().then((win) => {
      return win.testTriggerPaymentComplete(
        "pay_user_001",
        "payuser@example.com"
      );
    });
    // 응답 대기
    cy.wait("@paymentComplete");

    // 실제로 테스트 환경에서 결제를 해봐야하기 때문에 타임아웃 시간을 늘렸다.
    cy.url({ timeout: 1000000 }).should("include", "/dashboard");
    cy.contains("마이페이지").should("exist");
  });
});
