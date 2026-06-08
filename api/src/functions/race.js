import { app } from '@azure/functions';

const GRAPH_ROOT = 'https://graph.microsoft.com/v1.0';
const DATA_LIST_NAME = process.env.SP_RACE_LIST_NAME || 'NomadRaceData';
const DEFAULT_GOOGLE_REGISTRATION_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1TAKqNwmCDRKPEAKHFv0PrmCPiGly7bPacp7HqTw2id4/export?format=csv&gid=276157338';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-ms-client-principal'
  };
}

function jsonResponse(body, status = 200) {
  return {
    status,
    jsonBody: body,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    }
  };
}

function parsePrincipal(request) {
  const encoded = request.headers.get('x-ms-client-principal');
  if (!encoded) {
    return null;
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required app setting: ${name}`);
  }
  return value;
}

async function getAppAccessToken() {
  const tenantId = getRequiredEnv('MS_TENANT_ID');
  const clientId = getRequiredEnv('MS_CLIENT_ID');
  const clientSecret = getRequiredEnv('MS_CLIENT_SECRET');

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Unable to acquire Graph app token: ${response.status} ${payload}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function graphRequest(token, path, options = {}) {
  const response = await fetch(`${GRAPH_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph request failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getSiteId(token) {
  const hostname = getRequiredEnv('SP_HOSTNAME');
  const sitePath = process.env.SP_SITE_PATH || '/';
  const payload = await graphRequest(token, `/sites/${hostname}:${sitePath}`);
  return payload.id;
}

async function findListByName(token, siteId, listName) {
  const encoded = encodeURIComponent(`displayName eq '${listName.replace(/'/g, "''")}'`);
  const payload = await graphRequest(token, `/sites/${siteId}/lists?$filter=${encoded}`);
  const items = Array.isArray(payload?.value) ? payload.value : [];
  return items[0] || null;
}

async function createRaceList(token, siteId, listName) {
  const payload = await graphRequest(token, `/sites/${siteId}/lists`, {
    method: 'POST',
    body: JSON.stringify({
      displayName: listName,
      list: {
        template: 'genericList'
      },
      columns: [
        { name: 'EntityType', text: {} },
        { name: 'EntityId', text: {} },
        { name: 'TournamentId', text: {} },
        { name: 'StageId', text: {} },
        { name: 'RiderId', text: {} },
        { name: 'SortOrder', number: {} },
        { name: 'IsPublished', boolean: {} },
        { name: 'IsArchived', boolean: {} },
        { name: 'PayloadJson', text: { allowMultipleLines: true } }
      ]
    })
  });
  return payload;
}

async function ensureRaceList(token, siteId) {
  const existing = await findListByName(token, siteId, DATA_LIST_NAME);
  if (existing) {
    return existing;
  }

  return createRaceList(token, siteId, DATA_LIST_NAME);
}

async function getAllRaceItems(token, siteId, listId) {
  const payload = await graphRequest(
    token,
    `/sites/${siteId}/lists/${listId}/items?expand=fields($select=Title,EntityType,EntityId,TournamentId,StageId,RiderId,SortOrder,IsPublished,IsArchived,PayloadJson)&$top=999`
  );
  return Array.isArray(payload?.value) ? payload.value : [];
}

async function createRaceItem(token, siteId, listId, fields) {
  return graphRequest(token, `/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });
}

async function updateRaceItem(token, siteId, listId, itemId, fields) {
  return graphRequest(token, `/sites/${siteId}/lists/${listId}/items/${itemId}/fields`, {
    method: 'PATCH',
    body: JSON.stringify(fields)
  });
}

function parseEntity(item) {
  const fields = item.fields || {};
  const type = String(fields.EntityType || '').toLowerCase();
  let payload = {};
  try {
    payload = JSON.parse(fields.PayloadJson || '{}');
  } catch {
    payload = {};
  }

  return {
    itemId: item.id,
    type,
    entityId: fields.EntityId || '',
    tournamentId: fields.TournamentId || '',
    stageId: fields.StageId || '',
    riderId: fields.RiderId || '',
    sortOrder: Number(fields.SortOrder || 0),
    isPublished: Boolean(fields.IsPublished),
    isArchived: Boolean(fields.IsArchived),
    payload
  };
}

function mapData(items) {
  const entities = items.map(parseEntity);
  const tournaments = entities.filter((item) => item.type === 'tournament').map((item) => ({ ...item.payload, itemId: item.itemId }));
  const stages = entities.filter((item) => item.type === 'stage').map((item) => ({ ...item.payload, itemId: item.itemId }));
  const riders = entities.filter((item) => item.type === 'rider').map((item) => ({ ...item.payload, itemId: item.itemId }));
  const results = entities.filter((item) => item.type === 'result').map((item) => ({ ...item.payload, itemId: item.itemId }));

  return { tournaments, stages, riders, results, entities };
}

function generateId(prefix) {
  if (globalThis.crypto && globalThis.crypto.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getRaceDirectorsGroupId() {
  const configured = String(process.env.RACE_DIRECTORS_GROUP_OBJECT_ID || '').trim();
  if (configured) {
    return configured;
  }

  // Backward compatibility for existing deployments.
  return String(process.env.BOARD_GROUP_OBJECT_ID || '').trim();
}

async function userInRaceDirectorsGroup(token, userId) {
  const raceDirectorsGroupId = getRaceDirectorsGroupId();
  if (!raceDirectorsGroupId) {
    return true;
  }

  const payload = await graphRequest(token, `/users/${userId}/checkMemberGroups`, {
    method: 'POST',
    body: JSON.stringify({
      groupIds: [raceDirectorsGroupId]
    })
  });

  return Array.isArray(payload?.value) && payload.value.includes(raceDirectorsGroupId);
}

function requireAuthenticatedPrincipal(request) {
  const principal = parsePrincipal(request);
  if (!principal || !principal.userId || !principal.userDetails) {
    throw new Error('Unauthenticated request. Sign in first.');
  }

  const allowedDomain = process.env.ALLOWED_MEMBER_DOMAIN || 'nomadcyclingclub.com';
  if (!String(principal.userDetails).toLowerCase().endsWith(`@${allowedDomain}`)) {
    throw new Error(`Only ${allowedDomain} users are allowed.`);
  }

  return principal;
}

function groupBy(array, keyFn) {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

function buildScoreboards(dataset, tournamentId) {
  const stages = dataset.stages
    .filter((stage) => stage.tournamentId === tournamentId)
    .sort((a, b) => Number(a.stageOrder || 0) - Number(b.stageOrder || 0));

  const riders = dataset.riders.filter((rider) => rider.tournamentId === tournamentId);
  const riderLookup = riders.reduce((acc, rider) => {
    acc[rider.riderId] = rider;
    return acc;
  }, {});

  const results = dataset.results
    .filter((result) => result.tournamentId === tournamentId)
    .sort((a, b) => Number(a.elapsedMs || 0) - Number(b.elapsedMs || 0));

  const stageResultsByStage = groupBy(results, (result) => result.stageId);

  const stageTables = stages.map((stage) => {
    const entries = (stageResultsByStage[stage.stageId] || [])
      .slice()
      .sort((a, b) => Number(a.elapsedMs || 0) - Number(b.elapsedMs || 0))
      .map((entry, index) => ({
        rank: index + 1,
        riderId: entry.riderId,
        riderName: riderLookup[entry.riderId]?.name || 'Unknown rider',
        team: riderLookup[entry.riderId]?.team || 'N/A',
        elapsedMs: Number(entry.elapsedMs || 0),
        stopwatch: entry.stopwatch || '',
        finishTimestamp: entry.finishTimestamp || ''
      }));

    return {
      stageId: stage.stageId,
      stageName: stage.stageName,
      stageOrder: stage.stageOrder,
      entries
    };
  });

  const gcMap = {};
  for (const result of results) {
    if (!gcMap[result.riderId]) {
      gcMap[result.riderId] = {
        riderId: result.riderId,
        riderName: riderLookup[result.riderId]?.name || 'Unknown rider',
        team: riderLookup[result.riderId]?.team || 'N/A',
        elapsedMs: 0,
        stagesCompleted: 0
      };
    }
    gcMap[result.riderId].elapsedMs += Number(result.elapsedMs || 0);
    gcMap[result.riderId].stagesCompleted += 1;
  }

  const gc = Object.values(gcMap)
    .sort((a, b) => a.elapsedMs - b.elapsedMs)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

  return {
    stageTables,
    gc
  };
}

function getTournamentById(dataset, tournamentId) {
  return dataset.tournaments.find((item) => item.tournamentId === tournamentId) || null;
}

function ensureTournamentEditable(tournament) {
  if (!tournament) {
    throw new Error('Tournament not found.');
  }

  if (tournament.status === 'closed') {
    throw new Error('Tournament is closed. Further data entry and edits are disabled.');
  }
}

function normalizeCategories(rawCategories) {
  const source = Array.isArray(rawCategories)
    ? rawCategories
    : String(rawCategories || '').split(',');

  const cleaned = source
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (cleaned.length) {
    return cleaned;
  }

  return ['Under 40 Men', '40+ Men', 'Women', '50+ Men'];
}

function normalizeNameToken(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitNameParts(fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleaned.split(' ');
  if (parts.length < 2) {
    return { firstName: cleaned, lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function riderNameKey(firstName, lastName) {
  const first = normalizeNameToken(firstName);
  const last = normalizeNameToken(lastName);
  if (!first || !last) {
    return '';
  }
  return `${first}::${last}`;
}

function buildTournamentRiderNameKeys(riders, tournamentId) {
  const keys = new Set();
  for (const rider of riders) {
    if (rider.tournamentId !== tournamentId) {
      continue;
    }

    const firstName = rider.firstName || splitNameParts(rider.name || '').firstName;
    const lastName = rider.lastName || splitNameParts(rider.name || '').lastName;
    const key = riderNameKey(firstName, lastName);
    if (key) {
      keys.add(key);
    }
  }
  return keys;
}

function normalizeHeaderKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (c === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    if (c === '\r') {
      continue;
    }

    value += c;
  }

  row.push(value);
  if (row.some((cell) => String(cell || '').trim() !== '') || rows.length === 0) {
    rows.push(row);
  }

  return rows;
}

function csvRowsToObjects(csvText) {
  const rows = parseCsv(csvText).filter((r) => r.some((cell) => String(cell || '').trim() !== ''));
  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => String(header || '').trim());
  return rows.slice(1).map((cells) => {
    const item = {};
    headers.forEach((header, idx) => {
      if (!header) {
        return;
      }
      item[header] = String(cells[idx] || '').trim();
    });
    return item;
  });
}

function getRowFieldValue(row, aliases) {
  const normalizedAliases = aliases.map(normalizeHeaderKey);
  for (const [key, rawValue] of Object.entries(row)) {
    if (normalizedAliases.includes(normalizeHeaderKey(key))) {
      return String(rawValue || '').trim();
    }
  }
  return '';
}

function mapGoogleRegistrationRow(row) {
  const firstNameRaw = getRowFieldValue(row, ['first name', 'firstname', 'rider first name']);
  const lastNameRaw = getRowFieldValue(row, ['last name', 'lastname', 'rider last name']);
  const fullNameRaw = getRowFieldValue(row, ['name', 'full name', 'rider name']);

  const fallbackName = splitNameParts(fullNameRaw);
  const firstName = firstNameRaw || fallbackName.firstName;
  const lastName = lastNameRaw || fallbackName.lastName;

  return {
    timestamp: getRowFieldValue(row, ['timestamp', 'time stamp', 'date']),
    firstName,
    lastName,
    team: getRowFieldValue(row, ['team name', 'team']),
    age: Number(getRowFieldValue(row, ['age']) || 0),
    category: getRowFieldValue(row, ['category']),
    fieldName: getRowFieldValue(row, ['fields', 'field'])
  };
}

function getGoogleRegistrationCsvUrl() {
  const configured = String(process.env.GOOGLE_REGISTRATION_SHEET_CSV_URL || '').trim();
  if (!configured) {
    return DEFAULT_GOOGLE_REGISTRATION_SHEET_URL;
  }

  if (configured.includes('/export?')) {
    return configured;
  }

  const match = configured.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    return configured;
  }

  const sheetId = match[1];
  let gid = '0';
  const gidMatch = configured.match(/[?#&]gid=(\d+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

async function handleRaceAdmin(request) {
  if (request.method === 'OPTIONS') {
    return {
      status: 204,
      headers: corsHeaders()
    };
  }

  const action = request.params.action || request.query.get('action') || 'config';

  try {
    const principal = requireAuthenticatedPrincipal(request);
    const token = await getAppAccessToken();
    const canManageRace = await userInRaceDirectorsGroup(token, principal.userId);

    if (action === 'config') {
      return jsonResponse({
        ok: true,
        principal: {
          userId: principal.userId,
          userDetails: principal.userDetails
        },
        canManageRace,
        raceDirectorsGroupConfigured: Boolean(getRaceDirectorsGroupId())
      });
    }

    if (!canManageRace) {
      return jsonResponse({ error: 'RaceDirectors group access is required for race management.' }, 403);
    }

    const siteId = await getSiteId(token);
    const list = await ensureRaceList(token, siteId);

    if (action === 'bootstrap') {
      return jsonResponse({ ok: true, listId: list.id, listName: list.name || DATA_LIST_NAME });
    }

    const rawItems = await getAllRaceItems(token, siteId, list.id);
    const dataset = mapData(rawItems);

    if (action === 'dataset') {
      const tournamentId = request.query.get('tournamentId') || '';
      const filtered = tournamentId
        ? {
            tournaments: dataset.tournaments.filter((item) => item.tournamentId === tournamentId),
            stages: dataset.stages.filter((item) => item.tournamentId === tournamentId),
            riders: dataset.riders.filter((item) => item.tournamentId === tournamentId),
            results: dataset.results.filter((item) => item.tournamentId === tournamentId)
          }
        : {
            tournaments: dataset.tournaments,
            stages: dataset.stages,
            riders: dataset.riders,
            results: dataset.results
          };

      return jsonResponse({ ok: true, ...filtered });
    }

    const payload = request.method === 'POST' ? await request.json() : {};

    if (action === 'createTournament') {
      const tournamentId = generateId('tour');
      const categories = normalizeCategories(payload.categories);
      const tournament = {
        tournamentId,
        name: String(payload.name || '').trim(),
        description: String(payload.description || '').trim(),
        categories,
        status: 'draft',
        timezone: 'America/Los_Angeles',
        createdAt: new Date().toISOString(),
        createdBy: principal.userDetails,
        publishedAt: null,
        archivedAt: null
      };

      if (!tournament.name) {
        return jsonResponse({ error: 'Tournament name is required.' }, 400);
      }

      await createRaceItem(token, siteId, list.id, {
        Title: tournamentId,
        EntityType: 'tournament',
        EntityId: tournamentId,
        TournamentId: tournamentId,
        StageId: '',
        RiderId: '',
        SortOrder: 0,
        IsPublished: false,
        IsArchived: false,
        PayloadJson: JSON.stringify(tournament)
      });

      return jsonResponse({ ok: true, tournament });
    }

    if (action === 'createStage') {
      const tournamentId = String(payload.tournamentId || '');
      const stageName = String(payload.stageName || '').trim();
      const stageOrder = Number(payload.stageOrder || 0);
      const startTimePst = String(payload.startTimePst || '').trim();

      if (!tournamentId || !stageName || !stageOrder || !startTimePst) {
        return jsonResponse({ error: 'tournamentId, stageName, stageOrder and startTimePst are required.' }, 400);
      }

      const tournament = getTournamentById(dataset, tournamentId);
      ensureTournamentEditable(tournament);

      const stageId = generateId('stage');
      const stage = {
        stageId,
        tournamentId,
        stageName,
        stageOrder,
        startTimePst,
        createdAt: new Date().toISOString()
      };

      await createRaceItem(token, siteId, list.id, {
        Title: stageId,
        EntityType: 'stage',
        EntityId: stageId,
        TournamentId: tournamentId,
        StageId: stageId,
        RiderId: '',
        SortOrder: stageOrder,
        IsPublished: false,
        IsArchived: false,
        PayloadJson: JSON.stringify(stage)
      });

      return jsonResponse({ ok: true, stage });
    }

    if (action === 'registerRider') {
      const tournamentId = String(payload.tournamentId || '');
      const name = String(payload.name || '').trim();
      if (!tournamentId || !name) {
        return jsonResponse({ error: 'tournamentId and rider name are required.' }, 400);
      }

      const tournament = getTournamentById(dataset, tournamentId);
      ensureTournamentEditable(tournament);

      const nameParts = splitNameParts(name);
      const firstName = String(payload.firstName || nameParts.firstName || '').trim();
      const lastName = String(payload.lastName || nameParts.lastName || '').trim();
      if (!firstName || !lastName) {
        return jsonResponse({ error: 'Rider must include both first and last name.' }, 400);
      }

      const existingNameKeys = buildTournamentRiderNameKeys(dataset.riders, tournamentId);
      if (existingNameKeys.has(riderNameKey(firstName, lastName))) {
        return jsonResponse({ error: 'Duplicate rider: first and last name already exists in this tournament.' }, 409);
      }

      const category = String(payload.category || '').trim();
      const allowedCategories = normalizeCategories(tournament.categories);
      if (category && !allowedCategories.includes(category)) {
        return jsonResponse({ error: 'Rider category is not part of this tournament configuration.' }, 400);
      }

      const riderId = generateId('rider');
      const ridersInTournament = dataset.riders.filter((rider) => rider.tournamentId === tournamentId);
      const riderNumber = ridersInTournament.reduce((max, rider) => Math.max(max, Number(rider.riderNumber || 0)), 0) + 1;

      const rider = {
        riderId,
        tournamentId,
        riderNumber,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        state: String(payload.state || '').trim(),
        team: String(payload.team || '').trim(),
        gender: String(payload.gender || '').trim(),
        age: Number(payload.age || 0),
        category,
        fieldName: String(payload.fieldName || '').trim(),
        createdAt: new Date().toISOString()
      };

      await createRaceItem(token, siteId, list.id, {
        Title: riderId,
        EntityType: 'rider',
        EntityId: riderId,
        TournamentId: tournamentId,
        StageId: '',
        RiderId: riderId,
        SortOrder: riderNumber,
        IsPublished: false,
        IsArchived: false,
        PayloadJson: JSON.stringify(rider)
      });

      return jsonResponse({ ok: true, rider });
    }

    if (action === 'syncGoogleRegistrations') {
      const tournamentId = String(payload.tournamentId || '');
      if (!tournamentId) {
        return jsonResponse({ error: 'tournamentId is required.' }, 400);
      }

      const tournament = getTournamentById(dataset, tournamentId);
      ensureTournamentEditable(tournament);

      const csvUrl = getGoogleRegistrationCsvUrl();
      const response = await fetch(csvUrl);
      if (!response.ok) {
        return jsonResponse({ error: `Unable to fetch Google registration sheet (${response.status}).` }, 502);
      }

      const csvText = await response.text();
      const rows = csvRowsToObjects(csvText);
      const allowedCategories = normalizeCategories(tournament.categories);
      const existingNameKeys = buildTournamentRiderNameKeys(dataset.riders, tournamentId);
      const newlySeenKeys = new Set();

      let riderNumber = dataset.riders
        .filter((rider) => rider.tournamentId === tournamentId)
        .reduce((max, rider) => Math.max(max, Number(rider.riderNumber || 0)), 0);

      let added = 0;
      let duplicates = 0;
      let invalid = 0;

      for (const row of rows) {
        const mapped = mapGoogleRegistrationRow(row);
        const firstName = String(mapped.firstName || '').trim();
        const lastName = String(mapped.lastName || '').trim();

        if (!firstName || !lastName) {
          invalid += 1;
          continue;
        }

        const nameKey = riderNameKey(firstName, lastName);
        if (!nameKey) {
          invalid += 1;
          continue;
        }

        if (existingNameKeys.has(nameKey) || newlySeenKeys.has(nameKey)) {
          duplicates += 1;
          continue;
        }

        const categoryCandidate = String(mapped.category || mapped.fieldName || '').trim();
        if (categoryCandidate && !allowedCategories.includes(categoryCandidate)) {
          invalid += 1;
          continue;
        }

        riderNumber += 1;
        const riderId = generateId('rider');
        const rider = {
          riderId,
          tournamentId,
          riderNumber,
          name: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          state: '',
          team: String(mapped.team || '').trim(),
          gender: '',
          age: Number(mapped.age || 0),
          category: categoryCandidate,
          fieldName: String(mapped.fieldName || '').trim(),
          source: 'google-sheet-sync',
          sourceTimestamp: String(mapped.timestamp || '').trim(),
          createdAt: new Date().toISOString(),
          createdBy: principal.userDetails
        };

        await createRaceItem(token, siteId, list.id, {
          Title: riderId,
          EntityType: 'rider',
          EntityId: riderId,
          TournamentId: tournamentId,
          StageId: '',
          RiderId: riderId,
          SortOrder: riderNumber,
          IsPublished: false,
          IsArchived: false,
          PayloadJson: JSON.stringify(rider)
        });

        newlySeenKeys.add(nameKey);
        added += 1;
      }

      return jsonResponse({
        ok: true,
        summary: {
          totalRows: rows.length,
          added,
          duplicates,
          invalid
        },
        source: csvUrl
      });
    }

    if (action === 'addResult') {
      const tournamentId = String(payload.tournamentId || '');
      const stageId = String(payload.stageId || '');
      const riderId = String(payload.riderId || '');
      const finishTimestamp = String(payload.finishTimestamp || '').trim();
      const stopwatch = String(payload.stopwatch || '').trim();
      const elapsedMs = Number(payload.elapsedMs || 0);

      if (!tournamentId || !stageId || !riderId || !finishTimestamp || !elapsedMs) {
        return jsonResponse({ error: 'tournamentId, stageId, riderId, finishTimestamp and elapsedMs are required.' }, 400);
      }

      const tournament = getTournamentById(dataset, tournamentId);
      ensureTournamentEditable(tournament);

      const existing = dataset.results.find((result) => result.tournamentId === tournamentId && result.stageId === stageId && result.riderId === riderId);
      if (existing) {
        const nextPayload = {
          ...existing,
          finishTimestamp,
          stopwatch,
          elapsedMs,
          updatedAt: new Date().toISOString(),
          updatedBy: principal.userDetails
        };

        await updateRaceItem(token, siteId, list.id, existing.itemId, {
          SortOrder: elapsedMs,
          PayloadJson: JSON.stringify(nextPayload)
        });

        return jsonResponse({ ok: true, result: nextPayload, updated: true });
      }

      const resultId = generateId('result');
      const result = {
        resultId,
        tournamentId,
        stageId,
        riderId,
        finishTimestamp,
        stopwatch,
        elapsedMs,
        createdAt: new Date().toISOString(),
        createdBy: principal.userDetails
      };

      await createRaceItem(token, siteId, list.id, {
        Title: resultId,
        EntityType: 'result',
        EntityId: resultId,
        TournamentId: tournamentId,
        StageId: stageId,
        RiderId: riderId,
        SortOrder: elapsedMs,
        IsPublished: false,
        IsArchived: false,
        PayloadJson: JSON.stringify(result)
      });

      return jsonResponse({ ok: true, result, updated: false });
    }

    if (action === 'publishTournament' || action === 'closeTournament') {
      const tournamentId = String(payload.tournamentId || '');
      if (!tournamentId) {
        return jsonResponse({ error: 'tournamentId is required.' }, 400);
      }

      const tournament = getTournamentById(dataset, tournamentId);
      if (!tournament) {
        return jsonResponse({ error: 'Tournament not found.' }, 404);
      }

      if (action === 'closeTournament' && tournament.status === 'closed') {
        return jsonResponse({ ok: true, tournament });
      }

      const status = action === 'publishTournament' ? 'published' : 'closed';
      const nextTournament = {
        ...tournament,
        status,
        publishedAt: action === 'publishTournament' ? new Date().toISOString() : tournament.publishedAt,
        archivedAt: action === 'closeTournament' ? new Date().toISOString() : tournament.archivedAt,
        updatedAt: new Date().toISOString(),
        updatedBy: principal.userDetails
      };

      await updateRaceItem(token, siteId, list.id, tournament.itemId, {
        IsPublished: action === 'publishTournament',
        IsArchived: action === 'closeTournament',
        PayloadJson: JSON.stringify(nextTournament)
      });

      return jsonResponse({ ok: true, tournament: nextTournament });
    }

    if (action === 'scoreboard') {
      const tournamentId = String(request.query.get('tournamentId') || '');
      if (!tournamentId) {
        return jsonResponse({ error: 'tournamentId is required.' }, 400);
      }
      const scoreboards = buildScoreboards(dataset, tournamentId);
      return jsonResponse({ ok: true, ...scoreboards });
    }

    return jsonResponse({ error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

async function handleRaceResults(request) {
  if (request.method === 'OPTIONS') {
    return {
      status: 204,
      headers: corsHeaders()
    };
  }

  try {
    const token = await getAppAccessToken();
    const siteId = await getSiteId(token);
    const list = await ensureRaceList(token, siteId);
    const rawItems = await getAllRaceItems(token, siteId, list.id);
    const dataset = mapData(rawItems);

    const publishedTournaments = dataset.tournaments
      .filter((item) => item.status === 'published' || item.status === 'closed')
      .sort((a, b) => String(b.publishedAt || b.updatedAt || '').localeCompare(String(a.publishedAt || a.updatedAt || '')));

    const tournamentId = request.query.get('tournamentId') || (publishedTournaments[0] ? publishedTournaments[0].tournamentId : '');

    if (!tournamentId) {
      return jsonResponse({ ok: true, tournament: null, stageTables: [], gc: [] });
    }

    const tournament = dataset.tournaments.find((item) => item.tournamentId === tournamentId) || null;
    const scoreboards = buildScoreboards(dataset, tournamentId);

    return jsonResponse({
      ok: true,
      tournament,
      availableTournaments: publishedTournaments.map((item) => ({
        tournamentId: item.tournamentId,
        name: item.name,
        status: item.status,
        publishedAt: item.publishedAt || item.updatedAt || item.createdAt || null
      })),
      ...scoreboards
    });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

app.http('race-admin', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'race-admin/{action?}',
  handler: handleRaceAdmin
});

app.http('race-results', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'race-results',
  handler: handleRaceResults
});
