# groshare-web

GroShare companion web app — a lightweight dashboard built with vanilla HTML, TypeScript, and Bootstrap.

**Overview**

- **What it does:** Provides shared-apartment features: register/login, create or join an apartment, manage groceries and shopping, track and settle debts, and edit your profile.
- **Target users:** roommates who want a simple shared groceries and expense workflow.

**Usage**

- **Register / Login:** Click the Register or Login link in the navbar and enter your details. For quick testing use the credentials `testuser` / `testpassword`.
- **After login:** New tabs appear (Groceries, Debts, Apartment, Profile). If you just registered, most tabs (except Profile) will show a prompt explaining you must create or join an apartment.
- **Create or Join an apartment:**
  - To create: open the Apartment page, click on create apartment, enter the apartment name, street, and city, then submit.
  - To join: ask a roommate to invite you. Invites appear on the right side of the Apartment page where you can accept to join.
- **Apartment management:** On the Apartment page you can update apartment details, view current roommates on the right, and invite users by entering their username and clicking Send Invite.
- **Groceries:** Add grocery items that need to be bought (or delete them). All items are visible to apartment roommates.
  - When you're at the store in real life: check the boxes for items you bought, then click Bought. A dialog appears listing selected items and requesting the total price.
  - The total is split equally among selected items by default, you can edit individual item prices before confirming.
- **Debts:** The Debts page shows who you owe, who owes you, and your net balance. For people you have repaid, click Settle and optionally enter the amount you paid in the dialog.
- **Profile:** Change your username and email or leave the apartment from the Profile page.

**Build & Deploy from Source**
Choose one of the two options below depending on whether you want to deploy a webserver with docker or just on your machine through VSCode live server for example.

**Build & Deploy (Docker)**

- **Prerequisites:** Docker. Check how to install it on your machine on the internet
- **Notes:** This project includes a `docker-compose.yml` configuration. See [docker-compose.yml](docker-compose.yml) for service details.
- **Build and run:**

```bash
docker-compose up

# Stop and remove containers:
docker-compose down
```

- **Access:** By default, the web files are served from the container so open `http://localhost:PORT`

**Build & Deploy (Local: VS Code Live Server)**

- **Prerequisites:** Node.js and npm installed. Install the VS Code Live Server extension
- **Install TypeScript (locally):**

```bash
npm init -y
npm install --save-dev typescript
```

- **Or (globally):**

```bash
npm install -g typescript
```

- **Compile typescript:** The repo already contains a `tsconfig.json`, run:

```bash
npx tsc
```

- **Serve the app:**
  - Open the workspace in VS Code and start Live Server (right-click `index.html` → `Open with Live Server`) or use any static file server.
