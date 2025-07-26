describe("메인페이지 진입", () => {
  it("메인페이지 진입 확인", () => {
    cy.visit("/");
    cy.contains("Test Case AI");
  });


});
