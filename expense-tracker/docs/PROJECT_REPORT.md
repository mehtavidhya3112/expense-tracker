# Project Report - BlueLedger Expense Tracker

## 1. Aim
Build a responsive, interactive expense tracker using only HTML, CSS and JavaScript, hosted free on GitHub Pages.

## 2. Features
- User registration and login with validation and password hashing (SHA-256 via Web Crypto API)
- Protected pages: dashboard, transactions and reports require login
- Create, read, update and delete transactions
- Search and filter by type and category
- Monthly budget with colour-coded progress (blue, amber at 80%, red when exceeded)
- Canvas charts: category donut and six-month bar chart
- Budget alerts: pop-up at 80% and at 100% of the monthly budget (fires only when the level rises), plus a persistent Dashboard banner
- CSV export
- Responsive layout with mobile menu, keyboard focus styles and reduced-motion support

## 3. Design
- Palette: Ink `#061330`, Navy `#0A1F44`, Cobalt `#1F5BFF`, Sky `#7CC4FF`, Ice `#EAF3FF`
- Fonts: Bricolage Grotesque (headings), DM Sans (body)

## 4. Architecture
Single-page app. `index.html` holds every view; `js/app.js` switches views using the URL hash (`#/dashboard`), which works on GitHub Pages without server rules. Data is saved per user in `localStorage` under `bl_tx_<email>` and `bl_bud_<email>`.

## 5. Testing checklist
- [ ] Register with a weak password shows an error
- [ ] Register then log out and log in again
- [ ] Opening `#/dashboard` while logged out redirects to login
- [ ] Add, edit, delete a transaction
- [ ] Filters and search narrow the table
- [ ] Budget bar changes colour as spending grows
- [ ] Set budget to 5000, add an expense that pushes spending past it: the red alert pop-up appears
- [ ] CSV downloads and opens in Excel
- [ ] Layout works at 375px width

## 6. Limitations and future work
Data lives only in the browser. Future work: backend API with a database, salted password hashing, recurring expenses, multi-currency, dark mode.
