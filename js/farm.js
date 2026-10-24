const FARM_BONUS_RATE = 0.25;

function openFarm() {
  renderFarm();
  document.getElementById('farm-modal').classList.remove('hidden');
}

function closeFarm() {
  document.getElementById('farm-modal').classList.add('hidden');
}

function renderFarm() {
  const catList = document.getElementById('farm-cat-list');
  const playground = document.getElementById('farm-playground');
  if (!catList || !playground) return;

  const availableCats = (state.cats || []).filter(cat => !cat.expedition && !cat.mouseHunt && !cat.mazeTrip);
  catList.replaceChildren();

  if (availableCats.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'farm-empty';
    empty.textContent = 'Tất cả mèo đang đi thám hiểm. Chờ các bé về rồi rủ ra chơi nhé!';
    catList.appendChild(empty);
  } else {
    availableCats.forEach(cat => {
      const label = document.createElement('label');
      label.className = 'farm-cat-choice';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = cat.id;
      checkbox.checked = cat.inFarm === true;

      const name = document.createElement('span');
      name.textContent = `${cat.name} · Lv${cat.level}${cat.inFarm ? ' · đang ở trại' : ''}`;

      label.append(checkbox, name);
      catList.appendChild(label);
    });
  }

  renderFarmCats();

  const activeCats = availableCats.filter(cat => cat.inFarm);
  const playButton = document.getElementById('btn-farm-play');
  playButton.textContent = activeCats.length ? '💾 Cập nhật trang trại' : '🌿 Thả mèo vào trại';
  playButton.disabled = availableCats.length === 0;
  updateFarmStatus(activeCats);
}

function renderFarmCats() {
  const playground = document.getElementById('farm-playground');
  if (!playground) return;
  playground.replaceChildren();

  const cats = (state.cats || []).filter(cat => cat.inFarm && !cat.expedition && !cat.mazeTrip);
  cats.forEach((cat, index) => {
    const playmate = document.createElement('div');
    playmate.className = `farm-cat-playmate farm-cat-playmate-${index % 4}`;
    playmate.setAttribute('aria-label', `${cat.name} đang vui chơi`);

    const bubble = document.createElement('span');
    bubble.className = 'farm-chat-bubble';
    bubble.textContent = ['😻', '🐾', '✨', '💕'][index % 4];
    bubble.setAttribute('aria-hidden', 'true');

    const sprite = document.createElement('div');
    sprite.className = 'farm-cat-sprite';
    sprite.innerHTML = renderCatSVG(cat);

    const name = document.createElement('span');
    name.className = 'farm-cat-name';
    name.textContent = cat.name;

    playmate.append(bubble, sprite, name);
    playground.appendChild(playmate);
  });

  if (cats.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'farm-scene-hint';
    hint.textContent = 'Chọn mèo bên dưới để thả ra đồng cỏ!';
    playground.appendChild(hint);
  }
}

function updateFarmStatus(activeCats = (state.cats || []).filter(cat => cat.inFarm && !cat.expedition && !cat.mazeTrip)) {
  const status = document.getElementById('farm-status');
  if (!status) return;
  status.textContent = activeCats.length
    ? `${activeCats.length} bé đang ở trại · Nhận thêm 25% EXP tự động, kể cả khi offline. Cho mèo về nhà bằng cách bỏ chọn rồi cập nhật.`
    : '';
}

function toggleFarmPlay() {
  updateAllCats();
  const selectedIds = new Set(
    [...document.querySelectorAll('#farm-cat-list input:checked')].map(input => input.value)
  );
  const availableCats = (state.cats || []).filter(cat => !cat.expedition && !cat.mouseHunt && !cat.mazeTrip);
  if (selectedIds.size === 0 && availableCats.every(cat => !cat.inFarm)) {
    document.getElementById('farm-status').textContent = 'Chọn ít nhất một bé mèo để thả vào trại.';
    return;
  }

  availableCats.forEach(cat => {
    const enteringFarm = !cat.inFarm && selectedIds.has(cat.id);
    const leavingFarm = cat.inFarm && !selectedIds.has(cat.id);
    cat.inFarm = selectedIds.has(cat.id);
    if (enteringFarm) {
      const hasVisitedFarm = cat.diary?.some(event => event.type === 'farm_join');
      recordCatDiary(cat, {
        id: `farm-join-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'farm_join',
        title: hasVisitedFarm ? 'Trở lại đồng cỏ' : 'Lần đầu ra đồng cỏ',
        detail: `${cat.name} bắt đầu vui chơi ở trang trại.`
      });
    } else if (leavingFarm) {
      recordCatDiary(cat, {
        id: `farm-leave-${Date.now()}`,
        type: 'farm_leave',
        title: 'Tạm biệt đồng cỏ',
        detail: `${cat.name} đã có ${Math.floor(cat.farmTimeMs / 3600000)} giờ vui chơi ở trang trại.`
      });
    }
  });
  saveGame();
  renderFarm();
  render();
}
