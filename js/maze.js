function generateCatMaze() {
  const size = CAT_MAZE_SIZE;
  const grid = Array(size * size).fill('#');
  const start = size + 1;
  const end = (size - 2) * size + size - 2;
  const stack = [start];
  const visited = new Set([start]);
  grid[start] = '.';

  while (stack.length) {
    const current = stack[stack.length - 1];
    const row = Math.floor(current / size);
    const column = current % size;
    const candidates = [
      [row - 2, column],
      [row + 2, column],
      [row, column - 2],
      [row, column + 2]
    ].filter(([nextRow, nextColumn]) =>
      nextRow > 0 && nextRow < size - 1 &&
      nextColumn > 0 && nextColumn < size - 1 &&
      !visited.has(nextRow * size + nextColumn)
    );

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const [nextRow, nextColumn] = candidates[Math.floor(Math.random() * candidates.length)];
    const next = nextRow * size + nextColumn;
    const between = ((row + nextRow) / 2) * size + (column + nextColumn) / 2;
    grid[between] = '.';
    grid[next] = '.';
    visited.add(next);
    stack.push(next);
  }

  const previous = Array(size * size).fill(-1);
  const queue = [start];
  previous[start] = start;
  for (let index = 0; index < queue.length && previous[end] === -1; index++) {
    const current = queue[index];
    const neighbors = [current - size, current + size, current - 1, current + 1];
    neighbors.forEach(next => {
      if (grid[next] === '.' && previous[next] === -1) {
        previous[next] = current;
        queue.push(next);
      }
    });
  }

  const path = [];
  for (let position = end; position !== start; position = previous[position]) {
    path.push(position);
  }
  path.push(start);
  path.reverse();

  return { map: Array.from({ length: size }, (_, row) => grid.slice(row * size, (row + 1) * size).join('')), path };
}

function generateMazePickups(pathLength) {
  const pickups = [];
  const count = 8;
  for (let index = 1; index <= count; index++) {
    const step = Math.min(pathLength - 2, Math.round(pathLength * index / (count + 1)));
    const roll = Math.random();
    const type = roll < 0.1 ? 'chest' : roll < 0.48 ? 'food' : 'coins';
    pickups.push({
      step,
      type,
      amount: type === 'coins' ? Math.floor(Math.random() * 31) + 15 : 1
    });
  }
  return pickups;
}

function getMazeProgress(trip, now = Date.now()) {
  if (now >= trip.endsAt) return trip.path.length - 1;
  const elapsed = Math.max(0, now - trip.startedAt);
  return Math.min(trip.path.length - 1, Math.floor(elapsed / CAT_MAZE_DURATION * (trip.path.length - 1)));
}

function openMazeModal(selectedCatId = null) {
  processMazeTrips();
  renderMazeTrips(selectedCatId);
  document.getElementById('maze-modal').classList.remove('hidden');
}

function renderMazeTrips(selectedCatId = null) {
  const list = document.getElementById('maze-list');
  if (!list) return;

  if (!(state.cats || []).length) {
    list.innerHTML = '<p class="maze-status">Bạn chưa có mèo để khám phá mê cung.</p>';
    return;
  }

  list.innerHTML = state.cats.map(cat => {
    let content;
    if (cat.mazeTrip) {
      const trip = cat.mazeTrip;
      const progress = getMazeProgress(trip);
      const found = trip.pickups.filter(pickup => pickup.step <= progress);
      const baseCoinsFound = found.filter(pickup => pickup.type === 'coins').reduce((sum, pickup) => sum + pickup.amount, 0);
      const coinsFound = scaleCoinsByRarity(baseCoinsFound, cat.rarity);
      const foodFound = found.filter(pickup => pickup.type === 'food').length;
      const chestsFound = found.filter(pickup => pickup.type === 'chest').length;
      const remaining = Math.max(0, trip.endsAt - Date.now());
      const map = renderMazeMap(cat, trip, progress);
      const loot = `Đã nhặt: 💰 ${coinsFound} xu · 🍖 ${foodFound} thức ăn · 🎁 ${chestsFound} rương`;
      const status = trip.status === 'ready'
        ? `<p class="maze-status">🎉 ${cat.name} đã tìm được lối ra! Thưởng về đích <b>${trip.exitReward} xu</b>.</p>
           <button class="btn-primary maze-claim" data-maze-claim="${cat.id}">Nhận quà mê cung</button>`
        : `<p class="maze-status">🐾 Bé đang tìm đường · còn ${formatExpeditionTime(remaining)} · tiến độ ${Math.floor(progress / (trip.path.length - 1) * 100)}%</p>`;
      content = `${status}${map}<div class="maze-legend"><span>🐱 Mèo</span><span>🚪 Lối vào</span><span>🏁 Lối ra</span><span>🍖 Thức ăn</span><span>💰 Xu</span><span>🎁 Rương</span></div><p class="maze-loot">${loot}</p>`;
    } else if (cat.expedition || cat.mouseHunt || cat.inFarm) {
      const reason = cat.expedition ? 'đang thám hiểm' : cat.mouseHunt ? 'đang bắt chuột' : 'đang ở trang trại';
      content = `<p class="maze-status">Bé ${reason}. Chờ bé về nhà rồi mới vào mê cung nhé.</p>`;
    } else {
      const minimumReward = scaleCoinsByRarity(CAT_MAZE_EXIT_REWARD_MIN, cat.rarity).toLocaleString('vi-VN');
      const maximumReward = scaleCoinsByRarity(CAT_MAZE_EXIT_REWARD_MAX, cat.rarity).toLocaleString('vi-VN');
      content = `<p class="maze-status">Mê cung 21 × 21 · 1 giờ · thưởng về đích ${minimumReward}–${maximumReward} xu, cộng thêm xu nhặt được.</p>
        <button class="btn-secondary maze-start" data-maze-start="${cat.id}">🌀 Thả ${cat.name} vào mê cung · 1 giờ</button>`;
    }

    const selected = selectedCatId === cat.id ? ' maze-selected' : '';
    return `<section class="maze-cat-item${selected}">
      <div class="maze-cat-name">${cat.name} · Lv${cat.level} · ${RARITY_LABEL[cat.rarity]}</div>
      ${content}
    </section>`;
  }).join('');

  list.querySelectorAll('[data-maze-start]').forEach(button => {
    button.addEventListener('click', () => startMazeTrip(button.dataset.mazeStart));
  });
  list.querySelectorAll('[data-maze-claim]').forEach(button => {
    button.addEventListener('click', () => claimMazeTrip(button.dataset.mazeClaim));
  });
}

function renderMazeMap(cat, trip, progress) {
  const pathSteps = new Map(trip.path.map((position, step) => [position, step]));
  const visiblePickups = new Map(
    trip.pickups.filter(pickup => pickup.step <= progress)
      .map(pickup => [trip.path[pickup.step], pickup.type === 'food' ? '🍖' : pickup.type === 'coins' ? '💰' : '🎁'])
  );
  const catPosition = trip.path[progress];
  const cells = [];

  trip.map.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      const position = rowIndex * CAT_MAZE_SIZE + columnIndex;
      const pathStep = pathSteps.get(position);
      const isStart = position === trip.path[0];
      const isExit = position === trip.path[trip.path.length - 1];
      const isCat = position === catPosition;
      const icon = isCat ? '🐱' : isStart ? '🚪' : isExit ? '🏁' : visiblePickups.get(position) || '';
      const classes = ['maze-cell', cell === '#' ? 'maze-wall' : 'maze-open'];
      if (pathStep !== undefined && pathStep <= progress) classes.push('maze-visited');
      if (isCat) classes.push('maze-cat');
      if (isStart) classes.push('maze-start');
      if (isExit) classes.push('maze-exit');
      if (visiblePickups.has(position)) classes.push('maze-pickup');
      cells.push(`<span class="${classes.join(' ')}" role="gridcell" aria-label="${icon || (cell === '#' ? 'Tường' : 'Lối đi')}">${icon}</span>`);
    });
  });

  return `<div class="maze-map-viewport" aria-label="Bản đồ mê cung của ${cat.name}">
    <div class="maze-map" role="grid">${cells.join('')}</div>
  </div>`;
}

function startMazeTrip(catId) {
  const cat = state.cats.find(item => item.id === catId);
  if (!cat || cat.expedition || cat.mouseHunt || cat.mazeTrip || cat.inFarm) return;

  updateAllCats();
  const now = Date.now();
  const { map, path } = generateCatMaze();
  cat.mazeTrip = {
    startedAt: now,
    endsAt: now + CAT_MAZE_DURATION,
    status: 'away',
    map,
    path,
    pickups: generateMazePickups(path.length),
    exitReward: scaleCoinsByRarity(
      Math.floor(Math.random() * (CAT_MAZE_EXIT_REWARD_MAX - CAT_MAZE_EXIT_REWARD_MIN + 1)) + CAT_MAZE_EXIT_REWARD_MIN,
      cat.rarity
    )
  };
  saveGame();
  render();
  renderMazeTrips(cat.id);
}

function processMazeTrips() {
  let changed = false;
  (state.cats || []).forEach(cat => {
    if (cat.mazeTrip?.status === 'away' && Date.now() >= cat.mazeTrip.endsAt) {
      cat.mazeTrip.status = 'ready';
      changed = true;
    }
  });

  const modal = document.getElementById('maze-modal');
  if (modal && !modal.classList.contains('hidden')) renderMazeTrips();
  return changed;
}

function claimMazeTrip(catId) {
  const cat = state.cats.find(item => item.id === catId);
  if (!cat || cat.mazeTrip?.status !== 'ready') return;

  const trip = cat.mazeTrip;
  const baseCoinsFound = trip.pickups
    .filter(pickup => pickup.type === 'coins')
    .reduce((sum, pickup) => sum + pickup.amount, 0);
  const coinsFound = scaleCoinsByRarity(baseCoinsFound, cat.rarity);
  const foodFound = trip.pickups.filter(pickup => pickup.type === 'food').length;
  const chestsFound = trip.pickups.filter(pickup => pickup.type === 'chest').length;
  const reward = trip.exitReward + coinsFound;
  addAchievementProgress('mazesCompleted');
  if (chestsFound) addAchievementProgress('mazeChestsFound', chestsFound);
  recordCatDiary(cat, {
    id: `maze-${trip.startedAt}`,
    type: 'maze',
    title: 'Tìm được lối ra mê cung',
    detail: `Mang về ${trip.exitReward} xu tiền thưởng, nhặt thêm ${coinsFound} xu, ${foodFound} món ăn và ${chestsFound} rương.`,
    badge: cat.badges?.includes('first-maze') ? null : 'first-maze'
  });

  cat.mazeTrip = null;
  state.money += reward;
  if (!state.inventory) state.inventory = {};
  state.inventory.food = (Number(state.inventory.food) || 0) + foodFound;
  state.inventory.chest = (Number(state.inventory.chest) || 0) + chestsFound;
  saveGame();
  render();
  renderMazeTrips();
  if (foodFound || chestsFound) renderInventory();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, chestsFound ? '🎁' : '🌀', chestsFound ? 12 : 8);
}
