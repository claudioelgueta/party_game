// js/atletismo.js
let canvasCarrera, ctxCarrera, juegoCarreraActivo = false, animFrameCarrera;

// Estado Jugadores
let p1Carrera = { x: 50, y: 100, color: '#e74c3c', teclaEsperada: 'a' };
let p2Carrera = { x: 50, y: 220, color: '#3498db', teclaEsperada: 'ArrowLeft' };

const META_X = 700;
const AVANZO_PASO = 12;

function iniciarMinijuegoAtletismo() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasCarrera = document.getElementById('gameCanvas');
    canvasCarrera.height = 450;
    ctxCarrera = canvasCarrera.getContext('2d');

    // Reset de posiciones y variables
    p1Carrera.x = 50;
    p2Carrera.x = 50;
    p1Carrera.teclaEsperada = 'a';
    p2Carrera.teclaEsperada = 'ArrowLeft';
    juegoCarreraActivo = false;

    // Mostrar controles táctiles si está en modo móvil
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';

    dibujarPista();
    iniciarCuentaAtrasCarrera();
}

function iniciarCuentaAtrasCarrera() {
    iniciarCuentaAtras(canvasCarrera, () => {
        juegoCarreraActivo = true;
        bucleCarrera();
    });
}

function bucleCarrera() {
    if (!juegoCarreraActivo) return;

    dibujarPista();

    if (p1Carrera.x >= META_X || p2Carrera.x >= META_X) {
        juegoCarreraActivo = false;
        verificarGanadorCarrera();
        return;
    }

    animFrameGlobal = animFrameCarrera = requestAnimationFrame(bucleCarrera);
}

function dibujarPista() {
    ctxCarrera.clearRect(0, 0, canvasCarrera.width, canvasCarrera.height);

    // Fondo pista
    ctxCarrera.fillStyle = '#d35400';
    ctxCarrera.fillRect(0, 50, canvasCarrera.width, 240);

    // Líneas de carril
    ctxCarrera.strokeStyle = '#ffffff';
    ctxCarrera.lineWidth = 4;

    ctxCarrera.beginPath();
    ctxCarrera.moveTo(0, 50); ctxCarrera.lineTo(canvasCarrera.width, 50);
    ctxCarrera.moveTo(0, 170); ctxCarrera.lineTo(canvasCarrera.width, 170);
    ctxCarrera.moveTo(0, 290); ctxCarrera.lineTo(canvasCarrera.width, 290);
    ctxCarrera.stroke();

    // Línea de Meta (Ajedrez)
    for (let y = 50; y < 290; y += 20) {
        ctxCarrera.fillStyle = (y / 20) % 2 === 0 ? '#ffffff' : '#000000';
        ctxCarrera.fillRect(META_X, y, 15, 20);
    }

    // Corredor 1 (P1)
    ctxCarrera.fillStyle = p1Carrera.color;
    ctxCarrera.beginPath();
    ctxCarrera.arc(p1Carrera.x, p1Carrera.y, 18, 0, Math.PI * 2);
    ctxCarrera.fill();
    ctxCarrera.fillStyle = '#ffffff';
    ctxCarrera.font = 'bold 12px sans-serif';
    ctxCarrera.fillText("P1", p1Carrera.x - 7, p1Carrera.y + 4);

    // Corredor 2 (P2)
    ctxCarrera.fillStyle = p2Carrera.color;
    ctxCarrera.beginPath();
    ctxCarrera.arc(p2Carrera.x, p2Carrera.y, 18, 0, Math.PI * 2);
    ctxCarrera.fill();
    ctxCarrera.fillStyle = '#ffffff';
    ctxCarrera.fillText("P2", p2Carrera.x - 7, p2Carrera.y + 4);
}

// Escuchar teclas (PC)
window.addEventListener('keydown', (e) => {
    if (!juegoCarreraActivo) return;

    // Controles P1 (Alternar A y D)
    if (e.key.toLowerCase() === p1Carrera.teclaEsperada) {
        p1Carrera.x += AVANZO_PASO;
        p1Carrera.teclaEsperada = (p1Carrera.teclaEsperada === 'a') ? 'd' : 'a';
    }

    // Controles P2 (Alternar Flecha Izquierda y Derecha)
    if (e.key === p2Carrera.teclaEsperada) {
        p2Carrera.x += AVANZO_PASO;
        p2Carrera.teclaEsperada = (p2Carrera.teclaEsperada === 'ArrowLeft') ? 'ArrowRight' : 'ArrowLeft';
    }
});

// Botones táctiles (Móvil)
function toquePaso(jugador) {
    if (!juegoCarreraActivo) return;

    if (jugador === 1) p1Carrera.x += AVANZO_PASO;
    if (jugador === 2) p2Carrera.x += AVANZO_PASO;
}

function verificarGanadorCarrera() {
    let esGanadorP1 = p1Carrera.x >= META_X;
    let ganadorTexto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (P1)!` : "¡Ganó Jugador 2!";
    let puntosOtorgados = esGanadorP1 ? 100 : 20;

    guardarResultadoServidor(esGanadorP1 ? 1 : 0, puntosOtorgados, ganadorTexto);
}