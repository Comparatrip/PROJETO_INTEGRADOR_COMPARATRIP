<?php

declare(strict_types=1);
require_once dirname(__DIR__) . '/backend/bootstrap.php';

requireMethod('GET');

$user = currentUser();
respond(['dados' => empty($user['id']) ? null : $user]);
