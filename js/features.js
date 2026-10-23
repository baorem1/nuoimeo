// ============ CỬA HÀNG (MUA & BÁN) ============
function openShop() {
  switchShopTab('buy');
  
  const list = document.getElementById('bulk-sell-list');
  list.innerHTML = '';
  
  const availableCats = state.cats.filter(cat => !cat.expedition);
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
}

function toggleSelectAll(checked) {
  document.querySelectorAll('#bulk-sell-list input[type="checkbox"]').forEach(cb => cb.checked = checked);
  updateBulkTotal();
}

function updateBulkTotal() {
  let total = 0;
  document.querySelectorAll('#bulk-sell-list input[type="checkbox"]:checked').forEach(cb => {
    const cat = state.cats.find(c => c.id === cb.value);
    if (cat && !cat.expedition) total += getSellPrice(cat);
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
    if (cat && !cat.expedition) {
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