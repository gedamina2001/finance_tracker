const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers: calculate first and last day of a month string (YYYY-MM)
function getMonthDateRange(monthStr) {
  // Expected format: YYYY-MM
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-12

  // Start date: YYYY-MM-01
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

  // End date: last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate };
}

// -----------------------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------------------

// 1. GET /api/transactions?month=YYYY-MM
// Fetches all transactions for a specific month, ordered chronologically
app.get('/api/transactions', async (req, res) => {
  try {
    const { month } = req.query;

    let query = supabase
      .from('finance')
      .select('*')
      .order('date', { ascending: false })
      .order('id', { ascending: false });

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const { startDate, endDate } = getMonthDateRange(month);
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 2. POST /api/transactions
// Adds a new transaction to the finance table
app.post('/api/transactions', async (req, res) => {
  try {
    const { date, amount, flow, type, category, method, note } = req.body;

    // Basic validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number.' });
    }
    if (!['Credit', 'Debit'].includes(flow)) {
      return res.status(400).json({ success: false, error: "Flow must be 'Credit' or 'Debit'." });
    }
    if (!['Income', 'Expense', 'Loan'].includes(type)) {
      return res.status(400).json({ success: false, error: "Type must be 'Income', 'Expense', or 'Loan'." });
    }
    if (!['Needs', 'Wants', 'Savings'].includes(category)) {
      return res.status(400).json({ success: false, error: "Category must be 'Needs', 'Wants', or 'Savings'." });
    }
    if (!['Cash', 'UPI', 'Bank Transfer'].includes(method)) {
      return res.status(400).json({ success: false, error: "Method must be 'Cash', 'UPI', or 'Bank Transfer'." });
    }

    const transactionDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('finance')
      .insert([
        {
          date: transactionDate,
          amount: parseFloat(amount),
          flow,
          type,
          category,
          method,
          note: note ? note.trim() : null
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 3. DELETE /api/transactions/:id
// Removes a transaction by ID
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('finance')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Finance Tracker server running at http://localhost:${PORT}`);
});
