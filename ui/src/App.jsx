import { useState } from "react";
import "./App.css";
import OrderScreen from "./components/OrderScreen.jsx";
import AdminScreen from "./components/AdminScreen.jsx";

function App() {
    const [currentScreen, setCurrentScreen] = useState("order"); // 'order' 또는 'admin'

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
                {currentScreen === "order" ? <OrderScreen /> : <AdminScreen />}
            </main>
        </div>
    );
}

export default App;
