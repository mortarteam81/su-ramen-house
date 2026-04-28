/* ===== 로컬 스토리지 관리 ===== */
import { DEFAULT_COSMETICS, STORAGE_KEY } from './config.js';

const DEFAULT_SAVE = {
    money: 0,
    highScore: 0,
    totalServed: 0,
    unlockedMenus: ['basic', 'egg'],
    bestCombo: 0,
    menuStats: {},
    cosmetics: DEFAULT_COSMETICS,
};

function normalizeCosmetics(cosmetics = {}) {
    return {
        owned: Array.isArray(cosmetics.owned) ? [...new Set(cosmetics.owned)] : [],
        equipped: {
            ...DEFAULT_COSMETICS.equipped,
            ...(cosmetics.equipped || {}),
        },
    };
}

function normalizeMenuStats(menuStats = {}) {
    if (!menuStats || typeof menuStats !== 'object' || Array.isArray(menuStats)) return {};

    return Object.fromEntries(Object.entries(menuStats).map(([menuId, stats]) => {
        const safeStats = stats && typeof stats === 'object' ? stats : {};
        return [menuId, {
            served: Math.max(0, Number(safeStats.served) || 0),
            bestTip: Math.max(0, Number(safeStats.bestTip) || 0),
            bestReward: Math.max(0, Number(safeStats.bestReward) || 0),
        }];
    }));
}

function createDefaultSave() {
    return {
        ...DEFAULT_SAVE,
        unlockedMenus: [...DEFAULT_SAVE.unlockedMenus],
        menuStats: {},
        cosmetics: normalizeCosmetics(DEFAULT_SAVE.cosmetics),
    };
}

export function loadGame() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return {
                ...DEFAULT_SAVE,
                ...parsed,
                unlockedMenus: Array.isArray(parsed.unlockedMenus) ? parsed.unlockedMenus : DEFAULT_SAVE.unlockedMenus,
                menuStats: normalizeMenuStats(parsed.menuStats),
                cosmetics: normalizeCosmetics(parsed.cosmetics),
            };
        }
    } catch (e) {
        console.warn('저장 데이터 로드 실패:', e);
    }
    return createDefaultSave();
}

export function saveGame(data) {
    try {
        const saveData = {
            money: data.money,
            highScore: data.highScore,
            totalServed: data.totalServed,
            unlockedMenus: data.unlockedMenus,
            bestCombo: data.bestCombo,
            menuStats: normalizeMenuStats(data.menuStats),
            cosmetics: normalizeCosmetics(data.cosmetics),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.warn('저장 실패:', e);
    }
}

export function resetSave() {
    localStorage.removeItem(STORAGE_KEY);
    return createDefaultSave();
}
