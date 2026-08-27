function buclePatata() {
    if (!juegoPatataActivo) return;
    // ... resto del código
}
let canvasPatata, ctxPatata, juegoPatataActivo = false, animFramePatata;

let tiempoBomba = 20;
let intervaloPatata;

let p1Patata = { x: 150, y: 225, r: 18, color: '#e74c3c', tieneBomba: false, cdDash: 0, dashTicks: 0 };
let p2Patata = { x: 650, y: 225, r: 18, color: '#3498db', tieneBomba: false, cdDash: 0, dashTicks: 0 };

function iniciarMinijuegoPatataCaliente() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasPatata = document.getElementById('gameCanvas');
    canvasPatata.height = 450;
    ctxPatata = canvasPatata.getContext('2d');

    p1Patata.x = 150; p1Patata.y = 225; p1Patata.cdDash = 0; p1Patata.dashTicks = 0;
    p2Patata.x = 650; p2Patata.y = 225; p2Patata.cdDash = 0; p2Patata.dashTicks = 0;

    // Asignar bomba aleatoriamente
    let p1Empieza = Math.random() < 0.5;
    p1Patata.tieneBomba = p1Empieza;
    p2Patata.tieneBomba = !p1Empieza;

    tiempoBomba = Math.floor(Math.random() * 10) + 15; // Entre 15 y 25 segundos

    clearInterval(intervaloPatata);
    intervaloPatata = setInterval(() => {
        if (!juegoPatataActivo) return;
        tiempoBomba--;
        if (tiempoBomba <= 0) explotarPatata();
    }, 1000);

    juegoPatataActivo = true;
    buclePatataCaliente();
}

function buclePatataCaliente() {
    if (!juegoPatataActivo) return;

    if (p1Patata.cdDash > 0) p1Patata.cdDash--;
    if (p2Patata.cdDash > 0) p2Patata.cdDash--;

    // Activación de Dash
    if (keys[' '] && p1Patata.cdDash === 0) { p1Patata.dashTicks = 12; p1Patata.cdDash = 120; }
    if (keys['Enter'] && p2Patata.cdDash === 0) { p2Patata.dashTicks = 12; p2Patata.cdDash = 120; }

    moverJugadorPatata(p1Patata, 'w', 's', 'a', 'd');
    moverJugadorPatata(p2Patata, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');

    // Transferir Bomba al Hacer Contacto
    let dist = Math.hypot(p1Patata.x - p2Patata.x, p1Patata.y - p2Patata.y);
    if (dist < p1Patata.r + p2Patata.r + 5) {
        if (p1Patata.tieneBomba) {
            p1Patata.tieneBomba = false;
            p2Patata.tieneBomba = true;
        } else if (p2Patata.tieneBomba) {
            p2Patata.tieneBomba = false;
            p1Patata.tieneBomba = true;
        }
    }

    dibujarEscenaPatata();
    animFrameGlobal = animFramePatata = requestAnimationFrame(buclePatataCaliente);
}

function moverJugadorPatata(p, up, down, left, right) {
    let speed = 4;
    if (p.dashTicks > 0) {
        speed = 8.5; // Velocidad con Dash
        p.dashTicks--;
    }

    if (keys[up]) p.y = Math.max(p.r, p.y - speed);
    if (keys[down]) p.y = Math.min(450 - p.r, p.y + speed);
    if (keys[left]) p.x = Math.max(p.r, p.x - speed);
    if (keys[right]) p.x = Math.min(canvasPatata.width - p.r, p.x + speed);
}

function explotarPatata() {
    juegoPatataActivo = false;
    clearInterval(intervaloPatata);

    let esGanadorP1 = !p1Patata.tieneBomba; // Gana quien NO tiene la bomba
    let texto = esGanadorP1 
        ? `¡La bomba explotó! Ganó ${jugadorActual.nombre}.` 
        : "¡La bomba explotó! Ganó Jugador 2.";

    guardarResultadoServidor(esGanadorP1 ? 1 : 0, esGanadorP1 ? 150 : 30, texto);
}

function dibujarEscenaPatata() {
    ctxPatata.clearRect(0, 0, canvasPatata.width, canvasPatata.height);

    ctxPatata.fillStyle = '#0f172a';
    ctxPatata.fillRect(0, 0, canvasPatata.width, canvasPatata.height);

    // Jugadores
    [p1Patata, p2Patata].forEach((p) => {
        ctxPatata.fillStyle = p.color;
        ctxPatata.beginPath(); ctxPatata.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctxPatata.fill();
        ctxPatata.strokeStyle = '#ffffff'; ctxPatata.lineWidth = 2; ctxPatata.stroke();

        // Dibujar la Bomba sobre el poseedor
        if (p.tieneBomba) {
            ctxPatata.fillStyle = '#ef4444';
            ctxPatata.beginPath(); ctxPatata.arc(p.x, p.y - 28, 10, 0, Math.PI * 2); ctxPatata.fill();
            ctxPatata.fillStyle = '#facc15';
            ctxPatata.fillText('💣', p.x - 7, p.y - 24);
        }
    });

    // Marcador
    ctxPatata.fillStyle = '#ffffff';
    ctxPatata.font = 'bold 22px sans-serif';
    ctxPatata.fillText(`💣 Explosión en: ${tiempoBomba}s`, 300, 40);

    ctxPatata.font = '11px sans-serif';
    ctxPatata.fillStyle = '#94a3b8';
    ctxPatata.fillText('P1: WASD | Espacio = Dash', 20, 435);
    ctxPatata.fillText('P2: Flechas | Enter = Dash', 600, 435);
}