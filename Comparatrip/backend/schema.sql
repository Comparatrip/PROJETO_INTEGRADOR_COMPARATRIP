-- Contrato MySQL/MariaDB para a API PHP da Comparatrip.
-- Se o banco do outro aluno já existir, adapte os nomes nas consultas em public/api.

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pacotes (
    id VARCHAR(40) PRIMARY KEY,
    nome VARCHAR(160) NOT NULL,
    destino VARCHAR(120) NOT NULL,
    regiao VARCHAR(80) NOT NULL,
    categoria ENUM('praia', 'serra', 'internacional', 'cruzeiros') NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    preco_antigo DECIMAL(10,2) NOT NULL DEFAULT 0,
    dias SMALLINT UNSIGNED NOT NULL,
    transporte ENUM('Aéreo', 'Ônibus', 'Navio') NOT NULL,
    pensao ENUM('Café da manhã', 'Meia pensão', 'Pensão completa') NOT NULL,
    vagas SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    vendidos INT UNSIGNED NOT NULL DEFAULT 0,
    ultima_hora BOOLEAN NOT NULL DEFAULT FALSE,
    feriado BOOLEAN NOT NULL DEFAULT FALSE,
    imagem_1 TEXT NULL,
    imagem_2 TEXT NULL,
    imagem_3 TEXT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    usuario_id BIGINT UNSIGNED NOT NULL,
    pacote_id VARCHAR(40) NOT NULL,
    data_saida DATE NOT NULL,
    viajantes_json JSON NOT NULL,
    email VARCHAR(180) NOT NULL,
    forma_pagamento ENUM('Cartão de crédito', 'PIX', 'Boleto') NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pendente', 'pago', 'cancelado') NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_reservas_pacote FOREIGN KEY (pacote_id) REFERENCES pacotes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico de logins (gravado por api/login.php).
CREATE TABLE IF NOT EXISTS logins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logins_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
