# 🎲 Poker Tracker Backend (MySQL)

A backend application to manage and track poker game data. Built with **Node.js**, **Express**, and **MySQL**.

## 📁 Project Structure

```
Pocker_Tracker_backendmysql/
├── config/           # Database and app configuration
├── controllers/      # API route handlers
├── middleware/       # Authentication & custom middleware
├── models/           # Database models (tables)
├── routes/           # API routes
├── uploads/          # File uploads
├── .env              # Environment variables
├── .gitignore
├── package.json
└── poker.js          # Entry point of the application
```

## ⚙️ Technologies Used

* Node.js
* Express.js
* MySQL
* dotenv
* bcryptjs (for password hashing)
* jsonwebtoken (for authentication)

## 🗄️ Database Tables and Relationships

Here’s an overview of the key tables:

| Table Name     | Description                          | Relationships                                  |
| -------------- | ------------------------------------ | ---------------------------------------------- |
| `users`        | Stores user info                     | `user_id` linked to `games` and `transactions` |
| `games`        | Stores poker game sessions           | `game_id` linked to `transactions`             |
| `transactions` | Tracks bets, wins, and losses        | `user_id` → `users`, `game_id` → `games`       |
| `tables`       | Stores poker table info              | `table_id` → `games`                           |
| `chips`        | Tracks chip counts per user per game | `user_id` → `users`, `game_id` → `games`       |

### Example Relationships:

* **User ↔ Games**: One user can participate in multiple games.
* **Game ↔ Transactions**: Each game has multiple betting transactions.
* **User ↔ Chips**: Each user’s chip count is tracked per game.

## 🚀 Getting Started

### Prerequisites

* Node.js v14+
* MySQL server

### Installation

1. Clone the repo:

```bash
git clone https://github.com/AnuragFrantic/Pocker_Tracker_backendmysql.git
cd Pocker_Tracker_backendmysql
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=poker_tracker
JWT_SECRET=your_jwt_secret
```

4. Run the app:

```bash
node poker.js
```

## 📄 API Endpoints

* `POST /api/users/register` → Register a new user
* `POST /api/users/login` → User login
* `GET /api/games` → Fetch all games
* `POST /api/games` → Create a new game
* `POST /api/transactions` → Add a new transaction
* `GET /api/users/:id/chips` → Get user’s chips

*(Check `routes/` folder for more endpoints.)*

## 🔒 Authentication

Uses **JWT tokens**. Users must send the token in the `Authorization` header as:

```
Authorization: Bearer <token>
```

## 🍎 Apple Subscriptions (iOS auto-renew / "autopay")

iOS uses Apple **auto-renewable subscriptions** (StoreKit 2). Android continues
to use Stripe. The flow:

1. The app buys via StoreKit and sends the **signed transaction (JWS)** to
   `POST /master/verify-purchase`.
2. `utils/apple.js` verifies the JWS locally — full `x5c` certificate-chain
   validation pinned to **Apple Root CA - G3**, plus an ES256 signature check
   (no external calls, no extra npm packages). The verified
   `original_transaction_id`, product, expiry and auto-renew flag are stored on
   the `Payments` row.
3. When Apple auto-renews each period it POSTs an **App Store Server
   Notification V2** to `POST /master/apple-notifications`. The handler verifies
   the signature, then extends the user's `PurchaseSubscriptions.end_date` (and
   `Users.expire_date`) so access continues. Access is gated by an active,
   non-expired `PurchaseSubscription` (see `getProfile`'s `unlimited_session`).

### Required setup

* **App Store Connect → your app → App Information → App Store Server
  Notifications (Version 2)** — set the URL for **both** Production and Sandbox:

  ```
  https://rinsezone.com:3420/master/apple-notifications
  ```

* **Product IDs** must match the `apple_product_id` column on `Subscriptions`:
  `stackstatsgeo_premium_monthly`, `stackstatsgeo_premium_annual`.

### Environment variables (optional)

| Variable                 | Default                 | Purpose                                            |
| ------------------------ | ----------------------- | -------------------------------------------------- |
| `APPLE_BUNDLE_ID`        | `com.stackstatsgeo.app` | Rejects transactions/notifications for other apps. |
| `APPLE_JWS_SKIP_VERIFY`  | `false`                 | Dev only — skips signature verification. **Never set to `true` in production.** |

### One-time backfill

Older iOS `Payments` rows were saved with `transaction_id = NULL` (the previous
code couldn't parse the StoreKit 2 JWS), so their renewals can't be matched.
Run once to decode the stored receipts and populate the id:

```bash
node scripts/backfill_apple_transaction_ids.js
```

## 📌 License

MIT License. See [LICENSE](LICENSE) for details.
