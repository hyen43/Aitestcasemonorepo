# Figma Plugi - AI Test Case Generator

피그마에서 텍스트를 선택하면, 그 내용을 읽고 **AI가 테스트 케이스를 자동 생성**해주는 플러그인입니다.  
테스트 케이스 작성을 자동화하여 기획자와 QA의 업무 시간을 절감하는 것을 목표로 합니다.

---

## 🚀 프로젝트 개요

| 항목      | 내용                                                                 |
| --------- | -------------------------------------------------------------------- |
| 목적      | 테스트 케이스 자동 생성을 통해 QA/기획 업무 효율화                   |
| 주요 기능 | Figma 텍스트 추출 → AI로 테스트 케이스 생성                          |
| 기술 스택 | Figma Plugin API, React, Firebase, PortOne(PG), Cypress              |
| 아키텍처  | **Figma Plugin ↔ Login/Payment WebApp ↔ Node.js Backend ↔ Firebase** |

---

## 🧩 전체 아키텍처 구성

```text
[사용자]
   ↓
[Figma Plugin]
   └─ 텍스트 추출 및 AI 요청
   ↓
[WebApp (로그인/결제 대시보드)]
   └─ Firebase 인증 및 사용자 credit 관리
   ↓
[Backend Server (Node.js + Express)]
   └─ PortOne PG 결제 처리, 인증키 발급
   ↓
[Firebase (Auth + Firestore)]
   └─ 사용자 및 라이선스 정보 저장
```

## 주요 구현 기능

### 1. Figma Plugin

- webpack-react 템플릿 기반으로 초기 구성
- 텍스트 description 선택 → AI 요청 버튼 제공
- 로그인 상태/credit에 따라 사용 가능 여부 판단
- figma.clientStorage로 라이선스 키 저장 및 확인

### 2. Firebase + WebApp

- Firebase Authentication을 통한 간편 로그인
- 로그인 시 유저 UID 기반으로 Firestore에 사용자 정보 저장
- credit을 기준으로 기능 활성화 제어

### 3. PortOne 결제 연동

- PortOne 결제 모듈을 WebApp에 연동 (Toss 결제창)
- 결제 완료 후 /api/payment/complete API 호출 → 인증 키 생성 및 Firestore 업데이트

### 4. Cypress 기반 테스트 자동화

✅ 주요 시나리오

1. 페이지 진입 -> 메인 화면 노출
2. 구글 로그인 클릭 -> 로그인 팝업 노출
3. 최초 로그인 credit=0 → /payment 이동
4. 기존 회원의 경우 -> /dashboard 이동
5. /payment 에서 결제 성공 > /dashboard 이동
6. 로그아웃 -> 로그인 화면으로 복귀

## ❌ 배포 보류 이유

이 프로젝트는 실제로 결제까지 가능한 end-to-end 구조를 완성했지만, 아래의 이유로 최종 상용 배포는 보류 중입니다.

1. 개인사업자 등록 필요: PortOne 결제 연동을 위해서는 사업자 등록이 필수
2. MVP 단계: 사용자 반응 검토 전 비용 발생 구조 도입은 리스크가 큼

## 📈 단계적 확장 계획

- 1단계 Figma Plugin MVP 출시 - 텍스트 선택 → 테스트 케이스 출력 기능
- 2단계 사용자 피드백 수집 및 리텐션 분석
- 3단계 사용량이 증가할 경우, PG 결제 연동 기능 재활성화
- 4단계 토큰 기반 유료 과금 모델 + 웹앱 정식 배포

## 🛠 기술 스택

- Frontend

  - Figma Plugin API
  - React, TypeScript
  - Firebase Hosting + Next.js (로그인/결제 대시보드)

- Backend

  - Node.js + Express
  - Firebase Admin SDK
  - PortOne PG 연동 API

- Infra
  - Firebase Auth & Firestore
  - Turborepo 기반 모노레포 구성
  - Cypress (E2E 테스트 자동화)

## 📁 디렉토리 구조 (모노레포 기준)

```
aiautotestcasemonorepo/
  └─ plugin(front)/         # Figma Plugin (React)
  └─ web(test-case-ai-mvp)/ # 로그인/결제 Web App (Next.js)
    └─cypress/
      └─ e2e/
  └─ server/         # 결제/인증키 발급 서버 (Express)
```
