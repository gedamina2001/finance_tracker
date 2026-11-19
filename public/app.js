// State management
let currentMonth = getCurrentMonthString();

// DOM Elements
const monthPicker = document.getElementById('monthPicker');
const resetBtn = document.getElementById('resetBtn');
const currentMonthBadge = document.getElementById('currentMonthBadge');
const transactionsBody = document.getElementById('transactionsBody');
const emptyState = document.getElementById('emptyState');
const tableRecordCount = document.getElementById('tableRecordCount');
const transactionForm = document.getElementById('transactionForm');
const formDate = document.getElementById('formDate');

// Stats DOM Elements
const totalInflowEl = document.getElementById('totalInflow');
const totalOutflowEl = document.getElementById('totalOutflow');
const netBalanceEl = document.getElementById('netBalance');
const savingsRateLabel = document.getElementById('savingsRateLabel');
const needsTotalEl = document.getElementById('needsTotal');
const needsPercentEl = document.getElementById('needsPercent');
const needsBar = document.getElementById('needsBar');
const wantsTotalEl = document.getElementById('wantsTotal');
const wantsPercentEl = document.getElementById('wantsPercent');
const wantsBar = document.getElementById('wantsBar');
const savingsTotalEl = document.getElementById('savingsTotal');
const savingsPercentEl = document.getElementById('savingsPercent');
const savingsBar = document.getElementById('savingsBar');
const upiTotalEl = document.getElementById('upiTotal');
const cashTotalEl = document.getElementById('cashTotal');
const bankTotalEl = document.getElementById('bankTotal');

// Helper: Get Current Year-Month String (YYYY-MM)
function getCurrentMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper: Format Currency (INR)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

// Helper: Format Date to Readable String
function formatDate(dateString) {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return dateString;
}

// -----------------------------------------------------------------------------
// Fetch and Render Transactions
// -----------------------------------------------------------------------------
async function loadTransactions() {
  try {
    currentMonthBadge.textContent = currentMonth;
    monthPicker.value = currentMonth;

    const res = await fetch(`/api/transactions?month=${currentMonth}`);
    const result = await res.json();

    if (!result.success) {
      alert('Error fetching transactions: ' + (result.error || 'Unknown error'));
      return;
    }

    const transactions = result.data || [];
    renderTable(transactions);
    calculateAndRenderStats(transactions);
  } catch (err) {
    console.error('Failed to load transactions:', err);
  }
}

function renderTable(transactions) {
  transactionsBody.innerHTML = '';
  tableRecordCount.textContent = `${transactions.length} record${transactions.length === 1 ? '' : 's'}`;

  if (transactions.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  transactions.forEach((tx, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/70 transition-colors';

    const isCredit = tx.flow === 'Credit';
    const amountClass = isCredit ? 'text-emerald-600 font-bold' : 'text-slate-900 font-semibold';
    const amountPrefix = isCredit ? '+ ' : '- ';

    // Flow badge styling
    const flowBadgeClass = isCredit 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-rose-50 text-rose-700 border-rose-200';

    // Bucket badge styling
    let bucketClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (tx.category === 'Needs') bucketClass = 'bg-blue-50 text-blue-700 border-blue-200';
    if (tx.category === 'Wants') bucketClass = 'bg-amber-50 text-amber-700 border-amber-200';
    if (tx.category === 'Savings') bucketClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    tr.innerHTML = `
      <td class="px-5 py-3.5 text-xs text-slate-400 font-mono">${index + 1}</td>
      <td class="px-5 py-3.5 text-xs font-medium text-slate-700">${formatDate(tx.date)}</td>
      <td class="px-5 py-3.5 ${amountClass}">${amountPrefix}${formatCurrency(tx.amount)}</td>
      <td class="px-5 py-3.5">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${flowBadgeClass}">
          ${tx.flow}
        </span>
      </td>
      <td class="px-5 py-3.5 text-xs font-medium text-slate-700">${tx.type}</td>
      <td class="px-5 py-3.5">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${bucketClass}">
          ${tx.category}
        </span>
      </td>
      <td class="px-5 py-3.5 text-xs text-slate-600">${tx.method}</td>
      <td class="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate" title="${tx.note || ''}">${tx.note || '-'}</td>
      <td class="px-5 py-3.5 text-right">
        <button 
          onclick="deleteTransaction(${tx.id})" 
          class="text-xs text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
          title="Delete transaction"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </td>
    `;

    transactionsBody.appendChild(tr);
  });
}

// -----------------------------------------------------------------------------
// Monthly Statistics Engine
// -----------------------------------------------------------------------------
function calculateAndRenderStats(transactions) {
  let totalInflow = 0;
  let totalOutflow = 0;

  // 50/30/20 buckets (based on expenses/debits)
  let needsTotal = 0;
  let wantsTotal = 0;
  let savingsTotal = 0;

  // Payment methods
  let upiTotal = 0;
  let cashTotal = 0;
  let bankTotal = 0;

  transactions.forEach(tx => {
    const amt = parseFloat(tx.amount) || 0;

    if (tx.flow === 'Credit') {
      totalInflow += amt;
    } else {
      totalOutflow += amt;

      // Category breakdown
      if (tx.category === 'Needs') needsTotal += amt;
      if (tx.category === 'Wants') wantsTotal += amt;
      if (tx.category === 'Savings') savingsTotal += amt;

      // Method breakdown
      if (tx.method === 'UPI') upiTotal += amt;
      if (tx.method === 'Cash') cashTotal += amt;
      if (tx.method === 'Bank Transfer') bankTotal += amt;
    }
  });

  const netBalance = totalInflow - totalOutflow;

  // Update Top Cards
  totalInflowEl.textContent = formatCurrency(totalInflow);
  totalOutflowEl.textContent = formatCurrency(totalOutflow);
  netBalanceEl.textContent = formatCurrency(netBalance);
  netBalanceEl.className = `text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`;

  // Savings rate percentage based on total income
  const savingsRate = totalInflow > 0 ? Math.max(0, Math.round(((totalInflow - totalOutflow) / totalInflow) * 100)) : 0;
  savingsRateLabel.textContent = `Net Savings Rate: ${savingsRate}%`;

  // 50/30/20 Rule Calculations (Percentages of total outflow)
  const totalTracked = totalOutflow > 0 ? totalOutflow : 1;
  const needsPct = totalOutflow > 0 ? Math.round((needsTotal / totalTracked) * 100) : 0;
  const wantsPct = totalOutflow > 0 ? Math.round((wantsTotal / totalTracked) * 100) : 0;
  const savingsPct = totalOutflow > 0 ? Math.round((savingsTotal / totalTracked) * 100) : 0;

  needsTotalEl.textContent = formatCurrency(needsTotal);
  needsPercentEl.textContent = `${needsPct}%`;
  needsBar.style.width = `${Math.min(needsPct, 100)}%`;

  wantsTotalEl.textContent = formatCurrency(wantsTotal);
  wantsPercentEl.textContent = `${wantsPct}%`;
  wantsBar.style.width = `${Math.min(wantsPct, 100)}%`;

  savingsTotalEl.textContent = formatCurrency(savingsTotal);
  savingsPercentEl.textContent = `${savingsPct}%`;
  savingsBar.style.width = `${Math.min(savingsPct, 100)}%`;

  // Payment Methods
  upiTotalEl.textContent = formatCurrency(upiTotal);
  cashTotalEl.textContent = formatCurrency(cashTotal);
  bankTotalEl.textContent = formatCurrency(bankTotal);
}

// -----------------------------------------------------------------------------
// Add Transaction (Form Submission)
// -----------------------------------------------------------------------------
transactionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    date: formDate.value,
    amount: document.getElementById('formAmount').value,
    flow: document.getElementById('formFlow').value,
    type: document.getElementById('formType').value,
    category: document.getElementById('formCategory').value,
    method: document.getElementById('formMethod').value,
    note: document.getElementById('formNote').value
  };

  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!result.success) {
      alert('Error creating transaction: ' + (result.error || 'Failed'));
      return;
    }

    // Reset input fields
    document.getElementById('formAmount').value = '';
    document.getElementById('formNote').value = '';

    // Switch view to the month of the added transaction if different
    const txMonth = payload.date.slice(0, 7);
    currentMonth = txMonth;
    monthPicker.value = currentMonth;

    await loadTransactions();
  } catch (err) {
    console.error('Error submitting transaction:', err);
    alert('Failed to connect to the server.');
  }
});

// -----------------------------------------------------------------------------
// Delete Transaction
// -----------------------------------------------------------------------------
async function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;

  try {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (!result.success) {
      alert('Error deleting transaction: ' + (result.error || 'Failed'));
      return;
    }

    await loadTransactions();
  } catch (err) {
    console.error('Error deleting transaction:', err);
    alert('Failed to delete transaction.');
  }
}

// -----------------------------------------------------------------------------
// Event Listeners for Month Change & Reset
// -----------------------------------------------------------------------------
monthPicker.addEventListener('change', (e) => {
  if (e.target.value) {
    currentMonth = e.target.value;
    loadTransactions();
  }
});

resetBtn.addEventListener('click', () => {
  currentMonth = getCurrentMonthString();
  monthPicker.value = currentMonth;
  loadTransactions();
});

// -----------------------------------------------------------------------------
// Initial Setup on Page Load
// -----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Set today as default date in form
  const today = new Date().toISOString().split('T')[0];
  formDate.value = today;

  // Set month picker
  monthPicker.value = currentMonth;

  // Load transactions
  loadTransactions();
});
