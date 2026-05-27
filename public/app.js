const money = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const $ = (selector) => document.querySelector(selector);
const forms = { sale: $('#saleForm'), rental: $('#rentalForm'), loan: $('#loanForm'), profit: $('#profitForm') };
let saleRows = [];
let rentalRows = [];

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function fillForm(form, row) {
  Object.entries(row).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) field.value = value ?? '';
  });
  window.scrollTo({ top: form.closest('.panel').offsetTop - 16, behavior: 'smooth' });
}

function resetForm(form) {
  form.reset();
  form.elements.id.value = '';
  if (form.elements.property_id) form.elements.property_id.value = '';
}

async function loadDashboard() {
  const data = await api('/api/dashboard');
  $('#saleCount').textContent = data.saleCount;
  $('#rentalCount').textContent = data.rentalCount;
  $('#availableRentals').textContent = data.availableRentals;
  $('#totalMonthlyRent').textContent = money.format(data.totalMonthlyRent);
}

function saleTable(rows) {
  $('#saleRows').innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${row.title}</strong><small>${row.address}, ${row.city} • ${row.bedrooms} bed / ${row.bathrooms} bath</small></td>
      <td>${row.listing_type}<small>${row.property_type}</small></td>
      <td>${money.format(row.price)}</td>
      <td>${row.status}</td>
      <td>${row.buyer_or_seller_name || '-'}<small>${row.contact_phone || row.owner_phone || ''}</small></td>
      <td><div class="actions"><button data-edit-sale="${row.id}">Edit</button><button class="danger" data-delete-sale="${row.id}">Delete</button></div></td>
    </tr>`).join('') || '<tr><td colspan="6">No buy/sell listings found.</td></tr>';
}

function rentalTable(rows) {
  $('#rentalRows').innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${row.title}</strong><small>${row.address}, ${row.city} • ${row.bedrooms} bed / ${row.bathrooms} bath</small></td>
      <td>${money.format(row.monthly_rent)}<small>Deposit: ${money.format(row.deposit)}</small></td>
      <td>${row.lease_start || '-'}<small>${row.lease_end || ''}</small></td>
      <td>${row.status}</td>
      <td>${row.tenant_name || '-'}<small>${row.tenant_phone || ''}</small></td>
      <td><div class="actions"><button data-edit-rental="${row.id}">Edit</button><button class="danger" data-delete-rental="${row.id}">Delete</button></div></td>
    </tr>`).join('') || '<tr><td colspan="6">No rental listings found.</td></tr>';
}

async function loadSales() {
  saleRows = await api(`/api/sales?search=${encodeURIComponent($('#saleSearch').value)}`);
  saleTable(saleRows);
}

async function loadRentals() {
  rentalRows = await api(`/api/rentals?search=${encodeURIComponent($('#rentalSearch').value)}`);
  rentalTable(rentalRows);
}

async function loadProperties(targetSelect, search = '') {
  const rows = await api(`/api/properties?search=${encodeURIComponent(search)}`);
  targetSelect.innerHTML = '<option value="">No property selected</option>' + rows.map((row) => `<option value="${row.id}">${row.title} — ${row.city}</option>`).join('');
}

forms.sale.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formData(forms.sale);
  const path = data.id ? `/api/sales/${data.id}` : '/api/sales';
  await api(path, { method: data.id ? 'PUT' : 'POST', body: JSON.stringify(data) });
  toast(data.id ? 'Buy/Sell listing updated.' : 'Buy/Sell listing created.');
  resetForm(forms.sale); await refreshAll();
});

forms.rental.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = formData(forms.rental);
  const path = data.id ? `/api/rentals/${data.id}` : '/api/rentals';
  await api(path, { method: data.id ? 'PUT' : 'POST', body: JSON.stringify(data) });
  toast(data.id ? 'Rental listing updated.' : 'Rental listing created.');
  resetForm(forms.rental); await refreshAll();
});

forms.loan.addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await api('/api/calculate/home-loan', { method: 'POST', body: JSON.stringify(formData(forms.loan)) });
  $('#loanResult').innerHTML = [
    ['Credit Limit', result.creditLimit], ['Monthly Payment', result.monthlyPayment], ['Down Payment', result.downPaymentAmount], ['Total Interest', result.totalInterest]
  ].map(([label, value]) => `<article><small>${label}</small><strong>${money.format(value)}</strong></article>`).join('');
  toast('Home loan calculation saved.');
});

forms.profit.addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await api('/api/calculate/profit-loss', { method: 'POST', body: JSON.stringify(formData(forms.profit)) });
  $('#profitResult').innerHTML = [
    ['Daily', result.dailyProfit], ['Monthly', result.monthlyProfit], ['Yearly', result.yearlyProfit], ['Capital Gain/Loss', result.capitalGainLoss], ['Year One Total', result.totalYearOneProfitLoss], ['ROI %', result.roiPercent]
  ].map(([label, value]) => `<article><small>${label}</small><strong>${money.format(value)}</strong></article>`).join('');
  toast('Profit/loss calculation saved.');
});

document.addEventListener('click', async (event) => {
  const saleEdit = event.target.dataset.editSale;
  const rentalEdit = event.target.dataset.editRental;
  const saleDelete = event.target.dataset.deleteSale;
  const rentalDelete = event.target.dataset.deleteRental;
  const reset = event.target.dataset.reset;
  if (reset) return resetForm(document.getElementById(reset));
  if (saleEdit) return fillForm(forms.sale, saleRows.find((row) => row.id === Number(saleEdit)));
  if (rentalEdit) return fillForm(forms.rental, rentalRows.find((row) => row.id === Number(rentalEdit)));
  if (saleDelete && confirm('Delete this buy/sell listing?')) { await api(`/api/sales/${saleDelete}`, { method: 'DELETE' }); toast('Buy/Sell listing deleted.'); await refreshAll(); }
  if (rentalDelete && confirm('Delete this rental listing?')) { await api(`/api/rentals/${rentalDelete}`, { method: 'DELETE' }); toast('Rental listing deleted.'); await refreshAll(); }
});

$('#saleSearch').addEventListener('input', loadSales);
$('#rentalSearch').addEventListener('input', loadRentals);
$('#loanSearch').addEventListener('input', (e) => loadProperties($('#loanProperty'), e.target.value));
$('#profitSearch').addEventListener('input', (e) => loadProperties($('#profitProperty'), e.target.value));

async function refreshAll() {
  await Promise.all([loadDashboard(), loadSales(), loadRentals(), loadProperties($('#loanProperty')), loadProperties($('#profitProperty'))]);
}

refreshAll().catch((error) => toast(error.message));
