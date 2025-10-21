import { useState } from "react";
import "./App.css";
import OrderScreen from "./components/OrderScreen.jsx";
import AdminScreen from "./components/AdminScreen.jsx";

function App() {
    const [currentScreen, setCurrentScreen] = useState("order"); // 'order' 또는 'admin'
    const [orders, setOrders] = useState([]); // 주문 데이터를 App 레벨에서 관리

    // 주문 완료 처리
    const handleOrderComplete = (cartItems, totalAmount) => {
        const newOrder = {
            id: Date.now(),
            orderTime: new Date(),
            items: cartItems,
            totalAmount: totalAmount,
            status: "RECEIVED", // 관리자 화면에서 사용할 상태
        };
        setOrders((prev) => [newOrder, ...prev]);
    };

    return (
        <div className="app">
            {/* 헤더 */}
            <header className="header">
                <div className="brand">
                    <h1>COZY</h1>
                </div>
                <nav className="navigation">
                    <button
                        className={`nav-button ${
                            currentScreen === "order" ? "active" : ""
                        }`}
                        onClick={() => setCurrentScreen("order")}
                    >
                        주문하기
                    </button>
                    <button
                        className={`nav-button ${
                            currentScreen === "admin" ? "active" : ""
                        }`}
                        onClick={() => setCurrentScreen("admin")}
                    >
                        관리자
                    </button>
                </nav>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="main-content">
                {currentScreen === "order" ? (
                    <OrderScreen onOrderComplete={handleOrderComplete} />
                ) : (
                    <AdminScreen orders={orders} setOrders={setOrders} />
                )}
            </main>
        </div>
    );
}

export default App;
