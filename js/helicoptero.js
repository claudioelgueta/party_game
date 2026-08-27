function bucleHeli() {
    if (!juegoHeliActivo) return;
    // ... resto del código
}

let canvasHeli, ctxHeli;
let juegoHeliActivo = false;
let animFrameHeli;
let obstaculosHeli = [];
let frameContador = 0;
let velocidadEscenario = 3.5;

let heli1 = { x: 100, y: 200, vy: 0, r: 14, color: '#e74c3c', vivo: true, score: 0 };
let heli2 = { x: 100, y: 240, vy: 0, r: 14, color: '#3498db', vivo: true, score: 0 };

const GRAVEDAD = 0.35;
const IMPULSO = -0.7;

function iniciarMinijuegoHelicoptero() {
    document.getElementById('hubMinijuegos').style.display = 'none';
    document.getElementById('zonaJuego').style.display = 'block';

    canvasHeli = document.getElementById('gameCanvas');
    canvasHeli.height = 450;
    ctxHeli = canvasHeli.getContext('2d');

    // Resetear Helicópteros
    heli1 = { x: 100, y: 200, vy: 0, r: 14, color: '#e74c3c', vivo: true, score: 0 };
    heli2 = { x: 100, y: 240, vy: 0, r: 14, color: '#3498db', vivo: true, score: 0 };
    
    obstaculosHeli = [];
    frameContador = 0;
    juegoHeliActivo = false;

    const modoControl = obtenerTipoControl();
    document.getElementById('touchControls').style.display = (modoControl === 'mobile') ? 'flex' : 'none';
    configurarBotonesTouchHeli();

    iniciarCuentaAtrasHeli();
}

function iniciarCuentaAtrasHeli() {
    let cuenta = 3;
    const overlay = document.getElementById('mensajeJuego');
    overlay.style.display = 'flex';

    dibujarEscenaHeli();

    const timer = setInterval(() => {
        if (cuenta > 0) {
            overlay.innerText = cuenta;
            cuenta--;
        } else if (cuenta === 0) {
            overlay.innerText = "¡MANTÉN PRESIONADO PARA VOLAR!";
            cuenta--;
        } else {
            clearInterval(timer);
            overlay.style.display = 'none';
            juegoHeliActivo = true;
            bucleJuegoHeli();
        }
    }, 800);
}

function actualizarHelicoptero(h, upKey1, upKey2) {
    if (!h.vivo) return;

    // Elevar si presiona tecla, caer si no
    if (keys[upKey1] || keys[upKey2]) {
        h.vy += IMPULSO;
    }
    h.vy += GRAVEDAD;
    
    // Limitar velocidad de caída
    h.vy = Math.min(Math.max(h.vy, -6), 6);
    h.y += h.vy;
    h.score++;

    // Colisión Techo y Suelo
    if (h.y - h.r <= 0 || h.y + h.r >= canvasHeli.height) {
        h.vivo = false;
    }
}

function generarObstaculosHeli() {
    frameContador++;
    if (frameContador % 75 === 0) {
        let hueco = 140; // Espacio para pasar
        let minAlto = 50;
        let maxAlto = canvasHeli.height - hueco - minAlto;
        let altoSuperior = minAlto + Math.random() * maxAlto;

        obstaculosHeli.push({
            x: canvasHeli.width,
            w: 50,
            top: altoSuperior,
            bottom: canvasHeli.height - (altoSuperior + hueco)
        });
    }
}

function bucleJuegoHeli() {
    if (!juegoHeliActivo) return;

    // P1: Espacio o W | P2: Enter o Flecha Arriba
    actualizarHelicoptero(heli1, ' ', 'w');
    actualizarHelicoptero(heli2, 'Enter', 'ArrowUp');

    generarObstaculosHeli();

    // Mover y verificar colisiones con bloques
    for (let i = obstaculosHeli.length - 1; i >= 0; i--) {
        let obs = obstaculosHeli[i];
        obs.x -= velocidadEscenario;

        // Verificar colisión para P1 y P2
        [heli1, heli2].forEach(h => {
            if (h.vivo) {
                if (h.x + h.r > obs.x && h.x - h.r < obs.x + obs.w) {
                    if (h.y - h.r < obs.top || h.y + h.r > canvasHeli.height - obs.bottom) {
                        h.vivo = false;
                    }
                }
            }
        });

        if (obs.x + obs.w < 0) obstaculosHeli.splice(i, 1);
    }

    // Terminar si ambos mueren
    if (!heli1.vivo && !heli2.vivo) {
        juegoHeliActivo = false;
        verificarGanadorHeli();
        return;
    }

    dibujarEscenaHeli();
    if (juegoHeliActivo) animFrameHeli = requestAnimationFrame(bucleJuegoHeli);
}

function dibujarEscenaHeli() {
    ctxHeli.clearRect(0, 0, canvasHeli.width, canvasHeli.height);

    // Fondo Cueva
    ctxHeli.fillStyle = '#1a252f';
    ctxHeli.fillRect(0, 0, canvasHeli.width, canvasHeli.height);

    // Dibujar Obstáculos (Muros)
    ctxHeli.fillStyle = '#27ae60';
    obstaculosHeli.forEach(obs => {
        ctxHeli.fillRect(obs.x, 0, obs.w, obs.top);
        ctxHeli.fillRect(obs.x, canvasHeli.height - obs.bottom, obs.w, obs.bottom);
    });

    // Dibujar Helicópteros
    [heli1, heli2].forEach((h, idx) => {
        if (h.vivo) {
            ctxHeli.fillStyle = h.color;
            ctxHeli.beginPath();
            ctxHeli.arc(h.x, h.y, h.r, 0, Math.PI * 2);
            ctxHeli.fill();

            // Hélice arriba
            ctxHeli.strokeStyle = '#ffffff';
            ctxHeli.lineWidth = 3;
            ctxHeli.beginPath();
            ctxHeli.moveTo(h.x - 12, h.y - h.r);
            ctxHeli.lineTo(h.x + 12, h.y - h.r);
            ctxHeli.stroke();

            // Etiqueta
            ctxHeli.fillStyle = '#ffffff';
            ctxHeli.font = 'bold 10px sans-serif';
            ctxHeli.fillText(`P${idx + 1}`, h.x - 6, h.y + 4);
        }
    });

    // Marcador de distancia
    ctxHeli.fillStyle = '#ffffff';
    ctxHeli.font = 'bold 16px sans-serif';
    ctxHeli.fillText(`P1 (Rojo): ${heli1.score}m ${!heli1.vivo ? '💥' : ''}`, 20, 30);
    ctxHeli.fillText(`P2 (Azul): ${heli2.score}m ${!heli2.vivo ? '💥' : ''}`, 20, 55);
}

function configurarBotonesTouchHeli() {
    const touchPanel = document.getElementById('touchControls');
    touchPanel.innerHTML = `
        <div style="display:flex; gap:10px; width:100%;">
            <button class="touch-btn p1-btn" style="flex:1; height:60px;" ontouchstart="keys[' ']=true" ontouchend="keys[' ']=false">🔴 P1 VOLAR</button>
            <button class="touch-btn p2-btn" style="flex:1; height:60px;" ontouchstart="keys['Enter']=true" ontouchend="keys['Enter']=false">🔵 P2 VOLAR</button>
        </div>
    `;
}

function verificarGanadorHeli() {
    cancelAnimationFrame(animFrameHeli);
    
    let esGanadorP1 = heli1.score >= heli2.score;
    let ganadorTexto = esGanadorP1 ? `¡Ganó ${jugadorActual.nombre} (P1)!` : "¡Ganó Jugador 2!";
    let puntosOtorgados = esGanadorP1 ? 120 : 25;

    guardarResultadoServidor(esGanadorP1 ? 1 : 0, puntosOtorgados, ganadorTexto);
}