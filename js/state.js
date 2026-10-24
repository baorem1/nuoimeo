let state = {
  money: 500,
  cats: [],
  auctions: [],
  strayCatHunt: null,
  inventory: { relics: {} },
  collection: {},
  lastTick: Date.now(),
  daily: { streak: 0, lastClaim: null } // <-- THÊM DÒNG NÀY
};

const CAT_MAZE_SIZE = 21;
const CAT_MAZE_DURATION = 60 * 60 * 1000;
const CAT_MAZE_EXIT_REWARD_MIN = 300;
const CAT_MAZE_EXIT_REWARD_MAX = 500;

function saveGame() {
  state.lastTick = Date.now();
  localStorage.setItem('nha-meo-save', JSON.stringify(state));
}

function loadGame() {
  const raw = localStorage.getItem('nha-meo-save');
  if (!raw) return;

  try {
    const loaded = JSON.parse(raw);
    loaded.cats = (loaded.cats || []).map(c => migrateCat(c));
    loaded.auctions = loaded.auctions || [];
    loaded.strayCatHunt = validateStrayCatHunt(loaded.strayCatHunt);
    loaded.inventory = loaded.inventory || {};
    loaded.inventory.relics = loaded.inventory.relics || {};
    loaded.collection = loaded.collection || {};
    loaded.cats.forEach(cat => {
      if (!Array.isArray(cat.equipment)) cat.equipment = [];
    });
    state = loaded;
  } catch (e) {
    console.error('Save hỏng, tạo mới', e);
  }
}

function validateStrayCatHunt(hunt) {
  if (!hunt || typeof hunt !== 'object' ||
      !Number.isFinite(hunt.startedAt) || hunt.startedAt < 0 ||
      !Number.isFinite(hunt.endsAt) || hunt.endsAt - hunt.startedAt !== STRAY_CAT_HUNT.duration ||
      !Number.isFinite(hunt.nextAvailableAt) || hunt.nextAvailableAt - hunt.startedAt !== STRAY_CAT_HUNT.cooldown ||
      !['away', 'ready', 'cooldown'].includes(hunt.status)) {
    return null;
  }

  if (hunt.status === 'away' && hunt.result !== null) return null;
  if (hunt.status === 'ready' && !['caught', 'miss'].includes(hunt.result)) return null;
  if (hunt.status === 'cooldown' && hunt.result !== null) return null;

  let resultCat = null;
  if (hunt.status === 'ready' && hunt.result === 'caught') {
    if (!hunt.resultCat || typeof hunt.resultCat !== 'object') return null;
    resultCat = migrateCat(hunt.resultCat);
    if (RARITY_ORDER[resultCat.rarity] === undefined) return null;
  }
  if (hunt.status !== 'ready' && hunt.resultCat !== null) return null;

  return {
    startedAt: hunt.startedAt,
    endsAt: hunt.endsAt,
    nextAvailableAt: hunt.nextAvailableAt,
    status: hunt.status,
    result: hunt.result,
    resultCat
  };
}

function migrateCat(c) {
  if (!c.genes) {
    const colorMap = { cam:'cam', trang:'trang', den:'den', xam:'xam', nau:'nau', hong:'hong', vang:'vang' };
    const gene = colorMap[c.color] || 'cam';
    c.genes = [gene, gene];
    c.rarity = ALLELES[gene].rarity;
  }
  if (c.level === undefined) c.level = 1;
  if (c.exp === undefined) c.exp = 0;
  if (c.totalExp === undefined) c.totalExp = 0;
  if (c.happiness === undefined) c.happiness = 80;
  if (c.lastBreedTime === undefined) c.lastBreedTime = 0;
  if (c.lastUpdate === undefined) c.lastUpdate = Date.now();
  if (!Array.isArray(c.equipment)) c.equipment = [];
  if (c.mouseHunt && typeof c.mouseHunt === 'object') {
    const hunt = c.mouseHunt;
    if (Number.isFinite(hunt.startedAt) && hunt.startedAt >= 0 &&
        Number.isFinite(hunt.endsAt) && hunt.endsAt - hunt.startedAt === MOUSE_HUNT_DURATION &&
        ['away', 'ready'].includes(hunt.status) &&
        (hunt.status === 'away' || Number.isInteger(hunt.miceCaught) &&
          (hunt.miceCaught === 0 || hunt.miceCaught >= 10 && hunt.miceCaught <= 20))) {
      c.mouseHunt = {
        startedAt: hunt.startedAt,
        endsAt: hunt.endsAt,
        status: hunt.status,
        miceCaught: hunt.status === 'ready' ? hunt.miceCaught : null
      };
    } else {
      c.mouseHunt = null;
    }
  } else {
    c.mouseHunt = null;
  }
  c.mazeTrip = validateMazeTrip(c.mazeTrip);
  if (c.expedition) {
    c.mouseHunt = null;
    c.mazeTrip = null;
  } else if (c.mouseHunt) {
    c.mazeTrip = null;
  } else if (c.mazeTrip) {
    c.expedition = null;
    c.mouseHunt = null;
  }
  c.inFarm = c.inFarm === true && !c.expedition && !c.mouseHunt && !c.mazeTrip;
  if (!c.trait) c.trait = { name: 'Bình thường', type: 'neutral', mult: 1, emoji: '😐' };
  initializeCatDiary(c);
  return c;
}

function validateMazeTrip(trip) {
  if (!trip || typeof trip !== 'object' ||
      !Number.isFinite(trip.startedAt) || !Number.isFinite(trip.endsAt) ||
      trip.endsAt - trip.startedAt !== CAT_MAZE_DURATION ||
      !['away', 'ready'].includes(trip.status) ||
      !Array.isArray(trip.map) || trip.map.length !== CAT_MAZE_SIZE ||
      trip.map.some(row => typeof row !== 'string' || row.length !== CAT_MAZE_SIZE || /[^.#]/.test(row)) ||
      !Array.isArray(trip.path) || trip.path.length < 2 ||
      !Array.isArray(trip.pickups) || trip.pickups.length > 20 ||
      !Number.isInteger(trip.exitReward) || trip.exitReward < CAT_MAZE_EXIT_REWARD_MIN || trip.exitReward > CAT_MAZE_EXIT_REWARD_MAX * ACTIVITY_RARITY_MULT.secret) {
    return null;
  }

  const isOpen = position =>
    Number.isInteger(position) && position >= 0 && position < CAT_MAZE_SIZE * CAT_MAZE_SIZE &&
    trip.map[Math.floor(position / CAT_MAZE_SIZE)][position % CAT_MAZE_SIZE] === '.';
  const start = CAT_MAZE_SIZE + 1;
  const end = (CAT_MAZE_SIZE - 2) * CAT_MAZE_SIZE + CAT_MAZE_SIZE - 2;
  const seenPath = new Set();
  if (trip.path[0] !== start || trip.path[trip.path.length - 1] !== end) return null;
  for (let index = 0; index < trip.path.length; index++) {
    const position = trip.path[index];
    if (!isOpen(position) || seenPath.has(position)) return null;
    seenPath.add(position);
    if (index > 0) {
      const previous = trip.path[index - 1];
      const distance =
        Math.abs(Math.floor(position / CAT_MAZE_SIZE) - Math.floor(previous / CAT_MAZE_SIZE)) +
        Math.abs(position % CAT_MAZE_SIZE - previous % CAT_MAZE_SIZE);
      if (distance !== 1) return null;
    }
  }
  if (trip.pickups.some(pickup =>
        !pickup || !Number.isInteger(pickup.step) || pickup.step < 1 || pickup.step >= trip.path.length - 1 ||
        !['food', 'coins', 'chest'].includes(pickup.type) ||
        !Number.isInteger(pickup.amount) || pickup.amount < 1 ||
        (pickup.type === 'food' || pickup.type === 'chest') && pickup.amount !== 1 ||
        pickup.type === 'coins' && (pickup.amount < 15 || pickup.amount > 45)
      )) return null;

  return {
    startedAt: trip.startedAt,
    endsAt: trip.endsAt,
    status: trip.status,
    map: trip.map,
    path: trip.path,
    pickups: trip.pickups,
    exitReward: trip.exitReward
  };
}

// HÀM XÓA GAME ĐÃ ĐƯỢC FIX LỖI
async function resetGame() {
  const check1 = await showCustomConfirm('⚠️ Xóa dữ liệu?', 'Bạn có chắc muốn xóa toàn bộ?', true);
  if (!check1) return;
  const check2 = await showCustomConfirm('🛡️ Bảo mật', 'Gõ <b>XOA HET</b> để xác nhận:', true, 'XOA HET');
  if (!check2) return;
  localStorage.removeItem('nha-meo-save');
  window.location.href = 'index.html';
}