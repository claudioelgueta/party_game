function bucleFutbol() {
    if (!juegoFutbolActivo) return;
    // ... resto del código
}

let canvasFutbol, ctxFutbol;
let juegoFutbolActivo = false;
let animFrameFutbol;

let player1Futbol = { x: 150, y: 225, r: 18, color: '#e74c3c', vx: 0, vy: 0, speed: 4 };
let player2Futbol = { x: 650, y: 225, r: 18, color: '#3498db', vx: 0, vy: 0, speed: 4 };
let balon = { x: 400, y: 225, r: 12, vx: 0, vy: 0, friccion: 0.97 };

let golesP1 = 0;
let golesP2 = 0;
const GOLES_PARA_GANAR = 3;

// Área de las porterías
const PORTERIA = { top: 155, bottom: 295, ancho: 20 };

function iniciarMinijuegoFutbol() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasFutbol = document.getElementById('gameCanvas');
    canvasFutbol.height = 450;
    ctxFutbol = canvasFutbol.getContext('2d');

    golesP1 = 0;
    golesP2 = 0;
    juegoFutbolActivo = false;

    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchFutbol();

    resetearPosicionesFutbol();
    iniciarCuentaAtrasFutbol();
}

function resetearPosicionesFutbol() {
    player1Futbol.x = 150; player1Futbol.y = 225;
    player2Futbol.x = 650; player2Futbol.y = 225;
    balon.x = 400; balon.y = 225; balon.vx = 0; balon.vy = 0;
}

function iniciarCuentaAtrasFutbol() {
    let cuenta = 3;
    const overlay = document.getElementById('mensajeJuego');
    overlay.style.display = 'flex';

    dibujarEscenaFutbol();

    const timer = setInterval(() => {
        if (cuenta > 0) {
            overlay.innerText = cuenta;
            cuenta--;
        } else if (cuenta === 0) {
            overlay.innerText = "¡A ANOTAR!";
            cuenta--;
        } else {
            clearInterval(timer);
            overlay.style.display = 'none';
            juegoFutbolActivo = true;
            bucleJuegoFutbol();
        }
    }, 800);
}

function moverJugadorFutbol(p, upKey1, upKey2, downKey1, downKey2, leftKey1, leftKey2, rightKey1, rightKey2) {
    let dx = 0, dy = 0;
    if (keys[upKey1] || keys[upKey2]) dy -= 1;
    if (keys[downKey1] || keys[downKey2]) dy += 1;
    if (keys[leftKey1] || keys[leftKey2]) dx -= 1;
    if (keys[rightKey1] || keys[rightKey2]) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
    }

    p.x = Math.max(p.r + PORTERIA.ancho, Math.min(canvasFutbol.width - p.r - PORTERIA.ancho, p.x + dx * p.speed));
    p.y = Math.max(p.r, Math.min(canvasFutbol.height - p.r, p.y + dy * p.speed));
}

function actualizarFisicasBalon() {
    balon.x += balon.vx;
    balon.y += balon.vy;
    balon.vx *= balon.friccion;
    balon.vy *= balon.friccion;

    // Colisión límites Superior e Inferior
    if (balon.y - balon.r <= 0) { balon.y = balon.r; balon.vy *= -1; }
    if (balon.y + balon.r >= canvasFutbol.height) { balon.y = canvasFutbol.height - balon.r; balon.vy *= -1; }

    // Colisión Paredes Laterales
    if (balon.y < PORTERIA.top || balon.y > PORTERIA.bottom) {
        if (balon.x - balon.r <= PORTERIA.ancho) { balon.x = PORTERIA.ancho + balon.r; balon.vx *= -1; }
        if (balon.x + balon.r >= canvasFutbol.width - PORTERIA.ancho) { balon.x = canvasFutbol.width - PORTERIA.ancho - balon.r; balon.vx *= -1; }
    } else {
        // Gol
        if (balon.x < 0) {
            golesP2++;
            verificarGolOVictoria("¡Gol de Jugador 2!");
        } else if (balon.x > canvasFutbol.width) {
            golesP1++;
            verificarGolOVictoria(`¡Gol de ${jugadorActual.nombre}!`);
        }
    }

    // Colisión y Disparo: P1 (Espacio) / P2 (Enter)
    const datosJugadores = [
        { player: player1Futbol, shootKey: ' ' },
        { player: player2Futbol, shootKey: 'Enter' }
    ];

    datosJugadores.forEach(item => {
        let p = item.player;
        let dist = Math.hypot(balon.x - p.x, balon.y - p.y);
        let rangoContacto = p.r + balon.r + 6;

        if (dist <= rangoContacto) {
            let angle = Math.atan2(balon.y - p.y, balon.x - p.x);
            let presionaDisparo = keys[item.shootKey];

            // Empuje suave (2.6) al tocarla / Disparo fuerte (11.5) con Espacio o Enter
            let fuerza = presionaDisparo ? 11.5 : 2.6;

            balon.vx = Math.cos(angle) * fuerza;
            balon.vy = Math.sin(angle) * fuerza;

            // Evitar que el jugador atraviese el balón
            if (dist < p.r + balon.r) {
                let overlap = (p.r + balon.r) - dist;
                balon.x += Math.cos(angle) * overlap;
                balon.y += Math.sin(angle) * overlap;
            }
        }
    });
}

function verificarGolOVictoria(mensaje) {
    juegoFutbolActivo = false;
    cancelAnimationFrame(animFrameFutbol);

    if (golesP1 >= GOLES_PARA_GANAR || golesP2 >= GOLES_PARA_GANAR) {
        let esGanadorP1 = golesP1 >= GOLES_PARA_GANAR;
        let textoFinal = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (P1)!` : "¡Ganó Jugador 2!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 140 : 30, textoFinal);
    } else {
        const overlay = document.getElementById('mensajeJuego');
        overlay.innerText = mensaje;
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.display = 'none';
            resetearPosicionesFutbol();
            juegoFutbolActivo = true;
            bucleJuegoFutbol();
        }, 1800);
    }
}

function bucleJuegoFutbol() {
    if (!juegoFutbolActivo) return;

    moverJugadorFutbol(player1Futbol, 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D');
    moverJugadorFutbol(player2Futbol, 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight');

    actualizarFisicasBalon();
    dibujarEscenaFutbol();

    if (juegoFutbolActivo) animFrameFutbol = requestAnimationFrame(bucleJuegoFutbol);
}

function dibujarEscenaFutbol() {
    ctxFutbol.clearRect(0, 0, canvasFutbol.width, canvasFutbol.height);

    // Césped
    ctxFutbol.fillStyle = '#27ae60';
    ctxFutbol.fillRect(0, 0, canvasFutbol.width, canvasFutbol.height);

    // Cancha
    ctxFutbol.strokeStyle = '#ffffff';
    ctxFutbol.lineWidth = 3;

    ctxFutbol.beginPath();
    ctxFutbol.moveTo(canvasFutbol.width / 2, 0);
    ctxFutbol.lineTo(canvasFutbol.width / 2, canvasFutbol.height);
    ctxFutbol.stroke();

    ctxFutbol.beginPath();
    ctxFutbol.arc(canvasFutbol.width / 2, canvasFutbol.height / 2, 60, 0, Math.PI * 2);
    ctxFutbol.stroke();

    // Porterías
    ctxFutbol.fillStyle = '#ecf0f1';
    ctxFutbol.fillRect(0, PORTERIA.top, PORTERIA.ancho, PORTERIA.bottom - PORTERIA.top);
    ctxFutbol.fillRect(canvasFutbol.width - PORTERIA.ancho, PORTERIA.top, PORTERIA.ancho, PORTERIA.bottom - PORTERIA.top);

    // Jugadores
    [player1Futbol, player2Futbol].forEach((p, i) => {
        ctxFutbol.fillStyle = p.color;
        ctxFutbol.beginPath();
        ctxFutbol.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxFutbol.fill();
        ctxFutbol.stroke();

        ctxFutbol.fillStyle = '#ffffff';
        ctxFutbol.font = 'bold 12px sans-serif';
        ctxFutbol.fillText(`P${i+1}`, p.x - 7, p.y + 4);
    });

    // Balón
    ctxFutbol.fillStyle = '#ffffff';
    ctxFutbol.beginPath();
    ctxFutbol.arc(balon.x, balon.y, balon.r, 0, Math.PI * 2);
    ctxFutbol.fill();
    ctxFutbol.strokeStyle = '#2c3e50';
    ctxFutbol.stroke();

    // Marcador e instrucciones
    ctxFutbol.fillStyle = '#ffffff';
    ctxFutbol.font = 'bold 20px sans-serif';
    ctxFutbol.fillText(`P1: ${golesP1}`, 50, 35);
    ctxFutbol.fillText(`P2: ${golesP2}`, canvasFutbol.width - 110, 35);

    ctxFutbol.font = '12px sans-serif';
    ctxFutbol.fillText('P1: WASD + Espacio (Tiro)', 50, 55);
    ctxFutbol.fillText('P2: Flechas + Enter (Tiro)', canvasFutbol.width - 190, 55);
}

function configurarBotonesTouchFutbol() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <button class="touch-btn p1-btn" style="flex:1; height:50px;" ontouchstart="keys[' ']=true" ontouchend="keys[' ']=false">🔴 P1 PATEAR</button>
            <button class="touch-btn p2-btn" style="flex:1; height:50px;" ontouchstart="keys['Enter']=true" ontouchend="keys['Enter']=false">🔵 P2 PATEAR</button>
        </div>
    `;
}