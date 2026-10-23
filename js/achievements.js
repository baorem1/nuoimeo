const ACHIEVEMENTS = [
  { 
    id: 'cat_5', icon: '🐾', name: 'Bắt đầu nuôi', desc: 'Sở hữu 5 con mèo.', reward: 500, 
    current: (s) => s.cats.length, target: 5 
  },
  { 
    id: 'cat_20', icon: '🏠', name: 'Trại mèo', desc: 'Sở hữu 20 con mèo.', reward: 2000, 
    current: (s) => s.cats.length, target: 20 
  },
  { 
    id: 'sell_10', icon: '💰', name: 'Thương nhân', desc: 'Bán 10 con mèo.', reward: 1000, 
    current: (s) => s.stats?.catsSold || 0, target: 10 
  },
  { 
    id: 'money_10k', icon: '🤑', name: 'Đại gia', desc: 'Tích lũy 10,000 xu.', reward: 2000, 
    current: (s) => Math.floor(s.money), target: 10000 
  },
  { 
    id: 'secret_1', icon: '🌈', name: 'Kẻ may mắn', desc: 'Sở hữu 1 bé Secret.', reward: 5000, 
    current: (s) => s.cats.some(c => c.rarity === 'secret') ? 1 : 0, target: 1 
  },
  { 
    id: 'legend_1', icon: '👑', name: 'Huyền thoại', desc: 'Sở hữu 1 bé Legendary.', reward: 2000, 
    current: (s) => s.cats.some(c => c.rarity === 'legendary') ? 1 : 0, target: 1 
  }
];

// Kiểm tra xem có thành tựu nào vừa hoàn thành không
function checkAchievements() {
  if (!state.completedAch) state.completedAch = [];
  let newUnlock = false;

  ACHIEVEMENTS.forEach(ach => {
    const cur = ach.current(state);
    if (!state.completedAch.includes(ach.id) && cur >= ach.target) {
      state.completedAch.push(ach.id);
      state.money += ach.reward;
      newUnlock = true;
      showHearts(window.innerWidth / 2, window.innerHeight / 2, '🏆', 15);
      setTimeout(() => {
        alert(`🏆 MỞ KHÓA THÀNH TỰU!\n\n${ach.name}: ${ach.desc}\nNhận thưởng: ${ach.reward} xu 💰`);
      }, 300);
    }
  });

  if (newUnlock) saveGame();
}

// Mở bảng danh sách thành tựu
function openAchievements() {
  const list = document.getElementById('achievement-list');
  list.innerHTML = '';
  
  if (!state.completedAch) state.completedAch = [];

  ACHIEVEMENTS.forEach(ach => {
    const isDone = state.completedAch.includes(ach.id);
    const cur = ach.current(state);
    const target = ach.target;
    
    // Tính % thanh tiến trình (tối đa 100%)
    let percent = Math.min(100, (cur / target) * 100);
    if (isDone) percent = 100;

    // Format số cho đẹp (VD: 1,000 thay vì 1000)
    const curStr = cur.toLocaleString('vi-VN');
    const targetStr = target.toLocaleString('vi-VN');

    const div = document.createElement('div');
    div.className = `achievement-item ${isDone ? 'completed' : ''}`;
    
    div.innerHTML = `
      <div class="ach-icon">${ach.icon}</div>
      <div class="ach-info">
        <div class="ach-name">${ach.name}</div>
        <div class="ach-desc">${ach.desc}</div>
        
        <!-- Thanh Tiến Trình -->
        <div style="margin: 6px 0; font-size: 0.75em; color: #666; display: flex; justify-content: space-between;">
          <span>Tiến độ: <b>${curStr} / ${targetStr}</b></span>
          <span>${Math.floor(percent)}%</span>
        </div>
        <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">
          <div style="height: 100%; width: ${percent}%; background: linear-gradient(90deg, #ffd56b, #ff7eb6); border-radius: 4px; transition: width 0.3s;"></div>
        </div>

        <div class="ach-reward">+ ${ach.reward} xu</div>
      </div>
      <div class="ach-status ${isDone ? 'done' : ''}">${isDone ? 'Đã đạt' : 'Chưa đạt'}</div>
    `;
    list.appendChild(div);
  });

  document.getElementById('achievement-modal').classList.remove('hidden');
}