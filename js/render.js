function render() {
  document.getElementById('money').textContent = Math.floor(state.money);

  const list = document.getElementById('cat-list');
  list.innerHTML = '';

  if (state.cats.length === 0) {
    list.innerHTML = '<p style="text-align:center;width:100%;color:#999;padding:40px;">Chưa có mèo nào. Mua thêm nhé!</p>';
    return;
  }

  // Sắp xếp: rarity cao lên đầu, cùng rarity thì level cao lên đầu
  const sorted = [...state.cats].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || b.level - a.level);
  sorted.forEach(cat => renderCatCard(cat, list));

  // Gắn sự kiện click cho các nút
  list.querySelectorAll('[data-action]').forEach(el => {
    const action = el.dataset.action;
    const id = el.dataset.id;
    if (el.tagName === 'BUTTON') {
      el.addEventListener('click', e => {
        if (action === 'feed')  feedCat(id, e);
        if (action === 'drink') drinkCat(id, e);
        if (action === 'bath')  bathCat(id, e);
        if (action === 'breed') openBreedModal(id);
        if (action === 'sell')  sellCat(id, e);
        if (action === 'auction') startCatAuction(id);
        if (action === 'expedition') openExpeditionModal(id);
        if (action === 'diary') openCatDiary(id);
        if (action === 'mouse-hunt') {
          if (state.cats.find(cat => cat.id === id)?.mouseHunt) openMouseHuntModal();
          else startMouseHunt(id);
        }
        if (action === 'maze') openMazeModal(id);
      });
    } else if (action === 'pet') {
      el.addEventListener('click', e => petCat(id, e));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          petCat(id, e);
        }
      });
    }
  });
  
  checkAchievements();
}

function renderCatCard(cat, container) {
  const card = document.createElement('div');
  const isMax = cat.level >= MAX_LEVEL;
  
  // --- TÍNH NĂNG TIẾN HÓA THẺ BÀI ---
  let tierClass = '';
  if (cat.level >= 4 && cat.level <= 6) {
    tierClass = 'level-tier-1'; // Lv4-6: Phát sáng nhẹ
  } else if (cat.level >= 7 && cat.level < 10) {
    tierClass = 'level-tier-2'; // Lv7-9: Ánh sáng chạy + Tím
  }
  
  // Gộp class
  const isExploring = Boolean(cat.expedition);
  const isMouseHunting = Boolean(cat.mouseHunt);
  const isInMaze = Boolean(cat.mazeTrip);
  const isInFarm = Boolean(cat.inFarm && !isExploring && !isMouseHunting && !isInMaze);
  const isAway = isExploring || isMouseHunting || isInMaze;
  card.className = `cat-card rarity-${cat.rarity} ${tierClass}${isMax ? ' max-level' : ''}${isExploring ? ' is-exploring' : ''}${isInFarm ? ' is-in-farm' : ''}${isMouseHunting ? ' is-mouse-hunting' : ''}${isInMaze ? ' is-in-maze' : ''}`;

  const stage = getCatStage(cat);
  const allele = ALLELES[cat.color];
  const genderIcon = cat.gender === 'male' ? '♂' : '♀';
  const genderClass = cat.gender === 'male' ? 'gender-male' : 'gender-female';
  const sleeping = !isAway && (cat.happiness < 30 || cat.hunger < 20);
  const spriteClass = sleeping ? 'cat-sprite-wrap sleeping' : 'cat-sprite-wrap';

  const sellPrice = getSellPrice(cat);
  const canAuction = cat.level >= 5 && !cat.auctionRejected && !isAway;
  const canBreedNow = stage === 'adult' && cat.happiness >= 50 &&
                      (Date.now() - cat.lastBreedTime) >= 60*60*1000 && !isAway;

  // Tính toán thanh EXP
  const curExp = getExpForLevel(cat.level);
  const nextExp = isMax ? null : getExpForLevel(cat.level + 1);
  const expPercent = isMax ? 100 : Math.min(100, ((cat.exp - curExp) / (nextExp - curExp)) * 100);
  const expText = isMax ? 'MAX' : `${Math.floor(cat.exp)} / ${nextExp} EXP`;
  const equippedItems = (cat.equipment || [])
    .map(itemId => PERMANENT_ITEMS[itemId])
    .filter(Boolean);

  card.innerHTML = `
    <div class="cat-card-top">
      <div class="rarity-badge rarity-${cat.rarity}">${RARITY_LABEL[cat.rarity]}</div>
      <span class="cat-level-chip ${isMax ? 'lv10' : ''}">Lv ${cat.level}</span>
    </div>
    <div class="cat-hero">
      <div class="${spriteClass} cat-portrait" ${isAway ? '' : `data-action="pet" data-id="${cat.id}" role="button" tabindex="0" aria-label="Vuốt ve ${cat.name}"`}>
        ${sleeping ? '<div class="cat-sleeping">😴</div>' : renderCatSVG(cat)}
        ${isMouseHunting ? `<img src="${MOUSE_HUNT_IMAGES[0]}" class="mouse-hunt-card-image" alt="Chuột">` : ''}
        ${isInMaze ? '<span class="maze-card-badge" aria-label="Đang ở mê cung">🌀</span>' : ''}
        <span class="portrait-hint">${isExploring ? 'Đang đi thám hiểm' : isMouseHunting ? '🐭 Đang đi bắt chuột' : isInMaze ? (cat.mazeTrip.status === 'ready' ? 'Đã tìm thấy lối ra' : 'Đang khám phá mê cung') : 'Chạm để vuốt ve'}</span>
      </div>
      <div class="cat-identity">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-meta">
          <span class="${genderClass}">${genderIcon}</span> · ${allele.name}
        </div>
        <div class="cat-trait trait-${cat.trait?.type || 'neutral'}">
          ${cat.trait?.emoji || '🐱'} ${cat.trait?.name || 'Bình thường'}
        </div>
        ${equippedItems.length ? `<div class="cat-equipment" aria-label="Trang bị vĩnh viễn">${equippedItems.map(item => `<span class="cat-equipment-item" title="${item.name}: ${item.description}"><img src="${item.image}" alt=""><span>${item.name}</span></span>`).join('')}</div>` : ''}
        <div class="cat-stage">${isExploring ? '🧭 Đang thám hiểm' : isMouseHunting ? (cat.mouseHunt.status === 'ready' ? '🐭 Kết quả bắt chuột sẵn sàng' : '🐭 Đang đi bắt chuột') : isInMaze ? (cat.mazeTrip.status === 'ready' ? '🌀 Chờ nhận quà mê cung' : '🌀 Đang khám phá mê cung') : isInFarm ? '🌿 Đang vui chơi ở trang trại' : LEVEL_TITLES[cat.level - 1]}</div>
      </div>
    </div>

    <div class="level-bar-wrap">
      <div class="level-row">
        <span class="level-title">Kinh nghiệm</span>
        <span class="exp-text">${expText}</span>
      </div>
      <div class="exp-bar"><div class="exp-fill" style="width:${expPercent}%"></div></div>
    </div>

    <div class="cat-stats">
      ${renderStatBar('🍖 Đói', 'hunger', cat.hunger)}
      ${renderStatBar('💧 Khát', 'thirst', cat.thirst)}
      ${renderStatBar('🛁 Bẩn', 'clean',  cat.cleanliness)}
      ${renderStatBar('💖 Vui', 'happy',  cat.happiness)}
    </div>

    <div class="cat-action-panel">
      <div class="cat-actions cat-care-actions">
        <button data-action="feed" data-id="${cat.id}" ${isAway || state.money < COSTS.feed || cat.hunger >= 100 ? 'disabled' : ''} title="Cho ăn (10 xu)" aria-label="Cho ${cat.name} ăn">🍖</button>
        <button data-action="drink" data-id="${cat.id}" ${isAway || state.money < COSTS.drink || cat.thirst >= 100 ? 'disabled' : ''} title="Cho uống (5 xu)" aria-label="Cho ${cat.name} uống">💧</button>
        <button data-action="bath" data-id="${cat.id}" ${isAway || state.money < COSTS.bath || cat.cleanliness >= 100 ? 'disabled' : ''} title="Tắm (15 xu)" aria-label="Tắm cho ${cat.name}">🛁</button>
      </div>
      <div class="cat-actions cat-market-actions">
        <button class="btn-breed" data-action="breed" data-id="${cat.id}" ${!canBreedNow ? 'disabled' : ''}>💕 Ghép đôi</button>
        <button class="btn-sell" data-action="sell" data-id="${cat.id}" ${isAway ? 'disabled' : ''}>💰 Bán · ${sellPrice} xu</button>
      </div>
      <div class="cat-actions cat-extra-actions">
        ${!isExploring && !isInFarm && !isMouseHunting && !isInMaze ? `<button class="btn-secondary" data-action="expedition" data-id="${cat.id}">🧭 Đi thám hiểm</button>` : ''}
        ${isMouseHunting || !isExploring && !isInFarm && !isInMaze ? `<button class="btn-secondary" data-action="mouse-hunt" data-id="${cat.id}">${isMouseHunting ? '🐭 Xem chuyến bắt chuột' : '🐭 Đi bắt chuột · 30 phút'}</button>` : ''}
        ${isInMaze || !isExploring && !isInFarm && !isMouseHunting ? `<button class="btn-secondary" data-action="maze" data-id="${cat.id}">${isInMaze ? '🌀 Xem hành trình mê cung' : '🌀 Vào mê cung · 1 giờ'}</button>` : ''}
        ${canAuction ? `<button class="btn-secondary" data-action="auction" data-id="${cat.id}">⚖️ Đưa lên đấu giá</button>` : ''}
        <button class="btn-secondary" data-action="diary" data-id="${cat.id}">📔 Kỷ niệm · ${cat.badges?.length || 0} huy hiệu</button>
      </div>
    </div>
  `;

  container.appendChild(card);
}

function renderStatBar(label, cls, value) {
  return `
    <div class="stat">
      <span class="stat-label">${label}</span>
      <div class="stat-bar"><div class="stat-fill ${cls}" style="width:${value}%"></div></div>
    </div>
  `;
}

// ============ COLLECTION ============
function openCollection() {
  const body = document.getElementById('collection-body');
  const counts = state.collection || {};
  const rarities = ['common', 'rare', 'epic', 'legendary', 'mythic', 'secret'];

  body.innerHTML = `
    <p style="margin-bottom:16px;color:#888;">Số mèo theo dòng bạn đã từng sở hữu:</p>
    <div class="collection-grid">
      ${rarities.map(r => `
        <div class="collection-item rarity-${r} ${counts[r] ? '' : 'locked'}">
          <div class="lineage-lineage lineage-${r}">
            <span class="lineage-text">${RARITY_LABEL[r]}</span>
          </div>
          <div class="rcount">${counts[r] || 0}</div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('collection-modal').classList.remove('hidden');
}

// ============ LEVEL UP ============
function showLevelUpModal(cat) {
  const body = document.getElementById('levelup-body');
  
  // Thêm hiệu ứng đặc biệt cho thẻ lên cấp
  let tierClass = '';
  if (cat.level >= 4 && cat.level <= 6) tierClass = 'level-tier-1';
  else if (cat.level >= 7 && cat.level < 10) tierClass = 'level-tier-2';

  body.innerHTML = `
    <div class="levelup-cat rarity-${cat.rarity} ${tierClass} ${cat.level >= MAX_LEVEL ? 'max-level' : ''}" style="width: 100%; box-sizing: border-box;">
      ${renderCatSVG(cat)}
      <div class="levelup-title">${cat.name}</div>
      <div class="lineage-lineage lineage-${cat.rarity}">
        <span class="lineage-text">${RARITY_LABEL[cat.rarity]}</span>
      </div>
      <div class="levelup-big">Lv ${cat.level}</div>
      <div style="font-weight:bold;color:#d64b8e;">${LEVEL_TITLES[cat.level - 1]}</div>
    </div>
  `;
  document.getElementById('levelup-modal').classList.remove('hidden');
  
  // Hiệu ứng pháo hoa theo cấp
  const emoji = cat.level >= MAX_LEVEL ? '👑' : (tierClass === 'level-tier-2' ? '🔮' : '✨');
  showHearts(window.innerWidth / 2, window.innerHeight / 2, emoji, 15);
}

// ============ EFFECTS ============
function showHearts(x, y, emoji = '💕', count = 6) {
  const layer = document.getElementById('hearts-layer');
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'floating-heart';
    h.textContent = emoji;
    h.style.left = (x + (Math.random() - 0.5) * 150) + 'px';
    h.style.top = y + 'px';
    h.style.animationDelay = (i * 0.05) + 's';
    layer.appendChild(h);
    setTimeout(() => h.remove(), 2000);
  }
}

function showExpPopup(x, y, amount) {
  const layer = document.getElementById('hearts-layer');
  const p = document.createElement('div');
  p.className = 'exp-popup';
  p.textContent = '+' + Number(amount.toFixed(1)) + ' EXP';
  p.style.left = x + 'px';
  p.style.top = y + 'px';
  layer.appendChild(p);
  setTimeout(() => p.remove(), 1200);
}

// ============ CUSTOM CONFIRM POPUP ============
function showCustomConfirm(title, message, isDanger = false, requireText = null) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    const inputWrap = document.getElementById('confirm-input-wrap');
    const input = document.getElementById('confirm-input');

    document.getElementById('confirm-title').innerHTML = title;
    document.getElementById('confirm-message').innerHTML = message;
    
    // Reset trạng thái
    input.value = '';
    if (requireText) {
      inputWrap.classList.remove('hidden');
      input.placeholder = `Gõ "${requireText}" để xác nhận`;
      btnOk.disabled = true;
      btnOk.style.opacity = '0.5';
      
      input.oninput = (e) => {
        if (e.target.value === requireText) {
          btnOk.disabled = false;
          btnOk.style.opacity = '1';
        } else {
          btnOk.disabled = true;
          btnOk.style.opacity = '0.5';
        }
      };
    } else {
      inputWrap.classList.add('hidden');
      btnOk.disabled = false;
      btnOk.style.opacity = '1';
    }

    // Đổi màu nút OK nếu là hành động nguy hiểm (Xóa)
    if (isDanger) {
      btnOk.style.background = '#ff4444';
      btnOk.textContent = 'Xóa vĩnh viễn';
    } else {
      btnOk.style.background = '';
      btnOk.textContent = 'Đồng ý';
    }

    modal.classList.remove('hidden');
    if (requireText) setTimeout(() => input.focus(), 100);

    // Xử lý sự kiện
    const cleanup = () => {
      modal.classList.add('hidden');
      btnOk.onclick = null;
      btnCancel.onclick = null;
    };

    btnOk.onclick = () => { cleanup(); resolve(true); };
    btnCancel.onclick = () => { cleanup(); resolve(false); };
  });
}