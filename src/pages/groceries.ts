import { getAuthToken, isLoggedIn } from "../auth.js";

type Grocery = {
  id: number;
  name: string;
  addedByUsername: string;
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
};

const groceries: Grocery[] = [
  { id: 1, name: "Milk", addedByUsername: "alex" },
  { id: 2, name: "Pasta", addedByUsername: "maria" },
  { id: 3, name: "Eggs", addedByUsername: "sam" },
  { id: 4, name: "Apples", addedByUsername: "jordan" },
  { id: 5, name: "Tomatoes", addedByUsername: "alex" },
  { id: 6, name: "Cereal", addedByUsername: "maria" },
  { id: 7, name: "Bread", addedByUsername: "dario" },
  { id: 8, name: "Test", addedByUsername: "_idk_Man" },
  { id: 9, name: "Cereal", addedByUsername: ".whatever." },
];

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

const renderEmptyState = (): void => {
  if (!ui.emptyState || !ui.list) {
    return;
  }

  ui.list.innerHTML = "";
  ui.emptyState.classList.remove("d-none");
};

const renderGroceries = (): void => {
  if (!ui.list || !ui.emptyState) {
    return;
  }

  ui.list.innerHTML = "";

  if (groceries.length === 0) {
    renderEmptyState();
    return;
  }

  ui.emptyState.classList.add("d-none");

  groceries.forEach((grocery) => {
    const item = document.createElement("div");
    item.className = "grocery-item";

    const content = document.createElement("div");
    content.className = "d-flex align-items-center gap-3 flex-grow-1 min-w-0";

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
    content.append(avatar, meta);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-outline-danger btn-sm flex-shrink-0";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete grocery ${grocery.name}`);

    item.append(content, deleteButton);
    ui.list?.appendChild(item);
  });
};

const initAddButton = (): void => {
  ui.addButton?.addEventListener("click", () => {
    if (ui.nameInput) {
      ui.nameInput.value = "";
      ui.nameInput.focus();
    }
  });
};

const initPage = (): void => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
    return;
  }

  initAddButton();
  renderGroceries();
};

document.addEventListener("DOMContentLoaded", initPage);
