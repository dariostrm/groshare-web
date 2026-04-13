console.log("App loaded");

document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    if (!form.classList.contains('text-start')) return;

    const inputs = form.querySelectorAll('input');

    const validateInput = (input) => {
      let isValid = true;
      const value = input.value.trim();

      if (value === '') {
        isValid = false;
      } 
      else if (input.name === 'username') {
        const usernameRegex = /^[a-zA-Z0-9.\-_]+$/;
        isValid = usernameRegex.test(value);
      } 
      else if (input.name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
      } 
      else if (input.name === 'password') {
        isValid = value.length >= 8;
      } 
      else if (input.name === 'confirm_password') {
        const passwordInput = form.querySelector('[name="password"]');
        isValid = (value === passwordInput.value);
      }

      if (!isValid) {
        input.classList.add('is-invalid');
      } else {
        input.classList.remove('is-invalid');
      }

      return isValid;
    };

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        validateInput(input);
      });

      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
      });
    });

    form.addEventListener('submit', (event) => {
      let isFormValid = true;

      inputs.forEach(input => {
        if (!validateInput(input)) {
          isFormValid = false;
        }
      });

      if (!isFormValid) {
        event.preventDefault(); 
      } else {
        event.preventDefault(); 
        alert('Form successfully validated and submitted!');
      }
    });
  });
});