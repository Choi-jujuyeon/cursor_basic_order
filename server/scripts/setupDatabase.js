const { pool } = require("../config/database");

// 데이터베이스 스키마 생성
const createTables = async () => {
    const client = await pool.connect();

    try {
        console.log("데이터베이스 테이블을 생성하는 중...");

        // Menus 테이블 생성
        await client.query(`
            CREATE TABLE IF NOT EXISTS menus (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price INTEGER NOT NULL,
                image_url VARCHAR(255),
                stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Menus 테이블 생성 완료");

        // Options 테이블 생성
        await client.query(`
            CREATE TABLE IF NOT EXISTS options (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price INTEGER NOT NULL DEFAULT 0,
                menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Options 테이블 생성 완료");

        // Orders 테이블 생성
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'RECEIVED',
                total_amount INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Orders 테이블 생성 완료");

        // Order_Items 테이블 생성
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                menu_id INTEGER REFERENCES menus(id),
                quantity INTEGER NOT NULL,
                unit_price INTEGER NOT NULL,
                options JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Order_Items 테이블 생성 완료");

        // 인덱스 생성
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        `);
        console.log("✅ 인덱스 생성 완료");

        console.log("🎉 모든 테이블이 성공적으로 생성되었습니다!");
    } catch (error) {
        console.error("테이블 생성 중 오류 발생:", error);
        throw error;
    } finally {
        client.release();
    }
};

// 초기 데이터 삽입
const insertInitialData = async () => {
    const client = await pool.connect();

    try {
        console.log("초기 데이터를 삽입하는 중...");

        // 메뉴 데이터 삽입
        const menuQueries = [
            {
                name: "아메리카노",
                description: "깔끔한 에스프레소와 물의 조화",
                price: 4000,
                image_url: "/images/americano.jpg",
                stock: 10,
            },
            {
                name: "카페라떼",
                description: "부드러운 우유 거품이 올라간 에스프레소",
                price: 5000,
                image_url: "/images/cafelatte.jpg",
                stock: 10,
            },
            {
                name: "카푸치노",
                description: "진한 에스프레소와 풍부한 우유 거품",
                price: 5000,
                image_url: "/images/cappuccino.jpg",
                stock: 10,
            },
            {
                name: "카라멜 마키아토",
                description: "달콤한 카라멜 시럽이 어우러진 라떼",
                price: 6000,
                image_url: "/images/caramel-macchiato.jpg",
                stock: 10,
            },
        ];

        // 메뉴 삽입 및 ID 수집
        const menuIds = [];
        for (const menu of menuQueries) {
            const result = await client.query(
                `
                INSERT INTO menus (name, description, price, image_url, stock)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING
                RETURNING id
            `,
                [
                    menu.name,
                    menu.description,
                    menu.price,
                    menu.image_url,
                    menu.stock,
                ]
            );

            if (result.rows.length > 0) {
                menuIds.push(result.rows[0].id);
            } else {
                // 이미 존재하는 경우 ID 조회
                const existingMenu = await client.query(
                    "SELECT id FROM menus WHERE name = $1",
                    [menu.name]
                );
                if (existingMenu.rows.length > 0) {
                    menuIds.push(existingMenu.rows[0].id);
                }
            }
        }
        console.log("✅ 메뉴 데이터 삽입 완료");

        // 옵션 데이터 삽입 (실제 메뉴 ID 사용)
        const optionQueries = [];
        menuIds.forEach((menuId, index) => {
            optionQueries.push(
                { name: "ICE", price: 0, menu_id: menuId },
                { name: "HOT", price: 0, menu_id: menuId },
                { name: "샷 추가", price: 500, menu_id: menuId },
                { name: "시럽 추가", price: 0, menu_id: menuId }
            );
        });

        for (const option of optionQueries) {
            await client.query(
                `
                INSERT INTO options (name, price, menu_id)
                VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
            `,
                [option.name, option.price, option.menu_id]
            );
        }
        console.log("✅ 옵션 데이터 삽입 완료");

        console.log("🎉 초기 데이터 삽입이 완료되었습니다!");
    } catch (error) {
        console.error("초기 데이터 삽입 중 오류 발생:", error);
        throw error;
    } finally {
        client.release();
    }
};

// 메인 실행 함수
const setupDatabase = async () => {
    try {
        await createTables();
        await insertInitialData();
        console.log("🚀 데이터베이스 설정이 완료되었습니다!");
    } catch (error) {
        console.error("데이터베이스 설정 실패:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

// 스크립트가 직접 실행될 때만 setupDatabase 실행
if (require.main === module) {
    setupDatabase();
}

module.exports = {
    createTables,
    insertInitialData,
    setupDatabase,
};
