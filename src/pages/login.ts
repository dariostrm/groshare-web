import { setAuthToken, isLoggedIn } from "../auth.js";
import { validateForm } from "../validation.js";

const ui = {
  usernameInput: document.getElementById("username") as HTMLInputElement,
  passwordInput: document.getElementById("password") as HTMLInputElement,
  form: document.getElementById("login-form") as HTMLFormElement,
  message: document.getElementById("login-message") as HTMLDivElement,
};

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

// Redirect if already logged in
window.addEventListener("load", function () {
  if (isLoggedIn()) {
    window.location.href = "/";
  }
});

ui.form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  if (!validateForm(ui.form)) {
    return;
  }

  const loginData = {
    username: ui.usernameInput.value,
    password: ui.passwordInput.value,
  };

  try {
    // Sending POST request to login
    const response = await fetch(
      "https://groshare.dariostrm.dev/api/v1/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      },
    );

    if (response.ok) {
      const data = await response.json();
      setAuthToken(data.token);
      window.location.href = "/";
    } else {
      showMessage(response.statusText || "Login failed! Please try again.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    showMessage("Server connection error.");
  }
});
