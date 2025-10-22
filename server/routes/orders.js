const express = require("express");
const router = express.Router();

// 임시 메뉴 데이터 (메뉴 이름 조회용)
const menuData = {
    1: { name: "아메리카노(ICE)" },
    2: { name: "아메리카노(HOT)" },
    3: { name: "카페라떼" },
};

// 임시 주문 데이터 (실제로는 데이터베이스에서 관리)
let orders = [
    {
        id: 1,
        order_time: "2024-07-31T13:00:00.000Z",
        status: "RECEIVED",
        total_amount: 4000,
        items: [
            {
                id: 1001,
                menu_id: 1,
                quantity: 1,
                unit_price: 4000,
                options: [],
            },
        ],
    },
];
let nextOrderId = 2;

// GET /api/orders - 주문 목록 조회
router.get("/", (req, res) => {
    try {
        // 최신 주문부터 정렬하고 메뉴 이름 포함
        const sortedOrders = [...orders]
            .sort((a, b) => new Date(b.order_time) - new Date(a.order_time))
            .map((order) => ({
                ...order,
                items: order.items.map((item) => ({
                    ...item,
                    menu_name:
                        menuData[item.menu_id]?.name || "알 수 없는 메뉴",
                })),
            }));

        res.json({
            success: true,
            data: sortedOrders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "ORDERS_FETCH_ERROR",
                message: "주문 목록을 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

// GET /api/orders/:id - 특정 주문 조회
router.get("/:id", (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = orders.find((o) => o.id === orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "ORDER_NOT_FOUND",
                    message: "요청한 주문을 찾을 수 없습니다.",
                    details: { orderId },
                },
            });
        }

        // 메뉴 이름 포함하여 응답
        const orderWithMenuNames = {
            ...order,
            items: order.items.map((item) => ({
                ...item,
                menu_name: menuData[item.menu_id]?.name || "알 수 없는 메뉴",
            })),
        };

        res.json({
            success: true,
            data: orderWithMenuNames,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "ORDER_FETCH_ERROR",
                message: "주문 정보를 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

// POST /api/orders - 새 주문 생성
router.post("/", (req, res) => {
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

        // 주문 생성
        const newOrder = {
            id: nextOrderId++,
            order_time: new Date().toISOString(),
            status: "RECEIVED",
            total_amount: total_amount,
            items: items.map((item) => ({
                id: Date.now() + Math.random(), // 임시 ID
                menu_id: item.menu_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                options: item.options || [],
            })),
        };

        // 주문 목록에 추가
        orders.push(newOrder);

        res.status(201).json({
            success: true,
            data: newOrder,
            message: "주문이 성공적으로 생성되었습니다.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "ORDER_CREATE_ERROR",
                message: "주문 생성 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

// PUT /api/orders/:id/status - 주문 상태 변경
router.put("/:id/status", (req, res) => {
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

        const orderIndex = orders.findIndex((o) => o.id === orderId);
        if (orderIndex === -1) {
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
        orders[orderIndex].status = status;

        res.json({
            success: true,
            data: {
                id: orderId,
                status: status,
                message: "주문 상태가 성공적으로 업데이트되었습니다.",
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "STATUS_UPDATE_ERROR",
                message: "주문 상태 업데이트 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

module.exports = router;
