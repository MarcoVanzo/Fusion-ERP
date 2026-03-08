-- V044__import_staff.sql
-- Import iniziale staff tecnico da file Allenatori.xlsx
-- Usa ON DUPLICATE KEY UPDATE per essere idempotente

SET @tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1);

INSERT INTO staff_members (id, tenant_id, first_name, last_name, role, birth_date, phone, email)
VALUES
  (SUBSTR(MD5(CONCAT(@tenant_id,'Marco','Vanzo','Primo Allenatore')),1,20),       @tenant_id, 'Marco',      'Vanzo',       'Primo Allenatore',    '1979-11-28', '3470800161', 'direttoretecnico@fusionteamvolley.it'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Carlo','Chieco','Secondo Allenatore')),1,20),    @tenant_id, 'Carlo',      'Chieco',      'Secondo Allenatore',  '1972-08-09', '3468040690', 'carloKie@libero.it'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Stefano','Cietto','Secondo Allenatore')),1,20),  @tenant_id, 'Stefano',    'Cietto',      'Secondo Allenatore',  '1991-08-07', '3382986338', 'Ciettos00@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Jacopo','Micheli','Secondo Allenatore')),1,20),  @tenant_id, 'Jacopo',     'Micheli',     'Secondo Allenatore',  '2001-02-23', '3703007815', 'jacopomicheli23@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Marco','Cedolini','Secondo Allenatore')),1,20),  @tenant_id, 'Marco',      'Cedolini',    'Secondo Allenatore',  NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Nicola','Martignago','Primo Allenatore')),1,20), @tenant_id, 'Nicola',     'Martignago',  'Primo Allenatore',    '1996-02-13', '3348062321', 'nico.martignago96@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Catiuscia','Bazzi','Secondo Allenatore')),1,20), @tenant_id, 'Catiuscia',  'Bazzi',       'Secondo Allenatore',  '1972-01-20', '3384516769', 'katiusciabazzi@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Alessia','Carraro','Secondo Allenatore')),1,20), @tenant_id, 'Alessia',    'Carraro',     'Secondo Allenatore',  '2003-12-17', '3458233995', 'alessiacarraro10@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Nicol','Pellizzari','Secondo Allenatore')),1,20),@tenant_id, 'Nicolò',     'Pellizzari',  'Secondo Allenatore',  '2006-02-20', '3664394242', 'nicolopellizzari4@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Irene','Girotto','Preparatore Atletico')),1,20), @tenant_id, 'Irene',      'Girotto',     'Preparatore Atletico','2001-04-10', '3425900866', 'girottoirene01@gmail.com'),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Claudio','Pavanello','Fisioterapista')),1,20),   @tenant_id, 'Claudio',    'Pavanello',   'Fisioterapista',       NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Simone','Vergano','Fisioterapista')),1,20),      @tenant_id, 'Simone',     'Vergano',     'Fisioterapista',       NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Nicola','Bragato','Dirigente')),1,20),           @tenant_id, 'Nicola',     'Bragato',     'Dirigente',            NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Chantal','Pollon','Dirigente')),1,20),           @tenant_id, 'Chantal',    'Pollon',      'Dirigente',            NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Alessandro','Gobbo','Dirigente')),1,20),         @tenant_id, 'Alessandro', 'Gobbo',       'Dirigente',            NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Francesco','Donnarumma','Dirigente')),1,20),     @tenant_id, 'Francesco',  'Donnarumma',  'Dirigente',            NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Alessia','Carraro','Addetta Stampa')),1,20),     @tenant_id, 'Alessia',    'Carraro',     'Addetta Stampa',       NULL,         NULL,         NULL),
  (SUBSTR(MD5(CONCAT(@tenant_id,'Alessio','Carraro','Preparatore Atletico')),1,20),@tenant_id,'Alessio',    'Carraro',     'Preparatore Atletico', NULL,         NULL,         NULL)
ON DUPLICATE KEY UPDATE
  role       = VALUES(role),
  birth_date = VALUES(birth_date),
  phone      = VALUES(phone),
  email      = VALUES(email);
