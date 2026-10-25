
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector(
        'form[action$="/register"]'
    );

    if (!registerForm) return;

    const passwordInput = registerForm.querySelector(
        'input[name="password"]'
    );
    const confirmInput = registerForm.querySelector(
        'input[name="confirm_password"]'
    );

    registerForm.addEventListener("submit", (event) => {
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (password.length < 8 || !/\d/.test(password)) {
            event.preventDefault();
            passwordInput.setCustomValidity(
                "Use at least 8 characters and include a number."
            );
            passwordInput.reportValidity();
            passwordInput.addEventListener(
                "input",
                () => passwordInput.setCustomValidity(""),
                { once: true }
            );
            return;
        }

        passwordInput.setCustomValidity("");

        if (password !== confirmPassword) {
            event.preventDefault();
            confirmInput.setCustomValidity(
                "Your passwords do not match."
            );
            confirmInput.reportValidity();
            confirmInput.addEventListener(
                "input",
                () => confirmInput.setCustomValidity(""),
                { once: true }
            );
            return;
        }

        confirmInput.setCustomValidity("");
    });
});
