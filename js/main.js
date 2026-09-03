// ==========================================
// MAIN.JS - MOTOR GLOBAL Y GESTIÓN DE HUB
// ==========================================

// Manejo global de entradas de teclado
let keys = {};

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// ESTADO GLOBAL ÚNICO
let juegoActivo = null;      // Nombre del minijuego activo (ej: 'sumo', 'voley') o null
let animFrameGlobal = null;  // Identificador único para requestAnimationFrame
let timerContador = null;    // Identificador único para setInterval (conteo 3, 2, 1)
let timerPantallaFinal = null;
let pantallaFinalActiva = false;
let rachasVictoria = { P1: 0, P2: 0 };
let torneoActivo = false;
let rondaActual = 0;
let juegosDeLaRonda = [];
const TOTAL_RONDAS = 5;
const juegosDisponibles = [
    ['Carrera de Atletismo', 'iniciarMinijuegoAtletismo'],
    ['Carrera de Autos', 'iniciarMinijuegoAutos'],
    ['Arena PvP', 'iniciarMinijuegoPVP'],
    ['Reacción Rápida', 'iniciarMinijuegoReaccion'],
    ['Carrera de Helicópteros', 'iniciarMinijuegoHelicoptero'],
    ['Fútbol 1v1', 'iniciarMinijuegoFutbol'],
    ['Sumo 2D', 'iniciarMinijuegoSumo'],
    ['Lluvia de Meteoros', 'iniciarMinijuegoMeteoros'],
    ['Air Hockey 2D', 'iniciarMinijuegoAirHockey'],
    ['Robar la Base', 'iniciarMinijuegoRobarBase'],
    ['Vóleibol 2D', 'iniciarMinijuegoVoleibol'],
    ['Básquetbol 1v1', 'iniciarMinijuegoBasquetbol'],
    ['Guerra de Pintura', 'iniciarMinijuegoGuerraPintura'],
    ['La Patata Caliente', 'iniciarMinijuegoPatataCaliente'],
    ['Geometry Runner', 'iniciarMinijuegoGeometryDash']
];
const intervalosActivos = new Set();
const temporizadoresActivos = new Set();
const framesActivos = new Set();

const setIntervalNativo = window.setInterval.bind(window);
const clearIntervalNativo = window.clearInterval.bind(window);
const setTimeoutNativo = window.setTimeout.bind(window);
const clearTimeoutNativo = window.clearTimeout.bind(window);
const requestAnimationFrameNativo = window.requestAnimationFrame.bind(window);
const cancelAnimationFrameNativo = window.cancelAnimationFrame.bind(window);

window.setInterval = function (callback, delay, ...args) {
    const id = setIntervalNativo(callback, delay, ...args);
    intervalosActivos.add(id);
    return id;
};
window.clearInterval = function (id) {
    intervalosActivos.delete(id);
    clearIntervalNativo(id);
};
window.setTimeout = function (callback, delay, ...args) {
    const id = setTimeoutNativo(() => {
        temporizadoresActivos.delete(id);
        callback(...args);
    }, delay);
    temporizadoresActivos.add(id);
    return id;
};
window.clearTimeout = function (id) {
    temporizadoresActivos.delete(id);
    clearTimeoutNativo(id);
};
window.requestAnimationFrame = function (callback) {
    const id = requestAnimationFrameNativo((timestamp) => {
        framesActivos.delete(id);
        callback(timestamp);
    });
    framesActivos.add(id);
    return id;
};
window.cancelAnimationFrame = function (id) {
    framesActivos.delete(id);
    cancelAnimationFrameNativo(id);
};

// Stubs para compatibilidad de servidor y controles
if (typeof jugadorActual === 'undefined') {
    var jugadorActual = { nombre: "Jugador 1" };
}

if (typeof guardarResultadoServidor !== 'function') {
    window.guardarResultadoServidor = function(puntos, xp, texto, ganador) {
        if (texto.includes('Empate')) {
            mostrarPantallaFinal('Empate', 'No hay racha nueva');
            console.log("Resultado registrado en servidor:", texto, { puntos, xp });
            return;
        }
        const esGanadorP1 = ganador ? ganador === 'P1' : texto.includes('(P1)') || texto.includes(jugadorActual.nombre);
        registrarVictoria(esGanadorP1 ? 'P1' : 'P2');
        console.log("Resultado registrado en servidor:", texto, { puntos, xp });
    };
}

function registrarVictoria(ganador) {
    const rival = ganador === 'P1' ? 'P2' : 'P1';
    const rachaRival = rachasVictoria[rival];
    rachasVictoria[ganador]++;
    rachasVictoria[rival] = 0;

    const nombreGanador = ganador === 'P1' ? jugadorActual.nombre : 'Jugador 2';
    const nombreRival = rival === 'P1' ? jugadorActual.nombre : 'Jugador 2';
    let mensajeRacha = `Racha actual: ${rachasVictoria[ganador]} partidas ganadas seguidas`;
    if (rachasVictoria[ganador] >= 3) {
        mensajeRacha = `llevas una racha actual de ${rachasVictoria[ganador]} partidas ganadas seguidas`;
    }
    if (rachaRival > 1) {
        mensajeRacha = `¡${nombreGanador} acabó con la racha de ${rachaRival} victorias de ${nombreRival}!\n${mensajeRacha}`;
    }
    mostrarPantallaFinal(nombreGanador, mensajeRacha);
}

function mostrarPantallaFinal(nombreGanador, mensajeRacha) {
    if (pantallaFinalActiva) return;
    pantallaFinalActiva = true;
    detenerTodosLosJuegos(false);
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const overlay = document.getElementById('mensajeJuego');
    if (overlay) {
        overlay.innerText = '';
        overlay.style.display = 'none';
    }
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText(`¡Ganador: ${nombreGanador}!`, canvas.width / 2, canvas.height / 2 - 45);
    ctx.font = 'bold 22px sans-serif';
    mensajeRacha.split('\n').forEach((linea, indice) => {
        ctx.fillText(linea, canvas.width / 2, canvas.height / 2 + 35 + indice * 30);
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    timerPantallaFinal = setTimeout(() => {
        timerPantallaFinal = null;
        volverAlHub();
    }, 4000);
}

function actualizarEstadoRonda(mensaje, mostrarSiguiente = false) {
    const estado = document.getElementById('estadoRonda');
    const siguiente = document.getElementById('btnSiguienteRonda');
    const torneo = document.getElementById('btnTorneoAleatorio');
    if (estado) {
        estado.innerText = mensaje;
        estado.style.display = mensaje ? 'block' : 'none';
    }
    if (siguiente) siguiente.style.display = mostrarSiguiente ? 'block' : 'none';
    if (torneo) torneo.style.display = torneoActivo ? 'none' : 'block';
}

function iniciarTorneoAleatorio() {
    detenerTodosLosJuegos();
    torneoActivo = true;
    rondaActual = 0;
    rachasVictoria = { P1: 0, P2: 0 };
    juegosDeLaRonda = [...juegosDisponibles]
        .sort(() => Math.random() - 0.5)
        .slice(0, TOTAL_RONDAS);
    iniciarSiguienteRonda();
}

function iniciarSiguienteRonda() {
    if (!torneoActivo || rondaActual >= TOTAL_RONDAS) return;
    const juego = juegosDeLaRonda[rondaActual++];
    const iniciarJuego = window[juego[1]];
    if (typeof iniciarJuego !== 'function') {
        console.error(`No se encontró el juego: ${juego[1]}`);
        return;
    }
    detenerTodosLosJuegos();
    actualizarEstadoRonda(`Ronda ${rondaActual}/${TOTAL_RONDAS}: ${juego[0]}`);
    iniciarJuego();
}

function iniciarCuentaAtras(canvas, alTerminar) {
    pantallaFinalActiva = false;
    detenerTodosLosJuegos();
    const overlay = document.getElementById('mensajeJuego');
    if (overlay) {
        overlay.innerText = '';
        overlay.style.display = 'none';
    }
    const ctx = canvas.getContext('2d');
    let cuenta = 3;
    const pintar = () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cuenta, canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    };
    pintar();
    timerContador = setInterval(() => {
        cuenta--;
        if (cuenta === 0) {
            clearInterval(timerContador);
            timerContador = null;
            alTerminar();
            return;
        }
        pintar();
    }, 1000);
}

if (typeof obtenerTipoControl !== 'function') {
    window.obtenerTipoControl = function() {
        return ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'mobile' : 'desktop';
    };
}

// 🛑 DETENCIÓN Y LIBERACIÓN TOTAL DE MEMORIA / CACHÉ DE RENDER
function detenerTodosLosJuegos(incluirCanvas = true) {
    // 1. Apagar bandera de control global y flags individuales conocidas
    juegoActivo = null;
    if (typeof juegoSumoActivo !== 'undefined') juegoSumoActivo = false;
    if (typeof juegoVoleyActivo !== 'undefined') juegoVoleyActivo = false;
    if (typeof juegoHockeyActivo !== 'undefined') juegoHockeyActivo = false;
    if (typeof juegoBasketActivo !== 'undefined') juegoBasketActivo = false;
    if (typeof juegoCarreraActivo !== 'undefined') juegoCarreraActivo = false;
    if (typeof juegoAutosActivo !== 'undefined') juegoAutosActivo = false;
    if (typeof juegoFutbolActivo !== 'undefined') juegoFutbolActivo = false;
    if (typeof juegoGDActivo !== 'undefined') juegoGDActivo = false;
    if (typeof juegoPinturaActivo !== 'undefined') juegoPinturaActivo = false;
    if (typeof juegoHeliActivo !== 'undefined') juegoHeliActivo = false;
    if (typeof juegoMetActivo !== 'undefined') juegoMetActivo = false;
    if (typeof juegoPatataActivo !== 'undefined') juegoPatataActivo = false;
    if (typeof juegoRoboActivo !== 'undefined') juegoRoboActivo = false;
    if (typeof juegoPVPActivo !== 'undefined') juegoPVPActivo = false;
    if (typeof juegoReaccionActivo !== 'undefined') juegoReaccionActivo = false;

    // 2. Detener temporizadores de conteo (3, 2, 1...)
    if (timerContador !== null) {
        clearInterval(timerContador);
        timerContador = null;
    }

    if (timerPantallaFinal !== null) {
        clearTimeout(timerPantallaFinal);
        timerPantallaFinal = null;
    }

    intervalosActivos.forEach(id => clearIntervalNativo(id));
    intervalosActivos.clear();
    temporizadoresActivos.forEach(id => clearTimeoutNativo(id));
    temporizadoresActivos.clear();

    // 3. Cancelar bucle de renderizado activo en GPU
    if (animFrameGlobal !== null) {
        cancelAnimationFrame(animFrameGlobal);
        animFrameGlobal = null;
    }

    framesActivos.forEach(id => cancelAnimationFrameNativo(id));
    framesActivos.clear();

    // 4. PURGA DE CANVAS / REFRESCO DE VRAM (Hard Memory Flush)
    // Reasignar la dimensión del canvas obliga al navegador a vaciar el buffer gráfico en caché
    const canvas = document.getElementById('gameCanvas');
    if (canvas && incluirCanvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = canvas.width;
    }

    // 5. Destruir nodos inyectados y eventos en el panel táctil
    const touchPanel = document.getElementById('touchControls');
    if (touchPanel) {
        touchPanel.innerHTML = '';
        touchPanel.style.display = 'none';
    }

    // 6. Vaciar buffer de teclas acumuladas
    keys = {};
}

// 🏠 REGRESO AL HUB CON RESETEO COMPLETO
function volverAlHub() {
    // Detiene todo el procesamiento de fondo y refresca la memoria del juego
    detenerTodosLosJuegos();

    const hub = document.getElementById('hubMinijuegos');
    const zonaJuego = document.getElementById('zonaJuego');
    const ranking = document.getElementById('vistaRanking');
    const modal = document.getElementById('modalStats');

    if (hub) hub.style.display = 'block';
    if (zonaJuego) zonaJuego.style.display = 'none';
    if (ranking) ranking.style.display = 'none';
    if (modal) modal.style.display = 'none';
    if (torneoActivo && rondaActual < TOTAL_RONDAS) {
        actualizarEstadoRonda(`Ronda ${rondaActual}/${TOTAL_RONDAS} terminada. Prepara la siguiente ronda.`, true);
    } else if (torneoActivo) {
        torneoActivo = false;
        actualizarEstadoRonda(`Torneo terminado: ${TOTAL_RONDAS} rondas completadas.`);
    } else {
        actualizarEstadoRonda('');
    }
    pantallaFinalActiva = false;
}