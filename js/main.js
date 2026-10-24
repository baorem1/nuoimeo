function init() {
  loadGame();
  processPremiumCatShop();
  processStrayCatHunt();
  updateAllCats();
  checkDailyLogin();
  initActivityManager();
  // Thêm 2 dòng này vào đầu hàm init()
  document.getElementById('btn-achievement').addEventListener('click', openAchievements);
  document.getElementById('btn-achievement-close').addEventListener('click', () => document.getElementById('achievement-modal').classList.add('hidden'));
  // Gắn sự kiện mở các Modal
  document.getElementById('btn-daily').addEventListener('click', openDailyModal);
  document.getElementById('btn-reset').addEventListener('click', resetGame);
  document.getElementById('btn-collection').addEventListener('click', openCollection);
  document.getElementById('btn-stray-cat-hunt').addEventListener('click', openStrayCatHunt);
  document.getElementById('btn-stray-hunt-close').addEventListener('click', () => document.getElementById('stray-cat-hunt-modal').classList.add('hidden'));
  document.getElementById('btn-diary-close').addEventListener('click', () => document.getElementById('diary-modal').classList.add('hidden'));
  document.getElementById('btn-shop').addEventListener('click', openShop); // Nút mở Shop
  document.getElementById('btn-auction').addEventListener('click', openAuctionModal);
  document.getElementById('btn-auction-close').addEventListener('click', () => document.getElementById('auction-modal').classList.add('hidden'));
  document.getElementById('btn-expedition').addEventListener('click', () => openExpeditionModal());
  document.getElementById('btn-maze').addEventListener('click', () => openMazeModal());
  document.getElementById('btn-activity-manager').addEventListener('click', () => openActivityManager('expedition'));
  document.getElementById('btn-farm').addEventListener('click', openFarm);
  document.getElementById('btn-farm-play').addEventListener('click', toggleFarmPlay);
  document.getElementById('btn-farm-close').addEventListener('click', closeFarm);
  document.getElementById('btn-inventory').addEventListener('click', openInventory);
  document.getElementById('btn-inventory-close').addEventListener('click', () => document.getElementById('inventory-modal').classList.add('hidden'));
  // Gắn sự kiện Đóng
  document.getElementById('btn-daily-close').addEventListener('click', () => document.getElementById('daily-modal').classList.add('hidden'));
  document.getElementById('btn-daily-claim').addEventListener('click', claimDailyReward);
  
  document.getElementById('btn-shop-close').addEventListener('click', () => document.getElementById('shop-modal').classList.add('hidden'));
  document.getElementById('btn-buy-action').addEventListener('click', buyCat);
  document.getElementById('btn-cat-roll-close').addEventListener('click', closeCatRoll);
  document.getElementById('tab-buy').addEventListener('click', () => switchShopTab('buy'));
  document.getElementById('tab-sell').addEventListener('click', () => switchShopTab('sell'));
  document.getElementById('tab-items').addEventListener('click', () => switchShopTab('items'));
  document.getElementById('btn-bulk-confirm').addEventListener('click', confirmBulkSell);

  document.getElementById('btn-collection-close').addEventListener('click', () => document.getElementById('collection-modal').classList.add('hidden'));
  document.getElementById('btn-breed-cancel').addEventListener('click', () => document.getElementById('breed-modal').classList.add('hidden'));
  document.getElementById('btn-result-close').addEventListener('click', () => document.getElementById('result-modal').classList.add('hidden'));
  document.getElementById('btn-levelup-close').addEventListener('click', () => document.getElementById('levelup-modal').classList.add('hidden'));

  // Khởi tạo màn hình chào mừng
  if (state.cats.length === 0 && (!state.auctions || state.auctions.length === 0)) {
    document.getElementById('welcome-modal').classList.remove('hidden');
    document.getElementById('btn-adopt').addEventListener('click', () => {
      const cat = createRandomCat();
      state.cats.push(cat);
      addToCollection(cat.rarity);
      saveGame();
      document.getElementById('welcome-modal').classList.add('hidden');
      document.getElementById('game').classList.remove('hidden');
      render();
    });
  } else {
    document.getElementById('welcome-modal').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    render();
  }

  // Vòng lặp tự động update
  const updateInterval = window.matchMedia('(max-width: 600px)').matches ? 15000 : 5000;
  setInterval(() => {
    updateAllCats();
    processAuctions();
    processExpeditions();
    processMouseHunts();
    processMazeTrips();
    processStrayCatHunt();
    processPremiumCatShop();
    saveGame();
    render();
  }, updateInterval);

  window.addEventListener('beforeunload', () => saveGame());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveGame();
    else {
      updateAllCats();
      processAuctions();
      processExpeditions();
      processMouseHunts();
      processMazeTrips();
      processStrayCatHunt();
      processPremiumCatShop();
      saveGame();
      render();
    }
  });
}

init();