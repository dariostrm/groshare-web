import { api } from "../api.js";
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

type SettlementDraft = {
  recipientId: number;
  amountInCents: number;
  recipientUsername: string;
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
  settleModal: document.getElementById("debts-settle-modal") as HTMLDivElement | null,
  settleModalTitle: document.getElementById(
    "debts-settle-modal-title",
  ) as HTMLHeadingElement | null,
  settleModalInput: document.getElementById(
    "debts-settle-amount-input",
  ) as HTMLInputElement | null,
  settleModalSubmit: document.getElementById(
    "debts-settle-submit",
  ) as HTMLButtonElement | null,
  settleModalClose: document.getElementById(
    "debts-settle-close",
  ) as HTMLButtonElement | null,
};

const bootstrapWindow = window as Window & {
  bootstrap?: {
    Modal: new (element: Element) => {
      show(): void;
      hide(): void;
    };
  };
};

const settleModal =
  ui.settleModal && bootstrapWindow.bootstrap
    ? new bootstrapWindow.bootstrap.Modal(ui.settleModal)
    : null;

let currentDebts: DebtsState = {
  totalNetCents: 0,
  debts: [],
};

let currentSettlementDraft: SettlementDraft | null = null;

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

const formatCurrencyForInput = (valueInCents: number): string => {
  return (Math.abs(valueInCents) / 100).toFixed(2);
};

const parseMoneyToCents = (value: string): number | null => {
  const trimmedValue = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number.parseFloat(trimmedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.round(parsedValue * 100);
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

const showAlert = (message: string): void => {
  window.alert(message);
};

const readErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const errorData = (await response.json()) as { error?: string };
    return errorData.error || response.statusText || fallback;
  } catch {
    return response.statusText || fallback;
  }
};

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

const clearDebtsList = (): void => {
  if (!ui.debtsList) {
    return;
  }

  ui.debtsList.innerHTML = "";
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

    if (debt.amountCents < 0) {
      const settleButton = document.createElement("button");
      settleButton.type = "button";
      settleButton.className = "btn debt-settle-btn";
      settleButton.textContent = "Settle";
      settleButton.addEventListener("click", () => {
        openSettleModal({
          recipientId: debt.roommate.id,
          amountInCents: Math.abs(debt.amountCents),
          recipientUsername: debt.roommate.username,
        });
      });

      row.append(content, amount, settleButton);
      debtsList.appendChild(row);
      return;
    }

    row.append(content, amount);
    debtsList.appendChild(row);
  });
};

const openSettleModal = (draft: SettlementDraft): void => {
  if (!settleModal || !ui.settleModalTitle || !ui.settleModalInput) {
    return;
  }

  currentSettlementDraft = draft;
  ui.settleModalTitle.textContent = `How much money did you give back to ${draft.recipientUsername}?`;
  ui.settleModalInput.value = formatCurrencyForInput(draft.amountInCents);

  settleModal.show();
  ui.settleModalInput.focus();
  ui.settleModalInput.select();
};

const closeSettleModal = (): void => {
  settleModal?.hide();
};

const sanitizeMoneyInput = (input: HTMLInputElement): void => {
  const rawValue = input.value;
  const numericValue = rawValue.replace(/[^0-9.]/g, "");
  const segments = numericValue.split(".");
  const integerPart = segments[0] || "";
  const decimalPart = segments.slice(1).join("").slice(0, 2);

  let nextValue = integerPart;

  if (decimalPart.length > 0) {
    nextValue = `${integerPart || "0"}.${decimalPart}`;
  } else if (rawValue.startsWith(".")) {
    nextValue = integerPart ? integerPart : "0";
  }

  if (nextValue !== rawValue) {
    input.value = nextValue;
  }
};

const fetchDebts = async (): Promise<void> => {
  if (!ui.debtsList) {
    return;
  }

  try {
    const response = await fetch(api("apartment/debts"), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 404) {
      window.location.href = "no-apartment.html";
      return;
    }

    if (response.status === 401) {
      showAlert("Your session expired. Please log in again.");
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      showAlert(await readErrorMessage(response, "Could not load debts."));
      return;
    }

    currentDebts = (await response.json()) as DebtsState;
    renderBalanceBanner(currentDebts.totalNetCents);
    renderDebts(currentDebts);
  } catch (error) {
    console.error("Error loading debts:", error);
    showAlert("Server connection error while loading debts.");
  }
};

const submitSettlement = async (): Promise<void> => {
  if (!currentSettlementDraft || !ui.settleModalInput) {
    return;
  }

  const amountInCents = parseMoneyToCents(ui.settleModalInput.value);

  if (amountInCents === null || amountInCents <= 0) {
    showAlert("Enter a valid positive amount.");
    return;
  }

  try {
    const response = await fetch(api("apartment/debts/settle"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        recipientId: currentSettlementDraft.recipientId,
        amountInCents,
      }),
    });

    if (response.status === 401 || response.status === 403 || response.status === 400) {
      showAlert(await readErrorMessage(response, "Could not settle debt."));
      if (response.status === 401) {
        redirectToLogin();
      }
      return;
    }

    if (response.status !== 204 && !response.ok) {
      showAlert(await readErrorMessage(response, "Could not settle debt."));
      return;
    }

    currentSettlementDraft = null;
    closeSettleModal();
    await fetchDebts();
  } catch (error) {
    console.error("Error settling debt:", error);
    showAlert("Server connection error while settling debt.");
  }
};

const initPage = (): void => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
    return;
  }

  ui.settleModalInput?.addEventListener("input", () => {
    if (ui.settleModalInput) {
      sanitizeMoneyInput(ui.settleModalInput);
    }
  });

  ui.settleModalSubmit?.addEventListener("click", () => {
    void submitSettlement();
  });

  ui.settleModalClose?.addEventListener("click", () => {
    closeSettleModal();
  });

  void fetchDebts();
};

document.addEventListener("DOMContentLoaded", initPage);
