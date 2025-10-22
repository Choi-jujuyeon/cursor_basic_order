const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

// GET /api/orders - 주문 목록 조회
router.get("/", async (req, res) => {
    const client = await pool.connect();

    try {
        const query = `
            SELECT 
                o.id,
                o.order_time,
                o.status,
                o.total_amount,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'menu_id', oi.menu_id,
                            'menu_name', m.name,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'options', oi.options
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menus m ON oi.menu_id = m.id
            GROUP BY o.id, o.order_time, o.status, o.total_amount
            ORDER BY o.order_time DESC
        `;

        const result = await client.query(query);

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error("주문 조회 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "ORDERS_FETCH_ERROR",
                message: "주문 목록을 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        client.release();
    }
});

// GET /api/orders/:id - 특정 주문 조회
router.get("/:id", async (req, res) => {
    const client = await pool.connect();

    try {
        const orderId = parseInt(req.params.id);

        const query = `
            SELECT 
                o.id,
                o.order_time,
                o.status,
                o.total_amount,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', oi.id,
                            'menu_id', oi.menu_id,
                            'menu_name', m.name,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'options', oi.options
                        )
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN menus m ON oi.menu_id = m.id
            WHERE o.id = $1
            GROUP BY o.id, o.order_time, o.status, o.total_amount
        `;

        const result = await client.query(query, [orderId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "ORDER_NOT_FOUND",
                    message: "요청한 주문을 찾을 수 없습니다.",
                    details: { orderId },
                },
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("주문 조회 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "ORDER_FETCH_ERROR",
                message: "주문 정보를 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        client.release();
    }
});

// POST /api/orders - 새 주문 생성
router.post("/", async (req, res) => {
    const client = await pool.connect();

    try {
        const { items, total_amount } = req.body;

        // 요청 데이터 검증
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_ITEMS",
                    message: "주문할 상품이 필요합니다.",
                    details: { items },
                },
            });
        }

        if (
            !total_amount ||
            typeof total_amount !== "number" ||
            total_amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_TOTAL_AMOUNT",
                    message: "올바른 총 금액이 필요합니다.",
                    details: { total_amount },
                },
            });
        }

        // 트랜잭션 시작
        await client.query("BEGIN");

        try {
            // 주문 생성
            const orderQuery = `
                INSERT INTO orders (total_amount, status)
                VALUES ($1, 'RECEIVED')
                RETURNING id, order_time, status, total_amount
            `;

            const orderResult = await client.query(orderQuery, [total_amount]);
            const orderId = orderResult.rows[0].id;

            // 주문 아이템들 생성
            for (const item of items) {
                const itemQuery = `
                    INSERT INTO order_items (order_id, menu_id, quantity, unit_price, options)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                `;

                await client.query(itemQuery, [
                    orderId,
                    item.menu_id,
                    item.quantity,
                    item.unit_price,
                    JSON.stringify(item.options || []),
                ]);
            }

            // 트랜잭션 커밋
            await client.query("COMMIT");

            // 생성된 주문 정보 조회
            const finalQuery = `
                SELECT 
                    o.id,
                    o.order_time,
                    o.status,
                    o.total_amount,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', oi.id,
                                'menu_id', oi.menu_id,
                                'menu_name', m.name,
                                'quantity', oi.quantity,
                                'unit_price', oi.unit_price,
                                'options', oi.options
                            )
                        ) FILTER (WHERE oi.id IS NOT NULL),
                        '[]'::json
                    ) as items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN menus m ON oi.menu_id = m.id
                WHERE o.id = $1
                GROUP BY o.id, o.order_time, o.status, o.total_amount
            `;

            const finalResult = await client.query(finalQuery, [orderId]);

            res.status(201).json({
                success: true,
                data: finalResult.rows[0],
                message: "주문이 성공적으로 생성되었습니다.",
            });
        } catch (error) {
            // 트랜잭션 롤백
            await client.query("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("주문 생성 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "ORDER_CREATE_ERROR",
                message: "주문 생성 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        client.release();
    }
});

// PUT /api/orders/:id/status - 주문 상태 변경
router.put("/:id/status", async (req, res) => {
    const client = await pool.connect();

    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;

        // 유효한 상태 값 검증
        const validStatuses = ["RECEIVED", "MAKING", "COMPLETED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "INVALID_STATUS",
                    message: "올바르지 않은 주문 상태입니다.",
                    details: {
                        status,
                        validStatuses,
                    },
                },
            });
        }

        // 주문 존재 여부 확인
        const checkQuery = "SELECT id FROM orders WHERE id = $1";
        const checkResult = await client.query(checkQuery, [orderId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "ORDER_NOT_FOUND",
                    message: "요청한 주문을 찾을 수 없습니다.",
                    details: { orderId },
                },
            });
        }

        // 주문 상태 업데이트
        const updateQuery = `
            UPDATE orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING id, status
        `;

        const result = await client.query(updateQuery, [status, orderId]);

        res.json({
            success: true,
            data: {
                id: result.rows[0].id,
                status: result.rows[0].status,
                message: "주문 상태가 성공적으로 업데이트되었습니다.",
            },
        });
    } catch (error) {
        console.error("주문 상태 업데이트 오류:", error);
        res.status(500).json({
            success: false,
            error: {
                code: "STATUS_UPDATE_ERROR",
                message: "주문 상태 업데이트 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    } finally {
        client.release();
    }
});

module.exports = router;
