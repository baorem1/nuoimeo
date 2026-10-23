function pickRandomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateGenes() {
  const r = Math.random();
  let pool;
  
  const counts = { secret: 0, mythic: 0, legendary: 0 };
  if (state && state.cats) {
    state.cats.forEach(c => {
      if (counts[c.rarity] !== undefined) counts[c.rarity]++;
    });
  }

  const canSecret = counts.secret < RARITY_LIMITS.secret;
  const canMythic = counts.mythic < RARITY_LIMITS.mythic;
  const canLegend = counts.legendary < RARITY_LIMITS.legendary;

  if (r < 0.0001 && canSecret)      pool = SECRET_IDS;      
  else if (r < 0.002 && canMythic)  pool = MYTHIC_IDS;      
  else if (r < 0.012 && canLegend)  pool = LEGENDARY_IDS;   
  else if (r < 0.052)               pool = EPIC_IDS;        
  else if (r < 0.20)                pool = RARE_IDS;        
  else                              pool = COMMON_IDS;      

  const a1 = pickRandomFrom(pool);
  const a2 = pickRandomFrom([...COMMON_IDS, ...COMMON_IDS, ...COMMON_IDS, ...RARE_IDS]);
  return [a1, a2];
}

function getRarityFromGenes(genes) {
  const r1 = RARITY_ORDER[ALLELES[genes[0]].rarity];
  const r2 = RARITY_ORDER[ALLELES[genes[1]].rarity];
  return r1 >= r2 ? ALLELES[genes[0]].rarity : ALLELES[genes[1]].rarity;
}

function expressColor(genes) {
  const r1 = RARITY_ORDER[ALLELES[genes[0]].rarity];
  const r2 = RARITY_ORDER[ALLELES[genes[1]].rarity];
  if (r1 > r2) return genes[0];
  if (r2 > r1) return genes[1];
  return Math.random() < 0.5 ? genes[0] : genes[1];
}

function inheritGenes(a, b) {
  return [
    a.genes[Math.floor(Math.random() * 2)],
    b.genes[Math.floor(Math.random() * 2)]
  ];
}