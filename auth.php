<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../vendor/autoload.php'; // Ensure JWT library is included
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: strict-origin-when-cross-origin");

// Enable CORS for development
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Routing
$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

switch (true) {
    case $method === 'POST' && preg_match('/\/api\/auth\/login$/', $request):
        handleLogin();
        break;
    case $method === 'POST' && preg_match('/\/api\/auth\/register$/', $request):
        handleRegister();
        break;
    case $method === 'GET' && preg_match('/\/api\/auth\/verify$/', $request):
        handleVerify();
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        break;
}

function handleLogin() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }

    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $password = $data['password'];

    $stmt = $pdo->prepare("SELECT id, name, password FROM users WHERE email = ? AND status = 'active'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        return;
    }

    $token = generateJWT($user['id'], $user['email']);
    echo json_encode(['success' => true, 'token' => $token, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name']]]);
}

function handleRegister() {
    global $pdo;
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, email, and password are required']);
        return;
    }

    $name = filter_var($data['name'], FILTER_SANITIZE_STRING);
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $password = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        return;
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $password]);
    $userId = $pdo->lastInsertId();
    $token = generateJWT($userId, $email);

    http_response_code(201);
    echo json_encode(['success' => true, 'token' => $token, 'user' => ['id' => $userId, 'email' => $email, 'name' => $name]]);
}

function handleVerify() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authorization token required']);
        return;
    }

    $token = $matches[1];
    $payload = verifyJWT($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        return;
    }

    echo json_encode(['success' => true, 'user' => ['id' => $payload->user_id, 'email' => $payload->email]]);
}

function generateJWT($userId, $email) {
    $secret = JWT_SECRET;
    $issuedAt = time();
    $expirationTime = $issuedAt + 3600;
    $payload = ['iat' => $issuedAt, 'exp' => $expirationTime, 'user_id' => $userId, 'email' => $email];
    return JWT::encode($payload, $secret, 'HS256');
}

function verifyJWT($token) {
    try {
        $secret = JWT_SECRET;
        return JWT::decode($token, new Key($secret, 'HS256'));
    } catch (Exception $e) {
        return false;
    }
}
