const LOUNGE_CONFIG = {
  tenantIdOrDomain: 'nomadcyclingclub.com',
  clientId: '00000000-0000-0000-0000-000000000000',
  requiredGroupId: '00000000-0000-0000-0000-000000000000',
  yammerNetwork: 'nomadcyclingclub.com',
  yammerGroupId: ''
};

const GRAPH_SCOPES = ['User.Read', 'GroupMember.Read.All'];
const AUTH_STORAGE_KEY = 'nomadClubAuthSession';
const RACE_STORAGE_KEY = 'nomadRaceManagementEntries';

let msalClient = null;

function isConfigComplete() {
  return !LOUNGE_CONFIG.clientId.startsWith('0000') && !LOUNGE_CONFIG.requiredGroupId.startsWith('0000');
}

function getAuthStatusNode() {
  return document.getElementById('authStatus') || document.getElementById('clubAuthMessage');
}

function setAuthStatus(message, isError = false) {
  const statusNode = getAuthStatusNode();
  if (!statusNode) {
    return;
  }
  statusNode.textContent = message;
  statusNode.classList.toggle('auth-status-error', isError);
}

function isOrgUser(account) {
  if (!account || !account.username) {
    return false;
  }
  return account.username.toLowerCase().endsWith('@nomadcyclingclub.com');
}

async function getMsalClient() {
  if (!window.msal || !window.msal.PublicClientApplication) {
    throw new Error('Microsoft authentication library failed to load.');
  }
  if (!msalClient) {
    msalClient = new window.msal.PublicClientApplication({
      auth: {
        clientId: LOUNGE_CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${LOUNGE_CONFIG.tenantIdOrDomain}`,
        redirectUri: `${window.location.origin}${window.location.pathname}`
      },
      cache: {
        cacheLocation: 'localStorage'
      }
    });
  }
  await msalClient.initialize();
  return msalClient;
}

async function acquireGraphToken(client, account) {
  const request = {
    scopes: GRAPH_SCOPES,
    account
  };
  try {
    const tokenResponse = await client.acquireTokenSilent(request);
    return tokenResponse.accessToken;
  } catch (error) {
    const tokenResponse = await client.acquireTokenPopup({
      scopes: GRAPH_SCOPES,
      prompt: 'consent'
    });
    return tokenResponse.accessToken;
  }
}

async function checkGroupMembership(accessToken) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/checkMemberGroups', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      groupIds: [LOUNGE_CONFIG.requiredGroupId]
    })
  });

  if (!response.ok) {
    throw new Error('Unable to validate Microsoft 365 group membership. Ensure Graph permissions are granted.');
  }

  const result = await response.json();
  return Array.isArray(result.value) && result.value.includes(LOUNGE_CONFIG.requiredGroupId);
}

function saveSession(account) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    username: account.username,
    name: account.name || account.username,
    authenticatedAt: new Date().toISOString()
  }));
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function signInMember() {
  if (!isConfigComplete()) {
    throw new Error('Login config is incomplete. Set clientId and requiredGroupId in club-lounge.js.');
  }
  setAuthStatus('Signing you in with Microsoft 365...');
  const client = await getMsalClient();
  const loginResponse = await client.loginPopup({
    scopes: GRAPH_SCOPES,
    prompt: 'select_account'
  });

  const account = loginResponse.account;
  if (!isOrgUser(account)) {
    throw new Error('Please use your nomadcyclingclub.com Microsoft 365 account.');
  }

  setAuthStatus('Checking group membership...');
  const accessToken = await acquireGraphToken(client, account);
  const isMember = await checkGroupMembership(accessToken);

  if (!isMember) {
    throw new Error('Your account is authenticated but not in the required Nomad member group.');
  }

  saveSession(account);
  setAuthStatus('Access approved. Redirecting to Club Lounge...');
  window.location.href = 'club-lounge.html';
}

async function setupMemberLoginPage() {
  const loginButton = document.getElementById('o365LoginBtn');
  if (!loginButton) {
    return;
  }

  loginButton.addEventListener('click', async () => {
    try {
      await signInMember();
    } catch (error) {
      setAuthStatus(error.message || 'Login failed. Try again.', true);
    }
  });
}

async function verifyClubLoungeAccess() {
  const clubShell = document.getElementById('clubLoungeShell');
  const clubGate = document.getElementById('clubAuthGate');

  if (!clubShell || !clubGate) {
    return;
  }

  if (!isConfigComplete()) {
    setAuthStatus('Admin action required: set clientId and requiredGroupId in club-lounge.js.', true);
    return;
  }

  const session = getSession();
  if (!session) {
    setAuthStatus('Please sign in first to access Club Lounge.', true);
    return;
  }

  try {
    const client = await getMsalClient();
    const orgAccounts = client.getAllAccounts().filter(isOrgUser);
    if (!orgAccounts.length) {
      throw new Error('Your login session expired. Please sign in again.');
    }

    const account = orgAccounts[0];
    const token = await acquireGraphToken(client, account);
    const isMember = await checkGroupMembership(token);

    if (!isMember) {
      throw new Error('This account is not in the required Nomad Cycling Club Microsoft 365 group.');
    }

    saveSession(account);
    clubGate.hidden = true;
    clubShell.hidden = false;

    const memberIdentity = document.getElementById('memberIdentity');
    if (memberIdentity) {
      memberIdentity.textContent = `Signed in as ${account.name || account.username}`;
    }

    setupLogoutButton(client, account);
    setupRaceManagement();
    await setupCalendar();
    setupYammerFeed();
  } catch (error) {
    clearSession();
    setAuthStatus(error.message || 'Unable to verify access.', true);
  }
}

function setupLogoutButton(client, account) {
  const logoutButton = document.getElementById('logoutBtn');
  if (!logoutButton) {
    return;
  }
  logoutButton.addEventListener('click', async () => {
    clearSession();
    await client.logoutPopup({
      account
    });
    window.location.href = 'member-login.html';
  });
}

function loadRaceEntries() {
  try {
    const raw = localStorage.getItem(RACE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRaceEntries(entries) {
  localStorage.setItem(RACE_STORAGE_KEY, JSON.stringify(entries));
}

function renderRaceTable(entries) {
  const tableBody = document.getElementById('raceTableBody');
  if (!tableBody) {
    return;
  }

  if (!entries.length) {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">No race entries yet.</td></tr>';
    return;
  }

  tableBody.innerHTML = entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => `
      <tr>
        <td>${escapeHtml(entry.name)}</td>
        <td>${escapeHtml(entry.date)}</td>
        <td>${escapeHtml(entry.rider)}</td>
        <td>${escapeHtml(entry.category)}</td>
        <td>${escapeHtml(entry.status)}</td>
        <td><button class="race-delete" type="button" data-id="${entry.id}">Delete</button></td>
      </tr>
    `)
    .join('');

  tableBody.querySelectorAll('.race-delete').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-id');
      const nextEntries = loadRaceEntries().filter((entry) => entry.id !== id);
      saveRaceEntries(nextEntries);
      renderRaceTable(nextEntries);
    });
  });
}

function setupRaceManagement() {
  const form = document.getElementById('raceForm');
  if (!form) {
    return;
  }

  renderRaceTable(loadRaceEntries());

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const entries = loadRaceEntries();
    const nextEntry = {
      id: `${Date.now()}`,
      name: document.getElementById('raceName').value.trim(),
      date: document.getElementById('raceDate').value,
      rider: document.getElementById('raceRider').value.trim(),
      category: document.getElementById('raceCategory').value,
      status: document.getElementById('raceStatus').value
    };

    entries.push(nextEntry);
    saveRaceEntries(entries);
    renderRaceTable(entries);
    form.reset();
  });
}

function formatDayKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDayKeyLocal(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseEventDate(value) {
  const normalized = `${value || ''}`.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildEventLookup(events) {
  return events.reduce((lookup, eventItem) => {
    const date = parseEventDate(eventItem.startTime || eventItem.start_time || eventItem.date);
    if (!date) {
      return lookup;
    }

    const key = formatDayKey(date);
    if (!lookup[key]) {
      lookup[key] = [];
    }

    lookup[key].push({
      name: eventItem.name || 'Club ride',
      place: eventItem.place && eventItem.place.name ? eventItem.place.name : 'Location TBA',
      eventUrl: eventItem.eventUrl || eventItem.event_url || ''
    });

    return lookup;
  }, {});
}

async function loadClubEvents() {
  const response = await fetch('data/facebook-events.json');
  if (!response.ok) {
    throw new Error('Unable to load ride events for the calendar.');
  }
  const payload = await response.json();
  const upcoming = Array.isArray(payload.upcoming) ? payload.upcoming : [];
  const past = Array.isArray(payload.past) ? payload.past : [];
  return [...upcoming, ...past];
}

function renderSelectedDateEvents(dayKey, lookup) {
  const selectedDateLabel = document.getElementById('calendarSelectedDateLabel');
  const selectedEvents = document.getElementById('calendarSelectedEvents');
  if (!selectedDateLabel || !selectedEvents) {
    return;
  }

  const selectedDate = parseDayKeyLocal(dayKey);
  selectedDateLabel.textContent = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const events = lookup[dayKey] || [];
  if (!events.length) {
    selectedEvents.innerHTML = '<li>No group rides or events on this day.</li>';
    return;
  }

  selectedEvents.innerHTML = events
    .map((entry) => {
      const title = escapeHtml(entry.name);
      const place = escapeHtml(entry.place);
      if (entry.eventUrl) {
        return `<li><a href="${escapeHtml(entry.eventUrl)}" target="_blank" rel="noopener">${title}</a> · ${place}</li>`;
      }
      return `<li>${title} · ${place}</li>`;
    })
    .join('');
}

function renderCalendar(monthDate, lookup, selectedDay) {
  const monthLabel = document.getElementById('calendarMonthLabel');
  const grid = document.getElementById('calendarGrid');
  if (!monthLabel || !grid) {
    return;
  }

  monthLabel.textContent = monthDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map((dayName) => `<div class="calendar-header">${dayName}</div>`)
    .join('');

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) {
    cells.push('<div class="calendar-day empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const dayKey = formatDayKey(cellDate);
    const hasEvents = Boolean((lookup[dayKey] || []).length);
    const isSelected = selectedDay === dayKey;
    cells.push(`
      <button class="calendar-day ${hasEvents ? 'has-event' : ''} ${isSelected ? 'selected' : ''}" type="button" data-day="${dayKey}">
        <span>${day}</span>
        ${hasEvents ? '<span class="calendar-dot" aria-hidden="true"></span>' : ''}
      </button>
    `);
  }

  grid.innerHTML = `${headers}${cells.join('')}`;
  grid.querySelectorAll('.calendar-day[data-day]').forEach((button) => {
    button.addEventListener('click', () => {
      const dayKey = button.getAttribute('data-day');
      renderSelectedDateEvents(dayKey, lookup);
      const currentMonth = parseDayKeyLocal(dayKey);
      renderCalendar(currentMonth, lookup, dayKey);
      setupCalendarNavigation(currentMonth, lookup, dayKey);
    });
  });
}

function setupCalendarNavigation(currentMonth, lookup, selectedDay) {
  const prevButton = document.getElementById('calendarPrev');
  const nextButton = document.getElementById('calendarNext');

  if (!prevButton || !nextButton) {
    return;
  }

  prevButton.onclick = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const nextSelected = formatDayKey(nextMonth);
    renderCalendar(nextMonth, lookup, nextSelected);
    renderSelectedDateEvents(nextSelected, lookup);
    setupCalendarNavigation(nextMonth, lookup, nextSelected);
  };

  nextButton.onclick = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const nextSelected = formatDayKey(nextMonth);
    renderCalendar(nextMonth, lookup, nextSelected);
    renderSelectedDateEvents(nextSelected, lookup);
    setupCalendarNavigation(nextMonth, lookup, nextSelected);
  };
}

async function setupCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) {
    return;
  }

  try {
    const events = await loadClubEvents();
    const lookup = buildEventLookup(events);
    const now = new Date();
    const selectedDay = formatDayKey(now);
    const monthView = new Date(now.getFullYear(), now.getMonth(), 1);

    renderCalendar(monthView, lookup, selectedDay);
    renderSelectedDateEvents(selectedDay, lookup);
    setupCalendarNavigation(monthView, lookup, selectedDay);
  } catch (error) {
    const selectedEvents = document.getElementById('calendarSelectedEvents');
    if (selectedEvents) {
      selectedEvents.innerHTML = `<li>${escapeHtml(error.message || 'Unable to load calendar')}</li>`;
    }
  }
}

function setupYammerFeed() {
  const statusNode = document.getElementById('yammerStatus');
  const yammerTarget = document.getElementById('yammerFeed');
  if (!statusNode || !yammerTarget) {
    return;
  }

  if (!LOUNGE_CONFIG.yammerGroupId) {
    statusNode.textContent = 'Set yammerGroupId in club-lounge.js to enable the Discussions feed.';
    return;
  }

  if (!window.yam || !window.yam.connect || !window.yam.connect.embedFeed) {
    statusNode.textContent = 'Yammer embed script did not load. Check network/CSP settings.';
    return;
  }

  statusNode.textContent = 'Loading Viva Engage discussion feed...';
  window.yam.connect.embedFeed({
    container: '#yammerFeed',
    network: LOUNGE_CONFIG.yammerNetwork,
    feedType: 'group',
    feedId: LOUNGE_CONFIG.yammerGroupId,
    config: {
      use_sso: true,
      header: true,
      footer: false,
      showOpenGraphPreview: false,
      defaultToCanonical: false
    }
  });
}

function escapeHtml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  await setupMemberLoginPage();
  await verifyClubLoungeAccess();
});
