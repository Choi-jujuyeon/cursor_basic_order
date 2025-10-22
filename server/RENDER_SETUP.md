# Render PostgreSQL 데이터베이스 설정 가이드

## 1. Render에서 PostgreSQL 데이터베이스 생성

1. Render 대시보드에 로그인
2. "New +" 버튼 클릭
3. "PostgreSQL" 선택
4. 데이터베이스 설정:
    - Name: coffee-order-db
    - Database: coffee_order_db
    - User: coffee_user
    - Region: 선택 (가까운 지역)
    - Plan: Free (또는 원하는 플랜)

## 2. 환경 변수 설정

Render에서 생성된 데이터베이스의 연결 정보를 확인하고 다음 환경 변수를 설정하세요:

### 로컬 개발용 (.env 파일)

```env
# Render PostgreSQL Database Configuration
DB_HOST=your-render-db-host
DB_PORT=5432
DB_NAME=your-render-db-name
DB_USER=your-render-db-user
DB_PASSWORD=your-render-db-password
DATABASE_URL=postgresql://your-render-db-user:your-render-db-password@your-render-db-host:5432/your-render-db-name

# Server Configuration
PORT=3001
NODE_ENV=production
```

### Render 배포용 (Environment Variables)

Render 웹 서비스의 Environment Variables에서 다음을 설정:

```
DATABASE_URL=postgresql://your-render-db-user:your-render-db-password@your-render-db-host:5432/your-render-db-name
PORT=3001
NODE_ENV=production
```

## 3. 데이터베이스 스키마 설정

### 로컬에서 실행:

```bash
cd server
npm run setup-render
```

### Render에서 자동 실행:

서버가 시작될 때 자동으로 데이터베이스 스키마가 설정됩니다.

## 4. 데이터베이스 테이블 구조

### Menus 테이블

-   id (SERIAL PRIMARY KEY)
-   name (VARCHAR(255) UNIQUE)
-   description (TEXT)
-   price (INTEGER)
-   image_url (VARCHAR(255))
-   stock (INTEGER)
-   created_at, updated_at (TIMESTAMP)

### Options 테이블

-   id (SERIAL PRIMARY KEY)
-   menu_id (INTEGER REFERENCES menus(id))
-   name (VARCHAR(255))
-   price (INTEGER)
-   created_at, updated_at (TIMESTAMP)

### Orders 테이블

-   id (SERIAL PRIMARY KEY)
-   order_time (TIMESTAMP)
-   total_amount (INTEGER)
-   status (ENUM: 'RECEIVED', 'MAKING', 'COMPLETED')
-   created_at, updated_at (TIMESTAMP)

### Order_Items 테이블

-   id (SERIAL PRIMARY KEY)
-   order_id (INTEGER REFERENCES orders(id))
-   menu_id (INTEGER REFERENCES menus(id))
-   quantity (INTEGER)
-   unit_price (INTEGER)
-   options (JSONB)
-   created_at, updated_at (TIMESTAMP)

## 5. 초기 데이터

스크립트 실행 시 다음 메뉴들이 자동으로 추가됩니다:

-   아메리카노 (4,000원)
-   카페라떼 (5,000원)
-   카푸치노 (5,000원)
-   카라멜 마키아토 (6,000원)

각 메뉴마다 다음 옵션들이 추가됩니다:

-   ICE (0원)
-   HOT (0원)
-   샷 추가 (+500원)
-   시럽 추가 (0원)

## 6. 문제 해결

### 연결 오류 시:

1. DATABASE_URL이 올바른지 확인
2. Render 데이터베이스가 실행 중인지 확인
3. 방화벽 설정 확인

### SSL 오류 시:

스크립트에서 `ssl: { rejectUnauthorized: false }` 설정이 포함되어 있습니다.

### 테이블 생성 오류 시:

기존 테이블을 삭제하고 다시 생성하도록 스크립트가 작성되어 있습니다.
