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
    //actualizar usuario
    const formUpdate = document.querySelector('#updateProfile');
    if (formUpdate) { // Solo añade el evento si el formulario existe
        formUpdate.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita el comportamiento por defecto del formulario.
            const form = new FormData(formUpdate);
            const data = Object.fromEntries(form.entries()); // Convierte los datos del formulario en un objeto.
            console.log("formulario", data);
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
                        text: 'Ya se ha apartado la fecha. Por favor, selecciona otra.',
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
    // Selecciona todos los formularios de eliminación
    const forms = document.querySelectorAll(".delete");

    if (forms) {
        forms.forEach(form => {
            form.addEventListener('submit', async (event) => {
                event.preventDefault(); // Evita el comportamiento predeterminado del formulario

                const button = form.querySelector('button');
                const placeId = form.getAttribute('data-id'); // Extrae el ID desde el atributo

                const confirmation = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: "Esta acción cancelará la reserva.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, cancelar',
                    cancelButtonText: 'No, mantener'
                });

                if (confirmation.isConfirmed) {
                    try {
                        const response = await fetch(`/reservations/${placeId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                        });

                        const data = await response.json();

                        if (data.success) {
                            await Swal.fire({
                                title: '¡Éxito!',
                                text: data.message || "Reserva cancelada con éxito.",
                                icon: 'success',
                                confirmButtonColor: '#3085d6',
                                confirmButtonText: 'Aceptar'
                            });
                            form.parentNode.removeChild(form); // Remueve la reserva del DOM
                        } else {
                            await Swal.fire({
                                title: 'Error',
                                text: data.message || "No se logró cancelar la reserva.",
                                icon: 'error',
                                confirmButtonColor: '#d33',
                                confirmButtonText: 'Aceptar'
                            });
                        }
                    } catch (error) {
                        console.error("Error al cancelar la reserva:", error);
                        await Swal.fire({
                            title: 'Error',
                            text: "Ocurrió un error al procesar la solicitud.",
                            icon: 'error',
                            confirmButtonColor: '#d33',
                            confirmButtonText: 'Aceptar'
                        });
                    }
                }
            });
        });
    }


    //updateFormplace
    const updatePlace = document.querySelector('#updatePlace');
    if (updatePlace) {
        updatePlace.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita el comportamiento por defecto del formulario.

            const placeId = updatePlace.getAttribute('data-id'); // Obtén el ID desde el atributo data-id
            const form = new FormData(updatePlace);
            const data = Object.fromEntries(form.entries()); // Convierte los datos del formulario en un objeto

            try {
                const response = await fetch(`/updatePlace/${placeId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorMessage = await response.text();
                    throw new Error(errorMessage); // Lanza el mensaje de error del servidor
                }

                const message = await response.json();
                if (message.success) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: message.message,
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                    }).then(() => {
                        window.location.href = "/selectPlaces"; // Redirige después del éxito
                    });
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: message.message || 'No se pudo actualizar el lugar.',
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
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
});