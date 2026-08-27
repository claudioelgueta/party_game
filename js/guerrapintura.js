// js/guerrapintura.js
let canvasPintura, ctxPintura, juegoPinturaActivo = false, animFramePintura;

const FILAS_PINTURA = 10, COLS_PINTURA = 20;
let tamCasilla = 40;
let cuadrícula = []; // 0: vacia, 1: P1, 2: P2
let tiempoPintura = 30;
let intervaloTiempoPintura;

let p1Pintura = { x: 100, y: 100, r: 16, color: '#e74c3c', cdBomba: 0 };
let p2Pintura = { x: 700, y: 300, r: 16, color: '#3498db', cdBomba: 0 };

function iniciarMinijuegoGuerraPintura() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasPintura = document.getElementById('gameCanvas');
    canvasPintura.height = 450;
    ctxPintura = canvasPintura.getContext('2d');

    // Inicializar cuadrícula vacía
    cuadrícula = Array(FILAS_PINTURA).fill(null).map(() => Array(COLS_PINTURA).fill(0));
    
    p1Pintura.x = 100; p1Pintura.y = 100; p1Pintura.cdBomba = 0;
    p2Pintura.x = 700; p2Pintura.y = 300; p2Pintura.cdBomba = 0;
    tiempoPintura = 30;

    // Configurar controles táctiles según el dispositivo
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';

    clearInterval(intervaloTiempoPintura);
    intervaloTiempoPintura = setInterval(() => {
        if (!juegoPinturaActivo) return;
        tiempoPintura--;
        if (tiempoPintura <= 0) terminarGuerraPintura();
    }, 1000);

    juegoPinturaActivo = true;
    bucleGuerraPintura();
}

function bucleGuerraPintura() {
    if (!juegoPinturaActivo) return;

    if (p1Pintura.cdBomba > 0) p1Pintura.cdBomba--;
    if (p2Pintura.cdBomba > 0) p2Pintura.cdBomba--;

    // Movimiento con soporte para mayúsculas
    moverJugadorPintura(p1Pintura, ['w', 'W'], ['s', 'S'], ['a', 'A'], ['d', 'D']);
    moverJugadorPintura(p2Pintura, ['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight']);

    // Pintar casilla actual
    pintarCasillaBajoJugador(p1Pintura, 1);
    pintarCasillaBajoJugador(p2Pintura, 2);

    // Bomba de Pintura (3x3)
    if (keys[' '] && p1Pintura.cdBomba === 0) {
        soltarBombaPintura(p1Pintura, 1);
        p1Pintura.cdBomba = 180; // 3 segundos de cooldown
    }
    if (keys['Enter'] && p2Pintura.cdBomba === 0) {
        soltarBombaPintura(p2Pintura, 2);
        p2Pintura.cdBomba = 180;
    }

    dibujarEscenaGuerraPintura();
    animFrameGlobal = animFramePintura = requestAnimationFrame(bucleGuerraPintura);
}

function moverJugadorPintura(p, upKeys, downKeys, leftKeys, rightKeys) {
    const spd = 4;
    if (upKeys.some(k => keys[k])) p.y = Math.max(p.r, p.y - spd);
    if (downKeys.some(k => keys[k])) p.y = Math.min(400 - p.r, p.y + spd);
    if (leftKeys.some(k => keys[k])) p.x = Math.max(p.r, p.x - spd);
    if (rightKeys.some(k => keys[k])) p.x = Math.min(canvasPintura.width - p.r, p.x + spd);
}

function pintarCasillaBajoJugador(p, jugadorID) {
    let col = Math.floor(p.x / tamCasilla);
    let fila = Math.floor(p.y / tamCasilla);
    if (fila >= 0 && fila < FILAS_PINTURA && col >= 0 && col < COLS_PINTURA) {
        cuadrícula[fila][col] = jugadorID;
    }
}

function soltarBombaPintura(p, jugadorID) {
    let colCentral = Math.floor(p.x / tamCasilla);
    let filaCentral = Math.floor(p.y / tamCasilla);

    for (let f = filaCentral - 1; f <= filaCentral + 1; f++) {
        for (let c = colCentral - 1; c <= colCentral + 1; c++) {
            if (f >= 0 && f < FILAS_PINTURA && c >= 0 && c < COLS_PINTURA) {
                cuadrícula[f][c] = jugadorID;
            }
        }
    }
}

function terminarGuerraPintura() {
    juegoPinturaActivo = false;
    clearInterval(intervaloTiempoPintura);

    let p1Puntos = 0, p2Puntos = 0;
    for (let f = 0; f < FILAS_PINTURA; f++) {
        for (let c = 0; c < COLS_PINTURA; c++) {
            if (cuadrícula[f][c] === 1) p1Puntos++;
            if (cuadrícula[f][c] === 2) p2Puntos++;
        }
    }

    let esGanadorP1 = p1Puntos > p2Puntos;
    let texto = p1Puntos === p2Puntos 
        ? "¡Empate en Guerra de Pintura!" 
        : (esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} con ${p1Puntos} casillas!` : `¡Ganó Jugador 2 con ${p2Puntos} casillas!`);
    
    guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 150 : 30, texto);
}

function dibujarEscenaGuerraPintura() {
    ctxPintura.clearRect(0, 0, canvasPintura.width, canvasPintura.height);

    // Dibujar Tablero Pintado
    for (let f = 0; f < FILAS_PINTURA; f++) {
        for (let c = 0; c < COLS_PINTURA; c++) {
            if (cuadrícula[f][c] === 1) ctxPintura.fillStyle = '#f87171';
            else if (cuadrícula[f][c] === 2) ctxPintura.fillStyle = '#60a5fa';
            else ctxPintura.fillStyle = '#1e293b';

            ctxPintura.fillRect(c * tamCasilla, f * tamCasilla, tamCasilla - 1, tamCasilla - 1);
        }
    }

    // Jugadores
    [p1Pintura, p2Pintura].forEach((p) => {
        ctxPintura.fillStyle = p.color;
        ctxPintura.beginPath(); ctxPintura.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctxPintura.fill();
        ctxPintura.strokeStyle = '#ffffff'; ctxPintura.lineWidth = 2; ctxPintura.stroke();
    });

    // Barra de tiempo e interfaz
    ctxPintura.fillStyle = '#0f172a';
    ctxPintura.fillRect(0, 400, canvasPintura.width, 50);

    ctxPintura.fillStyle = '#ffffff';
    ctxPintura.font = 'bold 18px sans-serif';
    ctxPintura.fillText(`⏱️ Tiempo: ${tiempoPintura}s`, 340, 432);
    ctxPintura.fillText(`P1 (Espacio Bomba): ${p1Pintura.cdBomba === 0 ? 'LISTO' : 'Cargando'}`, 20, 432);
    ctxPintura.fillText(`P2 (Enter Bomba): ${p2Pintura.cdBomba === 0 ? 'LISTO' : 'Cargando'}`, 550, 432);
}