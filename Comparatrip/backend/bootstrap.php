<?php

declare(strict_types=1);

// Este arquivo só pode ser incluído pela API; o acesso direto pelo navegador é bloqueado.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === realpath(__FILE__)) {
    http_response_code(403);
    exit('Acesso negado.');
}

session_name('comparatrip');
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'cookie_secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
]);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Vary: Cookie');
header('X-Content-Type-Options: nosniff');

function db(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $driver = getenv('DB_DRIVER') ?: 'mysql';
    if ($driver === 'sqlite') {
        $path = getenv('DB_PATH') ?: ':memory:';
        $connection = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $connection->exec('PRAGMA foreign_keys = ON');
        return $connection;
    }

    if ($driver !== 'mysql') {
        throw new RuntimeException('DB_DRIVER deve ser mysql ou sqlite.');
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $name = getenv('DB_NAME') ?: 'comparatrip';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

    $connection = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $connection;
}

/** @param mixed $data */
function respond($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireMethod(string $expected): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $expected) {
        header('Allow: ' . $expected);
        respond(['erro' => 'Método não permitido.'], 405);
    }
}

/** @return array<string, mixed> */
function currentUser(): array
{
    return $_SESSION['usuario'] ?? [];
}

function requireUser(): array
{
    $user = currentUser();
    if (empty($user['id'])) {
        respond(['erro' => 'Entre na sua conta para continuar.'], 401);
    }
    return $user;
}

function requireAdmin(): array
{
    $user = requireUser();
    if (($user['papel'] ?? '') !== 'admin') {
        respond(['erro' => 'Acesso restrito ao administrador.'], 403);
    }
    return $user;
}

/** @return array<string, mixed> */
function jsonInput(): array
{
    $input = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($input)) {
        respond(['erro' => 'JSON inválido.'], 400);
    }
    return $input;
}

function handleDatabaseError(Throwable $error): void
{
    error_log($error->getMessage());
    respond(['erro' => 'Não foi possível consultar o banco de dados.'], 500);
}

/** @param array<string, mixed> $user linha da tabela usuarios */
function startUserSession(array $user): array
{
    session_regenerate_id(true);
    $_SESSION['usuario'] = [
        'id' => (int) $user['id'],
        'nome' => $user['nome'],
        'papel' => $user['papel'], // cliente ou admin
    ];
    return $_SESSION['usuario'] + ['email' => $user['email']];
}
