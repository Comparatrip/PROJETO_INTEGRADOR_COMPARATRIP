<?php

declare(strict_types=1);
require_once dirname(__DIR__) . '/backend/bootstrap.php';

requireMethod('GET');

try {
    $where = ['ativo = 1'];
    $params = [];

    if (!empty($_GET['id'])) {
        $where[] = 'id = :id';
        $params['id'] = (string) $_GET['id'];
    }
    if (!empty($_GET['destino'])) {
        $where[] = '(destino LIKE :destino OR nome LIKE :nome OR regiao LIKE :regiao_busca)';
        $search = '%' . (string) $_GET['destino'] . '%';
        $params['destino'] = $search;
        $params['nome'] = $search;
        $params['regiao_busca'] = $search;
    }
    if (!empty($_GET['cat'])) {
        $where[] = 'categoria = :categoria';
        $params['categoria'] = (string) $_GET['cat'];
    }
    if (!empty($_GET['regiao'])) {
        $where[] = 'regiao = :regiao';
        $params['regiao'] = (string) $_GET['regiao'];
    }

    $sql = 'SELECT id, nome, destino, regiao, categoria, preco, preco_antigo,
                   dias, transporte, pensao, vagas, vendidos, ultima_hora,
                   feriado, imagem_1, imagem_2, imagem_3
            FROM pacotes
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY vendidos DESC, nome ASC';
    $statement = db()->prepare($sql);
    $statement->execute($params);

    $packages = array_map(static function (array $row): array {
        return [
            'id' => $row['id'],
            'nome' => $row['nome'],
            'destino' => $row['destino'],
            'regiao' => $row['regiao'],
            'categoria' => $row['categoria'],
            'preco' => (float) $row['preco'],
            'antigo' => (float) $row['preco_antigo'],
            'dias' => (int) $row['dias'],
            'transporte' => $row['transporte'],
            'pensao' => $row['pensao'],
            'vagas' => (int) $row['vagas'],
            'vendidos' => (int) $row['vendidos'],
            'ultima' => (bool) $row['ultima_hora'],
            'feriado' => (bool) $row['feriado'],
            'imagens' => array_values(array_filter([
                $row['imagem_1'], $row['imagem_2'], $row['imagem_3'],
            ])),
        ];
    }, $statement->fetchAll());

    if (!empty($_GET['id'])) {
        if (!$packages) {
            respond(['erro' => 'Pacote não encontrado.'], 404);
        }
        respond(['dados' => $packages[0]]);
    }

    respond(['dados' => $packages]);
} catch (Throwable $error) {
    handleDatabaseError($error);
}
