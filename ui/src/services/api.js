// API 기본 설정
const API_BASE_URL = "http://localhost:3001/api";

// 공통 API 호출 함수
const apiCall = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "API 호출 실패");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API 호출 오류:", error);
        throw error;
    }
};

// 메뉴 관련 API
export const menuAPI = {
    // 메뉴 목록 조회
    getMenus: async () => {
        return await apiCall("/menus");
    },

    // 특정 메뉴 조회
    getMenu: async (id) => {
        return await apiCall(`/menus/${id}`);
    },

    // 재고 수량 수정
    updateStock: async (id, stock) => {
        return await apiCall(`/menus/${id}/stock`, {
            method: "PUT",
            body: JSON.stringify({ stock }),
        });
    },
};

// 주문 관련 API
export const orderAPI = {
    // 주문 목록 조회
    getOrders: async () => {
        return await apiCall("/orders");
    },

    // 특정 주문 조회
    getOrder: async (id) => {
        return await apiCall(`/orders/${id}`);
    },

    // 새 주문 생성
    createOrder: async (orderData) => {
        return await apiCall("/orders", {
            method: "POST",
            body: JSON.stringify(orderData),
        });
    },

    // 주문 상태 변경
    updateOrderStatus: async (id, status) => {
        return await apiCall(`/orders/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ status }),
        });
    },
};

export default {
    menuAPI,
    orderAPI,
};
