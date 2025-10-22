const express = require("express");
const router = express.Router();

// 임시 메뉴 데이터 (실제로는 데이터베이스에서 조회)
const menus = [
    {
        id: 1,
        name: "아메리카노(ICE)",
        description: "깔끔한 에스프레소와 차가운 물의 조화",
        price: 4000,
        image_url: "/images/americano-ice.jpg",
        stock: 10,
        options: [
            { id: 1, name: "샷 추가", price: 500 },
            { id: 2, name: "시럽 추가", price: 0 },
        ],
    },
    {
        id: 2,
        name: "아메리카노(HOT)",
        description: "따뜻한 에스프레소와 뜨거운 물의 조화",
        price: 4000,
        image_url: "/images/americano-hot.jpg",
        stock: 10,
        options: [
            { id: 1, name: "샷 추가", price: 500 },
            { id: 2, name: "시럽 추가", price: 0 },
        ],
    },
    {
        id: 3,
        name: "카페라떼",
        description: "부드러운 우유 거품이 올라간 에스프레소",
        price: 5000,
        image_url: "/images/cafelatte.jpg",
        stock: 10,
        options: [
            { id: 1, name: "샷 추가", price: 500 },
            { id: 2, name: "시럽 추가", price: 0 },
        ],
    },
];

// GET /api/menus - 메뉴 목록 조회
router.get("/", (req, res) => {
    try {
        res.json({
            success: true,
            data: menus,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "MENUS_FETCH_ERROR",
                message: "메뉴 목록을 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

// GET /api/menus/:id - 특정 메뉴 조회
router.get("/:id", (req, res) => {
    try {
        const menuId = parseInt(req.params.id);
        const menu = menus.find((m) => m.id === menuId);

        if (!menu) {
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
            data: menu,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "MENU_FETCH_ERROR",
                message: "메뉴 정보를 불러오는 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

// PUT /api/menus/:id/stock - 재고 수량 수정
router.put("/:id/stock", (req, res) => {
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

        const menuIndex = menus.findIndex((m) => m.id === menuId);
        if (menuIndex === -1) {
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
        menus[menuIndex].stock = stock;

        res.json({
            success: true,
            data: {
                id: menuId,
                stock: stock,
                message: "재고가 성공적으로 업데이트되었습니다.",
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "STOCK_UPDATE_ERROR",
                message: "재고 수량 업데이트 중 오류가 발생했습니다.",
                details: error.message,
            },
        });
    }
});

module.exports = router;
