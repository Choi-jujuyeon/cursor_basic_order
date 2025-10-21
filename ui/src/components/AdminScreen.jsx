import React, { useState, useEffect } from "react";

// 메뉴 데이터 (주문하기 화면과 동일)
const menuItems = [
    {
        id: 1,
        name: "아메리카노(ICE)",
        price: 4000,
    },
    {
        id: 2,
        name: "아메리카노(HOT)",
        price: 4000,
    },
    {
        id: 3,
        name: "카페라떼",
        price: 5000,
    },
];

// 주문 상태 정의
const ORDER_STATUS = {
    RECEIVED: "주문 접수",
    MAKING: "제조 중",
    COMPLETED: "제조 완료",
};

function AdminScreen({ orders = [], setOrders }) {
    // 재고 상태 관리
    const [inventory, setInventory] = useState({
        1: { name: "아메리카노(ICE)", stock: 10 },
        2: { name: "아메리카노(HOT)", stock: 10 },
        3: { name: "카페라떼", stock: 10 },
    });

    // 주문 상태 관리 - props로 받은 orders 사용, 기본값으로 테스트 주문 1개
    const [localOrders, setLocalOrders] = useState(
        orders.length > 0
            ? orders
            : [
                  {
                      id: 1,
                      orderTime: new Date("2024-07-31T13:00:00"),
                      items: [
                          {
                              menuId: 1,
                              name: "아메리카노(ICE)",
                              quantity: 1,
                              price: 4000,
                          },
                      ],
                      totalAmount: 4000,
                      status: ORDER_STATUS.RECEIVED,
                  },
              ]
    );

    // props로 받은 orders가 변경되면 로컬 상태도 업데이트
    React.useEffect(() => {
        if (orders.length > 0) {
            setLocalOrders(orders);
        }
    }, [orders]);

    // orders 변수 사용을 localOrders로 변경
    const ordersToUse = orders.length > 0 ? orders : localOrders;

    // 주문 통계 계산
    const orderStats = {
        total: ordersToUse.length,
        received: ordersToUse.filter(
            (order) => order.status === ORDER_STATUS.RECEIVED
        ).length,
        making: ordersToUse.filter(
            (order) => order.status === ORDER_STATUS.MAKING
        ).length,
        completed: ordersToUse.filter(
            (order) => order.status === ORDER_STATUS.COMPLETED
        ).length,
    };

    // 재고 수량 증가
    const increaseStock = (menuId) => {
        setInventory((prev) => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                stock: prev[menuId].stock + 1,
            },
        }));
    };

    // 재고 수량 감소
    const decreaseStock = (menuId) => {
        setInventory((prev) => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                stock: Math.max(0, prev[menuId].stock - 1),
            },
        }));
    };

    // 재고 상태 판단
    const getStockStatus = (stock) => {
        if (stock === 0)
            return {
                status: "품절",
                color: "#dc2626",
                bgColor: "rgba(220, 38, 38, 0.1)",
            };
        if (stock < 5)
            return {
                status: "주의",
                color: "#f59e0b",
                bgColor: "rgba(245, 158, 11, 0.1)",
            };
        return {
            status: "정상",
            color: "#16a34a",
            bgColor: "rgba(22, 163, 74, 0.1)",
        };
    };

    // 주문 상태 변경
    const updateOrderStatus = (orderId) => {
        const updateFn = (prev) =>
            prev.map((order) => {
                if (order.id === orderId) {
                    let newStatus;
                    switch (order.status) {
                        case ORDER_STATUS.RECEIVED:
                            newStatus = ORDER_STATUS.MAKING;
                            break;
                        case ORDER_STATUS.MAKING:
                            newStatus = ORDER_STATUS.COMPLETED;
                            break;
                        default:
                            newStatus = order.status;
                    }
                    return { ...order, status: newStatus };
                }
                return order;
            });

        // props로 받은 setOrders가 있으면 사용, 없으면 로컬 상태 업데이트
        if (setOrders) {
            setOrders(updateFn);
        } else {
            setLocalOrders(updateFn);
        }
    };

    // 주문 상태 버튼 텍스트
    const getOrderButtonText = (order) => {
        switch (order.status) {
            case ORDER_STATUS.RECEIVED:
                return "제조 시작";
            case ORDER_STATUS.MAKING:
                return "제조 완료";
            case ORDER_STATUS.COMPLETED:
                return "완료됨";
            default:
                return "처리됨";
        }
    };

    // 새 주문 추가 (테스트용)
    const addTestOrder = () => {
        const newOrder = {
            id: Date.now(),
            orderTime: new Date(),
            items: [
                {
                    menuId: Math.floor(Math.random() * 3) + 1,
                    name: menuItems[Math.floor(Math.random() * 3)].name,
                    quantity: 1,
                    price: menuItems[Math.floor(Math.random() * 3)].price,
                },
            ],
            totalAmount: menuItems[Math.floor(Math.random() * 3)].price,
            status: ORDER_STATUS.RECEIVED,
        };

        // props로 받은 setOrders가 있으면 사용, 없으면 로컬 상태 업데이트
        if (setOrders) {
            setOrders((prev) => [newOrder, ...prev]);
        } else {
            setLocalOrders((prev) => [newOrder, ...prev]);
        }
    };

    // 날짜 포맷팅
    const formatOrderTime = (date) => {
        return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date
            .getHours()
            .toString()
            .padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    };

    return (
        <div className="admin-screen">
            {/* 관리자 대시보드 섹션 */}
            <section className="dashboard-section">
                <h2 className="section-title">관리자 대시보드</h2>
                <div className="dashboard-cards">
                    <div className="dashboard-card">
                        <div className="card-number">{orderStats.total}</div>
                        <div className="card-label">총 주문</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-number">{orderStats.received}</div>
                        <div className="card-label">주문 접수</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-number">{orderStats.making}</div>
                        <div className="card-label">제조 중</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-number">
                            {orderStats.completed}
                        </div>
                        <div className="card-label">제조 완료</div>
                    </div>
                </div>
            </section>

            {/* 재고 현황 섹션 */}
            <section className="inventory-section">
                <h2 className="section-title">재고 현황</h2>
                <div className="inventory-cards">
                    {Object.entries(inventory).map(([menuId, item]) => {
                        const stockStatus = getStockStatus(item.stock);
                        return (
                            <div key={menuId} className="inventory-card">
                                <h3 className="inventory-menu-name">
                                    {item.name}
                                </h3>
                                <div className="inventory-info">
                                    <div className="stock-quantity">
                                        {item.stock}개
                                    </div>
                                    <div
                                        className="stock-status"
                                        style={{
                                            color: stockStatus.color,
                                            backgroundColor:
                                                stockStatus.bgColor,
                                        }}
                                    >
                                        {stockStatus.status}
                                    </div>
                                </div>
                                <div className="stock-controls">
                                    <button
                                        className="stock-btn decrease"
                                        onClick={() =>
                                            decreaseStock(parseInt(menuId))
                                        }
                                        disabled={item.stock === 0}
                                    >
                                        -
                                    </button>
                                    <button
                                        className="stock-btn increase"
                                        onClick={() =>
                                            increaseStock(parseInt(menuId))
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 주문 현황 섹션 */}
            <section className="orders-section">
                <div className="orders-header">
                    <h2 className="section-title">주문 현황</h2>
                    <button
                        className="add-test-order-btn"
                        onClick={addTestOrder}
                    >
                        테스트 주문 추가
                    </button>
                </div>
                <div className="orders-list">
                    {ordersToUse.length === 0 ? (
                        <p className="no-orders">주문이 없습니다.</p>
                    ) : (
                        ordersToUse.map((order) => (
                            <div key={order.id} className="order-card">
                                <div className="order-info">
                                    <div className="order-time">
                                        {formatOrderTime(order.orderTime)}
                                    </div>
                                    <div className="order-items">
                                        {order.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="order-item"
                                            >
                                                {item.name} x {item.quantity}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="order-amount">
                                        {order.totalAmount.toLocaleString()}원
                                    </div>
                                </div>
                                <div className="order-status">
                                    <button
                                        className={`status-btn ${
                                            order.status ===
                                            ORDER_STATUS.RECEIVED
                                                ? "received"
                                                : order.status ===
                                                  ORDER_STATUS.MAKING
                                                ? "making"
                                                : "completed"
                                        }`}
                                        onClick={() =>
                                            updateOrderStatus(order.id)
                                        }
                                        disabled={
                                            order.status ===
                                            ORDER_STATUS.COMPLETED
                                        }
                                    >
                                        {getOrderButtonText(order)}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

export default AdminScreen;
