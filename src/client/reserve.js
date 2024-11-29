document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.reserve-btn');
    buttons.forEach(button => {
        button.addEventListener('click', (event) => {
            const placeId = button.getAttribute('data-id');
            reserve(placeId); // Asegúrate de que la función `reserve` esté definida.
        });
    });
});
function reserve(placeId) {
    /* fetch(`/reserve/${placeId}`, { method: 'POST' })
        .then(response => {
            if (response.ok) {
                alert('Reserva exitosa');
                window.location.reload(); // Refresca la página
            } else {
                alert('Error al realizar la reserva');
            }
        })
        .catch(error => console.error('Error:', error)); */
        alert(placeId);
}
