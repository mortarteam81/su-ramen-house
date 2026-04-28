/* ===== 메인 엔트리 포인트 ===== */
import { Game, GAME_STATE } from './game.js';
import { UI } from './ui.js';
import { RECIPES, INGREDIENTS, CUSTOMER_TYPES, DAY_STAGES } from './config.js';

// 초기화
const game = new Game();
const ui = new UI();
let previousPotStates = [];
let lastGameOverStats = null;

const BGM_MUTED_KEY = 'ramen_shop_bgm_muted';
const bgm = new Audio();
bgm.preload = 'none';
bgm.src = 'assets/audio/background-music.mp3';
bgm.loop = true;
bgm.volume = 0.32;
let bgmMuted = localStorage.getItem(BGM_MUTED_KEY) === '1';

class RamenSfx {
    constructor(isMuted) {
        this.isMuted = isMuted;
        this.ctx = null;
    }

    getContext() {
        if (this.isMuted()) return null;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        if (!this.ctx) this.ctx = new AudioContextClass();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return this.ctx;
    }

    makeGain(ctx, volume = 0.2) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.015);
        gain.connect(ctx.destination);
        return gain;
    }

    playIgnition() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 점화 딸깍
        const click = ctx.createOscillator();
        const clickGain = this.makeGain(ctx, 0.18);
        click.type = 'square';
        click.frequency.setValueAtTime(1400, now);
        click.frequency.exponentialRampToValueAtTime(260, now + 0.08);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        click.connect(clickGain);
        click.start(now);
        click.stop(now + 0.11);

        // 짧은 화르륵
        this.playNoiseBurst({ duration: 0.22, volume: 0.12, lowpass: 1800, attack: 0.025 });
    }

    playBoil() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        this.playNoiseBurst({ duration: 1.2, volume: 0.08, lowpass: 950, attack: 0.12 });
        for (let i = 0; i < 5; i++) {
            const bubble = ctx.createOscillator();
            const gain = this.makeGain(ctx, 0.028);
            const t = now + 0.12 + i * 0.18;
            bubble.type = 'sine';
            bubble.frequency.setValueAtTime(180 + Math.random() * 120, t);
            bubble.frequency.exponentialRampToValueAtTime(85 + Math.random() * 50, t + 0.16);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.04, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
            bubble.connect(gain);
            bubble.start(t);
            bubble.stop(t + 0.2);
        }
    }

    playSlurp() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = this.makeGain(ctx, 0.055);
            const t = now + i * 0.12;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(520 + i * 80, t);
            osc.frequency.exponentialRampToValueAtTime(980 + i * 70, t + 0.12);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.055, t + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.17);
        }
    }

    playNoiseBurst({ duration = 0.4, volume = 0.08, lowpass = 1200, attack = 0.02 } = {}) {
        const ctx = this.getContext();
        if (!ctx) return;
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(lowpass, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start();
        source.stop(ctx.currentTime + duration + 0.02);
    }
}

const sfx = new RamenSfx(() => bgmMuted);

function updateMusicButton() {
    const btn = document.getElementById('btn-music');
    if (!btn) return;
    btn.textContent = bgmMuted ? '🔇' : '🎵';
    btn.classList.toggle('muted', bgmMuted);
    btn.setAttribute('aria-label', bgmMuted ? '배경음악 켜기' : '배경음악 끄기');
}

function playBgmFromUserGesture() {
    if (bgmMuted) return;
    sfx.getContext();
    bgm.play().catch(() => {
        // 브라우저 자동재생 정책상 실패할 수 있다. 다음 사용자 클릭에서 다시 시도한다.
    });
}

function setBgmMuted(nextMuted) {
    bgmMuted = Boolean(nextMuted);
    localStorage.setItem(BGM_MUTED_KEY, bgmMuted ? '1' : '0');
    if (bgmMuted) {
        bgm.pause();
    } else {
        playBgmFromUserGesture();
    }
    updateMusicButton();
}

// ===== 화면 초기화 =====
function initMenuScreen() {
    ui.updateMenuScreen(game.saveData);
    ui.applyCosmetics(game.getCosmetics());
    ui.showScreen('menu');
}

// ===== 이벤트 바인딩 =====

updateMusicButton();

document.getElementById('btn-music').addEventListener('click', (e) => {
    e.stopPropagation();
    setBgmMuted(!bgmMuted);
});

// 메인 메뉴 버튼
document.getElementById('btn-start').addEventListener('click', () => {
    playBgmFromUserGesture();
    showStoryThenStart();
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

document.getElementById('btn-replay-guide').addEventListener('click', () => {
    playBgmFromUserGesture();
    startNewGame({ replayFirstBowlGuide: true });
});

document.getElementById('btn-first-guide-minimize').addEventListener('click', (e) => {
    e.stopPropagation();
    ui.minimizeFirstBowlGuide();
});

document.getElementById('btn-first-guide-dismiss').addEventListener('click', (e) => {
    e.stopPropagation();
    ui.dismissFirstBowlGuide();
});

document.getElementById('first-bowl-guide').addEventListener('click', () => {
    ui.expandFirstBowlGuide();
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
    playBgmFromUserGesture();
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
    playBgmFromUserGesture();
    if (lastGameOverStats?.dayCleared) {
        showStoryThenStart();
    } else {
        showStoryThenStart({ dayIndex: lastGameOverStats?.dayIndex ?? game.currentDayIndex });
    }
});

document.getElementById('btn-tomenu').addEventListener('click', () => {
    initMenuScreen();
});

function handleDiscardPot(potIndex) {
    const result = game.discardPot(potIndex);
    if (result?.success) {
        const cost = result.discarded?.costSpent || 0;
        ui.hideRecipeHint();
        ui.setChefState('surprised', cost > 0 ? '재료비는 손실됐지만 다시 만들면 돼요!' : '다시 만들어 볼까요?', { duration: 1300 });
        ui.showDiscardFeedback({ potId: potIndex, cost });
    } else if (result) {
        ui.showToast(result.reason, 'warning');
    }
    return result;
}

function handleServePot(potIndex) {
    const result = game.tryServe(potIndex);
    if (result && !result.success) {
        const potEl = document.getElementById(`pot-${potIndex}`);
        ui.showToast(result.reason, 'warning');
        ui.setChefState('surprised', result.reason, { duration: 1000 });
        ui.showServeFeedback({ success: false, message: result.reason, potId: potIndex });
        if (potEl) {
            potEl.classList.add('mismatch', 'shake');
            setTimeout(() => potEl.classList.remove('mismatch', 'shake'), 600);
        }
    }
    return result;
}

// 냄비 클릭 (선택 + 서빙)
document.querySelectorAll('.pot-container').forEach(potEl => {
    potEl.addEventListener('click', (e) => {
        // 서빙 버튼 클릭 시
        if (e.target.classList.contains('btn-serve')) {
            const potIndex = parseInt(potEl.dataset.pot);
            handleServePot(potIndex);
            return;
        }

        if (e.target.classList.contains('btn-discard')) {
            const potIndex = parseInt(potEl.dataset.pot);
            handleDiscardPot(potIndex);
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
        sfx.playIgnition();
        setTimeout(() => sfx.playBoil(), 180);
        ui.showToast(`${result.recipeName} 조리 시작! 🔥`, 'success');
        ui.setChefState('cooking', `${result.recipeName} 끓이는 중!`, { duration: 1400 });
        ui.hideRecipeHint();
    } else if (result) {
        ui.showToast(result.reason, 'warning');
        ui.setChefState('surprised', result.reason, { duration: 1000 });
    }
}

// ===== 게임 시작 =====
function showStoryThenStart(options = {}) {
    const requestedDayIndex = options.dayIndex ?? game.saveData.currentDayIndex ?? 0;
    const safeDayIndex = Math.min(Math.max(0, Number(requestedDayIndex) || 0), DAY_STAGES.length - 1);
    const day = DAY_STAGES[safeDayIndex] || DAY_STAGES[0];
    ui.showStoryIntro(day, () => startNewGame({ ...options, dayIndex: safeDayIndex }));
}

function startNewGame({ replayFirstBowlGuide = false, dayIndex = null } = {}) {
    playBgmFromUserGesture();
    ui.applyCosmetics(game.getCosmetics());
    ui.showScreen('game');
    ui.resetSeats();
    ui.resetChef();
    previousPotStates = game.cooking.pots.map(pot => pot.state);
    ui.hideRecipeHint();
    ui.startFirstBowlGuide({ force: replayFirstBowlGuide });

    // 재료 선반 생성
    ui.createIngredientShelf((ingredientId) => {
        if (game.state !== GAME_STATE.PLAYING) return;

        const selectedPotBeforeAdd = game.cooking.selectedPot;
        const result = game.addIngredient(ingredientId);
        if (result?.success && selectedPotBeforeAdd !== null) {
            ui.throwIngredientToPot(ingredientId, selectedPotBeforeAdd);
            ui.setChefState(result.cooking ? 'cooking' : 'happy', result.cooking ? '불 올립니다!' : '좋아요, 다음 재료!', { duration: result.cooking ? 1200 : 650 });
        } else {
            ui.pulseIngredientButton(ingredientId);
            ui.setChefState('surprised', '냄비부터 볼까요?', { duration: 900 });
        }
        if (!result) {
            ui.showToast('냄비를 먼저 선택하세요!', 'warning');
            return;
        }

        if (!result.success) {
            ui.showToast(result.reason, 'error');
            ui.setChefState('surprised', result.reason, { duration: 1100 });
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
            sfx.playIgnition();
            setTimeout(() => sfx.playBoil(), 180);
            ui.showToast(`${result.recipeName} 조리 시작! 🔥`, 'success');
            ui.setChefState('cooking', `${result.recipeName} 끓이는 중!`, { duration: 1400 });
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
        g.cooking.pots.forEach((pot, index) => {
            if (previousPotStates[index] === 'cooking' && pot.state === 'done') {
                ui.setChefState('happy', '라면 완성! 서빙하세요!', { duration: 1100 });
            }
            previousPotStates[index] = pot.state;
        });

        ui.updateHUD(g);
        ui.updatePots(g.cooking);
        ui.updateGuidance(g);
        ui.updateFirstBowlGuide(g);
        ui.updateMobileOrderSummary(g);
        ui.updateMobileActionBar(g, {
            onConfirmCook: handleConfirmCook,
            onServe: handleServePot,
            onDiscard: handleDiscardPot,
        });

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
        ui.setChefState('surprised', '손님이 화났어요!', { duration: 1200 });
        ui.removeCustomer(customer.seatIndex, true);
        ui.showToast(`😢 ${CUSTOMER_TYPES[customer.type].name}이(가) 떠났습니다!`, 'error');
    };

    game.onServeSuccess = (customer, reward, combo) => {
        if (game.served === 1) ui.completeFirstBowlGuide();
        ui.flashCustomerMatch(customer, 'success');
        ui.playCustomerServedLifecycle(customer);
        setTimeout(() => sfx.playSlurp(), 120);
        ui.setChefState(combo >= 2 ? 'combo' : 'happy', combo >= 2 ? `${combo}콤보, 좋아요!` : '서빙 성공!', { duration: 1200 });
        ui.showServeFeedback({ success: true, customer, reward });
        setTimeout(() => ui.removeCustomer(customer.seatIndex, false), 2750);
        ui.showToast(`✅ 판매 +${reward.total.toLocaleString()}원`, 'success');

        // 플로팅 머니
        const seatEl = ui.counterSeats.children[customer.seatIndex];
        if (seatEl) {
            const rect = seatEl.getBoundingClientRect();
            ui.showFloatingMoney(reward.total, rect.left + rect.width / 2, rect.top);
        }
    };

    game.onCombo = (combo, bonus) => {
        ui.setChefState('combo', `${combo}콤보 보너스!`, { duration: 1600 });
        ui.showToast(`🔥 ${combo} 콤보! +${bonus.toLocaleString()}원 보너스!`, 'combo');
        ui.showComboCelebration(combo, bonus);
    };

    game.onCostCharged = (result) => {
        if (!result?.cost) return;
        // Cost is shown in the recipe CTA and pot status; avoid stacking toast noise during cooking.
    };

    game.onComboBreak = (combo, message) => {
        ui.setChefState('surprised', '콤보가 끊겼어요!', { duration: 1100 });
        ui.showToast(`💔 ${combo} 콤보 종료`, 'warning');
        ui.showComboBreak(combo, message);
    };

    game.onDayClear = (day) => {
        ui.showToast(`🎉 ${day.title} 목표 달성!`, 'success', 3000);
    };

    game.onLifeLost = (lives) => {
        // 화면 흔들림 효과
        document.getElementById('screen-game').classList.add('screen-shake');
        setTimeout(() => {
            document.getElementById('screen-game').classList.remove('screen-shake');
        }, 500);
    };

    game.onGameOver = (stats) => {
        lastGameOverStats = stats;
        ui.showGameOver(stats);
        // 저장 데이터 갱신
        ui.updateMenuScreen(game.saveData);
    };

    game.onMenuUnlock = (menuId, message, threshold) => {
        const recipe = RECIPES[menuId];
        ui.showToast(`🎉 ${recipe.emoji} ${message}`, 'success', 3000);
    };

    lastGameOverStats = null;
    game.startGame({ dayIndex });
}

// ===== 상점 열기 =====
function openShop() {
    const refreshShop = () => {
        ui.applyCosmetics(game.getCosmetics());
        ui.updateShop(game.menuManager, game.money, handleUnlock, game.saveData, {
            onBuy: handleCosmeticBuy,
            onEquip: handleCosmeticEquip,
            onReset: handleCosmeticReset,
        });
    };

    const handleUnlock = (menuId) => {
        const result = game.unlockMenu(menuId);
        if (result.success) {
            ui.showToast(`🎉 ${RECIPES[menuId].name} 해금!`, 'success');
            refreshShop();
        } else {
            ui.showToast(result.reason, 'warning');
        }
    };

    const handleCosmeticBuy = (itemId) => {
        const result = game.buyCosmetic(itemId);
        if (result.success) {
            ui.showToast(`🎨 ${result.item.name} 구매 및 장착!`, 'success');
            refreshShop();
        } else {
            ui.showToast(result.reason, 'warning');
        }
    };

    const handleCosmeticEquip = (itemId) => {
        const result = game.equipCosmetic(itemId);
        if (result.success) {
            ui.showToast(`✨ ${result.item.name} 장착!`, 'success');
            refreshShop();
        } else {
            ui.showToast(result.reason, 'warning');
        }
    };

    const handleCosmeticReset = (type) => {
        const result = game.equipDefaultCosmetic(type);
        if (result.success) {
            ui.showToast('기본 꾸미기로 변경했습니다.', 'info');
            refreshShop();
        } else {
            ui.showToast(result.reason, 'warning');
        }
    };

    refreshShop();
    ui.showScreen('shop');
}

// ===== 테스트/디버그 상태 출력 =====
function getVisibleText(selector) {
    const el = document.querySelector(selector);
    return el ? el.innerText.trim() : '';
}

function getGameDebugState() {
    const activeScreen = document.querySelector('.screen.active')?.id || null;
    return {
        activeScreen,
        state: game.state,
        money: game.money,
        served: game.served,
        lives: game.lives,
        combo: game.combo,
        maxCombo: game.maxCombo,
        currentDay: game.currentDay,
        currentDayIndex: game.currentDayIndex,
        saveDayIndex: game.saveData.currentDayIndex,
        completedDays: [...(game.saveData.completedDays || [])],
        dayCleared: game.dayCleared,
        cosmetics: game.getCosmetics(),
        cosmeticDataAttrs: {
            sign: document.getElementById('screen-game')?.dataset.signCosmetic || 'default',
            counter: document.getElementById('screen-game')?.dataset.counterCosmetic || 'default',
            bowl: document.getElementById('screen-game')?.dataset.bowlCosmetic || 'default',
        },
        selectedPot: game.cooking.selectedPot,
        chef: ui.getChefVisualState(),
        customers: game.customers.seats.map((customer, seatIndex) => {
            if (!customer || customer.left) return null;
            const recipe = RECIPES[customer.menuId];
            const type = CUSTOMER_TYPES[customer.type];
            const seatEl = ui.counterSeats.children[seatIndex];
            const visual = ui.getCustomerVisualState(customer);
            return {
                id: customer.id,
                seatIndex,
                type: customer.type,
                typeName: type?.name || customer.type,
                menuId: customer.menuId,
                menuName: recipe?.name || customer.menuId,
                recipe: recipe?.ingredients || [],
                patienceRemaining: Number(customer.patienceRemaining.toFixed(3)),
                served: customer.served,
                visualState: visual.visualState,
                lifecycleText: visual.lifecycleText,
                domClasses: visual.classes,
                visibleText: seatEl?.innerText.trim() || '',
            };
        }).filter(Boolean),
        pots: game.cooking.pots.map((pot) => ({
            id: pot.id,
            state: pot.state,
            targetRecipe: pot.targetRecipe,
            addedIngredients: [...pot.addedIngredients],
            cookProgress: Number(pot.cookProgress.toFixed(3)),
            costSpent: Number(pot.costSpent) || 0,
            costCharged: Boolean(pot.costCharged),
            visibleText: document.getElementById(`pot-${pot.id}`)?.innerText.trim() || '',
        })),
        guidance: {
            firstBowlGuideVisible: ui.firstBowlGuide?.style.display !== 'none',
            firstBowlGuideText: ui.firstBowlGuide?.innerText.trim() || '',
            guideTargets: Array.from(document.querySelectorAll('.guide-target, .serve-guide, .customer-guide'))
                .map((el) => el.id || el.dataset.ingredient || el.className || el.tagName),
            recipeHintText: ui.recipeHint?.style.display === 'none' ? '' : ui.recipeHint?.innerText.trim() || '',
        },
        hud: {
            money: getVisibleText('#hud-money'),
            served: getVisibleText('#hud-served'),
            lives: getVisibleText('#hud-lives'),
            combo: getVisibleText('#hud-combo'),
        },
    };
}

window.get_game_debug_state = getGameDebugState;
window.render_game_to_text = () => JSON.stringify(getGameDebugState(), null, 2);

// ===== 초기 실행 =====
initMenuScreen();
console.log('🍜 라면가게 게임이 로드되었습니다!');
