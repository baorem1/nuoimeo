const INVENTORY_ITEMS = {
  food: { name: 'Món ngon', emoji: '🍖', description: 'Hồi 50 độ no', price: 35, stat: 'hunger', restore: 50 },
  water: { name: 'Nước mát', emoji: '💧', description: 'Hồi 50 độ khát', price: 20, stat: 'thirst', restore: 50 },
  soap: { name: 'Xà phòng', emoji: '🧼', description: 'Hồi 60 độ sạch sẽ', price: 45, stat: 'cleanliness', restore: 60 }
};

const CHEST_SHOP_ITEM = { name: 'Rương thám hiểm', image: 'img/chest.png', description: 'Mở để nhận xu hoặc trang bị vĩnh viễn', price: 1000 };

const PERMANENT_ITEMS = {
  hoodie: { name: 'Áo mèo', image: 'img/item/item_ao.png', description: '+10% EXP tự động', effect: 'passiveExp', bonus: 0.1 },
  mouse: { name: 'Chuột đồ chơi', image: 'img/item/item_chuot.png', description: '+10% xu thám hiểm', effect: 'expeditionCoins', bonus: 0.1 },
  slippers: { name: 'Dép siêu tốc', image: 'img/item/item_dep.png', description: 'Đi thám hiểm nhanh hơn 10%', effect: 'expeditionSpeed', bonus: 0.1 },
  hat: { name: 'Nón thám hiểm', image: 'img/item/item_non.png', description: '+8% tỉ lệ tìm thấy rương', effect: 'chestChance', bonus: 8 },
  luckyCharm: { name: 'Bùa may mắn', image: 'img/item/item_sip.png', description: '+5% tỉ lệ nhận trang bị trong rương', effect: 'itemChance', bonus: 5 },
  goldenEgg: { name: 'Trứng vàng', image: 'img/item/item_trung.png', description: '+15% xu nhận từ rương', effect: 'chestCoins', bonus: 0.15 }
};

function getCatEquipmentBonus(cat, effect) {
  return (cat.equipment || []).reduce((total, itemId) => {
    const item = PERMANENT_ITEMS[itemId];
    return item?.effect === effect ? total + item.bonus : total;
  }, 0);
}

function getAvailableCatsForItem(item) {
  return (state.cats || []).filter(cat => !cat.expedition && cat[item.stat] < 100);
}

function renderShopItems() {
  const list = document.getElementById('shop-items-list');
  if (!list) return;

  const chestItem = `
    <div class="inventory-item">
      <img class="inventory-chest-image" src="${CHEST_SHOP_ITEM.image}" alt="${CHEST_SHOP_ITEM.name}">
      <div class="inventory-item-info">
        <b>${CHEST_SHOP_ITEM.name}</b>
        <small>${CHEST_SHOP_ITEM.description} · 💰 ${CHEST_SHOP_ITEM.price.toLocaleString('vi-VN')} xu</small>
      </div>
      <button class="btn-primary" data-buy-item="chest" ${state.money < CHEST_SHOP_ITEM.price ? 'disabled' : ''}>Mua</button>
    </div>`;

  list.innerHTML = chestItem + Object.entries(INVENTORY_ITEMS).map(([id, item]) => `
    <div class="inventory-item">
      <div class="inventory-item-icon">${item.emoji}</div>
      <div class="inventory-item-info">
        <b>${item.name}</b>
        <small>${item.description} · 💰 ${item.price} xu</small>
      </div>
      <button class="btn-primary" data-buy-item="${id}" ${state.money < item.price ? 'disabled' : ''}>Mua</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-buy-item]').forEach(button => {
    button.addEventListener('click', () => buyInventoryItem(button.dataset.buyItem));
  });
}

function buyInventoryItem(itemId) {
  if (itemId === 'chest') {
    if (state.money < CHEST_SHOP_ITEM.price) {
      alert(`Không đủ tiền! Cần ${CHEST_SHOP_ITEM.price.toLocaleString('vi-VN')} xu.`);
      return;
    }

    state.money -= CHEST_SHOP_ITEM.price;
    if (!state.inventory) state.inventory = {};
    state.inventory.chest = (Number(state.inventory.chest) || 0) + 1;
    saveGame();
    render();
    renderShopItems();
    renderInventory();
    return;
  }

  const item = INVENTORY_ITEMS[itemId];
  if (!item) return;
  if (state.money < item.price) {
    alert(`Không đủ tiền! Cần ${item.price} xu.`);
    return;
  }

  state.money -= item.price;
  if (!state.inventory) state.inventory = {};
  state.inventory[itemId] = (Number(state.inventory[itemId]) || 0) + 1;
  saveGame();
  render();
  renderShopItems();
  renderInventory();
}

function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list) return;

  const consumables = Object.entries(INVENTORY_ITEMS).map(([id, item]) => {
    const quantity = Math.max(0, Number(state.inventory?.[id]) || 0);
    const eligibleCats = getAvailableCatsForItem(item);
    const options = eligibleCats.map(cat =>
      `<option value="${cat.id}">${cat.name} · ${Math.floor(cat[item.stat])}%</option>`
    ).join('');
    const catSelector = eligibleCats.length
      ? `<select class="inventory-cat-select" data-item="${id}">${options}</select>`
      : '<small class="inventory-empty-cats">Không có mèo nào cần món này.</small>';
    const disabled = quantity === 0 || eligibleCats.length === 0;

    return `<div class="inventory-item inventory-bag-item">
      <div class="inventory-item-icon">${item.emoji}</div>
      <div class="inventory-item-info">
        <b>${item.name} <span class="inventory-quantity">×${quantity}</span></b>
        <small>${item.description}</small>
        ${catSelector}
      </div>
      <button class="btn-primary" data-use-item="${id}" ${disabled ? 'disabled' : ''}>Dùng</button>
    </div>`;
  }).join('');

  const chestCount = Math.max(0, Number(state.inventory?.chest) || 0);
  const eligibleChestCats = (state.cats || []).filter(cat => !cat.expedition);
  const chestOptions = eligibleChestCats.map(cat =>
    `<option value="${cat.id}">${cat.name} · ${RARITY_LABEL[cat.rarity]}</option>`
  ).join('');
  const chestSection = `
    <div class="inventory-section-title">🎁 Rương báu · ×${chestCount}</div>
    <div class="inventory-item inventory-chest">
      <img class="inventory-chest-image" src="${CHEST_SHOP_ITEM.image}" alt="Rương báu">
      <div class="inventory-item-info">
        <b>${CHEST_SHOP_ITEM.name}</b>
        <small>Có thể nhận 100–800 xu hoặc trang bị vĩnh viễn (tỉ lệ thấp).</small>
        ${eligibleChestCats.length
          ? `<select class="inventory-cat-select" id="chest-opener">${chestOptions}</select>`
          : '<small class="inventory-empty-cats">Cần một bé mèo ở nhà để mở rương.</small>'}
      </div>
      <button class="btn-primary" id="btn-open-chest" ${chestCount === 0 || eligibleChestCats.length === 0 ? 'disabled' : ''}>Mở</button>
    </div>`;

  const relics = Object.entries(PERMANENT_ITEMS).map(([id, item]) => {
    const quantity = Math.max(0, Number(state.inventory?.relics?.[id]) || 0);
    const equippedCats = (state.cats || []).filter(cat => (cat.equipment || []).includes(id));
    const availableCats = (state.cats || []).filter(cat => !cat.expedition && !(cat.equipment || []).includes(id));
    const options = availableCats.map(cat =>
      `<option value="${cat.id}">${cat.name} · Lv${cat.level}</option>`
    ).join('');
    const equippedText = equippedCats.length
      ? `<div class="inventory-equipped-list">${equippedCats.map(cat => `
          <div class="inventory-equipped-row">
            <small>Đang trang bị: ${cat.name}${cat.expedition ? ' · đang thám hiểm' : ''}</small>
            <button class="btn-secondary" data-unequip-relic="${id}" data-cat-id="${cat.id}" ${cat.expedition ? 'disabled' : ''}>Tháo</button>
          </div>`).join('')}</div>`
      : '';
    const controls = quantity > 0 && availableCats.length
      ? `<select class="inventory-cat-select" data-relic-cat="${id}">${options}</select>`
      : `<small>${quantity === 0 ? 'Chưa sở hữu' : 'Không có mèo phù hợp để trang bị.'}</small>`;
    return `<div class="inventory-item inventory-relic">
      <img class="inventory-relic-image" src="${item.image}" alt="${item.name}">
      <div class="inventory-item-info">
        <b>${item.name} <span class="inventory-quantity">×${quantity}</span></b>
        <small>${item.description} · Vĩnh viễn</small>
        ${equippedText}
        ${controls}
      </div>
      <button class="btn-primary" data-equip-relic="${id}" ${quantity === 0 || availableCats.length === 0 ? 'disabled' : ''}>Trang bị</button>
    </div>`;
  }).join('');

  list.innerHTML = `${chestSection}<div class="inventory-section-title">✨ Trang bị vĩnh viễn</div>${relics}<div class="inventory-section-title">🧴 Vật phẩm dùng một lần</div>${consumables}`;

  list.querySelectorAll('[data-use-item]').forEach(button => {
    button.addEventListener('click', () => {
      const itemId = button.dataset.useItem;
      const select = list.querySelector(`[data-item="${itemId}"]`);
      if (select) useInventoryItem(itemId, select.value);
    });
  });

  const openChestButton = list.querySelector('#btn-open-chest');
  if (openChestButton) {
    openChestButton.addEventListener('click', () => {
      const opener = list.querySelector('#chest-opener');
      if (opener) openTreasureChest(opener.value);
    });
  }

  list.querySelectorAll('[data-equip-relic]').forEach(button => {
    button.addEventListener('click', () => {
      const itemId = button.dataset.equipRelic;
      const select = list.querySelector(`[data-relic-cat="${itemId}"]`);
      if (select) equipPermanentItem(itemId, select.value);
    });
  });

  list.querySelectorAll('[data-unequip-relic]').forEach(button => {
    button.addEventListener('click', () => {
      unequipPermanentItem(button.dataset.unequipRelic, button.dataset.catId);
    });
  });
}

function openInventory() {
  renderInventory();
  document.getElementById('inventory-modal').classList.remove('hidden');
}

function useInventoryItem(itemId, catId) {
  const item = INVENTORY_ITEMS[itemId];
  const cat = state.cats.find(candidate => candidate.id === catId);
  const quantity = Math.max(0, Number(state.inventory?.[itemId]) || 0);
  if (!item || !cat || cat.expedition || quantity < 1 || cat[item.stat] >= 100) return;

  cat[item.stat] = clamp(cat[item.stat] + item.restore, 0, 100);
  state.inventory[itemId] = quantity - 1;
  saveGame();
  render();
  renderInventory();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, item.emoji, 4);
}

function equipPermanentItem(itemId, catId) {
  const item = PERMANENT_ITEMS[itemId];
  const cat = state.cats.find(candidate => candidate.id === catId);
  const quantity = Math.max(0, Number(state.inventory?.relics?.[itemId]) || 0);
  if (!item || !cat || cat.expedition || quantity < 1) return;

  if (!Array.isArray(cat.equipment)) cat.equipment = [];
  if (cat.equipment.includes(itemId)) return;

  cat.equipment.push(itemId);
  state.inventory.relics[itemId] = quantity - 1;
  saveGame();
  render();
  renderInventory();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, '✨', 5);
}

function unequipPermanentItem(itemId, catId) {
  const cat = state.cats.find(candidate => candidate.id === catId);
  if (!PERMANENT_ITEMS[itemId] || !cat || cat.expedition || !cat.equipment?.includes(itemId)) return;

  cat.equipment = cat.equipment.filter(equippedId => equippedId !== itemId);
  if (!state.inventory) state.inventory = {};
  if (!state.inventory.relics) state.inventory.relics = {};
  state.inventory.relics[itemId] = (Number(state.inventory.relics[itemId]) || 0) + 1;
  saveGame();
  render();
  renderInventory();
}

function openTreasureChest(catId) {
  const cat = state.cats.find(candidate => candidate.id === catId);
  const chestCount = Math.max(0, Number(state.inventory?.chest) || 0);
  if (!cat || cat.expedition || chestCount < 1) return;

  const itemChance = Math.min(0.4, 0.1 + getCatEquipmentBonus(cat, 'itemChance') / 100);
  state.inventory.chest = chestCount - 1;

  if (Math.random() < itemChance) {
    const itemIds = Object.keys(PERMANENT_ITEMS);
    const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
    if (!state.inventory.relics) state.inventory.relics = {};
    state.inventory.relics[itemId] = (Number(state.inventory.relics[itemId]) || 0) + 1;
    const item = PERMANENT_ITEMS[itemId];
    saveGame();
    renderInventory();
    alert(`✨ Rương có trang bị hiếm! Bạn nhận được ${item.name}. Vật phẩm này dùng vĩnh viễn.`);
    return;
  }

  const baseCoins = Math.floor(Math.random() * 701) + 100;
  const coinMultiplier = 1 + getCatEquipmentBonus(cat, 'chestCoins');
  const coins = Math.round(baseCoins * coinMultiplier / 10) * 10;
  state.money += coins;
  saveGame();
  render();
  renderInventory();
  alert(`💰 Trong rương có ${coins} xu!`);
}
