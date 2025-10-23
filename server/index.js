const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { testConnection } = require("./config/database");
const { setupRenderDatabase } = require("./scripts/setupRenderDatabase");

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 라우트 설정
app.get("/", (req, res) => {
    res.json({
        message: "커피 주문 앱 서버가 정상적으로 실행 중입니다.",
        timestamp: new Date().toISOString(),
    });
});

// 데이터베이스 스키마 생성 엔드포인트 (수동 실행용)
app.post("/setup-database", async (req, res) => {
    try {
        console.log("수동 데이터베이스 스키마 생성 시작...");
        await setupRenderDatabase();
        res.json({
            success: true,
            message: "데이터베이스 스키마가 성공적으로 생성되었습니다.",
        });
    } catch (error) {
        console.error("데이터베이스 스키마 생성 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "DATABASE_SETUP_ERROR",
                message: "데이터베이스 스키마 생성 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

// API 라우트 설정
app.use("/api/menus", require("./routes/menus"));
app.use("/api/orders", require("./routes/orders"));

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "서버 내부 오류가 발생했습니다.",
            details: process.env.NODE_ENV === "development" ? err.message : {},
        },
    });
});

// 404 핸들링 - 모든 경로에 대해 적용
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "요청한 리소스를 찾을 수 없습니다.",
            details: {
                path: req.originalUrl,
                method: req.method,
            },
        },
    });
});

app.listen(PORT, async () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);

    try {
        // 데이터베이스 연결 테스트
        const isConnected = await testConnection();
        if (isConnected) {
            console.log("✅ 데이터베이스 연결이 성공적으로 설정되었습니다.");

            // Render 환경에서 데이터베이스 스키마 자동 설정
            if (process.env.NODE_ENV === "production") {
                console.log(
                    "🚀 Render 환경에서 데이터베이스 스키마 설정 중..."
                );
                await setupRenderDatabase();
                console.log("✅ 데이터베이스 스키마 설정 완료");
            }
        } else {
            console.log(
                "❌ 데이터베이스 연결에 실패했습니다. .env 파일을 확인해주세요."
            );
        }
    } catch (error) {
        console.error("서버 시작 중 오류:", error);
    }
});
