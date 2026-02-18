/* ===== 메뉴/레시피 관리 ===== */
import { RECIPES } from './config.js';

export class MenuManager {
    constructor(unlockedMenus = ['basic', 'egg']) {
        this.unlockedMenus = [...unlockedMenus];
    }

    /** 해금된 메뉴 ID 목록 */
    getUnlocked() {
        return [...this.unlockedMenus];
    }

    /** 특정 메뉴가 해금됐는지 */
    isUnlocked(menuId) {
        return this.unlockedMenus.includes(menuId);
    }

    /** 해금 가능한 메뉴 목록 (아직 해금 안 된 것들) */
    getLockable() {
        return Object.keys(RECIPES).filter(id => !this.isUnlocked(id));
    }

    /** 메뉴 해금 시도 - 성공 시 true 반환 */
    unlock(menuId, currentMoney) {
        const recipe = RECIPES[menuId];
        if (!recipe) return { success: false, reason: '존재하지 않는 메뉴' };
        if (this.isUnlocked(menuId)) return { success: false, reason: '이미 해금됨' };
        if (currentMoney < recipe.unlockCost) return { success: false, reason: '돈이 부족합니다' };

        this.unlockedMenus.push(menuId);
        return { success: true, cost: recipe.unlockCost };
    }

    /** 레시피 정보 가져오기 */
    getRecipe(menuId) {
        return RECIPES[menuId] || null;
    }

    /** 모든 메뉴 정보 (해금 상태 포함) */
    getAllMenuInfo() {
        return Object.entries(RECIPES).map(([id, recipe]) => ({
            id,
            ...recipe,
            unlocked: this.isUnlocked(id),
        }));
    }

    /** 허용된 메뉴 중 랜덤 선택 (고객 유형 고려) */
    getRandomMenu(allowedMenus = null) {
        let pool;
        if (allowedMenus) {
            pool = allowedMenus.filter(id => this.isUnlocked(id));
        } else {
            pool = this.getUnlocked();
        }
        if (pool.length === 0) pool = ['basic'];
        return pool[Math.floor(Math.random() * pool.length)];
    }
}
