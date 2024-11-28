document.addEventListener('DOMContentLoaded', () => {
    const formsaveU = document.querySelector('#saveUser');

    formsaveU.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita el comportamiento por defecto del formulario.
        const formData = new FormData(formsaveU);
        const data = Object.fromEntries(formData.entries()); // Convierte los datos del formulario en un objeto.

        try {
            const response = await fetch('/saveUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            console.log("Response Status:", response.status);

            const message = await response.json();
            console.log("Response Data:", message);
            console.log("message form:" + message);
            if (message.success) {
                alert("Usuario registrado exitosamente");
                window.location.href = "/loggin"; // Redirige al login.
            } else {
                alert(message.message); // Muestra el mensaje de error del servidor.
            }
        } catch (err) {
            console.error(err);
            alert("Hubo un error inesperado. Por favor, inténtalo más tarde.");
        }
    });
});