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
