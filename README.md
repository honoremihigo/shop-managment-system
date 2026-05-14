
```markdown
# ShopDesk – Shop Management System

A modern, full‑stack web application to manage inventory, sales, purchases, users, and reports – all from a single, clean dashboard. Built as a **Progressive Web App (PWA)** so it feels like a native app on phones and desktops.

## Features

- **Authentication & Authorization**  
  Secure login with http‑only cookies, role‑based access (Admin / User), and route guards.

- **Dashboard**  
  Real‑time overview of sales, purchases, low‑stock alerts, top products, and revenue trends (charts included).

- **Product Management**  
  Add, edit, delete, and search products. Bulk creation supported.

- **Stock Management**  
  Track quantities, cost prices, and selling prices. Bulk stock entry, search, and low‑stock warnings.  
  *Weighted average cost logic keeps profit margins accurate.*

- **Sales Management**  
  Record single or bulk sales. Automatic stock deduction. View all sales or today’s sales with search and pagination.

- **Purchase Management**  
  Record purchases with supplier details and dates. See purchase history, item breakdowns, and total values.

- **User Management (Admin only)**  
  Create, delete, and list system users. Only admins can access this module.

- **Reports**  
  Sales, purchase, profit reports with date filtering. Daily sales graph, top products chart, and downloadable data.

- **PWA (Progressive Web App)**  
  Installable on Android, iOS, and desktop, with an “Install App” button and offline fallback page.

- **Responsive Design**  
  Mobile‑first layout: sidebar adapts to an overlay, modals become bottom‑sheets, and all tables work perfectly on small screens.

## Tech Stack

| Layer        | Technology                           |
|--------------|--------------------------------------|
| Frontend     | React + Vite                          |
| Styling      | Tailwind CSS (v4, CSS‑first config)  |
| Charts       | Recharts                             |
| Backend      | Node.js + Express                    |
| Database     | MySQL with Sequelize ORM             |
| Auth         | JWT (http‑only cookies)              |
| PWA          | vite-plugin-pwa (Workbox)            |


## Getting Started

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
   ```

   Run database migrations (if any) or sync models.

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

To build both frontend and serve via the backend (or a static host):

```bash
cd frontend
npm run build
```

For the PWA, the production build automatically generates the service worker and manifest.

## Environment Variables

### Backend

| Variable     | Description                         |
|--------------|-------------------------------------|
| `PORT`       | Server port                         |
| `DB_HOST`    | MySQL host                          |
| `DB_USER`    | MySQL username                      |
| `DB_PASS`    | MySQL password                      |
| `DB_NAME`    | Database name                       |
| `JWT_SECRET` | Secret key for JWT tokens           |
| `NODE_ENV`   | `development` or `production`       |

### Frontend

| Variable        | Description              |
|-----------------|--------------------------|
| `VITE_API_URL`  | Backend API base URL     |

## Deployment

- **Frontend**: Deploy the `dist` folder to Vercel, Netlify, or any static host. Make sure to set the `VITE_API_URL` environment variable to your live backend URL.
- **Backend**: Deploy to Render, Railway, or a VPS. Set `NODE_ENV=production` and the required DB and JWT variables.
- **Database**: Use a managed MySQL service or your own server.
- **PWA**: Ensure the frontend is served over HTTPS (automatic on most platforms). The service worker and manifest are generated automatically.

## Usage

1. Access the app and log in with your admin credentials.  
2. Add products, then stock, then start recording sales and purchases.  
3. View reports and daily summaries from the dashboard.  
4. Manage users from the admin sidebar link.  
5. On mobile, install the app via the “Install App” button or Chrome menu.

## Acknowledgements

- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Lucide Icons](https://lucide.dev/)
- All the open‑source libraries that made this possible.
```