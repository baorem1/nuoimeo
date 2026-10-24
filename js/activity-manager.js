let activeActivityTab = 'expedition';

function isActivityManagerOpen(tab = null) {
  const modal = document.getElementById('activity-manager-modal');
  return Boolean(
    modal &&
    !modal.classList.contains('hidden') &&
    (tab === null || activeActivityTab === tab)
  );
}

function updateActivityManagerSummary() {
  const cats = state.cats || [];
  const away = cats.filter(cat =>
    cat.expedition?.status === 'away' ||
    cat.mouseHunt?.status === 'away' ||
    cat.mazeTrip?.status === 'away'
  ).length;
  const ready = cats.filter(cat =>
    cat.expedition?.status === 'ready' ||
    cat.mouseHunt?.status === 'ready' ||
    cat.mazeTrip?.status === 'ready'
  ).length;
  const home = cats.filter(cat =>
    !cat.expedition && !cat.mouseHunt && !cat.mazeTrip && !cat.inFarm
  ).length;

  document.getElementById('activity-count-home').textContent = home;
  document.getElementById('activity-count-away').textContent = away;
  document.getElementById('activity-count-ready').textContent = ready;
}

function openActivityManager(tab, selectedCatId = null) {
  activeActivityTab = tab;
  if (tab === 'expedition') {
    processExpeditions();
    renderExpeditions(selectedCatId);
  } else if (tab === 'mouse-hunt') {
    processMouseHunts();
    renderMouseHunts(selectedCatId);
  } else if (tab === 'maze') {
    processMazeTrips();
    renderMazeTrips(selectedCatId);
  } else {
    throw new Error(`Unknown cat activity tab: ${tab}`);
  }

  document.querySelectorAll('[data-activity-tab]').forEach(button => {
    const selected = button.dataset.activityTab === tab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll('.activity-manager-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `activity-panel-${tab}`);
  });
  updateActivityManagerSummary();
  document.getElementById('activity-manager-modal').classList.remove('hidden');
}

function initActivityManager() {
  document.querySelectorAll('[data-activity-tab]').forEach(button => {
    button.addEventListener('click', () => openActivityManager(button.dataset.activityTab));
  });

  document.getElementById('btn-activity-manager-close').addEventListener('click', () => {
    document.getElementById('activity-manager-modal').classList.add('hidden');
  });
}
