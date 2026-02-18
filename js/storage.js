/* ===== 로컬 스토리지 관리 ===== */
import { STORAGE_KEY } from './config.js';

const DEFAULT_SAVE = {
    money: 0,
    highScore: 0,
    totalServed: 0,
    unlockedMenus: ['basic', 'egg'],
    bestCombo: 0,
};

export function loadGame() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return { ...DEFAULT_SAVE, ...parsed };
        }
    } catch (e) {
        console.warn('저장 데이터 로드 실패:', e);
    }
    return { ...DEFAULT_SAVE };
}

export function saveGame(data) {
    try {
        const saveData = {
            money: data.money,
            highScore: data.highScore,
            totalServed: data.totalServed,
            unlockedMenus: data.unlockedMenus,
            bestCombo: data.bestCombo,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.warn('저장 실패:', e);
    }
}

export function resetSave() {
    localStorage.removeItem(STORAGE_KEY);
    return { ...DEFAULT_SAVE };
}
