import { openDatabase, initializeDatabase, getRow, run } from '../src/db.js';

const db = openDatabase();
initializeDatabase(db);

const existing = getRow(db, 'SELECT COUNT(*) AS count FROM properties');
if (existing.count === 0) {
  const seed = db.prepare(`
    INSERT INTO properties (title, address, city, property_type, bedrooms, bathrooms, area_sqft, owner_name, owner_phone, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const first = seed.run('Downtown Family House', 'No. 12 Main Road', 'Yangon', 'House', 4, 3, 2400, 'Daw Mya', '09-123456789', 'Near school and market');
  const second = seed.run('Lake View Condo', 'Room 8B, Lake Street', 'Mandalay', 'Condo', 2, 2, 950, 'U Aung', '09-987654321', 'Good for rental income');

  run(db, `INSERT INTO sale_listings (property_id, listing_type, price, status, buyer_or_seller_name, contact_phone)
    VALUES (?, 'Sell', 280000000, 'Available', 'Daw Mya', '09-123456789')`, [first.lastInsertRowid]);
  run(db, `INSERT INTO rental_listings (property_id, monthly_rent, deposit, lease_start, lease_end, tenant_name, tenant_phone, status)
    VALUES (?, 850000, 1700000, '2026-01-01', '2026-12-31', 'Ko Min', '09-111222333', 'Occupied')`, [second.lastInsertRowid]);
}

console.log('Database initialized at', process.env.DB_PATH || 'data/house-rental.sqlite');
