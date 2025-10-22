# 커피 주문 앱 백엔드 서버

Express.js를 사용한 커피 주문 앱의 백엔드 서버입니다.

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 프로덕션 서버 실행

```bash
npm start
```

## API 엔드포인트

### 메뉴 관련 API

-   `GET /api/menus` - 메뉴 목록 조회
-   `GET /api/menus/:id` - 특정 메뉴 조회
-   `PUT /api/menus/:id/stock` - 재고 수량 수정

### 주문 관련 API

-   `GET /api/orders` - 주문 목록 조회
-   `GET /api/orders/:id` - 특정 주문 조회
-   `POST /api/orders` - 새 주문 생성
-   `PUT /api/orders/:id/status` - 주문 상태 변경

## 환경 변수

서버 포트와 환경을 설정하려면 `.env` 파일을 생성하여 다음 변수를 설정하세요:

```
PORT=3001
NODE_ENV=development
```

## 개발 정보

-   Node.js 버전: 19.0.1+
-   Express.js 버전: 5.1.0
-   포트: 3001 (기본값)
