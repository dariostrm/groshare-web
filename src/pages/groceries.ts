import { api } from "../api.js";
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

    const groceries = (await response.json()) as Grocery[];

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

      deleteButton.addEventListener("click", async () => {
        await deleteGrocery(grocery.id);
      });

      item.append(content, deleteButton);
      ui.list?.appendChild(item);
    });
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
