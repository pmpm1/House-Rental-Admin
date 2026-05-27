# House Rental Admin

House Rental Admin is a small full-stack web application for managing house buy/sell listings, rental listings, home-loan calculations, and property profit/loss calculations. Data is saved in a relational SQLite database.

## Features

- Dashboard cards for total buy/sell listings, rental listings, available rentals, and total monthly rent.
- Home buy/sell form with insert, search, update, and delete actions.
- Home rental form with insert, search, update, and delete actions.
- Home loan calculator inspired by KBZ Bank's home loan calculator fields: property value, down payment, credit limit, interest rate, loan period, monthly payment, and total interest.
- Profit/loss calculator for each home with daily, monthly, yearly, capital gain/loss, and ROI outputs.
- Relational SQLite schema with foreign keys and indexes.
- Calculator results are saved to the database for audit/history.

## Technology Stack

- Node.js 22.5+ or newer
- Native `node:sqlite` database driver
- Vanilla HTML, CSS, and JavaScript
- SQLite database file stored in `data/house-rental.sqlite` by default

## Project Structure

```text
.
├── docs/database.md        # Relational DB documentation and formulas
├── public/                 # Browser UI
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── scripts/init-db.js      # Creates schema and optional seed data
├── src/
│   ├── calculators.js      # Home-loan and profit/loss formulas
│   └── db.js               # SQLite helpers
├── test/calculators.test.js
├── schema.sql              # Relational database schema
├── server.js               # HTTP server and JSON API
└── package.json
```

## Step-by-Step Environment Setup

### 1. Install Node.js

Install Node.js version 22.5 or newer. Node 24 is recommended because it includes the stable SQLite runtime used by this project.

Check your version:

```bash
node -v
npm -v
```

### 2. Install the application

No third-party packages are required, but running `npm install` creates a lock file if your environment needs one.

```bash
npm install
```

### 3. Initialize the database

Create the SQLite database tables and sample records:

```bash
npm run init-db
```

By default the database is created at:

```text
data/house-rental.sqlite
```

To use another database path:

```bash
DB_PATH=/absolute/path/house-rental.sqlite npm run init-db
```

### 4. Start the web application

```bash
npm start
```

Open the app in your browser:

```text
http://localhost:3000
```

To use a different port:

```bash
PORT=8080 npm start
```

### 5. Run tests

```bash
npm test
```

## How to Use

### Buy/Sell Listings

1. Go to **Buy/Sell**.
2. Enter property information such as title, address, city, bedrooms, bathrooms, and area.
3. Choose `Buy` or `Sell`.
4. Enter price, status, listing date, and contact information.
5. Click **Save Buy/Sell**.
6. Use the search box to filter records.
7. Use **Edit** to load a record back into the form.
8. Use **Delete** to remove a record.

### Rental Listings

1. Go to **Rent**.
2. Enter property information.
3. Enter monthly rent, deposit, lease dates, tenant information, and status.
4. Click **Save Rent**.
5. Search, edit, and delete using the controls in the table.

### Home Loan Calculator

1. Go to **Loan Calculator**.
2. Optionally select a saved property.
3. Enter property value, down payment percentage, interest rate, and loan period.
4. Click **Calculate & Save**.
5. Review credit limit, monthly payment, down payment amount, and total interest.

The formula uses standard amortized EMI calculation and matches the fields shown on the KBZ Home Loan page.

### Profit/Loss Calculator

1. Go to **Profit/Loss**.
2. Optionally select a saved property.
3. Enter purchase price, current value, monthly rent, monthly expenses, and other monthly income.
4. Click **Calculate & Save**.
5. Review daily, monthly, yearly, capital gain/loss, year-one total, and ROI results.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Dashboard totals |
| `GET` | `/api/properties?search=` | Search saved properties |
| `GET` | `/api/sales?search=` | Search buy/sell listings |
| `POST` | `/api/sales` | Create buy/sell listing |
| `PUT` | `/api/sales/:id` | Update buy/sell listing |
| `DELETE` | `/api/sales/:id` | Delete buy/sell listing |
| `GET` | `/api/rentals?search=` | Search rental listings |
| `POST` | `/api/rentals` | Create rental listing |
| `PUT` | `/api/rentals/:id` | Update rental listing |
| `DELETE` | `/api/rentals/:id` | Delete rental listing |
| `POST` | `/api/calculate/home-loan` | Calculate and save home-loan result |
| `POST` | `/api/calculate/profit-loss` | Calculate and save profit/loss result |

## Database Documentation

See [docs/database.md](docs/database.md) for the full relational schema, table descriptions, relationships, and formulas.

## Notes for Production

- Put the SQLite database on persistent storage.
- Back up `data/house-rental.sqlite` regularly.
- Add authentication before exposing this admin tool publicly.
- Run behind HTTPS in production.
- Consider adding migration tooling before changing schema after production data exists.
