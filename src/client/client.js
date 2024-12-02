import Swal from 'sweetalert2';
document.addEventListener('DOMContentLoaded', () => {
    //p vista Save User
    const formsaveU = document.querySelector('#saveUser');
    if (formsaveU) { // Solo añade el evento si el formulario existe
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
                    Swal.fire({
                        title: 'Error',
                        text: 'El usuario no se pudo crear. Por favor, revisa los datos o cambia tu nombre de usuario. ',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                    }).then(() => {
                        window.location.href = "/saveUser"; // Ajusta la URL según corresponda
                    });
                }
            } catch (err) {
                console.error(err);
                Swal.fire({
                    title: 'Error inesperado',
                    text: 'Hubo un problema en el servidor. Por favor, inténtalo más tarde.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            }
        });
    }
    //actualizar usuario
    const formUpdate = document.querySelector('#updateProfile');
    if (formUpdate) { // Solo añade el evento si el formulario existe
        formUpdate.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita el comportamiento por defecto del formulario.
            const form = new FormData(formUpdate);
            const data = Object.fromEntries(form.entries()); // Convierte los datos del formulario en un objeto.
            try {
                const response = await fetch('/updateProfile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                console.log("Response Status:", response.status);

                const message = await response.json();
                console.log("Response Data:", message);
                if (message.success) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'Usuario actualizado exitosamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        // Redirige después de que el usuario cierre la alerta.
                        window.location.href = "/myProfile";
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'El usuario no se pudo actualizar. Por favor, revisa los datos.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                    }).then(() => {
                        window.location.href = "/updateProfile"; // Ajusta la URL según corresponda
                    });
                }
            } catch (err) {
                console.error(err);
                Swal.fire({
                    title: 'Error inesperado',
                    text: 'Hubo un problema en el servidor. Por favor, inténtalo más tarde.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            }
        });
    }

    //reserva fecha
    const reserveForm = document.querySelector(".reserve");
    if (reserveForm) { // Solo añade el evento si el formulario existe
        reserveForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita el comportamiento por defecto del formulario.
            const placeId = reserveForm.getAttribute('data-id');
            const formData = new FormData(reserveForm);
            const data = Object.fromEntries(formData.entries()); // Convierte los datos del formulario en un objeto.
            try {
                const response = await fetch(`/reserve/${placeId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                console.log("Response Status:", response.status);

                const message = await response.json();
                console.log("Response Data:", message);
                if (message.success) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'Reserva registrada exitosamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        // Redirige después de que el usuario cierre la alerta.
                        window.location.href = "/reservations";
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: 'Ya se ha apartado la fecha.Por favor, selecciona otra.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                    })
                }
            } catch (err) {
                console.error(err);
                Swal.fire({
                    title: 'Error inesperado',
                    text: 'Hubo un problema en el servidor. Por favor, inténtalo más tarde.',
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            }
        });
    }

    //borrar booking
    const buttonsD = document.querySelectorAll(".delete"); // Cambié `querySelector` por `querySelectorAll` para seleccionar múltiples botones

    if (buttonsD) {
        buttonsD.forEach(button => {
            button.addEventListener('click', async () => {
                const placeId = button.getAttribute('data-id'); // Obtiene el ID de la reserva
                if (confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
                    fetch(`/cancel-reservation/${placeId}`, {
                        method: 'DELETE',
                    })
                        .then(response => {
                            if (response.ok) {
                                alert("Reserva cancelada con éxito.");
                                window.location.reload(); // Recargar la página para actualizar la lista
                            } else {
                                alert("Hubo un problema al cancelar la reserva.");
                            }
                        })
                        .catch(error => {
                            console.error("Error al cancelar la reserva:", error);
                            alert("Ocurrió un error al procesar la solicitud.");
                        });
                }
            });
        });
    }


});