console.log("App loaded");

/**
 * SECTION 1: FETCH PROFILE DATA ON PAGE LOAD
 * This section runs when the window is fully loaded.
 */
window.addEventListener("load", async function () {
  // Select input fields to verify if we are on the profile page
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");

  // Only proceed if the specific profile inputs exist in the DOM
  if (usernameInput && emailInput) {
    const token = localStorage.getItem("token");

    try {
      // Sending GET request to fetch user profile details
      const response = await fetch("http://localhost:8000/api/v1/profile", {
        method: "GET",
        headers: {
          token: token, // Authentication token from localStorage
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Populate inputs with data received from the backend
        usernameInput.value = data.username;
        emailInput.value = data.email;
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

/**
 * SECTION 2: FORM VALIDATION AND DATA UPDATE
 * This section handles input validation and the PUT request to update profile.
 */
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    // Only target forms that require validation (marked with 'text-start' class)
    if (!form.classList.contains("text-start")) return;

    const inputs = form.querySelectorAll("input");

    /**
     * Helper function to validate individual inputs based on their 'name' attribute
     */
    const validateInput = (input) => {
      let isValid = true;
      const value = input.value.trim();

      // Basic empty field check
      if (value === "") {
        isValid = false;
      } else if (input.name === "username") {
        const usernameRegex = /^[a-zA-Z0-9.\-_]+$/;
        isValid = usernameRegex.test(value);
      } else if (input.name === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
      } else if (input.name === "password") {
        isValid = value.length >= 8;
      } else if (input.name === "confirm_password") {
        const passwordInput = form.querySelector('[name="password"]');
        isValid = value === passwordInput.value;
      }

      // Visual feedback: Toggle Bootstrap's 'is-invalid' class
      if (!isValid) {
        input.classList.add("is-invalid");
      } else {
        input.classList.remove("is-invalid");
      }

      return isValid;
    };

    // Add event listeners for real-time validation feedback
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        validateInput(input);
      });

      input.addEventListener("input", () => {
        input.classList.remove("is-invalid");
      });
    });

    /**
     * Handle form submission asynchronously
     */
    form.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent page refresh

      let isFormValid = true;
      inputs.forEach((input) => {
        if (!validateInput(input)) {
          isFormValid = false;
        }
      });

      // If all inputs pass validation, proceed with the API call
      if (isFormValid) {
        const token = localStorage.getItem("token");
        const updatedData = {
          username: form.querySelector('[name="username"]').value,
          email: form.querySelector('[name="email"]').value,
        };

        try {
          // Sending PUT request to update user profile
          const response = await fetch("http://localhost:8000/api/v1/profile", {
            method: "PUT",
            headers: {
              token: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedData),
          });

          if (response.ok) {
            alert("Profile successfully updated!");
          } else {
            alert("Update failed! Please try again.");
          }
        } catch (error) {
          console.error("Error during profile update:", error);
          alert("Server connection error.");
        }
      }
    });
  });
});
