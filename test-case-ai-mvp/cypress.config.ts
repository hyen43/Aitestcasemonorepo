import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000", // 테스트할 앱의 URL
    supportFile: "cypress/support/e2e.ts", // support 파일 경로
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}", // 테스트 파일 위치
    setupNodeEvents(on, config) {
      // 필요한 Node 이벤트 설정 가능
      return config;
    },
  },
});
