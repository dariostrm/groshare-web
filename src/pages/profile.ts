import { api } from "../api.js";
import { getAuthToken, isLoggedIn } from "../auth.js";
import { validateForm } from "../validation.js";

const ui = {
  usernameInput: document.getElementById("username") as HTMLInputElement,
  emailInput: document.getElementById("email") as HTMLInputElement,
  form: document.getElementById("profile-form") as HTMLFormElement,
  avatar: document.getElementById("profile-avatar") as HTMLDivElement,
  avatarLetter: document.getElementById(
    "profile-avatar-letter",
  ) as HTMLSpanElement,
  currentApartmentName: document.getElementById(
    "current-apartment-name",
  ) as HTMLElement,
  leaveApartmentButton: document.getElementById(
    "leave-apartment-button",
  ) as HTMLButtonElement,
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

const updateAvatar = (username: string): void => {
  if (!ui.avatar || !ui.avatarLetter) {
    return;
  }

  const hash = fnv1a(username.trim().toLowerCase());
  const hue = hash % 360;

  ui.avatar.style.backgroundColor = `hsl(${hue} 65% 42%)`;
  ui.avatarLetter.textContent = getAvatarInitial(username).toUpperCase();
  ui.avatarLetter.style.color = `hsl(${hue} 65% 84%)`;
};

const setApartmentState = (apartmentName: string | null): void => {
  if (ui.currentApartmentName) {
    ui.currentApartmentName.textContent =
      apartmentName || "No apartment assigned";
  }

  if (ui.leaveApartmentButton) {
    ui.leaveApartmentButton.classList.toggle("d-none", apartmentName === null);
  }
};

const leaveApartment = async (): Promise<void> => {
  try {
    const response = await fetch(api("profile/apartment"), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = "Could not leave apartment. Please try again.";

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

    setApartmentState(null);
    alert("You left the apartment.");
  } catch (error) {
    console.error("Error leaving apartment:", error);
    alert("Server connection error.");
  }
};

//Populate the user details from the backend when the page loads
window.addEventListener("load", async function () {
  if (!isLoggedIn()) {
    alert("You must be logged in to view this page! Redirecting to home page.");
    window.location.href = "index.html";
    return;
  }
  if (ui.usernameInput && ui.emailInput) {
    try {
      // Sending GET request to fetch user profile details
      const response = await fetch(api("profile"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`, // Authentication token from localStorage
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Populate inputs with data received from the backend
        ui.usernameInput.value = data.username;
        ui.emailInput.value = data.email;
        updateAvatar(data.username);
        setApartmentState(data.apartmentName ?? null);
      } else {
        // If profile fetch fails, notify user and redirect to login/home
        alert("Could not load profile! Redirecting to home page.");
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Fetch error during profile load:", error);
    }
  }
});

ui.leaveApartmentButton?.addEventListener("click", async () => {
  await leaveApartment();
});

ui.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateForm(ui.form)) {
    return;
  }

  const updatedData = {
    username: ui.usernameInput.value,
    email: ui.emailInput.value,
  };

  try {
    // Sending PUT request to update user profile
    const response = await fetch(api("profile"), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (response.ok) {
      updateAvatar(ui.usernameInput.value);
      alert("Profile successfully updated!");
    } else {
      alert("Update failed! Please try again.");
    }
  } catch (error) {
    console.error("Error during profile update:", error);
    alert("Server connection error.");
  }
});
