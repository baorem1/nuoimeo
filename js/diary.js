const CAT_DIARY_BADGES = {
  'new-home': { icon: '🏡', name: 'Nhà mới' },
  'first-step': { icon: '🐾', name: 'Bước đầu tiên' },
  'level-five': { icon: '⭐', name: 'Mèo trưởng thành' },
  'max-level': { icon: '👑', name: 'Đỉnh cao' },
  'first-expedition': { icon: '🧭', name: 'Nhà thám hiểm' },
  'first-maze': { icon: '🌀', name: 'Thoát mê cung' },
  'farm-day': { icon: '🌿', name: 'Bạn đồng cỏ' }
};

const CAT_DIARY_EVENT_TYPES = [
  'adopt', 'level_up', 'expedition', 'mouse_hunt', 'maze', 'farm_join', 'farm_leave', 'farm_milestone'
];
const CAT_DIARY_MAX_EVENTS = 100;
const FARM_DIARY_MILESTONE_MS = 24 * 60 * 60 * 1000;

function initializeCatDiary(cat) {
  const fallbackDate = Number.isFinite(cat.lastUpdate) ? cat.lastUpdate : Date.now();
  cat.createdAt = Number.isFinite(cat.createdAt) ? cat.createdAt : fallbackDate;
  cat.adoptedAt = Number.isFinite(cat.adoptedAt) ? cat.adoptedAt : cat.createdAt;
  cat.farmTimeMs = Number.isFinite(cat.farmTimeMs) && cat.farmTimeMs >= 0 ? cat.farmTimeMs : 0;
  cat.diary = Array.isArray(cat.diary)
    ? cat.diary.filter(event =>
      event && typeof event.id === 'string' &&
      CAT_DIARY_EVENT_TYPES.includes(event.type) &&
      typeof event.title === 'string' && typeof event.detail === 'string' &&
      Number.isFinite(event.at)
    ).slice(-CAT_DIARY_MAX_EVENTS)
    : [];
  cat.badges = Array.isArray(cat.badges)
    ? [...new Set(cat.badges.filter(id => Object.prototype.hasOwnProperty.call(CAT_DIARY_BADGES, id)))]
    : [];

  if (!cat.diary.some(event => event.type === 'adopt')) {
    recordCatDiary(cat, {
      id: 'adopted',
      type: 'adopt',
      title: 'Ngày về nhà',
      detail: 'Bắt đầu hành trình mới cùng gia đình.',
      at: cat.adoptedAt,
      badge: 'new-home'
    });
  }

  const milestones = [
    { level: 2, badge: 'first-step', title: 'Lần đầu lên cấp' },
    { level: 5, badge: 'level-five', title: 'Đạt cấp 5' },
    { level: MAX_LEVEL, badge: 'max-level', title: `Đạt cấp ${MAX_LEVEL}` }
  ];
  milestones.forEach(milestone => {
    if (cat.level >= milestone.level) {
      unlockCatDiaryBadge(cat, milestone.badge);
      if (!cat.diary.some(event => event.id === `level-${milestone.level}`)) {
        recordCatDiary(cat, {
          id: `level-${milestone.level}`,
          type: 'level_up',
          title: milestone.title,
          detail: `${cat.name} đã đạt cấp ${milestone.level}.`,
          at: cat.createdAt
        });
      }
    }
  });

  if (cat.farmTimeMs >= FARM_DIARY_MILESTONE_MS) {
    if (!cat.diary.some(event => event.id === 'farm-day')) {
      recordCatDiary(cat, {
        id: 'farm-day',
        type: 'farm_milestone',
        title: 'Một ngày vui chơi ở đồng cỏ',
        detail: `${cat.name} đã dành đủ 24 giờ ở trang trại.`,
        at: cat.createdAt,
        badge: 'farm-day'
      });
    } else {
      unlockCatDiaryBadge(cat, 'farm-day');
    }
  }
  return cat;
}

function unlockCatDiaryBadge(cat, badgeId) {
  if (!CAT_DIARY_BADGES[badgeId]) return;
  if (!Array.isArray(cat.badges)) cat.badges = [];
  if (!cat.badges.includes(badgeId)) cat.badges.push(badgeId);
}

function recordCatDiary(cat, { id, type, title, detail, at = Date.now(), badge = null }) {
  if (!Array.isArray(cat.diary)) cat.diary = [];
  if (id && cat.diary.some(event => event.id === id)) return;

  cat.diary.push({ id: id || `event-${Date.now()}`, type, title, detail, at });
  if (cat.diary.length > CAT_DIARY_MAX_EVENTS) {
    cat.diary.splice(0, cat.diary.length - CAT_DIARY_MAX_EVENTS);
  }
  if (badge) unlockCatDiaryBadge(cat, badge);
}

function recordCatLevelMilestone(cat) {
  const badge = cat.level === 2 ? 'first-step'
    : cat.level === 5 ? 'level-five'
      : cat.level >= MAX_LEVEL ? 'max-level' : null;
  recordCatDiary(cat, {
    id: `level-${cat.level}`,
    type: 'level_up',
    title: cat.level === 2 ? 'Lần đầu lên cấp' : `Đạt cấp ${cat.level}`,
    detail: `${cat.name} đã trưởng thành thêm một chút.`,
    badge
  });
}

function recordCatFarmTime(cat, elapsedMs) {
  if (!cat.inFarm || elapsedMs <= 0) return;
  cat.farmTimeMs = (Number(cat.farmTimeMs) || 0) + elapsedMs;

  if (cat.farmTimeMs >= FARM_DIARY_MILESTONE_MS && !cat.badges?.includes('farm-day')) {
    recordCatDiary(cat, {
      id: 'farm-day',
      type: 'farm_milestone',
      title: 'Một ngày vui chơi ở đồng cỏ',
      detail: `${cat.name} đã dành đủ 24 giờ ở trang trại.`,
      badge: 'farm-day'
    });
  }
}

function openCatDiary(catId) {
  const cat = state.cats.find(item => item.id === catId);
  if (!cat) return;
  initializeCatDiary(cat);

  document.getElementById('diary-cat-name').textContent = `📔 Kỷ niệm của ${cat.name}`;
  document.getElementById('diary-cat-summary').textContent =
    `Đồng hành từ ${new Date(cat.adoptedAt).toLocaleDateString('vi-VN')} · ${Math.floor(cat.farmTimeMs / 3600000)} giờ ở trang trại`;

  const badges = document.getElementById('diary-badges');
  badges.replaceChildren();
  if (cat.badges.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diary-empty';
    empty.textContent = 'Chưa mở khóa huy hiệu nào. Tiếp tục tạo thêm kỷ niệm nhé!';
    badges.appendChild(empty);
  } else {
    cat.badges.forEach(id => {
      const badge = CAT_DIARY_BADGES[id];
      const item = document.createElement('span');
      item.className = 'diary-badge';
      item.textContent = `${badge.icon} ${badge.name}`;
      badges.appendChild(item);
    });
  }

  const timeline = document.getElementById('diary-timeline');
  timeline.replaceChildren();
  const events = [...cat.diary].sort((a, b) => b.at - a.at);
  if (events.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diary-empty';
    empty.textContent = 'Nhật ký đang trống.';
    timeline.appendChild(empty);
  } else {
    events.forEach(event => {
      const item = document.createElement('article');
      item.className = 'diary-entry';
      const title = document.createElement('strong');
      title.textContent = event.title;
      const detail = document.createElement('p');
      detail.textContent = event.detail;
      const date = document.createElement('time');
      date.dateTime = new Date(event.at).toISOString();
      date.textContent = new Date(event.at).toLocaleString('vi-VN');
      item.append(title, detail, date);
      timeline.appendChild(item);
    });
  }

  document.getElementById('diary-modal').classList.remove('hidden');
}
