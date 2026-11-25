<?php

declare(strict_types=1);
require_once dirname(__DIR__) . '/backend/bootstrap.php';

requireMethod('POST');

try {
    $input = jsonInput();
    $nome = trim((string) ($input['nome'] ?? ''));
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $senha = (string) ($input['senha'] ?? '');

    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 120) {
        respond(['erro' => 'Informe seu nome completo.'], 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 180) {
        respond(['erro' => 'Informe um e-mail válido.'], 422);
    }
    // bcrypt só considera os 72 primeiros bytes da senha.
    if (strlen($senha) < 6 || strlen($senha) > 72) {
        respond(['erro' => 'A senha deve ter entre 6 e 72 caracteres.'], 422);
    }

    $exists = db()->prepare('SELECT id FROM usuarios WHERE email = :email');
    $exists->execute(['email' => $email]);
    if ($exists->fetch()) {
        respond(['erro' => 'Esse e-mail já está cadastrado. Entre na sua conta.'], 409);
    }

    // O papel nunca vem do navegador: todo cadastro público é "cliente".
    $insert = db()->prepare(
        "INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (:nome, :email, :hash, 'cliente')"
    );
    try {
        $insert->execute([
            'nome' => $nome,
            'email' => $email,
            'hash' => password_hash($senha, PASSWORD_DEFAULT),
        ]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') { // e-mail criado por outra requisição ao mesmo tempo
            respond(['erro' => 'Esse e-mail já está cadastrado. Entre na sua conta.'], 409);
        }
        throw $error;
    }

    $user = startUserSession([
        'id' => db()->lastInsertId(),
        'nome' => $nome,
        'email' => $email,
        'papel' => 'cliente',
    ]);
    respond(['dados' => $user], 201);
} catch (Throwable $error) {
    handleDatabaseError($error);
}
