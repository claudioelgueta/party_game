// js/meteoros.js
let canvasMet, ctxMet, juegoMetActivo = false, animFrameMet, meteoros = [];

let p1Met = { x: 250, y: 390, r: 16, hp: 3, color: '#e74c3c' };
let p2Met = { x: 550, y: 390, r: 16, hp: 3, color: '#3498db' };

function iniciarMinijuegoMeteoros() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasMet = document.getElementById('gameCanvas');
    canvasMet.height = 450;
    ctxMet = canvasMet.getContext('2d');

    p1Met = { x: 250, y: 390, r: 16, hp: 3, color: '#e74c3c' };
    p2Met = { x: 550, y: 390, r: 16, hp: 3, color: '#3498db' };
    meteoros = [];

    // Ocultar o mostrar controles táctiles según el dispositivo
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';

    iniciarCuentaAtras(canvasMet, () => {
        juegoMetActivo = true;
        bucleMeteoros();
    });
}

function bucleMeteoros() {
    if (!juegoMetActivo) return;

    // Movimiento P1 (A/D) y P2 (Flechas Izquierda/Derecha)
    if (keys['a'] || keys['A']) p1Met.x = Math.max(p1Met.r, p1Met.x - 5);
    if (keys['d'] || keys['D']) p1Met.x = Math.min(canvasMet.width - p1Met.r, p1Met.x + 5);

    if (keys['ArrowLeft']) p2Met.x = Math.max(p2Met.r, p2Met.x - 5);
    if (keys['ArrowRight']) p2Met.x = Math.min(canvasMet.width - p2Met.r, p2Met.x + 5);

    // Generar Meteoros
    if (Math.random() < 0.08) {
        meteoros.push({ 
            x: Math.random() * canvasMet.width, 
            y: -20, 
            r: 10 + Math.random() * 15, 
            vy: 3 + Math.random() * 4 
        });
    }

    // Actualizar y verificar colisiones
    for (let i = meteoros.length - 1; i >= 0; i--) {
        let m = meteoros[i];
        m.y += m.vy;

        // Colisión P1
        if (Math.hypot(m.x - p1Met.x, m.y - p1Met.y) < m.r + p1Met.r) {
            p1Met.hp--;
            meteoros.splice(i, 1);
            continue;
        }
        // Colisión P2
        if (Math.hypot(m.x - p2Met.x, m.y - p2Met.y) < m.r + p2Met.r) {
            p2Met.hp--;
            meteoros.splice(i, 1);
            continue;
        }

        // Eliminar si sale de pantalla
        if (m.y > canvasMet.height + 20) meteoros.splice(i, 1);
    }

    // Comprobar condición de derrota
    if (p1Met.hp <= 0 || p2Met.hp <= 0) {
        juegoMetActivo = false;
        let esGanadorP1 = p1Met.hp > p2Met.hp;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre}!` : "¡Ganó Jugador 2!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 100 : 20, texto);
        return;
    }

    dibujarMeteoros();
    animFrameGlobal = animFrameMet = requestAnimationFrame(bucleMeteoros);
}

function dibujarMeteoros() {
    ctxMet.fillStyle = '#0f172a';
    ctxMet.fillRect(0, 0, canvasMet.width, canvasMet.height);

    // Dibujar Jugadores
    [p1Met, p2Met].forEach(p => {
        ctxMet.fillStyle = p.color;
        ctxMet.beginPath();
        ctxMet.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxMet.fill();
    });

    // Dibujar Meteoros
    ctxMet.fillStyle = '#f97316';
    meteoros.forEach(m => {
        ctxMet.beginPath();
        ctxMet.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctxMet.fill();
    });

    // Dibujar HUD de Vidas
    ctxMet.fillStyle = '#ffffff';
    ctxMet.font = 'bold 18px sans-serif';
    ctxMet.fillText(`P1 Vidas: ${'❤️'.repeat(Math.max(0, p1Met.hp))}`, 20, 35);
    ctxMet.fillText(`P2 Vidas: ${'❤️'.repeat(Math.max(0, p2Met.hp))}`, canvasMet.width - 180, 35);
}