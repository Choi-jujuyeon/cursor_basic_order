import { useState, useEffect } from "react";
import { menuAPI, orderAPI } from "../services/api";

// 옵션 데이터 (API에서 가져온 메뉴의 options 필드 사용)
const options = [
    { id: "extra-shots", name: "샷 추가", price: 500 },
    { id: "syrup", name: "시럽 추가", price: 0 },
];

function OrderScreen({ onOrderComplete }) {
    const [cart, setCart] = useState([]);
    const [menuSelections, setMenuSelections] = useState({});
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 메뉴 데이터 로드
    useEffect(() => {
        const loadMenus = async () => {
            try {
                setLoading(true);
                const response = await menuAPI.getMenus();
                if (response.success) {
                    setMenuItems(response.data);
                } else {
                    setError("메뉴를 불러오는데 실패했습니다.");
                }
            } catch (err) {
                console.error("메뉴 로드 오류:", err);
                setError("메뉴를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        loadMenus();
    }, []);

    // 메뉴 선택 옵션 초기화
    const initializeMenuSelection = (menuId) => {
        if (!menuSelections[menuId]) {
            setMenuSelections((prev) => ({
                ...prev,
                [menuId]: {
                    temperature: "HOT", // 기본값을 HOT으로 설정
                    extraShots: false,
                    syrup: false,
                },
            }));
        }
    };

    // 메뉴 데이터 새로고침
    const refreshMenuData = async () => {
        try {
            const response = await menuAPI.getMenus();
            if (response.success) {
                setMenuItems(response.data);
            }
        } catch (err) {
            console.error("메뉴 새로고침 오류:", err);
        }
    };

    // 재고 상태 확인 함수 (실제 데이터베이스 재고 기준)
    const isOutOfStock = (menu) => {
        return menu.stock <= 0;
    };

    // 재고 부족 메시지 (실제 데이터베이스 재고 기준)
    const getStockMessage = (menu) => {
        if (menu.stock <= 0) return "품절";
        if (menu.stock < 5) return `재고 부족 (${menu.stock}개)`;
        return "";
    };

    // 메뉴 카드의 현재 가격 계산
    const getCurrentPrice = (menuItem) => {
        const selection = menuSelections[menuItem.id] || {
            temperature: "HOT",
            extraShots: false,
            syrup: false,
        };
        const extraPrice =
            (selection.extraShots ? 500 : 0) + (selection.syrup ? 0 : 0);
        return menuItem.price + extraPrice;
    };

    // 메뉴 선택 상태 가져오기
    const getMenuSelection = (menuId) => {
        return (
            menuSelections[menuId] || {
                temperature: "HOT",
                extraShots: false,
                syrup: false,
            }
        );
    };

    // 옵션 토글
    const toggleOption = (menuId, option) => {
        initializeMenuSelection(menuId);
        setMenuSelections((prev) => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                [option]: !prev[menuId]?.[option],
            },
        }));
    };

    // 온도 선택
    const selectTemperature = (menuId, temperature) => {
        initializeMenuSelection(menuId);
        setMenuSelections((prev) => ({
            ...prev,
            [menuId]: {
                ...prev[menuId],
                temperature: temperature,
            },
        }));
    };

    // 장바구니에 추가
    const addToCart = (menuItem) => {
        initializeMenuSelection(menuItem.id);

        const selection = menuSelections[menuItem.id] || {
            temperature: "HOT",
            extraShots: false,
            syrup: false,
        };
        const extraPrice =
            (selection.extraShots ? 500 : 0) + (selection.syrup ? 0 : 0);
        const totalPrice = menuItem.price + extraPrice;

        // 재고 체크 (온도 구분 없이, 이제 각 아이템의 수량이 항상 1)
        const currentCartQuantity = cart.filter(
            (item) => item.menuId === menuItem.id
        ).length;

        if (currentCartQuantity >= menuItem.stock) {
            alert(
                `재고가 부족합니다!\n메뉴: ${menuItem.name}\n현재 재고: ${menuItem.stock}개\n장바구니 수량: ${currentCartQuantity}개\n\n더 이상 담을 수 없습니다.`
            );
            return;
        }

        const cartItem = {
            id: `${menuItem.id}-${selection.temperature}-${
                selection.extraShots
            }-${selection.syrup}-${Date.now()}-${Math.random()}`,
            menuId: menuItem.id,
            name: menuItem.name,
            price: totalPrice,
            quantity: 1,
            temperature: selection.temperature,
            extraShots: selection.extraShots,
            syrup: selection.syrup,
        };

        setCart((prev) => {
            // 매번 새로운 아이템으로 추가 (수량 증가 없이)
            return [...prev, cartItem];
        });
    };

    // 장바구니 아이템 그룹화 함수
    const getGroupedCartItems = () => {
        const grouped = {};

        cart.forEach((item) => {
            // 그룹화 키: 메뉴ID + 온도 + 옵션들
            const groupKey = `${item.menuId}-${item.temperature}-${item.extraShots}-${item.syrup}`;

            if (!grouped[groupKey]) {
                grouped[groupKey] = {
                    ...item,
                    quantity: 1,
                    ids: [item.id], // 개별 아이템 ID들을 저장
                };
            } else {
                grouped[groupKey].quantity += 1;
                grouped[groupKey].ids.push(item.id);
            }
        });

        return Object.values(grouped);
    };

    // 장바구니에서 제거 (그룹화된 아이템에서 수량 감소)
    const removeFromCart = (groupedItem) => {
        if (groupedItem.quantity > 1) {
            // 수량이 1보다 크면 하나만 제거
            const idToRemove = groupedItem.ids[groupedItem.ids.length - 1];
            setCart((prev) => prev.filter((item) => item.id !== idToRemove));
        } else {
            // 수량이 1이면 모든 아이템 제거
            setCart((prev) =>
                prev.filter((item) => !groupedItem.ids.includes(item.id))
            );
        }
    };

    // 총 금액 계산
    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price, 0);
    };

    // 주문 생성 함수
    const handleOrder = async () => {
        if (cart.length === 0) return;

        try {
            // 주문 전 재고 체크 (그룹화된 아이템 사용)
            const groupedItems = getGroupedCartItems();
            for (const groupedItem of groupedItems) {
                const menuItem = menuItems.find(
                    (menu) => menu.id === groupedItem.menuId
                );
                if (!menuItem) {
                    alert(`메뉴를 찾을 수 없습니다: ${groupedItem.name}`);
                    return;
                }

                // 재고 부족 체크
                if (groupedItem.quantity > menuItem.stock) {
                    alert(
                        `재고가 부족합니다!\n메뉴: ${groupedItem.name}\n현재 재고: ${menuItem.stock}개\n요청 수량: ${groupedItem.quantity}개\n\n장바구니에서 수량을 조정해주세요.`
                    );
                    return; // 주문을 진행하지 않음
                }
            }

            // API 형식에 맞게 주문 데이터 변환 (그룹화된 아이템 사용)
            const orderItems = groupedItems.map((groupedItem) => ({
                menu_id: groupedItem.menuId,
                quantity: groupedItem.quantity,
                unit_price: groupedItem.price,
                options: [
                    ...(groupedItem.temperature
                        ? [{ name: groupedItem.temperature, price: 0 }]
                        : []),
                    ...(groupedItem.extraShots
                        ? [{ name: "샷 추가", price: 500 }]
                        : []),
                    ...(groupedItem.syrup
                        ? [{ name: "시럽 추가", price: 0 }]
                        : []),
                ],
            }));

            const orderData = {
                items: orderItems,
                total_amount: getTotalPrice(),
            };

            // API로 주문 생성
            const response = await orderAPI.createOrder(orderData);

            if (response.success) {
                // 주문 완료 시 부모 컴포넌트에 전달
                if (onOrderComplete) {
                    onOrderComplete(cart, getTotalPrice());
                }

                alert(
                    `주문이 완료되었습니다!\n주문번호: ${
                        response.data.id
                    }\n총 금액: ${getTotalPrice().toLocaleString()}원`
                );
                setCart([]);

                // 주문 완료 후 메뉴 데이터 새로고침 (재고 업데이트)
                await refreshMenuData();
            } else {
                alert("주문 생성에 실패했습니다.");
            }
        } catch (error) {
            console.error("주문 생성 오류:", error);
            alert("주문 생성 중 오류가 발생했습니다.");
        }
    };

    // 장바구니 아이템 이름 생성
    const getCartItemName = (item) => {
        let name = item.name;
        const extras = [];
        if (item.temperature) extras.push(item.temperature);
        if (item.extraShots) extras.push("샷 추가");
        if (item.syrup) extras.push("시럽 추가");
        if (extras.length > 0) {
            name += ` (${extras.join(", ")})`;
        }
        return name;
    };

    return (
        <div className="order-screen">
            {/* 로딩 상태 */}
            {loading && (
                <div className="loading-message">
                    <p>메뉴를 불러오는 중...</p>
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

            {/* 메뉴 섹션 */}
            {!loading && !error && (
                <section className="menu-section">
                    <div className="menu-grid">
                        {menuItems.map((item) => (
                            <div
                                key={item.id}
                                className={`menu-card ${
                                    isOutOfStock(item) ? "out-of-stock" : ""
                                }`}
                            >
                                <div className="menu-image">
                                    <div className="image-placeholder">☕</div>
                                    {isOutOfStock(item) && (
                                        <div className="out-of-stock-overlay">
                                            <span>품절</span>
                                        </div>
                                    )}
                                </div>
                                <div className="menu-info">
                                    <h3 className="menu-name">{item.name}</h3>
                                    <p className="menu-price">
                                        {getCurrentPrice(item).toLocaleString()}
                                        원
                                    </p>
                                    <p className="menu-description">
                                        {item.description}
                                    </p>

                                    <div
                                        className={`menu-options ${
                                            isOutOfStock(item) ? "disabled" : ""
                                        }`}
                                    >
                                        {/* 온도 선택 */}
                                        <div className="temperature-options">
                                            <label className="temperature-option">
                                                <input
                                                    type="radio"
                                                    name={`temperature-${item.id}`}
                                                    value="HOT"
                                                    checked={
                                                        getMenuSelection(
                                                            item.id
                                                        ).temperature === "HOT"
                                                    }
                                                    onChange={() =>
                                                        selectTemperature(
                                                            item.id,
                                                            "HOT"
                                                        )
                                                    }
                                                    disabled={isOutOfStock(
                                                        item
                                                    )}
                                                />
                                                <span>HOT</span>
                                            </label>
                                            <label className="temperature-option">
                                                <input
                                                    type="radio"
                                                    name={`temperature-${item.id}`}
                                                    value="ICE"
                                                    checked={
                                                        getMenuSelection(
                                                            item.id
                                                        ).temperature === "ICE"
                                                    }
                                                    onChange={() =>
                                                        selectTemperature(
                                                            item.id,
                                                            "ICE"
                                                        )
                                                    }
                                                    disabled={isOutOfStock(
                                                        item
                                                    )}
                                                />
                                                <span>ICE</span>
                                            </label>
                                        </div>

                                        {/* 추가 옵션 */}
                                        <label className="option-item">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    getMenuSelection(item.id)
                                                        .extraShots
                                                }
                                                onChange={() =>
                                                    toggleOption(
                                                        item.id,
                                                        "extraShots"
                                                    )
                                                }
                                                disabled={isOutOfStock(item)}
                                            />
                                            샷 추가 (+500원)
                                        </label>
                                        <label className="option-item">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    getMenuSelection(item.id)
                                                        .syrup
                                                }
                                                onChange={() =>
                                                    toggleOption(
                                                        item.id,
                                                        "syrup"
                                                    )
                                                }
                                                disabled={isOutOfStock(item)}
                                            />
                                            시럽 추가 (+0원)
                                        </label>
                                    </div>

                                    <div className="menu-actions">
                                        <button
                                            className={`add-to-cart-btn ${
                                                isOutOfStock(item)
                                                    ? "disabled"
                                                    : ""
                                            }`}
                                            onClick={() => addToCart(item)}
                                            disabled={isOutOfStock(item)}
                                        >
                                            {isOutOfStock(item)
                                                ? "품절"
                                                : "담기"}
                                        </button>
                                        <div className="stock-status-container">
                                            <p
                                                className={`stock-message ${
                                                    item.stock <= 0
                                                        ? "out-of-stock"
                                                        : item.stock < 5
                                                        ? "low-stock"
                                                        : "sufficient-stock"
                                                }`}
                                            >
                                                {item.stock <= 0
                                                    ? "품절"
                                                    : item.stock < 5
                                                    ? `재고 부족 (${item.stock}개)`
                                                    : `재고 여유 (${item.stock}개)`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 장바구니 섹션 */}
            {!loading && !error && (
                <section className="cart-section">
                    <h2 className="cart-title">장바구니</h2>

                    {cart.length === 0 ? (
                        <p className="empty-cart">장바구니가 비어있습니다.</p>
                    ) : (
                        <div className="cart-container">
                            {/* 왼쪽: 주문 내역 */}
                            <div className="cart-items-section">
                                <div className="cart-items">
                                    {getGroupedCartItems().map(
                                        (groupedItem) => (
                                            <div
                                                key={`${groupedItem.menuId}-${groupedItem.temperature}-${groupedItem.extraShots}-${groupedItem.syrup}`}
                                                className="cart-item"
                                            >
                                                <div className="cart-item-info">
                                                    <span className="cart-item-name">
                                                        {getCartItemName(
                                                            groupedItem
                                                        )}{" "}
                                                        x {groupedItem.quantity}
                                                    </span>
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() =>
                                                            removeFromCart(
                                                                groupedItem
                                                            )
                                                        }
                                                        title="제거"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <span className="cart-item-price">
                                                    {(
                                                        groupedItem.price *
                                                        groupedItem.quantity
                                                    ).toLocaleString()}
                                                    원
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* 오른쪽: 총 금액과 주문하기 버튼 */}
                            <div className="cart-summary-section">
                                <div className="cart-summary">
                                    <div className="total-price">
                                        총 금액{" "}
                                        {getTotalPrice().toLocaleString()}원
                                    </div>
                                    <button
                                        className="order-btn"
                                        disabled={cart.length === 0}
                                        onClick={handleOrder}
                                    >
                                        주문하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

export default OrderScreen;
