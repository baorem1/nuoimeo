// ============ CỬA HÀNG (MUA & BÁN) ============
const PREMIUM_CAT_SHOP_TRAIT = TRAITS.reduce(
  (best, trait) => trait.mult > best.mult ? trait : best,
  TRAITS[0]
);

function openShop() {
  processPremiumCatShop();
  switchShopTab('buy');
  renderPremiumCatShop();
  
  const list = document.getElementById('bulk-sell-list');
  list.innerHTML = '';
  
  const availableCats = state.cats.filter(cat => !cat.expedition && !cat.mouseHunt && !cat.mazeTrip);
  if (availableCats.length === 0) {
    list.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">Không có mèo nào để bán.</p>';
  }

  const sorted = [...availableCats].sort((a, b) => getSellPrice(a) - getSellPrice(b));
  
  sorted.forEach(cat => {
    const price = getSellPrice(cat);
    const div = document.createElement('div');
    div.className = 'bulk-item';
    div.innerHTML = `
      <input type="checkbox" value="${cat.id}" onchange="updateBulkTotal()">
      <div style="flex:1;">
        <b>${cat.name}</b> <span style="font-size:0.85em;color:#888;">(${RARITY_LABEL[cat.rarity]} - Lv${cat.level})</span>
        <br><span style="font-size:0.8em; color:#d64b8e;">💰 ${price} xu</span>
      </div>
    `;
    list.appendChild(div);
  });

  updateBulkTotal();
  document.getElementById('shop-modal').classList.remove('hidden');
}

function switchShopTab(tab) {
  const tabBuy = document.getElementById('tab-buy');
  const tabSell = document.getElementById('tab-sell');
  const tabItems = document.getElementById('tab-items');
  const contentBuy = document.getElementById('shop-buy-content');
  const contentSell = document.getElementById('shop-sell-content');
  const contentItems = document.getElementById('shop-items-content');
  const activeTab = tab === 'sell' ? tabSell : tab === 'items' ? tabItems : tabBuy;
  const tabs = [tabBuy, tabSell, tabItems];
  const contents = [contentBuy, contentSell, contentItems];

  tabs.forEach(button => {
    const active = button === activeTab;
    button.style.background = active ? '#fff0f5' : '#f0f0f0';
    button.style.color = active ? '#d64b8e' : '#666';
  });
  contents.forEach(content => content.classList.toggle('hidden', content !== contents[tabs.indexOf(activeTab)]));
  if (tab === 'items') renderShopItems();
  if (tab === 'buy') renderPremiumCatShop();
}

function createPremiumCatStock() {
  return [
    createPremiumCatStockItem('legendary'),
    createPremiumCatStockItem('legendary'),
    createPremiumCatStockItem('mythic'),
    createPremiumCatStockItem('secret')
  ];
}

function createPremiumCatStockItem(rarity) {
  const cat = createRandomCat(null, rarity);
  cat.trait = { ...PREMIUM_CAT_SHOP_TRAIT };
  cat.shopCat = true;
  return {
    id: `premium-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    rarity,
    price: PREMIUM_CAT_SHOP_PRICES[rarity],
    cat,
    sold: false
  };
}

function getNextPremiumCatShopRefresh(now = Date.now()) {
  const nextRefresh = new Date(now);
  nextRefresh.setMinutes(0, 0, 0);
  nextRefresh.setHours(nextRefresh.getHours() + 1);
  while (!PREMIUM_CAT_SHOP_REFRESH_HOURS.includes(nextRefresh.getHours())) {
    nextRefresh.setHours(nextRefresh.getHours() + 1);
  }
  return nextRefresh.getTime();
}

function isPremiumCatShopRefreshTime(timestamp) {
  const date = new Date(timestamp);
  return PREMIUM_CAT_SHOP_REFRESH_HOURS.includes(date.getHours()) &&
    date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

function processPremiumCatShop(now = Date.now()) {
  let shop = state.premiumCatShop;
  const validShop = shop &&
    Number.isFinite(shop.refreshAt) &&
    Array.isArray(shop.stock) &&
    shop.stock.length === 4 &&
    shop.stock.every(item => item && typeof item.id === 'string' && typeof item.sold === 'boolean') &&
    shop.stock.map(item => item.rarity).join(',') === 'legendary,legendary,mythic,secret' &&
    shop.stock.every(item =>
      item.price === PREMIUM_CAT_SHOP_PRICES[item.rarity] &&
      (item.sold ? item.cat === null : item.cat && item.cat.rarity === item.rarity)
    );

  if (!validShop) {
    state.premiumCatShop = {
      refreshAt: getNextPremiumCatShopRefresh(now),
      stock: createPremiumCatStock()
    };
    saveGame();
    shop = state.premiumCatShop;
  } else if (now >= shop.refreshAt) {
    state.premiumCatShop = {
      refreshAt: getNextPremiumCatShopRefresh(now),
      stock: createPremiumCatStock()
    };
    saveGame();
    shop = state.premiumCatShop;
  } else if (!isPremiumCatShopRefreshTime(shop.refreshAt)) {
    shop.refreshAt = getNextPremiumCatShopRefresh(now);
    saveGame();
  }

  let traitUpdated = false;
  shop.stock.forEach(item => {
    const trait = item.sold ? null : item.cat.trait;
    if (trait && (
      trait.name !== PREMIUM_CAT_SHOP_TRAIT.name ||
      trait.type !== PREMIUM_CAT_SHOP_TRAIT.type ||
      trait.mult !== PREMIUM_CAT_SHOP_TRAIT.mult ||
      trait.emoji !== PREMIUM_CAT_SHOP_TRAIT.emoji
    )) {
      item.cat.trait = { ...PREMIUM_CAT_SHOP_TRAIT };
      traitUpdated = true;
    }
  });
  if (traitUpdated) saveGame();

  const modal = document.getElementById('shop-modal');
  if (modal && !modal.classList.contains('hidden')) renderPremiumCatShop();
}

function formatShopCountdown(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map(value => String(value).padStart(2, '0')).join(':');
}

function renderPremiumCatShop() {
  const list = document.getElementById('premium-cat-stock');
  const countdown = document.getElementById('premium-shop-countdown');
  const shop = state.premiumCatShop;
  if (!list || !countdown || !shop) return;

  countdown.textContent = `🔄 Stock mới sau ${formatShopCountdown(shop.refreshAt - Date.now())}`;
  const ownedCounts = (state.cats || []).reduce((counts, cat) => {
    counts[cat.rarity] = (counts[cat.rarity] || 0) + 1;
    return counts;
  }, {});

  list.innerHTML = shop.stock.map(item => {
    if (item.sold) {
      return `<article class="premium-cat-item premium-cat-sold">
        <strong>${RARITY_LABEL[item.rarity]}</strong>
        <p>Đã bán hết lượt này</p>
      </article>`;
    }

    const cat = item.cat;
    const atLimit = (ownedCounts[item.rarity] || 0) >= RARITY_LIMITS[item.rarity];
    const cannotAfford = state.money < item.price;
    const disabled = atLimit || cannotAfford;
    const buttonText = atLimit ? 'Đã đạt giới hạn' : cannotAfford ? 'Chưa đủ xu' : 'Mua mèo';
    return `<article class="premium-cat-item">
      <div class="result-cat-portrait">${renderCatSVG(cat)}</div>
      <strong class="premium-cat-name">${cat.name}</strong>
      <span class="premium-cat-rarity rarity-${item.rarity}">${RARITY_LABEL[item.rarity]}</span>
      <span class="premium-cat-trait">${PREMIUM_CAT_SHOP_TRAIT.emoji} ${PREMIUM_CAT_SHOP_TRAIT.name} · tốt nhất</span>
      <span class="premium-cat-price">💰 ${item.price.toLocaleString('vi-VN')} xu</span>
      <button class="btn-primary" data-buy-premium-cat="${item.id}" ${disabled ? 'disabled' : ''}>${buttonText}</button>
    </article>`;
  }).join('');

  list.querySelectorAll('[data-buy-premium-cat]').forEach(button => {
    button.addEventListener('click', () => buyPremiumShopCat(button.dataset.buyPremiumCat));
  });
}

function buyPremiumShopCat(stockId) {
  processPremiumCatShop();
  const item = state.premiumCatShop.stock.find(stockItem => stockItem.id === stockId);
  if (!item || item.sold || state.money < item.price) return;
  const ownedCount = (state.cats || []).filter(cat => cat.rarity === item.rarity).length;
  if (ownedCount >= RARITY_LIMITS[item.rarity]) {
    renderPremiumCatShop();
    return;
  }

  state.money -= item.price;
  item.sold = true;
  const cat = { ...item.cat };
  delete cat.shopCat;
  item.cat = null;
  state.cats.push(cat);
  addToCollection(cat.rarity);
  if (!state.stats) state.stats = {};
  if (!state.stats.premiumCatsBought) state.stats.premiumCatsBought = {};
  state.stats.premiumCatsBought[cat.rarity] = (Number(state.stats.premiumCatsBought[cat.rarity]) || 0) + 1;
  saveGame();
  render();
  renderPremiumCatShop();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, RARITY_EMOJI[cat.rarity], 12);
}

function toggleSelectAll(checked) {
  document.querySelectorAll('#bulk-sell-list input[type="checkbox"]').forEach(cb => cb.checked = checked);
  updateBulkTotal();
}

function updateBulkTotal() {
  let total = 0;
  document.querySelectorAll('#bulk-sell-list input[type="checkbox"]:checked').forEach(cb => {
    const cat = state.cats.find(c => c.id === cb.value);
    if (cat && !cat.expedition && !cat.mouseHunt && !cat.mazeTrip) total += getSellPrice(cat);
  });
  const totalEl = document.getElementById('bulk-total-money');
  if (totalEl) totalEl.textContent = total;
}

async function confirmBulkSell() {
  const checkedBoxes = document.querySelectorAll('#bulk-sell-list input[type="checkbox"]:checked');
  if (checkedBoxes.length === 0) return alert('Chưa chọn con mèo nào!');

  let totalMoney = 0;
  const idsToSell = [];

  checkedBoxes.forEach(cb => {
    const cat = state.cats.find(c => c.id === cb.value);
    if (cat && !cat.expedition && !cat.mouseHunt && !cat.mazeTrip) {
      totalMoney += getSellPrice(cat);
      idsToSell.push(cat.id);
    }
  });

  const check = await showCustomConfirm('💰 Bán tháo', `Bán ${idsToSell.length} bé mèo lấy <b>${totalMoney} xu</b>?`, false);
  if (!check) return;

  state.money += totalMoney;
  state.cats = state.cats.filter(c => !idsToSell.includes(c.id));
  
  // Đếm số mèo đã bán để tính Thành tựu
  if (!state.stats) state.stats = { catsSold: 0 };
  state.stats.catsSold += idsToSell.length;

  saveGame();
  render();
  checkAchievements(); // Kiểm tra thành tựu
  
  document.getElementById('shop-modal').classList.add('hidden');
  showHearts(window.innerWidth / 2, window.innerHeight / 2, '💰', 10);
}

// ============ ĐIỂM DANH HÀNG NGÀY ============
const DAILY_REWARDS = [
  { icon: '💰', label: '200 xu', detail: '200 xu', money: 200 },
  { icon: '💰', label: '350 xu', detail: '350 xu', money: 350 },
  { icon: '💧', label: '300 xu', detail: '300 xu + nước', money: 300, stat: 'thirst' },
  { icon: '💰', label: '500 xu', detail: '500 xu', money: 500 },
  { icon: '🍖', label: '500 xu', detail: '500 xu + thức ăn', money: 500, stat: 'hunger' },
  { icon: '💰', label: '800 xu', detail: '800 xu', money: 800 },
  { icon: '🎁', label: '1.000 xu', detail: '1.000 xu + mèo', money: 1000, cat: true }
];

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailyStatus(now = new Date()) {
  if (!state.daily) state.daily = { streak: 0, lastClaim: null };

  const today = getLocalDateKey(now);
  const lastClaim = state.daily.lastClaim;
  const lastClaimDate = lastClaim
    ? (/^\d{4}-\d{2}-\d{2}$/.test(lastClaim) ? new Date(`${lastClaim}T00:00:00`) : new Date(lastClaim))
    : null;
  const lastClaimKey = lastClaimDate && !Number.isNaN(lastClaimDate.getTime())
    ? getLocalDateKey(lastClaimDate)
    : null;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const streak = Math.max(0, Number(state.daily.streak) || 0);
  const hasClaimedToday = lastClaimKey === today;
  const activeStreak = lastClaimKey === getLocalDateKey(yesterday) ? streak : 0;

  return { canClaim: !hasClaimedToday, hasClaimedToday, streak, activeStreak };
}

function checkDailyLogin() {
  const { canClaim } = getDailyStatus();
  const badge = document.getElementById('daily-badge');
  if (badge) badge.style.display = canClaim ? 'flex' : 'none';
}

function openDailyModal() {
  const calendar = document.getElementById('daily-calendar');
  const { canClaim, hasClaimedToday, streak, activeStreak } = getDailyStatus();
  const progress = hasClaimedToday ? ((streak - 1) % 7) + 1 : activeStreak % 7;

  calendar.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const box = document.createElement('div');
    box.className = `day-box ${i < progress ? 'checked' : ''} ${i === progress && canClaim ? 'today' : ''}`;
    box.title = DAILY_REWARDS[i].detail;
    box.innerHTML = `
      <span>Ngày ${i+1}</span>
      <span class="reward-icon">${DAILY_REWARDS[i].icon}</span>
      <span>${DAILY_REWARDS[i].label}</span>
    `;
    calendar.appendChild(box);
  }

  document.getElementById('btn-daily-claim').disabled = !canClaim;
  document.getElementById('btn-daily-claim').textContent = canClaim
    ? `Nhận quà ngày ${(progress % 7) + 1} 🎁`
    : 'Đã nhận quà hôm nay';
  
  document.getElementById('daily-modal').classList.remove('hidden');
}

function claimDailyReward() {
  const { canClaim, activeStreak } = getDailyStatus();
  if (!canClaim) return;

  const rewardIndex = activeStreak % 7;
  const reward = DAILY_REWARDS[rewardIndex];
  state.money += reward.money;

  if (reward.stat === 'thirst' || reward.stat === 'hunger') {
    state.cats.forEach(cat => {
      cat[reward.stat] = clamp(cat[reward.stat] + 70, 0, 100);
    });
  }

  if (reward.cat) {
    const cat = createRandomCat();
    state.cats.push(cat);
    addToCollection(cat.rarity);
    alert(`🎉 Chúc mừng chuỗi 7 ngày! Bạn nhận được bé ${cat.name} (${RARITY_LABEL[cat.rarity]})!`);
  }

  state.daily.streak = activeStreak + 1;
  state.daily.lastClaim = getLocalDateKey(new Date());
  
  saveGame();
  render();
  checkAchievements(); // Kiểm tra thành tựu
  checkDailyLogin();
  document.getElementById('daily-modal').classList.add('hidden');
  showHearts(window.innerWidth / 2, window.innerHeight / 2, '🎁', 10);
}