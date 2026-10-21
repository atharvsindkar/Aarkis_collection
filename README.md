# Aarkis Collection — Luxury Fashion Atelier & E-Commerce

A full-stack luxury women's fashion editorial shopping experience and administrative governance portal.

---

> [!WARNING]
> ### 🚨 CRITICAL SECURITY NOTICE: SECRET ROTATION REQUIRED BEFORE DEPLOYMENT
> **If you are deploying this application to production or pushing to a public/remote repository:**
> Any development placeholder secrets, passwords, or tokens previously committed to Git history (such as default admin bootstrap credentials, dev JWT secrets, or demo test keys) **must be rotated immediately**. 
> - **Never reuse development secrets in production.**
> - Set unique, cryptographically strong values in your private production environment variables (`.env`).
> - Keep `.env` strictly ignored by version control (verified in `.gitignore`).

---

## 🔐 Environment Variables Configuration

Copy `.env.example` to `.env` and configure your secure server-side variables:

```bash
cp .env.example .env
```

| Variable | Description | Environment | Confidentiality |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend server port (Default: `5001`) | Server | Public Config |
| `NODE_ENV` | `development` or `production` | Server | Public Config |
| `FRONTEND_URL` | Storefront origin URL (CORS verification) | Server | Public Config |
| `JWT_SECRET` | 256-bit cryptographic key used to sign tokens | Server | **Strictly Secret** |
| `JWT_EXPIRE` | Token validity timeframe (e.g. `7d`, `30d`) | Server | Config |
| `ADMIN_BOOTSTRAP_EMAIL` | Initial owner account email for first-run bootstrap | Server | Private |
| `ADMIN_BOOTSTRAP_PASSWORD` | Strong password used once to initialize the owner | Server | **Strictly Secret** |
| `ADMIN_BOOTSTRAP_NAME` | Initial owner profile name | Server | Config |
| `MONGO_URI` | Optional MongoDB connection URI (leaves empty for NeDB) | Server | **Strictly Secret** |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Gateway Key ID | Server | Private Key |
| `RAZORPAY_KEY_SECRET` | Razorpay Gateway Secret Key | Server | **Strictly Secret** |
| `EMAIL_PROVIDER` | Transactional email provider (`mock`, `smtp`, `sendgrid`) | Server | Config |

> [!IMPORTANT]
> **Client-Side Exposure Rule**: No secrets are prefixed with `VITE_`, `REACT_APP_`, or `NEXT_PUBLIC_`. The Vite frontend code does not embed any private credentials, database URLs, or token secrets.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=generate_a_secure_random_hex_key_here
ADMIN_BOOTSTRAP_EMAIL=owner@aarkiscollection.com
ADMIN_BOOTSTRAP_PASSWORD=ChooseAStrongPassword123!
ADMIN_BOOTSTRAP_NAME="Aarkis Owner"
```

### 3. Run Development Servers
- **Backend Express API** (Port 5001):
  ```bash
  node server/index.js
  ```
- **Frontend Vite Client** (Port 5173):
  ```bash
  npm run dev
  ```

### 4. Build for Production
```bash
npm run build
```

---

## 🛡️ Pre-Deployment Verification Checklist

- [x] All database URLs and credentials stored exclusively in server environment variables.
- [x] `.env` verified in `.gitignore` (untracked in Git).
- [x] `.env.example` scrubbed of real secrets and replaced with placeholders.
- [x] Admin login form inputs sanitized (no hardcoded credentials pre-filled).
- [x] Fallback literals removed from token signing and verification logic.
- [x] Automated tests verified with Vitest.
