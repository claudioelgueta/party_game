// js/patatacaliente.js
let canvasPatata, ctxPatata, juegoPatataActivo = false, animFramePatata, objetosPatata = [];

let p1Patata = { x: 250, y: 390, r: 16, hp: 3, color: '#e74c3c' };
let p2Patata = { x: 550, y: 390, r: 16, hp: 3, color: '#3498db' };

function iniciarMinijuegoPatataCaliente() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasPatata = document.getElementById('gameCanvas');
    canvasPatata.height = 450;
    ctxPatata = canvasPatata.getContext('2d');

    p1Patata = { x: 250, y: 390, r: 16, hp: 3, color: '#e74c3c' };
    p2Patata = { x: 550, y: 390, r: 16, hp: 3, color: '#3498db' };
    objetosPatata = [];

    // Ocultar o mostrar controles táctiles según el dispositivo
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';

    iniciarCuentaAtras(canvasPatata, () => {
        juegoPatataActivo = true;
        buclePatataCaliente();
    });
}

function buclePatataCaliente() {
    if (!juegoPatataActivo) return;

    // Movimiento P1 (A/D) y P2 (Flechas Izquierda/Derecha)
    if (keys['a'] || keys['A']) p1Patata.x = Math.max(p1Patata.r, p1Patata.x - 5);
    if (keys['d'] || keys['D']) p1Patata.x = Math.min(canvasPatata.width - p1Patata.r, p1Patata.x + 5);

    if (keys['ArrowLeft']) p2Patata.x = Math.max(p2Patata.r, p2Patata.x - 5);
    if (keys['ArrowRight']) p2Patata.x = Math.min(canvasPatata.width - p2Patata.r, p2Patata.x + 5);

    // Generar Meteoros
    if (Math.random() < 0.08) {
        objetosPatata.push({
            x: Math.random() * canvasPatata.width,
            y: -20, 
            r: 10 + Math.random() * 15, 
            vy: 3 + Math.random() * 4 
        });
    }

    // Actualizar y verificar colisiones
    for (let i = objetosPatata.length - 1; i >= 0; i--) {
        let m = objetosPatata[i];
        m.y += m.vy;

        // Colisión P1
        if (Math.hypot(m.x - p1Patata.x, m.y - p1Patata.y) < m.r + p1Patata.r) {
            p1Patata.hp--;
            objetosPatata.splice(i, 1);
            continue;
        }
        // Colisión P2
        if (Math.hypot(m.x - p2Patata.x, m.y - p2Patata.y) < m.r + p2Patata.r) {
            p2Patata.hp--;
            objetosPatata.splice(i, 1);
            continue;
        }

        // Eliminar si sale de pantalla
        if (m.y > canvasPatata.height + 20) objetosPatata.splice(i, 1);
    }

    // Comprobar condición de derrota
    if (p1Patata.hp <= 0 || p2Patata.hp <= 0) {
        juegoPatataActivo = false;
        let esGanadorP1 = p1Patata.hp > p2Patata.hp;
        let texto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre}!` : "¡Ganó Jugador 2!";
        guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 100 : 20, texto);
        return;
    }

    dibujarPatataCaliente();
    animFrameGlobal = animFramePatata = requestAnimationFrame(buclePatataCaliente);
}

function dibujarPatataCaliente() {
    ctxPatata.fillStyle = '#0f172a';
    ctxPatata.fillRect(0, 0, canvasPatata.width, canvasPatata.height);

    // Dibujar Jugadores
    [p1Patata, p2Patata].forEach(p => {
        ctxPatata.fillStyle = p.color;
        ctxPatata.beginPath();
        ctxPatata.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctxPatata.fill();
    });

    // Dibujar Meteoros
    ctxPatata.fillStyle = '#f97316';
    objetosPatata.forEach(m => {
        ctxPatata.beginPath();
        ctxPatata.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctxPatata.fill();
    });

    // Dibujar HUD de Vidas
    ctxPatata.fillStyle = '#ffffff';
    ctxPatata.font = 'bold 18px sans-serif';
    ctxPatata.fillText(`P1 Vidas: ${'❤️'.repeat(Math.max(0, p1Patata.hp))}`, 20, 35);
    ctxPatata.fillText(`P2 Vidas: ${'❤️'.repeat(Math.max(0, p2Patata.hp))}`, canvasPatata.width - 180, 35);
}