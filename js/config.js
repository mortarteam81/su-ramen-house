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
        cost: 800,
        unlockCost: 0,
        emoji: '🍜',
    },
    egg: {
        name: '계란 라면',
        ingredients: ['water', 'noodle', 'soup', 'egg'],
        cookTime: 6000,
        price: 4000,
        cost: 1100,
        unlockCost: 0,
        emoji: '🥚',
    },
    kimchi: {
        name: '김치 라면',
        ingredients: ['water', 'noodle', 'soup', 'kimchi'],
        cookTime: 6000,
        price: 4500,
        cost: 1400,
        unlockCost: 5000,
        emoji: '🥬',
    },
    spicy: {
        name: '매운 라면',
        ingredients: ['water', 'noodle', 'soup', 'chili'],
        cookTime: 6000,
        price: 4500,
        cost: 1400,
        unlockCost: 6000,
        emoji: '🌶️',
    },
    tteok: {
        name: '떡라면',
        ingredients: ['water', 'tteok', 'noodle', 'soup'],
        cookTime: 7000,
        price: 5000,
        cost: 1700,
        unlockCost: 7000,
        emoji: '🍡',
    },
    cheese: {
        name: '치즈 라면',
        ingredients: ['water', 'noodle', 'soup', 'cheese'],
        cookTime: 7000,
        price: 5500,
        cost: 1900,
        unlockCost: 8000,
        emoji: '🧀',
    },
    seafood: {
        name: '해물 라면',
        ingredients: ['water', 'seafood', 'noodle', 'soup'],
        cookTime: 8000,
        price: 6000,
        cost: 2400,
        unlockCost: 10000,
        emoji: '🦐',
    },
    special: {
        name: '스페셜 라면',
        ingredients: ['water', 'seafood', 'noodle', 'soup', 'egg', 'kimchi'],
        cookTime: 10000,
        price: 10000,
        cost: 4200,
        unlockCost: 20000,
        emoji: '⭐',
    },
};

// 고객 유형
export const CUSTOMER_TYPES = {
    normal: {
        name: '일반 손님',
        patience: 42000,
        tipMultiplier: 1.0,
        spawnWeight: 40,
        emoji: '😊',
        color: '#81C784',
    },
    rush: {
        name: '급한 직장인',
        patience: 26000,
        tipMultiplier: 1.5,
        spawnWeight: 20,
        emoji: '😠',
        color: '#E57373',
    },
    grandma: {
        name: '여유로운 할머니',
        patience: 60000,
        tipMultiplier: 1.0,
        spawnWeight: 15,
        emoji: '🤗',
        color: '#CE93D8',
    },
    vip: {
        name: 'VIP',
        patience: 38000,
        tipMultiplier: 2.0,
        spawnWeight: 5,
        emoji: '🤩',
        color: '#FFD700',
    },
    student: {
        name: '학생',
        patience: 48000,
        tipMultiplier: 0.8,
        spawnWeight: 15,
        emoji: '😄',
        color: '#64B5F6',
    },
    child: {
        name: '아이',
        patience: 56000,
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

// 난이도 프리셋: UI는 아직 고정(normal)이지만 밸런스 조정 지점을 한 곳에 모았다.
export const DIFFICULTY_PRESETS = {
    easy: {
        label: '쉬움',
        patienceMultiplier: 1.55,
        spawnIntervalMin: 9000,
        spawnIntervalMax: 15000,
        comboBonus: 600,
    },
    normal: {
        label: '보통',
        patienceMultiplier: 1.35,
        spawnIntervalMin: 7000,
        spawnIntervalMax: 12000,
        comboBonus: GAME.COMBO_BONUS,
    },
    challenge: {
        label: '도전',
        patienceMultiplier: 1.15,
        spawnIntervalMin: 5200,
        spawnIntervalMax: 9800,
        comboBonus: 700,
    },
};

export const DEFAULT_DIFFICULTY = 'normal';

// 간단한 일차/스테이지 구조. 우선 하루 단위 명확한 목표와 결과를 제공한다.
export const DAY_STAGES = [
    {
        index: 0,
        day: 1,
        title: '첫 영업일',
        introTitle: '작은 라면가게의 첫 오픈날',
        introText: '오늘은 가게 문을 여는 첫날이에요. 기본 라면부터 차근차근 만들며 손님의 마음을 잡아보세요.',
        goalServed: 5,
        difficulty: 'easy',
        goalText: '라면 5그릇 서빙',
        clearText: '첫 영업 성공! 손님들이 다시 오고 싶어 해요.',
        failText: '첫날은 누구나 서툴러요. 재료 순서와 손님 주문을 다시 확인해 봐요.',
    },
    {
        index: 1,
        day: 2,
        title: '학생들의 하교 시간',
        introTitle: '하교 시간의 작은 러시',
        introText: '학교가 끝나자 학생 손님들이 몰려왔어요. 기본 라면과 계란 라면을 빠르게 준비해 보세요.',
        goalServed: 7,
        difficulty: 'easy',
        goalText: '라면 7그릇 서빙',
        clearText: '학생 손님들이 배부르게 돌아갔어요. 가게 소문이 조금씩 퍼집니다!',
        failText: '하교 시간은 정신없죠. 냄비를 비우고 다시 순서를 잡아봐요.',
    },
    {
        index: 2,
        day: 3,
        title: '매운맛 소문',
        introTitle: '매운 라면을 찾는 손님들',
        introText: '가게의 매운맛이 입소문을 탔어요. 주문을 잘 보고 실수 없이 끓이는 게 중요합니다.',
        goalServed: 9,
        difficulty: 'normal',
        goalText: '라면 9그릇 서빙',
        clearText: '매운맛 소문이 제대로 났어요. 단골이 늘어날 것 같아요!',
        failText: '매운맛 주문은 헷갈리기 쉬워요. 주문 말풍선을 먼저 확인해 봐요.',
    },
    {
        index: 3,
        day: 4,
        title: '바쁜 점심시간',
        introTitle: '점심시간 러시',
        introText: '급한 직장인들이 짧은 점심시간에 찾아왔어요. 빠르지만 침착하게 움직여야 합니다.',
        goalServed: 10,
        difficulty: 'normal',
        goalText: '라면 10그릇 서빙',
        clearText: '점심 러시를 버텨냈어요. 이제 진짜 라면 장인 같아요!',
        failText: '바쁜 날에는 폐기 버튼도 전략이에요. 막힌 냄비를 빨리 정리해 봐요.',
    },
    {
        index: 4,
        day: 5,
        title: 'VIP 방문',
        introTitle: '소문을 듣고 온 특별한 손님',
        introText: '라면가게 소문을 듣고 VIP 손님까지 찾아왔어요. 오늘만 넘기면 가게는 완전히 자리 잡습니다.',
        goalServed: 12,
        difficulty: 'challenge',
        goalText: '라면 12그릇 서빙',
        clearText: '축하해요! 작은 라면가게가 동네 인기 맛집이 됐어요.',
        failText: '마지막 날은 어렵지만 여기까지 온 실력이 있어요. 다시 도전해 봐요.',
    },
];

// 초반 3명은 레시피가 짧고 인내심이 넉넉한 손님으로 고정해 첫 학습 곡선을 완만하게 한다.
export const EARLY_CUSTOMER_QUEUE = [
    { type: 'child', menuId: 'basic' },
    { type: 'grandma', menuId: 'basic' },
    { type: 'student', menuId: 'egg' },
];

// 메뉴 자동 해금 기준 (세션 누적 수익)
export const MENU_UNLOCK_THRESHOLDS = [
    { money: 5000, menuId: 'kimchi', message: '김치 라면 해금!' },
    { money: 12000, menuId: 'spicy', message: '매운 라면 해금!' },
    { money: 22000, menuId: 'tteok', message: '떡라면 해금!' },
    { money: 35000, menuId: 'cheese', message: '치즈 라면 해금!' },
    { money: 55000, menuId: 'seafood', message: '해물 라면 해금!' },
    { money: 80000, menuId: 'special', message: '⭐ 스페셜 라면 해금!' },
];

// 가게 꾸미기 아이템. 메뉴 해금과 분리된 순수 꾸미기 전용 구매 목록이다.
export const COSMETIC_ITEMS = {
    sign_neon: {
        id: 'sign_neon',
        type: 'sign',
        name: '네온 간판',
        description: '벽 간판이 반짝이는 네온 스타일로 바뀝니다.',
        emoji: '✨',
        cost: 2000,
    },
    counter_wood: {
        id: 'counter_wood',
        type: 'counter',
        name: '나무 조리대',
        description: '따뜻한 나무 무늬 조리대로 분위기를 바꿉니다.',
        emoji: '🪵',
        cost: 3000,
    },
    bowl_blue: {
        id: 'bowl_blue',
        type: 'bowl',
        name: '파란 그릇 테마',
        description: '완성 라면과 냄비 포인트가 시원한 파란 그릇 느낌으로 바뀝니다.',
        emoji: '💙',
        cost: 2500,
    },
};

export const DEFAULT_COSMETICS = {
    owned: [],
    equipped: {
        sign: 'default',
        counter: 'default',
        bowl: 'default',
    },
};

// 저장 키
export const STORAGE_KEY = 'ramen_shop_save';
