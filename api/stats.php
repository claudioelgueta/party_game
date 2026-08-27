<?php
require_once 'conexion.php';

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $nombre = trim($_POST['nombre'] ?? '');
    
    if (empty($nombre)) {
        echo json_encode(['status' => 'error', 'message' => 'Ingresa un nombre válido']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM jugadores WHERE nombre = ?");
    $stmt->execute([$nombre]);
    $jugador = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$jugador) {
        $stmtInsert = $conn->prepare("INSERT INTO jugadores (nombre) VALUES (?)");
        $stmtInsert->execute([$nombre]);
        
        $stmt = $conn->prepare("SELECT * FROM jugadores WHERE nombre = ?");
        $stmt->execute([$nombre]);
        $jugador = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    echo json_encode(['status' => 'success', 'jugador' => $jugador]);
    exit;
}

if ($action === 'get') {
    $nombre = $_GET['nombre'] ?? '';
    
    if (empty($nombre)) {
        echo json_encode(['status' => 'error', 'message' => 'Nombre no especificado']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM jugadores WHERE nombre = ?");
    $stmt->execute([$nombre]);
    $jugador = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($jugador) {
        $jugadas = (int)$jugador['partidas_jugadas'];
        $ganadas = (int)$jugador['partidas_ganadas'];
        $jugador['winrate'] = $jugadas > 0 ? round(($ganadas / $jugadas) * 100, 1) : 0;
        
        echo json_encode(['status' => 'success', 'jugador' => $jugador]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Jugador no encontrado']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Acción inválida']);
?>