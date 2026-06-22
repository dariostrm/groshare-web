import { api } from "../api.js";
import { getAuthToken, isLoggedIn } from "../auth.js";

type Grocery = {
  id: number;
  name: string;
  addedByUsername: string;
};

type PurchaseDraftItem = {
  groceryId: number;
  priceInCents: number;
};

type PurchaseDraft = {
  purchases: PurchaseDraftItem[];
};

const ui = {
  list: document.getElementById("groceries-list") as HTMLDivElement | null,
  emptyState: document.getElementById(
    "groceries-empty-state",
  ) as HTMLDivElement | null,
  addButton: document.getElementById(
    "groceries-add-button",
  ) as HTMLButtonElement | null,
  nameInput: document.getElementById(
    "groceries-name-input",
  ) as HTMLInputElement | null,
  boughtButton: document.getElementById(
    "groceries-bought-button",
  ) as HTMLButtonElement | null,
  buyModal: document.getElementById(
    "groceries-buy-modal",
  ) as HTMLDivElement | null,
  buyModalLabel: document.getElementById(
    "groceries-buy-modal-label",
  ) as HTMLHeadingElement | null,
  buyModalSelectedCount: document.getElementById(
    "groceries-buy-selected-count",
  ) as HTMLSpanElement | null,
  buyModalTotalInput: document.getElementById(
    "groceries-buy-total-input",
  ) as HTMLInputElement | null,
  buyModalItems: document.getElementById(
    "groceries-buy-items",
  ) as HTMLDivElement | null,
  buyModalConfirm: document.getElementById(
    "groceries-buy-confirm",
  ) as HTMLButtonElement | null,
  buyModalClose: document.getElementById(
    "groceries-buy-close",
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

const buyModal =
  ui.buyModal && bootstrapWindow.bootstrap
    ? new bootstrapWindow.bootstrap.Modal(ui.buyModal)
    : null;

let groceries: Grocery[] = [];
const selectedGroceryIds = new Set<number>();
let currentPurchaseDraft: PurchaseDraft | null = null;

const redirectToLogin = (): void => {
  window.location.href = "login.html";
};

const redirectToNoApartment = (): void => {
  window.location.href = "no-apartment.html";
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

const createAvatar = (username: string): HTMLDivElement => {
  const hash = fnv1a(username.trim().toLowerCase());
  const hue = hash % 360;
  const initial = getAvatarInitial(username).toUpperCase();

  const avatar = document.createElement("div");
  avatar.className =
    "grocery-avatar flex-shrink-0 d-flex align-items-center justify-content-center";
  avatar.style.backgroundColor = `hsl(${hue} 65% 42%)`;

  const letter = document.createElement("span");
  letter.className = "grocery-avatar-letter";
  letter.textContent = initial;
  letter.style.color = `hsl(${hue} 65% 84%)`;

  avatar.appendChild(letter);
  return avatar;
};

const formatCurrency = (valueInCents: number): string => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(valueInCents / 100);
};

const formatMoneyInputValue = (valueInCents: number): string => {
  return (valueInCents / 100).toFixed(2);
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

const splitTotalAcrossItems = (
  totalInCents: number,
  itemCount: number,
): number[] => {
  if (itemCount <= 0) {
    return [];
  }

  const baseAmount = Math.floor(totalInCents / itemCount);
  let remainder = totalInCents % itemCount;

  return Array.from({ length: itemCount }, () => {
    const amount = baseAmount + (remainder > 0 ? 1 : 0);
    remainder -= remainder > 0 ? 1 : 0;
    return amount;
  });
};

const getSelectedGroceries = (): Grocery[] => {
  return groceries.filter((grocery) => selectedGroceryIds.has(grocery.id));
};

const updateBoughtButtonState = (): void => {
  if (!ui.boughtButton) {
    return;
  }

  ui.boughtButton.disabled = selectedGroceryIds.size === 0;
};

const syncSelectionCheckboxes = (): void => {
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    "[data-grocery-select-checkbox]",
  );

  checkboxes.forEach((checkbox) => {
    const groceryId = Number.parseInt(checkbox.dataset.groceryId || "", 10);
    checkbox.checked = selectedGroceryIds.has(groceryId);
  });
};

const syncSelectAllState = (): void => {
  const selectAllCheckbox = document.getElementById(
    "groceries-select-all",
  ) as HTMLInputElement | null;

  if (!selectAllCheckbox) {
    return;
  }

  const visibleGroceries = groceries.length;

  if (visibleGroceries === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return;
  }

  const selectedCount = selectedGroceryIds.size;
  selectAllCheckbox.checked = selectedCount === visibleGroceries;
  selectAllCheckbox.indeterminate =
    selectedCount > 0 && selectedCount < visibleGroceries;
};

const updateSelectionState = (): void => {
  syncSelectionCheckboxes();
  syncSelectAllState();
  updateBoughtButtonState();
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

const loadApartment = async (): Promise<boolean> => {
  try {
    const response = await fetch(api("apartment"), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 404) {
      redirectToNoApartment();
      return false;
    }

    if (response.status === 401) {
      showAlert("Your session expired. Please log in again.");
      redirectToLogin();
      return false;
    }

    if (!response.ok) {
      showAlert(
        await readErrorMessage(
          response,
          "Could not confirm apartment membership.",
        ),
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking apartment status:", error);
    showAlert("Server connection error while checking apartment membership.");
    return false;
  }
};

const loadGroceries = async (): Promise<void> => {
  if (!ui.list || !ui.emptyState) {
    return;
  }

  ui.list.innerHTML = "";

  try {
    const response = await fetch(api("apartment/groceries"), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      showAlert(
        await readErrorMessage(
          response,
          "Your session expired. Please log in again.",
        ),
      );
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      showAlert(await readErrorMessage(response, "Could not load groceries."));
      return;
    }

    groceries = (await response.json()) as Grocery[];

    const groceryIds = new Set(groceries.map((grocery) => grocery.id));
    for (const selectedId of [...selectedGroceryIds]) {
      if (!groceryIds.has(selectedId)) {
        selectedGroceryIds.delete(selectedId);
      }
    }

    if (groceries.length === 0) {
      selectedGroceryIds.clear();
      updateBoughtButtonState();
      renderEmptyState();
      return;
    }

    ui.emptyState.classList.add("d-none");

    groceries.forEach((grocery) => {
      const item = document.createElement("div");
      item.className = "grocery-item";

      if (selectedGroceryIds.has(grocery.id)) {
        item.classList.add("selected");
      }

      const content = document.createElement("div");
      content.className = "d-flex align-items-center gap-3 flex-grow-1 min-w-0";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className =
        "form-check-input grocery-select-checkbox flex-shrink-0";
      checkbox.dataset.grocerySelectCheckbox = "true";
      checkbox.dataset.groceryId = String(grocery.id);
      checkbox.checked = selectedGroceryIds.has(grocery.id);

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedGroceryIds.add(grocery.id);
        } else {
          selectedGroceryIds.delete(grocery.id);
        }

        item.classList.toggle("selected", checkbox.checked);
        updateSelectionState();
      });

      const avatar = createAvatar(grocery.addedByUsername);

      const meta = document.createElement("div");
      meta.className = "grocery-meta min-w-0";

      const name = document.createElement("div");
      name.className = "grocery-name text-truncate";
      name.textContent = grocery.name;

      const addedBy = document.createElement("div");
      addedBy.className = "grocery-added-by text-muted text-truncate";
      addedBy.textContent = `Added by ${grocery.addedByUsername}`;

      meta.append(name, addedBy);
      content.append(checkbox, avatar, meta);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-outline-danger btn-sm flex-shrink-0";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete grocery ${grocery.name}`);

      deleteButton.addEventListener("click", async () => {
        await deleteGrocery(grocery.id);
      });

      item.append(content, deleteButton);
      ui.list?.appendChild(item);
    });

    updateSelectionState();
  } catch (error) {
    console.error("Error loading groceries:", error);
    showAlert("Server connection error while loading groceries.");
  }
};

const renderEmptyState = (): void => {
  if (!ui.emptyState || !ui.list) {
    return;
  }

  ui.list.innerHTML = "";
  ui.emptyState.classList.remove("d-none");
};

const buildPurchaseDraft = (): PurchaseDraft | null => {
  const selectedGroceries = getSelectedGroceries();

  if (selectedGroceries.length === 0) {
    return null;
  }

  if (!ui.buyModalTotalInput) {
    return {
      purchases: selectedGroceries.map((grocery) => ({
        groceryId: grocery.id,
        priceInCents: 0,
      })),
    };
  }

  const totalInCents = parseMoneyToCents(ui.buyModalTotalInput.value);

  if (totalInCents === null) {
    return {
      purchases: selectedGroceries.map((grocery) => ({
        groceryId: grocery.id,
        priceInCents: 0,
      })),
    };
  }

  const splitPrices = splitTotalAcrossItems(
    totalInCents,
    selectedGroceries.length,
  );

  return {
    purchases: selectedGroceries.map((grocery, index) => ({
      groceryId: grocery.id,
      priceInCents: splitPrices[index] ?? 0,
    })),
  };
};

const renderBuyModalItems = (): void => {
  if (!ui.buyModalItems || !ui.buyModalSelectedCount) {
    return;
  }

  const selectedGroceries = getSelectedGroceries();
  ui.buyModalSelectedCount.textContent = String(selectedGroceries.length);
  ui.buyModalItems.innerHTML = "";

  if (selectedGroceries.length === 0) {
    ui.buyModalItems.innerHTML = `
      <div class="text-muted py-3">Select at least one grocery to prepare a purchase.</div>
    `;
    return;
  }

  selectedGroceries.forEach((grocery) => {
    const draftAmount =
      currentPurchaseDraft?.purchases.find(
        (purchase) => purchase.groceryId === grocery.id,
      )?.priceInCents ?? 0;

    const row = document.createElement("div");
    row.className = "grocery-buy-row";

    row.innerHTML = `
      <div class="flex-grow-1 min-w-0">
        <div class="fw-semibold text-truncate">${grocery.name}</div>
        <div class="text-muted small text-truncate">Added by ${grocery.addedByUsername}</div>
      </div>
      <div class="grocery-buy-price-group">
        <label class="form-label small mb-1" for="grocery-buy-price-${grocery.id}">Price</label>
        <input
          id="grocery-buy-price-${grocery.id}"
          data-grocery-buy-price-input="true"
          data-grocery-id="${grocery.id}"
          type="number"
          min="0"
          step="0.01"
          inputmode="decimal"
          pattern="^\\d+(?:\\.\\d{0,2})?$"
          class="form-control"
          value="${formatMoneyInputValue(draftAmount)}"
        />
      </div>
    `;

    const priceInput = row.querySelector<HTMLInputElement>(
      '[data-grocery-buy-price-input="true"]',
    );

    priceInput?.addEventListener("input", () => {
      if (priceInput) {
        sanitizeMoneyInput(priceInput);
      }

      currentPurchaseDraft = buildPurchaseDraftFromInputs();
    });

    ui.buyModalItems?.appendChild(row);
  });

  currentPurchaseDraft = buildPurchaseDraftFromInputs();
};

const buildPurchaseDraftFromInputs = (): PurchaseDraft | null => {
  const selectedGroceries = getSelectedGroceries();

  if (selectedGroceries.length === 0 || !ui.buyModalItems) {
    return null;
  }

  const inputs = ui.buyModalItems.querySelectorAll<HTMLInputElement>(
    '[data-grocery-buy-price-input="true"]',
  );

  const purchases: PurchaseDraftItem[] = [];

  inputs.forEach((input) => {
    const groceryId = Number.parseInt(input.dataset.groceryId || "", 10);
    const priceInCents = parseMoneyToCents(input.value);

    if (!Number.isNaN(groceryId) && priceInCents !== null) {
      purchases.push({
        groceryId,
        priceInCents,
      });
    }
  });

  return { purchases };
};

const syncPurchasePricesFromTotal = (): void => {
  if (!ui.buyModalItems || !ui.buyModalTotalInput) {
    return;
  }

  const selectedGroceries = getSelectedGroceries();
  const totalInCents = parseMoneyToCents(ui.buyModalTotalInput.value);

  if (selectedGroceries.length === 0) {
    currentPurchaseDraft = null;
    renderBuyModalItems();
    return;
  }

  if (totalInCents === null) {
    currentPurchaseDraft = {
      purchases: selectedGroceries.map((grocery) => ({
        groceryId: grocery.id,
        priceInCents: 0,
      })),
    };
    renderBuyModalItems();
    return;
  }

  const splitPrices = splitTotalAcrossItems(
    totalInCents,
    selectedGroceries.length,
  );

  currentPurchaseDraft = {
    purchases: selectedGroceries.map((grocery, index) => ({
      groceryId: grocery.id,
      priceInCents: splitPrices[index] ?? 0,
    })),
  };

  renderBuyModalItems();
};

const openBuyModal = (): void => {
  if (selectedGroceryIds.size === 0) {
    showAlert("Select at least one grocery first.");
    return;
  }

  if (!buyModal) {
    return;
  }

  if (ui.buyModalTotalInput) {
    ui.buyModalTotalInput.value = "";
  }

  currentPurchaseDraft = null;
  renderBuyModalItems();
  buyModal.show();
};

const closeBuyModal = (): void => {
  buyModal?.hide();
};

const handlePreparePurchase = (): void => {
  const draft = buildPurchaseDraftFromInputs();

  if (!draft || draft.purchases.length === 0) {
    showAlert(
      "Select groceries and enter prices before preparing the purchase.",
    );
    return;
  }

  currentPurchaseDraft = draft;

  void submitPurchase();
};

const submitPurchase = async (): Promise<void> => {
  if (!currentPurchaseDraft || currentPurchaseDraft.purchases.length === 0) {
    showAlert(
      "Select groceries and enter prices before preparing the purchase.",
    );
    return;
  }

  try {
    const response = await fetch(api("apartment/groceries/buy"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        purchases: currentPurchaseDraft.purchases.map((purchase) => ({
          id: purchase.groceryId,
          priceInCents: purchase.priceInCents,
        })),
      }),
    });

    if (response.status === 401) {
      showAlert(
        await readErrorMessage(
          response,
          "Your session expired. Please log in again.",
        ),
      );
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      showAlert(
        await readErrorMessage(response, "Could not complete purchase."),
      );
      return;
    }

    selectedGroceryIds.clear();
    currentPurchaseDraft = null;
    closeBuyModal();
    await loadGroceries();
  } catch (error) {
    console.error("Error submitting purchase:", error);
    showAlert("Server connection error while completing purchase.");
  }
};

const addGrocery = async (): Promise<void> => {
  if (!ui.nameInput) {
    return;
  }

  const name = ui.nameInput.value.trim();

  if (name.length === 0) {
    showAlert("Please enter a grocery name.");
    return;
  }

  try {
    const response = await fetch(api("apartment/groceries"), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });

    if (response.status === 401) {
      showAlert(
        await readErrorMessage(
          response,
          "Your session expired. Please log in again.",
        ),
      );
      redirectToLogin();
      return;
    }

    if (!response.ok) {
      showAlert(await readErrorMessage(response, "Could not add grocery."));
      return;
    }

    ui.nameInput.value = "";
    await loadGroceries();
  } catch (error) {
    console.error("Error adding grocery:", error);
    showAlert("Server connection error while adding grocery.");
  }
};

const deleteGrocery = async (groceryId: number): Promise<void> => {
  try {
    const response = await fetch(api(`apartment/groceries/${groceryId}`), {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      showAlert(
        await readErrorMessage(
          response,
          "Your session expired. Please log in again.",
        ),
      );
      redirectToLogin();
      return;
    }

    if (response.status !== 204 && !response.ok) {
      showAlert(await readErrorMessage(response, "Could not delete grocery."));
      return;
    }

    await loadGroceries();
  } catch (error) {
    console.error("Error deleting grocery:", error);
    showAlert("Server connection error while deleting grocery.");
  }
};

const initAddButton = (): void => {
  ui.addButton?.addEventListener("click", async () => {
    await addGrocery();
  });

  ui.boughtButton?.addEventListener("click", () => {
    openBuyModal();
  });

  ui.buyModalTotalInput?.addEventListener("input", () => {
    if (ui.buyModalTotalInput) {
      sanitizeMoneyInput(ui.buyModalTotalInput);
    }

    syncPurchasePricesFromTotal();
  });

  ui.buyModalConfirm?.addEventListener("click", () => {
    handlePreparePurchase();
  });

  ui.buyModalClose?.addEventListener("click", () => {
    closeBuyModal();
  });

  ui.nameInput?.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await addGrocery();
    }
  });
};

const initPage = async (): Promise<void> => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
    return;
  }

  initAddButton();

  const isInApartment = await loadApartment();
  if (!isInApartment) {
    return;
  }

  await loadGroceries();
};

document.addEventListener("DOMContentLoaded", initPage);
