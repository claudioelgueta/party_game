// js/geometrydash.js
let canvasGD, ctxGD, juegoGDActivo = false, animFrameGD;

const GRAVEDAD_BASE = 0.65;
let velocidadPistas = 8.5;
let contadorSpawnGD = 0;

// Estados previos de teclas para detectar pulsaciones individuales (Just Pressed)
let prevKeysP1 = false;
let prevKeysP2 = false;

// Configuración de Jugadores (Carriles P1 y P2)
let p1GD = {
    x: 90, y: 0, size: 22, vy: 0, enSuelo: true, vivo: true,
    sueloY: 180, techoY: 30, dirGrav: 1, forma: 'CUBE', cargaRobot: 0
};

let p2GD = {
    x: 90, y: 0, size: 22, vy: 0, enSuelo: true, vivo: true,
    sueloY: 410, techoY: 260, dirGrav: 1, forma: 'CUBE', cargaRobot: 0
};

let obstaculosP1 = [];
let obstaculosP2 = [];
let portalesP1 = [];
let portalesP2 = [];

const FORMAS_DISPONIBLES = ['CUBE', 'SHIP', 'BALL', 'UFO', 'WAVE', 'ROBOT', 'SPIDER'];

function iniciarMinijuegoGeometryDash() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasGD = document.getElementById('gameCanvas');
    canvasGD.height = 450;
    ctxGD = canvasGD.getContext('2d');

    // Reset Jugador 1
    p1GD.forma = 'CUBE'; p1GD.dirGrav = 1; p1GD.vy = 0; p1GD.vivo = true;
    p1GD.y = p1GD.sueloY - p1GD.size; p1GD.enSuelo = true; p1GD.cargaRobot = 0;

    // Reset Jugador 2
    p2GD.forma = 'CUBE'; p2GD.dirGrav = 1; p2GD.vy = 0; p2GD.vivo = true;
    p2GD.y = p2GD.sueloY - p2GD.size; p2GD.enSuelo = true; p2GD.cargaRobot = 0;

    obstaculosP1 = []; obstaculosP2 = [];
    portalesP1 = []; portalesP2 = [];

    velocidadPistas = 8.5;
    contadorSpawnGD = 0;
    prevKeysP1 = false; prevKeysP2 = false;

    // Ocultar controles táctiles si no aplican
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';

    juegoGDActivo = true;
    bucleGeometryDash();
}

function bucleGeometryDash() {
    if (!juegoGDActivo) return;

    velocidadPistas += 0.003; // Aceleración progresiva
    contadorSpawnGD++;

    // Captura de entradas (Mantenida vs Presionada en este frame)
    let keyP1 = (keys['w'] || keys['W'] || keys[' ']);
    let keyP2 = (keys['ArrowUp'] || keys['Enter']);

    let justPressedP1 = keyP1 && !prevKeysP1;
    let justPressedP2 = keyP2 && !prevKeysP2;

    prevKeysP1 = keyP1;
    prevKeysP2 = keyP2;

    // Generar Obstáculos y Portales
    if (contadorSpawnGD > 50) {
        generarPatronObstaculos();
        contadorSpawnGD = 0;
    }

    // Actualizar Físicas de cada modo
    actualizarMecanicasForma(p1GD, keyP1, justPressedP1);
    actualizarMecanicasForma(p2GD, keyP2, justPressedP2);

    // Mover Obstáculos y verificar colisiones
    obstaculosP1 = actualizarObstaculosGD(obstaculosP1, p1GD);
    obstaculosP2 = actualizarObstaculosGD(obstaculosP2, p2GD);

    // Mover Portales y verificar transformaciones
    portalesP1 = actualizarPortalesGD(portalesP1, p1GD);
    portalesP2 = actualizarPortalesGD(portalesP2, p2GD);

    // Fin del juego si alguno muere
    if (!p1GD.vivo || !p2GD.vivo) {
        juegoGDActivo = false;
        let esGanadorP1 = p1GD.vivo && !p2GD.vivo;
        let texto = esGanadorP1 
            ? `¡Ganó ${jugadorActual.nombre} en Geometry Dash!` 
            : (!p1GD.vivo && !p2GD.vivo ? "¡Ambos cayeron en el intento!" : "¡Ganó Jugador 2!");

        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 180 : 40, texto);
        return;
    }

    dibujarEscenaGD();
    animFrameGlobal = animFrameGD = requestAnimationFrame(bucleGeometryDash);
}

function actualizarMecanicasForma(p, presionado, recienPresionado) {
    if (!p.vivo) return;

    let grav = GRAVEDAD_BASE * p.dirGrav;

    switch (p.forma) {
        case 'CUBE':
            p.vy += grav;
            if (presionado && p.enSuelo) {
                p.vy = -7.5 * p.dirGrav;
                p.enSuelo = false;
            }
            break;

        case 'SHIP':
            if (presionado) p.vy -= 0.65 * p.dirGrav;
            else p.vy += 0.55 * p.dirGrav;
            p.vy = Math.max(-7.5, Math.min(7.5, p.vy));
            break;

        case 'BALL':
            p.vy += grav;
            if (recienPresionado && p.enSuelo) {
                p.dirGrav *= -1;
                p.vy = 3.5 * p.dirGrav;
                p.enSuelo = false;
            }
            break;

        case 'UFO':
            p.vy += grav;
            if (recienPresionado) {
                p.vy = -7.5 * p.dirGrav;
            }
            break;

        case 'WAVE':
            p.vy = presionado ? -8.5 * p.dirGrav : 8.5 * p.dirGrav;
            break;

        case 'ROBOT':
            p.vy += grav;
            if (presionado) {
                if (p.enSuelo) { p.cargaRobot = 10; p.enSuelo = false; }
                if (p.cargaRobot > 0) {
                    p.vy = -8.2 * p.dirGrav;
                    p.cargaRobot--;
                }
            } else {
                p.cargaRobot = 0;
            }
            break;

        case 'SPIDER':
            if (recienPresionado && p.enSuelo) {
                p.dirGrav *= -1;
                p.y = (p.dirGrav === 1) ? p.sueloY - p.size : p.techoY;
                p.vy = 0;
            } else {
                p.vy += grav;
            }
            break;
    }

    p.y += p.vy;

    // Colisión con Techo y Suelo del carril
    if (p.y >= p.sueloY - p.size) {
        p.y = p.sueloY - p.size;
        p.vy = 0;
        p.enSuelo = (p.dirGrav === 1);
    } else if (p.y <= p.techoY) {
        p.y = p.techoY;
        p.vy = 0;
        p.enSuelo = (p.dirGrav === -1);
    } else {
        p.enSuelo = false;
    }
}

function generarPatronObstaculos() {
    if (!juegoGDActivo) return;

    let r = Math.random();

    // Portal de Transformación (25%)
    if (r < 0.25) {
        let nuevaForma = FORMAS_DISPONIBLES[Math.floor(Math.random() * FORMAS_DISPONIBLES.length)];
        portalesP1.push({ x: 820, y: p1GD.techoY, h: p1GD.sueloY - p1GD.techoY, forma: nuevaForma });
        portalesP2.push({ x: 820, y: p2GD.techoY, h: p2GD.sueloY - p2GD.techoY, forma: nuevaForma });
        return;
    }

    // Pinchos dobles o Bloques con pincho
    if (r < 0.6) {
        obstaculosP1.push({ x: 820, y: p1GD.sueloY, w: 18, h: 24, tipo: 'pincho' });
        obstaculosP1.push({ x: 838, y: p1GD.sueloY, w: 18, h: 24, tipo: 'pincho' });

        obstaculosP2.push({ x: 820, y: p2GD.sueloY, w: 18, h: 24, tipo: 'pincho' });
        obstaculosP2.push({ x: 838, y: p2GD.sueloY, w: 18, h: 24, tipo: 'pincho' });
    } else {
        obstaculosP1.push({ x: 820, y: p1GD.sueloY, w: 26, h: 26, tipo: 'bloque' });
        obstaculosP1.push({ x: 820, y: p1GD.techoY + 24, w: 18, h: -24, tipo: 'pincho' });

        obstaculosP2.push({ x: 820, y: p2GD.sueloY, w: 26, h: 26, tipo: 'bloque' });
        obstaculosP2.push({ x: 820, y: p2GD.techoY + 24, w: 18, h: -24, tipo: 'pincho' });
    }
}

function actualizarObstaculosGD(lista, jugador) {
    if (!juegoGDActivo) return [];

    return lista.filter(obs => {
        obs.x -= velocidadPistas;

        let colision = false;

        if (obs.tipo === 'pincho') {
            colision = (jugador.x < obs.x + obs.w &&
                        jugador.x + jugador.size > obs.x &&
                        jugador.y + jugador.size > (obs.h > 0 ? obs.y - obs.h : obs.y) &&
                        jugador.y < (obs.h > 0 ? obs.y : obs.y - obs.h));
        } else if (obs.tipo === 'bloque') {
            colision = (jugador.x < obs.x + obs.w &&
                        jugador.x + jugador.size > obs.x &&
                        jugador.y + jugador.size > obs.y - obs.h &&
                        jugador.y < obs.y);
        }

        if (colision) jugador.vivo = false;

        return obs.x > -40;
    });
}

function actualizarPortalesGD(portales, jugador) {
    if (!juegoGDActivo) return [];

    return portales.filter(portal => {
        portal.x -= velocidadPistas;

        if (jugador.x + jugador.size >= portal.x && jugador.x <= portal.x + 15) {
            if (jugador.forma !== portal.forma) {
                jugador.forma = portal.forma;
                jugador.dirGrav = 1;
            }
        }
        return portal.x > -30;
    });
}

function dibujarEscenaGD() {
    if (!ctxGD) return;

    ctxGD.clearRect(0, 0, canvasGD.width, canvasGD.height);

    ctxGD.fillStyle = '#080c14';
    ctxGD.fillRect(0, 0, canvasGD.width, canvasGD.height);

    // Dibujar Límites de Pistas
    ctxGD.strokeStyle = '#3b82f6';
    ctxGD.lineWidth = 4;
    [p1GD, p2GD].forEach(p => {
        ctxGD.beginPath(); ctxGD.moveTo(0, p.techoY); ctxGD.lineTo(canvasGD.width, p.techoY); ctxGD.stroke();
        ctxGD.beginPath(); ctxGD.moveTo(0, p.sueloY); ctxGD.lineTo(canvasGD.width, p.sueloY); ctxGD.stroke();
    });

    // Dibujar Portales
    [...portalesP1, ...portalesP2].forEach(portal => {
        ctxGD.fillStyle = '#a855f7';
        ctxGD.fillRect(portal.x, portal.y, 14, portal.h);
        ctxGD.fillStyle = '#ffffff';
        ctxGD.font = 'bold 10px sans-serif';
        ctxGD.fillText(portal.forma, portal.x - 10, portal.y + portal.h / 2);
    });

    // Dibujar Pinchos y Bloques
    [...obstaculosP1, ...obstaculosP2].forEach(obs => {
        if (obs.tipo === 'pincho') {
            ctxGD.fillStyle = '#ef4444';
            ctxGD.beginPath();
            ctxGD.moveTo(obs.x, obs.y);
            ctxGD.lineTo(obs.x + obs.w / 2, obs.y - obs.h);
            ctxGD.lineTo(obs.x + obs.w, obs.y);
            ctxGD.closePath();
            ctxGD.fill();
        } else {
            ctxGD.fillStyle = '#64748b';
            ctxGD.fillRect(obs.x, obs.y - obs.h, obs.w, obs.h);
        }
    });

    // Dibujar Jugadores
    [p1GD, p2GD].forEach((p, i) => {
        if (!p.vivo) return;

        ctxGD.fillStyle = (i === 0) ? '#f87171' : '#38bdf8';
        ctxGD.fillRect(p.x, p.y, p.size, p.size);

        ctxGD.fillStyle = '#ffffff';
        ctxGD.font = 'bold 9px sans-serif';
        ctxGD.fillText(p.forma, p.x - 4, p.y - 6);
    });

    // Interfaz Superior / Inferior
    ctxGD.fillStyle = '#ffffff';
    ctxGD.font = '11px sans-serif';
    ctxGD.fillText(`P1 (W/Espacio) - Modo: ${p1GD.forma}`, 15, p1GD.techoY - 10);
    ctxGD.fillText(`P2 (Arriba/Enter) - Modo: ${p2GD.forma}`, 15, p2GD.techoY - 10);
}