import { getAuthToken, isLoggedIn } from "../auth";
import { validateForm } from "../validation";

const ui = {
  usernameInput: document.getElementById("username") as HTMLInputElement,
  emailInput: document.getElementById("email") as HTMLInputElement,
  form: document.getElementById("profile-form") as HTMLFormElement,
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
      const response = await fetch(
        "https://groshare.dariostrm.dev/api/v1/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`, // Authentication token from localStorage
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Populate inputs with data received from the backend
        ui.usernameInput.value = data.username;
        ui.emailInput.value = data.email;
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
    const response = await fetch(
      "https://groshare.dariostrm.dev/api/v1/profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      },
    );

    if (response.ok) {
      alert("Profile successfully updated!");
    } else {
      alert("Update failed! Please try again.");
    }
  } catch (error) {
    console.error("Error during profile update:", error);
    alert("Server connection error.");
  }
});
