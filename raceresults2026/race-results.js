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
  if (!Number.isFinite(total) || total <= 0) {
    return '-';
  }
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor((total % 3600000) / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

async function fetchResults(tournamentId = '') {
  const suffix = tournamentId ? `?tournamentId=${encodeURIComponent(tournamentId)}` : '';
  const response = await fetch(`/api/race-results${suffix}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Failed to load results (${response.status})`);
  }
  return payload;
}

function getDisplayPlace(entry) {
  if (Number(entry.place) > 0) {
    return String(entry.place);
  }
  const status = String(entry.resultStatus || '').toUpperCase();
  if (status === 'DNF' || status === 'DNS') {
    return status;
  }
  return '-';
}

function getDisplayTime(entry) {
  if (Number(entry.elapsedMs) > 0) {
    return formatDuration(entry.elapsedMs);
  }
  const status = String(entry.resultStatus || '').toUpperCase();
  if (status === 'DNF' || status === 'DNS') {
    return status;
  }
  return '-';
}

function buildGcLookup(payload) {
  const lookup = new Map();
  (payload.gc || []).forEach((entry) => {
    lookup.set(Number(entry.bib), {
      rank: Number(entry.rank) || null,
      elapsedMs: Number(entry.elapsedMs) || null
    });
  });
  return lookup;
}

function groupByField(entries) {
  const groups = new Map();
  entries.forEach((entry) => {
    const fieldName = String(entry.fieldName || 'Uncategorized').trim() || 'Uncategorized';
    if (!groups.has(fieldName)) {
      groups.set(fieldName, []);
    }
    groups.get(fieldName).push(entry);
  });
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const aPlace = Number(a.place) > 0 ? Number(a.place) : 99999;
    const bPlace = Number(b.place) > 0 ? Number(b.place) : 99999;
    if (aPlace !== bPlace) {
      return aPlace - bPlace;
    }
    return String(a.riderName || '').localeCompare(String(b.riderName || ''));
  });
}

function renderStages(payload) {
  const stageGrid = resultsNode('publicStagesGrid');
  if (!stageGrid) {
    return;
  }

  const gcLookup = buildGcLookup(payload);
  const stageTables = Array.isArray(payload.stageTables) ? payload.stageTables : [];

  if (!stageTables.length) {
    stageGrid.innerHTML = '<section class="stage-card"><p class="empty-cell">No published stage data available.</p></section>';
    return;
  }

  stageGrid.innerHTML = stageTables
    .map((stageTable) => {
      const fieldGroups = groupByField(sortEntries(stageTable.entries || []));

      const fieldTablesHtml = fieldGroups.length
        ? fieldGroups
            .map(([fieldName, entries]) => {
              const rowsHtml = entries
                .map((entry) => {
                  const gc = gcLookup.get(Number(entry.bib)) || {
                    rank: Number(entry.gcRank) || null,
                    elapsedMs: Number(entry.gcElapsedMs) || null
                  };

                  return `
                    <tr>
                      <td>${escapeHtml(getDisplayPlace(entry))}</td>
                      <td>${escapeHtml(entry.riderName || '')}</td>
                      <td>${escapeHtml(entry.team || '')}</td>
                      <td>${escapeHtml(getDisplayTime(entry))}</td>
                      <td>${gc.rank ? `#${gc.rank}` : '-'}</td>
                      <td>${gc.elapsedMs ? formatDuration(gc.elapsedMs) : '-'}</td>
                    </tr>
                  `;
                })
                .join('');

              return `
                <article class="field-card">
                  <header class="field-card-head">
                    <h3>${escapeHtml(fieldName)}</h3>
                    <p>${entries.length} racer${entries.length === 1 ? '' : 's'}</p>
                  </header>
                  <div class="field-table-wrap">
                    <table class="field-table">
                      <thead>
                        <tr>
                          <th>Place</th>
                          <th>Name</th>
                          <th>Team</th>
                          <th>Time</th>
                          <th>GC</th>
                          <th>GC Total</th>
                        </tr>
                      </thead>
                      <tbody>${rowsHtml}</tbody>
                    </table>
                  </div>
                </article>
              `;
            })
            .join('')
        : '<article class="field-card"><p class="empty-cell">No entries for this stage.</p></article>';

      return `
        <section class="stage-card">
          <header class="stage-card-head">
            <h2>${escapeHtml(stageTable.stageName || 'Stage')}</h2>
          </header>
          <div class="field-grid">${fieldTablesHtml}</div>
        </section>
      `;
    })
    .join('');
}

function setStatus(message, isError = false) {
  const node = resultsNode('publicResultsStatus');
  if (!node) {
    return;
  }
  node.textContent = message;
  node.classList.toggle('auth-status-error', isError);
}

async function loadAndRender(tournamentId = '') {
  const payload = await fetchResults(tournamentId);
  renderStages(payload);

  if (!payload.tournament) {
    setStatus('No published race results available yet.');
    return;
  }

  setStatus(`Showing published results for ${payload.tournament.name}.`);
}

document.addEventListener('DOMContentLoaded', async () => {
  const pagePath = window.location.pathname.toLowerCase();
  const isRaceResultsPage = pagePath.endsWith('race-results.html') || pagePath === '/raceresults2026' || pagePath === '/raceresults2026/';
  if (!isRaceResultsPage) {
    return;
  }

  const refresh = async () => {
    try {
      await loadAndRender('');
    } catch (error) {
      setStatus(error.message || 'Unable to load public race results.', true);
    }
  };

  await refresh();
  window.setInterval(refresh, 15000);
});
