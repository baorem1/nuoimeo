const EXPEDITION_TRIPS = [
  { id: 'flower-garden', name: 'Vườn Hoa', emoji: '🌷', duration: 30 * 60 * 1000, reward: 120, chestChance: 15 },
  { id: 'mushroom-forest', name: 'Rừng Nấm', emoji: '🍄', duration: 2 * 60 * 60 * 1000, reward: 400, chestChance: 30 },
  { id: 'crystal-cave', name: 'Hang Pha Lê', emoji: '💎', duration: 6 * 60 * 60 * 1000, reward: 1100, chestChance: 50 }
];

function getExpeditionReward(cat, baseReward) {
  const rarityMultiplier = 1 + (RARITY_ORDER[cat.rarity] || 0) * 0.25;
  const levelMultiplier = 1 + (Math.max(1, cat.level) - 1) * 0.05;
  const equipmentMultiplier = 1 + getCatEquipmentBonus(cat, 'expeditionCoins');
  const luckMultiplier = 0.8 + Math.random() * 0.4;
  return Math.round(baseReward * rarityMultiplier * levelMultiplier * equipmentMultiplier * luckMultiplier / 10) * 10;
}

function getExpeditionDuration(cat, trip) {
  const speedBonus = Math.min(0.5, getCatEquipmentBonus(cat, 'expeditionSpeed'));
  return Math.round(trip.duration * (1 - speedBonus));
}

function getExpeditionChestChance(cat, trip) {
  return Math.min(80, trip.chestChance + getCatEquipmentBonus(cat, 'chestChance'));
}

function formatExpeditionTime(milliseconds) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
}

function openExpeditionModal(selectedCatId = null) {
  processExpeditions();
  renderExpeditions(selectedCatId);
  document.getElementById('expedition-modal').classList.remove('hidden');
}

function renderExpeditions(selectedCatId = null) {
  const list = document.getElementById('expedition-list');
  if (!list) return;

  const cats = state.cats || [];
  if (cats.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Bạn chưa có mèo để thám hiểm.</p>';
    return;
  }

  list.innerHTML = cats.map(cat => {
    if (cat.expedition) {
      const expedition = cat.expedition;
      const trip = EXPEDITION_TRIPS.find(item => item.id === expedition.tripId);
      const status = expedition.status === 'ready'
        ? `<p style="margin:8px 0;color:#258253;font-weight:bold;">🎉 ${cat.name} đã trở về! Tìm được ${expedition.reward} xu${expedition.chestFound ? ' và một rương báu 🎁' : ''}.</p>
           <button class="btn-primary" data-expedition-action="claim" data-id="${cat.id}" style="width:100%;">Nhận quà</button>`
        : `<p style="margin:8px 0;color:#777;">Đang thám hiểm ${trip?.name || 'một nơi xa'} · còn ${formatExpeditionTime(expedition.endsAt - Date.now())}</p>
           <small style="color:#777;">Dự kiến ${expedition.reward} xu · ${expedition.chestChance}% tìm thấy rương.</small>`;
      return `<div class="breed-item expedition-item" style="display:block;margin-bottom:10px;">
        <div style="font-weight:bold;">${cat.name} · Lv${cat.level} · ${RARITY_LABEL[cat.rarity]}</div>
        ${status}
      </div>`;
    }

    const rarityMultiplier = 1 + (RARITY_ORDER[cat.rarity] || 0) * 0.25;
    const levelMultiplier = 1 + (Math.max(1, cat.level) - 1) * 0.05;
    const trips = EXPEDITION_TRIPS.map(trip => {
      const expectedReward = Math.round(trip.reward * rarityMultiplier * levelMultiplier * (1 + getCatEquipmentBonus(cat, 'expeditionCoins')) / 10) * 10;
      const duration = getExpeditionDuration(cat, trip);
      const chestChance = getExpeditionChestChance(cat, trip);
      return `<button class="btn-secondary expedition-start" data-expedition-action="start" data-id="${cat.id}" data-trip="${trip.id}">
        ${trip.emoji} ${trip.name}<br><small>${formatExpeditionTime(duration)} · ~${expectedReward} xu · ${chestChance}% rương</small>
      </button>`;
    }).join('');
    const selected = selectedCatId === cat.id ? ' expedition-selected' : '';
    return `<div class="breed-item expedition-item${selected}" style="display:block;margin-bottom:10px;">
      <div style="font-weight:bold;margin-bottom:10px;">${cat.name} · Lv${cat.level} · ${RARITY_LABEL[cat.rarity]}</div>
      <div class="expedition-trips">${trips}</div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-expedition-action]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.expeditionAction === 'start') {
        startCatExpedition(button.dataset.id, button.dataset.trip);
      } else {
        claimExpedition(button.dataset.id);
      }
    });
  });
}

function startCatExpedition(catId, tripId) {
  const cat = state.cats.find(item => item.id === catId);
  const trip = EXPEDITION_TRIPS.find(item => item.id === tripId);
  if (!cat || cat.expedition || !trip) return;

  updateAllCats();
  const now = Date.now();
  const duration = getExpeditionDuration(cat, trip);
  cat.expedition = {
    tripId: trip.id,
    startedAt: now,
    endsAt: now + duration,
    chestChance: getExpeditionChestChance(cat, trip),
    reward: getExpeditionReward(cat, trip.reward),
    status: 'away'
  };
  saveGame();
  render();
  renderExpeditions();
}

function processExpeditions() {
  let changed = false;
  (state.cats || []).forEach(cat => {
    if (cat.expedition?.status === 'away' && Date.now() >= cat.expedition.endsAt) {
      cat.expedition.chestFound = Math.random() * 100 < (cat.expedition.chestChance || 0);
      cat.expedition.status = 'ready';
      changed = true;
    }
  });

  const modal = document.getElementById('expedition-modal');
  if (modal && !modal.classList.contains('hidden')) renderExpeditions();
  return changed;
}

function claimExpedition(catId) {
  const cat = state.cats.find(item => item.id === catId);
  if (!cat || cat.expedition?.status !== 'ready') return;

  const reward = cat.expedition.reward;
  const chestFound = cat.expedition.chestFound;
  cat.expedition = null;
  state.money += reward;
  if (chestFound) {
    if (!state.inventory) state.inventory = {};
    state.inventory.chest = (Number(state.inventory.chest) || 0) + 1;
  }
  saveGame();
  render();
  renderExpeditions();
  if (chestFound) renderInventory();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, chestFound ? '🎁' : '💰', chestFound ? 12 : 8);
}
