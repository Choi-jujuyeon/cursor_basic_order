const { Client } = require("pg");
require("dotenv").config();

// 데이터베이스 생성 함수
const createDatabase = async () => {
    // 먼저 기본 postgres 데이터베이스에 연결
    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        database: "postgres", // 기본 데이터베이스
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
    });

    try {
        await client.connect();
        console.log("PostgreSQL 서버에 연결되었습니다.");

        const dbName = process.env.DB_NAME || "coffee_order_app";

        // 데이터베이스 존재 여부 확인
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );

        if (result.rows.length === 0) {
            // 데이터베이스 생성
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(
                `✅ 데이터베이스 '${dbName}'가 성공적으로 생성되었습니다.`
            );
        } else {
            console.log(`ℹ️  데이터베이스 '${dbName}'가 이미 존재합니다.`);
        }
    } catch (error) {
        console.error("데이터베이스 생성 중 오류 발생:", error.message);
        throw error;
    } finally {
        await client.end();
    }
};

// 스크립트가 직접 실행될 때만 createDatabase 실행
if (require.main === module) {
    createDatabase()
        .then(() => {
            console.log("🎉 데이터베이스 생성이 완료되었습니다!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ 데이터베이스 생성 실패:", error.message);
            process.exit(1);
        });
}

module.exports = { createDatabase };
