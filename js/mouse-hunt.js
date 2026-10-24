const MOUSE_HUNT_DURATION = 30 * 60 * 1000;
const MOUSE_HUNT_SUCCESS_CHANCE = 0.75;
const MOUSE_HUNT_COIN_PER_MOUSE = 10;
const MOUSE_HUNT_IMAGES = [
  'img/batchuot/batchuot1.png',
  'img/batchuot/batchuot2.png',
  'img/batchuot/batchuot3.png'
];
let mouseHuntConfirmationPending = false;

function getMouseHuntReward(cat, miceCaught) {
  return scaleCoinsByRarity(miceCaught * MOUSE_HUNT_COIN_PER_MOUSE, cat.rarity);
}

function openMouseHuntModal(selectedCatId = null) {
  openActivityManager('mouse-hunt', selectedCatId);
}

function renderMouseHunts(selectedCatId = null) {
  const list = document.getElementById('mouse-hunt-list');
  if (!list) return;

  const mouseGallery = MOUSE_HUNT_IMAGES.map((image, index) =>
    `<img src="${image}" alt="Chuột ${index + 1}" class="mouse-hunt-preview">`
  ).join('');

  if (!(state.cats || []).length) {
    list.innerHTML = '<p class="mouse-hunt-empty">Bạn chưa có mèo để đi bắt chuột.</p>';
    return;
  }

  list.innerHTML = state.cats.map(cat => {
    let content = '';
    if (cat.mouseHunt?.status === 'away') {
      content = `<div class="mouse-hunt-result"><p class="mouse-hunt-status">🐾 Đang rình bắt chuột · còn ${formatExpeditionTime(cat.mouseHunt.endsAt - Date.now())}</p><p>Thưởng: ${MOUSE_HUNT_COIN_PER_MOUSE}–${MOUSE_HUNT_COIN_PER_MOUSE * 2} xu mỗi con chuột, nhân theo độ hiếm.</p>${mouseGallery}</div>`;
    } else if (cat.mouseHunt?.status === 'ready') {
      const count = cat.mouseHunt.miceCaught;
      const reward = getMouseHuntReward(cat, count);
      content = count > 0
        ? `<div class="mouse-hunt-result">${mouseGallery}<p>🎉 Bắt được <b>${count} con chuột</b> · nhận <b>${reward} xu</b>.</p></div>`
        : `<div class="mouse-hunt-result unlucky">${mouseGallery}<p>🍃 Hôm nay chuột trốn kỹ quá, bé chưa bắt được con nào.</p></div>`;
      content += `<button class="btn-primary mouse-hunt-claim" data-mouse-hunt-claim="${cat.id}">Nhận kết quả</button>`;
    } else if (cat.expedition) {
      content = '<p class="mouse-hunt-blocked">🧭 Bé đang đi thám hiểm, hãy chờ về rồi mới bắt chuột nhé.</p>';
    } else if (cat.mazeTrip) {
      content = `<p class="mouse-hunt-blocked">🌀 Bé đang ở mê cung. ${cat.mazeTrip.status === 'ready' ? 'Nhận quà mê cung trước rồi mới bắt chuột nhé.' : 'Chờ bé tìm được lối ra rồi mới bắt chuột nhé.'}</p>`;
    } else if (cat.inFarm) {
      content = '<p class="mouse-hunt-blocked">🌿 Bé đang vui chơi ở trang trại, hãy cho về nhà trước nhé.</p>';
    } else {
      const minReward = getMouseHuntReward(cat, 10).toLocaleString('vi-VN');
      const maxReward = getMouseHuntReward(cat, 20).toLocaleString('vi-VN');
      content = `<div class="mouse-hunt-ready">${mouseGallery}<p>Nếu bắt được 10–20 con: ${minReward}–${maxReward} xu; có thể về tay không.</p><button class="btn-secondary" data-mouse-hunt-start="${cat.id}">🔎 Bắt đầu chuyến đi · 30 phút</button></div>`;
    }

    const selected = selectedCatId === cat.id ? ' mouse-hunt-selected' : '';
    return `<section class="breed-item mouse-hunt-item activity-cat-card${selected}">
      <div class="mouse-hunt-cat-name">${cat.name} · Lv${cat.level} · ${RARITY_LABEL[cat.rarity]}</div>
      ${content}
    </section>`;
  }).join('');

  list.querySelectorAll('[data-mouse-hunt-start]').forEach(button => {
    button.addEventListener('click', () => confirmMouseHuntStart(button.dataset.mouseHuntStart));
  });
  list.querySelectorAll('[data-mouse-hunt-claim]').forEach(button => {
    button.addEventListener('click', () => claimMouseHunt(button.dataset.mouseHuntClaim));
  });
  updateActivityManagerSummary();
}

async function confirmMouseHuntStart(catId) {
  if (mouseHuntConfirmationPending) return;
  const cat = state.cats.find(item => item.id === catId);
  if (!cat || cat.mouseHunt || cat.expedition || cat.mazeTrip || cat.inFarm) return;

  mouseHuntConfirmationPending = true;
  try {
    const confirmed = await showCustomConfirm(
      '🐭 Xác nhận chuyến bắt chuột',
      `Cho bé <b>${cat.name}</b> (${RARITY_LABEL[cat.rarity]}) đi bắt chuột trong <b>30 phút</b>? Bé có thể bắt được xu hoặc về tay không.`,
      false
    );
    if (confirmed) startMouseHunt(catId);
  } finally {
    mouseHuntConfirmationPending = false;
  }
}

function startMouseHunt(catId) {
  const cat = state.cats.find(item => item.id === catId);
  if (!cat || cat.mouseHunt || cat.expedition || cat.mazeTrip || cat.inFarm) return;

  updateAllCats();
  const startedAt = Date.now();
  cat.mouseHunt = {
    startedAt,
    endsAt: startedAt + MOUSE_HUNT_DURATION,
    status: 'away',
    miceCaught: null
  };
  saveGame();
  render();
  openMouseHuntModal();
}

function processMouseHunts() {
  let changed = false;
  (state.cats || []).forEach(cat => {
    if (cat.mouseHunt?.status === 'away' && Date.now() >= cat.mouseHunt.endsAt) {
      const caughtSomething = Math.random() < MOUSE_HUNT_SUCCESS_CHANCE;
      cat.mouseHunt.miceCaught = caughtSomething ? Math.floor(Math.random() * 11) + 10 : 0;
      cat.mouseHunt.status = 'ready';
      changed = true;
    }
  });

  if (isActivityManagerOpen('mouse-hunt')) {
    const list = document.getElementById('mouse-hunt-list');
    const scrollTop = list.scrollTop;
    renderMouseHunts();
    list.scrollTop = scrollTop;
  }
  if (isActivityManagerOpen()) updateActivityManagerSummary();
  return changed;
}

function claimMouseHunt(catId) {
  const cat = state.cats.find(item => item.id === catId);
  if (!cat || cat.mouseHunt?.status !== 'ready') return;

  const miceCaught = cat.mouseHunt.miceCaught;
  const reward = getMouseHuntReward(cat, miceCaught);
  addAchievementProgress('mouseHuntsCompleted');
  if (miceCaught > 0) addAchievementProgress('miceCaught', miceCaught);
  recordCatDiary(cat, {
    id: `mouse-hunt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'mouse_hunt',
    title: miceCaught > 0 ? 'Chuyến bắt chuột thành công' : 'Chuột trốn mất rồi',
    detail: miceCaught > 0
      ? `Bắt được ${miceCaught} con chuột, mang về ${reward} xu (${RARITY_LABEL[cat.rarity]}).`
      : 'Đã kiên nhẫn rình suốt chuyến đi nhưng chưa bắt được con nào.'
  });
  cat.mouseHunt = null;
  state.money += reward;
  saveGame();
  render();
  renderMouseHunts();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, miceCaught > 0 ? '🐭' : '🍃', miceCaught > 0 ? 10 : 4);
}
