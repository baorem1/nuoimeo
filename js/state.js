let state = {
  money: 500,
  cats: [],
  auctions: [],
  inventory: { relics: {} },
  collection: {},
  lastTick: Date.now(),
  daily: { streak: 0, lastClaim: null } // <-- THÊM DÒNG NÀY
};

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
  if (!c.trait) c.trait = { name: 'Bình thường', type: 'neutral', mult: 1, emoji: '😐' };
  return c;
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