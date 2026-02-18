// ===== 게임 설정 상수 =====

// 재료 목록
export const INGREDIENTS = {
    water: { name: '물', emoji: '💧', color: '#4FC3F7' },
    noodle: { name: '면', emoji: '🍜', color: '#FFD54F' },
    soup: { name: '스프', emoji: '🧂', color: '#FF8A65' },
    egg: { name: '계란', emoji: '🥚', color: '#FFF9C4' },
    kimchi: { name: '김치', emoji: '🥬', color: '#E53935' },
    seafood: { name: '해물', emoji: '🦐', color: '#FF7043' },
    cheese: { name: '치즈', emoji: '🧀', color: '#FFC107' },
    tteok: { name: '떡', emoji: '🍡', color: '#F5F5F5' },
    chili: { name: '고추', emoji: '🌶️', color: '#D32F2F' },
};

// 라면 레시피
export const RECIPES = {
    basic: {
        name: '기본 라면',
        ingredients: ['water', 'noodle', 'soup'],
        cookTime: 5000,
        price: 3000,
        unlockCost: 0,
        emoji: '🍜',
    },
    egg: {
        name: '계란 라면',
        ingredients: ['water', 'noodle', 'soup', 'egg'],
        cookTime: 6000,
        price: 4000,
        unlockCost: 0,
        emoji: '🥚',
    },
    kimchi: {
        name: '김치 라면',
        ingredients: ['water', 'noodle', 'soup', 'kimchi'],
        cookTime: 6000,
        price: 4500,
        unlockCost: 5000,
        emoji: '🥬',
    },
    spicy: {
        name: '매운 라면',
        ingredients: ['water', 'noodle', 'soup', 'chili'],
        cookTime: 6000,
        price: 4500,
        unlockCost: 6000,
        emoji: '🌶️',
    },
    tteok: {
        name: '떡라면',
        ingredients: ['water', 'tteok', 'noodle', 'soup'],
        cookTime: 7000,
        price: 5000,
        unlockCost: 7000,
        emoji: '🍡',
    },
    cheese: {
        name: '치즈 라면',
        ingredients: ['water', 'noodle', 'soup', 'cheese'],
        cookTime: 7000,
        price: 5500,
        unlockCost: 8000,
        emoji: '🧀',
    },
    seafood: {
        name: '해물 라면',
        ingredients: ['water', 'seafood', 'noodle', 'soup'],
        cookTime: 8000,
        price: 6000,
        unlockCost: 10000,
        emoji: '🦐',
    },
    special: {
        name: '스페셜 라면',
        ingredients: ['water', 'seafood', 'noodle', 'soup', 'egg', 'kimchi'],
        cookTime: 10000,
        price: 10000,
        unlockCost: 20000,
        emoji: '⭐',
    },
};

// 고객 유형
export const CUSTOMER_TYPES = {
    normal: {
        name: '일반 손님',
        patience: 30000,
        tipMultiplier: 1.0,
        spawnWeight: 40,
        emoji: '😊',
        color: '#81C784',
    },
    rush: {
        name: '급한 직장인',
        patience: 15000,
        tipMultiplier: 1.5,
        spawnWeight: 20,
        emoji: '😠',
        color: '#E57373',
    },
    grandma: {
        name: '여유로운 할머니',
        patience: 45000,
        tipMultiplier: 1.0,
        spawnWeight: 15,
        emoji: '🤗',
        color: '#CE93D8',
    },
    vip: {
        name: 'VIP',
        patience: 25000,
        tipMultiplier: 2.0,
        spawnWeight: 5,
        emoji: '🤩',
        color: '#FFD700',
    },
    student: {
        name: '학생',
        patience: 35000,
        tipMultiplier: 0.8,
        spawnWeight: 15,
        emoji: '😄',
        color: '#64B5F6',
    },
    child: {
        name: '아이',
        patience: 40000,
        tipMultiplier: 0.7,
        spawnWeight: 5,
        emoji: '🧒',
        color: '#FFB74D',
        // 아이는 기본/계란 라면만 주문
        allowedMenus: ['basic', 'egg'],
    },
};

// 게임 밸런스 상수
export const GAME = {
    MAX_SEATS: 5,            // 최대 고객 자리 수
    MAX_POTS: 2,             // 냄비 수
    MAX_LIVES: 3,            // 최대 생명
    SPAWN_INTERVAL_MIN: 3000,  // 고객 최소 도착 간격 (ms)
    SPAWN_INTERVAL_MAX: 8000,  // 고객 최대 도착 간격 (ms)
    SPEED_BONUS_RATIO: 0.5,   // 빠른 서빙 시 보너스 (남은 인내심 비율)
    WRONG_INGREDIENT_PENALTY: 1000, // 재료 잘못 넣었을 때 딜레이 (ms)
    INITIAL_MONEY: 0,
    COMBO_THRESHOLD: 3,       // 연속 성공 콤보 기준
    COMBO_BONUS: 500,          // 콤보 보너스 금액
};

// 저장 키
export const STORAGE_KEY = 'ramen_shop_save';
