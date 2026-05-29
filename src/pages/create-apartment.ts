import { getAuthToken, isLoggedIn } from "../auth.js";
import { validateForm } from "../validation.js";

const ui = {
  nameInput: document.getElementById("name") as HTMLInputElement,
  addressInput: document.getElementById("address") as HTMLInputElement,
  cityInput: document.getElementById("city") as HTMLInputElement,
  form: document.getElementById("create-apartment-form") as HTMLFormElement,
  message: document.getElementById(
    "create-apartment-message",
  ) as HTMLDivElement,
};

const apiBaseUrl = "https://groshare.dariostrm.dev/api/v1";

const showMessage = (message: string): void => {
  if (!ui.message) {
    return;
  }

  ui.message.textContent = message;
  ui.message.classList.remove("d-none");
};

const clearMessage = (): void => {
  if (!ui.message) {
    return;
  }

  ui.message.textContent = "";
  ui.message.classList.add("d-none");
};

const redirectToLogin = (): void => {
  window.location.href = "login.html";
};

window.addEventListener("load", () => {
  if (!isLoggedIn() || !getAuthToken()) {
    redirectToLogin();
  }
});

ui.form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm(ui.form)) {
    return;
  }

  const apartmentData = {
    name: ui.nameInput.value.trim(),
    address: ui.addressInput.value.trim(),
    city: ui.cityInput.value.trim(),
  };

  try {
    const response = await fetch(`${apiBaseUrl}/apartment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(apartmentData),
    });

    if (response.ok) {
      window.location.href = "apartment.html";
      return;
    }

    let errorMessage = response.statusText || "Apartment creation failed.";

    try {
      const errorData = (await response.json()) as { error?: string };
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Fall back to the HTTP status text when the response is not JSON.
    }

    showMessage(errorMessage);
  } catch (error) {
    console.error("Error during apartment creation:", error);
    showMessage("Server connection error.");
  }
});
