// js/basquetbol.js
let canvasBasket, ctxBasket, juegoBasketActivo = false, animFrameBasket;

const GRAVEDAD_BASKET = 0.42;
const SALTO_BASKET = -10.5;

let p1Basket = { x: 180, y: 380, r: 20, color: '#e74c3c', vy: 0, enSuelo: true, score: 0, carga: 0, cargando: false, cooldownRobo: 0 };
let p2Basket = { x: 620, y: 380, r: 20, color: '#3498db', vy: 0, enSuelo: true, score: 0, carga: 0, cargando: false, cooldownRobo: 0 };

let balonBasket = { x: 400, y: 200, r: 13, vx: 0, vy: 0, poseidoPor: null };

const CANASTA_P1 = { x: 70, y: 200, r: 22 };
const CANASTA_P2 = { x: 730, y: 200, r: 22 };

function iniciarMinijuegoBasquetbol() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasBasket = document.getElementById('gameCanvas');
    canvasBasket.height = 450;
    ctxBasket = canvasBasket.getContext('2d');

    p1Basket.score = 0;
    p2Basket.score = 0;

    resetearPosicionesBasket();
    iniciarCuentaAtras(canvasBasket, () => {
        juegoBasketActivo = true;
        bucleBasquetbol();
    });
}

function resetearPosicionesBasket() {
    p1Basket.x = 180; p1Basket.y = 380; p1Basket.vy = 0; p1Basket.carga = 0; p1Basket.cargando = false;
    p2Basket.x = 620; p2Basket.y = 380; p2Basket.vy = 0; p2Basket.carga = 0; p2Basket.cargando = false;
    balonBasket.x = 400; balonBasket.y = 200; balonBasket.vx = 0; balonBasket.vy = 0;
    balonBasket.poseidoPor = null;
}

function bucleBasquetbol() {
    if (!juegoBasketActivo) return;

    if (p1Basket.cooldownRobo > 0) p1Basket.cooldownRobo--;
    if (p2Basket.cooldownRobo > 0) p2Basket.cooldownRobo--;

    actualizarJugadorBasket(p1Basket, 'w', 'a', 'd');
    actualizarJugadorBasket(p2Basket, 'ArrowUp', 'ArrowLeft', 'ArrowRight');

    // Carga y Lanzamiento de Tiro P1 (Espacio)
    gestionarTiroYCarga(p1Basket, p2Basket, CANASTA_P2, ' ');
    // Carga y Lanzamiento de Tiro P2 (Enter)
    gestionarTiroYCarga(p2Basket, p1Basket, CANASTA_P1, 'Enter');

    // Físicas del Balón
    if (balonBasket.poseidoPor) {
        balonBasket.x = balonBasket.poseidoPor.x + (balonBasket.poseidoPor === p1Basket ? 12 : -12);
        balonBasket.y = balonBasket.poseidoPor.y - 10;
    } else {
        balonBasket.vy += GRAVEDAD_BASKET;
        balonBasket.x += balonBasket.vx;
        balonBasket.y += balonBasket.vy;
        balonBasket.vx *= 0.98;

        if (balonBasket.x - balonBasket.r <= 0 || balonBasket.x + balonBasket.r >= canvasBasket.width) balonBasket.vx *= -1;
        if (balonBasket.y + balonBasket.r >= 400) {
            balonBasket.y = 400 - balonBasket.r;
            balonBasket.vy *= -0.7;
        }

        // Recoger balón suelto
        [p1Basket, p2Basket].forEach(p => {
            if (Math.hypot(balonBasket.x - p.x, balonBasket.y - p.y) < balonBasket.r + p.r + 5) {
                balonBasket.poseidoPor = p;
            }
        });

        verificarCanasta();
    }

    if (p1Basket.score >= 3 || p2Basket.score >= 3) {
        juegoBasketActivo = false;
        let esGanadorP1 = p1Basket.score >= 3;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} en Básquetbol!` : "¡Ganó Jugador 2!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 150 : 30, texto);
        return;
    }

    dibujarEscenaBasquetbol();
    animFrameGlobal = animFrameBasket = requestAnimationFrame(bucleBasquetbol);
}

function actualizarJugadorBasket(p, jumpKey, leftKey, rightKey) {
    if (keys[leftKey]) p.x = Math.max(p.r, p.x - 4.2);
    if (keys[rightKey]) p.x = Math.min(canvasBasket.width - p.r, p.x + 4.2);

    if (keys[jumpKey] && p.enSuelo) {
        p.vy = SALTO_BASKET;
        p.enSuelo = false;
    }

    p.vy += GRAVEDAD_BASKET;
    p.y += p.vy;

    if (p.y >= 380) {
        p.y = 380;
        p.vy = 0;
        p.enSuelo = true;
    }
}

function gestionarTiroYCarga(jugador, oponente, objetivoCanasta, tecla) {
    if (balonBasket.poseidoPor === jugador) {
        if (keys[tecla]) {
            jugador.cargando = true;
            jugador.carga = Math.min(100, jugador.carga + 2.5); // Cargar hasta 100%
        } else if (jugador.cargando) {
            // Se soltó la tecla: Ejecutar Tiro proporcional a la carga
            balonBasket.poseidoPor = null;
            let factorCarga = 0.4 + (jugador.carga / 100) * 0.95;
            let dx = objetivoCanasta.x - jugador.x;
            
            balonBasket.vx = dx * 0.03 * factorCarga;
            balonBasket.vy = -(6 + (jugador.carga / 100) * 7);

            jugador.carga = 0;
            jugador.cargando = false;
        }
    } else {
        jugador.carga = 0;
        jugador.cargando = false;
        // Robar si está cerca del rival que posee el balón
        if (keys[tecla] && balonBasket.poseidoPor === oponente && jugador.cooldownRobo === 0) {
            if (Math.hypot(jugador.x - oponente.x, jugador.y - oponente.y) < jugador.r + oponente.r + 20) {
                balonBasket.poseidoPor = jugador;
                jugador.cooldownRobo = 40;
            }
        }
    }
}

function verificarCanasta() {
    if (Math.hypot(balonBasket.x - CANASTA_P2.x, balonBasket.y - CANASTA_P2.y) < CANASTA_P2.r && balonBasket.vy > 0) {
        p1Basket.score++;
        resetearPosicionesBasket();
    }
    if (Math.hypot(balonBasket.x - CANASTA_P1.x, balonBasket.y - CANASTA_P1.y) < CANASTA_P1.r && balonBasket.vy > 0) {
        p2Basket.score++;
        resetearPosicionesBasket();
    }
}

function dibujarEscenaBasquetbol() {
    ctxBasket.clearRect(0, 0, canvasBasket.width, canvasBasket.height);

    ctxBasket.fillStyle = '#1e293b';
    ctxBasket.fillRect(0, 0, canvasBasket.width, canvasBasket.height);

    ctxBasket.fillStyle = '#b45309';
    ctxBasket.fillRect(0, 400, canvasBasket.width, 50);

    dibujarCanasta(CANASTA_P1.x, CANASTA_P1.y, true);
    dibujarCanasta(CANASTA_P2.x, CANASTA_P2.y, false);

    // Jugadores y Barras de Tiro
    [p1Basket, p2Basket].forEach(p => {
        ctxBasket.fillStyle = p.color;
        ctxBasket.beginPath(); ctxBasket.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctxBasket.fill();
        ctxBasket.strokeStyle = '#ffffff'; ctxBasket.lineWidth = 2; ctxBasket.stroke();

        // Dibujar Barra de Carga de Tiro sobre la cabeza
        if (p.cargando || p.carga > 0) {
            const barW = 40, barH = 7;
            const barX = p.x - barW / 2, barY = p.y - p.r - 18;

            ctxBasket.fillStyle = '#0f172a';
            ctxBasket.fillRect(barX, barY, barW, barH);

            let colorBarra = p.carga > 75 ? '#ef4444' : (p.carga > 40 ? '#facc15' : '#22c55e');
            ctxBasket.fillStyle = colorBarra;
            ctxBasket.fillRect(barX, barY, (p.carga / 100) * barW, barH);

            ctxBasket.strokeStyle = '#ffffff';
            ctxBasket.lineWidth = 1;
            ctxBasket.strokeRect(barX, barY, barW, barH);
        }
    });

    // Balón
    ctxBasket.fillStyle = '#ea580c';
    ctxBasket.beginPath(); ctxBasket.arc(balonBasket.x, balonBasket.y, balonBasket.r, 0, Math.PI * 2); ctxBasket.fill();
    ctxBasket.strokeStyle = '#000000'; ctxBasket.lineWidth = 1.5; ctxBasket.stroke();

    // Marcador e Instrucciones
    ctxBasket.fillStyle = '#ffffff';
    ctxBasket.font = 'bold 20px sans-serif';
    ctxBasket.fillText(`P1: ${p1Basket.score}`, 50, 40);
    ctxBasket.fillText(`P2: ${p2Basket.score}`, 680, 40);

    ctxBasket.font = '11px sans-serif';
    ctxBasket.fillStyle = '#94a3b8';
    ctxBasket.fillText('P1: Mantener Espacio para Cargar Tiro', 20, 435);
    ctxBasket.fillText('P2: Mantener Enter para Cargar Tiro', 570, 435);
}

function dibujarCanasta(x, y, esIzquierda) {
    ctxBasket.fillStyle = '#ffffff';
    let tableroX = esIzquierda ? x - 15 : x + 15;
    ctxBasket.fillRect(tableroX, y - 40, 8, 50);

    ctxBasket.strokeStyle = '#ef4444';
    ctxBasket.lineWidth = 4;
    ctxBasket.beginPath();
    ctxBasket.arc(x, y, 18, 0, Math.PI);
    ctxBasket.stroke();
}