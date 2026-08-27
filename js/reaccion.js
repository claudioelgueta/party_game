function bucleReaccion() {
    if (!juegoReaccionActivo) return;
    // ... resto del código
}

let canvasReaccion, ctxReaccion;
let estadoReaccion = 'ESPERANDO'; // 'PREPARADO', 'SENAL', 'ESPERA_PUNTO', 'FINAL'
let timerEspera = null;
let tiempoInicioSenal = 0;
let puntosP1 = 0;
let puntosP2 = 0;
const PUNTOS_PARA_GANAR = 3;
let mensajeEstado = "";

function iniciarMinijuegoReaccion() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasReaccion = document.getElementById('gameCanvas');
    canvasReaccion.height = 450;
    ctxReaccion = canvasReaccion.getContext('2d');

    puntosP1 = 0;
    puntosP2 = 0;

    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchReaccion();

    // Eliminar listener anterior si existía y añadir el nuevo
    document.removeEventListener('keydown', manejarTeclaReaccion);
    document.addEventListener('keydown', manejarTeclaReaccion);

    iniciarNuevaRondaReaccion();
}

function iniciarNuevaRondaReaccion() {
    if (puntosP1 >= PUNTOS_PARA_GANAR || puntosP2 >= PUNTOS_PARA_GANAR) {
        finalizarJuegoReaccion();
        return;
    }

    estadoReaccion = 'PREPARADO';
    mensajeEstado = "¡ATENTOS! No presiones antes de tiempo...";
    dibujarEscenaReaccion('#c0392b'); // Rojo advertencia

    if (timerEspera) clearTimeout(timerEspera);

    // Tiempo de espera aleatorio entre 2000ms y 5500ms
    let tiempoAleatorio = 2000 + Math.random() * 3500;
    timerEspera = setTimeout(() => {
        estadoReaccion = 'SENAL';
        tiempoInicioSenal = Date.now();
        mensajeEstado = "¡¡¡ Y A !!!";
        dibujarEscenaReaccion('#2ecc71'); // Verde
    }, tiempoAleatorio);
}

function manejarTeclaReaccion(e) {
    if (estadoReaccion === 'ESPERA_PUNTO' || estadoReaccion === 'FINAL') return;

    let key = e.key ? e.key.toLowerCase() : e;
    let esP1 = (key === ' ' || key === 'w' || key === 'spacebar');
    let esP2 = (key === 'enter' || key === 'arrowup');

    if (!esP1 && !esP2) return;

    if (estadoReaccion === 'PREPARADO') {
        // Falso comienzo
        clearTimeout(timerEspera);
        estadoReaccion = 'ESPERA_PUNTO';

        if (esP1) {
            puntosP2++;
            mensajeEstado = "¡Falso comienzo de P1! Punto para P2";
        } else {
            puntosP1++;
            mensajeEstado = "¡Falso comienzo de P2! Punto para P1";
        }
        dibujarEscenaReaccion('#e67e22'); // Naranja advertencia
        setTimeout(iniciarNuevaRondaReaccion, 2200);

    } else if (estadoReaccion === 'SENAL') {
        // Reacción válida
        estadoReaccion = 'ESPERA_PUNTO';
        let ms = Date.now() - tiempoInicioSenal;

        if (esP1) {
            puntosP1++;
            mensajeEstado = `¡P1 fue más rápido! (${ms} ms)`;
        } else {
            puntosP2++;
            mensajeEstado = `¡P2 fue más rápido! (${ms} ms)`;
        }
        dibujarEscenaReaccion('#3498db'); // Azul victoria
        setTimeout(iniciarNuevaRondaReaccion, 2200);
    }
}

function dibujarEscenaReaccion(colorFondo) {
    ctxReaccion.fillStyle = colorFondo;
    ctxReaccion.fillRect(0, 0, canvasReaccion.width, canvasReaccion.height);

    // Marcadores
    ctxReaccion.fillStyle = '#ffffff';
    ctxReaccion.font = 'bold 22px sans-serif';
    ctxReaccion.textAlign = 'left';
    ctxReaccion.fillText(`P1 (Espacio / W): ${puntosP1}`, 30, 40);

    ctxReaccion.textAlign = 'right';
    ctxReaccion.fillText(`P2 (Enter / ▲): ${puntosP2}`, canvasReaccion.width - 30, 40);

    // Texto Central
    ctxReaccion.textAlign = 'center';
    ctxReaccion.font = 'bold 32px sans-serif';
    ctxReaccion.fillText(mensajeEstado, canvasReaccion.width / 2, canvasReaccion.height / 2);
    ctxReaccion.textAlign = 'left';
}

function configurarBotonesTouchReaccion() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <button class="touch-btn p1-btn" style="flex:1; height:60px; font-size:18px;" onclick="manejarTeclaReaccion(' ')">🔴 P1 ¡AQUÍ!</button>
            <button class="touch-btn p2-btn" style="flex:1; height:60px; font-size:18px;" onclick="manejarTeclaReaccion('enter')">🔵 P2 ¡AQUÍ!</button>
        </div>
    `;
}

function finalizarJuegoReaccion() {
    document.removeEventListener('keydown', manejarTeclaReaccion);
    estadoReaccion = 'FINAL';

    let esGanadorP1 = puntosP1 >= PUNTOS_PARA_GANAR;
    let ganadorTexto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (P1)!` : "¡Ganó Jugador 2!";
    let puntosOtorgados = esGanadorP1 ? 100 : 20;

    guardarResultadoServidor(esGanadorP1 ? 1 : 0, puntosOtorgados, ganadorTexto);
}