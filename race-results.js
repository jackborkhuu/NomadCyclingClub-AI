function resultsNode(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(ms) {
  const total = Number(ms || 0);
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

async function fetchResults(tournamentId = '') {
  const suffix = tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : '';
  const isLocalFilePreview = window.location.protocol === 'file:';
  const endpoint = isLocalFilePreview
    ? `https://www.nomadcyclingclub.com/api/race-results${suffix}`
    : `/api/race-results${suffix}`;
  const response = await fetch(endpoint);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Failed to load results (${response.status})`);
  }
  return payload;
}

  let tableFitFrame = 0;

  function fitRaceTablesToViewport() {
    const wraps = document.querySelectorAll('.race-table-wrap');
    wraps.forEach((wrap) => {
      const table = wrap.querySelector('.race-table');
      if (!table) {
        return;
      }

      table.style.transform = 'none';
      table.style.transformOrigin = 'top left';
      wrap.style.overflowX = 'hidden';
      wrap.style.overflowY = 'hidden';
      wrap.style.height = '';

      const availableWidth = wrap.clientWidth;
      const naturalWidth = table.getBoundingClientRect().width;
      if (!availableWidth || !naturalWidth || naturalWidth <= availableWidth) {
        return;
      }

      const scale = availableWidth / naturalWidth;
      table.style.transform = `scale(${scale})`;
      wrap.style.height = `${Math.ceil(table.offsetHeight * scale)}px`;
    });
  }

  function scheduleRaceTableFit() {
    if (tableFitFrame) {
      window.cancelAnimationFrame(tableFitFrame);
    }
    tableFitFrame = window.requestAnimationFrame(() => {
      fitRaceTablesToViewport();
      tableFitFrame = 0;
    });
  }

function renderTables(payload) {
  const stageBody = resultsNode('publicStageResultsBody');
  const gcBody = resultsNode('publicGcBody');
  if (!stageBody || !gcBody) {
    return;
  }

  const stageRows = [];
  (payload.stageTables || []).forEach((table) => {
    if (!table.entries.length) {
      stageRows.push(`<tr><td>${escapeHtml(table.stageName)}</td><td colspan="5" class="empty-cell">No published entries for this stage.</td></tr>`);
      return;
    }

    table.entries.forEach((entry) => {
      stageRows.push(`
        <tr>
          <td>${escapeHtml(table.stageName)}</td>
          <td>${entry.rank}</td>
          <td>${entry.bib || ''}</td>
          <td>${escapeHtml(entry.riderName)}</td>
          <td>${escapeHtml(entry.team)}</td>
          <td>${formatDuration(entry.elapsedMs)}</td>
        </tr>
      `);
    });
  });

  stageBody.innerHTML = stageRows.length
    ? stageRows.join('')
    : '<tr><td colspan="6" class="empty-cell">No published stage data available.</td></tr>';

  gcBody.innerHTML = (payload.gc || []).length
    ? payload.gc
        .map((entry) => `
          <tr>
            <td>${entry.rank}</td>
            <td>${entry.bib || ''}</td>
            <td>${escapeHtml(entry.riderName)}</td>
            <td>${escapeHtml(entry.team)}</td>
            <td>${entry.stagesCompleted}</td>
            <td>${formatDuration(entry.elapsedMs)}</td>
          </tr>
        `)
        .join('')
    : '<tr><td colspan="6" class="empty-cell">No published GC data available.</td></tr>';

    scheduleRaceTableFit();
}

function setStatus(message, isError = false) {
  const node = resultsNode('publicResultsStatus');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.classList.toggle('auth-status-error', isError);
}

function renderTournamentSelector(payload, selectedId) {
  const wrapper = resultsNode('publicTournamentSelector');
  const select = resultsNode('publicTournament');
  if (!wrapper || !select) {
    return;
  }

  const tournaments = payload.availableTournaments || [];
  if (!tournaments.length) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;
  select.innerHTML = tournaments
    .map((item) => `<option value="${escapeHtml(item.tournamentId)}" ${item.tournamentId === selectedId ? 'selected' : ''}>${escapeHtml(item.name)} (${escapeHtml(item.status || 'published')})</option>`)
    .join('');
}

async function loadAndRender(tournamentId = '') {
  const payload = await fetchResults(tournamentId);
  renderTables(payload);
  const selectedId = payload.tournament?.tournamentId || tournamentId || '';
  renderTournamentSelector(payload, selectedId);
  if (!payload.tournament) {
    setStatus('No published event results available yet.');
    return;
  }

  setStatus(`Showing published results for ${payload.tournament.name}.`);
}

document.addEventListener('DOMContentLoaded', async () => {
  const pagePath = window.location.pathname.toLowerCase();
  const isRaceResultsPage =
    pagePath.endsWith('race-results.html') ||
    pagePath.endsWith('/raceresults2026/index.html') ||
    pagePath === '/raceresults2026' ||
    pagePath === '/raceresults2026/';
  if (!isRaceResultsPage) {
    return;
  }

  const selector = resultsNode('publicTournament');
  const refreshBtn = resultsNode('publicRefreshBtn');

  const refresh = async () => {
    const selected = selector ? selector.value : '';
    try {
      await loadAndRender(selected);
    } catch (error) {
      setStatus(error.message || 'Unable to load public event results.', true);
    }
  };

  selector?.addEventListener('change', refresh);
  refreshBtn?.addEventListener('click', refresh);
  window.addEventListener('resize', scheduleRaceTableFit);

  await refresh();
  scheduleRaceTableFit();
  window.setInterval(refresh, 15000);
});
