import { getAuthToken, isLoggedIn } from "../auth.js";

type DebtRoommate = {
  id: number;
  username: string;
};

type DebtEntry = {
  roommate: DebtRoommate;
  amountCents: number;
};

type DebtsState = {
  totalNetCents: number;
  debts: DebtEntry[];
};

const ui = {
  balanceBanner: document.getElementById(
    "debts-balance-banner",
  ) as HTMLDivElement | null,
  balanceValue: document.getElementById(
    "debts-balance-value",
  ) as HTMLHeadingElement | null,
  balanceLabel: document.getElementById(
    "debts-balance-label",
  ) as HTMLParagraphElement | null,
  debtsList: document.getElementById("debts-list") as HTMLDivElement | null,
};

const dummyDebts: DebtsState = {
  totalNetCents: 1840,
  debts: [
    { roommate: { id: 1, username: "alex" }, amountCents: 1240 },
    { roommate: { id: 2, username: "maria" }, amountCents: -680 },
    { roommate: { id: 3, username: "sam" }, amountCents: 0 },
    { roommate: { id: 4, username: "jordan" }, amountCents: 1280 },
  ],
};

const redirectToLogin = (): void => {
  window.location.href = "login.html";
};

const fnv1a = (value: string): number => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

const getAvatarInitial = (username: string): string => {
  const trimmedUsername = username.trim();

  for (const char of trimmedUsername) {
    if (/^[A-Z]$/.test(char)) {
      return char;
    }
  }

  for (const char of trimmedUsername) {
    if (/^[a-z]$/.test(char)) {
      return char;
    }
  }

  return "?";
};

const formatCurrency = (valueInCents: number): string => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(Math.abs(valueInCents) / 100);
};

const createAvatar = (username: string): HTMLDivElement => {
  const hash = fnv1a(username.trim().toLowerCase());
  const hue = hash % 360;
  const initial = getAvatarInitial(username).toUpperCase();

  const avatar = document.createElement("div");
  avatar.className =
    "debt-avatar flex-shrink-0 d-flex align-items-center justify-content-center";
  avatar.style.backgroundColor = `hsl(${hue} 65% 42%)`;

  const letter = document.createElement("span");
  letter.className = "debt-avatar-letter";
  letter.textContent = initial;
  letter.style.color = `hsl(${hue} 65% 84%)`;

  avatar.appendChild(letter);
  return avatar;
};

const getHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${getAuthToken()}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const renderBalanceBanner = (totalNetCents: number): void => {
  if (!ui.balanceBanner || !ui.balanceValue || !ui.balanceLabel) {
    return;
  }

  ui.balanceValue.textContent = formatCurrency(totalNetCents);

  ui.balanceBanner.classList.remove(
    "debts-banner-positive",
    "debts-banner-negative",
    "debts-banner-neutral",
  );

  if (totalNetCents > 0) {
    ui.balanceLabel.textContent = "Net balance";
    ui.balanceBanner.classList.add("debts-banner-positive");
  } else if (totalNetCents < 0) {
    ui.balanceLabel.textContent = "Net balance";
    ui.balanceBanner.classList.add("debts-banner-negative");
  } else {
    ui.balanceLabel.textContent = "Net balance";
    ui.balanceBanner.classList.add("debts-banner-neutral");
  }
};

const renderDebts = (debtsState: DebtsState): void => {
  if (!ui.debtsList) {
    return;
  }

  const debtsList = ui.debtsList;

  debtsList.innerHTML = "";

  debtsState.debts.forEach((debt) => {
    const row = document.createElement("div");
    row.className = "debt-row";

    const content = document.createElement("div");
    content.className = "d-flex align-items-center gap-3 flex-grow-1 min-w-0";

    const avatar = createAvatar(debt.roommate.username);

    const meta = document.createElement("div");
    meta.className = "debt-meta min-w-0";

    const name = document.createElement("div");
    name.className = "debt-name text-truncate";
    name.textContent = debt.roommate.username;

    const relation = document.createElement("div");
    relation.className = "debt-relation text-muted text-truncate";

    if (debt.amountCents > 0) {
      relation.textContent = `${debt.roommate.username} owes you ${formatCurrency(debt.amountCents)}`;
    } else if (debt.amountCents < 0) {
      relation.textContent = `You owe ${debt.roommate.username} ${formatCurrency(debt.amountCents)}`;
    } else {
      relation.textContent = "Settled up";
    }

    meta.append(name, relation);
    content.append(avatar, meta);

    const amount = document.createElement("div");
    amount.className = `debt-amount ${debt.amountCents >= 0 ? "text-success" : "text-danger"}`;
    amount.textContent = `${debt.amountCents >= 0 ? "+" : "-"}${formatCurrency(debt.amountCents)}`;

    const settleButton = document.createElement("button");
    settleButton.type = "button";
    settleButton.className = "btn debt-settle-btn";
    settleButton.textContent = "Settle";

    row.append(content, amount, settleButton);
    debtsList.appendChild(row);
  });
};

const initPage = (): void => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
    return;
  }

  renderBalanceBanner(dummyDebts.totalNetCents);
  renderDebts(dummyDebts);
};

document.addEventListener("DOMContentLoaded", initPage);
