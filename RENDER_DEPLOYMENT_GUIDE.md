# 🚀 Render 배포 완전 가이드

## 1. 사전 준비

### GitHub 저장소 준비

1. 현재 프로젝트를 GitHub에 푸시
2. 저장소를 Public으로 설정 (무료 플랜)

### Render 계정 생성

1. [render.com](https://render.com) 접속
2. GitHub 계정으로 로그인

## 2. PostgreSQL 데이터베이스 생성

### Render에서 데이터베이스 생성

1. Render 대시보드에서 "New +" 클릭
2. "PostgreSQL" 선택
3. 설정:
    - **Name**: `coffee-order-db`
    - **Database**: `coffee_order_db`
    - **User**: `coffee_user`
    - **Region**: 가장 가까운 지역 선택
    - **Plan**: Free (또는 원하는 플랜)

### 데이터베이스 연결 정보 확인

생성 후 다음 정보를 복사해두세요:

-   **External Database URL**: `postgresql://user:password@host:5432/database`

## 3. 백엔드 Web Service 배포

### Web Service 생성

1. Render 대시보드에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결

### Web Service 설정

```
Name: coffee-order-backend
Environment: Node
Region: 가장 가까운 지역
Branch: main
Root Directory: /
Build Command: cd server && npm install
Start Command: cd server && npm start
Instance Type: Free
```

### 환경 변수 설정

Web Service의 "Environment" 탭에서 다음 변수들을 추가:

```
DATABASE_URL=postgresql://your-render-db-user:your-render-db-password@your-render-db-host:5432/your-render-db-name
PORT=3001
NODE_ENV=production
```

## 4. 프론트엔드 Static Site 배포

### Static Site 생성

1. Render 대시보드에서 "New +" 클릭
2. "Static Site" 선택
3. GitHub 저장소 연결

### Static Site 설정

```
Name: coffee-order-frontend
Environment: Static Site
Region: 가장 가까운 지역
Branch: main
Root Directory: /
Build Command: cd ui && npm install && npm run build
Publish Directory: ui/dist
```

## 5. 프론트엔드 API URL 업데이트

### API URL 수정

`ui/src/services/api.js` 파일에서 다음을 수정:

```javascript
const API_BASE_URL = import.meta.env.PROD
    ? "https://your-backend-service-name.onrender.com/api" // 실제 백엔드 URL로 변경
    : "http://localhost:3001/api";
```

**중요**: `your-backend-service-name`을 실제 Render에서 생성한 백엔드 서비스 이름으로 변경하세요.

## 6. 배포 확인

### 백엔드 확인

1. 백엔드 서비스 URL 접속 (예: `https://coffee-order-backend.onrender.com`)
2. 다음 메시지가 표시되는지 확인:
    ```json
    {
        "message": "커피 주문 앱 서버가 정상적으로 실행 중입니다.",
        "timestamp": "2024-01-01T00:00:00.000Z"
    }
    ```

### 프론트엔드 확인

1. 프론트엔드 URL 접속 (예: `https://coffee-order-frontend.onrender.com`)
2. 메뉴가 정상적으로 로드되는지 확인
3. 주문 기능이 작동하는지 확인

## 7. 문제 해결

### 일반적인 문제들

#### 1. 빌드 실패

-   **원인**: 의존성 설치 실패
-   **해결**: `package.json`의 의존성 확인

#### 2. 데이터베이스 연결 실패

-   **원인**: DATABASE_URL 환경 변수 오류
-   **해결**: Render 데이터베이스 연결 정보 재확인

#### 3. CORS 오류

-   **원인**: 프론트엔드와 백엔드 도메인 불일치
-   **해결**: 백엔드 CORS 설정 확인

#### 4. API 호출 실패

-   **원인**: 프론트엔드 API URL 오류
-   **해결**: `api.js`의 API_BASE_URL 확인

### 로그 확인

1. Render 대시보드에서 각 서비스의 "Logs" 탭 확인
2. 오류 메시지 분석
3. 필요시 환경 변수 수정

## 8. 배포 후 관리

### 자동 배포

-   GitHub에 푸시할 때마다 자동으로 재배포됩니다
-   환경 변수는 수동으로 변경해야 합니다

### 데이터베이스 관리

-   Render 데이터베이스는 자동으로 백업됩니다
-   필요시 데이터베이스 스키마 재설정 가능

### 성능 최적화

-   무료 플랜의 경우 서비스가 일정 시간 후 슬립 모드로 전환됩니다
-   첫 요청 시 약간의 지연이 있을 수 있습니다

## 9. 최종 확인 체크리스트

-   [ ] GitHub 저장소가 Public으로 설정됨
-   [ ] PostgreSQL 데이터베이스가 생성됨
-   [ ] 백엔드 Web Service가 배포됨
-   [ ] 프론트엔드 Static Site가 배포됨
-   [ ] 환경 변수가 올바르게 설정됨
-   [ ] API URL이 올바르게 설정됨
-   [ ] 데이터베이스 스키마가 자동으로 생성됨
-   [ ] 프론트엔드에서 백엔드 API 호출이 정상 작동함

## 10. 배포 완료!

이제 전 세계 어디서나 접근 가능한 커피 주문 앱이 완성되었습니다! 🎉

### 접속 URL

-   **프론트엔드**: `https://your-frontend-name.onrender.com`
-   **백엔드 API**: `https://your-backend-name.onrender.com`
