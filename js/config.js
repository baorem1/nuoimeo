// ============ GENE & IMAGES ============
const ALLELES = {
  // Common (Dùng SVG)
  cam:    { name: 'Cam',       color: '#f5a623', eye: '#5a3a1a', rarity: 'common', img: null },
  trang:  { name: 'Trắng',     color: '#f0f0f0', eye: '#4a90e2', rarity: 'common', img: null },
  den:    { name: 'Đen',       color: '#3a3a3a', eye: '#ffd700', rarity: 'common', img: null },
  xam:    { name: 'Xám',       color: '#9a9a9a', eye: '#4a3b52', rarity: 'common', img: null },
  nau:    { name: 'Nâu',       color: '#a0612a', eye: '#5a3a1a', rarity: 'common', img: null },

  // Rare (Dùng SVG)
  hong:   { name: 'Hồng',      color: '#f5a0c0', eye: '#d64b8e', rarity: 'rare', img: null },
  vang:   { name: 'Vàng',      color: '#f3d250', eye: '#8a6a00', rarity: 'rare', img: null },
  mint:   { name: 'Mint',      color: '#7fd9b0', eye: '#2a8a5a', rarity: 'rare', img: null },

  // Epic (Dùng SVG)
  tim:    { name: 'Tím',       color: '#b88aff', eye: '#6a2ac9', rarity: 'epic', img: null },
  xanh:   { name: 'Xanh biển', color: '#6bb0ff', eye: '#1a4a9a', rarity: 'epic', img: null },

  // Legendary (20 con - Dùng ảnh trong thư mục img/legenday)
  kim1:   { name: 'Kim Quang 1', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen1.png' },
  kim2:   { name: 'Kim Quang 2', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen2.png' },
  kim3:   { name: 'Kim Quang 3', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen3.png' },
  kim4:   { name: 'Kim Quang 4', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen4.png' },
  kim5:   { name: 'Kim Quang 5', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen5.png' },
  kim6:   { name: 'Kim Quang 6', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen6.png' },
  kim7:   { name: 'Kim Quang 7', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen7.png' },
  kim8:   { name: 'Kim Quang 8', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen8.png' },
  kim9:   { name: 'Kim Quang 9', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen9.png' },
  kim10:  { name: 'Kim Quang 10', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen10.png' },
  kim11:  { name: 'Kim Quang 11', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen11.png' },
  kim12:  { name: 'Kim Quang 12', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen12.png' },
  kim13:  { name: 'Kim Quang 13', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen13.png' },
  kim14:  { name: 'Kim Quang 14', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen14.png' },
  kim15:  { name: 'Kim Quang 15', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen15.png' },
  kim16:  { name: 'Kim Quang 16', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen16.png' },
  kim17:  { name: 'Kim Quang 17', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen17.png' },
  kim18:  { name: 'Kim Quang 18', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen18.png' },
  kim19:  { name: 'Kim Quang 19', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen19.png' },
  kim20:  { name: 'Kim Quang 20', color: '#ffcc33', eye: '#ff7eb6', rarity: 'legendary', img: 'img/legenday/anhlegen20.png' },

  // Mythic (7 con - Dùng ảnh trong thư mục img/mythic)
  long1:  { name: 'Long Lân 1', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh1.png' },
  long2:  { name: 'Long Lân 2', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh2.png' },
  long3:  { name: 'Long Lân 3', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh3.png' },
  long4:  { name: 'Long Lân 4', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh4.png' },
  long5:  { name: 'Long Lân 5', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh5.png' },
  long6:  { name: 'Long Lân 6', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh6.png' },
  long7:  { name: 'Long Lân 7', color: '#ff4444', eye: '#ffcc00', rarity: 'mythic', img: 'img/mythic/anh7.png' },

  // Secret (5 con - Dùng ảnh trong thư mục img/secret)
  anh1:   { name: 'Ánh Sáng 1', color: '#ffffff', eye: '#ff00ff', rarity: 'secret', img: 'img/secret/secret1.png' },
  anh2:   { name: 'Ánh Sáng 2', color: '#fff5e6', eye: '#ffaa00', rarity: 'secret', img: 'img/secret/secret2.png' },
  anh3:   { name: 'Ánh Sáng 3', color: '#e6f7ff', eye: '#00ccff', rarity: 'secret', img: 'img/secret/secret3.png' },
  anh4:   { name: 'Ánh Sáng 4', color: '#f7e6ff', eye: '#cc00ff', rarity: 'secret', img: 'img/secret/secret4.png' },
  anh5:   { name: 'Ánh Sáng 5', color: '#ffe6e6', eye: '#ff0000', rarity: 'secret', img: 'img/secret/secret5.png' }
};

const COMMON_IDS    = ['cam', 'trang', 'den', 'xam', 'nau'];
const RARE_IDS      = ['hong', 'vang', 'mint'];
const EPIC_IDS      = ['tim', 'xanh'];
const LEGENDARY_IDS = ['kim1','kim2','kim3','kim4','kim5','kim6','kim7','kim8','kim9','kim10','kim11','kim12','kim13','kim14','kim15','kim16','kim17','kim18','kim19','kim20'];
const MYTHIC_IDS    = ['long1','long2','long3','long4','long5','long6','long7'];
const SECRET_IDS    = ['anh1','anh2','anh3','anh4','anh5'];

// GIỚI HẠN SỐ LƯỢNG TỐI ĐA
const RARITY_LIMITS = {
  secret: 5,
  mythic: 7,
  legendary: 20,
  epic: 9999,
  rare: 9999,
  common: 9999
};

const RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4, secret: 5 };
const RARITY_LABEL = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', secret: 'Secret' };
const RARITY_EMOJI = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡', mythic: '🔴', secret: '🌈' };

const NAMES = [
  'Miu', 'Mun', 'Bông', 'Đen', 'Mập', 'Nhỏ', 'Kem', 'Bơ', 'Sữa', 'Cà Rốt',
  'Tí', 'Tèo', 'Mướp', 'Vàng', 'Xám', 'Táo', 'Cam', 'Nho', 'Bún', 'Phở',
  'Bánh', 'Mochi', 'Sushi', 'Pudding', 'Latte', 'Mít', 'Na', 'Dừa', 'Ổi',
  'Đào', 'Mận', 'Chôm Chôm', 'Dâu', 'Cherry', 'Lựu', 'Bắp', 'Khoai', 'Bí',
  'Cốm', 'Đậu', 'Đậu Đỏ', 'Đậu Xanh', 'Kẹo', 'Đường', 'Mật Ong', 'Caramel',
  'Socola', 'Cacao', 'Matcha', 'Cookie', 'Bánh Bao', 'Bánh Mì', 'Bánh Gạo',
  'Bánh Flan', 'Bánh Quy', 'Bánh Xèo', 'Há Cảo', 'Sữa Chua', 'Kem Dâu',
  'Kem Vani', 'Trà Sữa', 'Cà Phê', 'Bắp Rang', 'Phô Mai', 'Mì', 'Miến',
  'Cháo', 'Cơm', 'Xôi', 'Chả Giò', 'Tôm', 'Cua', 'Cá', 'Mực', 'Ốc',
  'Sóc', 'Thỏ', 'Gấu', 'Cún', 'Heo', 'Vịt', 'Ngỗng', 'Cáo', 'Nhím',
  'Chuột', 'Hạt Tiêu', 'Bông Gòn', 'Cục Bông', 'Bé Ú', 'Ú Nu', 'Tròn',
  'Lùn', 'Dài', 'Lém', 'Lì', 'Ngoan', 'Quậy', 'Lười', 'Nhanh Nhảu', 'Tinh Nghịch',
  'Lấp Lánh', 'Ánh Sao', 'Mặt Trăng', 'Mặt Trời', 'Mây', 'Cầu Vồng', 'Sấm',
  'Chớp', 'Gió', 'Mưa', 'Tuyết', 'Sương', 'Biển', 'Sóng', 'San Hô', 'Ngọc',
  'Ngọc Bích', 'Kim Cương', 'Ruby', 'Bạc', 'Vàng Anh', 'Bình Minh', 'Hoàng Hôn',
  'Luna', 'Milo', 'Coco', 'Lulu', 'Lili', 'Bibi', 'Kiki', 'Mimi', 'Toto',
  'Nana', 'Bảo Bối', 'Công Chúa', 'Hoàng Tử', 'Đại Ca', 'Bé Cưng', 'Cục Cưng',
  'Bánh Bao Nhỏ', 'Mèo Ú', 'Mèo Mun', 'Mèo Mướp', 'Mèo Sữa', 'Mèo Bông',
  'Mèo Con', 'Mèo Lười', 'Mèo Máy', 'Mèo Béo', 'Mèo Vàng', 'Mèo Tuyết',
  'Tiểu Muội', 'Tiểu Bạch', 'Tiểu Hắc', 'Tiểu Hổ', 'Tiểu Long', 'Tiểu Ngư',
  'Bánh Cuốn', 'Bánh Chưng', 'Bánh Tét', 'Bánh Khúc', 'Bánh Đúc', 'Bánh Ít'
];

const COSTS = { feed: 10, drink: 5, bath: 15, adopt: 300 }; 
const STRAY_CAT_HUNT = {
  baitCost: 50,
  duration: 30 * 60 * 1000,
  cooldown: 4 * 60 * 60 * 1000,
  successChance: 0.8,
  rarityWeights: {
    common: 54,
    rare: 25,
    epic: 13.5,
    legendary: 5,
    mythic: 2,
    secret: 0.5
  }
};
const PREMIUM_CAT_SHOP_REFRESH_HOURS = [3, 7, 11, 15, 19, 23];
const PREMIUM_CAT_SHOP_PRICES = {
  legendary: 100000,
  mythic: 500000,
  secret: 2000000
};

const MAX_LEVEL = 10;
const LEVEL_EXP = [0, 30, 80, 160, 300, 500, 800, 1200, 1800, 2600];
const LEVEL_TITLES = [
  'Mèo sơ sinh', 'Mèo con', 'Mèo nhóc', 'Mèo thiếu niên', 'Mèo trưởng thành',
  'Mèo chững chạc', 'Mèo lão luyện', 'Mèo tinh anh', 'Mèo huyền thoại', 'Mèo thần thánh'
];
const LEVEL_REWARDS = [0, 50, 80, 120, 200, 300, 450, 700, 1000, 2000];

const EXP_GAIN = {
  feed: 5, drink: 3, bath: 8, pet: 2, breed: 50
};

const RARITY_EXP_MULT = {
  common: 1, rare: 1, epic: 0.75, legendary: 0.6, mythic: 0.45, secret: 0.35
};

const PASSIVE_LEVEL_HOURS = {
  common: 5, rare: 7, epic: 12, legendary: 24, mythic: 48, secret: 60
};

const STAT_DECAY = { hunger: 8, thirst: 10, cleanliness: 5 };

const SELL_MULT = { 
  common: 1, rare: 2, epic: 4, legendary: 10, mythic: 25, secret: 60
};

const ACTIVITY_RARITY_MULT = {
  common: 1,
  rare: 1.25,
  epic: 1.6,
  legendary: 2.1,
  mythic: 2.8,
  secret: 4
};

function scaleCoinsByRarity(amount, rarity) {
  const multiplier = ACTIVITY_RARITY_MULT[rarity] || ACTIVITY_RARITY_MULT.common;
  return Math.round(amount * multiplier / 10) * 10;
}

const TRAITS = [
  { name: 'Sáng tạo', type: 'good', mult: 1.2, emoji: '🎨' },
  { name: 'Dũng cảm', type: 'good', mult: 1.16, emoji: '🦁' },
  { name: 'Thông minh', type: 'good', mult: 1.12, emoji: '🧠' },
  { name: 'Chăm chỉ', type: 'good', mult: 1.08, emoji: '💪' },
  { name: 'Vui vẻ', type: 'good', mult: 1.06, emoji: '😸' },
  { name: 'Thân thiện', type: 'good', mult: 1.04, emoji: '😊' },
  { name: 'Hướng nội', type: 'neutral', mult: 0.98, emoji: '😶' },
  { name: 'Bình thường', type: 'neutral', mult: 1.0, emoji: '😐' },
  { name: 'Tham ăn', type: 'neutral', mult: 0.96, emoji: '🍔' },
  { name: 'Nóng tính', type: 'bad', mult: 1.0, emoji: '😾' },
  { name: 'Kiêu ngạo', type: 'bad', mult: 0.98, emoji: '🙄' },
  { name: 'Bướng bỉnh', type: 'bad', mult: 0.96, emoji: '🦆' },
  { name: 'Ích kỷ', type: 'bad', mult: 0.94, emoji: '🤑' },
  { name: 'Lười biếng', type: 'bad', mult: 0.92, emoji: '😴' },
  { name: 'Quậy phá', type: 'bad', mult: 0.9, emoji: '💥' }
];