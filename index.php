<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Party Game Multijugador</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>

    <!-- MENÚ PRINCIPAL -->
    <div id="menuPrincipal" class="menu-container">
        <h1>🏆 Party Game 🏆</h1>
        
        <div class="panel">
            <h3>Perfil del Jugador</h3>
            <input type="text" id="nombreJugador" placeholder="Tu Nombre o Nick" maxlength="15">
            <button onclick="iniciarSesion()">Entrar / Registrar</button>
            <p id="statusSesion" style="margin-top: 8px; font-size: 13px; color: #aaa;"></p>
        </div>

        <div class="panel">
            <h3>Modo de Control</h3>
            <div class="controls-toggle">
                <label><input type="radio" name="controlType" value="pc" checked> PC (Teclado)</label>
                <label><input type="radio" name="controlType" value="mobile"> Móvil (Táctil)</label>
            </div>
        </div>

        <button class="btn-secondary" onclick="abrirModal()">📊 Ver Estadísticas</button>
        <button id="btnIrHub" class="btn-success" style="display:none; margin-top:10px;" onclick="mostrarHub()">🎮 Ir al Hub de Minijuegos</button>
    </div>

    <!-- HUB DE MINIJUEGOS -->
    <div id="hubMinijuegos" class="menu-container" style="display: none;">
        <h2>Selecciona un Minijuego</h2>
        <div class="grid-minijuegos">
            <button class="btn-game" onclick="iniciarMinijuegoAtletismo()">🏃 Carrera de Atletismo</button>
            <button class="btn-game" onclick="iniciarMinijuegoAutos()">🏎️ Carrera de Autos</button>
            <button class="btn-game" onclick="iniciarMinijuegoPVP()">⚔️ Arena PvP</button>
            <button class="btn-game" onclick="iniciarMinijuegoReaccion()">⚡ Reacción Rápida</button>
            <button class="btn-game" onclick="iniciarMinijuegoHelicoptero()">🚁 Carrera de Helicópteros</button>
            <button class="btn-game" onclick="iniciarMinijuegoFutbol()">⚽ Fútbol 1v1</button>
            <button class="btn-game" onclick="iniciarMinijuegoSumo()">🤼 Sumo 2D</button>
            <button class="btn-game" onclick="iniciarMinijuegoMeteoros()">☄️ Lluvia de Meteoros</button>
            <button class="btn-game" onclick="iniciarMinijuegoAirHockey()">🏒 Air Hockey 2D</button>
            <button class="btn-game" onclick="iniciarMinijuegoRobarBase()">🏴‍☠️ Robar la Base</button>
            <button class="btn-game" onclick="iniciarMinijuegoVoleibol()">🏐 Vóleibol 2D</button>
            <button class="btn-game" onclick="iniciarMinijuegoBasquetbol()">🏀 Básquetbol 1v1</button>
            <button class="btn-game" onclick="iniciarMinijuegoGuerraPintura()">🎨 Guerra de Pintura</button>
            <button class="btn-game" onclick="iniciarMinijuegoPatataCaliente()">💣 La Patata Caliente</button>
            <button class="btn-game" onclick="iniciarMinijuegoGeometryDash()">📐 Geometry Runner</button>
            <button class="btn-game btn-ranking" onclick="mostrarRanking()">🏆 Ranking Global</button>      
        </div>
        <button onclick="volverAlHub()">Volver al Hub</button>
    </div>

    <!-- ZONA DE JUEGO (CANVAS) -->
    <div id="zonaJuego" class="game-container" style="display: none;">
        <button class="btn-secundario" onclick="volverAlHub()">⬅️ Volver al Hub</button>
        <div class="canvas-wrapper">
            <canvas id="gameCanvas" width="800" height="350"></canvas>
            <div id="mensajeJuego" class="overlay-juego"></div>
        </div>

        <!-- Botones Táctiles para Móvil -->
        <div id="touchControls" class="touch-panel" style="display: none;">
            <button class="touch-btn p1-btn" onclick="toquePaso(1)">🏃 P1 PASO</button>
            <button class="touch-btn p2-btn" onclick="toquePaso(2)">🏃 P2 PASO</button>
        </div>
    </div>

    <!-- MODAL ESTADÍSTICAS -->
    <div id="modalStats" class="modal">
        <div class="modal-content">
            <span class="close-btn" onclick="cerrarModal()">&times;</span>
            <h3 style="margin-bottom: 10px;">Estadísticas</h3>
            
            <div class="toggle-stats-btn">
                <button id="btnSimple" class="active" onclick="cambiarVistaStats('simple')">Vista Simple</button>
                <button id="btnAvanzada" onclick="cambiarVistaStats('avanzada')">Vista Avanzada</button>
            </div>

            <div id="statsContent" class="stats-display">
                Cargando datos...
            </div>
        </div>
    </div>

    <div id="vistaRanking" style="display:none;" class="panel-ranking">
    <!-- Agrega type="button" aquí -->
    <button type="button" class="btn-secundario" onclick="document.getElementById('vistaRanking').style.display='none'; document.getElementById('zonaJuego').style.display='none'; document.getElementById('hubMinijuegos').style.display='block';">
    ⬅️ Volver al Hub
    </button>
    <h2>🏆 Tabla de Posiciones (TOP 10)</h2>
    <table class="tabla-ranking">
        <thead>
            <tr>
                <th>Pos.</th>
                <th>Jugador</th>
                <th>Puntos</th>
                <th>Victorias</th>
                <th>Partidas</th>
            </tr>
        </thead>
        <tbody id="tablaRankingBody">
            <!-- Cargado dinámicamente -->
        </tbody>
    </table>
    </div>

    <script src="js/main.js"></script>
    <script src="js/carrera.js"></script>
    <script src="js/autos.js"></script>
    <script src="js/pvp.js"></script>
    <script src="js/reaccion.js"></script>
    <script src="js/helicoptero.js"></script>
    <script src="js/futbol.js"></script>
    <script src="js/sumo.js"></script>       
    <script src="js/meteoros.js"></script>   
    <script src="js/airhockey.js"></script>  
    <script src="js/robarbase.js"></script>
    <script src="js/voleibol.js"></script>
    <script src="js/basquetbol.js"></script>
    <script src="js/guerrapintura.js"></script>
    <script src="js/patatacaliente.js"></script>
    <script src="js/geometrydash.js"></script>
</body>
</html>