import { api } from "../api.js";
import { getAuthToken, isLoggedIn } from "../auth.js";

type ApartmentRoommate = {
  id: number;
  username: string;
};

type ApartmentDetails = {
  apartmentId: number;
  name: string;
  address: string;
  city: string;
  roommates: ApartmentRoommate[];
};

const ui = {
  nameDisplay: document.getElementById(
    "apartment-name-display",
  ) as HTMLHeadingElement | null,
  nameInput: document.getElementById(
    "apartment-name-input",
  ) as HTMLInputElement | null,
  addressDisplay: document.getElementById(
    "apartment-address-display",
  ) as HTMLParagraphElement | null,
  addressInput: document.getElementById(
    "apartment-address-input",
  ) as HTMLInputElement | null,
  cityDisplay: document.getElementById(
    "apartment-city-display",
  ) as HTMLParagraphElement | null,
  cityInput: document.getElementById(
    "apartment-city-input",
  ) as HTMLInputElement | null,
  roommatesCount: document.getElementById(
    "apartment-roommates-count",
  ) as HTMLParagraphElement | null,
  roommatesList: document.getElementById(
    "apartment-roommates-list",
  ) as HTMLDivElement | null,
  editButton: document.getElementById(
    "apartment-edit-button",
  ) as HTMLButtonElement | null,
  saveButton: document.getElementById(
    "apartment-save-button",
  ) as HTMLButtonElement | null,
};


let apartmentDetails: ApartmentDetails | null = null;
let isEditing = false;

const redirectToLogin = (): void => {
  window.location.href = "login.html";
};

const getHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${getAuthToken()}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

const setTextContent = (element: HTMLElement | null, value: string): void => {
  if (element) {
    element.textContent = value;
  }
};

const renderRoommates = (roommates: ApartmentRoommate[]): void => {
  if (!ui.roommatesList) {
    return;
  }

  ui.roommatesList.innerHTML = "";

  if (roommates.length === 0) {
    ui.roommatesList.innerHTML = `
			<div class="text-muted py-2">No roommates yet.</div>
		`;
    return;
  }

  roommates.forEach((roommate) => {
    const item = document.createElement("div");
    item.className = "roommate-item";

    item.innerHTML = `
			<div class="roommate-avatar"></div>
			<span class="roommate-name"></span>
		`;

    const nameNode = item.querySelector(".roommate-name");
    if (nameNode) {
      nameNode.textContent = roommate.username;
    }

    ui.roommatesList?.appendChild(item);
  });
};

const syncFormFields = (): void => {
  if (!apartmentDetails) {
    return;
  }

  if (ui.nameInput) {
    ui.nameInput.value = apartmentDetails.name;
  }

  if (ui.addressInput) {
    ui.addressInput.value = apartmentDetails.address;
  }

  if (ui.cityInput) {
    ui.cityInput.value = apartmentDetails.city;
  }
};

const renderApartment = (): void => {
  if (!apartmentDetails) {
    return;
  }

  setTextContent(ui.nameDisplay, apartmentDetails.name);
  setTextContent(ui.addressDisplay, apartmentDetails.address);
  setTextContent(ui.cityDisplay, apartmentDetails.city);
  setTextContent(ui.roommatesCount, String(apartmentDetails.roommates.length));
  renderRoommates(apartmentDetails.roommates);
  syncFormFields();
};

const setEditingState = (editing: boolean): void => {
  isEditing = editing;

  ui.nameDisplay?.classList.toggle("d-none", editing);
  ui.nameInput?.classList.toggle("d-none", !editing);

  ui.addressDisplay?.classList.toggle("d-none", editing);
  ui.addressInput?.classList.toggle("d-none", !editing);

  ui.cityDisplay?.classList.toggle("d-none", editing);
  ui.cityInput?.classList.toggle("d-none", !editing);

  if (ui.editButton) {
    ui.editButton.textContent = editing ? "X" : "Edit";
  }

  ui.saveButton?.classList.toggle("d-none", !editing);

  if (editing) {
    syncFormFields();
  } else {
    renderApartment();
  }
};

const loadApartment = async (): Promise<void> => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(api("apartment"), {
      method: "GET",
      headers: getHeaders(),
    });

    if (response.status === 401) {
      alert("Your session expired. Please log in again.");
      redirectToLogin();
      return;
    }

    if (response.status === 404) {
      window.location.href = "no-apartment.html";
      return;
    }

    if (!response.ok) {
      alert("Could not load apartment details.");
      return;
    }

    apartmentDetails = (await response.json()) as ApartmentDetails;
    renderApartment();
  } catch (error) {
    console.error("Error loading apartment details:", error);
    alert("Server connection error while loading apartment details.");
  }
};

const saveApartment = async (): Promise<void> => {
  if (!apartmentDetails || !ui.nameInput || !ui.addressInput || !ui.cityInput) {
    return;
  }

  const updatedApartment = {
    name: ui.nameInput.value.trim(),
    address: ui.addressInput.value.trim(),
    city: ui.cityInput.value.trim(),
  };

  try {
    const response = await fetch(api("apartment"), {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updatedApartment),
    });

    if (!response.ok) {
      let errorMessage = "Failed to update apartment.";

      try {
        const errorData = (await response.json()) as { error?: string };
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      alert(errorMessage);
      return;
    }

    apartmentDetails = {
      ...apartmentDetails,
      ...updatedApartment,
    };

    setEditingState(false);
  } catch (error) {
    console.error("Error updating apartment:", error);
    alert("Server connection error while updating apartment.");
  }
};

window.addEventListener("load", async () => {
  if (!ui.editButton || !ui.saveButton) {
    return;
  }

  ui.editButton.addEventListener("click", () => {
    setEditingState(!isEditing);
  });

  ui.saveButton.addEventListener("click", async () => {
    await saveApartment();
  });

  await loadApartment();
});
