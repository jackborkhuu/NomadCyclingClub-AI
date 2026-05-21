# River City Cycling Club Website

This is a static website scaffold for the cycling club.

## Project files
- `index.html` — home page
- `about.html` — club story and leadership
- `events.html` — upcoming ride schedule
- `join.html` — membership information
- `gallery.html` — photo gallery placeholders
- `contact.html` — contact details and placeholder form
- `styles.css` — site styling
- `script.js` — mobile navigation and form placeholder

## Local preview
Open `index.html` in a browser to preview the site.

## GitHub setup
To upload this project to GitHub, run these commands from this folder:

```powershell
cd "C:\Users\jabork\Documents\cycling-club-website"
git init
git add .
git commit -m "Initial cycling club website scaffold"
```

Then create a GitHub repo and push:

```powershell
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## Azure deployment
After pushing to GitHub, use Azure Static Web Apps to deploy from this repo.
Set the app location to `/` and the output location to blank.

## Live gallery API (Option 1)
This project now includes an Azure Functions API under `api/` for live Facebook gallery pagination.

Add these application settings in Azure Static Web Apps:

- `FB_PAGE_ID` - Facebook Page ID
- `FB_PAGE_TOKEN` - long-lived page access token
- `FB_GRAPH_VERSION` - optional (defaults to `v23.0`)

The gallery frontend calls `/api/facebook-gallery` first and falls back to `data/facebook-feed.json` when live API data is unavailable.

## Member login and Club Lounge
This site now includes:

- `member-login.html` - Microsoft 365 member sign-in page
- `club-lounge.html` - members-only lounge with Discussions, Race Management, and Calendar
- `club-lounge.js` - O365 auth + group check + lounge UI logic

Before deploying, update `club-lounge.js` with real values:

- `LOUNGE_CONFIG.clientId` - Azure app registration client ID
- `LOUNGE_CONFIG.requiredGroupId` - Microsoft 365 group object ID for authorized members
- `LOUNGE_CONFIG.yammerGroupId` - Viva Engage (Yammer) group ID for Discussions

Required Microsoft Graph delegated permissions for the app:

- `User.Read`
- `GroupMember.Read.All` (admin consent required)

The login flow validates:

- User is in the `nomadcyclingclub.com` tenant
- User belongs to the configured member group

## Race registration and score keeping (SharePoint-backed)

This project now includes a board-managed race system with:

- Tournament creation and stage configuration (PST stage start times)
- Rider registration with auto-assigned integer rider ID
- Stage result entry with finish timestamp + stopwatch + elapsed milliseconds
- Real-time stage ranking and GC leaderboard updates in Club Lounge
- Public results page (`race-results.html`) that only shows published races
- Publish and close actions from board race management UI

### Files

- `club-lounge.html` - board race management UI panels
- `race-management.js` - race admin client logic
- `race-results.html` - public race results page
- `race-results.js` - public race results rendering
- `api/src/functions/race.js` - SharePoint list-backed API (`/api/race-admin/*`, `/api/race-results`)

### Required Azure Static Web Apps app settings

- `MS_TENANT_ID` - Microsoft Entra tenant ID
- `MS_CLIENT_ID` - app registration client ID used by API (application permissions)
- `MS_CLIENT_SECRET` - app registration secret
- `SP_HOSTNAME` - e.g. `nomadcyclingclub.sharepoint.com`
- `SP_SITE_PATH` - e.g. `/sites/NomadCyclingClub`
- `SP_RACE_LIST_NAME` - optional, defaults to `NomadRaceData`
- `ALLOWED_MEMBER_DOMAIN` - optional, defaults to `nomadcyclingclub.com`
- `BOARD_GROUP_OBJECT_ID` - board Microsoft 365 group object ID (required for board-only race admin)

### Graph permissions required for API app registration

Application permissions (admin consent):

- `Sites.ReadWrite.All`
- `GroupMember.Read.All`
- `User.Read.All`

### Behavior

- `/api/race-admin/config` checks if signed-in user is in board group.
- Board members can create tournaments, stages, riders, results, publish, and close.
- `Publish Results` controls what appears on `race-results.html`.
- `Close Race` marks the tournament as archived/read-only state in the workflow.

### Notes

- Data is stored in one SharePoint list (`NomadRaceData`) with typed entities (tournament, stage, rider, result).
- The API auto-creates the list on first board access via bootstrap.
