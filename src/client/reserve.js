document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.reserve-btn');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const placeId = button.getAttribute('data-id');
            console.log("Se hizo click en el boton");
            // Redirigir directamente a la página de reserva con el id en la URL
            window.location.href = `/reserve/${placeId}`;
        });
    });
});
