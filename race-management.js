const RaceAdminState = {
  canManage: false,
  tournaments: [],
  stages: [],
  riders: [],
  results: [],
  activeTournamentId: '',
  refreshTimer: null
};

let raceAdminInitialized = false;

function raceNode(id) {
  return document.getElementById(id);
}

function isRaceManagementPage() {
  const path = window.location.pathname.toLowerCase();
  return path.endsWith('/race-management.html')
    || path.endsWith('race-management.html')
    || path.endsWith('/race-management')
    || path.endsWith('race-management');
}

function setRaceAuthMessage(message, isError = false) {
  const node = raceNode('raceAuthMessage');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.classList.toggle('auth-status-error', isError);
}

function setRaceGateVisible(visible) {
  const gate = raceNode('raceAuthGate');
  if (gate) {
    gate.hidden = !visible;
  }

  const heading = document.querySelector('.lounge-heading');
  if (heading) {
    heading.hidden = visible;
  }

  const section = raceNode('raceSection');
  if (section) {
    section.hidden = visible;
  }
}

async function loadEasyAuthPrincipal() {
  const response = await fetch('/.auth/me', {
    credentials: 'include'
  });
  if (!response.ok) {
    return null;
  }

  const identities = await response.json();
  const principal = Array.isArray(identities)
    ? (identities[0] ? identities[0].clientPrincipal : null)
    : (identities && identities.clientPrincipal ? identities.clientPrincipal : null);

  return principal || null;
}

function setupRaceLogoutButton() {
  const logoutButton = raceNode('raceLogoutBtn');
  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener('click', () => {
    const postLogoutUri = encodeURIComponent(`${window.location.origin}/`);
    window.location.assign(`/.auth/logout?post_logout_redirect_uri=${postLogoutUri}`);
  });
}

function setRaceStatus(message, isError = false) {
  const status = raceNode('raceAdminStatus');
  if (!status) {
    return;
  }
  status.textContent = message;
  status.classList.toggle('auth-status-error', isError);
}

function formatDuration(ms) {
  const total = Number(ms || 0);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function escapeHtml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function raceApi(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
}

function canManageRace(config) {
  if (typeof config?.canManageRace === 'boolean') {
    return config.canManageRace;
  }
  // Backward compatibility for older API responses.
  return Boolean(config?.canManageBoard);
}

function getActiveTournament() {
  return RaceAdminState.tournaments.find((item) => item.tournamentId === RaceAdminState.activeTournamentId) || null;
}

function getActiveTournamentCategories() {
  const tournament = getActiveTournament();
  if (!tournament || !Array.isArray(tournament.categories) || !tournament.categories.length) {
    return ['Under 40 Men', '40+ Men', 'Women', '50+ Men'];
  }
  return tournament.categories;
}

function setFormDisabled(formId, disabled) {
  const form = raceNode(formId);
  if (!form) {
    return;
  }

  [...form.elements].forEach((element) => {
    element.disabled = disabled;
  });
}

function setTournamentEditLock() {
  const tournament = getActiveTournament();
  const isClosed = Boolean(tournament && tournament.status === 'closed');

  setFormDisabled('stageForm', isClosed);
  setFormDisabled('riderForm', isClosed);
  setFormDisabled('resultForm', isClosed);

  const publishButton = raceNode('publishTournamentBtn');
  const closeButton = raceNode('closeTournamentBtn');
  if (publishButton) {
    publishButton.disabled = isClosed;
  }
  if (closeButton) {
    closeButton.disabled = isClosed;
  }

  if (isClosed) {
    setRaceStatus('This tournament is closed. Data entry and edits are locked.', true);
  }
}

function renderCategoryOptions() {
  const categorySelect = raceNode('riderCategory');
  if (!categorySelect) {
    return;
  }

  const categories = getActiveTournamentCategories();
  categorySelect.innerHTML = [`<option value="">Category</option>`]
    .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
    .join('');
}

function refreshTournamentSelect() {
  const select = raceNode('activeTournament');
  if (!select) {
    return;
  }

  if (RaceAdminState.tournaments.length === 0) {
    select.innerHTML = '<option value="">No tournaments yet</option>';
    RaceAdminState.activeTournamentId = '';
    return;
  }

  if (!RaceAdminState.activeTournamentId || !RaceAdminState.tournaments.some((t) => t.tournamentId === RaceAdminState.activeTournamentId)) {
    RaceAdminState.activeTournamentId = RaceAdminState.tournaments[0].tournamentId;
  }

  select.innerHTML = RaceAdminState.tournaments
    .map((t) => `<option value="${escapeHtml(t.tournamentId)}" ${t.tournamentId === RaceAdminState.activeTournamentId ? 'selected' : ''}>${escapeHtml(t.name)} (${escapeHtml(t.status || 'draft')})</option>`)
    .join('');
}

function renderStages() {
  const tbody = raceNode('stageTableBody');
  const stageSelect = raceNode('resultStage');
  if (!tbody || !stageSelect) {
    return;
  }

  const stages = RaceAdminState.stages
    .filter((s) => s.tournamentId === RaceAdminState.activeTournamentId)
    .sort((a, b) => Number(a.stageOrder || 0) - Number(b.stageOrder || 0));

  if (stages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">No stages configured.</td></tr>';
    stageSelect.innerHTML = '<option value="">No stages</option>';
    return;
  }

  tbody.innerHTML = stages
    .map((stage) => `
      <tr>
        <td>${Number(stage.stageOrder || 0)}</td>
        <td>${escapeHtml(stage.stageName)}</td>
        <td>${escapeHtml(stage.startTimePst || '')}</td>
        <td>${escapeHtml(stage.notes || '')}</td>
      </tr>
    `)
    .join('');

  stageSelect.innerHTML = stages
    .map((stage) => `<option value="${escapeHtml(stage.stageId)}">${escapeHtml(stage.stageName)} (Stage ${Number(stage.stageOrder || 0)})</option>`)
    .join('');
}

function renderRiders() {
  const tbody = raceNode('riderTableBody');
  const riderSelect = raceNode('resultRider');
  if (!tbody || !riderSelect) {
    return;
  }

  const riders = RaceAdminState.riders
    .filter((r) => r.tournamentId === RaceAdminState.activeTournamentId)
    .sort((a, b) => Number(a.riderNumber || 0) - Number(b.riderNumber || 0));

  if (riders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No riders registered.</td></tr>';
    riderSelect.innerHTML = '<option value="">No riders</option>';
    return;
  }

  tbody.innerHTML = riders
    .map((rider) => `
      <tr>
        <td>${Number(rider.riderNumber || 0)}</td>
        <td>${escapeHtml(rider.name)}</td>
        <td>${escapeHtml(rider.fieldName || '')}</td>
        <td>${escapeHtml(rider.state || '')}</td>
        <td>${escapeHtml(rider.team || '')}</td>
        <td>${escapeHtml(rider.gender || '')}</td>
        <td>${Number(rider.age || 0)}</td>
        <td>${escapeHtml(rider.category || '')}</td>
      </tr>
    `)
    .join('');

  riderSelect.innerHTML = riders
    .map((rider) => `<option value="${escapeHtml(rider.riderId)}">#${Number(rider.riderNumber || 0)} - ${escapeHtml(rider.name)}</option>`)
    .join('');
}

function renderScoreboards(scoreboard) {
  const stageBody = raceNode('stageResultsTableBody');
  const gcBody = raceNode('gcTableBody');
  if (!stageBody || !gcBody) {
    return;
  }

  const stageRows = [];
  (scoreboard.stageTables || []).forEach((table) => {
    if (!table.entries.length) {
      stageRows.push(`<tr><td>${escapeHtml(table.stageName)}</td><td colspan="6" class="empty-cell">No results yet.</td></tr>`);
      return;
    }

    table.entries.forEach((entry) => {
      stageRows.push(`
        <tr>
          <td>${escapeHtml(table.stageName)}</td>
          <td>${entry.rank}</td>
          <td>${escapeHtml(entry.riderName)}</td>
          <td>${escapeHtml(entry.team)}</td>
          <td>${escapeHtml(entry.finishTimestamp || '')}</td>
          <td>${escapeHtml(entry.stopwatch || '')}</td>
          <td>${formatDuration(entry.elapsedMs)}</td>
        </tr>
      `);
    });
  });

  stageBody.innerHTML = stageRows.length
    ? stageRows.join('')
    : '<tr><td colspan="7" class="empty-cell">No stage results yet.</td></tr>';

  gcBody.innerHTML = (scoreboard.gc || []).length
    ? scoreboard.gc
        .map((entry) => `
          <tr>
            <td>${entry.rank}</td>
            <td>${escapeHtml(entry.riderName)}</td>
            <td>${escapeHtml(entry.team)}</td>
            <td>${entry.stagesCompleted}</td>
            <td>${formatDuration(entry.elapsedMs)}</td>
          </tr>
        `)
        .join('')
    : '<tr><td colspan="5" class="empty-cell">No GC standings yet.</td></tr>';
}

async function loadDataset() {
  if (!RaceAdminState.activeTournamentId) {
    renderStages();
    renderRiders();
    renderScoreboards({ stageTables: [], gc: [] });
    return;
  }

  const dataset = await raceApi(`/api/race-admin/dataset?tournamentId=${encodeURIComponent(RaceAdminState.activeTournamentId)}`);
  RaceAdminState.stages = dataset.stages || [];
  RaceAdminState.riders = dataset.riders || [];
  RaceAdminState.results = dataset.results || [];

  renderStages();
  renderRiders();

  const scoreboard = await raceApi(`/api/race-admin/scoreboard?tournamentId=${encodeURIComponent(RaceAdminState.activeTournamentId)}`);
  renderScoreboards(scoreboard);
  renderCategoryOptions();
  setTournamentEditLock();
}

async function loadTournaments() {
  const dataset = await raceApi('/api/race-admin/dataset');
  RaceAdminState.tournaments = dataset.tournaments || [];
  refreshTournamentSelect();
  await loadDataset();
}

function getFormValue(id) {
  const node = raceNode(id);
  return node ? node.value : '';
}

function clearForm(id) {
  const form = raceNode(id);
  if (form) {
    form.reset();
  }
}

function setupRaceForms() {
  raceNode('activeTournament')?.addEventListener('change', async (event) => {
    RaceAdminState.activeTournamentId = event.target.value;
    await loadDataset();
  });

  raceNode('refreshTournamentData')?.addEventListener('click', async () => {
    setRaceStatus('Refreshing race data...');
    await loadTournaments();
    setRaceStatus('Race data refreshed.');
  });

  raceNode('tournamentForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = getFormValue('tournamentName').trim();
    if (!name) {
      return;
    }

    setRaceStatus('Creating tournament...');
    await raceApi('/api/race-admin/createTournament', {
      method: 'POST',
      body: JSON.stringify({
        name,
        categories: getFormValue('tournamentCategories').trim().split(',').map((item) => item.trim()).filter(Boolean)
      })
    });

    clearForm('tournamentForm');
    await loadTournaments();
    setRaceStatus('Tournament created.');
  });

  raceNode('stageForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!RaceAdminState.activeTournamentId) {
      setRaceStatus('Create and select a tournament first.', true);
      return;
    }
    if (getActiveTournament()?.status === 'closed') {
      setRaceStatus('This tournament is closed. No additional stage edits are allowed.', true);
      return;
    }

    setRaceStatus('Adding stage...');
    await raceApi('/api/race-admin/createStage', {
      method: 'POST',
      body: JSON.stringify({
        tournamentId: RaceAdminState.activeTournamentId,
        stageName: getFormValue('stageName').trim(),
        stageOrder: Number(getFormValue('stageOrder')),
        startTimePst: getFormValue('stageStartPst'),
        notes: getFormValue('stageNotes').trim()
      })
    });

    clearForm('stageForm');
    await loadDataset();
    setRaceStatus('Stage added.');
  });

  raceNode('riderForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!RaceAdminState.activeTournamentId) {
      setRaceStatus('Create and select a tournament first.', true);
      return;
    }
    if (getActiveTournament()?.status === 'closed') {
      setRaceStatus('This tournament is closed. No additional rider registration is allowed.', true);
      return;
    }

    setRaceStatus('Registering rider...');
    await raceApi('/api/race-admin/registerRider', {
      method: 'POST',
      body: JSON.stringify({
        tournamentId: RaceAdminState.activeTournamentId,
        name: getFormValue('riderName').trim(),
        state: getFormValue('riderState').trim(),
        team: getFormValue('riderTeam').trim(),
        fieldName: getFormValue('riderFieldName').trim(),
        gender: getFormValue('riderGender'),
        age: Number(getFormValue('riderAge')),
        category: getFormValue('riderCategory')
      })
    });

    clearForm('riderForm');
    await loadDataset();
    setRaceStatus('Rider registered. Rider ID auto-assigned.');
  });

  raceNode('syncGoogleRegistrationsBtn')?.addEventListener('click', async () => {
    if (!RaceAdminState.activeTournamentId) {
      setRaceStatus('Create and select a tournament first.', true);
      return;
    }
    if (getActiveTournament()?.status === 'closed') {
      setRaceStatus('This tournament is closed. Registration sync is disabled.', true);
      return;
    }

    setRaceStatus('Importing riders from Google registrations...');
    const result = await raceApi('/api/race-admin/syncGoogleRegistrations', {
      method: 'POST',
      body: JSON.stringify({
        tournamentId: RaceAdminState.activeTournamentId
      })
    });

    await loadDataset();
    const summary = result.summary || {};
    setRaceStatus(`Google import complete. Added ${Number(summary.added || 0)} new riders, skipped duplicates ${Number(summary.duplicates || 0)}, invalid rows ${Number(summary.invalid || 0)}.`);
  });

  raceNode('resultForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!RaceAdminState.activeTournamentId) {
      setRaceStatus('Create and select a tournament first.', true);
      return;
    }
    if (getActiveTournament()?.status === 'closed') {
      setRaceStatus('This tournament is closed. No additional result edits are allowed.', true);
      return;
    }

    setRaceStatus('Saving stage result...');
    await raceApi('/api/race-admin/addResult', {
      method: 'POST',
      body: JSON.stringify({
        tournamentId: RaceAdminState.activeTournamentId,
        stageId: getFormValue('resultStage'),
        riderId: getFormValue('resultRider'),
        finishTimestamp: getFormValue('resultFinishStamp'),
        stopwatch: getFormValue('resultStopwatch').trim(),
        elapsedMs: Number(getFormValue('resultElapsedMs'))
      })
    });

    clearForm('resultForm');
    await loadDataset();
    setRaceStatus('Result saved. Stage and GC tables updated.');
  });

  raceNode('publishTournamentBtn')?.addEventListener('click', async () => {
    if (!RaceAdminState.activeTournamentId) {
      setRaceStatus('Select a tournament first.', true);
      return;
    }

    setRaceStatus('Publishing tournament results...');
    await raceApi('/api/race-admin/publishTournament', {
      method: 'POST',
      body: JSON.stringify({
        tournamentId: RaceAdminState.activeTournamentId
      })
    });
    await loadTournaments();
    setRaceStatus('Published. Public results page now serves this race snapshot.');
  });

  raceNode('closeTournamentBtn')?.addEventListener('click', async () => {
    if (!RaceAdminState.activeTournamentId) {
      setRaceStatus('Select a tournament first.', true);
      return;
    }

    setRaceStatus('Closing tournament and archiving as read-only...');
    await raceApi('/api/race-admin/closeTournament', {
      method: 'POST',
      body: JSON.stringify({
        tournamentId: RaceAdminState.activeTournamentId
      })
    });
    await loadTournaments();
    setRaceStatus('Tournament closed and archived. Data entry and edits are now disabled.');
  });
}

async function initRaceManagement() {
  if (raceAdminInitialized) {
    return;
  }

  const app = raceNode('raceAdminApp');
  const status = raceNode('raceAdminStatus');
  if (!app || !status) {
    return;
  }

  if (isRaceManagementPage()) {
    setRaceGateVisible(true);
    setRaceAuthMessage('Sign in with your Microsoft 365 account to continue.');
  }

  try {
    const config = await raceApi('/api/race-admin/config');
    if (!canManageRace(config)) {
      app.hidden = true;
      if (isRaceManagementPage()) {
        setRaceGateVisible(true);
        setRaceAuthMessage('Your account is signed in but is not in the RaceDirectors group.', true);
      }
      setRaceStatus('Race management is available to members of the RaceDirectors group.', true);
      return;
    }

    if (isRaceManagementPage()) {
      const principal = await loadEasyAuthPrincipal();
      const identity = raceNode('raceManagerIdentity');
      if (identity && principal && principal.userDetails) {
        identity.textContent = `Signed in as ${principal.userDetails}`;
      }
      setRaceGateVisible(false);
      setupRaceLogoutButton();
    }

    setRaceStatus('RaceDirectors access granted. Loading race management...');
    app.hidden = false;
    await raceApi('/api/race-admin/bootstrap');
    setupRaceForms();
    await loadTournaments();
    raceAdminInitialized = true;
    setRaceStatus('Race management ready. Data is stored in SharePoint list NomadRaceData.');

    if (RaceAdminState.refreshTimer) {
      window.clearInterval(RaceAdminState.refreshTimer);
    }
    RaceAdminState.refreshTimer = window.setInterval(async () => {
      try {
        await loadDataset();
      } catch {
        // Silent background refresh errors keep UI responsive.
      }
    }, 8000);
  } catch (error) {
    app.hidden = true;
    if (isRaceManagementPage()) {
      setRaceGateVisible(true);
      const raw = String(error.message || 'Unable to load race management.');
      const isAuthError = /unauthenticated|sign in first/i.test(raw);
      setRaceAuthMessage(
        isAuthError
          ? 'Please sign in with your Microsoft 365 account to access Race Management.'
          : raw,
        true
      );
    }
    setRaceStatus(error.message || 'Unable to load race management.', true);
  }
}

window.NomadRaceAdmin = {
  init: initRaceManagement
};

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.toLowerCase();
  const onClubLounge = path.endsWith('/club-lounge.html')
    || path.endsWith('club-lounge.html')
    || path.endsWith('/club-lounge')
    || path.endsWith('club-lounge');
  const onRaceManagement = isRaceManagementPage();
  if (!onClubLounge && !onRaceManagement) {
    return;
  }
  initRaceManagement();
});
