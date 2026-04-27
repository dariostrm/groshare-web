export function validateForm(form: HTMLFormElement) {
  const inputs = form.querySelectorAll("input");
  let isFormValid = true;

  inputs.forEach((input) => {
    if (!validateInput(input, form)) {
      isFormValid = false;
    }
  });

  return isFormValid;
}

function validateInput(
  input: HTMLInputElement,
  form: HTMLFormElement,
): boolean {
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
    const passwordInput = form.querySelector(
      '[name="password"]',
    ) as HTMLInputElement;
    isValid = value === passwordInput.value;
  }

  // Visual feedback: Toggle Bootstrap's 'is-invalid' class
  if (!isValid) {
    input.classList.add("is-invalid");
  } else {
    input.classList.remove("is-invalid");
  }

  return isValid;
}

document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    // Only target forms that require validation (marked with 'validate' class)
    if (!form.classList.contains("validate")) return;

    const inputs = form.querySelectorAll("input");

    // Add event listeners for real-time validation feedback
    inputs.forEach((input) => {
      input.addEventListener("blur", () => {
        validateInput(input, form);
      });

      input.addEventListener("input", () => {
        input.classList.remove("is-invalid");
      });
    });
  });
});
