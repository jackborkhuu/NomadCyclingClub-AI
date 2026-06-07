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

function formatDurationHms(ms) {
  const total = Number(ms || 0);
  if (!Number.isFinite(total) || total <= 0) {
    return '-';
  }
  const totalSeconds = Math.floor(total / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatBonusSeconds(seconds) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) {
    return '-';
  }
  return `-${total}s`;
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

function getDisplayRawTime(entry) {
  const status = String(entry.resultStatus || '').toUpperCase();
  if (status === 'DNF' || status === 'DNS') {
    return status;
  }
  const elapsedMs = Number(entry.elapsedMs || 0);
  if (elapsedMs > 0) {
    const bonusMs = Math.max(0, Number(entry.bonusSec || 0)) * 1000;
    return formatDuration(elapsedMs + bonusMs);
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

function normalizeResultStatus(entry) {
  const status = String(entry?.resultStatus || '').toUpperCase();
  if (status === 'DNF' || status === 'DNS') {
    return status;
  }
  if (Number(entry?.elapsedMs) > 0) {
    return 'FIN';
  }
  return status || 'NO_TIME';
}

function buildGeneralClassificationByField(stageTables) {
  const stagesWithData = stageTables.filter((stageTable) => Array.isArray(stageTable?.entries) && stageTable.entries.length > 0);
  const gcStageLabels = ['Road', 'TT', 'Mountain'];
  const orderedStages = [...stagesWithData]
    .sort((a, b) => Number(a?.stageOrder || 0) - Number(b?.stageOrder || 0))
    .slice(0, 3)
    .map((stageTable, idx) => ({
      id: String(stageTable?.stageId || `stage-${idx + 1}`),
      label: gcStageLabels[idx] || `Stage ${idx + 1}`
    }));
  const allowedStageIds = new Set(orderedStages.map((stage) => stage.id));
  const ridersByBib = new Map();

  stagesWithData.forEach((stageTable) => {
    const currentStageId = String(stageTable?.stageId || '');
    stageTable.entries.forEach((entry) => {
      const bib = Number(entry?.bib || 0);
      if (bib <= 0) {
        return;
      }

      const rider = ridersByBib.get(bib) || {
        bib,
        riderName: String(entry?.riderName || '').trim(),
        team: String(entry?.team || '').trim(),
        fieldName: String(entry?.fieldName || '').trim() || 'Uncategorized',
        elapsedMs: 0,
        bonusSecTotal: 0,
        stagesCompleted: 0,
        gcStatus: 'NO_DATA',
        stageElapsedMs: {}
      };

      if (!rider.riderName) {
        rider.riderName = String(entry?.riderName || '').trim();
      }
      if (!rider.team) {
        rider.team = String(entry?.team || '').trim();
      }
      if (!rider.fieldName) {
        rider.fieldName = String(entry?.fieldName || '').trim() || 'Uncategorized';
      }

      const status = normalizeResultStatus(entry);
      if (status === 'DNS' || status === 'DNF') {
        rider.gcStatus = 'OUT';
      } else if (Number(entry?.elapsedMs) > 0 && rider.gcStatus !== 'OUT') {
        rider.gcStatus = 'ACTIVE';
        rider.elapsedMs += Number(entry.elapsedMs);
        rider.bonusSecTotal += Math.max(0, Number(entry?.bonusSec || 0));
        rider.stagesCompleted += 1;
        if (allowedStageIds.has(currentStageId)) {
          rider.stageElapsedMs[currentStageId] = Number(entry.elapsedMs);
        }
      }

      ridersByBib.set(bib, rider);
    });
  });

  const groups = new Map();
  ridersByBib.forEach((rider) => {
    const field = rider.fieldName || 'Uncategorized';
    if (!groups.has(field)) {
      groups.set(field, []);
    }
    groups.get(field).push(rider);
  });

  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fieldName, riders]) => {
      const active = riders
        .filter((rider) => rider.gcStatus === 'ACTIVE')
        .sort((a, b) => {
          if (a.stagesCompleted !== b.stagesCompleted) {
            return b.stagesCompleted - a.stagesCompleted;
          }
          if (a.elapsedMs !== b.elapsedMs) {
            return a.elapsedMs - b.elapsedMs;
          }
          return a.bib - b.bib;
        });

      const noData = riders
        .filter((rider) => rider.gcStatus === 'NO_DATA')
        .sort((a, b) => {
          return a.bib - b.bib;
        });

      const out = riders
        .filter((rider) => rider.gcStatus === 'OUT')
        .sort((a, b) => {
          return a.bib - b.bib;
        });

      const rankedRows = [...active, ...noData, ...out].map((rider, index) => ({
        ...rider,
        rank: index + 1
      }));

      return { fieldName, rows: rankedRows };
    })
    .map((table) => ({ ...table, stageColumns: orderedStages }));
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

function resolvePublishedMeta(payload) {
  const candidates = [
    { source: 'payload.publishedAt', value: payload?.publishedAt },
    { source: 'payload.updatedAt', value: payload?.updatedAt },
    { source: 'payload.tournament.publishedAt', value: payload?.tournament?.publishedAt },
    { source: 'payload.tournament.updatedAt', value: payload?.tournament?.updatedAt }
  ];

  for (const candidate of candidates) {
    if (!candidate.value) {
      continue;
    }
    const parsed = new Date(candidate.value);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        source: candidate.source,
        raw: String(candidate.value),
        date: parsed
      };
    }
  }

  return null;
}

function renderStages(payload, refreshedAt) {
  const stageGrid = resultsNode('publicStagesGrid');
  if (!stageGrid) {
    return;
  }

  const stageTables = Array.isArray(payload.stageTables) ? payload.stageTables : [];
  const gcTables = buildGeneralClassificationByField(stageTables);
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
              const stageColGroup = `
                <colgroup>
                  <col style="width:7%" />
                  <col style="width:7%" />
                  <col style="width:27%" />
                  <col style="width:18%" />
                  <col style="width:16%" />
                  <col style="width:8%" />
                  <col style="width:17%" />
                </colgroup>
              `;

              const rowsHtml = entries
                .map((entry) => {
                  const displayPlace = getDisplayPlace(entry);

                  return `
                    <tr>
                      <td>${escapeHtml(displayPlace)}</td>
                      <td>${entry.bib || '-'}</td>
                      <td>${escapeHtml(entry.riderName || '')}</td>
                      <td>${escapeHtml(entry.team || '')}</td>
                      <td>${escapeHtml(getDisplayRawTime(entry))}</td>
                      <td>${escapeHtml(getDisplayBonus(entry))}</td>
                      <td>${escapeHtml(getDisplayTime(entry))}</td>
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
                    <table class="field-table table-stage">
                      ${stageColGroup}
                      <thead>
                        <tr>
                          <th>Place</th>
                          <th>Bib#</th>
                          <th>Name</th>
                          <th>Team</th>
                          <th>Raw</th>
                          <th>Bonus</th>
                          <th>Net</th>
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

  const gcTablesHtml = gcTables.length
    ? gcTables
        .map((table) => {
          const gcColGroup = `
            <colgroup>
              <col style="width:6%" />
              <col style="width:6%" />
              <col style="width:19%" />
              <col style="width:15%" />
              <col style="width:9%" />
              <col style="width:10%" />
              <col style="width:8%" />
              <col style="width:11%" />
              <col style="width:6%" />
              <col style="width:10%" />
            </colgroup>
          `;

          const rowsHtml = table.rows
            .map((row) => {
              const statusText = row.gcStatus;
              const gcTotal = row.gcStatus === 'ACTIVE' ? formatDurationHms(row.elapsedMs) : '-';
              const bonusTotal = row.gcStatus === 'ACTIVE' ? formatBonusSeconds(row.bonusSecTotal) : '-';
              const stageCells = (table.stageColumns || [])
                .map((stage) => `<td>${escapeHtml(formatDuration(row.stageElapsedMs?.[stage.id]))}</td>`)
                .join('');
              return `
                <tr>
                  <td>${row.rank ? `#${row.rank}` : '-'}</td>
                  <td>${row.bib || '-'}</td>
                  <td>${escapeHtml(row.riderName || '')}</td>
                  <td>${escapeHtml(row.team || '')}</td>
                  <td>${escapeHtml(statusText)}</td>
                  ${stageCells}
                  <td>${escapeHtml(bonusTotal)}</td>
                  <td>${escapeHtml(gcTotal)}</td>
                </tr>
              `;
            })
            .join('');

          const stageHeaders = (table.stageColumns || [])
            .map((stage) => `<th>${escapeHtml(stage.label)}</th>`)
            .join('');

          return `
            <article class="field-card">
              <header class="field-card-head">
                <h3>GC - General Classification · ${escapeHtml(table.fieldName)}${refreshedStr ? `<span class="field-refreshed">Updated ${escapeHtml(refreshedStr)}</span>` : ''}</h3>
                <p>${table.rows.length} racer${table.rows.length === 1 ? '' : 's'}</p>
              </header>
              <div class="field-table-wrap">
                <table class="field-table table-gc">
                  ${gcColGroup}
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Bib#</th>
                      <th>Name</th>
                      <th>Team</th>
                      <th>Status</th>
                      ${stageHeaders}
                      <th>Bonus</th>
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
    : '<article class="field-card"><p class="empty-cell">No GC data available.</p></article>';

  stageGrid.innerHTML += `
    <section class="stage-card">
      <header class="stage-card-head">
        <h2>GC - General Classification</h2>
      </header>
      <div class="field-grid">${gcTablesHtml}</div>
    </section>
  `;
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
  const publishedMeta = resolvePublishedMeta(payload);
  renderStages(payload, publishedMeta?.date || null);

  if (!payload.tournament) {
    setStatus('No published race results available yet.');
    return;
  }

  const publishedLabel = publishedMeta
    ? `${formatRefreshedAt(publishedMeta.date)} (API: ${publishedMeta.raw})`
    : 'not provided by API';

  setStatus(`Showing published results for ${payload.tournament.name}. Data refresh time: ${publishedLabel}`);
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
