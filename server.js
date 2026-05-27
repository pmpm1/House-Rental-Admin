import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { calculateHomeLoan, calculateProfitLoss } from './src/calculators.js';
import { buildSearch, getRow, getRows, initializeDatabase, openDatabase, run } from './src/db.js';

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = resolve('public');
const db = openDatabase();
initializeDatabase(db);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function propertyParams(body) {
  return {
    title: body.title?.trim(),
    address: body.address?.trim(),
    city: body.city?.trim(),
    property_type: body.property_type || 'House',
    bedrooms: Number(body.bedrooms || 0),
    bathrooms: Number(body.bathrooms || 0),
    area_sqft: Number(body.area_sqft || 0),
    owner_name: body.owner_name || '',
    owner_phone: body.owner_phone || '',
    notes: body.notes || ''
  };
}

function validateProperty(params) {
  if (!params.title || !params.address || !params.city) {
    throw new Error('Title, address, and city are required.');
  }
}

function upsertProperty(body, existingId = null) {
  const params = propertyParams(body);
  validateProperty(params);
  if (existingId) {
    run(db, `UPDATE properties SET title = $title, address = $address, city = $city, property_type = $property_type,
      bedrooms = $bedrooms, bathrooms = $bathrooms, area_sqft = $area_sqft, owner_name = $owner_name,
      owner_phone = $owner_phone, notes = $notes, updated_at = CURRENT_TIMESTAMP WHERE id = $id`, { ...params, id: existingId });
    return existingId;
  }
  const result = run(db, `INSERT INTO properties (title, address, city, property_type, bedrooms, bathrooms, area_sqft, owner_name, owner_phone, notes)
    VALUES ($title, $address, $city, $property_type, $bedrooms, $bathrooms, $area_sqft, $owner_name, $owner_phone, $notes)`, params);
  return Number(result.lastInsertRowid);
}

function listSales(search) {
  const { clause, params } = buildSearch(search, ['p.title', 'p.address', 'p.city', 's.listing_type', 's.status', 's.buyer_or_seller_name']);
  return getRows(db, `SELECT s.*, p.title, p.address, p.city, p.property_type, p.bedrooms, p.bathrooms, p.area_sqft, p.owner_name, p.owner_phone, p.notes
    FROM sale_listings s JOIN properties p ON p.id = s.property_id WHERE 1=1 ${clause} ORDER BY s.updated_at DESC`, params);
}

function listRentals(search) {
  const { clause, params } = buildSearch(search, ['p.title', 'p.address', 'p.city', 'r.status', 'r.tenant_name']);
  return getRows(db, `SELECT r.*, p.title, p.address, p.city, p.property_type, p.bedrooms, p.bathrooms, p.area_sqft, p.owner_name, p.owner_phone, p.notes
    FROM rental_listings r JOIN properties p ON p.id = r.property_id WHERE 1=1 ${clause} ORDER BY r.updated_at DESC`, params);
}

async function handleApi(req, res, url) {
  const idMatch = url.pathname.match(/^\/api\/(sales|rentals)\/(\d+)$/);
  try {
    if (url.pathname === '/api/dashboard') {
      const saleCount = getRow(db, 'SELECT COUNT(*) AS count FROM sale_listings').count;
      const rentalCount = getRow(db, 'SELECT COUNT(*) AS count FROM rental_listings').count;
      const availableRentals = getRow(db, "SELECT COUNT(*) AS count FROM rental_listings WHERE status = 'Available'").count;
      const totalMonthlyRent = getRow(db, 'SELECT COALESCE(SUM(monthly_rent), 0) AS total FROM rental_listings').total;
      return sendJson(res, 200, { saleCount, rentalCount, availableRentals, totalMonthlyRent });
    }

    if (url.pathname === '/api/properties') {
      const search = url.searchParams.get('search');
      const { clause, params } = buildSearch(search, ['title', 'address', 'city', 'owner_name']);
      return sendJson(res, 200, getRows(db, `SELECT * FROM properties WHERE 1=1 ${clause} ORDER BY updated_at DESC`, params));
    }

    if (url.pathname === '/api/sales' && req.method === 'GET') {
      return sendJson(res, 200, listSales(url.searchParams.get('search')));
    }
    if (url.pathname === '/api/sales' && req.method === 'POST') {
      const body = await parseBody(req);
      const propertyId = upsertProperty(body);
      run(db, `INSERT INTO sale_listings (property_id, listing_type, price, status, listing_date, buyer_or_seller_name, contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [propertyId, body.listing_type, Number(body.price), body.status || 'Available', body.listing_date || new Date().toISOString().slice(0, 10), body.buyer_or_seller_name || '', body.contact_phone || '']);
      return sendJson(res, 201, { message: 'Buy/Sell listing created.' });
    }

    if (url.pathname === '/api/rentals' && req.method === 'GET') {
      return sendJson(res, 200, listRentals(url.searchParams.get('search')));
    }
    if (url.pathname === '/api/rentals' && req.method === 'POST') {
      const body = await parseBody(req);
      const propertyId = upsertProperty(body);
      run(db, `INSERT INTO rental_listings (property_id, monthly_rent, deposit, lease_start, lease_end, tenant_name, tenant_phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [propertyId, Number(body.monthly_rent), Number(body.deposit || 0), body.lease_start || null, body.lease_end || null, body.tenant_name || '', body.tenant_phone || '', body.status || 'Available']);
      return sendJson(res, 201, { message: 'Rental listing created.' });
    }

    if (idMatch && req.method === 'PUT') {
      const [, type, id] = idMatch;
      const body = await parseBody(req);
      const table = type === 'sales' ? 'sale_listings' : 'rental_listings';
      const row = getRow(db, `SELECT property_id FROM ${table} WHERE id = ?`, [Number(id)]);
      if (!row) return sendJson(res, 404, { error: 'Record not found.' });
      upsertProperty(body, row.property_id);
      if (type === 'sales') {
        run(db, `UPDATE sale_listings SET listing_type = ?, price = ?, status = ?, listing_date = ?, buyer_or_seller_name = ?, contact_phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [body.listing_type, Number(body.price), body.status, body.listing_date || new Date().toISOString().slice(0, 10), body.buyer_or_seller_name || '', body.contact_phone || '', Number(id)]);
      } else {
        run(db, `UPDATE rental_listings SET monthly_rent = ?, deposit = ?, lease_start = ?, lease_end = ?, tenant_name = ?, tenant_phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [Number(body.monthly_rent), Number(body.deposit || 0), body.lease_start || null, body.lease_end || null, body.tenant_name || '', body.tenant_phone || '', body.status, Number(id)]);
      }
      return sendJson(res, 200, { message: 'Record updated.' });
    }

    if (idMatch && req.method === 'DELETE') {
      const [, type, id] = idMatch;
      run(db, `DELETE FROM ${type === 'sales' ? 'sale_listings' : 'rental_listings'} WHERE id = ?`, [Number(id)]);
      return sendJson(res, 200, { message: 'Record deleted.' });
    }

    if (url.pathname === '/api/calculate/home-loan' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = calculateHomeLoan(body);
      run(db, `INSERT INTO loan_calculations (property_id, property_value, down_payment_percent, down_payment_amount, credit_limit, annual_interest_rate, loan_years, monthly_payment, total_interest)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [body.property_id || null, result.propertyValue, result.downPaymentPercent, result.downPaymentAmount, result.creditLimit, result.annualInterestRate, result.loanYears, result.monthlyPayment, result.totalInterest]);
      return sendJson(res, 200, result);
    }

    if (url.pathname === '/api/calculate/profit-loss' && req.method === 'POST') {
      const body = await parseBody(req);
      const result = calculateProfitLoss(body);
      run(db, `INSERT INTO profit_loss_calculations (property_id, purchase_price, current_value, monthly_rent, monthly_expenses, other_monthly_income, daily_profit, monthly_profit, yearly_profit, capital_gain_loss, roi_percent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [body.property_id || null, Number(body.purchasePrice), Number(body.currentValue), Number(body.monthlyRent), Number(body.monthlyExpenses), Number(body.otherMonthlyIncome || 0), result.dailyProfit, result.monthlyProfit, result.yearlyProfit, result.capitalGainLoss, result.roiPercent]);
      return sendJson(res, 200, result);
    }

    sendJson(res, 404, { error: 'API route not found.' });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = normalize(requested).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    const data = await readFile(join(PUBLIC_DIR, 'index.html'));
    res.writeHead(200, { 'Content-Type': contentTypes['.html'] });
    res.end(data);
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return serveStatic(req, res, url);
}).listen(PORT, () => {
  console.log(`House Rental Admin running on http://localhost:${PORT}`);
});
