/* ===== 요리 시스템 ===== */
import { RECIPES, INGREDIENTS, GAME } from './config.js';

/** 냄비 상태 */
const POT_STATE = {
    EMPTY: 'empty',
    FILLING: 'filling',     // 재료 넣는 중
    COOKING: 'cooking',     // 조리 중
    DONE: 'done',           // 조리 완료
    FAILED: 'failed',       // 재료 잘못 넣음
};

export class CookingStation {
    constructor(potCount = 2) {
        this.pots = [];
        for (let i = 0; i < potCount; i++) {
            this.pots.push(this.createEmptyPot(i));
        }
        this.selectedPot = null;  // 현재 선택된 냄비 인덱스
    }

    createEmptyPot(id) {
        return {
            id,
            state: POT_STATE.EMPTY,
            targetRecipe: null,        // 목표 레시피 ID (서빙 시 매칭용)
            addedIngredients: [],      // 지금까지 넣은 재료
            cookStartTime: null,       // 조리 시작 시간
            cookDuration: 0,           // 필요 조리 시간
            cookProgress: 0,           // 0~1
        };
    }

    /** 냄비 선택 */
    selectPot(potIndex) {
        const pot = this.pots[potIndex];
        if (!pot) return false;
        // 조리 중이거나 완료된 냄비는 선택만 가능 (상태 보기)
        this.selectedPot = potIndex;
        return true;
    }

    /** 선택 해제 */
    deselectPot() {
        this.selectedPot = null;
    }

    /** 선택된 냄비 가져오기 */
    getSelectedPot() {
        if (this.selectedPot === null) return null;
        return this.pots[this.selectedPot];
    }

    /** 재료 추가 */
    addIngredient(ingredientId) {
        const pot = this.getSelectedPot();
        if (!pot) return { success: false, reason: '냄비를 먼저 선택하세요!' };
        if (pot.state === POT_STATE.COOKING) return { success: false, reason: '조리 중입니다!' };
        if (pot.state === POT_STATE.DONE) return { success: false, reason: '이미 완성되었습니다!' };

        if (!INGREDIENTS[ingredientId]) return { success: false, reason: '알 수 없는 재료' };

        // 빈 냄비에 처음 재료를 넣을 때
        if (pot.state === POT_STATE.EMPTY) {
            pot.state = POT_STATE.FILLING;
        }

        pot.addedIngredients.push(ingredientId);

        // 어떤 레시피에 매칭되는지 확인
        const matchResult = this.checkRecipeMatch(pot);

        if (matchResult.status === 'wrong') {
            // 잘못된 재료 → 냄비 초기화
            const failedPot = { ...pot };
            this.resetPot(pot.id);
            return {
                success: false,
                reason: '재료 순서가 틀렸습니다!',
                failedPot,
            };
        }

        if (matchResult.status === 'complete') {
            // 레시피 완성 → 조리 시작
            pot.targetRecipe = matchResult.recipeId;
            pot.cookDuration = RECIPES[matchResult.recipeId].cookTime;
            pot.cookStartTime = Date.now();
            pot.state = POT_STATE.COOKING;
            return {
                success: true,
                cooking: true,
                recipeId: matchResult.recipeId,
                recipeName: RECIPES[matchResult.recipeId].name,
            };
        }

        // 아직 재료 넣는 중 (부분 매칭)
        return {
            success: true,
            cooking: false,
            possibleRecipes: matchResult.possibleRecipes,
            confirmableRecipes: matchResult.confirmableRecipes || null,
        };
    }

    /** 특정 레시피로 조리 확정 (짧은 레시피 선택 시) */
    confirmCook(recipeId) {
        const pot = this.getSelectedPot();
        if (!pot) return { success: false, reason: '냄비를 먼저 선택하세요!' };
        if (pot.state !== POT_STATE.FILLING) return { success: false, reason: '재료를 넣는 중이 아닙니다!' };

        const recipe = RECIPES[recipeId];
        if (!recipe) return { success: false, reason: '알 수 없는 레시피' };

        // 현재 넣은 재료가 해당 레시피와 완전 일치하는지 확인
        if (pot.addedIngredients.length !== recipe.ingredients.length) {
            return { success: false, reason: '재료 수가 맞지 않습니다!' };
        }
        for (let i = 0; i < pot.addedIngredients.length; i++) {
            if (pot.addedIngredients[i] !== recipe.ingredients[i]) {
                return { success: false, reason: '재료가 일치하지 않습니다!' };
            }
        }

        pot.targetRecipe = recipeId;
        pot.cookDuration = recipe.cookTime;
        pot.cookStartTime = Date.now();
        pot.state = POT_STATE.COOKING;
        return {
            success: true,
            cooking: true,
            recipeId,
            recipeName: recipe.name,
        };
    }

    /** 레시피 매칭 확인 */
    checkRecipeMatch(pot) {
        const added = pot.addedIngredients;
        const completeMatches = [];   // 지금 재료로 완성 가능한 레시피
        const longerMatches = [];     // 재료를 더 넣으면 완성 가능한 레시피

        for (const [id, recipe] of Object.entries(RECIPES)) {
            const recipeIngredients = recipe.ingredients;

            // 지금까지 넣은 재료가 레시피의 앞부분과 일치하는지
            let match = true;
            for (let i = 0; i < added.length; i++) {
                if (i >= recipeIngredients.length || added[i] !== recipeIngredients[i]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                if (added.length === recipeIngredients.length) {
                    completeMatches.push(id);
                } else {
                    longerMatches.push(id);
                }
            }
        }

        // 아무것도 매칭 안 됨 → 잘못된 재료
        if (completeMatches.length === 0 && longerMatches.length === 0) {
            return { status: 'wrong' };
        }

        // 완성 가능한 레시피가 있지만, 더 긴 레시피도 가능한 경우
        // → 플레이어가 선택할 수 있도록 partial 반환
        if (completeMatches.length > 0 && longerMatches.length > 0) {
            return {
                status: 'partial',
                possibleRecipes: [...longerMatches],
                confirmableRecipes: [...completeMatches],  // 지금 바로 조리 가능
            };
        }

        // 완성 가능한 레시피만 있고 더 긴 레시피는 없는 경우 → 자동 조리
        if (completeMatches.length > 0 && longerMatches.length === 0) {
            return { status: 'complete', recipeId: completeMatches[0] };
        }

        // 더 긴 레시피만 가능 → 계속 재료 넣기
        return { status: 'partial', possibleRecipes: longerMatches };
    }

    /** 냄비 초기화 */
    resetPot(potId) {
        this.pots[potId] = this.createEmptyPot(potId);
        if (this.selectedPot === potId) {
            this.selectedPot = potId; // 유지
        }
    }

    /** 게임 루프에서 호출 - 조리 진행 업데이트 */
    update() {
        const now = Date.now();
        for (const pot of this.pots) {
            if (pot.state === POT_STATE.COOKING) {
                const elapsed = now - pot.cookStartTime;
                pot.cookProgress = Math.min(elapsed / pot.cookDuration, 1);

                if (pot.cookProgress >= 1) {
                    pot.state = POT_STATE.DONE;
                    pot.cookProgress = 1;
                }
            }
        }
    }

    /** 서빙 - 완성된 냄비의 레시피 ID 반환 후 초기화 */
    serve(potId) {
        const pot = this.pots[potId];
        if (!pot || pot.state !== POT_STATE.DONE) {
            return { success: false, reason: '아직 완성되지 않았습니다!' };
        }

        const recipeId = pot.targetRecipe;
        this.resetPot(potId);
        return { success: true, recipeId };
    }

    /** 냄비 상태 가져오기 */
    getPotState(potId) {
        return this.pots[potId];
    }

    /** 모든 냄비 초기화 */
    resetAll() {
        for (let i = 0; i < this.pots.length; i++) {
            this.pots[i] = this.createEmptyPot(i);
        }
        this.selectedPot = null;
    }
}

export { POT_STATE };
