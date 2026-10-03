# BlueLedger - Expense Tracker

A responsive expense tracker built with **HTML, CSS and vanilla JavaScript** for a Web Technology course project. It has a blue-contrast theme, a login system, a dashboard, transaction management and reports. No frameworks, no build step, no backend.

**Live site:** `https://<your-username>.github.io/<repo-name>/`

## Pages (single-page app)
| Page | What it does |
|------|--------------|
| Home | Landing page with a live quick-add preview |
| Log in / Register | Account creation, password strength meter, show/hide password, validation |
| Dashboard | Balance, monthly income and spending, budget bar, category donut chart, recent activity |
| Transactions | Add, edit, delete, search, filter, export CSV |
| Reports | Six-month income vs spending chart, monthly budget, insights |

**Budget alerts:** a pop-up warns you at 80% of your monthly budget and again when you cross 100%. A banner on the Dashboard stays visible while you are near or over the limit.

## Demo login
- Email: `demo@blueledger.com`
- Password: `Demo@1234`

## Run locally (VS Code)
1. Unzip the folder and open it in VS Code (`File > Open Folder`).
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

You can also just double-click `index.html`.

## Host on GitHub Pages
1. Create a new public repository on GitHub (for example `expense-tracker`).
2. Upload every file in this folder, or run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BlueLedger expense tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/expense-tracker.git
   git push -u origin main
   ```
3. On GitHub open **Settings > Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to `main` and folder `/ (root)`, then **Save**.
5. Wait about a minute. Your site appears at `https://<your-username>.github.io/expense-tracker/`.

## Folder structure
```
expense-tracker/
|-- index.html          # all pages (views)
|-- css/style.css       # blue theme and responsive layout
|-- js/app.js           # routing, auth, CRUD, charts
|-- assets/favicon.svg
|-- docs/PROJECT_REPORT.md
|-- README.md
|-- LICENSE
|-- .gitignore
`-- .nojekyll
```

## Security note
This is a front-end learning project. Users and passwords (SHA-256 hashed) are kept in the browser's `localStorage`, so data stays on one device and is not safe for real banking data. A production app would use a server, a database and salted password hashing such as bcrypt.

## Tech
HTML5, CSS3 (variables, grid, flexbox), JavaScript ES6+, Canvas API, Web Crypto API, localStorage, Google Fonts.

## License
MIT
