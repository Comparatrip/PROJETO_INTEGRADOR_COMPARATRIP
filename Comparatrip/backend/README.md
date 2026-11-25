# API PHP da Comparatrip

A API usa PHP com PDO. O JavaScript não contém credenciais nem executa consultas SQL.
Tudo fica dentro da mesma pasta do site: `api/` contém os endpoints e `backend/` contém a conexão, o schema e este README.

## Configuração

Defina estas variáveis no servidor PHP, sem gravar senhas no projeto:

- `DB_HOST`: endereço do MySQL, por padrão `127.0.0.1`
- `DB_PORT`: porta, por padrão `3306`
- `DB_NAME`: nome do banco, por padrão `comparatrip`
- `DB_USER`: usuário do banco
- `DB_PASS`: senha do banco

O `schema.sql` documenta as tabelas esperadas. Ele não precisa ser executado se o outro aluno já tiver criado o banco; nesse caso, os nomes das colunas devem ser ajustados nas consultas de `api/`.

## Endpoints

- `GET api/pacotes.php`: lista pacotes ativos.
- `GET api/pacotes.php?id=rio`: busca um pacote.
- Filtros opcionais: `destino`, `cat` e `regiao`.
- `POST api/cadastro.php`: JSON `nome`, `email`, `senha`; grava em `usuarios` (senha com `password_hash`) como `cliente` e já inicia a sessão.
- `POST api/login.php`: JSON `email`, `senha`; valida com `password_verify`, inicia a sessão `comparatrip` e registra o acesso na tabela `logins`.
- `POST api/logout.php`: encerra a sessão.
- `GET api/sessao.php`: devolve o usuário logado ou `null`.
- `GET api/reservas.php`: exige sessão; cliente vê apenas as próprias reservas e admin vê todas.
- `GET api/reservas.php?codigo=CT...`: busca por código, respeitando a mesma permissão.
- `PATCH api/reservas.php`: exige admin e JSON com `codigo` e `status` (`pendente`, `pago` ou `cancelado`).

O `api/login.php` e o `api/cadastro.php` já iniciam a sessão PHP `comparatrip` e gravar:

```php
$_SESSION['usuario'] = [
    'id' => $usuario['id'],
    'nome' => $usuario['nome'],
    'papel' => $usuario['papel'], // cliente ou admin
];
```

## Publicação

Copie a pasta do site inteira para o servidor PHP e abra `index.html` pelo endereço do servidor. A pasta `backend/` já está dentro dela; o `backend/.htaccess` bloqueia o acesso direto a ela em servidores Apache, e o `bootstrap.php` também recusa ser aberto diretamente. O preview da Lovable executa JavaScript, mas não executa PHP nem MySQL; teste a conexão real no servidor PHP da equipe.
