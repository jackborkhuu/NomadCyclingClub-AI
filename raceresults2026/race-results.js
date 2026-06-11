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
  const centiseconds = Math.floor(millis / 10);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
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

function fitFieldTablesToViewport() {
  const wraps = document.querySelectorAll('.field-table-wrap');
  wraps.forEach((wrap) => {
    const table = wrap.querySelector('.field-table');
    if (!table) {
      return;
    }

    table.style.transform = 'none';
    table.style.transformOrigin = 'top left';
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

function scheduleFieldTableFit() {
  if (tableFitFrame) {
    window.cancelAnimationFrame(tableFitFrame);
  }

  tableFitFrame = window.requestAnimationFrame(() => {
    fitFieldTablesToViewport();
    tableFitFrame = 0;
  });
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

              let finishPlace = 0;
              const rowsHtml = entries
                .map((entry) => {
                  const status = String(entry.resultStatus || '').toUpperCase();
                  let displayPlace = '-';

                  if (status === 'DNF' || status === 'DNS') {
                    displayPlace = status;
                  } else if (Number(entry.elapsedMs) > 0 || Number(entry.place) > 0) {
                    finishPlace += 1;
                    displayPlace = String(finishPlace);
                  }

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
        <section class="stage-card" data-stage-id="${escapeHtml(stageTable.stageId || '')}">
          <header class="stage-card-head">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <h2>${escapeHtml(stageTable.stageName || 'Stage')}</h2>
              <button class="stage-print-btn" type="button" data-stage-id="${escapeHtml(stageTable.stageId || '')}">Print This Stage</button>
            </div>
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
    <section class="stage-card" id="gc-section">
      <header class="stage-card-head">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <h2>GC - General Classification</h2>
          <button class="stage-print-btn" type="button" id="gc-print-btn">Print This Section</button>
        </div>
      </header>
      <div class="field-grid">${gcTablesHtml}</div>
    </section>
  `;

  scheduleFieldTableFit();
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
    setStatus('No published event results available yet.');
    return;
  }

  const publishedLabel = publishedMeta
    ? formatRefreshedAt(publishedMeta.date)
    : 'unknown';

  setStatus(`Last updated: ${publishedLabel}`);
}

function generateStagePDF(stageCard, triggerBtn) {
  if (!stageCard) {
    alert('No stage data available for PDF export.');
    return;
  }

  const fieldCards = stageCard.querySelectorAll('.field-card');
  if (fieldCards.length === 0) {
    alert('No sub-tables available for this stage.');
    return;
  }

  const printBtn = triggerBtn || null;
  const printBtnDefaultLabel = printBtn ? printBtn.textContent : 'Print This Stage';
  if (printBtn) {
    printBtn.disabled = true;
    printBtn.textContent = 'Generating...';
  }

  const stageTitle = stageCard.querySelector('.stage-card-head h2')?.textContent || 'Stage Results';

  const fieldTablesHtml = Array.from(fieldCards)
    .map((fieldCard) => {
      const fieldHead = fieldCard.querySelector('.field-card-head');
      const fieldHeadHtml = fieldHead ? fieldHead.outerHTML : '';
      const table = fieldCard.querySelector('.field-table');
      const tableHtml = table ? table.outerHTML : '';
      return `
        <div class="pdf-field-source">
          ${fieldHeadHtml}
          ${tableHtml}
        </div>
      `;
    })
    .join('');

  const finishPrinting = () => {
    if (printBtn) {
      printBtn.disabled = false;
      printBtn.textContent = printBtnDefaultLabel;
    }
  };

  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups and try again.');
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(stageTitle)}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; color: #1b1b1b; }
            .print-page { height: 281mm; page-break-after: always; break-after: page; overflow: hidden; }
            .print-page:last-child { page-break-after: auto; break-after: auto; }
            .page-inner { height: 281mm; overflow: hidden; }
            .pdf-field { margin: 0 0 8px 0; }
            .pdf-field.scaled { margin-bottom: 0; }
            .field-card-head { background: #f0f4f8; padding: 8px; margin: 0 0 8px 0; font-size: 12px; }
            .field-card-head h3 { margin: 0; font-size: 12px; }
            .field-card-head .field-refreshed { font-size: 10px; color: #666; }
            .field-card-head p { margin: 4px 0 0; }
            .field-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .field-table th, .field-table td { border: 1px solid #ddd; padding: 5px; text-align: left; }
            .field-table th { background: #e0ebfb; font-weight: 700; white-space: nowrap; }
            #sourceFields, #measureRoot { display: none; }
            #measureRoot {
              position: fixed;
              left: -99999px;
              top: 0;
              width: calc(100vw - 16mm);
              display: block;
              visibility: hidden;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div id="sourceFields">${fieldTablesHtml}</div>
          <div id="measureRoot"></div>
          <div id="pagesRoot"></div>
          <script>
            (function () {
              var sourceFields = Array.prototype.slice.call(document.querySelectorAll('.pdf-field-source'));
              var pagesRoot = document.getElementById('pagesRoot');
              var measureRoot = document.getElementById('measureRoot');

              function createPage() {
                var page = document.createElement('section');
                page.className = 'print-page';
                var inner = document.createElement('div');
                inner.className = 'page-inner';
                page.appendChild(inner);
                pagesRoot.appendChild(page);
                return page;
              }

              function pageInner(page) {
                return page.querySelector('.page-inner');
              }

              function getPageCapacity(page) {
                var inner = pageInner(page);
                return inner ? inner.clientHeight : 0;
              }

              function getPageUsed(page) {
                var inner = pageInner(page);
                return inner ? inner.scrollHeight : 0;
              }

              function getPageRemaining(page) {
                return Math.max(0, getPageCapacity(page) - getPageUsed(page));
              }

              function measureBlock(block) {
                measureRoot.appendChild(block);
                var h = block.getBoundingClientRect().height;
                measureRoot.removeChild(block);
                return h;
              }

              function setScale(block, scaleValue) {
                var scale = Math.max(0.4, Math.min(1, scaleValue));
                block.classList.add('scaled');
                block.style.transformOrigin = 'top left';
                block.style.transform = 'scale(' + scale + ')';
                block.style.width = (100 / scale).toFixed(4) + '%';
              }

              var page = null;

              sourceFields.forEach(function (sourceField, index) {
                var block = sourceField.cloneNode(true);
                block.className = 'pdf-field';

                var naturalHeight = measureBlock(block.cloneNode(true));
                
                // Create first page on-demand when placing first table
                if (!page) {
                  page = createPage();
                }
                
                var remaining = getPageRemaining(page);

                if (naturalHeight <= remaining) {
                  pageInner(page).appendChild(block);
                  return;
                }

                var freshPage = createPage();
                var freshCapacity = getPageCapacity(freshPage);

                if (naturalHeight <= freshCapacity) {
                  page = freshPage;
                  pageInner(page).appendChild(block);
                  return;
                }

                // Oversized table: scale to fit a single page.
                var targetCapacity = freshCapacity;
                var scale = targetCapacity / Math.max(1, naturalHeight);
                setScale(block, scale);

                page = freshPage;
                pageInner(page).appendChild(block);
              });

              // Remove any completely empty pages (e.g., blank first page)
              var allPages = pagesRoot.querySelectorAll('.print-page');
              allPages.forEach(function (pageEl) {
                var inner = pageEl.querySelector('.page-inner');
                // Check if page has no children or only empty text nodes
                if (inner && (inner.children.length === 0 || inner.scrollHeight < 2)) {
                  pagesRoot.removeChild(pageEl);
                }
              });

              window.__layoutReady = true;
            })();
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();

    const launchPrint = () => {
      if (printWindow.closed) {
        finishPrinting();
        return;
      }

      if (!printWindow.__layoutReady) {
        setTimeout(launchPrint, 120);
        return;
      }

      try {
        printWindow.focus();
        printWindow.print();
      } catch (err) {
        console.warn('Print invocation failed.', err);
      } finally {
        finishPrinting();
      }
    };

    printWindow.addEventListener('load', launchPrint, { once: true });
    setTimeout(launchPrint, 700);
  } catch (err) {
    console.error('Print window error:', err);
    alert('Error preparing print preview. Please try again.');
    finishPrinting();
  }
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

  const refresh = async () => {
    try {
      await loadAndRender('');
    } catch (error) {
      setStatus(error.message || 'Unable to load public event results.', true);
    }
  };

  window.addEventListener('resize', scheduleFieldTableFit);

  const stageGrid = resultsNode('publicStagesGrid');
  if (stageGrid) {
    stageGrid.addEventListener('click', (event) => {
      const btn = event.target?.closest('.stage-print-btn');
      if (!btn) {
        return;
      }

      const card = btn.closest('.stage-card');
      generateStagePDF(card, btn);
    });
  }

  const gcPrintBtn = document.getElementById('gc-print-btn');
  if (gcPrintBtn) {
    gcPrintBtn.addEventListener('click', (event) => {
      const gcSection = document.getElementById('gc-section');
      if (gcSection) {
        generateStagePDF(gcSection, gcPrintBtn);
      }
    });
  }
  
  await refresh();
  
  window.setInterval(refresh, 15000);
});
