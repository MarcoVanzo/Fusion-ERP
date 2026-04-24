<?php
require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? '';
$port = $_ENV['DB_PORT'] ?? 3306;
$db   = $_ENV['DB_NAME'] ?? '';
$user = $_ENV['DB_USER'] ?? '';
$pass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    echo "Connesso al database.\\n";

    // 1. Aggiungi colonne singolarmente (ignora errore 1060 Duplicate column)
    $columns = [
        "ADD COLUMN `status` ENUM('Attivo', 'Invitato', 'Disattivato') DEFAULT 'Attivo'",
        "ADD COLUMN `blocked` TINYINT(1) DEFAULT 0",
        "ADD COLUMN `failed_attempts` INT DEFAULT 0",
        "ADD COLUMN `must_change_password` TINYINT(1) DEFAULT 0",
        "ADD COLUMN `verification_token` VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN `token_expires_at` DATETIME DEFAULT NULL"
    ];

    foreach ($columns as $colSql) {
        try {
            $pdo->exec("ALTER TABLE `users` " . $colSql);
            echo "Aggiunta colonna: " . strtok(str_replace("ADD COLUMN `", "", $colSql), "`") . "\\n";
        } catch (PDOException $e) {
            if ($e->getCode() == '42S21') { // 1060 Duplicate column
                echo "Colonna già presente: " . strtok(str_replace("ADD COLUMN `", "", $colSql), "`") . "\\n";
            } else {
                throw $e;
            }
        }
    }

    // 2. Allinea is_active a status
    $pdo->exec("UPDATE `users` SET `status` = 'Attivo' WHERE `is_active` = 1 AND `status` != 'Attivo'");
    $pdo->exec("UPDATE `users` SET `status` = 'Disattivato' WHERE `is_active` = 0 AND `status` != 'Disattivato'");
    echo "Stato utenti allineato.\\n";

    // 3. Crea la tabella password_history
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `password_history` (
          `id`         INT AUTO_INCREMENT PRIMARY KEY,
          `user_id`    VARCHAR(20) NOT NULL,
          `pwd_hash`   VARCHAR(255) NOT NULL,
          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          KEY `idx_pwdhist_user` (`user_id`),
          KEY `idx_pwdhist_created` (`created_at`),
          CONSTRAINT `fk_pwdhist_user` FOREIGN KEY (`user_id`)
              REFERENCES `users`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Tabella password_history verificata/creata.\\n";

    // 4. Marca la migrazione come eseguita
    $stmt = $pdo->prepare("SELECT 1 FROM migrations WHERE filename = 'V124__unify_auth_to_mv_erp.sql'");
    $stmt->execute();
    if (!$stmt->fetchColumn()) {
        $pdo->exec("INSERT INTO migrations (filename, executed_at) VALUES ('V124__unify_auth_to_mv_erp.sql', NOW())");
        echo "Migrazione V124 segnata come completata.\\n";
    } else {
        echo "Migrazione V124 già presente nella tabella migrations.\\n";
    }

    echo "TUTTO OK!\\n";

} catch (Exception $e) {
    echo "ERRORE DB: " . $e->getMessage() . "\\n";
}
