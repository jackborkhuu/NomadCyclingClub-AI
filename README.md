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
