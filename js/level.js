function getExpForLevel(level) {
  if (level < 1) return 0;
  if (level > MAX_LEVEL) return Infinity;
  return LEVEL_EXP[level - 1];
}

function getCatExpGain(cat, amount) {
  const multiplier = RARITY_EXP_MULT[cat.rarity] || RARITY_EXP_MULT.common;
  return amount * multiplier;
}

function getCatPassiveExpPerHour(cat) {
  const rarity = PASSIVE_LEVEL_HOURS[cat.rarity] ? cat.rarity : 'common';
  const rarityMultiplier = RARITY_EXP_MULT[rarity] || 1;
  const equipmentMultiplier = 1 + getCatEquipmentBonus(cat, 'passiveExp');
  return getExpForLevel(MAX_LEVEL) / (PASSIVE_LEVEL_HOURS[rarity] * rarityMultiplier) * equipmentMultiplier;
}

function addExp(cat, amount) {
  if (cat.level >= MAX_LEVEL) return false;
  const gainedExp = getCatExpGain(cat, amount);
  cat.exp += gainedExp;
  cat.totalExp += gainedExp;

  let leveledUp = false;
  while (cat.level < MAX_LEVEL && cat.exp >= getExpForLevel(cat.level + 1)) {
    cat.level++;
    leveledUp = true;
  }

  if (leveledUp) {
    // KHÔNG CỘNG TIỀN Ở ĐÂY NỮA
    showLevelUpModal(cat); 
  }
  return leveledUp;
}