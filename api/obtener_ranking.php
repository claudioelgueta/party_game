<?php
// api/obtener_ranking.php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $stmt = $conn->query("
        SELECT nombre, puntos_totales, partidas_ganadas, partidas_jugadas 
        FROM jugadores 
        ORDER BY puntos_totales DESC, partidas_ganadas DESC 
        LIMIT 10
    ");
    $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'data' => $ranking]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error al consultar ranking: ' . $e->getMessage()]);
}
?>