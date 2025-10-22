import React, { useState, useEffect } from "react";
import { menuAPI, orderAPI } from "../services/api";

// 주문 상태 정의
const ORDER_STATUS = {
    RECEIVED: "주문 접수",
    MAKING: "제조 중",
    COMPLETED: "제조 완료",
};

function AdminScreen({ orders = [], setOrders }) {
    // 상태 관리
    const [menuItems, setMenuItems] = useState([]);
    const [inventory, setInventory] = useState({});
    const [localOrders, setLocalOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 데이터 로딩
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // 메뉴 데이터와 주문 데이터를 병렬로 로드
                const [menusResponse, ordersResponse] = await Promise.all([
                    menuAPI.getMenus(),
                    orderAPI.getOrders(),
                ]);

                if (menusResponse.success) {
                    setMenuItems(menusResponse.data);

                    // 재고 상태 초기화
                    const inventoryData = {};
                    menusResponse.data.forEach((menu) => {
                        inventoryData[menu.id] = {
                            name: menu.name,
                            stock: menu.stock,
                        };
                    });
                    setInventory(inventoryData);
                }

                if (ordersResponse.success) {
                    // API 응답 데이터를 컴포넌트 형식으로 변환
                    const transformedOrders = ordersResponse.data.map(
                        (order) => ({
                            id: order.id,
                            orderTime: new Date(order.order_time),
                            status: order.status,
                            totalAmount: order.total_amount,
                            items: order.items || [],
                        })
                    );

                    setLocalOrders(transformedOrders);
                    if (setOrders) {
                        setOrders(transformedOrders);
                    }
                }
            } catch (err) {
                console.error("데이터 로드 오류:", err);
                setError("데이터를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [setOrders]);

    // 재고 새로고침 함수
    const refreshInventory = async () => {
        try {
            const response = await menuAPI.getMenus();
            if (response.success) {
                const inventoryData = {};
                response.data.forEach((menu) => {
                    inventoryData[menu.id] = {
                        name: menu.name,
                        stock: menu.stock,
                    };
                });
                setInventory(inventoryData);
            }
        } catch (error) {
            console.error("재고 새로고침 오류:", error);
        }
    };

    // orders 변수 사용을 localOrders로 변경
    const ordersToUse = orders.length > 0 ? orders : localOrders;

    // 주문 통계 계산
    const orderStats = {
        total: ordersToUse.length,
        received: ordersToUse.filter((order) => order.status === "RECEIVED")
            .length,
        making: ordersToUse.filter((order) => order.status === "MAKING").length,
        completed: ordersToUse.filter((order) => order.status === "COMPLETED")
            .length,
    };

    // 재고 수량 증가
    const increaseStock = async (menuId) => {
        try {
            const currentStock = inventory[menuId]?.stock || 0;
            const newStock = currentStock + 1;

            const response = await menuAPI.updateStock(menuId, newStock);

            if (response.success) {
                setInventory((prev) => ({
                    ...prev,
                    [menuId]: {
                        ...prev[menuId],
                        stock: newStock,
                    },
                }));
            } else {
                alert("재고 수정에 실패했습니다.");
            }
        } catch (error) {
            console.error("재고 증가 오류:", error);
            alert("재고 수정 중 오류가 발생했습니다.");
        }
    };

    // 재고 수량 감소
    const decreaseStock = async (menuId) => {
        try {
            const currentStock = inventory[menuId]?.stock || 0;
            const newStock = Math.max(0, currentStock - 1);

            const response = await menuAPI.updateStock(menuId, newStock);

            if (response.success) {
                setInventory((prev) => ({
                    ...prev,
                    [menuId]: {
                        ...prev[menuId],
                        stock: newStock,
                    },
                }));
            } else {
                alert("재고 수정에 실패했습니다.");
            }
        } catch (error) {
            console.error("재고 감소 오류:", error);
            alert("재고 수정 중 오류가 발생했습니다.");
        }
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

    // 주문 아이템 그룹화 함수
    const getGroupedOrderItems = (orderItems) => {
        const grouped = {};

        orderItems.forEach((item) => {
            // 옵션들을 문자열로 변환하여 그룹화 키 생성
            const optionsString = item.options
                ? item.options
                      .map((opt) => opt.name)
                      .sort()
                      .join(", ")
                : "";

            // 그룹화 키: 메뉴명 + 옵션들
            const groupKey = `${item.menu_name}-${optionsString}`;

            if (!grouped[groupKey]) {
                grouped[groupKey] = {
                    ...item,
                    totalQuantity: item.quantity,
                    options: item.options || [],
                };
            } else {
                grouped[groupKey].totalQuantity += item.quantity;
            }
        });

        return Object.values(grouped);
    };

    // 주문 상태 변경
    const updateOrderStatus = async (orderId) => {
        try {
            // 현재 주문의 상태 확인
            const currentOrder = ordersToUse.find(
                (order) => order.id === orderId
            );
            if (!currentOrder) return;

            let newStatus;
            switch (currentOrder.status) {
                case "RECEIVED":
                    newStatus = "MAKING";
                    break;
                case "MAKING":
                    newStatus = "COMPLETED";
                    break;
                default:
                    return; // 이미 완료된 주문
            }

            // API로 상태 변경
            const response = await orderAPI.updateOrderStatus(
                orderId,
                newStatus
            );

            if (response.success) {
                // 로컬 상태 업데이트
                const updateFn = (prev) =>
                    prev.map((order) => {
                        if (order.id === orderId) {
                            return { ...order, status: newStatus };
                        }
                        return order;
                    });

                setLocalOrders(updateFn);
                if (setOrders) {
                    setOrders(updateFn);
                }
            } else {
                alert("주문 상태 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("주문 상태 변경 오류:", error);
            alert("주문 상태 변경 중 오류가 발생했습니다.");
        }
    };

    // 주문 상태 버튼 텍스트
    const getOrderButtonText = (order) => {
        switch (order.status) {
            case "RECEIVED":
                return "제조 시작";
            case "MAKING":
                return "제조 완료";
            case "COMPLETED":
                return "완료됨";
            default:
                return "처리됨";
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
            {/* 로딩 상태 */}
            {loading && (
                <div className="loading-message">
                    <p>데이터를 불러오는 중...</p>
                </div>
            )}

            {/* 에러 상태 */}
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        다시 시도
                    </button>
                </div>
            )}

            {/* 메인 콘텐츠 */}
            {!loading && !error && (
                <>
                    {/* 관리자 대시보드 섹션 */}
                    <section className="dashboard-section">
                        <h2 className="section-title">관리자 대시보드</h2>
                        <div className="dashboard-cards">
                            <div className="dashboard-card">
                                <div className="card-number">
                                    {orderStats.total}
                                </div>
                                <div className="card-label">총 주문</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-number">
                                    {orderStats.received}
                                </div>
                                <div className="card-label">주문 접수</div>
                            </div>
                            <div className="dashboard-card">
                                <div className="card-number">
                                    {orderStats.making}
                                </div>
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
                        <div className="inventory-header">
                            <h2 className="section-title">재고 현황</h2>
                            <button
                                className="refresh-btn"
                                onClick={refreshInventory}
                                title="재고 새로고침"
                            >
                                🔄 새로고침
                            </button>
                        </div>
                        <div className="inventory-cards">
                            {Object.entries(inventory).map(([menuId, item]) => {
                                const stockStatus = getStockStatus(item.stock);
                                return (
                                    <div
                                        key={menuId}
                                        className="inventory-card"
                                    >
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
                                                    decreaseStock(
                                                        parseInt(menuId)
                                                    )
                                                }
                                                disabled={item.stock === 0}
                                            >
                                                -
                                            </button>
                                            <button
                                                className="stock-btn increase"
                                                onClick={() =>
                                                    increaseStock(
                                                        parseInt(menuId)
                                                    )
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
                        </div>
                        <div className="orders-list">
                            {ordersToUse.length === 0 ? (
                                <p className="no-orders">주문이 없습니다.</p>
                            ) : (
                                ordersToUse.map((order) => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-info">
                                            <div className="order-time">
                                                {formatOrderTime(
                                                    order.orderTime
                                                )}
                                            </div>
                                            <div className="order-items">
                                                {getGroupedOrderItems(
                                                    order.items
                                                ).map((groupedItem, index) => (
                                                    <div
                                                        key={index}
                                                        className="order-item"
                                                    >
                                                        {groupedItem.menu_name}
                                                        {groupedItem.options
                                                            .length > 0 && (
                                                            <span className="order-options">
                                                                (
                                                                {groupedItem.options
                                                                    .map(
                                                                        (opt) =>
                                                                            opt.name
                                                                    )
                                                                    .join(", ")}
                                                                )
                                                            </span>
                                                        )}
                                                        <span className="order-quantity">
                                                            x{" "}
                                                            {
                                                                groupedItem.totalQuantity
                                                            }
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="order-amount">
                                                {order.totalAmount.toLocaleString()}
                                                원
                                            </div>
                                        </div>
                                        <div className="order-status">
                                            <button
                                                className={`status-btn ${
                                                    order.status === "RECEIVED"
                                                        ? "received"
                                                        : order.status ===
                                                          "MAKING"
                                                        ? "making"
                                                        : "completed"
                                                }`}
                                                onClick={() =>
                                                    updateOrderStatus(order.id)
                                                }
                                                disabled={
                                                    order.status === "COMPLETED"
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
                </>
            )}
        </div>
    );
}

export default AdminScreen;
