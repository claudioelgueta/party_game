// js/robarbase.js
let canvasRobo, ctxRobo;
let juegoRoboActivo = false;
let animFrameRobo;

const VELOCIDAD_BASE = 3.3;
const VELOCIDAD_CON_CARGA = 2.4;
const TIEMPO_STUN_FRAMES = 90; // 1.5 segundos
const TOTAL_BRAINROTS = 4;     // 4 por base

let p1Robo = { x: 100, y: 225, r: 18, color: '#e74c3c', brainrot: null, score: 0, stun: 0, cooldown: 0 };
let p2Robo = { x: 700, y: 225, r: 18, color: '#3498db', brainrot: null, score: 0, stun: 0, cooldown: 0 };

const NOMBRES_BRAINROTS = ["Tung Tung", "Tralalero", "Capuchina", "Skibidi"];

let brainrotsP1 = [];
let brainrotsP2 = [];

function iniciarMinijuegoRobarBase() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasRobo = document.getElementById('gameCanvas');
    canvasRobo.height = 450;
    ctxRobo = canvasRobo.getContext('2d');

    if (animFrameRobo) cancelAnimationFrame(animFrameRobo);

    p1Robo.score = 0;
    p2Robo.score = 0;

    inicializarBases();
    resetearPosicionesRobo();

    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchRobarBase();

    iniciarCuentaAtras(canvasRobo, () => {
        juegoRoboActivo = true;
        bucleRobarBase();
    });
}

function inicializarBases() {
    brainrotsP1 = [];
    brainrotsP2 = [];

    // Colocar 4 Brainrots alineados verticalmente en cada base
    for (let i = 0; i < TOTAL_BRAINROTS; i++) {
        brainrotsP1.push({
            id: i,
            tipo: i,
            nombre: NOMBRES_BRAINROTS[i],
            x: 50,
            y: 120 + i * 70,
            robado: false,
            enBase: true
        });

        brainrotsP2.push({
            id: i,
            tipo: i,
            nombre: NOMBRES_BRAINROTS[i],
            x: 750,
            y: 120 + i * 70,
            robado: false,
            enBase: true
        });
    }
}

function resetearPosicionesRobo() {
    p1Robo.x = 100; p1Robo.y = 225; p1Robo.brainrot = null; p1Robo.stun = 0; p1Robo.cooldown = 0;
    p2Robo.x = 700; p2Robo.y = 225; p2Robo.brainrot = null; p2Robo.stun = 0; p2Robo.cooldown = 0;
}

function bucleRobarBase() {
    if (!juegoRoboActivo) return;

    if (p1Robo.stun > 0) p1Robo.stun--;
    if (p2Robo.stun > 0) p2Robo.stun--;
    if (p1Robo.cooldown > 0) p1Robo.cooldown--;
    if (p2Robo.cooldown > 0) p2Robo.cooldown--;

    if (p1Robo.stun === 0) moverJugadorRobo(p1Robo, ['w', 'W'], ['s', 'S'], ['a', 'A'], ['d', 'D']);
    if (p2Robo.stun === 0) moverJugadorRobo(p2Robo, ['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight']);

    // Ataque/Golpe si NO lleva objeto (P1: Espacio, P2: Enter)
    if (keys[' '] && !p1Robo.brainrot && p1Robo.stun === 0 && p1Robo.cooldown === 0) {
        ejecutarGolpe(p1Robo, p2Robo);
        p1Robo.cooldown = 25;
    }
    if (keys['Enter'] && !p2Robo.brainrot && p2Robo.stun === 0 && p2Robo.cooldown === 0) {
        ejecutarGolpe(p2Robo, p1Robo);
        p2Robo.cooldown = 25;
    }

    // Interacción robar
    verificarRobo(p1Robo, brainrotsP2);
    verificarRobo(p2Robo, brainrotsP1);

    // Entregar en base propia
    if (p1Robo.brainrot && p1Robo.x < 110) {
        p1Robo.score++;
        p1Robo.brainrot = null;
    }
    if (p2Robo.brainrot && p2Robo.x > 690) {
        p2Robo.score++;
        p2Robo.brainrot = null;
    }

    // Condición de derrota: Pierde el jugador que se queda con 0 Brainrots en su base
    if (p1Robo.score >= TOTAL_BRAINROTS || p2Robo.score >= TOTAL_BRAINROTS) {
        juegoRoboActivo = false;
        cancelAnimationFrame(animFrameRobo);
        let esGanadorP1 = p1Robo.score >= TOTAL_BRAINROTS;
        let texto = esGanadorP1 
            ? `¡Ganó ${jugadorActual.nombre}! Dejó a P2 sin Brainrots.` 
            : "¡Ganó Jugador 2! Dejó a P1 sin Brainrots.";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 160 : 35, texto);
        return;
    }

    dibujarEscenaRobarBase();
    if (juegoRoboActivo) animFrameGlobal = animFrameRobo = requestAnimationFrame(bucleRobarBase);
}

function moverJugadorRobo(p, upKeys, downKeys, leftKeys, rightKeys) {
    let speed = p.brainrot ? VELOCIDAD_CON_CARGA : VELOCIDAD_BASE;

    if (upKeys.some(k => keys[k])) p.y = Math.max(p.r, p.y - speed);
    if (downKeys.some(k => keys[k])) p.y = Math.min(canvasRobo.height - p.r, p.y + speed);
    if (leftKeys.some(k => keys[k])) p.x = Math.max(p.r, p.x - speed);
    if (rightKeys.some(k => keys[k])) p.x = Math.min(canvasRobo.width - p.r, p.x + speed);
}

function ejecutarGolpe(atacante, objetivo) {
    let dist = Math.hypot(atacante.x - objetivo.x, atacante.y - objetivo.y);
    
    if (dist < atacante.r + objetivo.r + 25) {
        objetivo.stun = TIEMPO_STUN_FRAMES;

        if (objetivo.brainrot) {
            objetivo.brainrot.robado = false;
            objetivo.brainrot.enBase = true;
            objetivo.brainrot = null;
        }
    }
}

function verificarRobo(jugador, listaBrainrotsEnemigos) {
    if (jugador.brainrot) return;

    listaBrainrotsEnemigos.forEach(item => {
        if (item.enBase && !item.robado) {
            let dist = Math.hypot(jugador.x - item.x, jugador.y - item.y);
            if (dist < jugador.r + 15) {
                item.enBase = false;
                item.robado = true;
                jugador.brainrot = item;
            }
        }
    });
}

function dibujarEscenaRobarBase() {
    ctxRobo.clearRect(0, 0, canvasRobo.width, canvasRobo.height);

    // Fondo
    ctxRobo.fillStyle = '#0f172a';
    ctxRobo.fillRect(0, 0, canvasRobo.width, canvasRobo.height);

    ctxRobo.fillStyle = 'rgba(231, 76, 60, 0.12)';
    ctxRobo.fillRect(0, 0, 110, 450);

    ctxRobo.fillStyle = 'rgba(52, 152, 219, 0.12)';
    ctxRobo.fillRect(690, 0, 110, 450);

    ctxRobo.strokeStyle = '#334155';
    ctxRobo.setLineDash([8, 8]);
    ctxRobo.lineWidth = 2;
    ctxRobo.beginPath(); ctxRobo.moveTo(400, 0); ctxRobo.lineTo(400, 450); ctxRobo.stroke();
    ctxRobo.setLineDash([]);

    // Dibujar Brainrots en bases
    [...brainrotsP1, ...brainrotsP2].forEach(item => {
        if (item.enBase) {
            dibujarBrainrot(ctxRobo, item.tipo, item.x, item.y);
        }
    });

    // Dibujar Jugadores
    [p1Robo, p2Robo].forEach((p) => {
        ctxRobo.save();
        
        if (p.stun > 0) {
            ctxRobo.globalAlpha = 0.5;
            ctxRobo.fillStyle = '#facc15';
            ctxRobo.font = 'bold 14px sans-serif';
            ctxRobo.fillText('💫 STUN', p.x - 22, p.y - p.r - 8);
        }

        ctxRobo.fillStyle = p.color;
        ctxRobo.beginPath();
        ctxRobo.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxRobo.fill();
        ctxRobo.strokeStyle = '#ffffff';
        ctxRobo.lineWidth = 2;
        ctxRobo.stroke();

        ctxRobo.restore();

        if (p.brainrot) {
            dibujarBrainrot(ctxRobo, p.brainrot.tipo, p.x, p.y - 25);
        }
    });

    // Contador de Brainrots restantes en cada base
    let restantesP1 = TOTAL_BRAINROTS - p2Robo.score;
    let restantesP2 = TOTAL_BRAINROTS - p1Robo.score;

    ctxRobo.fillStyle = '#ffffff';
    ctxRobo.font = 'bold 18px sans-serif';
    ctxRobo.fillText(`P1 Le quedan: ${restantesP1} 🗿`, 20, 30);
    ctxRobo.fillText(`P2 Le quedan: ${restantesP2} 🗿`, 600, 30);

    ctxRobo.font = '11px sans-serif';
    ctxRobo.fillStyle = '#94a3b8';
    ctxRobo.fillText('P1: WASD | Espacio = Golpear', 20, 435);
    ctxRobo.fillText('P2: Flechas | Enter = Golpear', 600, 435);
}

function dibujarBrainrot(ctx, tipo, x, y) {
    ctx.save();
    ctx.translate(x, y);

    switch (tipo) {
        case 0: // Tung Tung Sahur
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-10, -8, 20, 16);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
            break;

        case 1: // Tralalero Tralala
            ctx.fillStyle = '#0284c7';
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-8, 5, 16, 5);
            break;

        case 2: // Ballerina Capuchina
            ctx.fillStyle = '#a16207';
            ctx.beginPath(); ctx.arc(0, -3, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ec4899';
            ctx.beginPath(); ctx.arc(0, 5, 10, 0, Math.PI); ctx.fill();
            break;

        case 3: // Skibidi
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-8, -4, 16, 14);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-10, -10, 20, 7);
            ctx.fillStyle = '#f87171';
            ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI * 2); ctx.fill();
            break;
    }

    ctx.restore();
}

function configurarBotonesTouchRobarBase() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P1 (Rojo)</p>
                <button class="touch-btn p1-btn" ontouchstart="keys[' ']=true" ontouchend="keys[' ']=false">🥊 GOLPEAR</button>
            </div>
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P2 (Azul)</p>
                <button class="touch-btn p2-btn" ontouchstart="keys['Enter']=true" ontouchend="keys['Enter']=false">🥊 GOLPEAR</button>
            </div>
        </div>
    `;
}