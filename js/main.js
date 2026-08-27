let jugadorActual = null;
let vistaEstadisticas = 'simple';

document.addEventListener('DOMContentLoaded', () => {
    const sesionGuardada = localStorage.getItem('nombreJugador');
    if (sesionGuardada) {
        document.getElementById('nombreJugador').value = sesionGuardada;
        iniciarSesion();
    }
});

function iniciarSesion() {
    const nombreInput = document.getElementById('nombreJugador').value.trim();
    if (!nombreInput) {
        alert("Ingresa un nombre por favor");
        return;
    }

    const formData = new FormData();
    formData.append('nombre', nombreInput);

    fetch('api/stats.php?action=login', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            jugadorActual = data.jugador;
            localStorage.setItem('nombreJugador', jugadorActual.nombre);
            document.getElementById('statusSesion').innerText = `Jugando como: ${jugadorActual.nombre}`;
            document.getElementById('statusSesion').style.color = "#2ed573";
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Error al iniciar sesión:", err));
}

function mostrarRanking() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'none';
    document.getElementById('vistaRanking').style.display = 'block';

    fetch('api/obtener_ranking.php') // <-- Ruta corregida a la carpeta api
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const tbody = document.getElementById('tablaRankingBody');
                tbody.innerHTML = '';

                data.data.forEach((jugador, index) => {
                    const fila = document.createElement('tr');
                    
                    let icono = `${index + 1}°`;
                    if (index === 0) icono = '🥇 1°';
                    if (index === 1) icono = '🥈 2°';
                    if (index === 2) icono = '🥉 3°';

                    fila.innerHTML = `
                        <td><strong>${icono}</strong></td>
                        <td>${escapeHTML(jugador.nombre)}</td>
                        <td><strong>${jugador.puntos_totales} pts</strong></td>
                        <td>${jugador.partidas_ganadas}</td>
                        <td>${jugador.partidas_jugadas}</td>
                    `;
                    tbody.appendChild(fila);
                });
            } else {
                console.error(data.message);
            }
        })
        .catch(err => console.error("Error al cargar ranking:", err));
}

// Función auxiliar para prevenir inyección HTML en nombres
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Función para detener completamente cualquier minijuego activo y regresar al Hub
function volverAlHub() {
    // 1. Desactivar los flags de control de todos los minijuegos
    if (typeof juegoRoboActivo !== 'undefined') juegoRoboActivo = false;
    if (typeof juegoVoleyActivo !== 'undefined') juegoVoleyActivo = false;
    if (typeof juegoBasketActivo !== 'undefined') juegoBasketActivo = false;

    // 2. Detener las animaciones en curso (evita que el bucle siga ejecutándose en segundo plano)
    if (typeof animFrameRobo !== 'undefined') cancelAnimationFrame(animFrameRobo);
    if (typeof animFrameVoley !== 'undefined') cancelAnimationFrame(animFrameVoley);
    if (typeof animFrameBasket !== 'undefined') cancelAnimationFrame(animFrameBasket);

    // 3. Limpiar el Canvas por completo
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // 4. Alternar las vistas de la interfaz
    document.getElementById('zonaJuego').style.display = 'none';
    document.getElementById('hubMinijuegos').style.display = 'block';
}

function abrirModal() {
    if (!jugadorActual) {
        alert("Primero ingresa tu nombre y presiona Entrar");
        return;
    }
    actualizarEstadisticas();
    document.getElementById('modalStats').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modalStats').style.display = 'none';
}

function cambiarVistaStats(tipo) {
    vistaEstadisticas = tipo;
    document.getElementById('btnSimple').classList.toggle('active', tipo === 'simple');
    document.getElementById('btnAvanzada').classList.toggle('active', tipo === 'avanzada');
    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    fetch(`api/stats.php?action=get&nombre=${encodeURIComponent(jugadorActual.nombre)}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const j = data.jugador;
            const contenedor = document.getElementById('statsContent');

            if (vistaEstadisticas === 'simple') {
                contenedor.innerHTML = `
                    <p><strong>Jugador:</strong> ${j.nombre}</p>
                    <p><strong>Puntos Totales:</strong> ${j.puntos_totales}</p>
                    <p><strong>Partidas Ganadas:</strong> ${j.partidas_ganadas}</p>
                `;
            } else {
                contenedor.innerHTML = `
                    <p><strong>Jugador:</strong> ${j.nombre}</p>
                    <p><strong>Partidas Jugadas:</strong> ${j.partidas_jugadas}</p>
                    <p><strong>Partidas Ganadas:</strong> ${j.partidas_ganadas}</p>
                    <p><strong>Partidas Perdidas:</strong> ${j.partidas_perdidas}</p>
                    <p><strong>Puntos Totales:</strong> ${j.puntos_totales}</p>
                    <p><strong>Winrate:</strong> ${j.winrate}%</p>
                `;
            }
        }
    });
}

function obtenerTipoControl() {
    return document.querySelector('input[name="controlType"]:checked').value;
}
function mostrarHub() {
    document.getElementById('menuPrincipal').style.display = 'none';
    document.getElementById('hubMinijuegos').style.display = 'block';
}

function volverAlMenu() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('menuPrincipal').style.display = 'block';
}

// Modificación en iniciarSesion() para mostrar botón de Hub
const originalIniciarSesion = iniciarSesion;
iniciarSesion = function() {
    const nombreInput = document.getElementById('nombreJugador').value.trim();
    if (!nombreInput) {
        alert("Ingresa un nombre por favor");
        return;
    }

    const formData = new FormData();
    formData.append('nombre', nombreInput);

    fetch('api/stats.php?action=login', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            jugadorActual = data.jugador;
            localStorage.setItem('nombreJugador', jugadorActual.nombre);
            document.getElementById('statusSesion').innerText = `Jugando como: ${jugadorActual.nombre}`;
            document.getElementById('statusSesion').style.color = "#2ed573";
            document.getElementById('btnIrHub').style.display = 'block';
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error("Error al iniciar sesión:", err));
};