const Swal = require('sweetalert2');
document.addEventListener('DOMContentLoaded', () => {
    //p vista Save User
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
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Usuario registrado exitosamente',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    // Redirige después de que el usuario cierre la alerta.
                    window.location.href = "/loggin";
                });
            } else {
                // Mensaje de error con redirección al formulario
                Swal.fire({
                    title: 'Error',
                    text: 'El usuario no se pudo crear. Por favor, revisa los datos.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                }).then(() => {
                    // Redirige al formulario o permanece en la vista actual
                    window.location.href = "/formularioCrearUsuario"; // Ajusta la URL según corresponda
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Error inesperado',
                text: 'Hubo un problema en el servidor. Por favor, inténtalo más tarde.',
                icon: 'error',//warning, info, question
                confirmButtonText: 'Aceptar',
            });
        }
    });
}
);