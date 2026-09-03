// js/pvp.js
let canvasPVP, ctxPVP;
let juegoPVPActivo = false;
let animFramePVP;
let timerSpawnArma;

// Estado Jugadores
let player1 = { x: 80, y: 225, radius: 16, speed: 3.5, hp: 100, color: '#e74c3c', dirX: 1, dirY: 0, arma: null, cooldown: 0, municion: 0 };
let player2 = { x: 720, y: 225, radius: 16, speed: 3.5, hp: 100, color: '#3498db', dirX: -1, dirY: 0, arma: null, cooldown: 0, municion: 0 };

let proyectiles = [];
let armasEnMapa = [];

// Coberturas en la arena
const obstaculos = [
    { x: 220, y: 100, w: 40, h: 250 },
    { x: 540, y: 100, w: 40, h: 250 },
    { x: 360, y: 200, w: 80, h: 50 }
];

const TIPOS_ARMAS = [
    { id: 'pistol', nombre: 'Pistola', color: '#f1c40f', municion: 12, cooldown: 15, damage: 12, speed: 9 },
    { id: 'shotgun', nombre: 'Escopeta', color: '#e67e22', municion: 5, cooldown: 35, damage: 9, speed: 7 },
    { id: 'rocket', nombre: 'Cohete', color: '#9b59b6', municion: 3, cooldown: 55, damage: 35, speed: 5 }
];

function iniciarMinijuegoPVP() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasPVP = document.getElementById('gameCanvas');
    canvasPVP.height = 450;
    ctxPVP = canvasPVP.getContext('2d');

    // Limpiar temporizadores previo
    clearInterval(timerSpawnArma);

    // Resetear jugadores
    resetPlayerPVP(player1, 80, 225, 1, 0);
    resetPlayerPVP(player2, 720, 225, -1, 0);

    proyectiles = [];
    armasEnMapa = [];
    juegoPVPActivo = false;

    // Controles táctiles
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchPVP();

    iniciarCuentaAtrasPVP();
}

function resetPlayerPVP(p, x, y, dx, dy) {
    p.x = x; p.y = y;
    p.hp = 100;
    p.dirX = dx; p.dirY = dy;
    p.arma = null; p.municion = 0; p.cooldown = 0;
}

function iniciarCuentaAtrasPVP() {
    iniciarCuentaAtras(canvasPVP, () => {
        juegoPVPActivo = true;
        timerSpawnArma = setInterval(spawnArmaAleatoria, 5000);
        spawnArmaAleatoria();
        bucleJuegoPVP();
    });
}

function spawnArmaAleatoria() {
    if (!juegoPVPActivo || armasEnMapa.length >= 3) return;

    const tipo = TIPOS_ARMAS[Math.floor(Math.random() * TIPOS_ARMAS.length)];
    let rx, ry, colisiona;

    do {
        colisiona = false;
        rx = 100 + Math.random() * 600;
        ry = 50 + Math.random() * 350;

        // Evitar dentro de obstáculos
        for (let obs of obstaculos) {
            if (rx > obs.x - 15 && rx < obs.x + obs.w + 15 && ry > obs.y - 15 && ry < obs.y + obs.h + 15) {
                colisiona = true;
                break;
            }
        }
    } while (colisiona);

    armasEnMapa.push({ x: rx, y: ry, tipo: tipo, radius: 12 });
}

function actualizarMovimientoPVP(p, upKeys, downKeys, leftKeys, rightKeys, shootKey) {
    let moveX = 0, moveY = 0;

    if (upKeys.some(k => keys[k])) moveY -= 1;
    if (downKeys.some(k => keys[k])) moveY += 1;
    if (leftKeys.some(k => keys[k])) moveX -= 1;
    if (rightKeys.some(k => keys[k])) moveX += 1;

    // Normalizar dirección
    if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        p.dirX = moveX / len;
        p.dirY = moveY / len;

        let nX = p.x + p.dirX * p.speed;
        let nY = p.y + p.dirY * p.speed;

        // Limites Canvas y colisiones
        if (nX > p.radius && nX < canvasPVP.width - p.radius && !colisionObstaculo(nX, p.y, p.radius)) {
            p.x = nX;
        }
        if (nY > p.radius && nY < canvasPVP.height - p.radius && !colisionObstaculo(p.x, nY, p.radius)) {
            p.y = nY;
        }
    }

    // Recoger Armas
    for (let i = armasEnMapa.length - 1; i >= 0; i--) {
        let armaBox = armasEnMapa[i];
        if (Math.hypot(p.x - armaBox.x, p.y - armaBox.y) < p.radius + armaBox.radius) {
            p.arma = armaBox.tipo;
            p.municion = armaBox.tipo.municion;
            armasEnMapa.splice(i, 1);
        }
    }

    // Cooldown de disparo
    if (p.cooldown > 0) p.cooldown--;

    // Disparar
    if (keys[shootKey] && p.cooldown === 0) {
        dispararArma(p);
    }
}

function dispararArma(p) {
    if (!p.arma) {
        // Disparo básico sin arma
        proyectiles.push({ x: p.x + p.dirX * 20, y: p.y + p.dirY * 20, vx: p.dirX * 7, vy: p.dirY * 7, damage: 6, radius: 4, owner: p, color: '#ffffff' });
        p.cooldown = 20;
        return;
    }

    if (p.arma.id === 'pistol') {
        proyectiles.push({ x: p.x + p.dirX * 20, y: p.y + p.dirY * 20, vx: p.dirX * p.arma.speed, vy: p.dirY * p.arma.speed, damage: p.arma.damage, radius: 5, owner: p, color: p.arma.color });
    } else if (p.arma.id === 'shotgun') {
        // 3 perdigones en abanico
        for (let angleOff of [-0.2, 0, 0.2]) {
            let cos = Math.cos(angleOff), sin = Math.sin(angleOff);
            let vx = (p.dirX * cos - p.dirY * sin) * p.arma.speed;
            let vy = (p.dirX * sin + p.dirY * cos) * p.arma.speed;
            proyectiles.push({ x: p.x + p.dirX * 20, y: p.y + p.dirY * 20, vx: vx, vy: vy, damage: p.arma.damage, radius: 4, owner: p, color: p.arma.color });
        }
    } else if (p.arma.id === 'rocket') {
        proyectiles.push({ x: p.x + p.dirX * 20, y: p.y + p.dirY * 20, vx: p.dirX * p.arma.speed, vy: p.dirY * p.arma.speed, damage: p.arma.damage, radius: 9, owner: p, color: p.arma.color });
    }

    p.municion--;
    p.cooldown = p.arma.cooldown;

    if (p.municion <= 0) p.arma = null;
}

function colisionObstaculo(x, y, r) {
    for (let obs of obstaculos) {
        if (x + r > obs.x && x - r < obs.x + obs.w && y + r > obs.y && y - r < obs.y + obs.h) {
            return true;
        }
    }
    return false;
}

function bucleJuegoPVP() {
    if (!juegoPVPActivo) return;

    // Actualizar P1 (WASD + Espacio)
    actualizarMovimientoPVP(player1, ['w', 'W'], ['s', 'S'], ['a', 'A'], ['d', 'D'], ' ');

    // Actualizar P2 (Flechas + Enter)
    actualizarMovimientoPVP(player2, ['ArrowUp'], ['ArrowDown'], ['ArrowLeft'], ['ArrowRight'], 'Enter');

    // Actualizar Proyectiles (recorrido inverso para evitar saltos al eliminar)
    for (let i = proyectiles.length - 1; i >= 0; i--) {
        let proj = proyectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;

        // Fuera de limites o colisión muro
        if (proj.x < 0 || proj.x > canvasPVP.width || proj.y < 0 || proj.y > canvasPVP.height || colisionObstaculo(proj.x, proj.y, proj.radius)) {
            proyectiles.splice(i, 1);
            continue;
        }

        // Colisión con jugadores
        let objetivo = (proj.owner === player1) ? player2 : player1;
        if (Math.hypot(proj.x - objetivo.x, proj.y - objetivo.y) < proj.radius + objetivo.radius) {
            objetivo.hp -= proj.damage;
            proyectiles.splice(i, 1);

            if (objetivo.hp <= 0) {
                objetivo.hp = 0;
                juegoPVPActivo = false;
                verificarGanadorPVP();
                return;
            }
        }
    }

    dibujarEscenaPVP();
    if (juegoPVPActivo) animFrameGlobal = animFramePVP = requestAnimationFrame(bucleJuegoPVP);
}

function dibujarEscenaPVP() {
    ctxPVP.clearRect(0, 0, canvasPVP.width, canvasPVP.height);

    // Fondo Arena
    ctxPVP.fillStyle = '#2c3e50';
    ctxPVP.fillRect(0, 0, canvasPVP.width, canvasPVP.height);

    // Coberturas / Muros
    ctxPVP.fillStyle = '#7f8c8d';
    ctxPVP.strokeStyle = '#95a5a6';
    ctxPVP.lineWidth = 3;
    obstaculos.forEach(obs => {
        ctxPVP.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctxPVP.strokeRect(obs.x, obs.y, obs.w, obs.h);
    });

    // Dibujar Armas tiradas
    armasEnMapa.forEach(box => {
        ctxPVP.fillStyle = box.tipo.color;
        ctxPVP.fillRect(box.x - 10, box.y - 10, 20, 20);
        ctxPVP.fillStyle = '#ffffff';
        ctxPVP.font = 'bold 10px sans-serif';
        ctxPVP.fillText("🔫", box.x - 6, box.y + 4);
    });

    // Dibujar Proyectiles
    proyectiles.forEach(proj => {
        ctxPVP.fillStyle = proj.color;
        ctxPVP.beginPath();
        ctxPVP.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctxPVP.fill();
    });

    // Dibujar Jugadores
    dibujarJugadorPVP(player1, "P1");
    dibujarJugadorPVP(player2, "P2");

    // HUD (Barras de Vida)
    dibujarHUD(player1, 20, 20, "P1 (Rojo)");
    dibujarHUD(player2, 560, 20, "P2 (Azul)");
}

function dibujarJugadorPVP(p, label) {
    ctxPVP.fillStyle = p.color;
    ctxPVP.beginPath();
    ctxPVP.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctxPVP.fill();

    // Cañón indicando dirección
    ctxPVP.strokeStyle = '#ffffff';
    ctxPVP.lineWidth = 4;
    ctxPVP.beginPath();
    ctxPVP.moveTo(p.x, p.y);
    ctxPVP.lineTo(p.x + p.dirX * 24, p.y + p.dirY * 24);
    ctxPVP.stroke();

    ctxPVP.fillStyle = '#ffffff';
    ctxPVP.font = 'bold 12px sans-serif';
    ctxPVP.fillText(label, p.x - 7, p.y - 20);
}

function dibujarHUD(p, x, y, label) {
    ctxPVP.fillStyle = '#ffffff';
    ctxPVP.font = 'bold 14px sans-serif';
    ctxPVP.fillText(`${label} - ${p.arma ? p.arma.nombre + ' (' + p.municion + ')' : 'Puño'}`, x, y);

    // Barra fondo
    ctxPVP.fillStyle = '#c0392b';
    ctxPVP.fillRect(x, y + 8, 220, 16);

    // Barra Vida
    ctxPVP.fillStyle = '#2ecc71';
    ctxPVP.fillRect(x, y + 8, Math.max(0, (p.hp / 100)) * 220, 16);
}

function configurarBotonesTouchPVP() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P1 (Rojo)</p>
                <button class="touch-btn p1-btn" ontouchstart="keys[' ']=true" ontouchend="keys[' ']=false">🔥 DISPARAR</button>
            </div>
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P2 (Azul)</p>
                <button class="touch-btn p2-btn" ontouchstart="keys['Enter']=true" ontouchend="keys['Enter']=false">🔥 DISPARAR</button>
            </div>
        </div>
    `;
}

function verificarGanadorPVP() {
    clearInterval(timerSpawnArma);
    cancelAnimationFrame(animFramePVP);

    let esGanadorP1 = player1.hp > 0;
    let ganadorTexto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (P1)!` : "¡Ganó Jugador 2!";
    let puntosOtorgados = esGanadorP1 ? 150 : 30;

    guardarResultadoServidor(esGanadorP1 ? 1 : 0, puntosOtorgados, ganadorTexto);
}