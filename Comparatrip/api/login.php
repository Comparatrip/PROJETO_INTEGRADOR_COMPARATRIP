<?php

declare(strict_types=1);
require_once dirname(__DIR__) . '/backend/bootstrap.php';

requireMethod('POST');

try {
    $input = jsonInput();
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $senha = (string) ($input['senha'] ?? '');

    $statement = db()->prepare('SELECT id, nome, email, senha_hash, papel FROM usuarios WHERE email = :email');
    $statement->execute(['email' => $email]);
    $user = $statement->fetch();

    // Hash descartável: sempre roda um password_verify para o tempo de resposta não revelar se o e-mail existe.
    $hash = $user['senha_hash'] ?? '$2b$12$Fe.6C8svnlSjU5OlnmvCeef00T9K7pXJWSRag4qZfiKr00ZoeVXAK';
    $valid = password_verify($senha, $hash) && $user;
    if (!$valid) {
        respond(['erro' => 'E-mail ou senha incorretos.'], 401);
    }

    if (password_needs_rehash($user['senha_hash'], PASSWORD_DEFAULT)) {
        $rehash = db()->prepare('UPDATE usuarios SET senha_hash = :hash WHERE id = :id');
        $rehash->execute(['hash' => password_hash($senha, PASSWORD_DEFAULT), 'id' => $user['id']]);
    }

    // Histórico de acessos: se a tabela "logins" ainda não existir, o login continua funcionando.
    try {
        $log = db()->prepare('INSERT INTO logins (usuario_id, ip, user_agent) VALUES (:id, :ip, :agent)');
        $log->execute([
            'id' => $user['id'],
            'ip' => substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45),
            'agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
        ]);
    } catch (Throwable $logError) {
        error_log('Histórico de login não gravado: ' . $logError->getMessage());
    }

    respond(['dados' => startUserSession($user)]);
} catch (Throwable $error) {
    handleDatabaseError($error);
}
