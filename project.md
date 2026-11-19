# Personal Finance Tracker - Project Specification

## 1. Project Overview
A simple, beginner-friendly personal finance tracking web application designed to log daily income, expenses, and loans, display transactions in a monthly format, and provide visual monthly statistical insights (including 50/30/20 budgeting analysis).

---

## 2. Technology Stack
* **Backend:** Node.js with Express.js (REST API server)
* **Frontend:** HTML5 with Tailwind CSS (UI styling) and vanilla JavaScript (client-side data fetching and rendering)
* **Database & Storage:** Supabase (PostgreSQL cloud database, table/storage named: `finance`)
* **Environment & Security:** `dotenv` for keeping secret credentials server-side

---

## 3. Database Schema (`finance`)
All transaction records are stored in the Supabase entity named `finance` with the following column structure:

| Field Name | Type | Options / Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer / UUID | Auto-generated | Serial number / Unique transaction ID (`s/n`) |
| `date` | Date | `YYYY-MM-DD` | Date of the transaction |
| `amount` | Numeric / Float | Positive numbers | Transaction monetary amount |
| `flow` | String | `Credit`, `Debit` | Indicates money coming in (`Credit`) or going out (`Debit`) |
| `type` | String | `Income`, `Expense`, `Loan` | High-level financial transaction category |
| `category` | String | `Needs`, `Wants`, `Savings` | 50/30/20 budget classification |
| `method` | String | `Cash`, `UPI`, `Bank Transfer` | Payment channel used |
| `note` | String / Text | Free text | Memo or description for context |
| `created_at` | Timestamp | Auto timestamp | Timestamp when the entry was saved |

---

## 4. Key Functional Requirements

### 4.1 Monthly Organization & View Filtering
* Transactions must be displayed in a **monthly format** (e.g., filtered for `November 2026`).
* **Month Selector:** Dropdown or date picker to view past or current months.
* **Automatic Reset Button:**
  * Resets the active view back to the current ongoing month.
  * Clears the input form fields.
  * *Important:* Data from previous months is preserved historically in Supabase and is not deleted.

### 4.2 Monthly Statistical Insights
The dashboard must automatically compute and display the following summaries for the active month:
* **Cash Flow Summary:**
  * Total Inflow (Sum of `Credit` transactions)
  * Total Outflow (Sum of `Debit` transactions)
  * Net Monthly Balance (`Total Inflow - Total Outflow`)
* **50/30/20 Budget Breakdown:**
  * Total spent on **Needs** (and percentage of total income)
  * Total spent on **Wants** (and percentage of total income)
  * Total allocated to **Savings** (and percentage of total income)
* **Payment Method Breakdown:**
  * Spending distribution across `Cash`, `UPI`, and `Bank Transfer`.
* **Loan Activity:**
  * Track incoming borrowed money vs. outgoing loan repayments.

### 4.3 Transaction Entry Form
* Responsive form with inputs for Date, Amount, Flow, Type, Category (Needs/Wants/Savings), Method, and Note.
* Input validation (ensures valid positive amounts and required fields).

---

## 5. Backend Architecture & API Routes
The Express.js server communicates with Supabase and serves the frontend:
* `GET /api/transactions?month=YYYY-MM`: Queries the `finance` table in Supabase for transactions within the specified month.
* `POST /api/transactions`: Validates transaction form submission and inserts a new row into the `finance` table.
* `DELETE /api/transactions/:id`: Deletes a specific transaction from the `finance` table.

---

## 6. Security Guidelines
* Store Supabase URL and keys in a private `.env` file on the server.
* Never expose the Supabase `private` / secret key to the browser or in public repositories.
* Maintain `.env` and `credentials.md` in `.gitignore`.
