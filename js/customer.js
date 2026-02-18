/* ===== 고객 시스템 ===== */
import { CUSTOMER_TYPES, GAME, RECIPES } from './config.js';

let customerIdCounter = 0;

export class Customer {
    constructor(type, menuId, seatIndex) {
        this.id = ++customerIdCounter;
        this.type = type;
        this.typeData = CUSTOMER_TYPES[type];
        this.menuId = menuId;
        this.seatIndex = seatIndex;
        this.arrivalTime = Date.now();
        this.patience = this.typeData.patience;
        this.patienceRemaining = 1.0;
        this.served = false;
        this.left = false;
    }

    /** 매 프레임 업데이트 */
    update() {
        if (this.served || this.left) return;

        const elapsed = Date.now() - this.arrivalTime;
        this.patienceRemaining = Math.max(0, 1 - elapsed / this.patience);

        if (this.patienceRemaining <= 0) {
            this.left = true;
        }
    }

    /** 서빙 성공 처리 */
    serve() {
        this.served = true;
        return this.calculateReward();
    }

    /** 보상 계산 */
    calculateReward() {
        const basePrice = this.getMenuPrice();
        const tipMultiplier = this.typeData.tipMultiplier;

        // 빠른 서빙 보너스 (남은 인내심 비율 기반)
        const speedBonus = Math.floor(basePrice * this.patienceRemaining * GAME.SPEED_BONUS_RATIO);

        const total = Math.floor(basePrice * tipMultiplier) + speedBonus;

        return {
            basePrice,
            tip: Math.floor(basePrice * (tipMultiplier - 1)),
            speedBonus,
            total,
        };
    }

    /** 주문 메뉴 가격 */
    getMenuPrice() {
        return RECIPES[this.menuId]?.price || 3000;
    }
}

export class CustomerManager {
    constructor(menuManager) {
        this.menuManager = menuManager;
        this.seats = new Array(GAME.MAX_SEATS).fill(null);
        this.nextSpawnTime = 0;
        this.spawnEnabled = false;
    }

    /** 게임 시작 시 호출 */
    start() {
        this.seats.fill(null);
        this.spawnEnabled = true;
        this.scheduleNextSpawn();
        customerIdCounter = 0;
    }

    /** 다음 고객 스폰 예약 */
    scheduleNextSpawn() {
        const delay = GAME.SPAWN_INTERVAL_MIN +
            Math.random() * (GAME.SPAWN_INTERVAL_MAX - GAME.SPAWN_INTERVAL_MIN);
        this.nextSpawnTime = Date.now() + delay;
    }

    /** 고객 유형 랜덤 선택 (가중치 기반) */
    pickRandomType() {
        const types = Object.entries(CUSTOMER_TYPES);
        const totalWeight = types.reduce((sum, [, data]) => sum + data.spawnWeight, 0);
        let rand = Math.random() * totalWeight;

        for (const [key, data] of types) {
            rand -= data.spawnWeight;
            if (rand <= 0) return key;
        }
        return 'normal';
    }

    /** 빈 자리 찾기 */
    findEmptySeat() {
        for (let i = 0; i < this.seats.length; i++) {
            if (this.seats[i] === null) return i;
        }
        return -1;
    }

    /** 매 프레임 업데이트 */
    update() {
        const results = { spawned: null, left: [] };

        // 고객 스폰 체크
        if (this.spawnEnabled && Date.now() >= this.nextSpawnTime) {
            const seatIndex = this.findEmptySeat();
            if (seatIndex !== -1) {
                const type = this.pickRandomType();
                const typeData = CUSTOMER_TYPES[type];

                // 고객 유형에 따른 메뉴 제한
                const menuId = this.menuManager.getRandomMenu(typeData.allowedMenus || null);

                const customer = new Customer(type, menuId, seatIndex);
                this.seats[seatIndex] = customer;
                results.spawned = customer;
            }
            this.scheduleNextSpawn();
        }

        // 모든 고객 업데이트
        for (let i = 0; i < this.seats.length; i++) {
            const customer = this.seats[i];
            if (customer && !customer.served && !customer.left) {
                customer.update();
                if (customer.left) {
                    results.left.push(customer);
                    this.seats[i] = null;
                }
            }
        }

        return results;
    }

    /** 서빙 시도 - 해당 레시피를 주문한 고객 찾기 */
    findCustomerForRecipe(recipeId) {
        let bestMatch = null;
        let lowestPatience = Infinity;

        for (const customer of this.seats) {
            if (customer && !customer.served && !customer.left && customer.menuId === recipeId) {
                if (customer.patienceRemaining < lowestPatience) {
                    lowestPatience = customer.patienceRemaining;
                    bestMatch = customer;
                }
            }
        }
        return bestMatch;
    }

    /** 고객 서빙 완료 후 제거 */
    serveCustomer(customerId) {
        for (let i = 0; i < this.seats.length; i++) {
            if (this.seats[i] && this.seats[i].id === customerId) {
                const customer = this.seats[i];
                const reward = customer.serve();
                // 잠시 후 자리에서 제거 (애니메이션 시간)
                const seatIdx = i;
                setTimeout(() => {
                    this.seats[seatIdx] = null;
                }, 800);
                return reward;
            }
        }
        return null;
    }

    /** 현재 앉아있는 고객 수 */
    getCustomerCount() {
        return this.seats.filter(s => s !== null && !s.left).length;
    }

    /** 모든 고객 제거 */
    clearAll() {
        this.seats.fill(null);
        this.spawnEnabled = false;
    }
}
