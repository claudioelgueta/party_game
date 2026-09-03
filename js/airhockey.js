// js/airhockey.js
let canvasHockey, ctxHockey, juegoHockeyActivo = false, animFrameHockey;
let disco = { x: 400, y: 225, vx: 5, vy: 5, r: 12 };
let p1Hockey = { x: 100, y: 225, r: 22, color: '#e74c3c' };
let p2Hockey = { x: 700, y: 225, r: 22, color: '#3498db' };
let scoreP1H = 0, scoreP2H = 0;

function iniciarMinijuegoAirHockey() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasHockey = document.getElementById('gameCanvas');
    canvasHockey.height = 450;
    ctxHockey = canvasHockey.getContext('2d');

    p1Hockey = { x: 100, y: 225, r: 22, color: '#e74c3c' };
    p2Hockey = { x: 700, y: 225, r: 22, color: '#3498db' };
    disco = { x: 400, y: 225, vx: Math.random() > 0.5 ? 5 : -5, vy: 4, r: 12 };
    scoreP1H = 0; scoreP2H = 0;
    iniciarCuentaAtras(canvasHockey, () => {
        juegoHockeyActivo = true;
        bucleAirHockey();
    });
}

function bucleAirHockey() {
    if (!juegoHockeyActivo) return;

    // Controles P1 (WASD) restringido a la mitad izquierda
    if (keys['w'] || keys['W']) p1Hockey.y = Math.max(p1Hockey.r, p1Hockey.y - 5);
    if (keys['s'] || keys['S']) p1Hockey.y = Math.min(canvasHockey.height - p1Hockey.r, p1Hockey.y + 5);
    if (keys['a'] || keys['A']) p1Hockey.x = Math.max(p1Hockey.r, p1Hockey.x - 5);
    if (keys['d'] || keys['D']) p1Hockey.x = Math.min(380 - p1Hockey.r, p1Hockey.x + 5);

    // Controles P2 (Flechas) restringido a la mitad derecha
    if (keys['ArrowUp']) p2Hockey.y = Math.max(p2Hockey.r, p2Hockey.y - 5);
    if (keys['ArrowDown']) p2Hockey.y = Math.min(canvasHockey.height - p2Hockey.r, p2Hockey.y + 5);
    if (keys['ArrowLeft']) p2Hockey.x = Math.max(420 + p2Hockey.r, p2Hockey.x - 5);
    if (keys['ArrowRight']) p2Hockey.x = Math.min(canvasHockey.width - p2Hockey.r, p2Hockey.x + 5);

    // Movimiento disco
    disco.x += disco.vx;
    disco.y += disco.vy;

    // Rebote superior e inferior
    if (disco.y - disco.r <= 0 || disco.y + disco.r >= canvasHockey.height) disco.vy *= -1;

    // Detección de Goles o Rebote lateral
    if (disco.y > 150 && disco.y < 300) {
        if (disco.x < 0) { scoreP2H++; resetDisco(1); }
        if (disco.x > canvasHockey.width) { scoreP1H++; resetDisco(-1); }
    } else {
        if (disco.x - disco.r <= 0 || disco.x + disco.r >= canvasHockey.width) disco.vx *= -1;
    }

    // Colisión Disco - Mazo
    [p1Hockey, p2Hockey].forEach(p => {
        let dist = Math.hypot(disco.x - p.x, disco.y - p.y);
        if (dist < disco.r + p.r) {
            let angle = Math.atan2(disco.y - p.y, disco.x - p.x);
            disco.vx = Math.cos(angle) * 7.5;
            disco.vy = Math.sin(angle) * 7.5;
        }
    });

    if (scoreP1H >= 3 || scoreP2H >= 3) {
        juegoHockeyActivo = false;
        let esGanadorP1 = scoreP1H >= 3;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre}!` : "¡Ganó Jugador 2!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 120 : 30, texto);
        return;
    }

    dibujarAirHockey();
    animFrameGlobal = animFrameHockey = requestAnimationFrame(bucleAirHockey);
}

function resetDisco(dir) {
    disco.x = 400; disco.y = 225;
    disco.vx = dir * 5; disco.vy = (Math.random() - 0.5) * 6;
}

function dibujarAirHockey() {
    ctxHockey.fillStyle = '#1e293b';
    ctxHockey.fillRect(0, 0, canvasHockey.width, canvasHockey.height);

    // Marcaciones de mesa
    ctxHockey.strokeStyle = '#38bdf8';
    ctxHockey.lineWidth = 4;
    ctxHockey.beginPath();
    ctxHockey.moveTo(400, 0); ctxHockey.lineTo(400, 450);
    ctxHockey.arc(400, 225, 50, 0, Math.PI * 2);
    ctxHockey.stroke();

    // Porterías
    ctxHockey.fillStyle = '#ef4444';
    ctxHockey.fillRect(0, 150, 10, 150);
    ctxHockey.fillStyle = '#3b82f6';
    ctxHockey.fillRect(790, 150, 10, 150);

    // Disco y Mazos
    ctxHockey.fillStyle = '#facc15';
    ctxHockey.beginPath(); ctxHockey.arc(disco.x, disco.y, disco.r, 0, Math.PI * 2); ctxHockey.fill();

    [p1Hockey, p2Hockey].forEach(p => {
        ctxHockey.fillStyle = p.color;
        ctxHockey.beginPath(); ctxHockey.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctxHockey.fill();
    });

    // Marcador
    ctxHockey.fillStyle = '#ffffff';
    ctxHockey.font = 'bold 22px sans-serif';
    ctxHockey.fillText(`${scoreP1H} - ${scoreP2H}`, 375, 40);
}