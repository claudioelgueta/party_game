<?php
header('Content-Type: application/json');

$host = "localhost";
$usuario = "root";
$password = "";
$base_de_datos = "party_games_db";

try {
    $conn = new PDO("mysql:host=$host;dbname=$base_de_datos;charset=utf8", $usuario, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error de conexión: " . $e->getMessage()]);
    exit;
}
?>