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

// Pelota en posición inicial más baja (y = 210) para ser alcanzable con el salto
let balonVoley = { x: 400, y: 210, r: 14, vx: 0, vy: 0, enEspera: true };

const RED_VOLEY = { x: 395, width: 10, top: 230, bottom: 450 };

function iniciarMinijuegoVoleibol() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasVoley = document.getElementById('gameCanvas');
    canvasVoley.height = 450;
    ctxVoley = canvasVoley.getContext('2d');

    p1Voley.score = 0;
    p2Voley.score = 0;

    // Configurar controles touch para móviles
    const modoControl = obtenerTipoControl ? obtenerTipoControl() : 'desktop';
    const touchControls = document.getElementById('touchControls');
    if (touchControls) {
        touchControls.style.display = (modoControl === 'mobile') ? 'flex' : 'none';
        configurarBotonesTouchVoley();
    }

    resetearPuntoVoley();
    iniciarCuentaAtras(canvasVoley, () => {
        juegoVoleyActivo = true;
        bucleVoleibol();
    });
}

function resetearPuntoVoley() {
    p1Voley.x = 180; p1Voley.y = 380; p1Voley.vy = 0; p1Voley.enSuelo = true;
    p2Voley.x = 620; p2Voley.y = 380; p2Voley.vy = 0; p2Voley.enSuelo = true;

    // Balón suspendido sobre la red a una altura alcanzable con un salto
    balonVoley.x = 400;
    balonVoley.y = 210;
    balonVoley.vx = 0;
    balonVoley.vy = 0;
    balonVoley.enEspera = true;
}

function bucleVoleibol() {
    if (!juegoVoleyActivo) return;

    actualizarJugadorVoley(p1Voley, ['w', 'W'], ['a', 'A'], ['d', 'D'], 20, 375);
    actualizarJugadorVoley(p2Voley, ['ArrowUp'], ['ArrowLeft'], ['ArrowRight'], 425, 780);

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

    // Colisión Balón con Jugadores
    [
        { p: p1Voley, remateKeys: [' '] },
        { p: p2Voley, remateKeys: ['Enter'] }
    ].forEach(item => {
        let jug = item.p;
        let dist = Math.hypot(balonVoley.x - jug.x, balonVoley.y - jug.y);
        if (dist < balonVoley.r + jug.r) {
            if (balonVoley.enEspera) {
                balonVoley.enEspera = false;
            }
            let angle = Math.atan2(balonVoley.y - jug.y, balonVoley.x - jug.x);
            let esRemate = item.remateKeys.some(k => keys[k]);
            let fuerza = esRemate ? 9.5 : 6.5;
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

    // Victoria tras ganar los puntos definidos
    if (p1Voley.score >= PUNTOS_GANAR_VOLEY || p2Voley.score >= PUNTOS_GANAR_VOLEY) {
        juegoVoleyActivo = false;
        if (animFrameVoley) cancelAnimationFrame(animFrameVoley);

        let esGanadorP1 = p1Voley.score >= PUNTOS_GANAR_VOLEY;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (3 Rondas)!` : "¡Ganó Jugador 2 (3 Rondas)!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 150 : 30, texto, esGanadorP1 ? 'P1' : 'P2');
        return;
    }

    dibujarEscenaVoleibol();
    if (juegoVoleyActivo) animFrameGlobal = animFrameVoley = requestAnimationFrame(bucleVoleibol);
}

function actualizarJugadorVoley(p, jumpKeys, leftKeys, rightKeys, minX, maxX) {
    if (leftKeys.some(k => keys[k])) p.x = Math.max(minX, p.x - 4.5);
    if (rightKeys.some(k => keys[k])) p.x = Math.min(maxX, p.x + 4.5);

    if (jumpKeys.some(k => keys[k]) && p.enSuelo) {
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

    // Suelo
    ctxVoley.fillStyle = '#f59e0b';
    ctxVoley.fillRect(0, 400, canvasVoley.width, 50);

    // Red
    ctxVoley.fillStyle = '#ffffff';
    ctxVoley.fillRect(RED_VOLEY.x, RED_VOLEY.top, RED_VOLEY.width, RED_VOLEY.bottom - RED_VOLEY.top);

    // Jugadores
    [p1Voley, p2Voley].forEach(p => {
        ctxVoley.fillStyle = p.color;
        ctxVoley.beginPath(); 
        ctxVoley.arc(p.x, p.y, p.r, 0, Math.PI * 2); 
        ctxVoley.fill();
        ctxVoxelStroke(ctxVoley, p.x, p.y, p.r);
    });

    // Balón
    ctxVoley.fillStyle = '#facc15';
    ctxVoley.beginPath(); 
    ctxVoley.arc(balonVoley.x, balonVoley.y, balonVoley.r, 0, Math.PI * 2); 
    ctxVoley.fill();
    ctxVoley.strokeStyle = '#0284c7'; 
    ctxVoley.lineWidth = 2; 
    ctxVoley.stroke();

    // Mensaje inicial
    if (balonVoley.enEspera) {
        ctxVoley.fillStyle = '#facc15';
        ctxVoley.font = 'bold 15px sans-serif';
        ctxVoley.textAlign = 'center';
        ctxVoley.fillText('¡SALTA Y GOLPEA EL BALÓN PARA SAQUER!', 400, 140);
        ctxVoley.textAlign = 'left';
    }

    // Marcador
    ctxVoley.fillStyle = '#ffffff';
    ctxVoley.font = 'bold 20px sans-serif';
    ctxVoley.fillText(`P1: ${p1Voley.score}/${PUNTOS_GANAR_VOLEY}`, 50, 40);
    ctxVoley.fillText(`P2: ${p2Voley.score}/${PUNTOS_GANAR_VOLEY}`, canvasVoley.width - 120, 40);
}

function ctxVoxelStroke(ctx, x, y, r) {
    ctx.strokeStyle = '#ffffff'; 
    ctx.lineWidth = 2; 
    ctx.stroke();
}

function configurarBotonesTouchVoley() {
    const touchPanel = document.getElementById('touchControls');
    if (!touchPanel) return;
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P1 (Rojo)</p>
                <button class="touch-btn" ontouchstart="keys['w']=true" ontouchend="keys['w']=false">🦘 SALTO</button>
                <button class="touch-btn" ontouchstart="keys[' ']=true" ontouchend="keys[' ']=false">💥 REMATE</button>
            </div>
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P2 (Azul)</p>
                <button class="touch-btn" ontouchstart="keys['ArrowUp']=true" ontouchend="keys['ArrowUp']=false">🦘 SALTO</button>
                <button class="touch-btn" ontouchstart="keys['Enter']=true" ontouchend="keys['Enter']=false">💥 REMATE</button>
            </div>
        </div>
    `;
}