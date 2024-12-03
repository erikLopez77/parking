document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.reserve-btn');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const placeId = button.getAttribute('data-id');
            // Redirigir directamente a la página de reserva con el id en la URL
            window.location.href = `/reserve/${placeId}`;
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.updateP-btn');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const placeId = button.getAttribute('data-id');
            // Redirigir directamente a la página de reserva con el id en la URL
            window.location.href = `/updatePlace/${placeId}`;
        });
    });
});