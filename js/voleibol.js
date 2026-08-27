// js/voleibol.js
function bucleVoleibol() {
    if (!juegoVoleyActivo) return;
    // ... resto del código
}
let canvasVoley, ctxVoley, juegoVoleyActivo = false, animFrameVoley;

// Gravedad reducida para caída más lenta y flotante
const GRAVEDAD_VOLEY = 0.22;
const SALTO_VOLEY = -9.5;
const PUNTOS_GANAR_VOLEY = 3;

let p1Voley = { x: 180, y: 380, r: 20, color: '#e74c3c', vx: 0, vy: 0, enSuelo: true, score: 0 };
let p2Voley = { x: 620, y: 380, r: 20, color: '#3498db', vx: 0, vy: 0, enSuelo: true, score: 0 };
let balonVoley = { x: 400, y: 110, r: 14, vx: 0, vy: 0, enEspera: true };

const RED_VOLEY = { x: 395, width: 10, top: 230, bottom: 450 };

function iniciarMinijuegoVoleibol() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasVoley = document.getElementById('gameCanvas');
    canvasVoley.height = 450;
    ctxVoley = canvasVoley.getContext('2d');

    p1Voley.score = 0;
    p2Voley.score = 0;

    resetearPuntoVoley();
    juegoVoleyActivo = true;

    bucleVoleibol();
}

function resetearPuntoVoley() {
    p1Voley.x = 180; p1Voley.y = 380; p1Voley.vy = 0; p1Voley.enSuelo = true;
    p2Voley.x = 620; p2Voley.y = 380; p2Voley.vy = 0; p2Voley.enSuelo = true;

    // Balón suspendido en el centro arriba hasta el primer golpe
    balonVoley.x = 400;
    balonVoley.y = 110;
    balonVoley.vx = 0;
    balonVoley.vy = 0;
    balonVoley.enEspera = true;
}

function bucleVoleibol() {
    if (!juegoVoleyActivo) return;

    actualizarJugadorVoley(p1Voley, 'w', 'a', 'd', 20, 375);
    actualizarJugadorVoley(p2Voley, 'ArrowUp', 'ArrowLeft', 'ArrowRight', 425, 780);

    // Movimiento del Balón (solo si ya no está en espera)
    if (!balonVoley.enEspera) {
        balonVoley.vy += GRAVEDAD_VOLEY;
        balonVoley.x += balonVoley.vx;
        balonVoley.y += balonVoley.vy;
    }

    // Rebote en Paredes y Techo
    if (balonVoley.x - balonVoley.r <= 0) { balonVoley.x = balonVoley.r; balonVoley.vx *= -1; }
    if (balonVoley.x + balonVoley.r >= canvasVoley.width) { balonVoley.x = canvasVoley.width - balonVoley.r; balonVoley.vx *= -1; }
    if (balonVoley.y - balonVoley.r <= 0) { balonVoley.y = balonVoley.r; balonVoley.vy *= -1; }

    // Colisión con la Red
    if (balonVoley.x + balonVoley.r > RED_VOLEY.x && balonVoley.x - balonVoley.r < RED_VOLEY.x + RED_VOLEY.width) {
        if (balonVoley.y + balonVoley.r > RED_VOLEY.top) {
            if (balonVoley.y < RED_VOLEY.top + 10) {
                balonVoley.vy *= -1;
                balonVoley.y = RED_VOLEY.top - balonVoley.r;
            } else {
                balonVoley.vx *= -1;
                balonVoley.x = balonVoley.x < 400 ? RED_VOLEY.x - balonVoley.r : RED_VOLEY.x + RED_VOLEY.width + balonVoley.r;
            }
        }
    }

    // Colisión Balón con Jugadores (inicia el juego al golpear)
    [
        { p: p1Voley, remateKey: ' ' },
        { p: p2Voley, remateKey: 'Enter' }
    ].forEach(item => {
        let jug = item.p;
        let dist = Math.hypot(balonVoley.x - jug.x, balonVoley.y - jug.y);
        if (dist < balonVoley.r + jug.r) {
            if (balonVoley.enEspera) {
                balonVoley.enEspera = false; // El primer golpe activa la física
            }
            let angle = Math.atan2(balonVoley.y - jug.y, balonVoley.x - jug.x);
            let fuerza = keys[item.remateKey] ? 9.5 : 6;
            balonVoley.vx = Math.cos(angle) * fuerza;
            balonVoley.vy = Math.sin(angle) * fuerza;
        }
    });

    // Balón toca el Suelo (Punto)
    if (balonVoley.y + balonVoley.r >= 400) {
        if (balonVoley.x < 400) {
            p2Voley.score++;
        } else {
            p1Voley.score++;
        }
        resetearPuntoVoley();
    }

    // Victoria tras 3 Rondas
    if (p1Voley.score >= PUNTOS_GANAR_VOLEY || p2Voley.score >= PUNTOS_GANAR_VOLEY) {
        juegoVoleyActivo = false;
        let esGanadorP1 = p1Voley.score >= PUNTOS_GANAR_VOLEY;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (3 Rondas)!` : "¡Ganó Jugador 2 (3 Rondas)!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 150 : 30, texto);
        return;
    }

    dibujarEscenaVoleibol();
    animFrameVoley = requestAnimationFrame(bucleVoleibol);
}

function actualizarJugadorVoley(p, jumpKey, leftKey, rightKey, minX, maxX) {
    if (keys[leftKey]) p.x = Math.max(minX, p.x - 4.5);
    if (keys[rightKey]) p.x = Math.min(maxX, p.x + 4.5);

    if (keys[jumpKey] && p.enSuelo) {
        p.vy = SALTO_VOLEY;
        p.enSuelo = false;
    }

    p.vy += GRAVEDAD_VOLEY;
    p.y += p.vy;

    if (p.y >= 380) {
        p.y = 380;
        p.vy = 0;
        p.enSuelo = true;
    }
}

function dibujarEscenaVoleibol() {
    ctxVoley.clearRect(0, 0, canvasVoley.width, canvasVoley.height);

    ctxVoley.fillStyle = '#0f172a';
    ctxVoley.fillRect(0, 0, canvasVoley.width, canvasVoley.height);

    ctxVoley.fillStyle = '#f59e0b';
    ctxVoley.fillRect(0, 400, canvasVoley.width, 50);

    ctxVoley.fillStyle = '#ffffff';
    ctxVoley.fillRect(RED_VOLEY.x, RED_VOLEY.top, RED_VOLEY.width, RED_VOLEY.bottom - RED_VOLEY.top);

    // Jugadores
    [p1Voley, p2Voley].forEach(p => {
        ctxVoley.fillStyle = p.color;
        ctxVoley.beginPath(); ctxVoley.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctxVoley.fill();
        ctxVoley.strokeStyle = '#ffffff'; ctxVoley.lineWidth = 2; ctxVoley.stroke();
    });

    // Balón
    ctxVoley.fillStyle = '#facc15';
    ctxVoley.beginPath(); ctxVoley.arc(balonVoley.x, balonVoley.y, balonVoley.r, 0, Math.PI * 2); ctxVoley.fill();
    ctxVoley.strokeStyle = '#0284c7'; ctxVoley.lineWidth = 2; ctxVoley.stroke();

    // Cartel indicativo de saque
    if (balonVoley.enEspera) {
        ctxVoley.fillStyle = '#facc15';
        ctxVoley.font = 'bold 15px sans-serif';
        ctxVoley.textAlign = 'center';
        ctxVoley.fillText('¡GOLPEA EL BALÓN PARA INICIAR LA RONDA!', 400, 70);
        ctxVoley.textAlign = 'left';
    }

    // Marcador
    ctxVoley.fillStyle = '#ffffff';
    ctxVoley.font = 'bold 20px sans-serif';
    ctxVoley.fillText(`P1: ${p1Voley.score}/3`, 50, 40);
    ctxVoley.fillText(`P2: ${p2Voley.score}/3`, 680, 40);
}