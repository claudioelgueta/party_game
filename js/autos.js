// js/autos.js
let canvasAutos, ctxAutos;
let juegoAutosActivo = false;
let animFrameAutos;

const VUELTAS_TOTALES = 3;

// Propiedades de los autos
let car1 = {
    x: 400, y: 70, angle: 0, speed: 0, accel: 0.15, maxSpeed: 4.5, turnSpeed: 0.05, friction: 0.96,
    color: '#e74c3c', vuelta: 1, pasoCheckpoint: false, gano: false
};

let car2 = {
    x: 400, y: 100, angle: 0, speed: 0, accel: 0.15, maxSpeed: 4.5, turnSpeed: 0.05, friction: 0.96,
    color: '#3498db', vuelta: 1, pasoCheckpoint: false, gano: false
};

// Teclas presionadas
let keys = {};

function iniciarMinijuegoAutos() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasAutos = document.getElementById('gameCanvas');
    canvasAutos.height = 450;
    ctxAutos = canvasAutos.getContext('2d');

    // Resetear posiciones y estado
    resetCar(car1, 380, 65);
    resetCar(car2, 380, 100);
    juegoAutosActivo = false;

    // Mostrar controles táctiles si aplica
    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchAutos();

    iniciarCuentaAtrasAutos();
}

function resetCar(car, x, y) {
    car.x = x;
    car.y = y;
    car.angle = 0;
    car.speed = 0;
    car.vuelta = 1;
    car.pasoCheckpoint = false;
    car.gano = false;
}

function iniciarCuentaAtrasAutos() {
    let cuenta = 3;
    const overlay = document.getElementById('mensajeJuego');
    overlay.style.display = 'flex';

    dibujarEscenaAutos();

    const timer = setInterval(() => {
        if (cuenta > 0) {
            overlay.innerText = cuenta;
            cuenta--;
        } else if (cuenta === 0) {
            overlay.innerText = "¡ARRANCA!";
            cuenta--;
        } else {
            clearInterval(timer);
            overlay.style.display = 'none';
            juegoAutosActivo = true;
            bucleAutos();
        }
    }, 800);
}

// Escuchar entradas de teclado
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

function actualizarFisicasCar(car, upKey, downKey, leftKey, rightKey) {
    if (keys[upKey]) car.speed = Math.min(car.speed + car.accel, car.maxSpeed);
    if (keys[downKey]) car.speed = Math.max(car.speed - car.accel, -car.maxSpeed / 2);

    if (Math.abs(car.speed) > 0.2) {
        const dir = car.speed > 0 ? 1 : -1;
        if (keys[leftKey]) car.angle -= car.turnSpeed * dir;
        if (keys[rightKey]) car.angle += car.turnSpeed * dir;
    }

    car.speed *= car.friction;
    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // Verificar si sale de la pista
    const dx = car.x - 400;
    const dy = car.y - 225;

    const enHierbaExterior = Math.pow(dx / 340, 2) + Math.pow(dy / 175, 2) > 1;
    const enHierbaInterior = Math.pow(dx / 140, 2) + Math.pow(dy / 75, 2) < 1;

    if (enHierbaExterior || enHierbaInterior) {
        car.speed *= 0.85;
    }

    // Checkpoint a mitad de pista
    if (car.y > 300 && Math.abs(car.x - 400) < 100) {
        car.pasoCheckpoint = true;
    }

    // Meta
    if (car.pasoCheckpoint && car.x >= 390 && car.x <= 410 && car.y < 130 && car.speed > 0) {
        car.pasoCheckpoint = false;
        car.vuelta++;
        if (car.vuelta > VUELTAS_TOTALES) {
            car.gano = true;
            juegoAutosActivo = false;
            verificarGanadorAutos();
        }
    }
}

function bucleAutos() {
    if (!juegoAutosActivo) return;

    // Actualizar P1 (WASD)
    actualizarFisicasCar(car1, 'w', 's', 'a', 'd');
    actualizarFisicasCar(car1, 'W', 'S', 'A', 'D');

    // Actualizar P2 (Flechas)
    actualizarFisicasCar(car2, 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');

    dibujarEscenaAutos();
    animFrameGlobal = animFrameAutos = requestAnimationFrame(bucleAutos);
}

function dibujarEscenaAutos() {
    ctxAutos.clearRect(0, 0, canvasAutos.width, canvasAutos.height);

    // Fondo: Hierba
    ctxAutos.fillStyle = '#27ae60';
    ctxAutos.fillRect(0, 0, canvasAutos.width, canvasAutos.height);

    // Pista (Óvalo exterior)
    ctxAutos.fillStyle = '#34495e';
    ctxAutos.beginPath();
    ctxAutos.ellipse(400, 225, 340, 175, 0, 0, Math.PI * 2);
    ctxAutos.fill();

    // Centro (Hierba interior)
    ctxAutos.fillStyle = '#27ae60';
    ctxAutos.beginPath();
    ctxAutos.ellipse(400, 225, 140, 75, 0, 0, Math.PI * 2);
    ctxAutos.fill();

    // Meta (Línea ajedrezada)
    for (let y = 50; y < 130; y += 10) {
        ctxAutos.fillStyle = (y / 10) % 2 === 0 ? '#ffffff' : '#000000';
        ctxAutos.fillRect(400, y, 10, 10);
    }

    // Dibujar Autos
    dibujarAuto(car1, "P1");
    dibujarAuto(car2, "P2");

    // HUD (Vueltas)
    ctxAutos.fillStyle = '#ffffff';
    ctxAutos.font = 'bold 16px sans-serif';
    ctxAutos.fillText(`P1 (Rojo): Vuelta ${Math.min(car1.vuelta, VUELTAS_TOTALES)}/${VUELTAS_TOTALES}`, 20, 30);
    ctxAutos.fillText(`P2 (Azul): Vuelta ${Math.min(car2.vuelta, VUELTAS_TOTALES)}/${VUELTAS_TOTALES}`, 600, 30);
}

function dibujarAuto(car, label) {
    ctxAutos.save();
    ctxAutos.translate(car.x, car.y);
    ctxAutos.rotate(car.angle);

    // Chasis del Auto
    ctxAutos.fillStyle = car.color;
    ctxAutos.fillRect(-15, -8, 30, 16);

    // Faros delanteros
    ctxAutos.fillStyle = '#f1c40f';
    ctxAutos.fillRect(11, -7, 4, 4);
    ctxAutos.fillRect(11, 3, 4, 4);

    // Texto P1 / P2
    ctxAutos.rotate(-car.angle);
    ctxAutos.fillStyle = '#ffffff';
    ctxAutos.font = 'bold 11px sans-serif';
    ctxAutos.fillText(label, -7, -12);

    ctxAutos.restore();
}

function configurarBotonesTouchAutos() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P1 (Rojo)</p>
                <button class="touch-btn p1-btn" ontouchstart="keys['w']=true" ontouchend="keys['w']=false">⚡ Acelerar</button>
                <button class="touch-btn p1-btn" ontouchstart="keys['a']=true" ontouchend="keys['a']=false">◀</button>
                <button class="touch-btn p1-btn" ontouchstart="keys['d']=true" ontouchend="keys['d']=false">▶</button>
            </div>
            <div style="flex:1; text-align:center;">
                <p style="font-size:12px; margin-bottom:4px;">P2 (Azul)</p>
                <button class="touch-btn p2-btn" ontouchstart="keys['ArrowUp']=true" ontouchend="keys['ArrowUp']=false">⚡ Acelerar</button>
                <button class="touch-btn p2-btn" ontouchstart="keys['ArrowLeft']=true" ontouchend="keys['ArrowLeft']=false">◀</button>
                <button class="touch-btn p2-btn" ontouchstart="keys['ArrowRight']=true" ontouchend="keys['ArrowRight']=false">▶</button>
            </div>
        </div>
    `;
}

function verificarGanadorAutos() {
    let esGanadorP1 = car1.gano;
    let ganadorTexto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (P1)!` : "¡Ganó Jugador 2!";
    let puntosOtorgados = esGanadorP1 ? 120 : 30;

    guardarResultadoServidor(esGanadorP1 ? 1 : 0, puntosOtorgados, ganadorTexto);
}