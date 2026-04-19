<?php
$roles = [
    'readonly'   => 0,
    'atleta'     => 1,
    'operatore'  => 2,
    'operator'   => 2,
    'allenatore' => 3,
    'social media manager' => 4,
    'admin'      => 5,
];

$requestedRole = $_GET['role'] ?? 'allenatore';
$userLevel = $roles[$requestedRole] ?? 0;
$minLevel = $roles['operator'];

if ($userLevel < $minLevel) {
    echo "Permessi insufficienti\n";
} else {
    echo "Permesso accordato!\n";
}
