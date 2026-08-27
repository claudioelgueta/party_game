function bucleSumo() {
    if (!juegoSumoActivo) return;
    // ... resto del código
}

let canvasSumo, ctxSumo, juegoSumoActivo = false, animFrameSumo;
let ringRadius = 200, ringCenterX = 400, ringCenterY = 225;

let p1Sumo = { x: 300, y: 225, r: 20, color: '#e74c3c', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };
let p2Sumo = { x: 500, y: 225, r: 20, color: '#3498db', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };

function iniciarMinijuegoSumo() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasSumo = document.getElementById('gameCanvas');
    canvasSumo.height = 450;
    ctxSumo = canvasSumo.getContext('2d');

    p1Sumo = { x: 320, y: 225, r: 20, color: '#e74c3c', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };
    p2Sumo = { x: 480, y: 225, r: 20, color: '#3498db', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };
    ringRadius = 200;
    juegoSumoActivo = true;

    bucleSumo();
}

function bucleSumo() {
    if (!juegoSumoActivo) return;

    // Reducir tamaño del ring
    ringRadius = Math.max(70, ringRadius - 0.04);

    // Movimiento P1 (WASD + Espacio)
    actualizarSumo(p1Sumo, 'w', 's', 'a', 'd', ' ');
    // Movimiento P2 (Flechas + Enter)
    actualizarSumo(p2Sumo, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter');

    // Colisión física entre jugadores
    let dist = Math.hypot(p2Sumo.x - p1Sumo.x, p2Sumo.y - p1Sumo.y);
    if (dist < p1Sumo.r + p2Sumo.r) {
        let angle = Math.atan2(p2Sumo.y - p1Sumo.y, p2Sumo.x - p1Sumo.x);
        let fuerza1 = Math.hypot(p1Sumo.vx, p1Sumo.vy) + 2;
        let fuerza2 = Math.hypot(p2Sumo.vx, p2Sumo.vy) + 2;

        p1Sumo.vx -= Math.cos(angle) * fuerza2;
        p1Sumo.vy -= Math.sin(angle) * fuerza2;
        p2Sumo.vx += Math.cos(angle) * fuerza1;
        p2Sumo.vy += Math.sin(angle) * fuerza1;
    }

    // Comprobar Caída del Ring
    let distP1 = Math.hypot(p1Sumo.x - ringCenterX, p1Sumo.y - ringCenterY);
    let distP2 = Math.hypot(p2Sumo.x - ringCenterX, p2Sumo.y - ringCenterY);

    if (distP1 > ringRadius || distP2 > ringRadius) {
        juegoSumoActivo = false;
        let esGanadorP1 = distP2 > ringRadius;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre}!` : "¡Ganó Jugador 2!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 120 : 30, texto);
        return;
    }

    dibujarSumo();
    animFrameSumo = requestAnimationFrame(bucleSumo);
}

function actualizarSumo(p, up, down, left, right, dashKey) {
    let dx = 0, dy = 0;
    if (keys[up]) dy -= 1;
    if (keys[down]) dy += 1;
    if (keys[left]) dx -= 1;
    if (keys[right]) dx += 1;

    if (p.cooldownDash > 0) p.cooldownDash--;

    // Dash
    if (keys[dashKey] && p.cooldownDash === 0 && (dx !== 0 || dy !== 0)) {
        p.vx = dx * 9;
        p.vy = dy * 9;
        p.cooldownDash = 40;
    } else {
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += dx * p.speed + p.vx;
        p.y += dy * p.speed + p.vy;
    }
}

function dibujarSumo() {
    ctxSumo.fillStyle = '#2c3e50';
    ctxSumo.fillRect(0, 0, canvasSumo.width, canvasSumo.height);

    // Dohyo (Ring)
    ctxSumo.fillStyle = '#e67e22';
    ctxSumo.beginPath();
    ctxSumo.arc(ringCenterX, ringCenterY, ringRadius, 0, Math.PI * 2);
    ctxSumo.fill();
    ctxSumo.lineWidth = 5;
    ctxSumo.strokeStyle = '#ffffff';
    ctxSumo.stroke();

    // Jugadores
    [p1Sumo, p2Sumo].forEach((p, i) => {
        ctxSumo.fillStyle = p.color;
        ctxSumo.beginPath();
        ctxSumo.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxSumo.fill();
        ctxSumo.stroke();
    });
}