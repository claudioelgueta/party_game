// js/sumo.js
let canvasSumo, ctxSumo;
let juegoSumoActivo = false;
let animFrameSumo;

let ringRadius = 200;
const ringCenterX = 400;
const ringCenterY = 225;

let p1Sumo = { x: 320, y: 225, r: 20, color: '#e74c3c', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };
let p2Sumo = { x: 480, y: 225, r: 20, color: '#3498db', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };

function iniciarMinijuegoSumo() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasSumo = document.getElementById('gameCanvas');
    canvasSumo.height = 450;
    ctxSumo = canvasSumo.getContext('2d');

    if (animFrameSumo) cancelAnimationFrame(animFrameSumo);

    // Resetear posiciones y valores
    p1Sumo = { x: 320, y: 225, r: 20, color: '#e74c3c', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };
    p2Sumo = { x: 480, y: 225, r: 20, color: '#3498db', vx: 0, vy: 0, speed: 3.5, cooldownDash: 0 };
    ringRadius = 200;

    // Configurar controles touch para móviles
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchSumo();

    juegoSumoActivo = true;
    bucleSumo();
}

function bucleSumo() {
    if (!juegoSumoActivo) return;

    // Reducir progresivamente el tamaño del ring (zona segura)
    ringRadius = Math.max(70, ringRadius - 0.04);

    // Movimiento P1 (WASD + Espacio)
    actualizarSumo(p1Sumo, ['w', 'W'], ['s', 'S'], ['a', 'A'], ['d', 'D'], [' ']);
    
    // Movimiento P2 (Flechas + Enter)
    actualizarSumo(p2Sumo, ['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight'], ['Enter']);

    // Colisión física entre los dos luchadores de sumo
    let dist = Math.hypot(p2Sumo.x - p1Sumo.x, p2Sumo.y - p1Sumo.y);
    if (dist < p1Sumo.r + p2Sumo.r) {
        let angle = Math.atan2(p2Sumo.y - p1Sumo.y, p2Sumo.x - p1Sumo.x);
        let fuerza1 = Math.hypot(p1Sumo.vx, p1Sumo.vy) + 2.5;
        let fuerza2 = Math.hypot(p2Sumo.vx, p2Sumo.vy) + 2.5;

        // Repulsión basada en la fuerza de empuje/dash de cada uno
        p1Sumo.vx -= Math.cos(angle) * fuerza2;
        p1Sumo.vy -= Math.sin(angle) * fuerza2;
        p2Sumo.vx += Math.cos(angle) * fuerza1;
        p2Sumo.vy += Math.sin(angle) * fuerza1;
    }

    // Comprobar si alguno salió del Dohyo (Ring)
    let distP1 = Math.hypot(p1Sumo.x - ringCenterX, p1Sumo.y - ringCenterY);
    let distP2 = Math.hypot(p2Sumo.x - ringCenterX, p2Sumo.y - ringCenterY);

    if (distP1 > ringRadius || distP2 > ringRadius) {
        juegoSumoActivo = false;
        cancelAnimationFrame(animFrameSumo);

        let esGanadorP1 = distP1 <= ringRadius && distP2 > ringRadius;
        if (distP1 > ringRadius && distP2 > ringRadius) {
            // Si ambos cayeron a la vez, gana el que quedó más cerca del centro
            esGanadorP1 = distP1 < distP2;
        }

        let texto = esGanadorP1 
            ? `¡Ganó ${jugadorActual.nombre} (P1)! Sacó a P2 del Dohyo.` 
            : "¡Ganó Jugador 2! Sacó a P1 del Dohyo.";
        
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 120 : 30, texto);
        return;
    }

    dibujarSumo();
    if (juegoSumoActivo) animFrameGlobal = animFrameSumo = requestAnimationFrame(bucleSumo);
}

function actualizarSumo(p, upKeys, downKeys, leftKeys, rightKeys, dashKeys) {
    let dx = 0, dy = 0;

    if (upKeys.some(k => keys[k])) dy -= 1;
    if (downKeys.some(k => keys[k])) dy += 1;
    if (leftKeys.some(k => keys[k])) dx -= 1;
    if (rightKeys.some(k => keys[k])) dx += 1;

    if (p.cooldownDash > 0) p.cooldownDash--;

    // Activar Dash / Empujón
    if (dashKeys.some(k => keys[k]) && p.cooldownDash === 0 && (dx !== 0 || dy !== 0)) {
        p.vx = dx * 10;
        p.vy = dy * 10;
        p.cooldownDash = 40;
    } else {
        // Fricción / desaceleración progresiva
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += dx * p.speed + p.vx;
        p.y += dy * p.speed + p.vy;
    }

    // Límites del canvas
    p.x = Math.max(p.r, Math.min(canvasSumo.width - p.r, p.x));
    p.y = Math.max(p.r, Math.min(canvasSumo.height - p.r, p.y));
}

function dibujarSumo() {
    ctxSumo.clearRect(0, 0, canvasSumo.width, canvasSumo.height);

    // Fondo
    ctxSumo.fillStyle = '#1e293b';
    ctxSumo.fillRect(0, 0, canvasSumo.width, canvasSumo.height);

    // Dohyo (Ring de Sumo)
    ctxSumo.fillStyle = '#d97706';
    ctxSumo.beginPath();
    ctxSumo.arc(ringCenterX, ringCenterY, ringRadius, 0, Math.PI * 2);
    ctxSumo.fill();

    // Borde exterior del Dohyo
    ctxSumo.lineWidth = 6;
    ctxSumo.strokeStyle = '#fef08a';
    ctxSumo.stroke();

    // Líneas centrales del ring
    ctxSumo.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctxSumo.lineWidth = 4;
    ctxSumo.beginPath();
    ctxSumo.moveTo(ringCenterX - 25, ringCenterY - 30);
    ctxSumo.lineTo(ringCenterX - 25, ringCenterY + 30);
    ctxSumo.moveTo(ringCenterX + 25, ringCenterY - 30);
    ctxSumo.lineTo(ringCenterX + 25, ringCenterY + 30);
    ctxSumo.stroke();

    // Dibujar Jugadores
    [p1Sumo, p2Sumo].forEach((p, idx) => {
        // Sombra
        ctxSumo.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctxSumo.beginPath();
        ctxSumo.arc(p.x + 3, p.y + 4, p.r, 0, Math.PI * 2);
        ctxSumo.fill();

        // Cuerpo
        ctxSumo.fillStyle = p.color;
        ctxSumo.beginPath();
        ctxSumo.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxSumo.fill();

        ctxSumo.lineWidth = 3;
        ctxSumo.strokeStyle = '#ffffff';
        ctxSumo.stroke();

        // Indicador de cooldown para el Dash
        if (p.cooldownDash > 0) {
            ctxSumo.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctxSumo.lineWidth = 3;
            ctxSumo.beginPath();
            let pct = p.cooldownDash / 40;
            ctxSumo.arc(p.x, p.y, p.r + 5, -Math.PI / 2, (-Math.PI / 2) + (pct * Math.PI * 2));
            ctxSumo.stroke();
        }

        // Etiqueta P1 / P2
        ctxSumo.fillStyle = '#ffffff';
        ctxSumo.font = 'bold 12px sans-serif';
        ctxSumo.fillText(idx === 0 ? "P1" : "P2", p.x - 7, p.y + 4);
    });

    // Información de controles / HUD
    ctxSumo.font = 'bold 13px sans-serif';
    ctxSumo.fillStyle = '#e2e8f0';
    ctxSumo.fillText('P1: WASD | Espacio = Dash', 20, 25);
    ctxSumo.fillText('P2: Flechas | Enter = Dash', canvasSumo.width - 190, 25);
}

function configurarBotonesTouchSumo() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P1 (Rojo)</p>
                <button class="touch-btn p1-btn" ontouchstart="keys[' ']=true" ontouchend="keys[' ']=false">💨 DASH</button>
            </div>
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P2 (Azul)</p>
                <button class="touch-btn p2-btn" ontouchstart="keys['Enter']=true" ontouchend="keys['Enter']=false">💨 DASH</button>
            </div>
        </div>
    `;
}