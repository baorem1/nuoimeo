function formatStrayHuntTime(milliseconds) {
  const minutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours} giờ ${remainingMinutes} phút` : `${remainingMinutes} phút`;
}

function getStrayCatRarity() {
  const ownedCounts = (state.cats || []).reduce((counts, cat) => {
    counts[cat.rarity] = (counts[cat.rarity] || 0) + 1;
    return counts;
  }, {});
  const available = Object.entries(STRAY_CAT_HUNT.rarityWeights).filter(([rarity]) =>
    (ownedCounts[rarity] || 0) < RARITY_LIMITS[rarity]
  );
  if (!available.length) return null;
  const totalWeight = available.reduce((total, [, weight]) => total + weight, 0);
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of available) {
    roll -= weight;
    if (roll < 0) return rarity;
  }

  return available[available.length - 1][0];
}

function openStrayCatHunt() {
  processStrayCatHunt();
  renderStrayCatHunt();
  document.getElementById('stray-cat-hunt-modal').classList.remove('hidden');
}

function renderStrayCatHunt() {
  const content = document.getElementById('stray-cat-hunt-content');
  const hunt = state.strayCatHunt;
  if (!content) return;

  if (hunt?.status === 'away' && Date.now() >= hunt.endsAt) {
    processStrayCatHunt();
    return;
  }

  if (hunt?.status === 'away') {
    content.innerHTML = `
      <div class="stray-hunt-status">
        <div class="stray-hunt-illustration">🪤🐈</div>
        <strong>Bẫy đang chờ mèo hoang ghé thăm...</strong>
        <p>Còn ${formatStrayHuntTime(hunt.endsAt - Date.now())}. Bạn có thể đóng cửa sổ; kết quả vẫn được tính khi offline.</p>
        <small>Lượt tiếp theo mở sau ${formatStrayHuntTime(hunt.nextAvailableAt - Date.now())} kể từ lúc đặt mồi.</small>
      </div>`;
    return;
  }

  if (hunt?.status === 'ready') {
    if (hunt.result === 'caught') {
      const cat = hunt.resultCat;
      content.innerHTML = `
        <div class="stray-hunt-result">
          <div class="stray-hunt-portrait">${renderCatSVG(cat)}</div>
          <strong>🐾 Bắt gặp một bé mèo hoang!</strong>
          <span class="stray-hunt-rarity rarity-${cat.rarity}">${RARITY_EMOJI[cat.rarity]} ${RARITY_LABEL[cat.rarity]}</span>
          <p>${cat.name} · ${ALLELES[cat.color].name} · ${cat.trait.emoji} ${cat.trait.name}</p>
          <button id="btn-stray-hunt-claim" class="btn-primary">Đón bé về nhà</button>
        </div>`;
      document.getElementById('btn-stray-hunt-claim').addEventListener('click', claimStrayCat);
    } else {
      content.innerHTML = `
        <div class="stray-hunt-result stray-hunt-miss">
          <div class="stray-hunt-illustration">🍃🐾</div>
          <strong>Chưa có bé mèo nào ghé qua...</strong>
          <p>Mồi đã hết, nhưng biết đâu lượt sau sẽ có bất ngờ!</p>
          <button id="btn-stray-hunt-claim" class="btn-secondary">Thu dọn bẫy</button>
        </div>`;
      document.getElementById('btn-stray-hunt-claim').addEventListener('click', claimStrayCat);
    }
    return;
  }

  const nextAvailableAt = hunt?.nextAvailableAt || 0;
  const onCooldown = Date.now() < nextAvailableAt;
  const cannotAfford = state.money < STRAY_CAT_HUNT.baitCost;
  const odds = Object.entries(STRAY_CAT_HUNT.rarityWeights)
    .map(([rarity, chance]) => `${RARITY_LABEL[rarity]} ${chance}%`)
    .join(' · ');
  content.innerHTML = `
    <div class="stray-hunt-ready">
      <div class="stray-hunt-illustration">🧺🐈‍⬛</div>
      <p>Đặt một phần thức ăn làm mồi và chờ 30 phút. Có 80% cơ hội mèo ghé bẫy; nếu thành công, độ hiếm được chọn ngẫu nhiên theo tỉ lệ dưới đây.</p>
      <p class="stray-hunt-odds">${odds}</p>
      <small class="stray-hunt-odds-note">Nếu một độ hiếm đã đạt giới hạn sở hữu, tỉ lệ của hạng đó sẽ chuyển sang các hạng còn chỗ.</small>
      ${onCooldown ? `<p class="stray-hunt-cooldown">Lượt tiếp theo sau ${formatStrayHuntTime(nextAvailableAt - Date.now())}.</p>` : ''}
      <button id="btn-stray-hunt-start" class="btn-primary" ${onCooldown || cannotAfford ? 'disabled' : ''}>
        ${onCooldown ? 'Đang hồi chiêu' : cannotAfford ? `Cần ${STRAY_CAT_HUNT.baitCost} xu` : `Đặt mồi · ${STRAY_CAT_HUNT.baitCost} xu`}
      </button>
    </div>`;
  const startButton = document.getElementById('btn-stray-hunt-start');
  if (startButton) startButton.addEventListener('click', startStrayCatHunt);
}

function startStrayCatHunt() {
  const previousHunt = state.strayCatHunt;
  if (previousHunt && (
    previousHunt.status === 'away' ||
    previousHunt.status === 'ready' ||
    Date.now() < previousHunt.nextAvailableAt
  )) {
    renderStrayCatHunt();
    return;
  }
  if (state.money < STRAY_CAT_HUNT.baitCost) {
    alert(`Không đủ xu để mua mồi! Cần ${STRAY_CAT_HUNT.baitCost} xu.`);
    renderStrayCatHunt();
    return;
  }

  const startedAt = Date.now();
  state.money -= STRAY_CAT_HUNT.baitCost;
  state.strayCatHunt = {
    startedAt,
    endsAt: startedAt + STRAY_CAT_HUNT.duration,
    nextAvailableAt: startedAt + STRAY_CAT_HUNT.cooldown,
    status: 'away',
    result: null,
    resultCat: null
  };
  saveGame();
  render();
  renderStrayCatHunt();
}

function processStrayCatHunt() {
  const hunt = state.strayCatHunt;
  if (!hunt) return false;

  if (hunt.status === 'away' && Date.now() >= hunt.endsAt) {
    if (Math.random() < STRAY_CAT_HUNT.successChance) {
      const rarity = getStrayCatRarity();
      if (rarity) {
        hunt.result = 'caught';
        hunt.resultCat = createRandomCat(null, rarity);
      } else {
        hunt.result = 'miss';
      }
    } else {
      hunt.result = 'miss';
    }
    hunt.status = 'ready';
    saveGame();
    const modal = document.getElementById('stray-cat-hunt-modal');
    if (modal && !modal.classList.contains('hidden')) renderStrayCatHunt();
    return true;
  }

  const modal = document.getElementById('stray-cat-hunt-modal');
  if (modal && !modal.classList.contains('hidden')) renderStrayCatHunt();
  return false;
}

function claimStrayCat() {
  const hunt = state.strayCatHunt;
  if (hunt?.status !== 'ready') return;

  if (hunt.result === 'caught') {
    const cat = hunt.resultCat;
    state.cats.push(cat);
    addToCollection(cat.rarity);
    addAchievementProgress('strayCatsCaught');
    recordCatDiary(cat, {
      id: `stray-cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'adopt',
      title: 'Được đón về từ ngoài phố',
      detail: `Được tìm thấy trong một lần đặt bẫy mèo hoang (${RARITY_LABEL[cat.rarity]}).`
    });
  }

  hunt.status = 'cooldown';
  hunt.result = null;
  hunt.resultCat = null;
  saveGame();
  render();
  renderStrayCatHunt();
  checkAchievements();
}
