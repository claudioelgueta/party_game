<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$nombre = $_POST['nombre'] ?? '';
$gano = isset($_POST['gano']) ? (int)$_POST['gano'] : 0; // 1 = Ganó, 0 = Perdió
$puntos = isset($_POST['puntos']) ? (int)$_POST['puntos'] : 0;

if (empty($nombre)) {
    echo json_encode(['status' => 'error', 'message' => 'Falta el nombre']);
    exit;
}

if ($gano === 1) {
    $sql = "UPDATE jugadores SET 
            partidas_jugadas = partidas_jugadas + 1, 
            partidas_ganadas = partidas_ganadas + 1, 
            puntos_totales = puntos_totales + ? 
            WHERE nombre = ?";
} else {
    $sql = "UPDATE jugadores SET 
            partidas_jugadas = partidas_jugadas + 1, 
            partidas_perdidas = partidas_perdidas + 1, 
            puntos_totales = puntos_totales + ? 
            WHERE nombre = ?";
}

try {
    $stmt = $conn->prepare($sql);
    $stmt->execute([$puntos, $nombre]);
    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>