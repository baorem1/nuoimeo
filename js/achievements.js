const ACHIEVEMENTS = [
  { id: 'cat_5', icon: '🐾', name: 'Bắt đầu nuôi', desc: 'Đang sở hữu 5 con mèo.', reward: { money: 500 }, current: s => s.cats.length, target: 5 },
  { id: 'cat_10', icon: '🐈', name: 'Nhà có đàn mèo', desc: 'Đang sở hữu 10 con mèo.', reward: { money: 1200, items: { food: 2 } }, current: s => s.cats.length, target: 10 },
  { id: 'cat_20', icon: '🏠', name: 'Trại mèo', desc: 'Đang sở hữu 20 con mèo.', reward: { money: 3000, items: { chest: 1 } }, current: s => s.cats.length, target: 20 },
  { id: 'cat_50', icon: '🏰', name: 'Đế chế mèo', desc: 'Đang sở hữu 50 con mèo.', reward: { money: 8000, items: { chest: 2, food: 3 } }, current: s => s.cats.length, target: 50 },
  { id: 'sell_10', icon: '💰', name: 'Thương nhân', desc: 'Bán tổng cộng 10 con mèo.', reward: { money: 1500 }, current: s => s.stats?.catsSold || 0, target: 10 },
  { id: 'sell_50', icon: '🏪', name: 'Ông trùm mua bán', desc: 'Bán tổng cộng 50 con mèo.', reward: { money: 7500, items: { chest: 1 } }, current: s => s.stats?.catsSold || 0, target: 50 },
  { id: 'money_10k', icon: '🤑', name: 'Đại gia', desc: 'Tích lũy 10.000 xu cùng lúc.', reward: { money: 2500, items: { water: 2 } }, current: s => Math.floor(s.money), target: 10000 },
  { id: 'legend_1', icon: '👑', name: 'Huyền thoại', desc: 'Từng sở hữu 1 bé Legendary.', reward: { money: 3000, items: { chest: 1 } }, current: s => s.collection?.legendary || 0, target: 1 },
  { id: 'secret_1', icon: '🌈', name: 'Kẻ may mắn', desc: 'Từng sở hữu 1 bé Secret.', reward: { money: 10000, items: { chest: 2 } }, current: s => s.collection?.secret || 0, target: 1 },
  { id: 'breed_10', icon: '💕', name: 'Gia đình mèo', desc: 'Lai tạo thành công 10 mèo con.', reward: { money: 2000, items: { food: 2 } }, current: s => s.stats?.catsBred || 0, target: 10 },
  { id: 'breed_50', icon: '🍼', name: 'Trại nhân giống', desc: 'Lai tạo thành công 50 mèo con.', reward: { money: 7000, items: { chest: 1, food: 3 } }, current: s => s.stats?.catsBred || 0, target: 50 },
  { id: 'expedition_1', icon: '🧭', name: 'Chuyến đi đầu tiên', desc: 'Nhận quà từ 1 chuyến thám hiểm.', reward: { money: 800, items: { food: 1 } }, current: s => s.stats?.expeditionsCompleted || 0, target: 1 },
  { id: 'expedition_10', icon: '🗺️', name: 'Nhà thám hiểm', desc: 'Nhận quà từ 10 chuyến thám hiểm.', reward: { money: 4000, items: { chest: 1 } }, current: s => s.stats?.expeditionsCompleted || 0, target: 10 },
  { id: 'expedition_chest_5', icon: '🎒', name: 'Tay săn rương', desc: 'Tìm được 5 rương từ chuyến thám hiểm.', reward: { money: 2500, items: { chest: 1 } }, current: s => s.stats?.expeditionChestsFound || 0, target: 5 },
  { id: 'mouse_hunt_10', icon: '🐭', name: 'Thợ săn chuột', desc: 'Hoàn thành 10 chuyến bắt chuột.', reward: { money: 2500, items: { food: 3 } }, current: s => s.stats?.mouseHuntsCompleted || 0, target: 10 },
  { id: 'mice_100', icon: '🐾', name: 'Cao thủ săn mồi', desc: 'Bắt được tổng cộng 100 con chuột.', reward: { money: 4000, items: { chest: 1 } }, current: s => s.stats?.miceCaught || 0, target: 100 },
  { id: 'maze_1', icon: '🌀', name: 'Thoát hiểm', desc: 'Tìm được lối ra mê cung lần đầu.', reward: { money: 1500, items: { chest: 1, food: 1 } }, current: s => s.stats?.mazesCompleted || 0, target: 1 },
  { id: 'maze_10', icon: '🏁', name: 'Bậc thầy mê cung', desc: 'Tìm được lối ra mê cung 10 lần.', reward: { money: 8000, items: { chest: 2 } }, current: s => s.stats?.mazesCompleted || 0, target: 10 },
  { id: 'maze_chest_10', icon: '🎁', name: 'Thợ săn kho báu', desc: 'Tìm được 10 rương trong mê cung.', reward: { money: 6000, items: { chest: 1 } }, current: s => s.stats?.mazeChestsFound || 0, target: 10 },
  { id: 'chest_10', icon: '🗝️', name: 'Người mở rương', desc: 'Mở 10 rương báu.', reward: { money: 3500, items: { food: 2, water: 2 } }, current: s => s.stats?.chestsOpened || 0, target: 10 },
  { id: 'premium_legendary', icon: '🛍️', name: 'Khách VIP', desc: 'Mua 1 mèo Legendary trong shop hiếm.', reward: { money: 2500 }, current: s => s.stats?.premiumCatsBought?.legendary || 0, target: 1 },
  { id: 'premium_mythic', icon: '🔴', name: 'Sưu tầm thần thoại', desc: 'Mua 1 mèo Mythic trong shop hiếm.', reward: { money: 6000, items: { chest: 1 } }, current: s => s.stats?.premiumCatsBought?.mythic || 0, target: 1 },
  { id: 'premium_secret', icon: '💎', name: 'Chủ nhân Secret', desc: 'Mua 1 mèo Secret trong shop hiếm.', reward: { money: 15000, items: { chest: 3 } }, current: s => s.stats?.premiumCatsBought?.secret || 0, target: 1 },
  { id: 'stray_cat_1', icon: '🐾', name: 'Mèo hoang đầu tiên', desc: 'Đón 1 bé mèo hoang về nhà.', reward: { money: 500, items: { food: 1 } }, current: s => s.stats?.strayCatsCaught || 0, target: 1 },
  { id: 'stray_cat_5', icon: '🏡', name: 'Người bạn của mèo hoang', desc: 'Đón 5 bé mèo hoang về nhà.', reward: { money: 2500, items: { chest: 1 } }, current: s => s.stats?.strayCatsCaught || 0, target: 5 }
];

function ensureAchievementStats() {
  if (!state.stats || typeof state.stats !== 'object') state.stats = {};
  state.stats.catsSold = Math.max(0, Number(state.stats.catsSold) || 0);
  state.stats.catsBred = Math.max(0, Number(state.stats.catsBred) || 0);
  state.stats.expeditionsCompleted = Math.max(0, Number(state.stats.expeditionsCompleted) || 0);
  state.stats.mouseHuntsCompleted = Math.max(0, Number(state.stats.mouseHuntsCompleted) || 0);
  state.stats.miceCaught = Math.max(0, Number(state.stats.miceCaught) || 0);
  state.stats.mazesCompleted = Math.max(0, Number(state.stats.mazesCompleted) || 0);
  state.stats.mazeChestsFound = Math.max(0, Number(state.stats.mazeChestsFound) || 0);
  state.stats.chestsOpened = Math.max(0, Number(state.stats.chestsOpened) || 0);
  state.stats.strayCatsCaught = Math.max(0, Number(state.stats.strayCatsCaught) || 0);
  if (!state.stats.premiumCatsBought || typeof state.stats.premiumCatsBought !== 'object') {
    state.stats.premiumCatsBought = {};
  }
}

function addAchievementProgress(stat, amount = 1) {
  ensureAchievementStats();
  state.stats[stat] = (Number(state.stats[stat]) || 0) + amount;
}

function formatAchievementReward(reward) {
  const parts = [];
  if (reward.money) parts.push(`${reward.money.toLocaleString('vi-VN')} xu`);
  Object.entries(reward.items || {}).forEach(([item, quantity]) => {
    const labels = { chest: 'rương', food: 'thức ăn', water: 'nước mát', soap: 'xà phòng' };
    parts.push(`${quantity} ${labels[item] || item}`);
  });
  return parts.join(' + ');
}

function grantAchievementReward(reward) {
  if (reward.money) state.money += reward.money;
  if (Object.keys(reward.items || {}).length) {
    if (!state.inventory) state.inventory = {};
    Object.entries(reward.items).forEach(([item, quantity]) => {
      state.inventory[item] = (Number(state.inventory[item]) || 0) + quantity;
    });
  }
}

function getAchievementRewardSummary(achievements) {
  const money = achievements.reduce((total, achievement) => total + (achievement.reward.money || 0), 0);
  const items = {};
  achievements.forEach(achievement => {
    Object.entries(achievement.reward.items || {}).forEach(([item, quantity]) => {
      items[item] = (items[item] || 0) + quantity;
    });
  });
  return formatAchievementReward({ money, items }) || 'Đã nhận toàn bộ quà';
}

function checkAchievements() {
  ensureAchievementStats();
  if (!Array.isArray(state.completedAch)) state.completedAch = [];
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(achievement => {
    const current = achievement.current(state);
    if (!state.completedAch.includes(achievement.id) && current >= achievement.target) {
      state.completedAch.push(achievement.id);
      grantAchievementReward(achievement.reward);
      newlyUnlocked.push(achievement);
    }
  });

  const achievementModal = document.getElementById('achievement-modal');
  if (newlyUnlocked.length) {
    saveGame();
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '🏆', Math.min(30, newlyUnlocked.length * 5));
    const notices = newlyUnlocked.map(achievement =>
      `${achievement.name}: ${formatAchievementReward(achievement.reward)}`
    );
    setTimeout(() => {
      alert(`🏆 MỞ KHÓA ${newlyUnlocked.length} THÀNH TỰU!\n\n${notices.join('\n')}\n\nTổng quà nhận lần này: ${getAchievementRewardSummary(newlyUnlocked)}`);
    }, 300);
  }
  if (achievementModal && !achievementModal.classList.contains('hidden')) renderAchievements();
}

function renderAchievements() {
  ensureAchievementStats();
  const list = document.getElementById('achievement-list');
  if (!list) return;
  list.replaceChildren();

  ACHIEVEMENTS.forEach(achievement => {
    const isDone = state.completedAch?.includes(achievement.id) || false;
    const current = Math.max(0, Number(achievement.current(state)) || 0);
    const percent = isDone ? 100 : Math.min(100, current / achievement.target * 100);
    const div = document.createElement('div');
    div.className = `achievement-item ${isDone ? 'completed' : ''}`;
    div.innerHTML = `
      <div class="ach-icon">${achievement.icon}</div>
      <div class="ach-info">
        <div class="ach-name">${achievement.name}</div>
        <div class="ach-desc">${achievement.desc}</div>
        <div class="achievement-progress-row">
          <span>Tiến độ: <b>${current.toLocaleString('vi-VN')} / ${achievement.target.toLocaleString('vi-VN')}</b></span>
          <span>${Math.floor(percent)}%</span>
        </div>
        <div class="achievement-progress-track">
          <div class="achievement-progress-fill" style="width:${percent}%"></div>
        </div>
        <div class="ach-reward">🎁 ${formatAchievementReward(achievement.reward)}</div>
      </div>
      <div class="ach-status ${isDone ? 'done' : ''}">${isDone ? 'Đã nhận' : 'Chưa đạt'}</div>
    `;
    list.appendChild(div);
  });

}

function openAchievements() {
  renderAchievements();
  document.getElementById('achievement-modal').classList.remove('hidden');
}
