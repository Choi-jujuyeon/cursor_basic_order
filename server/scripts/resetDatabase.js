const { pool } = require("../config/database");
require("dotenv").config();

async function resetDatabase() {
    const client = await pool.connect();

    try {
        console.log("기존 데이터를 삭제하는 중...");

        // 외래키 제약조건 때문에 순서대로 삭제
        await client.query("DELETE FROM order_items");
        console.log("✅ order_items 테이블 데이터 삭제 완료");

        await client.query("DELETE FROM orders");
        console.log("✅ orders 테이블 데이터 삭제 완료");

        await client.query("DELETE FROM options");
        console.log("✅ options 테이블 데이터 삭제 완료");

        await client.query("DELETE FROM menus");
        console.log("✅ menus 테이블 데이터 삭제 완료");

        console.log("🎉 모든 데이터가 삭제되었습니다!");
    } catch (error) {
        console.error("❌ 데이터 삭제 실패:", error);
        throw error;
    } finally {
        client.release();
    }
}

// 스크립트가 직접 실행될 때만 resetDatabase 실행
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log("데이터베이스 초기화가 완료되었습니다!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("데이터베이스 초기화 실패:", error.message);
            process.exit(1);
        });
}

module.exports = { resetDatabase };
