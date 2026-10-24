// ============ HELPERS ============
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ============ CREATE ============
function createRandomCat(parents = null, forcedRarity = null) {
  const rarityPools = {
    common: COMMON_IDS,
    rare: RARE_IDS,
    epic: EPIC_IDS,
    legendary: LEGENDARY_IDS,
    mythic: MYTHIC_IDS,
    secret: SECRET_IDS
  };
  const forcedPool = rarityPools[forcedRarity];
  const genes = forcedPool
    ? [pickRandomFrom(forcedPool), pickRandomFrom(forcedPool)]
    : parents ? inheritGenes(parents[0], parents[1]) : generateGenes();
  const rarity = getRarityFromGenes(genes);
  const color = expressColor(genes);
  const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
  const now = Date.now();

  const cat = {
    id: 'cat_' + Date.now() + Math.random().toString(36).slice(2, 6),
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    gender: Math.random() < 0.5 ? 'male' : 'female',
    genes, color, rarity, trait,
    level: 1, exp: 0, totalExp: 0,
    hunger: 100, thirst: 100, cleanliness: 100, happiness: 80,
    lastUpdate: now, lastBreedTime: 0, equipment: [], createdAt: now
  };
  initializeCatDiary(cat);
  return cat;
}

// ============ UPDATE (OFFLINE GROWTH) ============
function updateAllCats() {
  const now = Date.now();
  state.cats.forEach(cat => {
    const hours = (now - cat.lastUpdate) / 3600000;
    if (hours <= 0) return;
    recordCatFarmTime(cat, hours * 3600000);

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

  const catShape = cat.rarity === 'rare'
    ? `<g class="svg-cat-rare">
         <path d="M31 77 Q9 79 16 57 Q20 47 31 58" stroke="${shade}" stroke-width="9" fill="none" stroke-linecap="round"/>
         <ellipse cx="62" cy="82" rx="34" ry="24" fill="${body}" stroke="${shade}" stroke-width="1.5"/>
         <ellipse cx="62" cy="47" rx="30" ry="25" fill="${body}" stroke="${shade}" stroke-width="1.5"/>
         <path d="M39 31 L31 8 L55 23 Z M85 31 L93 8 L69 23 Z" fill="${body}" stroke="${shade}" stroke-width="2" stroke-linejoin="round"/>
         <path d="M42 25 L38 14 L51 23 Z M82 25 L86 14 L73 23 Z" fill="${light}"/>
         <path d="M38 80 Q45 68 51 80 M72 80 Q79 68 86 80" stroke="${light}" stroke-width="4" opacity=".75" fill="none"/>
         <ellipse cx="51" cy="46" rx="4.5" ry="6" fill="${eyeColor}"/><ellipse cx="73" cy="46" rx="4.5" ry="6" fill="${eyeColor}"/>
         <circle cx="52" cy="44" r="1.5" fill="#fff"/><circle cx="74" cy="44" r="1.5" fill="#fff"/>
         <path d="M59 54 Q62 51 65 54 L62 57 Z" fill="#e88ab0"/>
         <path d="M62 57 Q57 62 53 58 M62 57 Q67 62 71 58" stroke="${shade}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
         <ellipse cx="49" cy="104" rx="9" ry="5" fill="${body}" stroke="${shade}"/><ellipse cx="75" cy="104" rx="9" ry="5" fill="${body}" stroke="${shade}"/>
         <circle cx="62" cy="77" r="3" fill="${light}" opacity=".75"/>
       </g>`
    : cat.rarity === 'epic'
      ? `<g class="svg-cat-epic">
           <path d="M35 79 Q9 86 18 61 Q22 51 34 58" stroke="${shade}" stroke-width="8" fill="none" stroke-linecap="round"/>
           <path d="M36 94 Q31 77 43 67 Q62 56 81 67 Q93 77 88 94 Q83 105 62 105 Q41 105 36 94Z" fill="${body}" stroke="${shade}" stroke-width="2"/>
           <path d="M36 35 L34 8 L54 25 L62 16 L70 25 L90 8 L88 35 Q83 21 62 21 Q41 21 36 35Z" fill="${body}" stroke="${shade}" stroke-width="2" stroke-linejoin="round"/>
           <path d="M42 29 L41 15 L53 26 Z M82 29 L83 15 L71 26 Z" fill="${light}"/>
           <path d="M44 44 Q52 38 58 44 M66 44 Q72 38 80 44" stroke="${shade}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
           <ellipse cx="52" cy="49" rx="4.5" ry="6" fill="${eyeColor}"/><ellipse cx="72" cy="49" rx="4.5" ry="6" fill="${eyeColor}"/>
           <circle cx="53" cy="47" r="1.5" fill="#fff"/><circle cx="73" cy="47" r="1.5" fill="#fff"/>
           <path d="M58 57 Q62 54 66 57 L62 60 Z" fill="#f58ab8"/>
           <path d="M62 60 Q57 65 53 61 M62 60 Q67 65 71 61" stroke="${shade}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
           <path d="M62 72 L65 78 L72 79 L67 84 L68 91 L62 87 L56 91 L57 84 L52 79 L59 78 Z" fill="${light}" stroke="${shade}" stroke-width="1"/>
           <path d="M45 104 L43 98 L54 98 L55 107 L47 107 Z M69 98 L81 98 L79 104 L72 107 L65 107 Z" fill="${body}" stroke="${shade}" stroke-width="1.5" stroke-linejoin="round"/>
         </g>`
      : `<g class="svg-cat-common">
           <path d="M30 80 Q5 90 15 65 Q20 55 28 62" stroke="${shade}" stroke-width="9" fill="none" stroke-linecap="round"/>
           <ellipse cx="62" cy="80" rx="30" ry="26" fill="${body}" stroke="${shade}" stroke-width="1"/>
           <ellipse cx="62" cy="88" rx="18" ry="14" fill="${light}" opacity="0.5"/>
           <ellipse cx="62" cy="45" rx="28" ry="25" fill="${body}" stroke="${shade}" stroke-width="1"/>
           <path d="M42 28 L38 12 L56 22 Z" fill="${body}" stroke="${shade}" stroke-width="1"/>
           <path d="M82 28 L86 12 L68 22 Z" fill="${body}" stroke="${shade}" stroke-width="1"/>
           <path d="M44 26 L42 17 L52 23 Z" fill="${light}" opacity="0.6"/>
           <path d="M80 26 L82 17 L72 23 Z" fill="${light}" opacity="0.6"/>
           <ellipse class="cat-eye" cx="52" cy="44" rx="4" ry="6" fill="${eyeColor}"/>
           <ellipse class="cat-eye" cx="72" cy="44" rx="4" ry="6" fill="${eyeColor}"/>
           <circle cx="53" cy="42" r="1.5" fill="#fff"/><circle cx="73" cy="42" r="1.5" fill="#fff"/>
           <path d="M60 52 L62 52 L61 54 Z" fill="#e88ab0"/>
           <path d="M61 54 Q58 58 55 56 M61 54 Q64 58 67 56" stroke="${shade}" stroke-width="1" fill="none" stroke-linecap="round"/>
           <line x1="42" y1="52" x2="34" y2="50" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
           <line x1="42" y1="55" x2="33" y2="56" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
           <line x1="80" y1="52" x2="88" y2="50" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
           <line x1="80" y1="55" x2="89" y2="56" stroke="${shade}" stroke-width="0.8" opacity="0.6"/>
           <ellipse cx="50" cy="105" rx="8" ry="5" fill="${body}" stroke="${shade}" stroke-width="1"/>
           <ellipse cx="74" cy="105" rx="8" ry="5" fill="${body}" stroke="${shade}" stroke-width="1"/>
         </g>`;

  return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" ${cat.rarity === 'secret' ? 'style="filter: drop-shadow(0 0 8px #ff00ff) drop-shadow(0 0 12px #00ffff);"' : ''}>
      ${aura}
      ${catShape}
    </svg>
  `;
}