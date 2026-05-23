```markdown
# ShopDesk – Shop Management System

A modern, full‑stack web application to manage inventory, sales, purchases, users, debts, and reports – all from a single, clean dashboard. Built as a **Progressive Web App (PWA)** so it feels like a native app on phones and desktops.

## ✨ Features

### 🔐 Authentication & Authorization
Secure login with http‑only cookies, role‑based access (Admin / User), and route guards. CORS is configured to accept multiple trusted origins.

### 📊 Dashboard
Real‑time overview of sales, purchases, low‑stock alerts, top products, revenue trends (charts), and **outstanding debt**.  New cards show **yesterday’s revenue** and **net collected today** (revenue minus today’s new credit sales).

### 📦 Product Management
Add, edit, delete, and search products. Bulk creation supported.  **All authenticated users** can now manage products.

### 🏷️ Stock Management
Track quantities, cost prices, and selling prices. Bulk stock entry, search, and low‑stock warnings.  
**Weighted average cost logic** keeps profit margins accurate.  **Decimal quantities** (e.g., kg) are fully supported.

### 💰 Sales Management
Record single or bulk sales. Automatic stock deduction.  **Payment methods** include Cash, Mobile Money, and **Credit**.  When a sale is marked as Credit, a debt record is automatically created.  View all sales or **today’s sales** with search and pagination.

### 🛒 Purchase Management
Record purchases with supplier details and dates. See purchase history, item breakdowns, and total values.  When you restock a product at a different price, the **weighted average cost** updates automatically.

### 💳 Debt Management *(new)*
- **Credit Sales** – automatically create a debt when a sale is marked as “Credit”.
- **Legacy Debts** – record old debts that existed before the system, with optional customer details.
- **Payment Recording** – mark partial or full payments; debts are automatically set to “Paid”.
- **Dashboard Integration** – see total outstanding debt and net collected amounts.

### 👥 User Management (Admin only)
Create, delete, and list system users. Only admins can access this module.

### 📈 Reports
Sales, purchase, profit reports with date filtering. Daily sales graph, top products chart, and downloadable data.

### 📱 PWA (Progressive Web App)
Installable on Android, iOS, and desktop, with an **“Install App” button** in the sidebar and an **offline fallback page**.

### 📐 Responsive Design
Mobile‑first layout: sidebar adapts to an overlay, modals become bottom‑sheets, and all tables work perfectly on small screens.

### ❤️ Health & Monitoring
A lightweight `/health` endpoint for uptime monitoring.  Includes a configurable DB keep‑alive ping.

---

## 🛠 Tech Stack

| Layer        | Technology                           |
|--------------|--------------------------------------|
| Frontend     | React + Vite                          |
| Styling      | Tailwind CSS (v4, CSS‑first config)  |
| Charts       | Recharts                             |
| Backend      | Node.js + Express                    |
| Database     | MySQL with Sequelize ORM             |
| Migrations   | Sequelize CLI                        |
| Auth         | JWT (http‑only cookies)              |
| PWA          | vite-plugin-pwa (Workbox)            |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MySQL (or any Sequelize‑compatible DB)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/shopdesk.git
   cd shopdesk
   ```

2. **Backend setup**

   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file based on `.env.example`:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=yourpassword
   DB_NAME=shopdesk
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   CORS_ORIGINS=http://localhost:5173
   ```

   Run database migrations:

   ```bash
   npx sequelize-cli db:migrate
   ```

   Start the backend:

   ```bash
   npm run dev
   ```

3. **Frontend setup**

   ```bash
   cd frontend
   npm install
   ```

   Create a `.env` file:

   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

### Production Build

To build the frontend and serve it via the backend (or a static host):

```bash
cd frontend
npm run build
```

For the PWA, the production build automatically generates the service worker and manifest.

---

## 🌍 Environment Variables

### Backend

| Variable         | Description                              |
|------------------|------------------------------------------|
| `PORT`           | Server port                              |
| `DB_HOST`        | MySQL host                               |
| `DB_USER`        | MySQL username                           |
| `DB_PASS`        | MySQL password                           |
| `DB_NAME`        | Database name                            |
| `JWT_SECRET`     | Secret key for JWT tokens                |
| `NODE_ENV`       | `development` or `production`            |
| `CORS_ORIGINS`   | Comma‑separated list of allowed origins  |

### Frontend

| Variable        | Description              |
|-----------------|--------------------------|
| `VITE_API_URL`  | Backend API base URL     |

---

## 🚢 Deployment

- **Frontend**: Deploy the `dist` folder to Vercel, Netlify, or any static host. Set `VITE_API_URL` to your live backend URL.
- **Backend**: Deploy to Render, Railway, or a VPS. Set `NODE_ENV=production` and the required DB and JWT variables.
- **Database**: Use a managed MySQL service or your own server.
- **PWA**: Ensure the frontend is served over HTTPS (automatic on most platforms). The service worker and manifest are generated automatically.
- **Keep‑Alive**: If deploying on a free tier (e.g., Render), set up a cron job (e.g., [cron-job.org](https://cron-job.org)) to ping the `/health` endpoint every 10 minutes.  **On cron-job.org, disable “Save responses”** to avoid the “Failed (output too large)” error.

---

## 📖 Usage

1. Access the app and log in with your admin credentials.  
2. Add products, then stock, then start recording sales and purchases.  
3. Use **Credit** payment method to track debts; record payments from the **Debts** page.  
4. Add **old debts** (before the system) via the “Old Debt” button.  
5. View reports and daily summaries from the dashboard.  
6. Manage users from the admin sidebar link.  
7. On mobile, install the app via the “Install App” button or Chrome menu.

---

## 🙏 Acknowledgements

- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Lucide Icons](https://lucide.dev/)
- All the open‑source libraries that made this possible.
```