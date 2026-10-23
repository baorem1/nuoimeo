// ============ FEED / DRINK / BATH ============
function feedCat(id, evt) {
  const cat = state.cats.find(c => c.id === id);
  if (!cat || cat.expedition || cat.hunger >= 100 || state.money < COSTS.feed) return;
  state.money -= COSTS.feed;
  cat.hunger = clamp(cat.hunger + 30, 0, 100);
  addExp(cat, EXP_GAIN.feed);
  if (evt) showExpPopup(evt.clientX, evt.clientY, getCatExpGain(cat, EXP_GAIN.feed));
  saveGame(); render();
}

function drinkCat(id, evt) {
  const cat = state.cats.find(c => c.id === id);
  if (!cat || cat.expedition || cat.thirst >= 100 || state.money < COSTS.drink) return;
  state.money -= COSTS.drink;
  cat.thirst = clamp(cat.thirst + 30, 0, 100);
  addExp(cat, EXP_GAIN.drink);
  if (evt) showExpPopup(evt.clientX, evt.clientY, getCatExpGain(cat, EXP_GAIN.drink));
  saveGame(); render();
}

function bathCat(id, evt) {
  const cat = state.cats.find(c => c.id === id);
  if (!cat || cat.expedition || cat.cleanliness >= 100 || state.money < COSTS.bath) return;
  state.money -= COSTS.bath;
  cat.cleanliness = clamp(cat.cleanliness + 40, 0, 100);
  addExp(cat, EXP_GAIN.bath);
  if (evt) showExpPopup(evt.clientX, evt.clientY, getCatExpGain(cat, EXP_GAIN.bath));
  saveGame(); render();
}

// ============ PET (vuốt ve) ============
function petCat(id, evt) {
  const cat = state.cats.find(c => c.id === id);
  if (!cat || cat.expedition || cat.happiness >= 100) return;
  cat.happiness = clamp(cat.happiness + 3, 0, 100);
  addExp(cat, EXP_GAIN.pet);
  if (evt) {
    showExpPopup(evt.clientX, evt.clientY, getCatExpGain(cat, EXP_GAIN.pet));
    showHearts(evt.clientX, evt.clientY, '💖', 3);
  }
  saveGame(); render();
}

// ============ BUY ============
function buyCat() {
  if (state.money < COSTS.adopt) {
    alert('Không đủ tiền! Cần ' + COSTS.adopt + ' xu.');
    return;
  }
  state.money -= COSTS.adopt;
  const cat = createRandomCat();
  state.cats.push(cat);
  addToCollection(cat.rarity);
  saveGame(); render();

  // Hiệu ứng đặc biệt theo rarity khi mua
  if (cat.rarity === 'secret') {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '🌈', 30);
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '✨', 20);
    setTimeout(() => alert(`🌈 WOW! Bạn vừa mua được bé SECRET: ${cat.name}!`), 300);
  } else if (cat.rarity === 'mythic') {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '🔥', 15);
    setTimeout(() => alert(`🔥 Bé MYTHIC ${cat.name} xuất hiện!`), 300);
  } else if (cat.rarity === 'legendary') {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '⭐', 10);
  } else if (cat.rarity === 'epic') {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '✨', 6);
  }
}

// ============ SELL (Đã dùng Popup xịn) ============
function sellCat(id, evt) {
  const cat = state.cats.find(c => c.id === id);
  if (!cat || cat.expedition) return;
  const price = getSellPrice(cat);
  
  // Dùng Popup xịn để xác nhận
  showCustomConfirm(
    '💰 Bán mèo',
    `Bạn có chắc muốn bán bé <b>${cat.name}</b> (Lv${cat.level} · ${RARITY_LABEL[cat.rarity]}) lấy <b>${price} xu</b> không?`,
    false
  ).then((confirmSell) => {
    if (!confirmSell) return;

    // Tiến hành bán
    state.money += price;
    state.cats = state.cats.filter(c => c.id !== id);
    
    // Đếm số mèo đã bán để tính Thành tựu
    if (!state.stats) state.stats = { catsSold: 0 };
    state.stats.catsSold++;

    saveGame();
    render();
    checkAchievements(); // Kiểm tra thành tựu ngay lập tức

    // Hiệu ứng
    if (evt) showHearts(evt.clientX, evt.clientY, '💰', 5);
    else showHearts(window.innerWidth / 2, window.innerHeight / 2, '💰', 3);
  });
}

// ============ CAT AUCTION ============
function openAuctionModal() {
  processAuctions();
  renderAuctions();
  document.getElementById('auction-modal').classList.remove('hidden');
}

function renderAuctions() {
  const list = document.getElementById('auction-list');
  if (!list) return;

  const auctions = state.auctions || [];
  if (auctions.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Chưa có mèo nào đang đấu giá.</p>';
    return;
  }

  list.innerHTML = auctions.map(auction => {
    const cat = auction.cat;
    const status = auction.status === 'offered'
      ? `<p style="margin:8px 0;color:#8a5a00;font-weight:bold;">Người mua trả giá: ${auction.offerPrice} xu</p>
         <div style="display:flex;gap:8px;">
           <button class="btn-primary" data-auction-action="accept" data-id="${cat.id}" style="flex:1;">Chấp nhận</button>
           <button class="btn-secondary" data-auction-action="reject" data-id="${cat.id}" style="flex:1;">Từ chối</button>
         </div>
         <small style="display:block;margin-top:6px;color:#b44;">Từ chối sẽ nhận lại mèo nhưng không thể đấu giá lại.</small>`
      : `<p style="margin:8px 0;color:#777;">Đang chờ người mua... còn ${Math.max(0, Math.ceil((auction.readyAt - Date.now()) / 1000))} giây</p>`;
    return `<div class="breed-item" style="display:block;margin-bottom:10px;">
      <div style="font-weight:bold;">${cat.name} · Lv${cat.level} · ${RARITY_LABEL[cat.rarity]}</div>
      ${status}
    </div>`;
  }).join('');

  list.querySelectorAll('[data-auction-action]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.auctionAction === 'accept') acceptAuctionOffer(button.dataset.id);
      else rejectAuctionOffer(button.dataset.id);
    });
  });
}

function processAuctions() {
  if (!state.auctions) state.auctions = [];

  let changed = false;
  state.auctions.forEach(auction => {
    if (auction.status === 'waiting' && Date.now() >= auction.readyAt) {
      const offerPercent = Math.floor(Math.random() * 151) + 50;
      auction.offerPrice = Math.max(10, Math.round(getSellPrice(auction.cat) * offerPercent / 100 / 10) * 10);
      auction.status = 'offered';
      changed = true;
    }
  });

  const modal = document.getElementById('auction-modal');
  if (modal && !modal.classList.contains('hidden')) renderAuctions();
  return changed;
}

function startCatAuction(id) {
  const cat = state.cats.find(item => item.id === id);
  if (!cat || cat.expedition || cat.level < 5 || cat.auctionRejected) return;

  const confirmStart = window.confirm(`Đưa ${cat.name} lên đấu giá? Sau 1 phút sẽ có giá ngẫu nhiên từ 50% đến 200% giá bán hiện tại.`);
  if (!confirmStart) return;

  cat.lastUpdate = Date.now();
  state.cats = state.cats.filter(item => item.id !== id);
  if (!state.auctions) state.auctions = [];
  state.auctions.push({
    cat,
    status: 'waiting',
    readyAt: Date.now() + 60 * 1000,
    offerPrice: null
  });

  saveGame();
  render();
  openAuctionModal();
}

function acceptAuctionOffer(id) {
  const index = (state.auctions || []).findIndex(auction => auction.cat.id === id && auction.status === 'offered');
  if (index < 0) return;

  const [auction] = state.auctions.splice(index, 1);
  state.money += auction.offerPrice;
  if (!state.stats) state.stats = { catsSold: 0 };
  state.stats.catsSold++;

  saveGame();
  render();
  checkAchievements();
  renderAuctions();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, '💰', 8);
}

function rejectAuctionOffer(id) {
  const index = (state.auctions || []).findIndex(auction => auction.cat.id === id && auction.status === 'offered');
  if (index < 0) return;

  const [auction] = state.auctions.splice(index, 1);
  auction.cat.auctionRejected = true;
  auction.cat.lastUpdate = Date.now();
  state.cats.push(auction.cat);

  saveGame();
  render();
  renderAuctions();
}

// ============ BREEDING ============
function openBreedModal(id) {
  const cat = state.cats.find(c => c.id === id);
  if (!cat || cat.expedition) return;
  if (cat.level < 5) { alert('Mèo phải đạt Lv5 (Mèo trưởng thành) mới sinh sản được!'); return; }
  if (cat.happiness < 50) { alert('Mèo chưa đủ hạnh phúc (cần ≥50)!'); return; }

  const now = Date.now();
  const cooldown = 60 * 60 * 1000;
  if (now - cat.lastBreedTime < cooldown) {
    alert(`Bé này cần nghỉ thêm ${Math.ceil((cooldown - (now - cat.lastBreedTime)) / 60000)} phút.`);
    return;
  }

  const candidates = state.cats.filter(c =>
    c.id !== cat.id &&
    !c.expedition &&
    c.gender !== cat.gender &&
    c.level >= 5 &&
    c.happiness >= 50 &&
    (now - c.lastBreedTime) >= cooldown
  );

  if (candidates.length === 0) {
    alert('Không có mèo phù hợp. Cần mèo khác giới, Lv≥5, hạnh phúc ≥50, chưa sinh sản trong 1h.');
    return;
  }

  const list = document.getElementById('breed-list');
  list.innerHTML = '';
  candidates.forEach(cand => {
    const item = document.createElement('div');
    item.className = 'breed-item';
    item.innerHTML = `
      <div class="breed-item-emoji">${cand.gender === 'male' ? '♂' : '♀'}</div>
      <div class="breed-item-info">
        <div class="breed-item-name">${cand.name} · ${ALLELES[cand.color].name} · Lv${cand.level}</div>
        <div class="breed-item-desc">
          <span class="lineage-lineage lineage-${cand.rarity}">
            <span class="lineage-text">${RARITY_LABEL[cand.rarity]}</span>
          </span>
          · ${Math.floor(cand.happiness)}% hạnh phúc
        </div>
      </div>
    `;
    item.addEventListener('click', () => {
      breedCats(cat.id, cand.id);
      document.getElementById('breed-modal').classList.add('hidden');
    });
    list.appendChild(item);
  });

  document.getElementById('breed-text').textContent = `Chọn bạn đời cho bé ${cat.name}`;
  document.getElementById('breed-modal').classList.remove('hidden');
}

function breedCats(id1, id2) {
  const a = state.cats.find(c => c.id === id1);
  const b = state.cats.find(c => c.id === id2);
  if (!a || !b || a.expedition || b.expedition) return;

  const numBabies = Math.random() < 0.3 ? 2 : 1;
  const babies = [];

  for (let i = 0; i < numBabies; i++) {
    const baby = createRandomCat([a, b]);
    tryMutation(baby, a, b);  // ⚡ đột biến nếu bố mẹ hiếm
    babies.push(baby);
    state.cats.push(baby);
    addToCollection(baby.rarity);
  }

  const now = Date.now();
  a.lastBreedTime = now;
  b.lastBreedTime = now;
  a.happiness = clamp(a.happiness - 20, 0, 100);
  b.happiness = clamp(b.happiness - 20, 0, 100);
  addExp(a, EXP_GAIN.breed);
  addExp(b, EXP_GAIN.breed);

  saveGame(); render();
  showHearts(window.innerWidth / 2, window.innerHeight / 2, '💕', 8);

  // Vẽ modal kết quả
  const body = document.getElementById('result-body');
  body.innerHTML = '';
  babies.forEach(baby => {
    const div = document.createElement('div');
    div.className = `result-cat rarity-${baby.rarity}`;
    div.innerHTML = `
      ${renderCatSVG(baby)}
      <div style="font-weight:bold;font-size:1.1em;">${baby.name}</div>
      <div style="font-size:0.9em;color:#888;">${baby.gender === 'male' ? '♂ Đực' : '♀ Cái'} · ${ALLELES[baby.color].name}</div>
      <div class="lineage-lineage lineage-${baby.rarity}">
        <span class="lineage-text">${RARITY_LABEL[baby.rarity]}</span>
      </div>
    `;
    body.appendChild(div);
  });

  document.getElementById('result-title').textContent = numBabies > 1 ? '🎉 Sinh đôi!' : '🎉 Chúc mừng!';
  document.getElementById('result-modal').classList.remove('hidden');

  // 🎆 Hiệu ứng đặc biệt cho rarity cao
  if (babies.some(b => b.rarity === 'secret')) {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '🌈', 30);
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '✨', 20);
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '💫', 15);
  } else if (babies.some(b => b.rarity === 'mythic')) {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '🔥', 15);
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '⚡', 10);
  } else if (babies.some(b => b.rarity === 'legendary')) {
    showHearts(window.innerWidth / 2, window.innerHeight / 2, '⭐', 10);
  }
}