/* ===== 게임 루프 & 상태 관리 ===== */
import { COSMETIC_ITEMS, DAY_STAGES, DEFAULT_DIFFICULTY, DIFFICULTY_PRESETS, GAME, MENU_UNLOCK_THRESHOLDS, RECIPES } from './config.js';
import { CookingStation } from './cooking.js';
import { CustomerManager } from './customer.js';
import { MenuManager } from './menu.js';
import { loadGame, saveGame } from './storage.js';

const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
};

export class Game {
    constructor() {
        this.state = GAME_STATE.MENU;
        this.saveData = loadGame();

        // 매니저 초기화
        this.menuManager = new MenuManager(this.saveData.unlockedMenus);
        this.cooking = new CookingStation(GAME.MAX_POTS);
        this.customers = new CustomerManager(this.menuManager);

        // 게임 내 상태
        this.money = this.saveData.money;
        this.served = 0;
        this.lives = GAME.MAX_LIVES;
        this.combo = 0;
        this.maxCombo = 0;
        this.sessionMoney = 0;   // 이번 게임에서 번 돈
        this.currentDay = DAY_STAGES[0];
        this.difficultyKey = this.currentDay?.difficulty || DEFAULT_DIFFICULTY;
        this.difficulty = DIFFICULTY_PRESETS[this.difficultyKey] || DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY];
        this.dayCleared = false;

        // 콜백
        this.onUpdate = null;        // 매 프레임 UI 업데이트
        this.onCustomerSpawn = null;  // 고객 등장
        this.onCustomerLeave = null;  // 고객 퇴장
        this.onServeSuccess = null;   // 서빙 성공
        this.onGameOver = null;       // 게임 오버
        this.onCombo = null;          // 콤보 달성
        this.onComboBreak = null;     // 콤보 끊김
        this.onLifeLost = null;       // 생명 감소
        this.onMenuUnlock = null;     // 메뉴 해금
        this.onDayClear = null;       // 하루 목표 달성
        this.onCostCharged = null;    // 재료비 차감

        this._animFrameId = null;
        this._pauseStartTime = null;
    }

    /** 게임 시작 */
    startGame() {
        this.state = GAME_STATE.PLAYING;
        this.money = this.saveData.money;
        this.served = 0;
        this.lives = GAME.MAX_LIVES;
        this.combo = 0;
        this.maxCombo = 0;
        this.sessionMoney = 0;
        this.dayCleared = false;
        this.currentDay = DAY_STAGES[0];
        this.difficultyKey = this.currentDay?.difficulty || DEFAULT_DIFFICULTY;
        this.difficulty = DIFFICULTY_PRESETS[this.difficultyKey] || DIFFICULTY_PRESETS[DEFAULT_DIFFICULTY];

        this.cooking.resetAll();
        this.customers.setDifficulty(this.difficulty);
        const firstCustomer = this.customers.start();
        if (firstCustomer && this.onCustomerSpawn) {
            this.onCustomerSpawn(firstCustomer);
        }

        this._lastTime = Date.now();
        this._gameLoop();
    }

    /** 게임 루프 */
    _gameLoop() {
        if (this.state !== GAME_STATE.PLAYING) return;

        // 조리 업데이트
        this.cooking.update();

        // 고객 업데이트
        // 첫 라면을 완성하기 전에는 추가 손님을 막아 초반 목표를 흐리지 않는다.
        const customerResult = this.customers.update({ allowSpawn: this.served > 0 });

        // 새 고객 등장
        if (customerResult.spawned && this.onCustomerSpawn) {
            this.onCustomerSpawn(customerResult.spawned);
        }

        // 고객 떠남 (서빙 실패)
        for (const customer of customerResult.left) {
            this.lives--;
            this.breakCombo('손님이 떠나 콤보가 끊겼습니다!');
            if (this.onCustomerLeave) this.onCustomerLeave(customer);
            if (this.onLifeLost) this.onLifeLost(this.lives);

            if (this.lives <= 0) {
                this._endGame();
                return;
            }
        }

        // UI 업데이트 콜백
        if (this.onUpdate) this.onUpdate(this);

        this._animFrameId = requestAnimationFrame(() => this._gameLoop());
    }

    /** 서빙 시도 */
    tryServe(potId) {
        if (this.state !== GAME_STATE.PLAYING) return null;

        const pot = this.cooking.getPotState(potId);
        if (!pot || pot.state !== 'done') {
            this.breakCombo('서빙 흐름이 끊겼습니다!');
            return { success: false, reason: '아직 완성되지 않았습니다!' };
        }

        // 먼저 해당 레시피를 주문한 고객이 있는지 확인
        const customer = this.customers.findCustomerForRecipe(pot.targetRecipe);
        if (!customer) {
            this.breakCombo('주문과 맞지 않아 콤보가 끊겼습니다!');
            return { success: false, reason: '이 메뉴를 주문한 손님이 없습니다!' };
        }

        // 고객이 있으면 냄비에서 서빙
        const serveResult = this.cooking.serve(potId);
        if (!serveResult.success) {
            this.breakCombo('서빙 흐름이 끊겼습니다!');
            return serveResult;
        }

        // 서빙 성공 - 보상 계산
        const reward = this.customers.serveCustomer(customer.id);
        if (reward) {
            this.money += reward.total;
            this.sessionMoney += reward.total;
            this.served++;
            this.combo++;
            this.recordMenuServe(customer.menuId, reward);

            // 첫 그릇 성공 후에만 다음 손님 스폰 타이머를 다시 시작한다.
            if (this.served === 1) {
                this.customers.scheduleNextSpawn();
            }

            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // 콤보 보너스
            if (this.combo >= GAME.COMBO_THRESHOLD && this.combo % GAME.COMBO_THRESHOLD === 0) {
                const comboBonus = this.difficulty.comboBonus || GAME.COMBO_BONUS;
                this.money += comboBonus;
                this.sessionMoney += comboBonus;
                if (this.onCombo) this.onCombo(this.combo, comboBonus);
            }

            if (this.onServeSuccess) {
                this.onServeSuccess(customer, reward, this.combo);
            }

            // 수익 기반 메뉴 자동 해금 체크
            this.checkAutoUnlock();

            if (this.currentDay?.goalServed && this.served >= this.currentDay.goalServed) {
                this._completeDay();
            }
        }

        return { success: true, reward, customer };
    }

    recordMenuServe(menuId, reward) {
        if (!menuId || !reward) return;

        if (!this.saveData.menuStats || typeof this.saveData.menuStats !== 'object') {
            this.saveData.menuStats = {};
        }

        const current = this.saveData.menuStats[menuId] || { served: 0, bestTip: 0, bestReward: 0 };
        const tipTotal = Number(reward.tip) || 0;

        this.saveData.menuStats[menuId] = {
            served: (Number(current.served) || 0) + 1,
            bestTip: Math.max(Number(current.bestTip) || 0, tipTotal),
            bestReward: Math.max(Number(current.bestReward) || 0, Number(reward.total) || 0),
        };
    }

    breakCombo(message) {
        if (this.combo <= 0) return;
        const brokenCombo = this.combo;
        this.combo = 0;
        if (this.onComboBreak) this.onComboBreak(brokenCombo, message);
    }

    /** 재료 추가 */
    addIngredient(ingredientId) {
        if (this.state !== GAME_STATE.PLAYING) return null;
        const result = this.cooking.addIngredient(ingredientId);
        return this.applyCookingCostIfNeeded(result);
    }

    /** 특정 레시피로 조리 확정 */
    confirmCook(recipeId) {
        if (this.state !== GAME_STATE.PLAYING) return null;
        const result = this.cooking.confirmCook(recipeId);
        return this.applyCookingCostIfNeeded(result);
    }

    applyCookingCostIfNeeded(result) {
        if (!result?.success || !result.cooking || !result.recipeId) return result;

        const pot = this.cooking.getSelectedPot();
        if (!pot || pot.costCharged) return result;

        const cost = Math.max(0, Number(RECIPES[result.recipeId]?.cost) || 0);
        pot.costSpent = cost;
        pot.costCharged = true;
        if (cost > 0) {
            this.money -= cost;
            this.sessionMoney -= cost;
        }
        const costResult = { ...result, cost };
        if (this.onCostCharged) this.onCostCharged(costResult, pot);
        return costResult;
    }

    /** 냄비 폐기 */
    discardPot(potId) {
        if (this.state !== GAME_STATE.PLAYING) return null;
        return this.cooking.discardPot(potId);
    }

    /** 수익 기반 메뉴 자동 해금 */
    checkAutoUnlock() {
        for (const threshold of MENU_UNLOCK_THRESHOLDS) {
            if (this.sessionMoney >= threshold.money && !this.menuManager.isUnlocked(threshold.menuId)) {
                this.menuManager.forceUnlock(threshold.menuId);
                if (this.onMenuUnlock) {
                    this.onMenuUnlock(threshold.menuId, threshold.message, threshold.money);
                }
            }
        }
    }

    /** 냄비 선택 */
    selectPot(potIndex) {
        return this.cooking.selectPot(potIndex);
    }

    /** 일시정지 */
    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            this._pauseStartTime = Date.now();
            if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
        }
    }

    /** 재개 */
    resume() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            // 일시정지 시간만큼 보정
            if (this._pauseStartTime) {
                const pauseDuration = Date.now() - this._pauseStartTime;
                // 고객 도착 시간 보정
                for (const customer of this.customers.seats) {
                    if (customer && !customer.served && !customer.left) {
                        customer.arrivalTime += pauseDuration;
                    }
                }
                // 냄비 조리 시작 시간 보정
                for (const pot of this.cooking.pots) {
                    if (pot.cookStartTime) {
                        pot.cookStartTime += pauseDuration;
                    }
                }
                // 다음 스폰 시간 보정
                this.customers.nextSpawnTime += pauseDuration;
                this._pauseStartTime = null;
            }
            this._gameLoop();
        }
    }

    /** 게임 종료 */
    _endGame() {
        this.state = GAME_STATE.GAMEOVER;
        if (this._animFrameId) cancelAnimationFrame(this._animFrameId);

        this.customers.clearAll();

        // 저장
        this.saveData.money = this.money;
        this.saveData.totalServed += this.served;
        this.saveData.unlockedMenus = this.menuManager.getUnlocked();
        if (this.sessionMoney > this.saveData.highScore) {
            this.saveData.highScore = this.sessionMoney;
        }
        if (this.maxCombo > this.saveData.bestCombo) {
            this.saveData.bestCombo = this.maxCombo;
        }
        saveGame(this.saveData);

        if (this.onGameOver) {
            this.onGameOver({
                money: this.sessionMoney,
                served: this.served,
                maxCombo: this.maxCombo,
                day: this.currentDay,
                dayCleared: this.dayCleared,
            });
        }
    }

    /** 하루 목표 달성 */
    _completeDay() {
        if (this.dayCleared) return;
        this.dayCleared = true;
        if (this.onDayClear) this.onDayClear(this.currentDay);
        this._endGame();
    }

    /** 메뉴 해금 */
    unlockMenu(menuId) {
        const result = this.menuManager.unlock(menuId, this.money);
        if (result.success) {
            this.money -= result.cost;
            this.saveData.money = this.money;
            this.saveData.unlockedMenus = this.menuManager.getUnlocked();
            saveGame(this.saveData);
        }
        return result;
    }

    /** 꾸미기 아이템 구매 */
    buyCosmetic(itemId) {
        const item = COSMETIC_ITEMS[itemId];
        if (!item) return { success: false, reason: '알 수 없는 꾸미기 아이템입니다.' };

        const cosmetics = this.saveData.cosmetics;
        if (cosmetics.owned.includes(itemId)) {
            return { success: false, reason: '이미 보유한 아이템입니다.' };
        }
        if (this.money < item.cost) {
            return { success: false, reason: '소지금이 부족합니다.' };
        }

        this.money -= item.cost;
        cosmetics.owned.push(itemId);
        cosmetics.equipped[item.type] = itemId;
        this.saveData.money = this.money;
        saveGame(this.saveData);
        return { success: true, item };
    }

    /** 보유한 꾸미기 아이템 장착 */
    equipCosmetic(itemId) {
        const item = COSMETIC_ITEMS[itemId];
        if (!item) return { success: false, reason: '알 수 없는 꾸미기 아이템입니다.' };
        if (!this.saveData.cosmetics.owned.includes(itemId)) {
            return { success: false, reason: '먼저 구매해야 장착할 수 있습니다.' };
        }

        this.saveData.cosmetics.equipped[item.type] = itemId;
        saveGame(this.saveData);
        return { success: true, item };
    }

    /** 기본 꾸미기로 되돌리기 */
    equipDefaultCosmetic(type) {
        if (!this.saveData.cosmetics.equipped || !(type in this.saveData.cosmetics.equipped)) {
            return { success: false, reason: '알 수 없는 꾸미기 종류입니다.' };
        }
        this.saveData.cosmetics.equipped[type] = 'default';
        saveGame(this.saveData);
        return { success: true, type };
    }

    /** 메뉴 메인으로 */
    goToMenu() {
        this.state = GAME_STATE.MENU;
        if (this._animFrameId) cancelAnimationFrame(this._animFrameId);
        this.customers.clearAll();
        this.cooking.resetAll();
    }

    /** 소지금 (저장 데이터의 money) */
    getTotalMoney() {
        return this.money;
    }

    getCosmetics() {
        return this.saveData.cosmetics;
    }
}

export { GAME_STATE };
