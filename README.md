# Clothing-Fit · Frontend

**Clothing-Fit**은 사용자 체형 데이터를 기반으로 2D·3D 가상 피팅과 OOTD 공유를 제공하는 **모바일 앱**입니다.  
이 저장소는 **프론트엔드(React Native)** 전용이며, Google Play 출시를 목표로 합니다.

---

## 발표 영상

https://github.com/user-attachments/assets/e955b5d7-457e-48b0-9d3d-032ac2b9eb17

> 원본 화질(37MB): [docs/발표자료.mp4](docs/발표자료.mp4)

---

## 기술 스택

| 구분       | 사용                                                   |
| ---------- | ------------------------------------------------------ |
| 프레임워크 | React Native, **Expo SDK 54**, **TypeScript**          |
| 라우팅     | Expo Router (`app/`)                                   |
| 스타일     | NativeWind (Tailwind CSS)                              |
| API        | Axios, TanStack Query, Orval                           |
| 주요 기능  | WebView(쇼핑몰 COPY), SSE(피팅 진행), SecureStore(JWT) |

> 웹용 CRA/Vite가 아니라 **Expo + Metro**로 빌드하는 **앱 프로젝트**입니다.

---

## 시작하기

```bash
npm install
cp .env.example .env    # EXPO_PUBLIC_API_URL 입력
npm start               # 개발 서버 → Expo Go (SDK 54) QR 스캔
```

> **Expo SDK 54** — App Store **Expo Go**와 호환됩니다. 시뮬레이터: `npm run ios` / `npm run android`.  
> WebView COPY **화면 캡처**는 Expo Go에서 제한될 수 있어 **EAS development build** 실기기 테스트를 권장합니다.

**Mock UI 뼈대** — 와이어 기준 화면·탭 연결, `src/mocks/` 데이터. [MOCK_SKELETON.md](./docs/MOCK_SKELETON.md)

| 명령                   | 설명                    |
| ---------------------- | ----------------------- |
| `npm run android`      | Android 에뮬레이터      |
| `npm run ios`          | iOS 시뮬레이터          |
| `npm run lint`         | ESLint                  |
| `npm run format`       | Prettier 전체 포맷      |
| `npm run generate:api` | Orval (BE Swagger 필요) |

**Git hooks (Husky)** — `git commit` 시 스테이징된 파일에 ESLint + Prettier 자동 실행. 최초 clone 후 `npm install` 필수.

---

## 디렉토리 구조

```
clothing-fit-fe/
├── app/                    # 화면 경로 (Expo Router) — 로직은 최소화
│   ├── (auth)/             # 로그인 · 회원가입
│   └── (tabs)/             # 메인 하단 탭
│       ├── fitting/        # 가상 피팅 · 옷장
│       ├── explore/        # 쇼핑몰 WebView COPY (+ crop)
│       ├── feed/           # OOTD 소셜 피드
│       └── profile/        # 마이 · 체형 · 설정
│
├── src/                    # 실제 앱 코드 (TypeScript)
│   ├── components/
│   │   ├── ui/             # 공통 최소 UI (Button, Input 등)
│   │   └── blocks/         # 여러 화면에서 쓰는 UI 조각
│   ├── features/           # 기능 단위 (API · hooks · screens)
│   │   ├── webview/        # 쇼핑몰 COPY, 스크래핑, 카테고리 사이드바
│   │   ├── fitting/        # 2D/3D AI 피팅, SSE
│   │   ├── closet/         # 스마트 옷장
│   │   ├── profile/        # 프로필 · 체형
│   │   ├── feed/           # OOTD 피드
│   │   └── auth/           # 인증
│   ├── lib/                # API 클라이언트, 토큰, env
│   ├── providers/          # QueryClient 등 전역 Provider
│   ├── constants/          # 라우트, 색상 등 상수
│   ├── hooks/              # 앱 전역 hooks
│   ├── types/              # 타입 (Orval 생성물 포함)
│   └── utils/              # 순수 유틸 함수
│
├── assets/                 # 이미지, 폰트
├── docs/                   # STRUCTURE, ROADMAP 등 상세 문서
├── app.json                # Expo 앱 설정
├── eas.json                # Play 스토어 빌드 (EAS)
├── metro.config.js         # Metro 번들러 설정
└── tailwind.config.js      # NativeWind / Tailwind 설정
```

### 폴더 역할 요약

| 폴더                  | 설명                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| **`app/`**            | URL·탭·스택만 정의. 화면 본문은 `src/features/.../screens`에서 import |
| **`src/features/`**   | 기능별 코드. `api`, `hooks`, `components`, `screens`로 구분           |
| **`src/components/`** | 여러 feature가 공유하는 UI                                            |
| **`src/lib/`**        | HTTP, JWT 저장, 환경 변수 등 인프라                                   |

### `app/` ↔ 기능 매핑

| 탭·경로          | feature             | 설명                                          |
| ---------------- | ------------------- | --------------------------------------------- |
| `(tabs)/explore` | `webview`           | 이커머스 WebView, COPY, crop, inject 스크래핑 |
| `(tabs)/fitting` | `fitting`, `closet` | AI 피팅, 옷장                                 |
| `(tabs)/feed`    | `feed`              | OOTD 그리드 · 좋아요 · 댓글                   |
| `(tabs)/profile` | `profile`           | 마이페이지, 체형 정보                         |
| `(auth)/`        | `auth`              | 로그인 · 회원가입                             |

### 코딩 규칙 (팀)

- 화면 파일: `app/**/*.tsx`는 **얇게** — `export default` + Screen import만
- import 경로: `@/features/...`, `@/components/...` (`src/` 기준)
- 새 기능은 `src/features/{기능명}/` 아래에 추가

---

## 담당 (MVP)

| feature          | 담당   |
| ---------------- | ------ |
| WebView, Fitting | 이지환 |
| Feed, Closet     | 양희진 |
| Login, Homepage  | 김인수 |

상세 스프린트·서포트 규칙: [docs/SPRINT_PLAN.md](./docs/SPRINT_PLAN.md)

---

## 환경 변수

`.env.example` 참고.

```env
EXPO_PUBLIC_API_URL=https://api.example.com
```

`.env`는 Git에 올리지 않습니다.

---

## 더 보기

- [docs/STRUCTURE.md](./docs/STRUCTURE.md) — 구조·COPY 플로우 상세
- [docs/ROADMAP.md](./docs/ROADMAP.md) — 작업 로드맵
