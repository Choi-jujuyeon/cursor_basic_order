const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

// GET /api/menus - 메뉴 목록 조회
router.get("/", async (req, res) => {
    let client;
    
    try {
        console.log("메뉴 조회 시작 - 데이터베이스 연결 시도...");
        
        // 데이터베이스 연결 테스트
        client = await pool.connect();
        console.log("데이터베이스 연결 성공");
        
        // 연결 테스트 쿼리
        await client.query("SELECT 1");
        console.log("데이터베이스 쿼리 테스트 성공");
        
        // 메뉴와 옵션을 함께 조회
        const query = `
            SELECT 
                m.id,
                m.name,
                m.description,
                m.price,
                m.image_url,
                m.stock,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', o.id,
                            'name', o.name,
                            'price', o.price
                        )
                    ) FILTER (WHERE o.id IS NOT NULL),
                    '[]'::json
                ) as options
            FROM menus m
            LEFT JOIN options o ON m.id = o.menu_id
            GROUP BY m.id, m.name, m.description, m.price, m.image_url, m.stock
            ORDER BY m.id
        `;

        console.log("메뉴 조회 쿼리 실행 중...");
        const result = await client.query(query);
        console.log(`메뉴 조회 성공: ${result.rows.length}개 메뉴`);

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("메뉴 조회 오류:", error);
        console.error("오류 상세:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            error: {
                code: "MENUS_FETCH_ERROR",
                message: "메뉴 목록을 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        if (client) {
            client.release();
            console.log("데이터베이스 연결 해제");
        }
    }
});

// GET /api/menus/:id - 특정 메뉴 조회
router.get("/:id", async (req, res) => {
    const client = await pool.connect();

    try {
        const menuId = parseInt(req.params.id);

        const query = `
            SELECT 
                m.id,
                m.name,
                m.description,
                m.price,
                m.image_url,
                m.stock,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', o.id,
                            'name', o.name,
                            'price', o.price
                        )
                    ) FILTER (WHERE o.id IS NOT NULL),
                    '[]'::json
                ) as options
            FROM menus m
            LEFT JOIN options o ON m.id = o.menu_id
            WHERE m.id = $1
            GROUP BY m.id, m.name, m.description, m.price, m.image_url, m.stock
        `;

        const result = await client.query(query, [menuId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MENU_NOT_FOUND",
                    message: "요청한 메뉴를 찾을 수 없습니다.",
                    details: { menuId },
                },
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("메뉴 조회 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "MENU_FETCH_ERROR",
                message: "메뉴 정보를 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        client.release();
    }
});

// PUT /api/menus/:id/stock - 재고 수량 수정
router.put("/:id/stock", async (req, res) => {
    const client = await pool.connect();

    try {
        const menuId = parseInt(req.params.id);
        const { stock } = req.body;

        // 요청 데이터 검증
        if (typeof stock !== "number" || stock < 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_STOCK_VALUE",
                    message: "재고 수량은 0 이상의 숫자여야 합니다.",
                    details: { stock },
                },
            });
        }

        // 메뉴 존재 여부 확인
        const checkQuery = "SELECT id FROM menus WHERE id = $1";
        const checkResult = await client.query(checkQuery, [menuId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "MENU_NOT_FOUND",
                    message: "요청한 메뉴를 찾을 수 없습니다.",
                    details: { menuId },
                },
            });
        }

        // 재고 수량 업데이트
        const updateQuery = `
            UPDATE menus 
            SET stock = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING id, stock
        `;

        const result = await client.query(updateQuery, [stock, menuId]);

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                stock: result.rows[0].stock,
                message: "재고가 성공적으로 업데이트되었습니다.",
            },
        });
    } catch (error) {
        console.error("재고 업데이트 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "STOCK_UPDATE_ERROR",
                message: "재고 수량 업데이트 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        client.release();
    }
});

module.exports = router;
