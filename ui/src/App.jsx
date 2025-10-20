import { useState } from "react";
import "./App.css";

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
                {currentScreen === "order" ? (
                    <div>
                        <h2>주문하기 화면 (개발 중)</h2>
                        <p>주문하기 화면이 여기에 구현될 예정입니다.</p>
                    </div>
                ) : (
                    <div>
                        <h2>관리자 화면 (개발 중)</h2>
                        <p>관리자 화면이 여기에 구현될 예정입니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
