/* ===== UI 업데이트 & DOM 조작 ===== */
import { INGREDIENTS, RECIPES, CUSTOMER_TYPES } from './config.js';
import { POT_STATE } from './cooking.js';

export class UI {
    constructor() {
        // 화면 요소
        this.screens = {
            menu: document.getElementById('screen-menu'),
            howto: document.getElementById('screen-howto'),
            shop: document.getElementById('screen-shop'),
            game: document.getElementById('screen-game'),
            gameover: document.getElementById('screen-gameover'),
        };

        // HUD 요소
        this.hud = {
            money: document.getElementById('hud-money'),
            served: document.getElementById('hud-served'),
            lives: document.getElementById('hud-lives'),
            combo: document.getElementById('hud-combo'),
            comboCount: document.getElementById('hud-combo-count'),
        };

        // 메뉴 화면
        this.menuHighscore = document.getElementById('menu-highscore');

        // 상점
        this.shopMoneyDisplay = document.getElementById('shop-money-display');
        this.shopMenuList = document.getElementById('shop-menu-list');

        // 게임 요소
        this.counterSeats = document.getElementById('counter-seats');
        this.ingredientShelf = document.getElementById('ingredient-shelf');
        this.recipeHint = document.getElementById('recipe-hint');
        this.recipeHintContent = document.getElementById('recipe-hint-content');

        // 오버레이
        this.pauseOverlay = document.getElementById('overlay-pause');

        // 게임오버
        this.goServed = document.getElementById('go-served');
        this.goMoney = document.getElementById('go-money');
        this.goCombo = document.getElementById('go-combo');

        // 토스트
        this.toastContainer = document.getElementById('toast-container');
    }

    // ===== 화면 전환 =====
    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        if (this.screens[name]) {
            this.screens[name].classList.add('active');
        }
        this.pauseOverlay.style.display = 'none';
    }

    // ===== HUD 업데이트 =====
    updateHUD(game) {
        this.hud.money.textContent = game.money.toLocaleString();
        this.hud.served.textContent = game.served;

        // 생명
        const hearts = '❤️'.repeat(game.lives) + '🖤'.repeat(Math.max(0, 3 - game.lives));
        this.hud.lives.textContent = hearts;

        // 콤보
        if (game.combo >= 2) {
            this.hud.combo.style.display = 'flex';
            this.hud.comboCount.textContent = game.combo;
        } else {
            this.hud.combo.style.display = 'none';
        }
    }

    // ===== 메인 메뉴 =====
    updateMenuScreen(saveData) {
        this.menuHighscore.textContent = `최고 기록: ${saveData.highScore.toLocaleString()}원`;
    }

    // ===== 재료 선반 생성 =====
    createIngredientShelf(onIngredientClick) {
        this.ingredientShelf.innerHTML = '';
        for (const [id, ingredient] of Object.entries(INGREDIENTS)) {
            const btn = document.createElement('button');
            btn.className = 'ingredient-btn';
            btn.dataset.ingredient = id;
            btn.innerHTML = `
        <span class="ingredient-emoji">${ingredient.emoji}</span>
        <span class="ingredient-name">${ingredient.name}</span>
      `;
            btn.addEventListener('click', () => onIngredientClick(id));
            this.ingredientShelf.appendChild(btn);
        }
    }

    // ===== 냄비 UI 업데이트 =====
    updatePots(cookingStation) {
        for (let i = 0; i < cookingStation.pots.length; i++) {
            const pot = cookingStation.pots[i];
            const el = document.getElementById(`pot-${i}`);
            if (!el) continue;

            const potIcon = el.querySelector('.pot-icon');
            const ingredientsEl = el.querySelector('.pot-ingredients');
            const progressBar = el.querySelector('.pot-progress-bar');
            const statusEl = el.querySelector('.pot-status');
            const serveBtn = el.querySelector('.btn-serve');

            // 선택 상태
            el.classList.toggle('selected', cookingStation.selectedPot === i);

            // 상태별 표시
            switch (pot.state) {
                case POT_STATE.EMPTY:
                    potIcon.textContent = '🍳';
                    ingredientsEl.innerHTML = '';
                    progressBar.style.width = '0%';
                    progressBar.className = 'pot-progress-bar';
                    statusEl.textContent = '빈 냄비 (클릭하여 선택)';
                    serveBtn.style.display = 'none';
                    el.classList.remove('cooking', 'done');
                    break;

                case POT_STATE.FILLING:
                    potIcon.textContent = '🍳';
                    ingredientsEl.innerHTML = pot.addedIngredients
                        .map(id => INGREDIENTS[id]?.emoji || '?').join(' ');
                    progressBar.style.width = '0%';
                    progressBar.className = 'pot-progress-bar';
                    statusEl.textContent = `재료 투입 중... (${pot.addedIngredients.length}개)`;
                    serveBtn.style.display = 'none';
                    el.classList.remove('cooking', 'done');
                    break;

                case POT_STATE.COOKING:
                    potIcon.textContent = '🔥';
                    ingredientsEl.innerHTML = pot.addedIngredients
                        .map(id => INGREDIENTS[id]?.emoji || '?').join(' ');
                    progressBar.style.width = `${pot.cookProgress * 100}%`;
                    progressBar.className = 'pot-progress-bar cooking';
                    const remaining = Math.ceil((1 - pot.cookProgress) * (pot.cookDuration / 1000));
                    statusEl.textContent = `조리 중... ${remaining}초`;
                    serveBtn.style.display = 'none';
                    el.classList.add('cooking');
                    el.classList.remove('done');
                    break;

                case POT_STATE.DONE:
                    const recipe = RECIPES[pot.targetRecipe];
                    potIcon.textContent = '🍜';
                    ingredientsEl.innerHTML = recipe ? `${recipe.emoji} ${recipe.name}` : '완성!';
                    progressBar.style.width = '100%';
                    progressBar.className = 'pot-progress-bar done';
                    statusEl.textContent = '완성! 서빙하세요!';
                    serveBtn.style.display = 'block';
                    el.classList.remove('cooking');
                    el.classList.add('done');
                    break;
            }
        }
    }

    // ===== 레시피 힌트 =====
    showRecipeHint(possibleRecipes, confirmableRecipes = null, onConfirmCook = null) {
        if ((!possibleRecipes || possibleRecipes.length === 0) && (!confirmableRecipes || confirmableRecipes.length === 0)) {
            this.recipeHint.style.display = 'none';
            return;
        }
        this.recipeHint.style.display = 'flex';
        this.recipeHintContent.innerHTML = '';

        // 지금 바로 조리 가능한 레시피 (확정 버튼 포함)
        if (confirmableRecipes && confirmableRecipes.length > 0) {
            for (const id of confirmableRecipes) {
                const r = RECIPES[id];
                const btn = document.createElement('button');
                btn.className = 'btn-confirm-cook';
                btn.innerHTML = `🔥 ${r.emoji} ${r.name} 조리 시작!`;
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (onConfirmCook) onConfirmCook(id);
                });
                this.recipeHintContent.appendChild(btn);
            }
        }

        // 재료를 더 넣으면 만들 수 있는 레시피
        if (possibleRecipes && possibleRecipes.length > 0) {
            const hintsText = document.createElement('span');
            hintsText.className = 'recipe-hint-text';
            const hints = possibleRecipes.map(id => {
                const r = RECIPES[id];
                return `${r.emoji} ${r.name}: ${r.ingredients.map(i => INGREDIENTS[i].emoji).join('→')}`;
            });
            hintsText.textContent = (confirmableRecipes && confirmableRecipes.length > 0 ? ' 또는 재료 추가: ' : '') + hints.join(' | ');
            this.recipeHintContent.appendChild(hintsText);
        }
    }

    hideRecipeHint() {
        this.recipeHint.style.display = 'none';
    }

    // ===== 고객 UI =====
    addCustomer(customer) {
        const seatEl = this.counterSeats.children[customer.seatIndex];
        if (!seatEl) return;

        const recipe = RECIPES[customer.menuId];
        const typeData = CUSTOMER_TYPES[customer.type];

        seatEl.innerHTML = `
      <div class="customer customer-enter" data-customer-id="${customer.id}">
        <div class="customer-bubble">
          <span class="bubble-emoji">${recipe?.emoji || '🍜'}</span>
          <span class="bubble-text">${recipe?.name || '라면'}</span>
        </div>
        <div class="customer-avatar" style="background-color: ${typeData.color}20; border-color: ${typeData.color}">
          <span class="customer-emoji">${typeData.emoji}</span>
          <span class="customer-type-name">${typeData.name}</span>
        </div>
        <div class="patience-bar-container">
          <div class="patience-bar" style="width: 100%; background-color: ${typeData.color}"></div>
        </div>
      </div>
    `;

        // 등장 애니메이션 해제
        setTimeout(() => {
            const customerEl = seatEl.querySelector('.customer');
            if (customerEl) customerEl.classList.remove('customer-enter');
        }, 50);
    }

    updateCustomerPatience(customer) {
        const seatEl = this.counterSeats.children[customer.seatIndex];
        if (!seatEl) return;

        const bar = seatEl.querySelector('.patience-bar');
        if (bar) {
            const pct = customer.patienceRemaining * 100;
            bar.style.width = `${pct}%`;

            // 색상 변화 (초록 → 노랑 → 빨강)
            if (pct > 50) {
                bar.style.backgroundColor = '';  // 기본색 유지
            } else if (pct > 25) {
                bar.style.backgroundColor = '#FFC107';
            } else {
                bar.style.backgroundColor = '#F44336';
                bar.classList.add('patience-critical');
            }
        }
    }

    removeCustomer(seatIndex, isAngry = false) {
        const seatEl = this.counterSeats.children[seatIndex];
        if (!seatEl) return;

        const customerEl = seatEl.querySelector('.customer');
        if (customerEl) {
            customerEl.classList.add(isAngry ? 'customer-angry' : 'customer-happy');
            setTimeout(() => {
                seatEl.innerHTML = '<div class="seat-empty">빈자리</div>';
            }, 600);
        }
    }

    // ===== 상점 UI =====
    updateShop(menuManager, money, onUnlock) {
        this.shopMoneyDisplay.textContent = money.toLocaleString();
        this.shopMenuList.innerHTML = '';

        const allMenus = menuManager.getAllMenuInfo();
        for (const menu of allMenus) {
            const card = document.createElement('div');
            card.className = `shop-menu-card ${menu.unlocked ? 'unlocked' : 'locked'}`;

            const ingredientList = menu.ingredients
                .map(i => INGREDIENTS[i]?.emoji || '?').join(' → ');

            card.innerHTML = `
        <div class="shop-card-header">
          <span class="shop-card-emoji">${menu.emoji}</span>
          <h3>${menu.name}</h3>
        </div>
        <div class="shop-card-info">
          <p class="shop-card-recipe">레시피: ${ingredientList}</p>
          <p class="shop-card-price">판매가: ${menu.price.toLocaleString()}원</p>
          <p class="shop-card-time">조리 시간: ${menu.cookTime / 1000}초</p>
        </div>
        ${menu.unlocked
                    ? '<div class="shop-card-badge">✅ 해금됨</div>'
                    : `<button class="btn btn-unlock" data-menu-id="${menu.id}" ${money < menu.unlockCost ? 'disabled' : ''}>
              🔓 해금 (${menu.unlockCost.toLocaleString()}원)
            </button>`
                }
      `;

            if (!menu.unlocked) {
                const btn = card.querySelector('.btn-unlock');
                if (btn && !btn.disabled) {
                    btn.addEventListener('click', () => onUnlock(menu.id));
                }
            }

            this.shopMenuList.appendChild(card);
        }
    }

    // ===== 게임오버 화면 =====
    showGameOver(stats) {
        this.goServed.textContent = stats.served;
        this.goMoney.textContent = stats.money.toLocaleString();
        this.goCombo.textContent = stats.maxCombo;
        this.showScreen('gameover');
    }

    // ===== 일시정지 =====
    showPause() {
        this.pauseOverlay.style.display = 'flex';
    }

    hidePause() {
        this.pauseOverlay.style.display = 'none';
    }

    // ===== 토스트 메시지 =====
    showToast(message, type = 'info', duration = 2000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        // 등장 애니메이션
        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /** 돈 획득 플로팅 텍스트 */
    showFloatingMoney(amount, x, y) {
        const el = document.createElement('div');
        el.className = 'floating-money';
        el.textContent = `+${amount.toLocaleString()}원`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);

        setTimeout(() => el.remove(), 1500);
    }

    /** 좌석 초기화 */
    resetSeats() {
        for (let i = 0; i < this.counterSeats.children.length; i++) {
            this.counterSeats.children[i].innerHTML = '<div class="seat-empty">빈자리</div>';
        }
    }
}
