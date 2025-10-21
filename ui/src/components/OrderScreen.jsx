import { useState } from "react";

// 메뉴 데이터
const menuItems = [
    {
        id: 1,
        name: "아메리카노(ICE)",
        price: 4000,
        description: "깔끔한 에스프레소와 차가운 물의 조화",
    },
    {
        id: 2,
        name: "아메리카노(HOT)",
        price: 4000,
        description: "따뜻한 에스프레소와 뜨거운 물의 조화",
    },
    {
        id: 3,
        name: "카페라떼",
        price: 5000,
        description: "부드러운 우유 거품이 올라간 에스프레소",
    },
    {
        id: 4,
        name: "카푸치노",
        price: 5000,
        description: "진한 에스프레소와 풍부한 우유 거품",
    },
    {
        id: 5,
        name: "카라멜 마키아토",
        price: 6000,
        description: "달콤한 카라멜 시럽이 어우러진 라떼",
    },
];

// 옵션 데이터
const options = [
    { id: "extra-shots", name: "샷 추가", price: 500 },
    { id: "syrup", name: "시럽 추가", price: 0 },
];

function OrderScreen() {
    const [cart, setCart] = useState([]);
    const [menuSelections, setMenuSelections] = useState({});

    // 메뉴 선택 옵션 초기화
    const initializeMenuSelection = (menuId) => {
        if (!menuSelections[menuId]) {
            setMenuSelections((prev) => ({
                ...prev,
                [menuId]: {
                    extraShots: false,
                    syrup: false,
                },
            }));
        }
    };

    // 메뉴 카드의 현재 가격 계산
    const getCurrentPrice = (menuItem) => {
        const selection = menuSelections[menuItem.id] || {
            extraShots: false,
            syrup: false,
        };
        const extraPrice =
            (selection.extraShots ? 500 : 0) + (selection.syrup ? 0 : 0);
        return menuItem.price + extraPrice;
    };

    // 메뉴 선택 상태 가져오기
    const getMenuSelection = (menuId) => {
        return menuSelections[menuId] || { extraShots: false, syrup: false };
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

    // 장바구니에 추가
    const addToCart = (menuItem) => {
        initializeMenuSelection(menuItem.id);

        const selection = menuSelections[menuItem.id] || {
            extraShots: false,
            syrup: false,
        };
        const extraPrice =
            (selection.extraShots ? 500 : 0) + (selection.syrup ? 0 : 0);
        const totalPrice = menuItem.price + extraPrice;

        const cartItem = {
            id: `${menuItem.id}-${selection.extraShots}-${selection.syrup}`,
            menuId: menuItem.id,
            name: menuItem.name,
            price: totalPrice,
            quantity: 1,
            extraShots: selection.extraShots,
            syrup: selection.syrup,
        };

        setCart((prev) => {
            const existingItemIndex = prev.findIndex(
                (item) => item.id === cartItem.id
            );
            if (existingItemIndex >= 0) {
                const updatedCart = [...prev];
                updatedCart[existingItemIndex].quantity += 1;
                return updatedCart;
            }
            return [...prev, cartItem];
        });
    };

    // 장바구니에서 제거
    const removeFromCart = (itemId) => {
        setCart((prev) => prev.filter((item) => item.id !== itemId));
    };

    // 총 금액 계산
    const getTotalPrice = () => {
        return cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    // 장바구니 아이템 이름 생성
    const getCartItemName = (item) => {
        let name = item.name;
        const extras = [];
        if (item.extraShots) extras.push("샷 추가");
        if (item.syrup) extras.push("시럽 추가");
        if (extras.length > 0) {
            name += ` (${extras.join(", ")})`;
        }
        return name;
    };

    return (
        <div className="order-screen">
            {/* 메뉴 섹션 */}
            <section className="menu-section">
                <div className="menu-grid">
                    {menuItems.map((item) => (
                        <div key={item.id} className="menu-card">
                            <div className="menu-image">
                                <div className="image-placeholder">☕</div>
                            </div>
                            <div className="menu-info">
                                <h3 className="menu-name">{item.name}</h3>
                                <p className="menu-price">
                                    {getCurrentPrice(item).toLocaleString()}원
                                </p>
                                <p className="menu-description">
                                    {item.description}
                                </p>

                                <div className="menu-options">
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
                                        />
                                        샷 추가 (+500원)
                                    </label>
                                    <label className="option-item">
                                        <input
                                            type="checkbox"
                                            checked={
                                                getMenuSelection(item.id).syrup
                                            }
                                            onChange={() =>
                                                toggleOption(item.id, "syrup")
                                            }
                                        />
                                        시럽 추가 (+0원)
                                    </label>
                                </div>

                                <button
                                    className="add-to-cart-btn"
                                    onClick={() => addToCart(item)}
                                >
                                    담기
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 장바구니 섹션 */}
            <section className="cart-section">
                <h2 className="cart-title">장바구니</h2>

                {cart.length === 0 ? (
                    <p className="empty-cart">장바구니가 비어있습니다.</p>
                ) : (
                    <div className="cart-container">
                        {/* 왼쪽: 주문 내역 */}
                        <div className="cart-items-section">
                            <div className="cart-items">
                                {cart.map((item) => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-info">
                                            <span className="cart-item-name">
                                                {getCartItemName(item)} x{" "}
                                                {item.quantity}
                                            </span>
                                            <button
                                                className="remove-btn"
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }
                                                title="제거"
                                            >
                                                ×
                                            </button>
                                        </div>
                                        <span className="cart-item-price">
                                            {(
                                                item.price * item.quantity
                                            ).toLocaleString()}
                                            원
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 오른쪽: 총 금액과 주문하기 버튼 */}
                        <div className="cart-summary-section">
                            <div className="cart-summary">
                                <div className="total-price">
                                    총 금액 {getTotalPrice().toLocaleString()}원
                                </div>
                                <button
                                    className="order-btn"
                                    disabled={cart.length === 0}
                                    onClick={() => {
                                        if (cart.length > 0) {
                                            alert(
                                                `주문이 완료되었습니다!\n총 금액: ${getTotalPrice().toLocaleString()}원`
                                            );
                                            setCart([]);
                                        }
                                    }}
                                >
                                    주문하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default OrderScreen;
