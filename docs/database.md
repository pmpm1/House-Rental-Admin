# Relational Database Documentation

The application uses SQLite through Node.js `node:sqlite`. The default database file is `data/house-rental.sqlite`; set `DB_PATH=/custom/path.sqlite` to use a different location.

## Entity Relationship Overview

```text
properties 1 ─── * sale_listings
properties 1 ─── * rental_listings
properties 1 ─── * loan_calculations
properties 1 ─── * profit_loss_calculations
```

`properties` is the parent table. Buy/sell listings and rental listings require a property. Calculator records can be linked to a property or saved with `NULL` when the user calculates without selecting a property.

## Tables

### `properties`
Stores shared house details used by sale and rental modules.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER | Primary key |
| `title` | TEXT | Required property name |
| `address` | TEXT | Required street/address |
| `city` | TEXT | Required city |
| `property_type` | TEXT | House, Condo, Apartment, Land, etc. |
| `bedrooms`, `bathrooms` | INTEGER | Room counts |
| `area_sqft` | REAL | Size in square feet |
| `owner_name`, `owner_phone` | TEXT | Owner contact information |
| `notes` | TEXT | Admin notes |
| `created_at`, `updated_at` | TEXT | SQLite timestamps |

### `sale_listings`
Stores home buy/sell records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER | Primary key |
| `property_id` | INTEGER | Required FK to `properties(id)`, deletes cascade |
| `listing_type` | TEXT | `Buy` or `Sell` |
| `price` | REAL | Listing price |
| `status` | TEXT | Available, Reserved, Sold, Inactive |
| `listing_date` | TEXT | Listing date |
| `buyer_or_seller_name`, `contact_phone` | TEXT | Contact details |

### `rental_listings`
Stores home rental records.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER | Primary key |
| `property_id` | INTEGER | Required FK to `properties(id)`, deletes cascade |
| `monthly_rent` | REAL | Monthly rent amount |
| `deposit` | REAL | Deposit amount |
| `lease_start`, `lease_end` | TEXT | Lease dates |
| `tenant_name`, `tenant_phone` | TEXT | Tenant contact details |
| `status` | TEXT | Available, Occupied, Maintenance, Inactive |

### `loan_calculations`
Stores home-loan calculator output.

| Column | Type | Notes |
| --- | --- | --- |
| `property_id` | INTEGER | Optional FK to `properties(id)`, set null on delete |
| `property_value` | REAL | Input property value |
| `down_payment_percent`, `down_payment_amount` | REAL | Down payment input/output |
| `credit_limit` | REAL | Property value minus down payment |
| `annual_interest_rate` | REAL | Annual interest percentage |
| `loan_years` | INTEGER | Loan term |
| `monthly_payment`, `total_interest` | REAL | EMI outputs |

### `profit_loss_calculations`
Stores daily/monthly/yearly profit and loss output.

| Column | Type | Notes |
| --- | --- | --- |
| `property_id` | INTEGER | Optional FK to `properties(id)`, set null on delete |
| `purchase_price`, `current_value` | REAL | Capital values |
| `monthly_rent`, `monthly_expenses`, `other_monthly_income` | REAL | Monthly operating values |
| `daily_profit`, `monthly_profit`, `yearly_profit` | REAL | Recurring profit/loss outputs |
| `capital_gain_loss`, `roi_percent` | REAL | Capital movement and ROI |

## Calculator Formulas

### Home Loan
The UI follows the KBZ home loan calculator fields: property value, down payment, credit limit, interest rate, loan period, monthly payment, and total interest.

```text
down_payment_amount = property_value × down_payment_percent / 100
credit_limit = property_value - down_payment_amount
monthly_rate = annual_interest_rate / 100 / 12
months = loan_years × 12
monthly_payment = credit_limit × monthly_rate × (1 + monthly_rate)^months / ((1 + monthly_rate)^months - 1)
total_interest = monthly_payment × months - credit_limit
```

### Profit/Loss

```text
monthly_profit = monthly_rent + other_monthly_income - monthly_expenses
yearly_profit = monthly_profit × 12
daily_profit = yearly_profit / 365
capital_gain_loss = current_value - purchase_price
roi_percent = yearly_profit / purchase_price × 100
```
