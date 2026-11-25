<?php

declare(strict_types=1);
require_once dirname(__DIR__) . '/backend/bootstrap.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        requireAdmin();
        $input = jsonInput();
        $code = trim((string) ($input['codigo'] ?? ''));
        $status = (string) ($input['status'] ?? '');
        if ($code === '' || !in_array($status, ['pendente', 'pago', 'cancelado'], true)) {
            respond(['erro' => 'Informe um código e um status válido.'], 422);
        }
        $statement = db()->prepare('UPDATE reservas SET status = :status WHERE codigo = :codigo');
        $statement->execute(['status' => $status, 'codigo' => $code]);
        if ($statement->rowCount() === 0) {
            respond(['erro' => 'Reserva não encontrada ou status já atualizado.'], 404);
        }
        respond(['dados' => ['codigo' => $code, 'status' => $status]]);
    }

    requireMethod('GET');
    $user = requireUser();
    $isAdmin = ($user['papel'] ?? '') === 'admin';
    $params = [];
    $where = '';
    if (!$isAdmin) {
        $where = 'WHERE r.usuario_id = :usuario_id';
        $params['usuario_id'] = $user['id'];
    }
    if (!empty($_GET['codigo'])) {
        $where .= $where ? ' AND ' : 'WHERE ';
        $where .= 'r.codigo = :codigo';
        $params['codigo'] = (string) $_GET['codigo'];
    }

    $sql = "SELECT r.codigo, r.data_saida, r.viajantes_json, r.email,
                   r.forma_pagamento, r.total, r.status, r.criado_em,
                   p.id AS pacote_id, p.nome AS pacote_nome, p.imagem_1,
                   u.nome AS cliente_nome
            FROM reservas r
            INNER JOIN pacotes p ON p.id = r.pacote_id
            INNER JOIN usuarios u ON u.id = r.usuario_id
            {$where}
            ORDER BY r.criado_em DESC";
    $statement = db()->prepare($sql);
    $statement->execute($params);

    $reservations = array_map(static function (array $row): array {
        $travelers = json_decode($row['viajantes_json'], true);
        return [
            'codigo' => $row['codigo'],
            'data' => $row['data_saida'],
            'viajantes' => is_array($travelers) ? $travelers : [],
            'email' => $row['email'],
            'cliente' => $row['cliente_nome'],
            'forma' => $row['forma_pagamento'],
            'total' => (float) $row['total'],
            'status' => $row['status'],
            'criado' => $row['criado_em'],
            'pacote' => [
                'id' => $row['pacote_id'],
                'nome' => $row['pacote_nome'],
                'imagem' => $row['imagem_1'],
            ],
        ];
    }, $statement->fetchAll());

    respond(['dados' => $reservations]);
} catch (Throwable $error) {
    handleDatabaseError($error);
}
