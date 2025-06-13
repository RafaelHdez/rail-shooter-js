// js/authUI.js
export function setupAuthUI() {
    const authModal = document.getElementById("auth-modal");
    const modalTitle = document.getElementById("modal-title");
    const nicknameInput = document.getElementById("nickname");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("login-button");
    const registerButton = document.getElementById("register-button");
    const closeModalButton = document.getElementById("close-modal");
    const authForm = document.getElementById("auth-form");

    let mode = "login"; // o "register"

    function openModal(authMode) {
        mode = authMode;
        authModal.classList.remove("hidden");

        if (authMode === "login") {
            modalTitle.textContent = "Iniciar Sesión";
            nicknameInput.style.display = "none";
            nicknameInput.removeAttribute("required");
        } else {
            modalTitle.textContent = "Registrarse";
            nicknameInput.style.display = "block";
            nicknameInput.removeAttribute("required");
        }

        authForm.reset();
    }

    function closeModal() {
        authModal.classList.add("hidden");
    }

    loginButton.addEventListener("click", () => openModal("login"));
    registerButton.addEventListener("click", () => openModal("register"));
    closeModalButton.addEventListener("click", closeModal);

    // Exportar también la referencia al formulario y el modo seleccionado
    return {
        getMode: () => mode,
        getFormData: () => ({
            nickname: nicknameInput.value,
            email: emailInput.value,
            password: passwordInput.value
        }),
        onSubmit: (callback) => {
            authForm.addEventListener("submit", (e) => {
                e.preventDefault();
                callback(mode, {
                    nickname: nicknameInput.value,
                    email: emailInput.value,
                    password: passwordInput.value
                });
            });
        },
        closeModal
    };
}
