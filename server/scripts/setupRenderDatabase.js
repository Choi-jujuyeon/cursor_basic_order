const { Pool } = require("pg");

// Render PostgreSQL 데이터베이스 연결 설정
const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        "postgresql://coffee_user:BlOWEL6QWcNqwlqzln06qvFk7IbW4wnl@dpg-d3st6424d50c73el2gg0-a.oregon-postgres.render.com:5432/coffee_order_db_gll7",
    ssl: {
        rejectUnauthorized: false,
    },
});

async function setupRenderDatabase() {
    const connectionString =
        process.env.DATABASE_URL ||
        "postgresql://coffee_user:BlOWEL6QWcNqwlqzln06qvFk7IbW4wnl@dpg-d3st6424d50c73el2gg0-a.oregon-postgres.render.com:5432/coffee_order_db_gll7";

    console.log("DATABASE_URL:", connectionString ? "설정됨" : "설정되지 않음");

    const client = await pool.connect();

    try {
        console.log("Render PostgreSQL 데이터베이스에 연결되었습니다.");

        // 테이블 삭제 (역순으로 외래 키 제약 조건 고려)
        console.log("데이터베이스 테이블을 삭제하는 중 (존재하는 경우)...");
        await client.query(`DROP TABLE IF EXISTS order_items CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS orders CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS options CASCADE;`);
        await client.query(`DROP TABLE IF EXISTS menus CASCADE;`);
        console.log("✅ 기존 테이블 삭제 완료");

        // 테이블 생성
        console.log("데이터베이스 테이블을 생성하는 중...");

        // Menus 테이블
        await client.query(`
            CREATE TABLE IF NOT EXISTS menus (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                price INTEGER NOT NULL,
                image_url VARCHAR(255),
                stock INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Menus 테이블 생성 완료");

        // Options 테이블
        await client.query(`
            CREATE TABLE IF NOT EXISTS options (
                id SERIAL PRIMARY KEY,
                menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                price INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Options 테이블 생성 완료");

        // Orders 테이블 (ENUM 타입 생성)
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE ORDER_STATUS AS ENUM ('RECEIVED', 'MAKING', 'COMPLETED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                total_amount INTEGER NOT NULL,
                status ORDER_STATUS NOT NULL DEFAULT 'RECEIVED',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Orders 테이블 생성 완료");

        // Order_Items 테이블
        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
                quantity INTEGER NOT NULL,
                unit_price INTEGER NOT NULL,
                options JSONB DEFAULT '[]',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Order_Items 테이블 생성 완료");

        // 인덱스 생성
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time DESC);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_options_menu_id ON options(menu_id);
        `);
        console.log("✅ 인덱스 생성 완료");

        console.log("🎉 모든 테이블이 성공적으로 생성되었습니다!");

        // 초기 데이터 삽입
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
        console.log("📊 데이터베이스 스키마 설정 완료!");
    } catch (error) {
        console.error("데이터베이스 설정 중 오류 발생:", error);
        throw error;
    } finally {
        client.release();
    }
}

// 스크립트가 직접 실행될 때만 함수 호출
if (require.main === module) {
    setupRenderDatabase()
        .then(() => {
            console.log("🚀 Render 데이터베이스 설정이 완료되었습니다!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Render 데이터베이스 설정 실패:", error.message);
            process.exit(1);
        });
}

module.exports = { setupRenderDatabase, pool };
