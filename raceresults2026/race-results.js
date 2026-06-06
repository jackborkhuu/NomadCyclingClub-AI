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
  const status = String(entry.resultStatus || '').toUpperCase();
  if (status === 'DNF' || status === 'DNS') {
    return status;
  }
  if (Number(entry.place) > 0) {
    return String(entry.place);
  }
  return '-';
}

function getDisplayTime(entry) {
  const status = String(entry.resultStatus || '').toUpperCase();
  if (status === 'DNF' || status === 'DNS') {
    return status;
  }
  if (Number(entry.elapsedMs) > 0) {
    return formatDuration(entry.elapsedMs);
  }
  return '-';
}

function getDisplayBonus(entry) {
  const bonusSeconds = Number(entry.bonusSec || 0);
  if (Number.isFinite(bonusSeconds) && bonusSeconds > 0) {
    return `-${bonusSeconds}s`;
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
    const aStatus = String(a.resultStatus || '').toUpperCase();
    const bStatus = String(b.resultStatus || '').toUpperCase();
    const aFin = aStatus !== 'DNF' && aStatus !== 'DNS' && (Number(a.place) > 0 || Number(a.elapsedMs) > 0);
    const bFin = bStatus !== 'DNF' && bStatus !== 'DNS' && (Number(b.place) > 0 || Number(b.elapsedMs) > 0);
    if (aFin && bFin) {
      const aPlace = Number(a.place) > 0 ? Number(a.place) : 99999;
      const bPlace = Number(b.place) > 0 ? Number(b.place) : 99999;
      if (aPlace !== bPlace) {
        return aPlace - bPlace;
      }
      const aElapsed = Number(a.elapsedMs) > 0 ? Number(a.elapsedMs) : Number.MAX_SAFE_INTEGER;
      const bElapsed = Number(b.elapsedMs) > 0 ? Number(b.elapsedMs) : Number.MAX_SAFE_INTEGER;
      if (aElapsed !== bElapsed) {
        return aElapsed - bElapsed;
      }
      return String(a.riderName || '').localeCompare(String(b.riderName || ''));
    }
    if (aFin) return -1;
    if (bFin) return 1;
    // Both non-finishers: DNS before DNF, then alphabetical
    const aS = aStatus;
    const bS = bStatus;
    if (aS !== bS) return aS.localeCompare(bS);
    return String(a.riderName || '').localeCompare(String(b.riderName || ''));
  });
}

function formatRefreshedAt(date) {
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function renderStages(payload, refreshedAt) {
  const stageGrid = resultsNode('publicStagesGrid');
  if (!stageGrid) {
    return;
  }

  const gcLookup = buildGcLookup(payload);
  const stageTables = Array.isArray(payload.stageTables) ? payload.stageTables : [];
  const refreshedStr = refreshedAt ? formatRefreshedAt(refreshedAt) : '';

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
              let placeCounter = 0;
              const rowsHtml = entries
                .map((entry) => {
                  const status = String(entry.resultStatus || '').toUpperCase();
                  const isFinisher = status !== 'DNF' && status !== 'DNS' && (Number(entry.place) > 0 || Number(entry.elapsedMs) > 0);
                  const displayPlace = isFinisher ? String(++placeCounter) : getDisplayPlace(entry);
                  const gc = gcLookup.get(Number(entry.bib)) || {
                    rank: Number(entry.gcRank) || null,
                    elapsedMs: Number(entry.gcElapsedMs) || null
                  };

                  return `
                    <tr>
                      <td>${escapeHtml(displayPlace)}</td>
                      <td>${entry.bib || '-'}</td>
                      <td>${escapeHtml(entry.riderName || '')}</td>
                      <td>${escapeHtml(entry.team || '')}</td>
                      <td>${escapeHtml(getDisplayTime(entry))}</td>
                      <td>${escapeHtml(getDisplayBonus(entry))}</td>
                      <td>${gc.rank ? `#${gc.rank}` : '-'}</td>
                      <td>${gc.elapsedMs ? formatDuration(gc.elapsedMs) : '-'}</td>
                    </tr>
                  `;
                })
                .join('');

              return `
                <article class="field-card">
                  <header class="field-card-head">
                    <h3>${escapeHtml(stageTable.stageName)} · ${escapeHtml(fieldName)}${refreshedStr ? `<span class="field-refreshed">Updated ${escapeHtml(refreshedStr)}</span>` : ''}</h3>
                    <p>${entries.length} racer${entries.length === 1 ? '' : 's'}</p>
                  </header>
                  <div class="field-table-wrap">
                    <table class="field-table">
                      <thead>
                        <tr>
                          <th>Place</th>
                          <th>Bib#</th>
                          <th>Name</th>
                          <th>Team</th>
                          <th>Time</th>
                          <th>Bonus</th>
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
  renderStages(payload, new Date());

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
