describe("로그인 시나리오 테스트", () => {
  it("구글 로그인 버튼 클릭 시 Google OAuth 페이지로 리디렉션되는지 확인", () => {
    cy.visit("/");
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get('[data-cy="google-login-btn"]').click();
    cy.get("@windowOpen").should(
      "be.calledWithMatch",
      /firebaseapp\.com\/__\/auth\/handler/
    );
  });

  it("credit 이 0인 유저는 payments로 이동", () => {
    cy.visit("/payment", {
      onBeforeLoad(win) {
        win.Cypress = win.Cypress || {};
        win.Cypress.mockUser = {
          uid: "new_user_000",
          email: "newuser@example.com",
          credit: 0, // ✅ 최초 가입자
        };
      },
    });

    cy.url().should("include", "/payment");
    cy.contains("AS-IS");

    //로그아웃 버튼 클릭
    cy.get('[data-cy="logout-btn"]').click();

    // ✅ 로그아웃 후 로그인 페이지로 이동했는지 확인
    cy.url().should("include", "/");
    cy.contains("AI가 10초 만에 테스트 케이스를 자동으로 만들어줘요!");
  });

  it("credit이 있는 유저의 경우 dashboard로 이동", () => {
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        win.Cypress = win.Cypress || {};
        win.Cypress.mockUser = {
          uid: "existing_user_123",
          email: "user@example.com",
          credit: 5, // ✅ 기존 가입자
        };
      },
    });
    cy.url().should("include", "/dashboard");
    cy.contains("마이페이지");

    // ✅ 로그아웃
    cy.get('[data-cy="logout-btn"]').click();
    // 로그인 페이지로 이동했는지 확인
    cy.url().should("include", "/");
    cy.contains("AI가 10초 만에 테스트 케이스를 자동으로 만들어줘요!");
  });
});
