/* ===== 게임 루프 & 상태 관리 ===== */
import { GAME } from './config.js';
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
        this.money = 0;
        this.served = 0;
        this.lives = GAME.MAX_LIVES;
        this.combo = 0;
        this.maxCombo = 0;
        this.sessionMoney = 0;   // 이번 게임에서 번 돈

        // 콜백
        this.onUpdate = null;        // 매 프레임 UI 업데이트
        this.onCustomerSpawn = null;  // 고객 등장
        this.onCustomerLeave = null;  // 고객 퇴장
        this.onServeSuccess = null;   // 서빙 성공
        this.onGameOver = null;       // 게임 오버
        this.onCombo = null;          // 콤보 달성
        this.onLifeLost = null;       // 생명 감소

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

        this.cooking.resetAll();
        this.customers.start();

        this._lastTime = Date.now();
        this._gameLoop();
    }

    /** 게임 루프 */
    _gameLoop() {
        if (this.state !== GAME_STATE.PLAYING) return;

        // 조리 업데이트
        this.cooking.update();

        // 고객 업데이트
        const customerResult = this.customers.update();

        // 새 고객 등장
        if (customerResult.spawned && this.onCustomerSpawn) {
            this.onCustomerSpawn(customerResult.spawned);
        }

        // 고객 떠남 (서빙 실패)
        for (const customer of customerResult.left) {
            this.lives--;
            this.combo = 0;
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
            return { success: false, reason: '아직 완성되지 않았습니다!' };
        }

        // 먼저 해당 레시피를 주문한 고객이 있는지 확인
        const customer = this.customers.findCustomerForRecipe(pot.targetRecipe);
        if (!customer) {
            return { success: false, reason: '이 메뉴를 주문한 손님이 없습니다!' };
        }

        // 고객이 있으면 냄비에서 서빙
        const serveResult = this.cooking.serve(potId);
        if (!serveResult.success) return serveResult;

        // 서빙 성공 - 보상 계산
        const reward = this.customers.serveCustomer(customer.id);
        if (reward) {
            this.money += reward.total;
            this.sessionMoney += reward.total;
            this.served++;
            this.combo++;

            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // 콤보 보너스
            if (this.combo >= GAME.COMBO_THRESHOLD && this.combo % GAME.COMBO_THRESHOLD === 0) {
                this.money += GAME.COMBO_BONUS;
                this.sessionMoney += GAME.COMBO_BONUS;
                if (this.onCombo) this.onCombo(this.combo, GAME.COMBO_BONUS);
            }

            if (this.onServeSuccess) {
                this.onServeSuccess(customer, reward, this.combo);
            }
        }

        return { success: true, reward, customer };
    }

    /** 재료 추가 */
    addIngredient(ingredientId) {
        if (this.state !== GAME_STATE.PLAYING) return null;
        return this.cooking.addIngredient(ingredientId);
    }

    /** 특정 레시피로 조리 확정 */
    confirmCook(recipeId) {
        if (this.state !== GAME_STATE.PLAYING) return null;
        return this.cooking.confirmCook(recipeId);
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
            });
        }
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
}

export { GAME_STATE };
