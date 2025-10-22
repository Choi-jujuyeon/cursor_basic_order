const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}`);
});
