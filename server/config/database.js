const { Pool } = require("pg");
require("dotenv").config();

// PostgreSQL 연결 풀 생성
const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        `postgresql://${process.env.DB_USER || "postgres"}:${
            process.env.DB_PASSWORD
        }@${process.env.DB_HOST || "localhost"}:${
            process.env.DB_PORT || 5432
        }/${process.env.DB_NAME || "coffee_order_app"}`,
    ssl: process.env.NODE_ENV === "production" ? {
        rejectUnauthorized: false,
        sslmode: 'require',
        ssl: true
    } : false,
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MILLIS) || 30000,
    connectionTimeoutMillis:
        parseInt(process.env.DB_CONNECTION_TIMEOUT_MILLIS) || 2000,
});

// 연결 테스트
pool.on("connect", () => {
    console.log("PostgreSQL 데이터베이스에 연결되었습니다.");
});

pool.on("error", (err) => {
    console.error("PostgreSQL 연결 오류:", err);
});

// 데이터베이스 연결 테스트 함수
const testConnection = async () => {
    try {
        console.log("데이터베이스 연결 테스트 시작...");
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("DATABASE_URL 존재:", !!process.env.DATABASE_URL);
        
        const client = await pool.connect();
        const result = await client.query("SELECT NOW()");
        console.log("데이터베이스 연결 성공:", result.rows[0]);
        client.release();
        return true;
    } catch (err) {
        console.error("데이터베이스 연결 실패:", err.message);
        console.error("오류 상세:", err);
        return false;
    }
};

module.exports = {
    pool,
    testConnection,
};
