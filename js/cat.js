// ============ HELPERS ============
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ============ CREATE ============
function createRandomCat(parents = null) {
  const genes = parents ? inheritGenes(parents[0], parents[1]) : generateGenes();
  const rarity = getRarityFromGenes(genes);
  const color = expressColor(genes);
  const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];

  return {
    id: 'cat_' + Date.now() + Math.random().toString(36).slice(2, 6),
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    gender: Math.random() < 0.5 ? 'male' : 'female',
    genes, color, rarity, trait,
    level: 1, exp: 0, totalExp: 0,
    hunger: 100, thirst: 100, cleanliness: 100, happiness: 80,
    lastUpdate: Date.now(), lastBreedTime: 0, equipment: []
  };
}

// ============ UPDATE (OFFLINE GROWTH) ============
function updateAllCats() {
  const now = Date.now();
  state.cats.forEach(cat => {
    const hours = (now - cat.lastUpdate) / 3600000;
    if (hours <= 0) return;

    cat.hunger      = clamp(cat.hunger      - hours * STAT_DECAY.hunger, 0, 100);
    cat.thirst      = clamp(cat.thirst      - hours * STAT_DECAY.thirst, 0, 100);
    cat.cleanliness = clamp(cat.cleanliness - hours * STAT_DECAY.cleanliness, 0, 100);

    const avg = (cat.hunger + cat.thirst + cat.cleanliness) / 3;
    if (avg < 40) cat.happiness = clamp(cat.happiness - hours * 6, 0, 100);
    else if (avg > 80) cat.happiness = clamp(cat.happiness + hours * 3, 0, 100);

    if (cat.level < MAX_LEVEL) addExp(cat, hours * getCatPassiveExpPerHour(cat));
    cat.lastUpdate = now;
  });
}

// ============ STAGE / PRICE ============
function getCatStage(cat) {
  if (cat.level >= 5) return 'adult';
  if (cat.level >= 2) return 'growing';
  return 'kitten';
}

function getSellPrice(cat) {
  const basePrice = 100;
  const level = clamp(Number(cat.level) || 1, 1, MAX_LEVEL);
  const rarityMult = SELL_MULT[cat.rarity] || SELL_MULT.common;
  const rawTraitMult = Number(cat.trait?.mult);
  const traitMult = Number.isFinite(rawTraitMult) ? clamp(rawTraitMult, 0.8, 1.2) : 1;
  const levelMult = 1 + (level - 1) * 0.15;
  const finalPrice = basePrice * rarityMult * traitMult * levelMult;

  return Math.max(10, Math.round(finalPrice / 10) * 10);
}

function addToCollection(rarity) {
  state.collection[rarity] = (state.collection[rarity] || 0) + 1;
}

// ============ MUTATION (khi sinh sản) ============
function tryMutation(baby, parentA, parentB) {
  const maxParentOrder = Math.max(RARITY_ORDER[parentA.rarity], RARITY_ORDER[parentB.rarity]);
  if (maxParentOrder < 3) return false; 

  const roll = Math.random();
  
  let counts = { secret: 0, mythic: 0, legendary: 0 };
  state.cats.forEach(c => {
    if (counts[c.rarity] !== undefined) counts[c.rarity]++;
  });

  if (maxParentOrder >= 4 && roll < 0.01) {
    if (counts.secret >= RARITY_LIMITS.secret) return false; 
    const randomSecret = pickRandomFrom(SECRET_IDS);
    baby.genes = [randomSecret, pickRandomFrom(SECRET_IDS)];
    baby.color = randomSecret; baby.rarity = 'secret';
    return true;
  }

  if (maxParentOrder >= 4 && roll < 0.04) {
    if (counts.mythic >= RARITY_LIMITS.mythic) return false;
    const m1 = pickRandomFrom(MYTHIC_IDS);
    baby.genes = [m1, pickRandomFrom([...LEGENDARY_IDS, ...MYTHIC_IDS])];
    baby.color = m1; baby.rarity = 'mythic';
    return true;
  }

  if (maxParentOrder >= 3 && roll < 0.12) {
    if (counts.legendary >= RARITY_LIMITS.legendary) return false;
    const l1 = pickRandomFrom(LEGENDARY_IDS);
    baby.genes = [l1, pickRandomFrom([...LEGENDARY_IDS, 'tim', 'xanh'])];
    baby.color = l1; baby.rarity = 'legendary';
    return true;
  }

  return false;
}

// ============ SVG / IMAGE RENDERING ============
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = Math.max(0, Math.min(255, (num >> 16) + percent));
  let g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + percent));
  let b = Math.max(0, Math.min(255, (num & 0xFF) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function renderCatSVG(cat) {
  const allele = ALLELES[cat.color] || ALLELES.cam;
  
  // NẾU CÓ ẢNH THÌ HIỆN ẢNH
  if (allele.img) {
    const glowStyle = cat.rarity === 'secret' 
      ? 'filter: drop-shadow(0 0 10px #ff00ff) drop-shadow(0 0 20px #00ffff);' 
      : (cat.level >= MAX_LEVEL ? 'filter: drop-shadow(0 0 12px #ffb800);' : '');
    return `<img src="${allele.img}" class="cat-img" style="width: 100%; height: 100%; object-fit: contain; ${glowStyle}" onerror="this.style.display='none'">`;
  }

  // KHÔNG CÓ ẢNH THÌ VẼ SVG
  const body = allele.color;
  const eyeColor = allele.eye;
  const shade = shadeColor(body, -15);
  const light = shadeColor(body, 20);

  const hasAura = cat.rarity === 'legendary' || cat.rarity === 'mythic' || cat.rarity === 'secret' || cat.level >= MAX_LEVEL;
  const auraColor = cat.rarity === 'secret' ? 'url(#rainbow)' : cat.rarity === 'mythic' ? 'url(#mythic)' : 'url(#gold)';

  const aura = hasAura
    ? `<circle cx="60" cy="60" r="55" fill="none" stroke="${auraColor}" stroke-width="2" opacity="0.6">
         ${cat.rarity === 'secret' ? '<animateTransform attributeName="transform" type="rotate" from="0 60 60" to="360 60 60" dur="4s" repeatCount="indefinite"/>' : ''}
       </circle>
       <defs>
         <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#ffb800"/><stop offset="1" stop-color="#ff7eb6"/></linearGradient>
         <linearGradient id="mythic" x1="0" x2="1"><stop offset="0" stop-color="#ff4444"/><stop offset="1" stop-color="#b86bff"/></linearGradient>
         <linearGradient id="rainbow" x1="0" x2="1">
           <stop offset="0" stop-color="#ff0000"/><stop offset="0.16" stop-color="#ff7f00"/><stop offset="0.33" stop-color="#ffff00"/>
           <stop offset="0.5" stop-color="#00ff00"/><stop offset="0.66" stop-color="#0000ff"/><stop offset="0.83" stop-color="#4b0082"/><stop offset="1" stop-color="#9400d3"/>
         </linearGradient>
       </defs>`
    : '';

  return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" ${cat.rarity === 'secret' ? 'style="filter: drop-shadow(0 0 8px #ff00ff) drop-shadow(0 0 12px #00ffff);"' : ''}>
      ${aura}
      <g class="cat-tail"><path d="M 30 80 Q 5 90 15 65 Q 20 55 28 62" stroke="${shade}" stroke-width="9" fill="none" stroke-linecap="round"/></g>
      <ellipse cx="62" cy="80" rx="30" ry="26" fill="${body}" stroke="${shade}" stroke-width="1"/>
      <ellipse cx="62" cy="88" rx="18" ry="14" fill="${light}" opacity="0.5"/>
      <ellipse cx="62" cy="45" rx="28" ry="25" fill="${body}" stroke="${shade}" stroke-width="1"/>
      <path d="M 42 28 L 38 12 L 56 22 Z" fill="${body}" stroke="${shade}" stroke-width="1"/>
      <path d="M 82 28 L 86 12 L 68 22 Z" fill="${body}" stroke="${shade}" stroke-width="1"/>
      <path d="M 44 26 L 42 17 L 52 23 Z" fill="${light}" opacity="0.6"/>
      <path d="M 80 26 L 82 17 L 72 23 Z" fill="${light}" opacity="0.6"/>
      <ellipse class="cat-eye" cx="52" cy="44" rx="4" ry="6" fill="${eyeColor}"/>
      <ellipse class="cat-eye" cx="72" cy="44" rx="4" ry="6" fill="${eyeColor}"/>
      <circle cx="53" cy="42" r="1.5" fill="#fff"/><circle cx="73" cy="42" r="1.5" fill="#fff"/>
      <path d="M 60 52 L 62 52 L 61 54 Z" fill="#e88ab0"/>
      <path d="M 61 54 Q 58 58 55 56 M 61 54 Q 64 58 67 56" stroke="${shade}" stroke-width="1" fill="none" stroke-linecap="round"/>
      <line x1="42" y1="52" x2="34" y2="50" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
      <line x1="42" y1="55" x2="33" y2="56" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
      <line x1="80" y1="52" x2="88" y2="50" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
      <line x1="80" y1="55" x2="89" y2="56" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
      <ellipse cx="50" cy="105" rx="8" ry="5" fill="${body}" stroke="${shade}" stroke-width="1"/>
      <ellipse cx="74" cy="105" rx="8" ry="5" fill="${body}" stroke="${shade}" stroke-width="1"/>
    </svg>
  `;
}