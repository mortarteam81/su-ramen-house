/* ===== 메인 엔트리 포인트 ===== */
import { Game, GAME_STATE } from './game.js';
import { UI } from './ui.js';
import { RECIPES, INGREDIENTS, CUSTOMER_TYPES } from './config.js';

// 초기화
const game = new Game();
const ui = new UI();

// ===== 화면 초기화 =====
function initMenuScreen() {
    ui.updateMenuScreen(game.saveData);
    ui.showScreen('menu');
}

// ===== 이벤트 바인딩 =====

// 메인 메뉴 버튼
document.getElementById('btn-start').addEventListener('click', () => {
    startNewGame();
});

document.getElementById('btn-shop').addEventListener('click', () => {
    openShop();
});

document.getElementById('btn-howto').addEventListener('click', () => {
    ui.showScreen('howto');
});

document.getElementById('btn-howto-back').addEventListener('click', () => {
    ui.showScreen('menu');
});

// 상점
document.getElementById('btn-shop-back').addEventListener('click', () => {
    if (game.state === GAME_STATE.PAUSED) {
        ui.showScreen('game');
        ui.showPause();
    } else {
        ui.showScreen('menu');
    }
});

// 일시정지
document.getElementById('btn-pause').addEventListener('click', () => {
    game.pause();
    ui.showPause();
});

document.getElementById('btn-resume').addEventListener('click', () => {
    game.resume();
    ui.hidePause();
});

document.getElementById('btn-shop-ingame').addEventListener('click', () => {
    openShop();
});

document.getElementById('btn-quit').addEventListener('click', () => {
    game.goToMenu();
    initMenuScreen();
});

// 게임 오버
document.getElementById('btn-retry').addEventListener('click', () => {
    startNewGame();
});

document.getElementById('btn-tomenu').addEventListener('click', () => {
    initMenuScreen();
});

// 냄비 클릭 (선택 + 서빙)
document.querySelectorAll('.pot-container').forEach(potEl => {
    potEl.addEventListener('click', (e) => {
        // 서빙 버튼 클릭 시
        if (e.target.classList.contains('btn-serve')) {
            const potIndex = parseInt(potEl.dataset.pot);
            const result = game.tryServe(potIndex);
            if (result && !result.success) {
                ui.showToast(result.reason, 'warning');
            }
            return;
        }

        // 냄비 선택
        const potIndex = parseInt(potEl.dataset.pot);
        game.selectPot(potIndex);

        // 선택된 냄비의 가능한 레시피 힌트 표시
        const pot = game.cooking.getPotState(potIndex);
        if (pot && pot.addedIngredients.length > 0 && pot.state === 'filling') {
            const matchResult = game.cooking.checkRecipeMatch(pot);
            ui.showRecipeHint(
                matchResult.possibleRecipes,
                matchResult.confirmableRecipes,
                handleConfirmCook
            );
        } else {
            ui.hideRecipeHint();
        }
    });
});

// ===== 조리 확정 핸들러 =====
function handleConfirmCook(recipeId) {
    const result = game.confirmCook(recipeId);
    if (result && result.success) {
        ui.showToast(`${result.recipeName} 조리 시작! 🔥`, 'success');
        ui.hideRecipeHint();
    } else if (result) {
        ui.showToast(result.reason, 'warning');
    }
}

// ===== 게임 시작 =====
function startNewGame() {
    ui.showScreen('game');
    ui.resetSeats();
    ui.hideRecipeHint();

    // 재료 선반 생성
    ui.createIngredientShelf((ingredientId) => {
        if (game.state !== GAME_STATE.PLAYING) return;

        const result = game.addIngredient(ingredientId);
        if (!result) {
            ui.showToast('냄비를 먼저 선택하세요!', 'warning');
            return;
        }

        if (!result.success) {
            ui.showToast(result.reason, 'error');
            // 냄비 흔들림 애니메이션
            const selectedPot = game.cooking.selectedPot;
            if (selectedPot !== null) {
                const potEl = document.getElementById(`pot-${selectedPot}`);
                if (potEl) {
                    potEl.classList.add('shake');
                    setTimeout(() => potEl.classList.remove('shake'), 500);
                }
            }
        } else if (result.cooking) {
            ui.showToast(`${result.recipeName} 조리 시작! 🔥`, 'success');
            ui.hideRecipeHint();
        } else {
            // 부분 매칭 - 힌트 표시 (확정 가능 레시피 포함)
            ui.showRecipeHint(
                result.possibleRecipes,
                result.confirmableRecipes,
                handleConfirmCook
            );
        }
    });

    // 게임 콜백 설정
    game.onUpdate = (g) => {
        ui.updateHUD(g);
        ui.updatePots(g.cooking);

        // 고객 인내심 업데이트
        for (const customer of g.customers.seats) {
            if (customer && !customer.served && !customer.left) {
                ui.updateCustomerPatience(customer);
            }
        }
    };

    game.onCustomerSpawn = (customer) => {
        ui.addCustomer(customer);
        // 주문 알림 소리 (나중에 추가)
    };

    game.onCustomerLeave = (customer) => {
        ui.removeCustomer(customer.seatIndex, true);
        ui.showToast(`😢 ${CUSTOMER_TYPES[customer.type].name}이(가) 떠났습니다!`, 'error');
    };

    game.onServeSuccess = (customer, reward, combo) => {
        ui.removeCustomer(customer.seatIndex, false);
        ui.showToast(`✅ 서빙 성공! +${reward.total.toLocaleString()}원`, 'success');

        // 플로팅 머니
        const seatEl = ui.counterSeats.children[customer.seatIndex];
        if (seatEl) {
            const rect = seatEl.getBoundingClientRect();
            ui.showFloatingMoney(reward.total, rect.left + rect.width / 2, rect.top);
        }
    };

    game.onCombo = (combo, bonus) => {
        ui.showToast(`🔥 ${combo} 콤보! +${bonus.toLocaleString()}원 보너스!`, 'combo');
    };

    game.onLifeLost = (lives) => {
        // 화면 흔들림 효과
        document.getElementById('screen-game').classList.add('screen-shake');
        setTimeout(() => {
            document.getElementById('screen-game').classList.remove('screen-shake');
        }, 500);
    };

    game.onGameOver = (stats) => {
        ui.showGameOver(stats);
        // 저장 데이터 갱신
        ui.updateMenuScreen(game.saveData);
    };

    game.startGame();
}

// ===== 상점 열기 =====
function openShop() {
    const handleUnlock = (menuId) => {
        const result = game.unlockMenu(menuId);
        if (result.success) {
            ui.showToast(`🎉 ${RECIPES[menuId].name} 해금!`, 'success');
            // 상점 UI 갱신
            ui.updateShop(game.menuManager, game.money, handleUnlock);
        } else {
            ui.showToast(result.reason, 'warning');
        }
    };
    ui.updateShop(game.menuManager, game.money, handleUnlock);
    ui.showScreen('shop');
}

// ===== 초기 실행 =====
initMenuScreen();
console.log('🍜 라면가게 게임이 로드되었습니다!');
