-- MySQL dump 10.13  Distrib 9.6.0, for macos26.2 (arm64)
--
-- Host: localhost    Database: fusion_dev
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '1c2540ac-1b2d-11f1-a507-f6a450a651a3:1-2109';

--
-- Table structure for table `acwr_alerts`
--

DROP TABLE IF EXISTS `acwr_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acwr_alerts` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `acwr_score` decimal(6,4) NOT NULL,
  `risk_level` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `log_date` date NOT NULL,
  `ack_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ack_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alerts_athlete` (`athlete_id`),
  KEY `idx_alerts_date` (`log_date`),
  KEY `idx_alerts_risk` (`risk_level`),
  KEY `fk_alerts_ack` (`ack_by`),
  CONSTRAINT `fk_alerts_ack` FOREIGN KEY (`ack_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_alerts_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acwr_alerts`
--

LOCK TABLES `acwr_alerts` WRITE;
/*!40000 ALTER TABLE `acwr_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `acwr_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_summaries`
--

DROP TABLE IF EXISTS `ai_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_summaries` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `summary_text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_athlete` (`athlete_id`),
  CONSTRAINT `fk_ai_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_summaries`
--

LOCK TABLES `ai_summaries` WRITE;
/*!40000 ALTER TABLE `ai_summaries` DISABLE KEYS */;
INSERT INTO `ai_summaries` VALUES ('SUM_15df0799','ATH_848ea150','2026-02-03','2026-03-05','Impossibile generare il riepilogo AI al momento. Riprovare più tardi.','gemini-2.0-flash','2026-03-05 22:26:05','2026-03-05 22:26:05'),('SUM_3ac44be6','ATH_848ea150','2026-02-03','2026-03-05','Impossibile generare il riepilogo AI al momento. Riprovare più tardi.','gemini-2.0-flash','2026-03-05 00:32:05','2026-03-05 00:32:05'),('SUM_e91e9def','ATH_eeb5e1aa','2026-02-05','2026-03-07','Impossibile generare il riepilogo AI al momento. Riprovare più tardi.','gemini-2.0-flash','2026-03-07 00:15:31','2026-03-07 00:15:31');
/*!40000 ALTER TABLE `ai_summaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `athlete_documents`
--

DROP TABLE IF EXISTS `athlete_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `athlete_documents` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `doc_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `upload_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiry_date` date DEFAULT NULL,
  `uploaded_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_athlete` (`athlete_id`),
  KEY `idx_doc_tenant` (`tenant_id`),
  KEY `idx_doc_type` (`doc_type`),
  KEY `idx_doc_expiry` (`expiry_date`),
  KEY `idx_doc_deleted` (`deleted_at`),
  KEY `fk_doc_uploader` (`uploaded_by`),
  CONSTRAINT `fk_doc_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `athlete_documents`
--

LOCK TABLES `athlete_documents` WRITE;
/*!40000 ALTER TABLE `athlete_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `athlete_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `athlete_teams`
--

DROP TABLE IF EXISTS `athlete_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `athlete_teams` (
  `athlete_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_season_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`athlete_id`,`team_season_id`),
  KEY `idx_athlete_teams_athlete` (`athlete_id`),
  KEY `fk_at_team_season` (`team_season_id`),
  CONSTRAINT `fk_at_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_at_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `athlete_teams`
--

LOCK TABLES `athlete_teams` WRITE;
/*!40000 ALTER TABLE `athlete_teams` DISABLE KEYS */;
INSERT INTO `athlete_teams` VALUES ('ATH_10c7379a','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_15ba0c86','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_19075f16','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_1a873329','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_1d15384e','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_28b06dd4','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_2f6c59b4','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_4530391f','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_4ab010e6','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_54db9a34','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_5b77e11e','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_5bba3b0d','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_5f38e64f','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_637bf272','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_672853f8','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_6ab8039f','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_6ea16536','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_6fca54e6','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_7188f043','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_737bcf9d','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_7b202bcb','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_7df0509e','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_7fbe27d7','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_7ff67290','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_812b19d1','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_8411262d','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_848ea150','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_8c0b5d87','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_8dc7b566','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_8ec56b3e','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_95f24a3d','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_9f83cf89','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_a0060822','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_a14fbe0c','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_a1639d48','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_a389559c','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_b134c938','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_b168cd8c','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_b2dae3c0','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_c0577c82','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_c16fcee1','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_c7053ff9','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_d73ce862','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_d7d0f473','TS_329e0ff21d9511f','2026-03-11 21:55:13'),('ATH_da3d068c','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_e21e52aa','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_e35f4884','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_e4095e31','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_e5a4103c','TS_329e05c01d9511f','2026-03-11 21:55:13'),('ATH_e9dc61c0','TS_329e120e1d9511f','2026-03-11 21:55:13'),('ATH_eeb5e1aa','TS_329e0cdc1d9511f','2026-03-11 21:55:13'),('ATH_f4016c19','TS_329e0ff21d9511f','2026-03-11 21:55:13');
/*!40000 ALTER TABLE `athlete_teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `athletes`
--

DROP TABLE IF EXISTS `athletes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `athletes` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `team_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (concat(coalesce(`first_name`,_utf8mb4''),_utf8mb4' ',coalesce(`last_name`,_utf8mb4''))) STORED,
  `jersey_number` tinyint DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `height_cm` smallint DEFAULT NULL,
  `weight_kg` decimal(5,1) DEFAULT NULL,
  `photo_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_contact` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `communication_preference` enum('WHATSAPP','EMAIL','SMS','PUSH') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'EMAIL',
  `image_release_consent` tinyint(1) NOT NULL DEFAULT '0',
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residence_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residence_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nationality` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allergies` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `medications` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `identity_document` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_code` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_form_signed` tinyint(1) DEFAULT NULL,
  `shirt_size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shoe_size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_cert_expires_at` date DEFAULT NULL,
  `medical_cert_file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_cert_issued_at` date DEFAULT NULL,
  `medical_cert_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `privacy_consent_signed` tinyint(1) DEFAULT NULL,
  `federal_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `vald_athlete_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_athletes_team` (`team_id`),
  KEY `idx_athletes_deleted_at` (`deleted_at`),
  KEY `idx_athletes_fiscal_code` (`fiscal_code`),
  KEY `idx_athletes_email` (`email`),
  KEY `fk_athletes_user` (`user_id`),
  KEY `idx_athletes_tenant` (`tenant_id`),
  KEY `idx_athletes_vald_id` (`vald_athlete_id`),
  CONSTRAINT `fk_athletes_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_athletes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `athletes`
--

LOCK TABLES `athletes` WRITE;
/*!40000 ALTER TABLE `athletes` DISABLE KEYS */;
INSERT INTO `athletes` (`id`, `tenant_id`, `user_id`, `team_id`, `first_name`, `last_name`, `jersey_number`, `role`, `birth_date`, `birth_place`, `height_cm`, `weight_kg`, `photo_path`, `parent_contact`, `parent_phone`, `emergency_contact_name`, `emergency_contact_phone`, `communication_preference`, `image_release_consent`, `phone`, `email`, `residence_address`, `residence_city`, `nationality`, `blood_group`, `allergies`, `medications`, `identity_document`, `fiscal_code`, `registration_form_signed`, `shirt_size`, `shoe_size`, `medical_cert_expires_at`, `medical_cert_file_path`, `medical_cert_issued_at`, `medical_cert_type`, `privacy_consent_signed`, `federal_id`, `is_active`, `deleted_at`, `created_at`, `updated_at`, `vald_athlete_id`) VALUES ('ATH_10c7379a','TNT_default',NULL,'TEAM_u18a','Giulia','Ricca',NULL,'Palleggiatrice','2008-03-30','Firenze',NULL,NULL,'uploads/athlete_photos/ATH_10c7379a.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Pier Capponi, 44','Firenze',NULL,NULL,NULL,NULL,'CA484370LM','RCCGLI08C70D612B',NULL,'M',NULL,'2026-08-06',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_15ba0c86','TNT_default',NULL,'TEAM_u14a','Lavinia','Vidori',NULL,'Schiacciatrice','2012-11-26','Feltre (Belluno)',NULL,NULL,'uploads/athlete_photos/ATH_15ba0c86.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Zoppette, 19','Vidor (TV)',NULL,NULL,NULL,NULL,'CA67603NI','VDRLVN12S66D530G',NULL,'S',NULL,'2026-08-11',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_19075f16','TNT_default',NULL,'TEAM_u14a','Aurora','Memo',NULL,'Schiacciatrice','2012-07-16','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_19075f16.png',NULL,NULL,NULL,NULL,'EMAIL',0,'342 3869576',NULL,'Sestiere San Paolo, 1192','Venezia',NULL,NULL,NULL,NULL,'CA08109KX','MMERRA12L56L736G',NULL,'S',NULL,'2026-06-17',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_1a873329','TNT_default',NULL,'TEAM_u13a','Beatrice','Golfetto',NULL,'Universale','2013-01-20','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_1a873329.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Milano, 11','Mirano (VE)',NULL,NULL,NULL,NULL,'CA86936NJ','GLFBRC13A60F241X',NULL,NULL,NULL,'2026-10-05',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_1d15384e','TNT_default',NULL,'TEAM_u16a','Greta','Vedoato',NULL,'Centrale','2011-08-16','Camposampiero (Padova)',NULL,NULL,'uploads/athlete_photos/ATH_1d15384e.png',NULL,NULL,NULL,NULL,'EMAIL',0,'339 7196760',NULL,'Via Frassinelli, 65','Martellago (VE)',NULL,NULL,NULL,NULL,'CA12508MN','VDTGRT11M56B563W',NULL,'M',NULL,'2026-08-28',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_28b06dd4','TNT_default',NULL,'TEAM_u13a','Giada','Donnaruma',NULL,'Universale','2013-01-17','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_28b06dd4.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Enrico Toti, 18, 30030 Olmo VE, Italia','Martellago (VE)',NULL,NULL,NULL,NULL,'CA54133MF','DNNGDI13A57L736D',NULL,NULL,NULL,'2026-09-30',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_2f6c59b4','TNT_default',NULL,'TEAM_u13a','Ambra','Stefan',NULL,'Universale','2014-02-21','Mira (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_2f6c59b4.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Marche, 2, 30174 Venezia VE, Italia','Venezia',NULL,NULL,NULL,NULL,'CA53497SF','STFMBR14B61F241T',NULL,NULL,NULL,'2026-08-12',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_4530391f','TNT_default',NULL,'TEAM_u13a','Giorgia','Marchioro',NULL,'Universale','2013-02-19','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_4530391f.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Luigi Meneghello, 91','Mirano (VE)',NULL,NULL,NULL,NULL,'CA82396OA','MRCGRG13B59F241Z',NULL,'S',NULL,'2026-12-18',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_4ab010e6','TNT_default',NULL,'TEAM_u13a','Alison','Gianni',NULL,'Universale','2013-06-30','Montebelluna (Treviso)',NULL,NULL,'uploads/athlete_photos/ATH_4ab010e6.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Fra\' Giocondo, 12','Pederobba (TV)',NULL,NULL,NULL,NULL,'CA25510MH','GNNLSN13H70F443H',NULL,'S',NULL,'2026-07-27',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_54db9a34','TNT_default',NULL,'TEAM_u14a','Benedetta','Danieli',NULL,NULL,'2013-04-13','Montebelluna (Treviso)',NULL,NULL,'uploads/athlete_photos/ATH_54db9a34.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Regina Cornaro, 27','Caerano di San Marco (TV)',NULL,NULL,NULL,NULL,'CA70737QK','DNLBDT13D53F443U',NULL,'S',NULL,'2026-10-14',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_5b77e11e','TNT_default',NULL,'TEAM_u16a','Erika','Ballarin',NULL,'Schiacciatrice','2011-02-01','Camposampiero (Padova)',NULL,NULL,'uploads/athlete_photos/ATH_5b77e11e.png',NULL,NULL,NULL,NULL,'EMAIL',0,'328 148 0324',NULL,'Via Antonio Pacinotti, 36','Trebaseleghe (PD)',NULL,NULL,NULL,NULL,'CA82634LN','BLLRKE11B41B563S',NULL,NULL,NULL,'2026-07-23',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_5bba3b0d','TNT_default',NULL,'TEAM_u18a','Teresa','Greco',NULL,'Schiacciatrice','2009-07-09','Rimini',NULL,NULL,'uploads/athlete_photos/ATH_5bba3b0d.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via San Giovenale, 8','Rimini',NULL,NULL,NULL,NULL,'CA859203WK','GRCMTR09L49H294T',NULL,'L',NULL,'2026-12-29',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_5f38e64f','TNT_default',NULL,'TEAM_u16a','Celeste','Coppola',NULL,'Centrale','2010-06-07','Genova',NULL,NULL,'uploads/athlete_photos/ATH_5f38e64f.png',NULL,NULL,NULL,NULL,'EMAIL',0,'351 5145025',NULL,'Via Svevo I, 5','Santa Maria di Sala (VE)',NULL,NULL,NULL,NULL,'CA43738HC','CPPCST10H47D969P',NULL,'M',NULL,'2026-08-06',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_637bf272','TNT_default',NULL,'TEAM_u18a','Aurora','Tombolato',NULL,'Palleggiatrice','2009-07-25','Castelfranco Veneto (Treviso)',NULL,NULL,'uploads/athlete_photos/ATH_637bf272.png',NULL,NULL,NULL,NULL,'EMAIL',0,'338 424 1305',NULL,'Via Tombolata, 67','Galliera Veneta (PD)',NULL,NULL,NULL,NULL,'CA67658SV','TMBRRA09L65C111J',NULL,'L',NULL,'2026-07-31',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_672853f8','TNT_default',NULL,'TEAM_u16a','Ginevra','Rampin',NULL,'Libero','2010-06-24','Padova',NULL,NULL,'uploads/athlete_photos/ATH_672853f8.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Due Giugno, 13','Selvazzano Dentro (PD)',NULL,NULL,NULL,NULL,'CA45936MT','RMPGVR10H64G224G',NULL,'M',NULL,'2026-08-05',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_6ab8039f','TNT_default',NULL,'TEAM_u14a','Emma','Bertoldo',NULL,NULL,'2012-09-07','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_6ab8039f.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Pietro Mascagni, 8','Mirano (VE)',NULL,NULL,NULL,NULL,'CA06260QL','BRTMME12P47F241B',NULL,'S',NULL,'2027-01-20',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_6ea16536','TNT_default',NULL,'TEAM_u14a','Benedetta','Guizzo',NULL,'Schiacciatrice','2012-06-27','Montebelluna (Treviso)',NULL,NULL,'uploads/athlete_photos/ATH_6ea16536.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Vi Fratelli Guardi, 55','Volpago del Montello (TV)',NULL,NULL,NULL,NULL,'CA25587SR','GZZBDT12H67F443B',NULL,'S',NULL,'2026-07-22',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_6fca54e6','TNT_default',NULL,'TEAM_u18a','Carlotta','Gallon',NULL,'Schiacciatrice','2008-08-06','Vittorio Veneto (Treviso)',NULL,NULL,'uploads/athlete_photos/ATH_6fca54e6.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Monte Grappa, 131','Pieve di Soligo (TV)',NULL,NULL,NULL,NULL,'CA98768TF','GLLCLT08M46M089N',NULL,'M',NULL,'2026-05-19',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_7188f043','TNT_default',NULL,'TEAM_u13a','Gloria','Betterle',NULL,'Universale','2013-08-20','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_7188f043.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Antonio Baldissera (Carpenedo), 10','Venezia',NULL,NULL,NULL,NULL,'CA27162QA','BTTGLR13M60L736E',NULL,NULL,NULL,'2026-09-16',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_737bcf9d','TNT_default',NULL,'TEAM_u14a','Evelyne','Ceccato',NULL,'Schiacciatrice','2012-01-01','Treviso',NULL,NULL,'uploads/athlete_photos/ATH_737bcf9d.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via G.Cornelio Graziano, 10','Treviso',NULL,NULL,NULL,NULL,'CA06847NZ','CCCVYN12A41L407K',NULL,'S',NULL,'2026-09-29',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_7b202bcb','TNT_default',NULL,'TEAM_u16a','Linda ','Bastianello',NULL,'Palleggiatrice','2011-07-17','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_7b202bcb.png',NULL,NULL,NULL,NULL,'EMAIL',0,'349 816 6452',NULL,'Via Quasimodo, 10','Santa Maria di Sala (VE)',NULL,NULL,NULL,NULL,'CA43791TD','BSTLND11L57F241D',NULL,'S',NULL,'2026-12-04',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_7df0509e','TNT_default',NULL,'TEAM_u13a','Laura','Bianchin',NULL,'Universale','2013-04-27','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_7df0509e.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Veneto, 42','Martellago (VE)',NULL,NULL,NULL,NULL,'CA41073TC','BNCLRA13D67F241G',NULL,NULL,NULL,'2026-12-09',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_7fbe27d7','TNT_default',NULL,'TEAM_u18a','Melissa ','Malagnini',NULL,'Libero','2008-02-16','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_7fbe27d7.png',NULL,NULL,NULL,NULL,'EMAIL',0,'331 3422910',NULL,'Via Ferrara 12 ','Noale (VE)',NULL,NULL,NULL,NULL,'CA41527RL','MLGMSS08B56F241Z',NULL,'M',NULL,'2026-12-02',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_7ff67290','TNT_default',NULL,'TEAM_u13a','Beatrice','Tomaello',NULL,'Universale','2013-07-26','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_7ff67290.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via della Vittoria, 163','Mirano (VE)',NULL,NULL,NULL,NULL,'CA73897SY','TMLBRC13L66F241F',NULL,'M',NULL,'2026-07-22',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_812b19d1','TNT_default',NULL,'TEAM_u13a','Rachele','Lionetti',NULL,'Universale','2013-04-25','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_812b19d1.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via San Mattia (Favaro), 3','Venezia',NULL,NULL,NULL,NULL,'CA62762QO','LNTRHL13D65L736V',NULL,'S',NULL,'2026-11-12',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_8411262d','TNT_default',NULL,'TEAM_u14a','Martina','Talpo',NULL,'Libero','2012-10-01','Carpenedo (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_8411262d.png',NULL,NULL,NULL,NULL,'EMAIL',0,'348 0128649',NULL,'Via Enrico de Nicola, 14','Venezia',NULL,NULL,NULL,NULL,'CA48185PI','TLPMTN12R41L736X',NULL,'S',NULL,'2026-08-26',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_848ea150','TNT_default',NULL,'TEAM_u16a','Adele','Smaniotto',NULL,'Schiacciatrice','2011-08-27','Castelfranco Veneto (Treviso)',NULL,NULL,'uploads/athlete_photos/ATH_848ea150.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via La Rocca, 4','Zero Branco (TV)',NULL,NULL,NULL,NULL,'CA46047MS','SMNDLA11M67C111S',NULL,'M',NULL,'2026-07-20',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_8c0b5d87','TNT_default',NULL,'TEAM_u16a','Elisa','Nepitali',NULL,'Schiacciatrice','2010-10-12','Camposampiero (Padova)',NULL,NULL,'uploads/athlete_photos/ATH_8c0b5d87.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Enrico Fermi, 5/1','Piombino Dese (PD)',NULL,NULL,NULL,NULL,'CA10425JD','NPTLSE10R52B563R',NULL,'L',NULL,'2026-11-06',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_8dc7b566','TNT_default',NULL,'TEAM_u18a','Sofia','Milazzi',NULL,'Centrale','2009-11-13','Trieste',NULL,NULL,'uploads/athlete_photos/ATH_8dc7b566.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Ermano Toneatti, 8','Trieste',NULL,NULL,NULL,NULL,'CA07936KN','MLZSFO09S53L424G',NULL,'M',NULL,'2027-02-22',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_8ec56b3e','TNT_default',NULL,'TEAM_u16a','Esther','Chiarato',NULL,'Libero','2011-08-07','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_8ec56b3e.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Rielta, 74','Carpenedo (VE)',NULL,NULL,NULL,NULL,'CA57885WC','CHRSHR11M47L736C',NULL,NULL,NULL,'2026-08-25',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_95f24a3d','TNT_default',NULL,'TEAM_u18a','Margherita','Coretti',NULL,'Schiacciatrice','2009-04-10','Trieste',NULL,NULL,'uploads/athlete_photos/ATH_95f24a3d.png',NULL,NULL,NULL,NULL,'EMAIL',0,'349 594 8796',NULL,'Strada di Rozzol, 131 01','Trieste',NULL,NULL,NULL,NULL,'CA08979RW','CRTMGH09D50L424U',NULL,'M',NULL,'2026-12-01',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_9f83cf89','TNT_default',NULL,'TEAM_u18a','Gioia','Laurenti',NULL,'Schiacciatrice','2008-05-25','Adria (Rovigo)',NULL,NULL,'uploads/athlete_photos/ATH_9f83cf89.png',NULL,NULL,NULL,NULL,'EMAIL',0,'320 642 7861',NULL,'Via Montale 24','Porto Viro (RO)',NULL,NULL,NULL,NULL,'CA57896VL','LRNGIO08E65A059O',NULL,'M',NULL,'2026-06-15',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_a0060822','TNT_default',NULL,'TEAM_u18a','Chiara','Muzi',NULL,'Schiacciatrice','2009-11-02','Ancona',NULL,NULL,'uploads/athlete_photos/ATH_a0060822.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Pieve di Cadore, 8','Falconara Marittima (AN)',NULL,NULL,NULL,NULL,'CA03430TU','MZUCHR09S42A271I',NULL,'M',NULL,'2026-08-13',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_a14fbe0c','TNT_default',NULL,'TEAM_u14a','Leda','Naletto',NULL,'Centrale','2012-02-23','Mirano (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_a14fbe0c.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Santa Lucia, 12','Santa Maria di Sala (VE)',NULL,NULL,NULL,NULL,'CA82591LK','NLTLVL12B63F241C',NULL,'S',NULL,'2026-09-17',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_a1639d48','TNT_default',NULL,'TEAM_u16a','Agata','Pirolo',NULL,'Schiacciatrice','2011-04-09','Camposampiero (Padova)',NULL,NULL,'uploads/athlete_photos/ATH_a1639d48.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Pignan, 13/1','Piombino Dese (PD)',NULL,NULL,NULL,NULL,'CA78533GR','PRLGTA11D49B563A',NULL,'M',NULL,'2027-01-11',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_a389559c','TNT_default',NULL,'TEAM_u13a','Zoe','Libralesso',NULL,'Universale','2013-07-21','Treviso',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Bastioni San Paolo, 4','Treviso',NULL,NULL,NULL,NULL,'CA79275QE','GLFBRC13A60F241X',NULL,'S',NULL,'2026-12-18',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-05 22:44:13',NULL),('ATH_b134c938','TNT_default',NULL,'TEAM_u13a','Carlotta','Mazzel',NULL,'Universale','2014-06-30','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_b134c938.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Ronzinella 168 A','Mogliano Veneto (VE)',NULL,NULL,NULL,NULL,'CA41669HW','MZZCLT14H70L736K',NULL,NULL,NULL,'2027-01-20',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_b168cd8c','TNT_default',NULL,'TEAM_u14a','Giada','Stefan',NULL,'Schiacciatrice','2012-05-28','Mira (Venezia)',NULL,NULL,'uploads/athlete_photos/ATH_b168cd8c.png',NULL,NULL,NULL,NULL,'EMAIL',0,'348 9347834',NULL,'Via Marche, 2, 30174 Venezia VE, Italia','Venezia',NULL,NULL,NULL,NULL,'CA77556JY','STFGDI12E68F241L',NULL,NULL,NULL,'2026-10-28',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_b2dae3c0','TNT_default',NULL,'TEAM_u14a','Beatrice','Bertato',NULL,'Palleggiatrice','2012-10-13','Treviso',NULL,NULL,'uploads/athlete_photos/ATH_b2dae3c0.png',NULL,NULL,NULL,NULL,'EMAIL',0,'349 1776078',NULL,'Via Spigariola, 2/c','Treviso',NULL,NULL,NULL,NULL,'CA75956MD','BRTBRC12R53L407X',NULL,'M',NULL,'2026-08-25',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_c0577c82','TNT_default',NULL,'TEAM_u16a','Gioia Rita','Squizzato',NULL,'Centrale','2010-11-24','Camposampiero (Padova)',NULL,NULL,'uploads/athlete_photos/ATH_c0577c82.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Ronchi, 123','Loreggia (PD)',NULL,NULL,NULL,NULL,'CA87344KW','SQZGRT10S64B563I',NULL,NULL,NULL,'2026-09-30',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_c16fcee1','TNT_default',NULL,'TEAM_u16a','Emma','Romanel',NULL,'Centrale','2011-07-26','Udine',NULL,NULL,'uploads/athlete_photos/ATH_c16fcee1.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via E. Feletti, 22','Colle Umberto (TV)',NULL,NULL,NULL,NULL,'CA49010VU','RMNMME11L66L483F',NULL,NULL,NULL,'2026-05-11',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_c7053ff9','TNT_default',NULL,'TEAM_u16a','Elena','Barsotti',NULL,'Schiacciatrice','2011-06-26','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_c7053ff9.png',NULL,NULL,NULL,NULL,'EMAIL',0,'328 298 3513',NULL,'Via Lombardia, 10','Martellago (VE)',NULL,NULL,NULL,NULL,'CA89609PY','BRSLNE11H66L736T',NULL,'M',NULL,'2026-01-28',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_d73ce862','TNT_default',NULL,'TEAM_u13a','Valentina','Pavan',NULL,'Universale','2013-08-06','Treviso',NULL,NULL,'uploads/athlete_photos/ATH_d73ce862.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Silvano Schiavon, 36','Zero Branco (TV)',NULL,NULL,NULL,NULL,'CA93504TJ','PVNVNT13M46L407Z',NULL,'S',NULL,'2026-09-01',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_d7d0f473','TNT_default',NULL,'TEAM_u16a','Djeneba Kadidiatou','Compaore',NULL,'Schiacciatrice','2011-08-22','Gallarate (Varese)',NULL,NULL,'uploads/athlete_photos/ATH_d7d0f473.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Col di Lana','Orago (VA)',NULL,NULL,NULL,NULL,'CA14511IV','CMPDNB11M62D869T',NULL,NULL,NULL,'2026-10-12',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_da3d068c','TNT_default',NULL,'TEAM_u13a','Bianca','Scodellaro',NULL,'Universale','2013-11-12','Roma',NULL,NULL,'uploads/athlete_photos/ATH_da3d068c.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Rivalta, 20','Casale sul Sile (TV)',NULL,NULL,NULL,NULL,'CA36535OR','SCDBNC13S52H501L',NULL,'S',NULL,'2026-09-08',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_e21e52aa','TNT_default',NULL,'TEAM_u18a','Ilenia','Dascola',NULL,'Schiacciatrice','2008-07-25','Reggio di Calabria (RC)',NULL,NULL,'uploads/athlete_photos/ATH_e21e52aa.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Piazza Fontana Rovagnese, 77','Reggio di Calabria (RC)',NULL,NULL,NULL,NULL,'CA89234WJ','DSCLNI08L65H224U',NULL,'M',NULL,'2026-08-10',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_e35f4884','TNT_default',NULL,'TEAM_u18a','Emma','Frau',NULL,'Schiacciatrice','2009-05-23','Cagliari',NULL,NULL,'uploads/athlete_photos/ATH_e35f4884.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Fryderyk Chopin, 7','Quartu Sant\'Elena (CA)',NULL,NULL,NULL,NULL,'CA17753VH','FRAMME09E63B354P',NULL,'M',NULL,'2026-03-26',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL),('ATH_e4095e31','TNT_default',NULL,'TEAM_u18a','Marta','Cigana',NULL,'Centrale','2008-12-23','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_e4095e31.png',NULL,NULL,NULL,NULL,'EMAIL',0,'392 3973019',NULL,'Via Sforza 4','Carpenedo (VE)',NULL,NULL,NULL,NULL,'CA32795QY','CGNMRT08T63L736W',NULL,'M',NULL,'2026-08-25',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-10 13:56:41',NULL),('ATH_e5a4103c','TNT_default',NULL,'TEAM_u13a','Margherita','Molin',NULL,'Universale','2013-06-29','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_e5a4103c.png',NULL,NULL,NULL,NULL,'EMAIL',0,NULL,NULL,'Via Castellana (Zelarino), 59','Venezia',NULL,NULL,NULL,NULL,'CA70715KU','MLNMGH13H69L736U',NULL,'S',NULL,'2026-09-22',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_e9dc61c0','TNT_default',NULL,'TEAM_u18a','Marta','Pirolo',NULL,'Centrale','2008-09-20','Camposampiero (Padova)',NULL,NULL,'uploads/athlete_photos/ATH_e9dc61c0.png',NULL,NULL,NULL,NULL,'EMAIL',0,'370 1257147',NULL,'Via Pignan, 13/1','Piombino Dese (PD)',NULL,NULL,NULL,NULL,'CA58938EK','PRLMRT08P60B563F',NULL,'M',NULL,'2026-11-02',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:40',NULL),('ATH_eeb5e1aa','TNT_default',NULL,'TEAM_u14a','Adele','Favaretto',NULL,'Centrale','2012-10-30','Venezia',NULL,62.6,'uploads/athlete_photos/ATH_eeb5e1aa.png',NULL,NULL,NULL,NULL,'EMAIL',0,'328 2481009',NULL,'Via Frassinelli, 57','Martellago (VE)',NULL,NULL,NULL,NULL,'CA51184PC','FVRDLA12R70L736J',NULL,'S',NULL,'2026-10-09',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-13 11:27:44',NULL),('ATH_f4016c19','TNT_default',NULL,'TEAM_u16a','Angelica','Olmesini',NULL,'Palleggiatrice','2011-12-31','Venezia',NULL,NULL,'uploads/athlete_photos/ATH_f4016c19.png',NULL,NULL,NULL,NULL,'EMAIL',0,'342 097 2777',NULL,'Via F. Zuccarelli, 19','Zelarino (VE)',NULL,NULL,NULL,NULL,'CA63077NW','LMSNLC11T71L736L',NULL,'L',NULL,'2026-03-12',NULL,NULL,NULL,NULL,NULL,1,NULL,'2026-03-02 22:10:03','2026-03-08 21:43:39',NULL);
/*!40000 ALTER TABLE `athletes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `athletic_metrics`
--

DROP TABLE IF EXISTS `athletic_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `athletic_metrics` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_date` date NOT NULL,
  `metric_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `measured_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_am_athlete_type` (`athlete_id`,`metric_type`,`record_date`),
  KEY `idx_am_tenant` (`tenant_id`),
  KEY `fk_am_measurer` (`measured_by`),
  CONSTRAINT `fk_am_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_am_measurer` FOREIGN KEY (`measured_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_am_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `athletic_metrics`
--

LOCK TABLES `athletic_metrics` WRITE;
/*!40000 ALTER TABLE `athletic_metrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `athletic_metrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'crud',
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `before_snapshot` json DEFAULT NULL,
  `after_snapshot` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_status` smallint DEFAULT '200',
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `json_entity_id` varchar(32) GENERATED ALWAYS AS (json_unquote(coalesce(json_extract(`after_snapshot`,_utf8mb4'$.athlete_id'),json_extract(`before_snapshot`,_utf8mb4'$.athlete_id')))) VIRTUAL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created_at` (`created_at`),
  KEY `idx_audit_table_record` (`table_name`,`record_id`),
  KEY `idx_audit_table_date` (`table_name`,`created_at`),
  KEY `idx_audit_json_entity` (`json_entity_id`,`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `role`, `action`, `event_type`, `table_name`, `record_id`, `before_snapshot`, `after_snapshot`, `ip_address`, `user_agent`, `http_status`, `details`, `created_at`, `updated_at`) VALUES ('AUD_01f23289',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_b78c2d1b8131',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260320_230019_BKP_b78c2d1b8131.zip\", \"filesize\": 69409, \"row_count\": 1457, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-21 00:00:19','2026-03-21 00:00:19'),('AUD_14aa118f','USR_37ecc843',NULL,NULL,'LOGIN','crud','users','USR_37ecc843',NULL,'{\"ip\": \"::1\"}','::1',NULL,200,NULL,'2026-03-08 21:41:35','2026-03-08 21:41:35'),('AUD_23fc0529','USR_37ecc843',NULL,NULL,'LOGIN','crud','users','USR_37ecc843',NULL,'{\"ip\": \"127.0.0.1\"}','127.0.0.1',NULL,200,NULL,'2026-03-11 23:09:00','2026-03-11 23:09:00'),('AUD_3632e083',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_fc0113d49720',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260316_230002_BKP_fc0113d49720.zip\", \"filesize\": 68506, \"row_count\": 1438, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-17 00:00:03','2026-03-17 00:00:03'),('AUD_3af3096d','USR_37ecc843',NULL,NULL,'LOGIN','crud','users','USR_37ecc843',NULL,'{\"ip\": \"127.0.0.1\"}','127.0.0.1',NULL,200,NULL,'2026-03-12 00:24:52','2026-03-12 00:24:52'),('AUD_3fce0899',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_b2dea9427929',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260319_230000_BKP_b2dea9427929.zip\", \"filesize\": 69165, \"row_count\": 1445, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-20 00:00:01','2026-03-20 00:00:01'),('AUD_45e09c14',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_327466a8a3a2',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260311_230102_BKP_327466a8a3a2.zip\", \"filesize\": 69922, \"row_count\": 1483, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-12 00:01:05','2026-03-12 00:01:05'),('AUD_4dfe147a','USR_37ecc843',NULL,NULL,'LOGIN','crud','users','USR_37ecc843',NULL,'{\"ip\": \"127.0.0.1\"}','127.0.0.1',NULL,200,NULL,'2026-03-12 00:30:35','2026-03-12 00:30:35'),('AUD_56ee26be','USR_37ecc843',NULL,NULL,'LOGIN','crud','users','USR_37ecc843',NULL,'{\"ip\": \"127.0.0.1\"}','127.0.0.1',NULL,200,NULL,'2026-03-11 23:00:31','2026-03-11 23:00:31'),('AUD_5b16e1be',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_4ff0208f216f',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260314_230016_BKP_4ff0208f216f.zip\", \"filesize\": 68251, \"row_count\": 1436, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-15 00:00:16','2026-03-15 00:00:16'),('AUD_6c6f9732','USR_37ecc843',NULL,NULL,'LOGIN','crud','users','USR_37ecc843',NULL,'{\"ip\": \"::1\"}','::1',NULL,200,NULL,'2026-03-08 21:41:50','2026-03-08 21:41:50'),('AUD_8159ecd9',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_91efcf9e85e0',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260313_230005_BKP_91efcf9e85e0.zip\", \"filesize\": 68122, \"row_count\": 1434, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-14 00:00:06','2026-03-14 00:00:06'),('AUD_a58592e3',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_3d3587f65517',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260309_230001_BKP_3d3587f65517.zip\", \"filesize\": 60475, \"row_count\": 1406, \"table_count\": 77}','0.0.0.0',NULL,200,NULL,'2026-03-10 00:00:01','2026-03-10 00:00:01'),('AUD_af367b37',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_77d67b568694',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260310_230000_BKP_77d67b568694.zip\", \"filesize\": 67446, \"row_count\": 1406, \"table_count\": 78}','0.0.0.0',NULL,200,NULL,'2026-03-11 00:00:01','2026-03-11 00:00:01'),('AUD_c5021848',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_4166e94ea2ed',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260318_230141_BKP_4166e94ea2ed.zip\", \"filesize\": 68948, \"row_count\": 1445, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-19 00:01:41','2026-03-19 00:01:41'),('AUD_e0d850c8',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_afe9e6a27315',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260312_230002_BKP_afe9e6a27315.zip\", \"filesize\": 70463, \"row_count\": 1483, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-13 00:00:02','2026-03-13 00:00:02'),('AUD_e75eec9b',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_c79d1ca034c1',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260317_230004_BKP_c79d1ca034c1.zip\", \"filesize\": 68817, \"row_count\": 1443, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-18 00:00:04','2026-03-18 00:00:04'),('AUD_f3d26ffd',NULL,NULL,NULL,'BACKUP','crud','backups','BKP_4f0b3a6f3ffd',NULL,'{\"source\": \"cron\", \"filename\": \"backup_20260315_230846_BKP_4f0b3a6f3ffd.zip\", \"filesize\": 68374, \"row_count\": 1438, \"table_count\": 91}','0.0.0.0',NULL,200,NULL,'2026-03-16 00:08:46','2026-03-16 00:08:46');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backups`
--

DROP TABLE IF EXISTS `backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backups` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `filesize` bigint NOT NULL DEFAULT '0',
  `tables_list` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_count` smallint NOT NULL DEFAULT '0',
  `row_count` int NOT NULL DEFAULT '0',
  `created_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ok','error') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ok',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `drive_file_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Google Drive file ID',
  `drive_uploaded_at` datetime DEFAULT NULL COMMENT 'Timestamp upload su Drive',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_backups_created_at` (`created_at`),
  KEY `idx_backups_drive` (`drive_file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backups`
--

LOCK TABLES `backups` WRITE;
/*!40000 ALTER TABLE `backups` DISABLE KEYS */;
INSERT INTO `backups` VALUES ('BKP_005f0d1fd255','backup_20260301_235442_BKP_005f0d1fd255.zip',14941,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',28,135,'USR_admin0001','ok',NULL,NULL,NULL,'2026-03-02 22:10:03'),('BKP_112ac0c5d792','backup_20260302_145134_BKP_112ac0c5d792.zip',18112,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"tasks\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',29,135,'USR_admin0001','ok',NULL,'1hm7d9cSqdleWkys6gDblPgH8uvmWm_EH','2026-03-02 14:51:40','2026-03-02 22:10:03'),('BKP_327466a8a3a2','backup_20260311_230102_BKP_327466a8a3a2.zip',69922,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1483,NULL,'ok','Cron automatico',NULL,NULL,'2026-03-12 00:01:04'),('BKP_3d3587f65517','backup_20260309_230001_BKP_3d3587f65517.zip',60475,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',77,1406,NULL,'ok','Cron automatico','19HryiVXwms5UR3WZp7HSRDZhoA8Tn_HW','2026-03-10 00:00:06','2026-03-10 00:00:01'),('BKP_4166e94ea2ed','backup_20260318_230141_BKP_4166e94ea2ed.zip',68948,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1445,NULL,'ok','Cron automatico','1q2CiQ8fjl83QfIbMLfRx8SuH9mOrVwZi','2026-03-19 00:01:46','2026-03-19 00:01:41'),('BKP_4f0b3a6f3ffd','backup_20260315_230846_BKP_4f0b3a6f3ffd.zip',68374,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1438,NULL,'ok','Cron automatico','19sfhqwkw5yJeJ4YJb5n6RkFxMA0vwIUY','2026-03-16 00:08:50','2026-03-16 00:08:46'),('BKP_4ff0208f216f','backup_20260314_230016_BKP_4ff0208f216f.zip',68251,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1436,NULL,'ok','Cron automatico','1fbWw93aPlXgCtB9hNr7LMOw2bMnYBi4h','2026-03-15 00:00:21','2026-03-15 00:00:16'),('BKP_631a1bea0445','backup_20260302_204820_BKP_631a1bea0445.zip',20853,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"payments_invoices\",\"task_logs\",\"tasks\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',31,143,'USR_37ecc843','ok',NULL,'1YUKUHdnc9ogjmwzCHkIob5ky7j3OGDzt','2026-03-02 20:48:26','2026-03-02 22:10:03'),('BKP_77d67b568694','backup_20260310_230000_BKP_77d67b568694.zip',67446,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',78,1406,NULL,'ok','Cron automatico','1fwnCV01pmN3MlJpYErNGgzbcjkJPP0vY','2026-03-11 00:00:05','2026-03-11 00:00:01'),('BKP_82a3b29ac174','backup_20260301_235734_BKP_82a3b29ac174.zip',15041,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',28,135,'USR_admin0001','ok',NULL,'1LHZoubZMEipP6HrNHAWcEWmuAnQbZoBS','2026-03-01 23:57:39','2026-03-02 22:10:03'),('BKP_91efcf9e85e0','backup_20260313_230005_BKP_91efcf9e85e0.zip',68122,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1434,NULL,'ok','Cron automatico','14xOg6WxNsPc1r0ZxxyqBBof1YQvx5gjy','2026-03-14 00:00:10','2026-03-14 00:00:06'),('BKP_afe9e6a27315','backup_20260312_230002_BKP_afe9e6a27315.zip',70463,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1483,NULL,'ok','Cron automatico','14VSjTSMIXCLy5n83iSgGKfgNG8Wp5FBd','2026-03-13 00:00:08','2026-03-13 00:00:02'),('BKP_b189e1e1b3b3','backup_20260301_224928_BKP_b189e1e1b3b3.zip',12162,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',28,135,'USR_admin0001','ok',NULL,NULL,NULL,'2026-03-02 22:10:03'),('BKP_b2dea9427929','backup_20260319_230000_BKP_b2dea9427929.zip',69165,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1445,NULL,'ok','Cron automatico','1phYcIt0WvPKIXK8ASMwe5e5kYSLfy3Jp','2026-03-20 00:00:05','2026-03-20 00:00:01'),('BKP_b78c2d1b8131','backup_20260320_230019_BKP_b78c2d1b8131.zip',69409,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1457,NULL,'ok','Cron automatico','1djVbvvGoCJyph5Z93O0eAeXvaMe66SNY','2026-03-21 00:00:24','2026-03-21 00:00:19'),('BKP_c0e536c70aac','backup_20260301_235324_BKP_c0e536c70aac.zip',14855,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',28,135,'USR_admin0001','ok',NULL,NULL,NULL,'2026-03-02 22:10:03'),('BKP_c23923fa112c','backup_20260301_235821_BKP_c23923fa112c.zip',15138,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',28,135,'USR_admin0001','ok',NULL,'1gVce9ZeeHAKmOxMW5Eq3R0ZYqB7MS5iq','2026-03-01 23:58:25','2026-03-02 22:10:03'),('BKP_c79d1ca034c1','backup_20260317_230004_BKP_c79d1ca034c1.zip',68817,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1443,NULL,'ok','Cron automatico','1jfQ4-VDDXbhTAaQxgBvqyHgXuWBKQOxf','2026-03-18 00:00:09','2026-03-18 00:00:04'),('BKP_d68be52f1a54','backup_20260302_003311_BKP_d68be52f1a54.zip',15452,'[\"acwr_alerts\",\"ai_summaries\",\"athletes\",\"audit_logs\",\"backups\",\"carpool_passengers\",\"carpool_routes\",\"contracts\",\"documents\",\"email_logs\",\"event_attendees\",\"events\",\"gyms\",\"login_attempts\",\"medical_certificates\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"outseason_entries\",\"outseason_verifications\",\"payments_invoices\",\"team_members\",\"teams\",\"tenant_users\",\"tenants\",\"user_relationships\",\"users\"]',28,135,'USR_admin0001','ok',NULL,'1-me8mfWZwppy2Ie78zraafVrjzwJShtY','2026-03-02 00:33:15','2026-03-02 22:10:03'),('BKP_fc0113d49720','backup_20260316_230002_BKP_fc0113d49720.zip',68506,'[\"acwr_alerts\",\"ai_summaries\",\"athlete_documents\",\"athlete_teams\",\"athletes\",\"athletic_metrics\",\"audit_logs\",\"backups\",\"biometric_records\",\"carpool_passengers\",\"carpool_routes\",\"chart_of_accounts\",\"chat_channel_members\",\"chat_channels\",\"chat_messages\",\"contacts\",\"contracts\",\"documents\",\"drivers\",\"ec_orders\",\"email_logs\",\"event_attendees\",\"events\",\"federation_cards\",\"federation_championships\",\"federation_matches\",\"federation_standings\",\"fiscal_years\",\"gdpr_consents\",\"guardians\",\"gyms\",\"injury_records\",\"installments\",\"invoice_sequences\",\"invoices\",\"journal_entries\",\"journal_lines\",\"login_attempts\",\"medical_certificates\",\"meta_logs\",\"meta_oauth_states\",\"meta_tokens\",\"metrics_logs\",\"mileage_reimbursements\",\"network_activities\",\"network_collaborations\",\"network_documents\",\"network_trial_evaluations\",\"network_trials\",\"notification_log\",\"outseason_entries\",\"outseason_verifications\",\"password_history\",\"password_reset_tokens\",\"payment_plans\",\"payments_invoices\",\"push_subscriptions\",\"rasd_registrations\",\"societa_deadlines\",\"societa_documents\",\"societa_members\",\"societa_profile\",\"societa_roles\",\"societa_sponsors\",\"societa_titoli\",\"staff_members\",\"staff_teams\",\"task_logs\",\"tasks\",\"team_members\",\"team_seasons\",\"teams\",\"tenant_invitations\",\"tenant_settings\",\"tenant_users\",\"tenants\",\"tournament_details\",\"tournament_matches\",\"transactions\",\"transports\",\"user_relationships\",\"users\",\"vald_test_results\",\"vehicle_anomalies\",\"vehicle_maintenance\",\"vehicles\",\"website_categories\",\"website_hero_slides\",\"website_news\",\"website_settings\",\"whatsapp_messages\"]',91,1438,NULL,'ok','Cron automatico','1Si6XC69foqKXzsI9L2plCK1Cws96QAyX','2026-03-17 00:00:07','2026-03-17 00:00:03'),('BKP_test_1773330349','test.zip',123,'[\"users\"]',1,10,NULL,'ok','Cron automatico',NULL,NULL,'2026-03-12 16:45:49');
/*!40000 ALTER TABLE `backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biometric_records`
--

DROP TABLE IF EXISTS `biometric_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biometric_records` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_date` date NOT NULL,
  `height_cm` smallint DEFAULT NULL,
  `weight_kg` decimal(5,1) DEFAULT NULL,
  `bmi` decimal(4,1) DEFAULT NULL,
  `wingspan_cm` smallint DEFAULT NULL,
  `measured_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bio_athlete_date` (`athlete_id`,`record_date`),
  KEY `idx_bio_tenant` (`tenant_id`),
  KEY `fk_bio_measurer` (`measured_by`),
  CONSTRAINT `fk_bio_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bio_measurer` FOREIGN KEY (`measured_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bio_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biometric_records`
--

LOCK TABLES `biometric_records` WRITE;
/*!40000 ALTER TABLE `biometric_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `biometric_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carpool_passengers`
--

DROP TABLE IF EXISTS `carpool_passengers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carpool_passengers` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `route_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_lat` decimal(10,7) DEFAULT NULL,
  `pickup_lng` decimal(10,7) DEFAULT NULL,
  `pickup_address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'requested',
  `confirmed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_passenger_route_athlete` (`route_id`,`athlete_id`),
  KEY `idx_passengers_route` (`route_id`),
  KEY `idx_passengers_athlete` (`athlete_id`),
  KEY `fk_passengers_requester` (`requested_by`),
  CONSTRAINT `fk_passengers_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_passengers_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_passengers_route` FOREIGN KEY (`route_id`) REFERENCES `carpool_routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carpool_passengers`
--

LOCK TABLES `carpool_passengers` WRITE;
/*!40000 ALTER TABLE `carpool_passengers` DISABLE KEYS */;
/*!40000 ALTER TABLE `carpool_passengers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carpool_routes`
--

DROP TABLE IF EXISTS `carpool_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carpool_routes` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_point_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_point_lat` decimal(10,7) DEFAULT NULL,
  `meeting_point_lng` decimal(10,7) DEFAULT NULL,
  `departure_time` datetime DEFAULT NULL,
  `seats_total` tinyint NOT NULL DEFAULT '4',
  `seats_available` tinyint NOT NULL DEFAULT '3',
  `distance_km` decimal(8,2) DEFAULT NULL,
  `reimbursement_eur` decimal(8,2) DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_carpool_event` (`event_id`),
  KEY `idx_carpool_driver` (`driver_user_id`),
  KEY `idx_carpool_status` (`status`),
  KEY `fk_carpool_driver_athlete` (`driver_athlete_id`),
  KEY `fk_carpool_manual_driver` (`driver_id`),
  CONSTRAINT `fk_carpool_driver` FOREIGN KEY (`driver_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_carpool_driver_athlete` FOREIGN KEY (`driver_athlete_id`) REFERENCES `athletes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_carpool_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_carpool_manual_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carpool_routes`
--

LOCK TABLES `carpool_routes` WRITE;
/*!40000 ALTER TABLE `carpool_routes` DISABLE KEYS */;
/*!40000 ALTER TABLE `carpool_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chart_of_accounts`
--

DROP TABLE IF EXISTS `chart_of_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chart_of_accounts` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_coa_tenant` (`tenant_id`),
  KEY `idx_coa_code` (`tenant_id`,`code`),
  KEY `idx_coa_type` (`type`),
  CONSTRAINT `fk_coa_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chart_of_accounts`
--

LOCK TABLES `chart_of_accounts` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts` DISABLE KEYS */;
INSERT INTO `chart_of_accounts` VALUES ('COA_E01','TNT_default','1.01','Quote associative','entrata',NULL,1,1,100,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E02','TNT_default','1.02','Quote iscrizione corsi','entrata',NULL,1,1,110,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E03','TNT_default','1.03','Contributi pubblici','entrata',NULL,1,1,120,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E04','TNT_default','1.04','Contributi da privati / Sponsorizzazioni','entrata',NULL,1,1,130,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E05','TNT_default','1.05','Proventi attività commerciale','entrata',NULL,1,1,140,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E06','TNT_default','1.06','Donazioni e liberalità','entrata',NULL,1,1,150,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E07','TNT_default','1.07','Ricavi da eventi e manifestazioni','entrata',NULL,1,1,160,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E08','TNT_default','1.08','Interessi attivi bancari','entrata',NULL,1,1,170,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E09','TNT_default','1.09','Entrate diverse','entrata',NULL,1,1,180,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E10','TNT_default','1.10','5 per mille','entrata',NULL,1,1,190,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_E11','TNT_default','1.11','Rimborsi e recuperi spese','entrata',NULL,1,1,200,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PA1','TNT_default','3.01','Cassa contanti','patrimoniale_attivo',NULL,1,1,500,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PA2','TNT_default','3.02','Conto corrente bancario','patrimoniale_attivo',NULL,1,1,510,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PA3','TNT_default','3.03','Crediti verso soci','patrimoniale_attivo',NULL,1,1,520,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PA4','TNT_default','3.04','Crediti diversi','patrimoniale_attivo',NULL,1,1,530,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PA5','TNT_default','3.05','Rimanenze (magazzino)','patrimoniale_attivo',NULL,1,1,540,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PP1','TNT_default','4.01','Debiti verso fornitori','patrimoniale_passivo',NULL,1,1,600,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PP2','TNT_default','4.02','Debiti verso erario','patrimoniale_passivo',NULL,1,1,610,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PP3','TNT_default','4.03','Fondo cassa / Patrimonio netto','patrimoniale_passivo',NULL,1,1,620,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_PP4','TNT_default','4.04','Debiti diversi','patrimoniale_passivo',NULL,1,1,630,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U01','TNT_default','2.01','Compensi collaboratori sportivi','uscita',NULL,1,1,300,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U02','TNT_default','2.02','Rimborsi spese collaboratori','uscita',NULL,1,1,310,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U03','TNT_default','2.03','Affitto impianti e palestre','uscita',NULL,1,1,320,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U04','TNT_default','2.04','Utenze (luce, gas, acqua)','uscita',NULL,1,1,330,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U05','TNT_default','2.05','Attrezzatura sportiva','uscita',NULL,1,1,340,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U06','TNT_default','2.06','Tesseramenti e affiliazioni','uscita',NULL,1,1,350,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U07','TNT_default','2.07','Assicurazioni','uscita',NULL,1,1,360,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U08','TNT_default','2.08','Spese eventi e trasferte','uscita',NULL,1,1,370,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U09','TNT_default','2.09','Spese amministrative','uscita',NULL,1,1,380,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U10','TNT_default','2.10','Spese bancarie e commissioni','uscita',NULL,1,1,390,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U11','TNT_default','2.11','Manutenzioni e riparazioni','uscita',NULL,1,1,400,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U12','TNT_default','2.12','Pubblicità e promozione','uscita',NULL,1,1,410,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U13','TNT_default','2.13','Consulenze professionali','uscita',NULL,1,1,420,'2026-03-03 01:22:38','2026-03-03 01:22:38'),('COA_U14','TNT_default','2.14','Uscite diverse','uscita',NULL,1,1,430,'2026-03-03 01:22:38','2026-03-03 01:22:38');
/*!40000 ALTER TABLE `chart_of_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_channel_members`
--

DROP TABLE IF EXISTS `chat_channel_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_channel_members` (
  `channel_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `muted` tinyint(1) NOT NULL DEFAULT '0',
  `last_read_at` datetime DEFAULT NULL,
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`channel_id`,`user_id`),
  KEY `fk_chanmem_user` (`user_id`),
  CONSTRAINT `fk_chanmem_channel` FOREIGN KEY (`channel_id`) REFERENCES `chat_channels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chanmem_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_channel_members`
--

LOCK TABLES `chat_channel_members` WRITE;
/*!40000 ALTER TABLE `chat_channel_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_channel_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_channels`
--

DROP TABLE IF EXISTS `chat_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_channels` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'team',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_channels_tenant` (`tenant_id`),
  KEY `idx_channels_team` (`team_id`),
  KEY `idx_channels_type` (`type`),
  KEY `fk_channels_creator` (`created_by`),
  CONSTRAINT `fk_channels_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_channels_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_channels`
--

LOCK TABLES `chat_channels` WRITE;
/*!40000 ALTER TABLE `chat_channels` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_channels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `metadata` json DEFAULT NULL,
  `is_edited` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_channel_time` (`channel_id`,`created_at`),
  KEY `idx_messages_user` (`user_id`),
  CONSTRAINT `fk_messages_channel` FOREIGN KEY (`channel_id`) REFERENCES `chat_channels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_raw` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_normalized` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` enum('vcard','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vcard',
  `athlete_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tenant_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TNT_default',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_phone_tenant` (`phone_normalized`,`tenant_id`),
  KEY `idx_athlete` (`athlete_id`),
  KEY `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_contact_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'collaboratore_sportivo',
  `role_description` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valid_from` date NOT NULL,
  `valid_to` date NOT NULL,
  `monthly_fee_eur` decimal(10,2) DEFAULT NULL,
  `pdf_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `signed_at` datetime DEFAULT NULL,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contracts_user` (`user_id`),
  KEY `idx_contracts_status` (`status`),
  KEY `idx_contracts_validity` (`valid_from`,`valid_to`),
  KEY `fk_contracts_creator` (`created_by`),
  CONSTRAINT `fk_contracts_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contracts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_kb` int DEFAULT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT '0',
  `uploaded_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_docs_entity` (`entity_type`,`entity_id`),
  KEY `idx_docs_category` (`category`),
  KEY `fk_docs_uploader` (`uploaded_by`),
  CONSTRAINT `fk_docs_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_drivers_creator` (`created_by`),
  CONSTRAINT `fk_drivers_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES ('DRV_0982fdfd','Luca Padoan',NULL,NULL,NULL,NULL,1,NULL,'USR_37ecc843','2026-03-06 00:38:41','2026-03-06 00:38:41',NULL);
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ec_orders`
--

DROP TABLE IF EXISTS `ec_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ec_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cognito_id` varchar(50) DEFAULT NULL,
  `nome_cliente` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `articoli` text,
  `totale` decimal(10,2) DEFAULT '0.00',
  `metodo_pagamento` varchar(100) DEFAULT NULL,
  `stato_forms` varchar(50) DEFAULT 'da definire',
  `stato_interno` varchar(50) DEFAULT 'da definire',
  `data_ordine` timestamp NULL DEFAULT NULL,
  `order_summary` text,
  `raw_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cognito_id` (`cognito_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ec_orders`
--

LOCK TABLES `ec_orders` WRITE;
/*!40000 ALTER TABLE `ec_orders` DISABLE KEYS */;
INSERT INTO `ec_orders` VALUES (1,'1','Lavinia Vidori','aviezzer77@gmail.com','3341146197','[\"Acquisto da Form Ordinazione\"]',80.00,'','pagato','da definire','2025-11-27 18:40:56','','{\"Id\": 1, \"Name\": \"Lavinia Vidori\", \"Email\": \"aviezzer77@gmail.com\", \"Phone\": \"3341146197\", \"Order_Id\": \"F17E1T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(1)\", \"Order_Date\": \"2025-11-27T18:40:56.553Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"80,00 € Paid\", \"Entry_DateSubmitted\": \"2025-11-27T18:40:56.558Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Ritiro in sede\", \"InserisciIlNomeDelTuoAllenatore\": null}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(2,'2','Lavinia Vidori','aviezzer77@gmail.com','3341146197','[\"Acquisto da Form Ordinazione\"]',35.00,'','pagato','da definire','2025-11-27 19:22:39','','{\"Id\": 2, \"Name\": \"Lavinia Vidori\", \"Email\": \"aviezzer77@gmail.com\", \"Phone\": \"3341146197\", \"Order_Id\": \"F17E2T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(2)\", \"Order_Date\": \"2025-11-27T19:22:39.235Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"35,00 € Paid\", \"Entry_DateSubmitted\": \"2025-11-27T19:22:39.240Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Ritiro in sede\", \"InserisciIlNomeDelTuoAllenatore\": null}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(4,'4','Mirko Gianni','mirko.yanez@gmail.com','3393246961','[\"Acquisto da Form Ordinazione\"]',80.00,'','non pagato','da definire','2025-12-03 21:59:25','','{\"Id\": 4, \"Name\": \"Mirko Gianni\", \"Email\": \"mirko.yanez@gmail.com\", \"Phone\": \"3393246961\", \"Order_Id\": \"F17E4T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(4)\", \"Order_Date\": \"2025-12-03T21:59:25.072Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"Con bonifico bancario\", \"Order_OrderSummary\": \"80,00 € Unpaid\", \"Entry_DateSubmitted\": \"2025-12-03T21:59:25.082Z\", \"Order_PaymentMethod\": \"None\", \"Order_PaymentStatus\": \"Unpaid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Consegnata personalmente dal tuo allenatore\", \"InserisciIlNomeDelTuoAllenatore\": \"Nicola Martignago\"}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(5,'5','Nicola Martignago','n.martignago@fusionteamvolley.it','3348062321','[\"Acquisto da Form Ordinazione\"]',410.00,'','non pagato','da definire','2025-12-04 09:14:14','','{\"Id\": 5, \"Name\": \"Nicola Martignago\", \"Email\": \"n.martignago@fusionteamvolley.it\", \"Phone\": \"3348062321\", \"Order_Id\": \"F17E5T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(5)\", \"Order_Date\": \"2025-12-04T09:14:14.652Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"Con bonifico bancario\", \"Order_OrderSummary\": \"410,00 € Unpaid\", \"Entry_DateSubmitted\": \"2025-12-04T09:14:14.657Z\", \"Order_PaymentMethod\": \"None\", \"Order_PaymentStatus\": \"Unpaid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Ritiro in sede\", \"InserisciIlNomeDelTuoAllenatore\": null}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(7,'7','Nicola Martignago','n.martignago@fusionteamvolley.it','3348062321','[\"Acquisto da Form Ordinazione\"]',30.00,'','non pagato','pagato','2025-12-04 09:27:46','','{\"Id\": 7, \"Name\": \"Nicola Martignago\", \"Email\": \"n.martignago@fusionteamvolley.it\", \"Phone\": \"3348062321\", \"Order_Id\": \"F17E7T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(7)\", \"Order_Date\": \"2025-12-04T09:27:46.801Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"Con bonifico bancario\", \"Order_OrderSummary\": \"30,00 € Unpaid\", \"Entry_DateSubmitted\": \"2025-12-04T09:27:46.806Z\", \"Order_PaymentMethod\": \"None\", \"Order_PaymentStatus\": \"Unpaid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Ritiro in sede\", \"InserisciIlNomeDelTuoAllenatore\": null}','2026-03-08 18:55:12','2026-03-08 18:55:26'),(8,'8','Alison Gianni','pgenny@gmail.com','+393406614649','[\"Acquisto da Form Ordinazione\"]',50.00,'','pagato','da definire','2025-12-04 21:01:53','','{\"Id\": 8, \"Name\": \"Alison Gianni\", \"Email\": \"pgenny@gmail.com\", \"Phone\": \"+393406614649\", \"Order_Id\": \"F17E8T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(8)\", \"Order_Date\": \"2025-12-04T21:01:53.287Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"50,00 € Paid\", \"Entry_DateSubmitted\": \"2025-12-04T21:01:53.297Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Consegnata personalmente dal tuo allenatore\", \"InserisciIlNomeDelTuoAllenatore\": \"Nicola Martignago\"}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(9,'9','Carlotta Maria Mazzel','alionca@libero.it','+393290086675','[\"Acquisto da Form Ordinazione\"]',50.00,'','pagato','da definire','2025-12-05 18:58:39','','{\"Id\": 9, \"Name\": \"Carlotta Maria Mazzel\", \"Email\": \"alionca@libero.it\", \"Phone\": \"+393290086675\", \"Order_Id\": \"F17E9T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(9)\", \"Order_Date\": \"2025-12-05T18:58:39.436Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"50,00 € Paid\", \"Entry_DateSubmitted\": \"2025-12-05T18:58:39.441Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Consegnata personalmente dal tuo allenatore\", \"InserisciIlNomeDelTuoAllenatore\": \"Nicola Martignago\"}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(10,'10','Angela Pesce','pesce80angela@gmail.com','3397902244','[\"Acquisto da Form Ordinazione\"]',60.00,'','pagato','da definire','2025-12-11 21:27:05','','{\"Id\": 10, \"Name\": \"Angela Pesce\", \"Email\": \"pesce80angela@gmail.com\", \"Phone\": \"3397902244\", \"Order_Id\": \"F17E10T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(10)\", \"Order_Date\": \"2025-12-11T21:27:05.035Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"60,00 € Paid\", \"Entry_DateSubmitted\": \"2025-12-11T21:27:05.040Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Consegnata personalmente dal tuo allenatore\", \"InserisciIlNomeDelTuoAllenatore\": \"Nicola Martignago\"}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(11,'11','Laura Balao','laura.balao@yahoo.it','3934306566','[\"Acquisto da Form Ordinazione\"]',25.00,'','pagato','da definire','2026-02-10 10:50:52','','{\"Id\": 11, \"Name\": \"Laura Balao\", \"Email\": \"laura.balao@yahoo.it\", \"Phone\": \"3934306566\", \"Order_Id\": \"F17E11T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(11)\", \"Order_Date\": \"2026-02-10T10:50:52.438Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"25,00 € Paid\", \"Entry_DateSubmitted\": \"2026-02-10T10:50:52.448Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Ritiro in sede\", \"InserisciIlNomeDelTuoAllenatore\": null}','2026-03-08 18:55:12','2026-03-08 18:55:12'),(12,'12','Martina Pergola','martina.pergola@icloud.com','3457057047','[\"Acquisto da Form Ordinazione\"]',50.00,'','pagato','consegnato','2026-02-12 14:14:14','','{\"Id\": 12, \"Name\": \"Martina Pergola\", \"Email\": \"martina.pergola@icloud.com\", \"Phone\": \"3457057047\", \"Order_Id\": \"F17E12T1\", \"@odata.id\": \"https://www.cognitoforms.com/api/odata/Forms(17)/Views(1)/Entries(12)\", \"Order_Date\": \"2026-02-12T14:14:14.359Z\", \"Entry_Status\": \"Submitted\", \"ComeVuoiPagare\": \"On line\", \"Order_OrderSummary\": \"50,00 € Paid\", \"Entry_DateSubmitted\": \"2026-02-12T14:14:14.369Z\", \"Order_PaymentMethod\": \"MasterCard\", \"Order_PaymentStatus\": \"Paid\", \"ComeVuoiRicevereIlTuoOrdine\": \"Consegnata personalmente dal tuo allenatore\", \"InserisciIlNomeDelTuoAllenatore\": \"Arianna Benedetti\"}','2026-03-08 18:55:12','2026-03-08 18:55:39');
/*!40000 ALTER TABLE `ec_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `sent_at` datetime DEFAULT NULL,
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_event` (`event_id`),
  KEY `idx_email_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_attendees`
--

DROP TABLE IF EXISTS `event_attendees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_attendees` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'invited',
  `notified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendee_event_athlete` (`event_id`,`athlete_id`),
  KEY `idx_attendees_event` (`event_id`),
  KEY `idx_attendees_athlete` (`athlete_id`),
  CONSTRAINT `fk_attendees_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendees_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_attendees`
--

LOCK TABLES `event_attendees` WRITE;
/*!40000 ALTER TABLE `event_attendees` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_attendees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` datetime NOT NULL,
  `event_end` datetime DEFAULT NULL,
  `location_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_lat` decimal(10,7) DEFAULT NULL,
  `location_lng` decimal(10,7) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_team_date` (`team_id`,`event_date`),
  KEY `idx_events_type` (`type`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_deleted_at` (`deleted_at`),
  KEY `fk_events_creator` (`created_by`),
  CONSTRAINT `fk_events_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES ('EVT_1d1af7fa','TEAM_u13a','tournament','Bussinello3','2026-03-05 12:00:00','2026-03-06 12:00:00','',NULL,NULL,NULL,'scheduled','USR_37ecc843',NULL,'2026-03-05 22:28:39','2026-03-05 22:28:39'),('EVT_70b517b2','TEAM_u14a','tournament','undefined','2026-03-14 12:00:00','2026-03-15 12:00:00','treviso',NULL,NULL,NULL,'scheduled','USR_37ecc843',NULL,'2026-03-05 22:19:02','2026-03-05 22:19:02'),('EVT_f3f8dcc7','TEAM_u13a','tournament','Bussinello','2026-04-04 11:00:00','2026-04-06 22:00:00','Modena',NULL,NULL,NULL,'scheduled','USR_37ecc843',NULL,'2026-03-05 22:07:01','2026-03-05 22:07:01'),('EVT_ff4fe020','TEAM_u14a','tournament','test','2026-03-07 12:00:00','2026-03-16 12:00:00','',NULL,NULL,NULL,'scheduled','USR_37ecc843',NULL,'2026-03-05 22:48:48','2026-03-05 22:48:48');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `federation_cards`
--

DROP TABLE IF EXISTS `federation_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `federation_cards` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `federation` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `card_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `season` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `card_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'atleta',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requested_at` date DEFAULT NULL,
  `issued_at` date DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `fee_amount` decimal(8,2) DEFAULT NULL,
  `fee_paid` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fc_tenant` (`tenant_id`),
  KEY `idx_fc_athlete` (`athlete_id`),
  KEY `idx_fc_season` (`season`),
  KEY `idx_fc_status` (`status`),
  KEY `idx_fc_federation` (`federation`),
  KEY `fk_fc_creator` (`created_by`),
  CONSTRAINT `fk_fc_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fc_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_fc_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `federation_cards`
--

LOCK TABLES `federation_cards` WRITE;
/*!40000 ALTER TABLE `federation_cards` DISABLE KEYS */;
/*!40000 ALTER TABLE `federation_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `federation_championships`
--

DROP TABLE IF EXISTS `federation_championships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `federation_championships` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `standings_url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_synced_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fed_champ_tenant` (`tenant_id`),
  CONSTRAINT `fk_fed_champ_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `federation_championships`
--

LOCK TABLES `federation_championships` WRITE;
/*!40000 ALTER TABLE `federation_championships` DISABLE KEYS */;
INSERT INTO `federation_championships` VALUES ('fed_3316c68e','TNT_default','U16 Girone Regionale','https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=88673&SId=&btFiltro=CERCA','https://venezia.portalefipav.net/classifica.aspx?CId=88673',NULL,'2026-03-19 22:03:29',1,'2026-03-08 18:44:43','2026-03-19 22:03:29'),('fed_604397a5','TNT_default','Serie B2 Femminile Girone D','https://www.federvolley.it/serie-b2-femminile-calendario?girone=D','https://www.federvolley.it/moduli/campionati/classifica/classifica.php?serie=B2&sesso=F&stagione=2025&giornata=18&girone=D',NULL,'2026-03-08 20:29:47',1,'2026-03-08 20:29:43','2026-03-08 20:29:47'),('fed_dc788225','TNT_default','Serie C','https://www.fipavveneto.net/calendari-gare?ComitatoId=1&StId=2263&DataDa=&StatoGara=&CId=84415&SId=&btFiltro=CERCA','https://venezia.portalefipav.net/classifica.aspx?CId=84415',NULL,'2026-03-17 23:09:38',1,'2026-03-08 18:31:00','2026-03-17 23:09:38');
/*!40000 ALTER TABLE `federation_championships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `federation_matches`
--

DROP TABLE IF EXISTS `federation_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `federation_matches` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `championship_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `match_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `match_date` datetime DEFAULT NULL,
  `home_team` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `home_logo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `away_team` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `away_logo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `home_score` tinyint DEFAULT NULL,
  `away_score` tinyint DEFAULT NULL,
  `set_scores` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `round` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fed_match_champ` (`championship_id`),
  CONSTRAINT `fk_fed_match_champ` FOREIGN KEY (`championship_id`) REFERENCES `federation_championships` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `federation_matches`
--

LOCK TABLES `federation_matches` WRITE;
/*!40000 ALTER TABLE `federation_matches` DISABLE KEYS */;
INSERT INTO `federation_matches` VALUES ('m_0078b3e31c','fed_3316c68e','2252','2026-03-29 11:30:00','VOLLEY BALL POLESELLA',NULL,'AGB TIGERS GIALLA BASSANO',NULL,NULL,NULL,NULL,'scheduled','5','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_010c661fe0','fed_dc788225','931','2025-10-25 20:30:00','AURORA VITTINOX-LGI',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','1','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_025634bec6','fed_dc788225','936','2025-11-01 20:00:00','BANCA ANNIA ADUNA PW',NULL,'SPEA SUMMANO',NULL,1,3,NULL,'played','2','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_039e6c8b41','fed_dc788225','1016','2026-03-07 20:30:00','SICELL GS VOLPE',NULL,'CAPPELLA FREGONA SARMEDE',NULL,0,3,NULL,'played','16','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_04ad43c8bd','fed_3316c68e','2241','2026-03-08 16:30:00','ARBIZZANO VOLLEY BLU',NULL,'MONTEVOLLEY BLU ÉLITE',NULL,1,3,NULL,'played','2','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_05c8f7d2d8','fed_dc788225','944','2025-11-15 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'AURORA VITTINOX-LGI',NULL,3,1,NULL,'played','4','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_05fd701705','fed_604397a5','10716','2026-02-28 18:00:00','I COLORI DEL VOLLEY TV',NULL,'PALL. SANGIORGINA UD',NULL,3,2,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_0606adeba8','fed_dc788225','939','2025-11-08 20:00:00','POOL PATAVIUM',NULL,'SICELL GS VOLPE',NULL,3,0,NULL,'played','3','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_0752cf90c4','fed_604397a5','10641','2025-11-15 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,3,1,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_097eb2f16e','fed_604397a5','10638','2025-11-15 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'I COLORI DEL VOLLEY TV',NULL,0,3,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_09806287f6','fed_dc788225','979','2025-12-20 20:30:00','SICELL GS VOLPE',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','9','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_098c5a6b7c','fed_604397a5','10717','2026-02-28 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,1,3,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_0d1b9bc3e0','fed_3316c68e','2242','2026-03-08 11:30:00','VOLLEY BALL POLESELLA',NULL,'VOLLEY CLUB PADOVA',NULL,0,3,NULL,'played','2','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_0d5b0104ea','fed_604397a5','10617','2025-10-25 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'PALL. SANGIORGINA UD',NULL,3,2,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_0e01dacf8e','fed_604397a5','10691','2026-01-18 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'PORDENONE VOLLEY PN',NULL,3,1,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_11483944c2','fed_604397a5','10660','2025-12-07 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'LAGUNA VOLLEY VE',NULL,0,3,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_123d399057','fed_604397a5','10682','2026-01-10 20:00:00','PORDENONE VOLLEY PN',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,0,3,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_126a02a739','fed_604397a5','10681','2026-01-10 20:30:00','USMA PADOVA PD',NULL,'OFFICINA DEL VOLLEY PD',NULL,3,0,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_12ac4c82d0','fed_dc788225','1004','2026-02-21 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'ALIT LOCARA',NULL,3,1,NULL,'played','14','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_12c1d460d7','fed_dc788225','933','2025-11-01 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'POOL PATAVIUM',NULL,3,2,NULL,'played','2','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_12c5ba5597','fed_3316c68e','2237','2026-03-01 11:30:00','VEGA FUSION TEAM U16',NULL,'ARBIZZANO VOLLEY BLU',NULL,3,0,NULL,'played','1','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_13369c6b25','fed_dc788225','1012','2026-02-28 20:00:00','POOL PATAVIUM',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,3,0,NULL,'played','15','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_13d356110f','fed_dc788225','1050','2026-04-18 20:00:00','POOL PATAVIUM',NULL,'PERUZZO IMPIANTI SOSUS',NULL,NULL,NULL,NULL,'scheduled','21','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_13f3341a21','fed_dc788225','1019','2026-03-07 20:30:00','A.S. S. CROCE',NULL,'APV ASD TEAM VOLLEY 2007',NULL,3,1,NULL,'played','16','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_1468dc960f','fed_604397a5','10646','2025-11-22 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,1,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1480722192','fed_dc788225','1052','2026-04-25 20:30:00','A.S. S. CROCE',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,NULL,NULL,NULL,'scheduled','22','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_148a8089bd','fed_604397a5','10636','2025-11-15 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'USMA PADOVA PD',NULL,3,2,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_14d76f2616','fed_dc788225','1009','2026-02-21 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'SPEA SUMMANO',NULL,0,3,NULL,'played','14','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_151d043fc9','fed_dc788225','999','2026-02-14 20:00:00','POOL PATAVIUM',NULL,'CAPPELLA FREGONA SARMEDE',NULL,3,0,NULL,'played','13','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_15cebc1df2','fed_dc788225','978','2025-12-19 20:30:00','AURORA VITTINOX-LGI',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,2,NULL,'played','9','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_17f02f5076','fed_dc788225','1054','2026-04-25 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'CAPPELLA FREGONA SARMEDE',NULL,NULL,NULL,NULL,'scheduled','22','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_1b97c24406','fed_dc788225','951','2025-11-22 21:00:00','ALIT LOCARA',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,3,2,NULL,'played','5','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_1be01c5bba','fed_dc788225','980','2026-01-10 20:00:00','BANCA ANNIA ADUNA PW',NULL,'AURORA VITTINOX-LGI',NULL,0,3,NULL,'played','10','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_1d064980cd','fed_dc788225','982','2026-01-10 20:30:00','SPEA SUMMANO',NULL,'CAPPELLA FREGONA SARMEDE',NULL,0,3,NULL,'played','10','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_1db3581339','fed_604397a5','10670','2025-12-13 20:30:00','PALL. SANGIORGINA UD',NULL,'OFFICINA DEL VOLLEY PD',NULL,3,0,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1df994e23d','fed_604397a5','10616','2025-10-26 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'VLC DOLO ROM PLASTICA VE',NULL,3,1,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1e274f3fb2','fed_604397a5','10678','2026-01-10 18:00:00','I COLORI DEL VOLLEY TV',NULL,'VLC DOLO ROM PLASTICA VE',NULL,3,1,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1eaa47f966','fed_604397a5','10702','2026-02-14 20:30:00','LAGUNA VOLLEY VE',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,3,0,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1eda6b840d','fed_604397a5','10721','2026-03-07 20:30:00','LAGUNA VOLLEY VE',NULL,'USMA PADOVA PD',NULL,3,2,NULL,'played','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1f49f60072','fed_604397a5','10651','2025-11-29 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'I COLORI DEL VOLLEY TV',NULL,1,3,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1f62d75524','fed_604397a5','10675','2025-12-20 20:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'PALL. SANGIORGINA UD',NULL,3,1,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1f9557f72d','fed_604397a5','10648','2025-11-23 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,3,0,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_1f9fc46b8c','fed_dc788225','1008','2026-02-21 20:30:00','A.S. S. CROCE',NULL,'AURORA VITTINOX-LGI',NULL,3,2,NULL,'played','14','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_213bfd4eb5','fed_604397a5','10699','2026-02-14 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,3,1,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_22aff186c3','fed_dc788225','987','2026-01-17 20:30:00','SICELL GS VOLPE',NULL,'SPEA SUMMANO',NULL,3,2,NULL,'played','11','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_22e100b01e','fed_dc788225','1053','2026-04-25 20:30:00','SPEA SUMMANO',NULL,'SICELL GS VOLPE',NULL,NULL,NULL,NULL,'scheduled','22','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_22e618104f','fed_604397a5','10623','2025-11-02 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'USMA PADOVA PD',NULL,1,3,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_230fca970a','fed_dc788225','997','2026-02-07 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'AURORA VITTINOX-LGI',NULL,1,3,NULL,'played','12','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_236601a192','fed_dc788225','1035','2026-03-28 20:30:00','SICELL GS VOLPE',NULL,'BANCA ANNIA ADUNA PW',NULL,NULL,NULL,NULL,'scheduled','19','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_239e8c67aa','fed_604397a5','10729','2026-03-14 18:00:00','I COLORI DEL VOLLEY TV',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_241b578630','fed_604397a5','10710','2026-02-21 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'PORDENONE VOLLEY PN',NULL,3,0,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_25cc831a2a','fed_dc788225','962','2025-12-06 20:30:00','SICELL GS VOLPE',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,3,0,NULL,'played','7','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_26ca3b337e','fed_604397a5','10718','2026-03-01 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,2,3,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_26d51ba03f','fed_dc788225','950','2025-11-22 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'SICELL GS VOLPE',NULL,3,0,NULL,'played','5','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2708bcc084','fed_dc788225','943','2025-11-08 20:30:00','SPEA SUMMANO',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,1,NULL,'played','3','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_282d85ef86','fed_604397a5','10608','2025-10-19 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'OFFICINA DEL VOLLEY PD',NULL,3,2,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_2b398cc6e6','fed_604397a5','10674','2025-12-20 18:00:00','I COLORI DEL VOLLEY TV',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,0,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_2b71ad05bb','fed_dc788225','1021','2026-03-07 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,1,NULL,'played','16','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2baf47101d','fed_dc788225','956','2025-11-29 20:30:00','SICELL GS VOLPE',NULL,'AURORA VITTINOX-LGI',NULL,3,2,NULL,'played','6','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2bd669b982','fed_dc788225','948','2025-11-15 20:30:00','A.S. S. CROCE',NULL,'SPEA SUMMANO',NULL,3,2,NULL,'played','4','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2bffaee743','fed_3316c68e','2248','2026-03-22 18:00:00','AGB TIGERS GIALLA BASSANO',NULL,'VOLLEY CLUB PADOVA',NULL,NULL,NULL,NULL,'scheduled','4','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_2c47a36007','fed_dc788225','932','2025-11-01 21:00:00','ALIT LOCARA',NULL,'AURORA VITTINOX-LGI',NULL,3,1,NULL,'played','2','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2c594879c4','fed_dc788225','1002','2026-02-14 20:30:00','SPEA SUMMANO',NULL,'BANCA ANNIA ADUNA PW',NULL,3,2,NULL,'played','13','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2d6779934e','fed_3316c68e','2239','2026-03-24 20:00:00','VOLLEY CLUB PADOVA',NULL,'AZIMUT GIORGIONE ROSSO ÉL',NULL,NULL,NULL,NULL,'scheduled','1','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_2dd76d3def','fed_dc788225','929','2025-10-25 20:30:00','SPEA SUMMANO',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,0,3,NULL,'played','1','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_2efe321952','fed_604397a5','10618','2025-10-25 20:30:00','USMA PADOVA PD',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,3,1,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_3023d17473','fed_604397a5','10642','2025-11-15 20:30:00','PALL. SANGIORGINA UD',NULL,'VLC DOLO ROM PLASTICA VE',NULL,3,1,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_3032a356b8','fed_dc788225','1022','2026-03-14 20:30:00','AURORA VITTINOX-LGI',NULL,'SICELL GS VOLPE',NULL,3,0,NULL,'played','17','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_30f6d6b399','fed_dc788225','1047','2026-04-18 20:30:00','SICELL GS VOLPE',NULL,'A.S. S. CROCE',NULL,NULL,NULL,NULL,'scheduled','21','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_31cca2190e','fed_dc788225','1005','2026-02-21 20:30:00','SICELL GS VOLPE',NULL,'POOL PATAVIUM',NULL,1,3,NULL,'played','14','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_31d3f6b8c3','fed_3316c68e','2262','2026-04-19 11:30:00','VOLLEY CLUB PADOVA',NULL,'MONTEVOLLEY BLU ÉLITE',NULL,NULL,NULL,NULL,'scheduled','7','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_34b9990994','fed_604397a5','10661','2025-12-06 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_35f3430c80','fed_604397a5','10688','2026-01-18 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'USMA PADOVA PD',NULL,3,0,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_3713c13a35','fed_604397a5','10711','2026-02-22 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'OFFICINA DEL VOLLEY PD',NULL,3,0,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_3790b6654a','fed_604397a5','10656','2025-11-29 20:30:00','PALL. SANGIORGINA UD',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,0,3,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_37dd92cd49','fed_dc788225','1037','2026-03-28 20:00:00','POOL PATAVIUM',NULL,'SPEA SUMMANO',NULL,NULL,NULL,NULL,'scheduled','19','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_38bbfa5c2c','fed_dc788225','957','2025-11-29 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'CAPPELLA FREGONA SARMEDE',NULL,1,3,NULL,'played','6','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_3c9b300827','fed_604397a5','10621','2025-10-25 18:00:00','I COLORI DEL VOLLEY TV',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,3,1,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_3d6d050a7e','fed_3316c68e','2244','2026-03-15 17:00:00','MONTEVOLLEY BLU ÉLITE',NULL,'AGB TIGERS GIALLA BASSANO',NULL,3,0,NULL,'played','3','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_3e61b5b98a','fed_604397a5','10603','2025-10-11 18:00:00','I COLORI DEL VOLLEY TV',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,1,3,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_3f907f42ec','fed_3316c68e','2253','2026-03-31 20:00:00','VOLLEY CLUB PADOVA',NULL,'COLPO & ZILIO U.S.TORRI',NULL,NULL,NULL,NULL,'scheduled','5','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_3fe4051f21','fed_3316c68e','2236','2026-03-01 11:00:00','COLPO & ZILIO U.S.TORRI',NULL,'AGB TIGERS GIALLA BASSANO',NULL,3,0,NULL,'played','1','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_406f2d49cc','fed_604397a5','10624','2025-11-01 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'PORDENONE VOLLEY PN',NULL,2,3,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_40ddafc7d5','fed_604397a5','10626','2025-11-01 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'OFFICINA DEL VOLLEY PD',NULL,3,1,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_411881bd2d','fed_604397a5','10652','2025-11-29 21:00:00','LAGUNA VOLLEY VE',NULL,'OFFICINA DEL VOLLEY PD',NULL,2,3,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_42a2e5d273','fed_3316c68e','2243','2026-03-08 11:30:00','AZIMUT GIORGIONE ROSSO ÉL',NULL,'COLPO & ZILIO U.S.TORRI',NULL,0,3,NULL,'played','2','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_42d8cadf7e','fed_604397a5','10650','2025-11-29 21:00:00','USMA PADOVA PD',NULL,'PORDENONE VOLLEY PN',NULL,3,0,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_43f98e2a99','fed_604397a5','10620','2025-10-25 21:00:00','OFFICINA DEL VOLLEY PD',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,0,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_4427ce0b95','fed_604397a5','10671','2025-12-20 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'PORDENONE VOLLEY PN',NULL,1,3,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_450b47ec6a','fed_3316c68e','2249','2026-03-22 11:00:00','COLPO & ZILIO U.S.TORRI',NULL,'MONTEVOLLEY BLU ÉLITE',NULL,NULL,NULL,NULL,'scheduled','4','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_459efbd572','fed_604397a5','10672','2025-12-20 20:30:00','VLC DOLO ROM PLASTICA VE',NULL,'USMA PADOVA PD',NULL,1,3,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_45bbbec4ee','fed_dc788225','1055','2026-04-25 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'ALIT LOCARA',NULL,NULL,NULL,NULL,'scheduled','22','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_46e1cf3c00','fed_dc788225','1031','2026-03-21 20:30:00','SPEA SUMMANO',NULL,'PERUZZO IMPIANTI SOSUS',NULL,NULL,NULL,NULL,'scheduled','18','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_474db1a446','fed_604397a5','10668','2025-12-13 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_47ed861adf','fed_604397a5','10696','2026-02-07 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,0,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_488129fb3c','fed_604397a5','10679','2026-01-10 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,0,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_491aed050f','fed_604397a5','10706','2026-02-21 20:30:00','LAGUNA VOLLEY VE',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,0,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_4a2f4f7e08','fed_604397a5','10708','2026-02-21 18:30:00','PALL. SANGIORGINA UD',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,1,3,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_4b7bcb02cc','fed_604397a5','10644','2025-11-22 20:00:00','PORDENONE VOLLEY PN',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,3,0,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_4efd70438a','fed_dc788225','1015','2026-02-28 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','15','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_523182e5f1','fed_dc788225','981','2026-01-10 20:30:00','A.S. S. CROCE',NULL,'SICELL GS VOLPE',NULL,3,2,NULL,'played','10','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_52e3ca98f1','fed_dc788225','970','2025-12-11 21:00:00','A.S. S. CROCE',NULL,'ALIT LOCARA',NULL,1,3,NULL,'played','8','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_5336845c8d','fed_604397a5','10663','2025-12-07 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'PALL. SANGIORGINA UD',NULL,3,1,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_55ac284f02','fed_604397a5','10615','2025-10-26 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'LAGUNA VOLLEY VE',NULL,2,3,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_5954e050c7','fed_dc788225','1032','2026-03-21 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'AURORA VITTINOX-LGI',NULL,NULL,NULL,NULL,'scheduled','18','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_5a05fa1491','fed_604397a5','10635','2025-11-09 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,2,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_5aa4085538','fed_604397a5','10619','2025-10-25 20:00:00','PORDENONE VOLLEY PN',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','3','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_5bd9544522','fed_604397a5','10676','2025-12-20 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'LAGUNA VOLLEY VE',NULL,1,3,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_5c1354d9a8','fed_dc788225','926','2025-10-25 20:00:00','POOL PATAVIUM',NULL,'ALIT LOCARA',NULL,3,1,NULL,'played','1','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_5c16d906d3','fed_dc788225','1025','2026-03-14 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'A.S. S. CROCE',NULL,2,3,NULL,'played','17','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_5c4ba177ef','fed_dc788225','935','2025-11-01 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'APV ASD TEAM VOLLEY 2007',NULL,1,3,NULL,'played','2','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_5cc85513b4','fed_dc788225','938','2025-11-08 21:00:00','ALIT LOCARA',NULL,'CAPPELLA FREGONA SARMEDE',NULL,3,2,NULL,'played','3','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_5e0f86cc47','fed_604397a5','10613','2025-10-18 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'USMA PADOVA PD',NULL,2,3,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_5e77c253f3','fed_dc788225','969','2025-12-13 20:00:00','BANCA ANNIA ADUNA PW',NULL,'SICELL GS VOLPE',NULL,0,3,NULL,'played','8','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_60c59ae8d5','fed_dc788225','971','2025-12-13 20:30:00','SPEA SUMMANO',NULL,'POOL PATAVIUM',NULL,0,3,NULL,'played','8','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_6160f168ed','fed_dc788225','1030','2026-03-21 20:30:00','A.S. S. CROCE',NULL,'POOL PATAVIUM',NULL,NULL,NULL,NULL,'scheduled','18','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_62515363e7','fed_604397a5','10629','2025-11-08 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,2,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_62ca0435ec','fed_3316c68e','2247','2026-03-15 11:30:00','AZIMUT GIORGIONE ROSSO ÉL',NULL,'VOLLEY BALL POLESELLA',NULL,3,0,NULL,'played','3','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_63cc7d392d','fed_604397a5','10653','2025-11-30 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'VLC DOLO ROM PLASTICA VE',NULL,3,0,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_64e5dea11f','fed_604397a5','10704','2026-02-14 20:30:00','USMA PADOVA PD',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,3,2,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_655626edfa','fed_dc788225','1044','2026-04-11 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'AURORA VITTINOX-LGI',NULL,NULL,NULL,NULL,'scheduled','20','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_66b6d60190','fed_604397a5','10713','2026-02-28 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'LAGUNA VOLLEY VE',NULL,1,3,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_66e2ba04f6','fed_604397a5','10637','2025-11-15 20:30:00','LAGUNA VOLLEY VE',NULL,'PORDENONE VOLLEY PN',NULL,3,1,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_670200f7ec','fed_dc788225','961','2025-11-29 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'POOL PATAVIUM',NULL,1,3,NULL,'played','6','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_68adcfd8f3','fed_604397a5','10647','2025-11-23 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,3,2,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6968af8c4f','fed_dc788225','1057','2026-04-25 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'BANCA ANNIA ADUNA PW',NULL,NULL,NULL,NULL,'scheduled','22','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_6a986fdf3f','fed_604397a5','10601','2025-10-11 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'VLC DOLO ROM PLASTICA VE',NULL,3,0,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6b56e27c4f','fed_604397a5','10705','2026-02-14 18:00:00','I COLORI DEL VOLLEY TV',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,2,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6baa84f5b3','fed_604397a5','10726','2026-03-08 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'VLC DOLO ROM PLASTICA VE',NULL,3,0,NULL,'played','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6cc5f4f11a','fed_604397a5','10680','2026-01-11 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,0,3,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6d426ad4c2','fed_604397a5','10611','2025-10-18 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'LAGUNA VOLLEY VE',NULL,0,3,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6dd4b42b31','fed_dc788225','1017','2026-03-07 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'ALIT LOCARA',NULL,0,3,NULL,'played','16','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_6e3a558ccf','fed_604397a5','10677','2025-12-21 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,3,0,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_6e76906108','fed_dc788225','1006','2026-02-21 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,2,NULL,'played','14','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_6ecf4645d0','fed_604397a5','10604','2025-10-11 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,1,3,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_70dd30d6a7','fed_604397a5','10715','2026-02-28 20:00:00','PORDENONE VOLLEY PN',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,1,3,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_713937ae4c','fed_dc788225','1028','2026-03-21 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'SICELL GS VOLPE',NULL,NULL,NULL,NULL,'scheduled','18','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_713fa71484','fed_dc788225','984','2026-01-10 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'POOL PATAVIUM',NULL,0,3,NULL,'played','10','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_7336fe9803','fed_604397a5','10622','2025-11-01 20:30:00','LAGUNA VOLLEY VE',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,3,0,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_73f21c7708','fed_dc788225','1042','2026-04-11 20:30:00','SPEA SUMMANO',NULL,'ALIT LOCARA',NULL,NULL,NULL,NULL,'scheduled','20','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_740eb00f8d','fed_dc788225','1014','2026-02-28 20:30:00','SPEA SUMMANO',NULL,'A.S. S. CROCE',NULL,1,3,NULL,'played','15','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_7454b24574','fed_604397a5','10662','2025-12-07 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,3,0,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_7541c33378','fed_dc788225','976','2025-12-20 21:00:00','ALIT LOCARA',NULL,'SPEA SUMMANO',NULL,3,1,NULL,'played','9','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_75e124c6a5','fed_dc788225','977','2025-12-20 20:00:00','POOL PATAVIUM',NULL,'APV ASD TEAM VOLLEY 2007',NULL,1,3,NULL,'played','9','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_786b8c8335','fed_dc788225','973','2025-12-13 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'CAPPELLA FREGONA SARMEDE',NULL,0,3,NULL,'played','8','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_793a58ecf5','fed_604397a5','10714','2026-02-28 20:30:00','USMA PADOVA PD',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,0,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_79725a0edc','fed_dc788225','975','2025-12-20 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'A.S. S. CROCE',NULL,3,0,NULL,'played','9','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_7a386299a4','fed_dc788225','1038','2026-03-28 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'APV ASD TEAM VOLLEY 2007',NULL,NULL,NULL,NULL,'scheduled','19','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_7ae4a5ef67','fed_dc788225','930','2025-10-25 20:30:00','A.S. S. CROCE',NULL,'BANCA ANNIA ADUNA PW',NULL,3,0,NULL,'played','1','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_7ec345b6e5','fed_604397a5','10658','2025-12-06 18:00:00','I COLORI DEL VOLLEY TV',NULL,'USMA PADOVA PD',NULL,0,3,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_804c2c34a0','fed_604397a5','10723','2026-03-07 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'OFFICINA DEL VOLLEY PD',NULL,3,2,NULL,'played','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_83c0fb1fd7','fed_dc788225','1039','2026-03-28 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'VEGA FUSION TEAM VOLLEY',NULL,NULL,NULL,NULL,'scheduled','19','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_83d13c2a71','fed_604397a5','10687','2026-01-17 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'PALL. SANGIORGINA UD',NULL,3,2,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_848dc7bd95','fed_dc788225','989','2026-01-17 21:00:00','ALIT LOCARA',NULL,'PERUZZO IMPIANTI SOSUS',NULL,1,3,NULL,'played','11','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_86b84d5e00','fed_604397a5','10657','2025-12-06 20:00:00','PORDENONE VOLLEY PN',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,1,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_89a69a3bb8','fed_dc788225','940','2025-11-08 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,3,2,NULL,'played','3','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_89d56a6789','fed_3316c68e','2263','2026-04-19 11:30:00','AZIMUT GIORGIONE ROSSO ÉL',NULL,'AGB TIGERS GIALLA BASSANO',NULL,NULL,NULL,NULL,'scheduled','7','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_8a0cb4a18f','fed_604397a5','10697','2026-02-08 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'USMA PADOVA PD',NULL,3,2,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_8a79c53c85','fed_604397a5','10707','2026-02-22 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,2,3,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_8af4e467f9','fed_604397a5','10703','2026-02-14 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,3,2,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_8bdda9c6bb','fed_dc788225','992','2026-02-07 21:00:00','ALIT LOCARA',NULL,'POOL PATAVIUM',NULL,3,2,NULL,'played','12','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_8c57d41183','fed_3316c68e','2259','2026-04-12 15:00:00','MONTEVOLLEY BLU ÉLITE',NULL,'AZIMUT GIORGIONE ROSSO ÉL',NULL,NULL,NULL,NULL,'scheduled','6','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_8d59b2ef5d','fed_604397a5','10605','2025-10-12 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_90282c48eb','fed_dc788225','994','2026-02-07 20:30:00','SICELL GS VOLPE',NULL,'APV ASD TEAM VOLLEY 2007',NULL,0,3,NULL,'played','12','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_90843b4ab9','fed_604397a5','10665','2025-12-13 20:30:00','USMA PADOVA PD',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,3,2,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_9223efbe0b','fed_604397a5','10628','2025-11-02 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,1,3,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_92241ad465','fed_604397a5','10630','2025-11-08 20:30:00','USMA PADOVA PD',NULL,'LAGUNA VOLLEY VE',NULL,3,2,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_934a3f491d','fed_3316c68e','2245','2026-04-14 20:30:00','VEGA FUSION TEAM U16',NULL,'COLPO & ZILIO U.S.TORRI',NULL,NULL,NULL,NULL,'scheduled','3','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_9430861a13','fed_dc788225','963','2025-12-06 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'BANCA ANNIA ADUNA PW',NULL,3,1,NULL,'played','7','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_94da6a36af','fed_604397a5','10634','2025-11-09 18:30:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,3,1,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_9555082706','fed_3316c68e','2254','2026-03-29 15:00:00','MONTEVOLLEY BLU ÉLITE',NULL,'VEGA FUSION TEAM U16',NULL,NULL,NULL,NULL,'scheduled','5','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_959fe8cc35','fed_dc788225','1013','2026-02-28 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'BANCA ANNIA ADUNA PW',NULL,3,0,NULL,'played','15','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_95b4317e48','fed_604397a5','10632','2025-11-08 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'VEGA FUSION TEAM VOLLEY VE',NULL,3,1,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_979f38ef5a','fed_3316c68e','2256','2026-04-12 18:00:00','AGB TIGERS GIALLA BASSANO',NULL,'ARBIZZANO VOLLEY BLU',NULL,NULL,NULL,NULL,'scheduled','6','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_982f6cc19d','fed_604397a5','10689','2026-01-17 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,3,2,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_9c50623acc','fed_dc788225','1023','2026-03-14 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,3,1,NULL,'played','17','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_9d020490b6','fed_dc788225','947','2025-11-15 20:00:00','BANCA ANNIA ADUNA PW',NULL,'PERUZZO IMPIANTI SOSUS',NULL,1,3,NULL,'played','4','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a03b58a026','fed_3316c68e','2258','2026-04-12 11:00:00','VEGA FUSION TEAM U16',NULL,'VOLLEY CLUB PADOVA',NULL,NULL,NULL,NULL,'scheduled','6','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_a0e8ef9080','fed_dc788225','1045','2026-04-11 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'SICELL GS VOLPE',NULL,NULL,NULL,NULL,'scheduled','20','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a13742c01c','fed_604397a5','10649','2025-11-23 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_a185c581f0','fed_dc788225','928','2025-10-25 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'SICELL GS VOLPE',NULL,3,0,NULL,'played','1','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a3296c2bcf','fed_dc788225','942','2025-11-08 20:30:00','AURORA VITTINOX-LGI',NULL,'A.S. S. CROCE',NULL,3,1,NULL,'played','3','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a494a65bed','fed_604397a5','10685','2026-01-17 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'I COLORI DEL VOLLEY TV',NULL,3,1,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_a67551a73b','fed_dc788225','954','2025-11-22 20:30:00','AURORA VITTINOX-LGI',NULL,'SPEA SUMMANO',NULL,3,2,NULL,'played','5','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a715dab54c','fed_dc788225','1056','2026-04-25 20:00:00','POOL PATAVIUM',NULL,'AURORA VITTINOX-LGI',NULL,NULL,NULL,NULL,'scheduled','22','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a7ea826b53','fed_dc788225','1041','2026-04-11 20:30:00','A.S. S. CROCE',NULL,'CAPPELLA FREGONA SARMEDE',NULL,NULL,NULL,NULL,'scheduled','20','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a803f59f5b','fed_dc788225','934','2025-11-01 20:30:00','SICELL GS VOLPE',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,2,NULL,'played','2','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_a8521493d3','fed_3316c68e','2251','2026-03-22 11:30:00','VEGA FUSION TEAM U16',NULL,'AZIMUT GIORGIONE ROSSO ÉL',NULL,NULL,NULL,NULL,'scheduled','4','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_a8d4ccf813','fed_604397a5','10606','2025-10-11 20:30:00','USMA PADOVA PD',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,1,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_a8e4a2fedb','fed_604397a5','10712','2026-02-21 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'I COLORI DEL VOLLEY TV',NULL,1,3,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_a8e9cd3c01','fed_dc788225','953','2025-11-22 18:30:00','APV ASD TEAM VOLLEY 2007',NULL,'A.S. S. CROCE',NULL,3,1,NULL,'played','5','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_aa000034f8','fed_dc788225','995','2026-02-07 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'SPEA SUMMANO',NULL,3,0,NULL,'played','12','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_aa2e0aa664','fed_604397a5','10667','2025-12-14 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,2,3,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ab83269d9d','fed_dc788225','1001','2026-02-14 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,3,0,NULL,'played','13','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_ac9d8ab982','fed_3316c68e','2240','2026-03-08 18:00:00','AGB TIGERS GIALLA BASSANO',NULL,'VEGA FUSION TEAM U16',NULL,0,3,NULL,'played','2','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_acb2785c54','fed_604397a5','10695','2026-02-07 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,3,2,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_acdd6b80ba','fed_dc788225','1020','2026-03-07 20:30:00','SPEA SUMMANO',NULL,'AURORA VITTINOX-LGI',NULL,3,0,NULL,'played','16','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_b1850cfee4','fed_dc788225','1024','2026-03-14 21:00:00','ALIT LOCARA',NULL,'BANCA ANNIA ADUNA PW',NULL,3,0,NULL,'played','17','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_b33c1bd2fd','fed_604397a5','10686','2026-01-18 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'LAGUNA VOLLEY VE',NULL,0,3,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_b446a5568b','fed_604397a5','10655','2025-11-29 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,0,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_b5fefead61','fed_dc788225','1018','2026-03-07 20:00:00','BANCA ANNIA ADUNA PW',NULL,'POOL PATAVIUM',NULL,1,3,NULL,'played','16','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_b64e449126','fed_dc788225','1049','2026-04-18 21:00:00','ALIT LOCARA',NULL,'APV ASD TEAM VOLLEY 2007',NULL,NULL,NULL,NULL,'scheduled','21','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_b836f6cbd0','fed_dc788225','968','2025-12-13 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'AURORA VITTINOX-LGI',NULL,1,3,NULL,'played','8','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_b8fa606f51','fed_dc788225','1026','2026-03-14 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'SPEA SUMMANO',NULL,3,0,NULL,'played','17','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_b95511da2b','fed_604397a5','10698','2026-02-07 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'PORDENONE VOLLEY PN',NULL,3,2,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ba8d1c8b9b','fed_604397a5','10701','2026-02-14 20:00:00','PORDENONE VOLLEY PN',NULL,'VLC DOLO ROM PLASTICA VE',NULL,2,3,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_bbcc9527f3','fed_3316c68e','2261','2026-04-19 10:30:00','VOLLEY BALL POLESELLA',NULL,'VEGA FUSION TEAM U16',NULL,NULL,NULL,NULL,'scheduled','7','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_bcbfef31d9','fed_604397a5','10724','2026-03-07 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'I COLORI DEL VOLLEY TV',NULL,2,3,NULL,'played','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_bcc1ee6b8d','fed_dc788225','1040','2026-04-11 20:00:00','BANCA ANNIA ADUNA PW',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,NULL,NULL,NULL,'scheduled','20','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_bda100726d','fed_dc788225','960','2025-11-29 20:30:00','SPEA SUMMANO',NULL,'APV ASD TEAM VOLLEY 2007',NULL,0,3,NULL,'played','6','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_be04e27a14','fed_604397a5','10733','2026-03-15 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'PALL. SANGIORGINA UD',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_c09e32c38b','fed_604397a5','10664','2025-12-13 20:00:00','PORDENONE VOLLEY PN',NULL,'I COLORI DEL VOLLEY TV',NULL,0,3,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_c20452782c','fed_dc788225','974','2025-12-20 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'BANCA ANNIA ADUNA PW',NULL,3,0,NULL,'played','9','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_c2f353ef37','fed_dc788225','1011','2026-02-28 21:00:00','ALIT LOCARA',NULL,'SICELL GS VOLPE',NULL,3,0,NULL,'played','15','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_c37d829956','fed_604397a5','10612','2025-10-18 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,0,3,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_c43eece3e5','fed_dc788225','986','2026-01-17 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'A.S. S. CROCE',NULL,2,3,NULL,'played','11','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_c510b19cc4','fed_dc788225','993','2026-02-07 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,1,NULL,'played','12','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_c5d4446dc5','fed_604397a5','10720','2026-03-08 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,0,0,NULL,'scheduled','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_c631d77bc6','fed_3316c68e','2260','2026-04-19 18:00:00','ARBIZZANO VOLLEY BLU',NULL,'COLPO & ZILIO U.S.TORRI',NULL,NULL,NULL,NULL,'scheduled','7','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_c8f5d52dc6','fed_dc788225','1027','2026-03-14 20:00:00','POOL PATAVIUM',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','17','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_c9f5d9bd71','fed_dc788225','1046','2026-04-18 20:30:00','AURORA VITTINOX-LGI',NULL,'BANCA ANNIA ADUNA PW',NULL,NULL,NULL,NULL,'scheduled','21','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_cab7b5addf','fed_dc788225','965','2025-12-06 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'SPEA SUMMANO',NULL,2,3,NULL,'played','7','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_cc6ed57516','fed_dc788225','958','2025-11-29 20:00:00','BANCA ANNIA ADUNA PW',NULL,'ALIT LOCARA',NULL,1,3,NULL,'played','6','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_cccd683cf0','fed_3316c68e','2255','2026-03-29 11:30:00','AZIMUT GIORGIONE ROSSO ÉL',NULL,'ARBIZZANO VOLLEY BLU',NULL,NULL,NULL,NULL,'scheduled','5','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_ccf16cd040','fed_604397a5','10731','2026-03-15 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_cd97597bc1','fed_dc788225','996','2026-02-07 20:00:00','BANCA ANNIA ADUNA PW',NULL,'A.S. S. CROCE',NULL,1,3,NULL,'played','12','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_cf0117d256','fed_dc788225','1000','2026-02-14 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'SICELL GS VOLPE',NULL,3,0,NULL,'played','13','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_cf06b68622','fed_604397a5','10728','2026-03-14 20:00:00','PORDENONE VOLLEY PN',NULL,'LAGUNA VOLLEY VE',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_cf1bf52221','fed_604397a5','10669','2025-12-13 20:30:00','LAGUNA VOLLEY VE',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,0,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_cf6b8149ee','fed_dc788225','946','2025-11-15 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'POOL PATAVIUM',NULL,0,3,NULL,'played','4','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_d0688013d0','fed_604397a5','10694','2026-02-08 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'I COLORI DEL VOLLEY TV',NULL,3,2,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_d0b50db8d2','fed_604397a5','10693','2026-02-07 20:30:00','PALL. SANGIORGINA UD',NULL,'LAGUNA VOLLEY VE',NULL,0,3,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_d29038532a','fed_dc788225','945','2025-11-15 20:30:00','SICELL GS VOLPE',NULL,'ALIT LOCARA',NULL,3,0,NULL,'played','4','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_d3d06d5207','fed_dc788225','972','2025-12-13 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,2,NULL,'played','8','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_d4a27ed998','fed_604397a5','10631','2025-11-08 20:00:00','PORDENONE VOLLEY PN',NULL,'PALL. SANGIORGINA UD',NULL,1,3,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_d4d28148c4','fed_dc788225','927','2025-10-25 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'CAPPELLA FREGONA SARMEDE',NULL,0,3,NULL,'played','1','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_d5225478d8','fed_604397a5','10639','2025-11-15 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'OFFICINA DEL VOLLEY PD',NULL,0,3,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_d627de3135','fed_dc788225','1051','2026-04-18 20:30:00','PLP PREFABBRICATI GRUMOLO',NULL,'VEGA FUSION TEAM VOLLEY',NULL,NULL,NULL,NULL,'scheduled','21','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_d6b541bfcb','fed_604397a5','10684','2026-01-10 20:30:00','LAGUNA VOLLEY VE',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_d7b986ef3d','fed_3316c68e','2257','2026-03-18 20:30:00','COLPO & ZILIO U.S.TORRI',NULL,'VOLLEY BALL POLESELLA',NULL,3,0,NULL,'played','6','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_d82779c0e2','fed_dc788225','941','2025-11-08 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'BANCA ANNIA ADUNA PW',NULL,3,0,NULL,'played','3','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_d944f81915','fed_604397a5','10633','2025-11-08 18:00:00','I COLORI DEL VOLLEY TV',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,3,NULL,'played','5','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_da3aa43b20','fed_604397a5','10654','2025-11-29 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,1,3,NULL,'played','8','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_dacb118789','fed_dc788225','1029','2026-03-21 20:00:00','BANCA ANNIA ADUNA PW',NULL,'CAPPELLA FREGONA SARMEDE',NULL,NULL,NULL,NULL,'scheduled','18','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_dae89f7376','fed_dc788225','967','2025-12-06 21:00:00','ALIT LOCARA',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','7','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_dbd99b04dd','fed_dc788225','1010','2026-02-28 20:30:00','AURORA VITTINOX-LGI',NULL,'CAPPELLA FREGONA SARMEDE',NULL,0,3,NULL,'played','15','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_dbf638f6ef','fed_604397a5','10643','2025-11-22 21:00:00','USMA PADOVA PD',NULL,'PALL. SANGIORGINA UD',NULL,3,0,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_dce0cb8f4d','fed_dc788225','991','2026-01-17 20:00:00','BANCA ANNIA ADUNA PW',NULL,'VEGA FUSION TEAM VOLLEY',NULL,0,3,NULL,'played','11','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_dce289f9e7','fed_604397a5','10645','2025-11-22 20:30:00','I COLORI DEL VOLLEY TV',NULL,'LAGUNA VOLLEY VE',NULL,1,3,NULL,'played','7','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_de078e1464','fed_604397a5','10614','2025-10-19 17:30:00','BASSANO VOLLEY A.S.D VI',NULL,'I COLORI DEL VOLLEY TV',NULL,3,1,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_de1a1be589','fed_604397a5','10700','2026-02-15 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'PALL. SANGIORGINA UD',NULL,3,0,NULL,'played','15','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_df2620b747','fed_604397a5','10727','2026-03-14 20:30:00','USMA PADOVA PD',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_df464512b4','fed_3316c68e','2250','2026-03-22 18:00:00','ARBIZZANO VOLLEY BLU',NULL,'VOLLEY BALL POLESELLA',NULL,NULL,NULL,NULL,'scheduled','4','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_e070a7f025','fed_604397a5','10692','2026-02-08 18:00:00','VLC DOLO ROM PLASTICA VE',NULL,'OFFICINA DEL VOLLEY PD',NULL,1,3,NULL,'played','14','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e07c17a1bb','fed_604397a5','10730','2026-03-14 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e10f8bcf5b','fed_604397a5','10659','2025-12-06 20:30:00','OFFICINA DEL VOLLEY PD',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,2,3,NULL,'played','9','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e1148b7a1b','fed_3316c68e','2246','2026-03-15 11:30:00','VOLLEY CLUB PADOVA',NULL,'ARBIZZANO VOLLEY BLU',NULL,3,0,NULL,'played','3','2026-03-19 22:03:29','2026-03-19 22:03:29'),('m_e1be22973c','fed_604397a5','10725','2026-03-07 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,1,3,NULL,'played','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e2d9cdb8c2','fed_604397a5','10690','2026-01-17 19:00:00','BLU TEAM PAVIA  UDINE UD',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,3,0,NULL,'played','13','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e32559018c','fed_dc788225','964','2025-12-06 20:00:00','POOL PATAVIUM',NULL,'A.S. S. CROCE',NULL,3,0,NULL,'played','7','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e327f53e78','fed_dc788225','983','2026-01-10 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'ALIT LOCARA',NULL,3,1,NULL,'played','10','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e36869aa44','fed_dc788225','1033','2026-03-21 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'ALIT LOCARA',NULL,NULL,NULL,NULL,'scheduled','18','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e36a35cc96','fed_604397a5','10673','2025-12-20 20:30:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,3,0,NULL,'played','11','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e3da653d3f','fed_dc788225','990','2026-01-17 20:30:00','AURORA VITTINOX-LGI',NULL,'POOL PATAVIUM',NULL,1,3,NULL,'played','11','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e568171e23','fed_dc788225','1043','2026-04-11 20:30:00','APV ASD TEAM VOLLEY 2007',NULL,'POOL PATAVIUM',NULL,NULL,NULL,NULL,'scheduled','20','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e638ed23e2','fed_604397a5','10609','2025-10-19 18:30:00','PALL. SANGIORGINA UD',NULL,'CFV - IZC COSTRUZIONI  PN',NULL,1,3,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e6faa1a09c','fed_dc788225','966','2025-12-06 20:30:00','AURORA VITTINOX-LGI',NULL,'APV ASD TEAM VOLLEY 2007',NULL,3,1,NULL,'played','7','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e71520dd45','fed_604397a5','10719','2026-03-01 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'BASSANO VOLLEY A.S.D VI',NULL,3,1,NULL,'played','17','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_e796dbfe55','fed_dc788225','1003','2026-02-14 20:30:00','A.S. S. CROCE',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','13','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_e9c17bf9d0','fed_dc788225','998','2026-02-14 20:30:00','AURORA VITTINOX-LGI',NULL,'ALIT LOCARA',NULL,3,2,NULL,'played','13','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_eabf0e5dae','fed_604397a5','10666','2025-12-13 19:30:00','PSG DOMOVIP-FB TANKS PORCIA PN',NULL,'VLC DOLO ROM PLASTICA VE',NULL,2,3,NULL,'played','10','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ead9798171','fed_dc788225','959','2025-11-29 20:30:00','A.S. S. CROCE',NULL,'PERUZZO IMPIANTI SOSUS',NULL,3,2,NULL,'played','6','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_eadc69c99c','fed_604397a5','10640','2025-11-16 18:00:00','CFV - IZC COSTRUZIONI  PN',NULL,'BASSANO VOLLEY A.S.D VI',NULL,0,3,NULL,'played','6','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ebb7e66121','fed_dc788225','985','2026-01-10 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,1,3,NULL,'played','10','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_ecf1bb10ec','fed_604397a5','10607','2025-10-11 20:00:00','PORDENONE VOLLEY PN',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,1,3,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ed63c43dbb','fed_dc788225','937','2025-11-01 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'A.S. S. CROCE',NULL,3,1,NULL,'played','2','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_ef9bed9f94','fed_dc788225','1036','2026-03-28 21:00:00','ALIT LOCARA',NULL,'A.S. S. CROCE',NULL,NULL,NULL,NULL,'scheduled','19','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_f0035ed7f1','fed_dc788225','988','2026-01-17 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'APV ASD TEAM VOLLEY 2007',NULL,3,1,NULL,'played','11','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_f1ddce4a88','fed_604397a5','10610','2025-10-18 20:30:00','VLC DOLO ROM PLASTICA VE',NULL,'PORDENONE VOLLEY PN',NULL,3,2,NULL,'played','2','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_f44ac10b76','fed_604397a5','10732','2026-03-15 18:00:00','PANPIUMA TERRAGLIO VOLLEY VE',NULL,'BLU TEAM PAVIA  UDINE UD',NULL,0,0,NULL,'scheduled','19','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_f49e31d718','fed_dc788225','1048','2026-04-18 19:30:00','CAPPELLA FREGONA SARMEDE',NULL,'SPEA SUMMANO',NULL,NULL,NULL,NULL,'scheduled','21','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_f69d836611','fed_604397a5','10683','2026-01-10 20:30:00','PALL. SANGIORGINA UD',NULL,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,3,0,NULL,'played','12','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_f827fd07c7','fed_dc788225','955','2025-11-22 20:30:00','PERUZZO IMPIANTI SOSUS',NULL,'VEGA FUSION TEAM VOLLEY',NULL,3,0,NULL,'played','5','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_f8589c1b6d','fed_604397a5','10625','2025-11-01 20:30:00','PALL. SANGIORGINA UD',NULL,'I COLORI DEL VOLLEY TV',NULL,1,3,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_f87fdfc575','fed_dc788225','952','2025-11-22 20:00:00','POOL PATAVIUM',NULL,'BANCA ANNIA ADUNA PW',NULL,3,0,NULL,'played','5','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_f880e534df','fed_604397a5','10722','2026-03-07 20:30:00','PALL. SANGIORGINA UD',NULL,'PORDENONE VOLLEY PN',NULL,3,2,NULL,'played','18','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_f9aafcc3b4','fed_dc788225','949','2025-11-15 17:00:00','VEGA FUSION TEAM VOLLEY',NULL,'APV ASD TEAM VOLLEY 2007',NULL,0,3,NULL,'played','4','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_f9ab686997','fed_dc788225','1007','2026-02-21 20:00:00','BANCA ANNIA ADUNA PW',NULL,'APV ASD TEAM VOLLEY 2007',NULL,1,3,NULL,'played','14','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_fbea7382f6','fed_604397a5','10602','2025-10-11 20:30:00','LAGUNA VOLLEY VE',NULL,'PALL. SANGIORGINA UD',NULL,3,0,NULL,'played','1','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_fd6e669c0b','fed_dc788225','1034','2026-03-28 20:30:00','AURORA VITTINOX-LGI',NULL,'PLP PREFABBRICATI GRUMOLO',NULL,NULL,NULL,NULL,'scheduled','19','2026-03-17 23:09:38','2026-03-17 23:09:38'),('m_ff6bbfa4ba','fed_604397a5','10709','2026-02-21 20:30:00','VEGA FUSION TEAM VOLLEY VE',NULL,'USMA PADOVA PD',NULL,1,3,NULL,'played','16','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ffbc62c0f9','fed_604397a5','10627','2025-11-01 20:30:00','SYNERGY V. VENEZIA.-JESOLO VE',NULL,'VLC DOLO ROM PLASTICA VE',NULL,1,3,NULL,'played','4','2026-03-08 20:29:47','2026-03-08 20:29:47'),('m_ffe1e6bf4a','fed_3316c68e','2238','2026-03-01 17:00:00','MONTEVOLLEY BLU ÉLITE',NULL,'VOLLEY BALL POLESELLA',NULL,3,0,NULL,'played','1','2026-03-19 22:03:29','2026-03-19 22:03:29');
/*!40000 ALTER TABLE `federation_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `federation_standings`
--

DROP TABLE IF EXISTS `federation_standings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `federation_standings` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `championship_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` smallint NOT NULL,
  `team` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points` smallint NOT NULL DEFAULT '0',
  `played` smallint NOT NULL DEFAULT '0',
  `won` smallint NOT NULL DEFAULT '0',
  `lost` smallint NOT NULL DEFAULT '0',
  `sets_won` smallint NOT NULL DEFAULT '0',
  `sets_lost` smallint NOT NULL DEFAULT '0',
  `points_won` smallint NOT NULL DEFAULT '0',
  `points_lost` smallint NOT NULL DEFAULT '0',
  `penalty` smallint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fed_stand_champ` (`championship_id`),
  CONSTRAINT `fk_fed_stand_champ` FOREIGN KEY (`championship_id`) REFERENCES `federation_championships` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `federation_standings`
--

LOCK TABLES `federation_standings` WRITE;
/*!40000 ALTER TABLE `federation_standings` DISABLE KEYS */;
INSERT INTO `federation_standings` VALUES ('s_002a30f696','fed_dc788225',10,'PLP PREFABBRICATI GRUMOLO','/mngArea/Societa/img/567/Loghi/LogoS567.png',17,17,5,12,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_076732b4f0','fed_dc788225',9,'SPEA SUMMANO','/mngArea/Societa/img/560/Loghi/LogoS560.jpg',19,17,6,11,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_13a85ab31a','fed_604397a5',3,'PANPIUMA TERRAGLIO VOLLEY VE',NULL,41,18,15,3,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_2199427e74','fed_604397a5',13,'PORDENONE VOLLEY PN',NULL,15,18,4,14,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_2bd5a73cb4','fed_dc788225',11,'VEGA FUSION TEAM VOLLEY','/mngArea/Societa/img/3837/Loghi/LogoS3837.png',9,17,3,14,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_2dead4998e','fed_dc788225',2,'POOL PATAVIUM','/mngArea/Societa/img/62/Loghi/LogoS62.jpg',44,17,14,3,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_2f2ac54949','fed_604397a5',12,'SYNERGY V. VENEZIA.-JESOLO VE',NULL,15,18,5,13,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_34f70c69fe','fed_dc788225',8,'SICELL GS VOLPE','/mngArea/Societa/img/113/Loghi/LogoS113.jpg',19,17,7,10,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_3f9f0918ae','fed_3316c68e',3,'VOLLEY CLUB PADOVA','/mngArea/Societa/img/69/Loghi/LogoS69.jpg',6,2,2,0,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_3fa8d607ce','fed_604397a5',7,'BASSANO VOLLEY A.S.D VI',NULL,27,18,9,9,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_456f80fc2d','fed_3316c68e',8,'VOLLEY BALL POLESELLA','/mngArea/Societa/img/111/Loghi/LogoS111.JPG',0,4,0,4,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_485d311b4a','fed_dc788225',7,'PERUZZO IMPIANTI SOSUS','/mngArea/Societa/img/247/Loghi/LogoS247.png',24,17,6,11,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_54ec07ddf5','fed_604397a5',2,'LAGUNA VOLLEY VE',NULL,45,18,15,3,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_570e2058bc','fed_604397a5',14,'CFV - IZC COSTRUZIONI  PN',NULL,13,17,3,14,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_5bd6bd729c','fed_3316c68e',2,'MONTEVOLLEY BLU ÉLITE','/mngArea/Societa/img/126/Loghi/LogoS126.png',9,3,3,0,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_5e7efbfafc','fed_dc788225',1,'CAPPELLA FREGONA SARMEDE','/mngArea/Societa/img/265/Loghi/LogoS265.JPG',45,17,15,2,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_645f48928e','fed_dc788225',5,'AURORA VITTINOX-LGI','/mngArea/Societa/img/152/Loghi/LogoS152.jpg',29,17,10,7,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_6d317ede65','fed_604397a5',1,'BLU TEAM PAVIA  UDINE UD',NULL,48,18,15,3,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_7a3a8cf8f7','fed_604397a5',4,'USMA PADOVA PD',NULL,41,18,14,4,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_7dcb7346d7','fed_dc788225',6,'A.S. S. CROCE','/mngArea/Societa/img/283/Loghi/LogoS283.jpg',27,17,11,6,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_963fa2ffef','fed_dc788225',3,'APV ASD TEAM VOLLEY 2007','/mngArea/Societa/img/1210/Loghi/LogoS1210.png',41,17,14,3,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_96d2f165c8','fed_604397a5',10,'VLC DOLO ROM PLASTICA VE',NULL,16,18,6,12,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_a23024d143','fed_604397a5',5,'I COLORI DEL VOLLEY TV',NULL,31,18,11,7,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_acb5d5ea8e','fed_3316c68e',1,'COLPO & ZILIO U.S.TORRI','/mngArea/Societa/img/5446/Loghi/LogoS5446.png',9,3,3,0,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_b4b0d4e764','fed_3316c68e',6,'ARBIZZANO VOLLEY BLU','/mngArea/Societa/img/1754/Loghi/LogoS1754.jpg',0,3,0,3,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_b79550c1f8','fed_dc788225',12,'BANCA ANNIA ADUNA PW','/mngArea/Societa/img/14/Loghi/LogoS14.jpg',1,17,0,17,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_c7944f62a3','fed_3316c68e',7,'AGB TIGERS GIALLA BASSANO','/mngArea/Societa/img/4882/Loghi/LogoS4882.jpg',0,3,0,3,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_d507d142c1','fed_604397a5',8,'PSG DOMOVIP-FB TANKS PORCIA PN',NULL,21,17,8,9,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_d94cad31ac','fed_604397a5',9,'PALL. SANGIORGINA UD',NULL,17,18,5,13,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_d967919f0b','fed_604397a5',6,'OFFICINA DEL VOLLEY PD',NULL,29,18,9,9,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47'),('s_dcee1d6ba5','fed_3316c68e',4,'VEGA FUSION TEAM U16','/mngArea/Societa/img/3837/Loghi/LogoS3837.png',6,2,2,0,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_e233a7b75f','fed_3316c68e',5,'AZIMUT GIORGIONE ROSSO ÉL','/mngArea/Societa/img/234/Loghi/LogoS234.jpg',3,2,1,1,0,0,0,0,0,'2026-03-19 22:03:29','2026-03-19 22:03:29'),('s_f3fb179969','fed_dc788225',4,'ALIT LOCARA','/mngArea/Societa/img/3134/Loghi/LogoS3134.jpg',31,17,11,6,0,0,0,0,0,'2026-03-17 23:09:38','2026-03-17 23:09:38'),('s_f8126435bf','fed_604397a5',11,'VEGA FUSION TEAM VOLLEY VE',NULL,16,18,6,12,0,0,0,0,0,'2026-03-08 20:29:47','2026-03-08 20:29:47');
/*!40000 ALTER TABLE `federation_standings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiscal_years`
--

DROP TABLE IF EXISTS `fiscal_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiscal_years` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fy_tenant` (`tenant_id`),
  CONSTRAINT `fk_fy_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiscal_years`
--

LOCK TABLES `fiscal_years` WRITE;
/*!40000 ALTER TABLE `fiscal_years` DISABLE KEYS */;
INSERT INTO `fiscal_years` VALUES ('FY_2526','TNT_default','2025-2026','2025-09-01','2026-08-31',1,0,'2026-03-03 01:22:38');
/*!40000 ALTER TABLE `fiscal_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gdpr_consents`
--

DROP TABLE IF EXISTS `gdpr_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gdpr_consents` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consent_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted` tinyint(1) NOT NULL DEFAULT '0',
  `granted_at` datetime DEFAULT NULL,
  `granted_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gdpr_athlete` (`athlete_id`),
  KEY `idx_gdpr_tenant` (`tenant_id`),
  KEY `idx_gdpr_type` (`consent_type`),
  KEY `fk_gdpr_granter` (`granted_by`),
  CONSTRAINT `fk_gdpr_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gdpr_granter` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gdpr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gdpr_consents`
--

LOCK TABLES `gdpr_consents` WRITE;
/*!40000 ALTER TABLE `gdpr_consents` DISABLE KEYS */;
/*!40000 ALTER TABLE `gdpr_consents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guardians`
--

DROP TABLE IF EXISTS `guardians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guardians` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_code` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_guardians_athlete` (`athlete_id`),
  KEY `idx_guardians_tenant` (`tenant_id`),
  CONSTRAINT `fk_guardians_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_guardians_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guardians`
--

LOCK TABLES `guardians` WRITE;
/*!40000 ALTER TABLE `guardians` DISABLE KEYS */;
/*!40000 ALTER TABLE `guardians` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gyms`
--

DROP TABLE IF EXISTS `gyms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gyms` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_gyms_creator` (`created_by`),
  CONSTRAINT `fk_gyms_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gyms`
--

LOCK TABLES `gyms` WRITE;
/*!40000 ALTER TABLE `gyms` DISABLE KEYS */;
INSERT INTO `gyms` VALUES ('GYM_07b99890','Palestra Trento 2','Via Trento, 26, 30030 Martellago VE, Italia',45.5425258,12.1566132,'USR_admin0001','2026-03-02 22:10:03'),('GYM_d619c423','Palestra Matteotti','Via A. Manzoni, 30030 Maerne VE, Italia',45.5210983,12.1572553,'USR_admin0001','2026-03-02 22:10:03'),('GYM_e79dd747','Palavega','Via Andrea Vicentino, 1, 30174 Trivignano I VE, Italia',45.5282025,12.1911500,'USR_admin0001','2026-03-02 22:10:03');
/*!40000 ALTER TABLE `gyms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `injury_records`
--

DROP TABLE IF EXISTS `injury_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `injury_records` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `injury_date` date NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body_part` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'moderate',
  `stop_days` smallint DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `treated_by` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inj_athlete` (`athlete_id`),
  KEY `idx_inj_tenant` (`tenant_id`),
  KEY `fk_inj_creator` (`created_by`),
  CONSTRAINT `fk_inj_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inj_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inj_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `injury_records`
--

LOCK TABLES `injury_records` WRITE;
/*!40000 ALTER TABLE `injury_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `injury_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `installments`
--

DROP TABLE IF EXISTS `installments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `installments` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `plan_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','PAID','OVERDUE','REFUNDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paid_date` date DEFAULT NULL,
  `payment_method` enum('BANK_TRANSFER','CARD','CASH','SEPA','STRIPE','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inst_plan` (`plan_id`),
  KEY `idx_inst_status` (`status`),
  KEY `idx_inst_due` (`due_date`),
  CONSTRAINT `fk_inst_plan` FOREIGN KEY (`plan_id`) REFERENCES `payment_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `installments`
--

LOCK TABLES `installments` WRITE;
/*!40000 ALTER TABLE `installments` DISABLE KEYS */;
/*!40000 ALTER TABLE `installments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_sequences`
--

DROP TABLE IF EXISTS `invoice_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_sequences` (
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` smallint NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fattura',
  `last_number` int NOT NULL DEFAULT '0',
  `prefix` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`tenant_id`,`year`,`type`),
  CONSTRAINT `fk_invseq_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_sequences`
--

LOCK TABLES `invoice_sequences` WRITE;
/*!40000 ALTER TABLE `invoice_sequences` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_sequences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ricevuta',
  `direction` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'out',
  `recipient_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_cf` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_piva` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdi_code` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pec` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `line_items` json DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `sdi_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdi_response` json DEFAULT NULL,
  `xml_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pdf_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `payment_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `journal_entry_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inv_tenant` (`tenant_id`),
  KEY `idx_inv_number` (`tenant_id`,`invoice_number`),
  KEY `idx_inv_status` (`status`),
  KEY `idx_inv_date` (`created_at`),
  KEY `fk_inv_creator` (`created_by`),
  CONSTRAINT `fk_inv_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inv_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_entries`
--

DROP TABLE IF EXISTS `journal_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entries` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_number` int NOT NULL,
  `entry_date` date NOT NULL,
  `description` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_je_tenant_date` (`tenant_id`,`entry_date`),
  KEY `idx_je_category` (`category`),
  KEY `idx_je_number` (`tenant_id`,`entry_number`),
  KEY `fk_je_creator` (`created_by`),
  CONSTRAINT `fk_je_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_je_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_entries`
--

LOCK TABLES `journal_entries` WRITE;
/*!40000 ALTER TABLE `journal_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_lines`
--

DROP TABLE IF EXISTS `journal_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_lines` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `debit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `credit` decimal(12,2) NOT NULL DEFAULT '0.00',
  `notes` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jl_entry` (`entry_id`),
  KEY `idx_jl_account` (`account_id`),
  CONSTRAINT `fk_jl_account` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `fk_jl_entry` FOREIGN KEY (`entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_lines`
--

LOCK TABLES `journal_lines` WRITE;
/*!40000 ALTER TABLE `journal_lines` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_attempts` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_login_attempts_ip_ts` (`ip_address`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES ('LGA_00ef32bb','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:54:16','2026-03-08 10:54:16'),('LGA_010b7d2b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:36:53','2026-03-07 01:36:53'),('LGA_017cc54f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 00:30:03','2026-03-05 00:30:03'),('LGA_021ea86e','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_0235b173','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_03b9e8f3','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:30:19','2026-03-07 00:30:19'),('LGA_03c2cab2','127.0.0.1','admin@fusionteamvolley.it',0,'2026-03-09 18:20:18','2026-03-09 18:20:18'),('LGA_03cfa256','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 23:22:48','2026-03-04 23:22:48'),('LGA_05aa9040','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_06173168','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:24:46','2026-03-06 20:24:46'),('LGA_0687e3a3','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 00:39:38','2026-03-08 00:39:38'),('LGA_081cfda4','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 20:33:10','2026-03-03 20:33:10'),('LGA_083ee6ae','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_0a266734','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 22:36:26','2026-03-04 22:36:26'),('LGA_0a766606','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_0b2a0539','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:52:18','2026-03-06 21:52:18'),('LGA_0b8b2e17','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 14:14:15','2026-03-06 14:14:15'),('LGA_0c212f3f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:22:47','2026-03-06 22:22:47'),('LGA_0c560749','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_0d132ab4','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_0f9c3fc4','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_10e75cc0','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:18:20','2026-03-06 22:18:20'),('LGA_11ec8522','93.150.247.239','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_1429d384','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 23:09:40','2026-03-05 23:09:40'),('LGA_155d4bd1','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:17:59','2026-03-05 22:17:59'),('LGA_15a122d5','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_15fbda9e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:02:44','2026-03-06 20:02:44'),('LGA_170f6b8d','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 20:05:12','2026-03-08 20:05:12'),('LGA_172d28e9','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_18b5728d','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 23:28:43','2026-03-05 23:28:43'),('LGA_18f866ff','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_1a1000ee','::1','marco@marcovanzo.com',1,'2026-03-08 21:41:35','2026-03-08 21:41:35'),('LGA_1a8cab39','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:28:24','2026-03-06 23:28:24'),('LGA_1a943c1f','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_1ac1a6f7','127.0.0.1','marco@marcovanzo.com',1,'2026-03-12 00:24:52','2026-03-12 00:24:52'),('LGA_1b9d0172','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_1c30650f','127.0.0.1','marco@marcovanzo.com',1,'2026-03-11 23:00:31','2026-03-11 23:00:31'),('LGA_1c91ea26','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 01:27:21','2026-03-08 01:27:21'),('LGA_1ca8eeb7','45.135.24.240','test@test.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_1d4e02f8','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 16:30:58','2026-03-04 16:30:58'),('LGA_1d6a547c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:59:29','2026-03-06 00:59:29'),('LGA_1de011a8','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 21:56:47','2026-03-05 21:56:47'),('LGA_1f00170b','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_1f181550','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 16:52:32','2026-03-04 16:52:32'),('LGA_1fb9468a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 10:17:33','2026-03-07 10:17:33'),('LGA_213c60d0','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:03:34','2026-03-06 20:03:34'),('LGA_2144ef71','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:57:48','2026-03-06 22:57:48'),('LGA_21748c2d','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:40:05','2026-03-05 22:40:05'),('LGA_23ebc896','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:35:54','2026-03-06 21:35:54'),('LGA_2496fbc6','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_25cf754a','45.135.24.240','admin@fusionerp.it',0,'2026-03-03 00:12:21','2026-03-03 00:12:21'),('LGA_2754a69a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:39:27','2026-03-03 23:39:27'),('LGA_2820e9aa','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:01:51','2026-03-06 20:01:51'),('LGA_2831fce0','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:58:48','2026-03-08 10:58:48'),('LGA_299a27d5','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_29a56951','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-04 22:55:01','2026-03-04 22:55:01'),('LGA_29ab22e7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:57:51','2026-03-06 00:57:51'),('LGA_2a8de6e3','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 17:52:57','2026-03-06 17:52:57'),('LGA_2b136ffb','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 20:14:53','2026-03-03 20:14:53'),('LGA_2b250872','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_2b2d6e16','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:28:33','2026-03-07 01:28:33'),('LGA_2c90ca58','93.150.241.243','marco@marcovanzo.com',1,'2026-03-06 09:51:25','2026-03-06 09:51:25'),('LGA_2e66b363','45.135.24.240','marco.vanzo@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_2f6c586c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 08:34:50','2026-03-04 08:34:50'),('LGA_30591477','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:12:22','2026-03-06 19:12:22'),('LGA_3064c989','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 23:30:45','2026-03-04 23:30:45'),('LGA_30660c58','93.150.247.239','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_31992bc6','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:40:42','2026-03-03 23:40:42'),('LGA_32a71482','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_32ac1fb1','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_33f3b8d9','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:30:56','2026-03-08 15:30:56'),('LGA_34688b25','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:23:10','2026-03-06 21:23:10'),('LGA_34bac271','93.150.241.243','marco@marcovanzo.com',1,'2026-03-06 09:17:49','2026-03-06 09:17:49'),('LGA_353811be','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 18:02:59','2026-03-05 18:02:59'),('LGA_3594f29c','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_35cb3bea','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:37:11','2026-03-06 21:37:11'),('LGA_36633090','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 22:42:04','2026-03-11 22:42:04'),('LGA_38949f26','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:20:43','2026-03-08 18:20:43'),('LGA_397bf49f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 10:59:14','2026-03-05 10:59:14'),('LGA_3a9cdaed','82.60.178.216','marco@marcovanzo.com',1,'2026-03-07 16:31:14','2026-03-07 16:31:14'),('LGA_3c002a27','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:49:12','2026-03-06 22:49:12'),('LGA_3c50572e','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_3e7543f4','45.135.24.240','marco.vanzo@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_3eb07fb2','::1','marco@marcovanzo.com',1,'2026-03-08 21:41:50','2026-03-08 21:41:50'),('LGA_3ee49256','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:25:33','2026-03-05 22:25:33'),('LGA_3f3c1e1d','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_3fd4f803','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 23:10:21','2026-03-04 23:10:21'),('LGA_4050ac63','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 21:58:45','2026-03-05 21:58:45'),('LGA_40bb1498','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:10:31','2026-03-06 20:10:31'),('LGA_413d6648','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:15:11','2026-03-07 00:15:11'),('LGA_415a8e16','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_41de13f8','::1','admin@fusionteamvolley.it',0,'2026-03-08 21:36:25','2026-03-08 21:36:25'),('LGA_426be808','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 00:43:33','2026-03-08 00:43:33'),('LGA_43133120','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:32:55','2026-03-06 22:32:55'),('LGA_4396b7db','45.135.24.240','admin@fusionerp.it',0,'2026-03-03 00:06:47','2026-03-03 00:06:47'),('LGA_44878095','93.150.247.239','marco@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_44eddb4f','45.135.24.240','admin@fusionerp.it',0,'2026-03-06 14:22:31','2026-03-06 14:22:31'),('LGA_46f385ee','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:05:14','2026-03-07 00:05:14'),('LGA_47a06290','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_488b6de5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 14:37:24','2026-03-08 14:37:24'),('LGA_496b4a1f','45.135.24.240','test@test.com',0,'2026-03-07 00:36:05','2026-03-07 00:36:05'),('LGA_49e9d840','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:34:01','2026-03-06 22:34:01'),('LGA_4a7c36ee','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:47:14','2026-03-07 01:47:14'),('LGA_4a9140be','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 12:03:59','2026-03-05 12:03:59'),('LGA_4b221a37','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:35:07','2026-03-08 18:35:07'),('LGA_4b368e9f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:42:58','2026-03-06 19:42:58'),('LGA_4ba0cce2','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:22:55','2026-03-08 18:22:55'),('LGA_4e1e847a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:32:20','2026-03-06 21:32:20'),('LGA_4eb3a050','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 22:49:01','2026-03-11 22:49:01'),('LGA_4f940a90','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 18:07:04','2026-03-05 18:07:04'),('LGA_4fa67519','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_501670fc','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_5067d647','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 23:25:31','2026-03-04 23:25:31'),('LGA_525c5e6f','93.150.242.114','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_528b9613','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 13:46:54','2026-03-04 13:46:54'),('LGA_54a8ab85','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:02:09','2026-03-07 01:02:09'),('LGA_550f27ac','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:58:31','2026-03-06 00:58:31'),('LGA_56cb9a12','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 21:33:59','2026-03-11 21:33:59'),('LGA_57148d85','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:13:41','2026-03-06 23:13:41'),('LGA_57906a24','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:02:23','2026-03-08 15:02:23'),('LGA_58a794a5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:24:45','2026-03-06 00:24:45'),('LGA_590ca624','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:00:26','2026-03-06 20:00:26'),('LGA_5948162b','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_5a46dc89','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:34:50','2026-03-03 23:34:50'),('LGA_5a7d288e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 22:40:43','2026-03-04 22:40:43'),('LGA_5c89eec4','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-06 18:39:50','2026-03-06 18:39:50'),('LGA_5e0a127c','45.135.24.240','admin@fusionerp.it',0,'2026-03-06 14:21:00','2026-03-06 14:21:00'),('LGA_5e22c378','45.135.24.240','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_5e399614','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:11:11','2026-03-08 18:11:11'),('LGA_5e3ea1f2','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 16:42:15','2026-03-04 16:42:15'),('LGA_5e9ee18a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 09:59:22','2026-03-08 09:59:22'),('LGA_5ece1024','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_5ef01ea1','188.125.110.106','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_5f7d33ff','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 14:08:20','2026-03-06 14:08:20'),('LGA_60f5c788','45.135.24.240','admin@fusionerp.it',0,'2026-03-03 00:39:47','2026-03-03 00:39:47'),('LGA_612ef109','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 21:26:15','2026-03-11 21:26:15'),('LGA_6327db7f','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_6384d564','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 10:53:37','2026-03-04 10:53:37'),('LGA_6426f1e7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 01:28:08','2026-03-03 01:28:08'),('LGA_646b4b0b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:21:27','2026-03-07 01:21:27'),('LGA_64da16e9','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:19:49','2026-03-08 18:19:49'),('LGA_66636326','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:49:00','2026-03-06 00:49:00'),('LGA_67f906ce','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_68410687','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_6b54b33a','93.150.242.114','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_6c580133','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:10:28','2026-03-07 00:10:28'),('LGA_6e329f84','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:44:21','2026-03-03 23:44:21'),('LGA_6f751543','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 22:47:07','2026-03-03 22:47:07'),('LGA_712eb013','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 21:57:52','2026-03-05 21:57:52'),('LGA_7190454f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:11:30','2026-03-06 20:11:30'),('LGA_72fc0df7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:57:26','2026-03-06 21:57:26'),('LGA_73730312','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:55:07','2026-03-06 21:55:07'),('LGA_7469eb05','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 00:56:20','2026-03-03 00:56:20'),('LGA_758c45ee','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:14:30','2026-03-06 19:14:30'),('LGA_760270ea','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_768398d2','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 11:57:49','2026-03-05 11:57:49'),('LGA_77aaa9fb','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_77bfe2ae','93.150.247.239','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_7a1a4e82','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 16:58:55','2026-03-04 16:58:55'),('LGA_7b7ca5dd','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_7c2b5bdd','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:55:22','2026-03-06 19:55:22'),('LGA_7cdc272e','127.0.0.1','admin@fusionteamvolley.itadmin',0,'2026-03-09 18:13:00','2026-03-09 18:13:00'),('LGA_7d19e181','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:19:10','2026-03-03 23:19:10'),('LGA_7e5bd1f4','93.150.241.243','marco@marcovanzo.com',1,'2026-03-06 11:41:56','2026-03-06 11:41:56'),('LGA_7ec1d1c3','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_7f0cfd6d','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 22:58:50','2026-03-04 22:58:50'),('LGA_814ca909','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_8181f626','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_81e8b68d','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_833c295c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 22:04:54','2026-03-04 22:04:54'),('LGA_85435ac4','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:30:06','2026-03-08 18:30:06'),('LGA_860ea0fb','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:00:59','2026-03-05 22:00:59'),('LGA_86959bf3','45.135.24.240','marcomarco@marcovanzo.com',0,'2026-03-03 23:14:42','2026-03-03 23:14:42'),('LGA_8759c43e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 20:04:09','2026-03-03 20:04:09'),('LGA_875dfdf8','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 21:48:47','2026-03-05 21:48:47'),('LGA_886ef0be','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 16:42:41','2026-03-04 16:42:41'),('LGA_889da4fd','45.135.24.240','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_89e00c9e','45.135.24.240','adminadminadmin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_8a94626b','45.135.24.240','admin@admin.com',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_8a99cd62','45.135.24.240','admin@fusionerp.it',0,'2026-03-02 23:31:19','2026-03-02 23:31:19'),('LGA_8aab576b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:05:53','2026-03-06 00:05:53'),('LGA_8b27a974','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:45:49','2026-03-03 23:45:49'),('LGA_8b355f63','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:13:19','2026-03-06 20:13:19'),('LGA_8b629c0f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 19:41:46','2026-03-03 19:41:46'),('LGA_8bb0aa74','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 22:48:04','2026-03-03 22:48:04'),('LGA_8c0465e7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 17:18:17','2026-03-06 17:18:17'),('LGA_8d185172','93.150.240.141','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_8d49b1ca','127.0.0.1','marco@marcovanzo.com',1,'2026-03-11 23:09:00','2026-03-11 23:09:00'),('LGA_8dc99cf3','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-04 22:52:12','2026-03-04 22:52:12'),('LGA_8e063018','93.150.242.114','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_8ec8a8ac','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 10:24:32','2026-03-07 10:24:32'),('LGA_900a379b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 23:19:06','2026-03-04 23:19:06'),('LGA_9127f677','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:47:37','2026-03-07 00:47:37'),('LGA_913a7d7b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:51:47','2026-03-08 10:51:47'),('LGA_917a81e2','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 21:33:12','2026-03-11 21:33:12'),('LGA_91dacb6e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 23:48:59','2026-03-05 23:48:59'),('LGA_92d08d44','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-06 14:35:02','2026-03-06 14:35:02'),('LGA_93a91d68','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:27:14','2026-03-06 19:27:14'),('LGA_93bf1ad1','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_943dc4bb','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:49:04','2026-03-07 01:49:04'),('LGA_9540a9b7','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_956747c8','93.150.247.239','marco@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_958257cb','93.150.247.239','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_9584ea5a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:12:35','2026-03-08 18:12:35'),('LGA_95d6076f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:07:01','2026-03-08 15:07:01'),('LGA_966c40b4','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 12:42:00','2026-03-04 12:42:00'),('LGA_967bc8a5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:26:53','2026-03-06 20:26:53'),('LGA_96bc3a4e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 00:27:42','2026-03-05 00:27:42'),('LGA_9711f6fb','45.135.24.240','admin@fusionerp.it',0,'2026-03-06 14:26:59','2026-03-06 14:26:59'),('LGA_9716adff','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-06 18:45:36','2026-03-06 18:45:36'),('LGA_978721f7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:33:12','2026-03-08 15:33:12'),('LGA_97db47d9','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 01:17:02','2026-03-08 01:17:02'),('LGA_98173e7a','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_989f2c61','45.135.24.240','marco.vanzo@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_9958f1be','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_9a9ca109','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:00:04','2026-03-08 10:00:04'),('LGA_9aa8f953','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 21:27:53','2026-03-11 21:27:53'),('LGA_9ad97a8a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 14:38:43','2026-03-08 14:38:43'),('LGA_9b034f85','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:09:59','2026-03-08 15:09:59'),('LGA_9b6792b2','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 13:23:00','2026-03-04 13:23:00'),('LGA_9b7863c1','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:36:11','2026-03-06 23:36:11'),('LGA_9bcf5662','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 13:53:40','2026-03-04 13:53:40'),('LGA_9c5a909d','45.135.24.240','marco@marcovanzo.com',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_9d8d68a3','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:15:27','2026-03-06 00:15:27'),('LGA_9d9637be','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:57:17','2026-03-06 21:57:17'),('LGA_9f01887c','45.135.24.240','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_9fa76170','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:16:22','2026-03-07 01:16:22'),('LGA_a077968b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:02:51','2026-03-07 01:02:51'),('LGA_a17470f3','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:28:19','2026-03-08 15:28:19'),('LGA_a18fd69f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 12:07:38','2026-03-05 12:07:38'),('LGA_a1b7139e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 16:37:43','2026-03-06 16:37:43'),('LGA_a4c2549f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:20:55','2026-03-06 20:20:55'),('LGA_a53d040d','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 17:17:05','2026-03-04 17:17:05'),('LGA_a5786d17','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:16:41','2026-03-06 22:16:41'),('LGA_a5cda387','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 12:18:04','2026-03-05 12:18:04'),('LGA_a5d42a40','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:47:13','2026-03-08 15:47:13'),('LGA_a6b1411e','127.0.0.1','adminadmin@fusionteamvolley.it',0,'2026-03-09 17:57:21','2026-03-09 17:57:21'),('LGA_a73ac46f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 12:04:13','2026-03-05 12:04:13'),('LGA_a744607f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:03:18','2026-03-06 19:03:18'),('LGA_a838a609','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:39:14','2026-03-08 15:39:14'),('LGA_a9d276fa','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-04 22:57:33','2026-03-04 22:57:33'),('LGA_aa26701b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 01:06:19','2026-03-08 01:06:19'),('LGA_aa3ea52c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:35:38','2026-03-06 21:35:38'),('LGA_ac7334be','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:41:08','2026-03-05 22:41:08'),('LGA_ace4420d','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_ad08a189','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 22:47:41','2026-03-02 22:47:41'),('LGA_ad6ca5d2','93.150.247.239','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_ae34b8de','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_ae8bc4a8','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:31:11','2026-03-06 21:31:11'),('LGA_aebbbb90','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_aed2b31e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:07:03','2026-03-06 20:07:03'),('LGA_af67369d','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_afde3c3e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:37:17','2026-03-05 22:37:17'),('LGA_b0061d94','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:17:36','2026-03-03 23:17:36'),('LGA_b23fa6d1','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:35:00','2026-03-03 23:35:00'),('LGA_b2dde2e4','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 20:22:13','2026-03-06 20:22:13'),('LGA_b2fa565a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 18:21:39','2026-03-06 18:21:39'),('LGA_b3047235','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 13:57:42','2026-03-06 13:57:42'),('LGA_b4c5a5b1','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_b4e9832b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 23:25:07','2026-03-02 23:25:07'),('LGA_b653aaa4','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:51:16','2026-03-08 15:51:16'),('LGA_b6c9b89c','45.135.24.240','admin@fusionerp.it',0,'2026-03-06 14:20:04','2026-03-06 14:20:04'),('LGA_b6e8b2ad','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:19:44','2026-03-03 23:19:44'),('LGA_b716bbb3','82.60.178.216','marco@marcovanzo.com',1,'2026-03-07 16:38:54','2026-03-07 16:38:54'),('LGA_b78a103a','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-08 11:00:04','2026-03-08 11:00:04'),('LGA_b868e4c7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:56:46','2026-03-06 21:56:46'),('LGA_b8eaf348','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:24:49','2026-03-06 22:24:49'),('LGA_b917743e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 19:09:22','2026-03-06 19:09:22'),('LGA_b9ab49a6','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_b9d444bd','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 15:10:40','2026-03-06 15:10:40'),('LGA_ba43ac7b','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_ba5d3330','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:04:02','2026-03-07 00:04:02'),('LGA_baeb4306','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 15:19:45','2026-03-08 15:19:45'),('LGA_bb4faa73','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 09:55:42','2026-03-08 09:55:42'),('LGA_bb93ea3e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 23:39:10','2026-03-05 23:39:10'),('LGA_bbbe5722','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 17:57:11','2026-03-05 17:57:11'),('LGA_bbf271e6','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_bbfe4d1d','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_bc367e72','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:28:07','2026-03-05 22:28:07'),('LGA_bcd9e35a','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_bd42a0f3','93.150.240.84','marco@marcovanzo.com',1,'2026-03-05 15:02:28','2026-03-05 15:02:28'),('LGA_bdb05f11','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_bdb98d93','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_bdc8daf3','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:57:13','2026-03-06 23:57:13'),('LGA_bece067e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 00:05:26','2026-03-05 00:05:26'),('LGA_bf351dbb','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 19:50:17','2026-03-03 19:50:17'),('LGA_bf9099aa','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_c08a3e41','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-08 11:01:11','2026-03-08 11:01:11'),('LGA_c0c40bd9','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 17:49:02','2026-03-08 17:49:02'),('LGA_c11d1597','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 14:30:26','2026-03-06 14:30:26'),('LGA_c29c97d5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:19:42','2026-03-06 21:19:42'),('LGA_c29f8f18','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:58:11','2026-03-06 22:58:11'),('LGA_c342cda5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:05:56','2026-03-05 22:05:56'),('LGA_c3554c56','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:59:39','2026-03-06 21:59:39'),('LGA_c3c1c49f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:54:50','2026-03-08 10:54:50'),('LGA_c3c9ad29','45.135.24.240','admin@fusionerp.it',0,'2026-03-03 00:19:37','2026-03-03 00:19:37'),('LGA_c49498c1','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-04 22:59:07','2026-03-04 22:59:07'),('LGA_c4dd0de0','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:57:35','2026-03-06 23:57:35'),('LGA_c52279cf','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:47:32','2026-03-03 23:47:32'),('LGA_c539d41a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 16:54:04','2026-03-06 16:54:04'),('LGA_c5abab20','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:23:55','2026-03-06 00:23:55'),('LGA_c60d0015','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 14:28:39','2026-03-06 14:28:39'),('LGA_c724e66d','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_c7b98d5c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 13:56:59','2026-03-06 13:56:59'),('LGA_c7eacb46','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 00:24:36','2026-03-08 00:24:36'),('LGA_c8d83d21','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 18:17:17','2026-03-08 18:17:17'),('LGA_c977934a','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 17:48:14','2026-03-05 17:48:14'),('LGA_c993c4d0','45.135.24.240','marco@marcovanzo.com',1,'2026-03-02 23:51:39','2026-03-02 23:51:39'),('LGA_ca6c84a2','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 22:45:24','2026-03-04 22:45:24'),('LGA_ca739adf','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_ca776127','127.0.0.1','adminadmin@fusionteamvolley.it',0,'2026-03-09 18:09:16','2026-03-09 18:09:16'),('LGA_caba6f03','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_cc0422a3','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_cc952d43','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 22:25:16','2026-03-06 22:25:16'),('LGA_cc9cfb46','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 16:41:30','2026-03-06 16:41:30'),('LGA_cd4eb367','94.167.187.133','n.martignago@fusionteamvolley.it',1,'2026-03-03 08:42:39','2026-03-03 08:42:39'),('LGA_ce2c3a85','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_ce68441e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:18:15','2026-03-07 00:18:15'),('LGA_ce6c8531','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 20:39:54','2026-03-04 20:39:54'),('LGA_ce9b912c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 10:07:31','2026-03-04 10:07:31'),('LGA_cf080c07','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_cf14ca23','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 21:03:50','2026-03-08 21:03:50'),('LGA_cf82977d','45.135.24.240','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_d4847c6d','45.135.24.240','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_d492a766','127.0.0.1','marco.vanzo@fusionteamvolley.it',0,'2026-03-11 21:39:09','2026-03-11 21:39:09'),('LGA_d635b218','45.135.24.240','marco.vanzo@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_d64655c2','93.150.240.84','marco@marcovanzo.com',1,'2026-03-05 15:34:48','2026-03-05 15:34:48'),('LGA_d670c333','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 00:15:58','2026-03-04 00:15:58'),('LGA_d6fc584e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 17:32:54','2026-03-05 17:32:54'),('LGA_d71323ff','45.135.24.240','marco@marcovanzo.com',1,'2026-03-03 23:42:32','2026-03-03 23:42:32'),('LGA_d79280e1','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:42:16','2026-03-07 00:42:16'),('LGA_d96e3ff7','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 22:45:29','2026-03-11 22:45:29'),('LGA_da83525a','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_dad8964b','45.135.24.240','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_db963a10','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:55:11','2026-03-07 00:55:11'),('LGA_dd01a350','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_dde2cf24','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 21:41:16','2026-03-11 21:41:16'),('LGA_de5bd3e4','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 00:21:16','2026-03-08 00:21:16'),('LGA_df836f90','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:58:36','2026-03-08 10:58:36'),('LGA_dfbe0dd0','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e006813b','45.135.24.240','marco@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e1371deb','93.150.247.239','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e2c6b76b','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e38f8368','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e4130ea9','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 12:30:47','2026-03-05 12:30:47'),('LGA_e4164d92','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e5173293','93.150.247.239','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e600c394','93.150.247.239','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e724b02e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 00:08:26','2026-03-08 00:08:26'),('LGA_e7383e1b','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:14:04','2026-03-06 23:14:04'),('LGA_e7ed19bf','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 21:31:38','2026-03-11 21:31:38'),('LGA_e8071b60','93.150.247.239','admin@fusionteamvolley.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_e8482ffa','127.0.0.1','marco@marcovanzo.com',1,'2026-03-12 00:30:35','2026-03-12 00:30:35'),('LGA_ebb1205c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 10:57:59','2026-03-08 10:57:59'),('LGA_ee4c52a5','45.135.24.240','admin@fusionerp.it',0,'2026-03-03 00:09:09','2026-03-03 00:09:09'),('LGA_ee57a134','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 23:57:32','2026-03-04 23:57:32'),('LGA_ee63eb22','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:14:57','2026-03-06 23:14:57'),('LGA_ee6b023e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:46:05','2026-03-05 22:46:05'),('LGA_ef416d1d','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 23:22:40','2026-03-06 23:22:40'),('LGA_ef5ed87f','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 01:09:43','2026-03-07 01:09:43'),('LGA_ef89cbfe','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 09:13:49','2026-03-08 09:13:49'),('LGA_f00516d9','93.150.242.114','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_f0f5bc98','45.135.24.240','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_f0ff1209','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 21:46:19','2026-03-05 21:46:19'),('LGA_f3afec52','45.135.24.240','marco.vanzo@fusionteamvolley.it',0,'2026-03-04 22:56:14','2026-03-04 22:56:14'),('LGA_f56cc4fa','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 12:05:01','2026-03-05 12:05:01'),('LGA_f783c8a5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 23:32:58','2026-03-05 23:32:58'),('LGA_f8097db0','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 00:43:46','2026-03-06 00:43:46'),('LGA_f839856e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-04 20:52:42','2026-03-04 20:52:42'),('LGA_f9204792','127.0.0.1','admin@fusionteamvolley.it',0,'2026-03-09 17:56:39','2026-03-09 17:56:39'),('LGA_f928808e','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 11:50:02','2026-03-05 11:50:02'),('LGA_f9de91a8','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 20:10:19','2026-03-08 20:10:19'),('LGA_fc1de2cd','82.60.178.216','marco@marcovanzo.com',1,'2026-03-07 16:23:48','2026-03-07 16:23:48'),('LGA_fc4f8200','127.0.0.1','marco@fusionteamvolley.it',0,'2026-03-11 22:49:51','2026-03-11 22:49:51'),('LGA_fd06de0f','93.150.242.114','admin@fusionerp.it',0,'2026-03-02 22:10:03','2026-03-02 22:10:03'),('LGA_fd497cf5','45.135.24.240','marco@marcovanzo.com',1,'2026-03-08 19:51:02','2026-03-08 19:51:02'),('LGA_fd914c76','45.135.24.240','marco@marcovanzo.com',1,'2026-03-06 21:38:34','2026-03-06 21:38:34'),('LGA_fdbb2f7c','45.135.24.240','marco@marcovanzo.com',1,'2026-03-07 00:59:56','2026-03-07 00:59:56'),('LGA_fdd136a7','45.135.24.240','marco@marcovanzo.com',1,'2026-03-05 22:42:31','2026-03-05 22:42:31'),('LGA_ffee1ee8','93.150.247.239','admin@fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_certificates`
--

DROP TABLE IF EXISTS `medical_certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_certificates` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('agonistico','non_agonistico') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'agonistico',
  `issue_date` date DEFAULT NULL,
  `expiry_date` date NOT NULL,
  `ocr_extracted_date` date DEFAULT NULL,
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `uploaded_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_medcert_athlete` (`athlete_id`),
  KEY `idx_medcert_expiry` (`expiry_date`),
  KEY `idx_medcert_status` (`status`),
  KEY `fk_medcert_uploader` (`uploaded_by`),
  CONSTRAINT `fk_medcert_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_medcert_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_certificates`
--

LOCK TABLES `medical_certificates` WRITE;
/*!40000 ALTER TABLE `medical_certificates` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meta_logs`
--

DROP TABLE IF EXISTS `meta_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meta_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meta_logs`
--

LOCK TABLES `meta_logs` WRITE;
/*!40000 ALTER TABLE `meta_logs` DISABLE KEYS */;
INSERT INTO `meta_logs` VALUES (1,'GRAPH GET: https://graph.facebook.com/v21.0/618311941643826/insights?metric=page_views_total%2Cpage_engaged_users%2Cpage_post_engagements&period=day&since=2026-02-09&until=2026-03-09&access_token=***','2026-03-09 14:38:37'),(2,'GRAPH ERROR: {\"message\":\"(#100) The value must be a valid insights metric\",\"type\":\"OAuthException\",\"code\":100,\"fbtrace_id\":\"AhgGrwzb-hFJ2FhU6mFElKH\"}','2026-03-09 14:38:39'),(3,'GRAPH GET: https://graph.facebook.com/v21.0/618311941643826/insights?metric=page_views_total%2Cpage_engaged_users%2Cpage_post_engagements&period=day&since=2026-02-09&until=2026-03-09&access_token=***','2026-03-09 14:38:56'),(4,'GRAPH ERROR: {\"message\":\"(#100) The value must be a valid insights metric\",\"type\":\"OAuthException\",\"code\":100,\"fbtrace_id\":\"A9mHuQHMj2p4OioVaiIsoRA\"}','2026-03-09 14:38:58'),(5,'GRAPH GET: https://graph.facebook.com/v21.0/618311941643826/insights?metric=page_views_total%2Cpage_engaged_users%2Cpage_post_engagements&period=day&since=2026-02-11&until=2026-03-11&access_token=***','2026-03-11 22:16:15'),(6,'GRAPH ERROR: {\"message\":\"(#100) The value must be a valid insights metric\",\"type\":\"OAuthException\",\"code\":100,\"fbtrace_id\":\"ArsK_y2aEpWQrIzVP2zciM4\"}','2026-03-11 22:16:18'),(7,'GRAPH GET: https://graph.facebook.com/v21.0/618311941643826/insights?metric=page_views_total%2Cpage_engaged_users%2Cpage_post_engagements&period=day&since=2026-02-19&until=2026-03-19&access_token=***','2026-03-19 20:29:22'),(8,'GRAPH ERROR: {\"message\":\"(#100) The value must be a valid insights metric\",\"type\":\"OAuthException\",\"code\":100,\"fbtrace_id\":\"AAgpAxsBhPZ7282FQ8wplHT\"}','2026-03-19 20:29:22'),(9,'GRAPH GET: https://graph.facebook.com/v21.0/618311941643826/insights?metric=page_views_total%2Cpage_impressions_unique%2Cpage_post_engagements&period=day&since=2026-02-19&until=2026-03-19&access_token=***','2026-03-19 20:31:00'),(10,'GRAPH SUCCESS: HTTP 200','2026-03-19 20:31:00'),(11,'GRAPH GET: https://graph.facebook.com/v21.0/618311941643826/insights?metric=page_views_total%2Cpage_impressions_unique%2Cpage_post_engagements&period=day&since=2026-02-19&until=2026-03-19&access_token=***','2026-03-19 20:46:02'),(12,'GRAPH SUCCESS: HTTP 200','2026-03-19 20:46:02');
/*!40000 ALTER TABLE `meta_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meta_oauth_states`
--

DROP TABLE IF EXISTS `meta_oauth_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meta_oauth_states` (
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `idx_meta_oauth_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meta_oauth_states`
--

LOCK TABLES `meta_oauth_states` WRITE;
/*!40000 ALTER TABLE `meta_oauth_states` DISABLE KEYS */;
INSERT INTO `meta_oauth_states` VALUES ('04cf62430082f733dc1ef7543d7173fb','USR_37ecc843','2026-03-06 22:06:38','2026-03-06 21:56:38'),('1660463f2ca9bc0428411a33255d9a9c','0','2026-03-06 21:42:11','2026-03-06 21:32:11'),('345b5e7b84fb255c081a05ec7b0862f1','USR_37ecc843','2026-03-06 21:48:25','2026-03-06 21:38:25'),('6c24ec71eed01cc4715524901f8517e4','USR_37ecc843','2026-03-06 22:34:41','2026-03-06 22:24:41'),('7cc9ca2d66b7b2e7064590bf0fc87201','0','2026-03-06 21:42:11','2026-03-06 21:32:11'),('859d01f31d9474e33789b88f881c3920','USR_37ecc843','2026-03-06 00:47:56','2026-03-06 00:37:56'),('a229ebc62991545ce267a73e928c389b','USR_37ecc843','2026-03-06 22:06:36','2026-03-06 21:56:36'),('b0dfb2e6ff6eb5478c41b6b53e4bab42','USR_37ecc843','2026-03-06 00:55:06','2026-03-06 00:45:06'),('db165f10cfc79656e103a6c847ca60a9','0','2026-03-06 21:42:08','2026-03-06 21:32:08'),('e14ab0b357658bd39e791fc9187f1ac9','1','2026-03-05 23:56:25','2026-03-05 23:46:25'),('e33e3af5bf874aad45065423c222e65a','USR_37ecc843','2026-03-06 00:53:05','2026-03-06 00:43:05'),('LOG:08c75530135a6399f031fd71bbc4fde4','0','2026-03-06 22:32:17','2026-03-06 21:32:17'),('LOG:1c1be9da45b02f7c6aa7fb290f80f0ec','0','2026-03-06 22:52:15','2026-03-06 21:52:15'),('LOG:2926ec0f9b678ff3e40cb2950752aa76','0','2026-03-06 22:57:23','2026-03-06 21:57:23'),('LOG:3b2b1a6671bef8539920a21ef6ea349e','0','2026-03-06 22:59:36','2026-03-06 21:59:36'),('LOG:3d2417b7ea3bb9cb42285cd151864b5e','0','2026-03-06 00:48:55','2026-03-05 23:48:55'),('LOG:45075ed55f34dc6dfad6cdab154d7f46','0','2026-03-04 23:59:31','2026-03-04 22:59:31'),('LOG:4cf7400bca08b92b8fc968e82b24d71b','0','2026-03-06 22:55:04','2026-03-06 21:55:04'),('LOG:4ea66317f81e5a9d769e9c8cdfd91ed2','0','2026-03-05 16:34:44','2026-03-05 15:34:44'),('LOG:6b1d66b34560d9ff120df60368da6b59','0','2026-03-06 23:24:46','2026-03-06 22:24:46'),('LOG:70be3cf47141ddc6029965809196779a','0','2026-03-06 22:35:51','2026-03-06 21:35:51'),('LOG:7e27b3c06c561f80393fdd56f614eb60','0','2026-03-06 23:58:08','2026-03-06 22:58:08'),('LOG:8321b28e1c2f2f3f4040bd31e1ac88a7','0','2026-03-04 23:45:21','2026-03-04 22:45:21'),('LOG:8c133a47026ec9a693518cd8be9f7664','0','2026-03-03 00:25:03','2026-03-02 23:25:03'),('LOG:93e5c7f445a3a815c8220addd89a3d4e','0','2026-03-05 13:07:35','2026-03-05 12:07:35'),('LOG:9a431ebef370518c2651ba24f046ade3','0','2026-03-06 22:38:31','2026-03-06 21:38:31'),('LOG:9d2dc1b28fb40c569c1bc41b4f4407ab','0','2026-03-06 22:37:07','2026-03-06 21:37:07'),('LOG:a4d61e7be76322b183319cfe840809c2','0','2026-03-06 23:25:13','2026-03-06 22:25:13'),('LOG:c8490942ffcd08c87682d545f3db1c60','0','2026-03-03 21:14:49','2026-03-03 20:14:49');
/*!40000 ALTER TABLE `meta_oauth_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meta_tokens`
--

DROP TABLE IF EXISTS `meta_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meta_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `page_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ig_account_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ig_username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'long_lived',
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_meta_tokens_user` (`user_id`),
  KEY `idx_meta_tokens_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meta_tokens`
--

LOCK TABLES `meta_tokens` WRITE;
/*!40000 ALTER TABLE `meta_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `meta_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metrics_logs`
--

DROP TABLE IF EXISTS `metrics_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metrics_logs` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `log_date` date NOT NULL,
  `duration_min` smallint NOT NULL DEFAULT '0',
  `rpe` tinyint NOT NULL DEFAULT '5',
  `load_value` decimal(8,2) NOT NULL,
  `acwr_score` decimal(6,4) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_metrics_athlete_date` (`athlete_id`,`log_date`),
  KEY `idx_metrics_event` (`event_id`),
  CONSTRAINT `fk_metrics_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_metrics_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metrics_logs`
--

LOCK TABLES `metrics_logs` WRITE;
/*!40000 ALTER TABLE `metrics_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `metrics_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mileage_reimbursements`
--

DROP TABLE IF EXISTS `mileage_reimbursements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mileage_reimbursements` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `carpool_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `distance_km` decimal(8,2) NOT NULL,
  `rate_eur_km` decimal(6,4) NOT NULL,
  `total_eur` decimal(8,2) NOT NULL,
  `pdf_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reimbursements_user` (`user_id`),
  KEY `idx_reimbursements_carpool` (`carpool_id`),
  KEY `fk_reimb_approver` (`approved_by`),
  CONSTRAINT `fk_reimb_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reimb_carpool` FOREIGN KEY (`carpool_id`) REFERENCES `carpool_routes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_reimb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mileage_reimbursements`
--

LOCK TABLES `mileage_reimbursements` WRITE;
/*!40000 ALTER TABLE `mileage_reimbursements` DISABLE KEYS */;
/*!40000 ALTER TABLE `mileage_reimbursements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `network_activities`
--

DROP TABLE IF EXISTS `network_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `network_activities` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `participants_json` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of participant names/ids',
  `outcome` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_network_acts_tenant` (`tenant_id`),
  KEY `idx_network_acts_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `network_activities`
--

LOCK TABLES `network_activities` WRITE;
/*!40000 ALTER TABLE `network_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `network_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `network_collaborations`
--

DROP TABLE IF EXISTS `network_collaborations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `network_collaborations` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_type` enum('club','agenzia','istituzione','sponsor','altro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'altro',
  `agreement_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('attivo','scaduto','in_rinnovo') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'attivo',
  `referent_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referent_contact` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `logo_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_network_collab_tenant` (`tenant_id`),
  KEY `idx_network_collab_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `network_collaborations`
--

LOCK TABLES `network_collaborations` WRITE;
/*!40000 ALTER TABLE `network_collaborations` DISABLE KEYS */;
INSERT INTO `network_collaborations` VALUES ('TEST_COL','1','Dummy Collab','altro',NULL,NULL,NULL,'attivo',NULL,NULL,NULL,NULL,'2026-03-17 23:32:49','2026-03-17 23:32:49',0);
/*!40000 ALTER TABLE `network_collaborations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `network_documents`
--

DROP TABLE IF EXISTS `network_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `network_documents` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collaboration_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `doc_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_network_docs_tenant` (`tenant_id`),
  KEY `idx_network_docs_collab` (`collaboration_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `network_documents`
--

LOCK TABLES `network_documents` WRITE;
/*!40000 ALTER TABLE `network_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `network_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `network_trial_evaluations`
--

DROP TABLE IF EXISTS `network_trial_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `network_trial_evaluations` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluator_user_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eval_date` date NOT NULL,
  `score_technical` tinyint NOT NULL DEFAULT '5' COMMENT '1-10',
  `score_tactical` tinyint NOT NULL DEFAULT '5' COMMENT '1-10',
  `score_physical` tinyint NOT NULL DEFAULT '5' COMMENT '1-10',
  `score_mental` tinyint NOT NULL DEFAULT '5' COMMENT '1-10',
  `score_potential` tinyint NOT NULL DEFAULT '5' COMMENT '1-10',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `video_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_network_eval_tenant` (`tenant_id`),
  KEY `idx_network_eval_trial` (`trial_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `network_trial_evaluations`
--

LOCK TABLES `network_trial_evaluations` WRITE;
/*!40000 ALTER TABLE `network_trial_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `network_trial_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `network_trials`
--

DROP TABLE IF EXISTS `network_trials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `network_trials` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `nationality` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origin_club` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trial_start` date DEFAULT NULL,
  `trial_end` date DEFAULT NULL,
  `status` enum('in_valutazione','approvato','non_idoneo','da_ricontattare') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_valutazione',
  `scouting_profile_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK to scouting table after conversion',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_network_trials_tenant` (`tenant_id`),
  KEY `idx_network_trials_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `network_trials`
--

LOCK TABLES `network_trials` WRITE;
/*!40000 ALTER TABLE `network_trials` DISABLE KEYS */;
/*!40000 ALTER TABLE `network_trials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_log`
--

DROP TABLE IF EXISTS `notification_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_log` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sent',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_tenant` (`tenant_id`),
  KEY `idx_notif_athlete` (`athlete_id`),
  KEY `idx_notif_type` (`notification_type`),
  KEY `idx_notif_sent` (`sent_at`),
  CONSTRAINT `fk_notif_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notif_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_log`
--

LOCK TABLES `notification_log` WRITE;
/*!40000 ALTER TABLE `notification_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outseason_entries`
--

DROP TABLE IF EXISTS `outseason_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outseason_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `cognito_id` int unsigned NOT NULL,
  `season_key` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_e_cognome` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cellulare` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codice_fiscale` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_di_nascita` date DEFAULT NULL,
  `indirizzo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cap` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `citta` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provincia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `club_di_appartenenza` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ruolo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taglia_kit` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `settimana_scelta` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formula_scelta` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `come_vuoi_pagare` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codice_sconto` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entry_date` datetime DEFAULT NULL,
  `entry_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_summary` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `synced_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cognito_season` (`cognito_id`,`season_key`),
  KEY `idx_ose_season` (`season_key`),
  KEY `idx_ose_nome` (`nome_e_cognome`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outseason_entries`
--

LOCK TABLES `outseason_entries` WRITE;
/*!40000 ALTER TABLE `outseason_entries` DISABLE KEYS */;
INSERT INTO `outseason_entries` VALUES (1,2,'2026','Emma Ziliotto','nicoletta.bandiera@gmail.com','+393495682706','ZLTMME12M48F443U','2012-08-08','Via Cavour, 34','31031','Caerano di san marco','TREVISO','Polisportiva Biadenese','Schiacciatrice','M','6 Luglio - 10 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-01-16 21:49:16','Submitted','250,00 € Unpaid','2026-03-08 01:06:40'),(2,3,'2026','Matilde Pizziolo','benedetti971@gmail.com','3394616159','PZZMLD10M67L736B','2010-08-27','Via Bissuola 81/I','30173','Mestre','Venezia','Mestre Volley Center','Centrale','L','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Carta di Credito / Paypal',NULL,'2026-01-17 15:00:49','Submitted','150,00 € Paid','2026-03-08 01:06:40'),(3,4,'2026','Amelia Nadalin','laura.bertondini@gmail.com','3495467133','NDLMLA12R46C957N','2012-10-06','Piazza Umberto I, 8/3','31053','Pieve di Soligo','TV','Volley Piave','Schiacciatrice','XS','6 Luglio - 10 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Carta di Credito / Paypal',NULL,'2026-01-17 20:41:43','Submitted','250,00 € Paid','2026-03-08 01:06:40'),(4,5,'2026','Miriam Crafa','pattigemini@yahoo.it','3497877030','CRFMRM10C41L736S','2010-03-01','Viale Garibaldi 44 d Mestre','30173','Venezia','Ve','Mestre Volley Center','Schiacciatrice','M','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-01-18 13:42:19','Submitted','150,00 € Unpaid','2026-03-08 01:06:40'),(5,6,'2026','Evelyne Ceccato','marica.evelyne@gmail.com','3475493373','Cccvyn12a41l407k','2012-01-01','Via G.Cornelio Graziano 10','31100','Treviso','TV','Fusion','Schiacciatrice','M','6 Luglio - 10 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-01-19 10:13:33','Submitted','150,00 € Unpaid','2026-03-08 01:06:40'),(6,7,'2026','Laura Xenia Berlingieri','alberta@berlingieri.it','3355858555','Brllxn11p58f205r','2018-09-18','San Marco 2156','30124','Venezia','Venezia','Cus di venezia','Libero','S','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-01-24 14:03:24','Submitted','150,00 € Unpaid','2026-03-08 01:06:40'),(7,8,'2026','Francesca Schievenin','dallagnolpaola@gmail.com','3487371641','SCHFNC13A55D530W','2013-01-15','Via Riva dei Brait 1/a','32030','Cesiomaggiore','BL','ASD LIMANA','Libero','S','13 Luglio - 17 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-01-30 13:52:51','Submitted','250,00 € Unpaid','2026-03-08 01:06:40'),(8,9,'2026','Margherita Molin','molinmarco71@gmail.com','3384826874','MLNMGH13H69L736U','2013-06-29','Via Castellana 59C','30174','Venezia','Venezia','Fusion Team Volley','Alzatrice','XS','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Carta di Credito / Paypal','FTVNET26','2026-02-01 15:06:10','Submitted','150,00 € Paid','2026-03-08 01:06:40'),(9,10,'2026','Sofia Trivellato','crivellariro@gmail.com','3286547835','Trvsfo11b59b563k','2011-02-19','Via pioga 248a','34011','Campodarsego','Padova','Pallavolo Padova','Schiacciatrice','M','6 Luglio - 10 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-02-01 15:21:06','Submitted','250,00 € Unpaid','2026-03-08 01:06:40'),(10,11,'2026','Marta Giacchetto','albertogiacchetto@yahoo.it','+393487502884','GCCMRT11H52F328K','2011-06-12','Via P. Ponchia 12','35124','PADOVA','PD','Pallavolo Padova','Schiacciatrice','L','6 Luglio - 10 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Carta di Credito / Paypal',NULL,'2026-02-01 15:47:07','Submitted','250,00 € Paid','2026-03-08 01:06:40'),(11,12,'2026','Gloria Betterle','abattaggia445@gmail.com','3472533242','BTTGLR13M60L736E','2013-08-20','Via Castellana 211Q','30174','Mestre','Venezia','Fusion Team Volley','Opposto','M','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Bonifico Bancario','FTVNET26','2026-02-01 19:40:25','Submitted','150,00 € Unpaid','2026-03-08 01:06:40'),(12,13,'2026','Giulia Simone','lucia.nicola@unipd.it','3249997213','SMNGLI11T56Z126J','2011-12-16','Via Polacco 14','35127','Padova','PD','Pallavolo Padova','Schiacciatrice','M','6 Luglio - 10 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Carta di Credito / Paypal',NULL,'2026-02-07 19:21:43','Submitted','250,00 € Paid','2026-03-08 01:06:40'),(13,14,'2026','Giorgia Cavicchioli','massimocavicchioli53@gmail.com','+393455091248','CVCGRG12C68E512','2012-03-28','Via Madonnina 684','45020','Giacciano con Baruchella','Rovigo','Futur volley','Schiacciatrice','M','6 Luglio - 10 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-02-08 15:12:37','Submitted','250,00 € Unpaid','2026-03-08 01:06:40'),(14,15,'2026','Giulia Gollin','gollin72@gmail.com','3202552652','GLLGLI11M42L407J','2011-08-02','Via Antonio Vivaldi 15','31033','Castelfranco Veneto','Treviso','Giorgione Pallavolo','Libero','S','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Carta di Credito / Paypal',NULL,'2026-02-14 16:23:14','Submitted','150,00 € Paid','2026-03-08 01:06:40'),(15,16,'2026','SILVIA RUTILI','flavio.rutili@gmail.com','+393937366400','RTLSLV11P44H501H','2011-09-04','Via aurelia 76','31039','Riese pio x','TV','GIORGIONE PALLAVOLO','Schiacciatrice','M','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-02-16 15:09:25','Submitted','150,00 € Unpaid','2026-03-08 01:06:40'),(16,17,'2026','GIULIA CREPALDI','crepaldilorenzo1@gmail.com','3407236795','CRPGLI11P52A059G','2011-09-12','VIA PARCO DELTA PO , 13','45011','ADRIA','ROVIGO','Ariano Volley','Centrale','M','29 Giugno - 3 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Carta di Credito / Paypal',NULL,'2026-02-24 13:52:59','Submitted','250,00 € Paid','2026-03-08 01:06:40'),(17,18,'2026','Anna Aurora Trombini','finessifederica4111983@gmail.com','+393406063157','TRMNRR10P47E410W','2010-09-07','Viale della Rinascita 23N','44021','Mezzogoro','FE','Volley Ariano','Centrale','M','29 Giugno - 3 Luglio','Full Master -  650 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-02-26 16:51:35','Submitted','250,00 € Unpaid','2026-03-08 01:06:40'),(120,19,'2026','Giada Ruzza','saetta.giorgia@gmail.com','3516344422','RZZGDI09E58L736K','2009-05-18','Via Elsa Morante 65','30020','Marcon','Venezia','Volley Silea','Schiacciatrice','M','29 Giugno - 3 Luglio','Daily Master - 400 € di cui come caparra confirmatoria','Bonifico Bancario',NULL,'2026-03-05 20:59:15','Submitted','150,00 € Unpaid','2026-03-08 01:06:40');
/*!40000 ALTER TABLE `outseason_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outseason_verifications`
--

DROP TABLE IF EXISTS `outseason_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outseason_verifications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `season_key` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. 2026',
  `entry_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Full name from Cognito Forms',
  `found` tinyint(1) NOT NULL DEFAULT '0',
  `confidence` enum('high','medium','low') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_date` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_amount` decimal(10,2) DEFAULT NULL,
  `transaction_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `verified_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `verified_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_season_entry` (`season_key`,`entry_name`),
  KEY `idx_osv_season` (`season_key`),
  KEY `fk_osv_user` (`verified_by`),
  CONSTRAINT `fk_osv_user` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outseason_verifications`
--

LOCK TABLES `outseason_verifications` WRITE;
/*!40000 ALTER TABLE `outseason_verifications` DISABLE KEYS */;
INSERT INTO `outseason_verifications` VALUES (1,'2026','Emma Ziliotto',0,NULL,NULL,NULL,NULL,NULL,'2026-03-02 22:10:03','USR_admin0001'),(2,'2026','Miriam Crafa',1,'high','18/01/2026',150.00,'Bonifico a vs favore *INSTANT DEL 18/01/2026 ORE 13:55 ID. 2601183101942328480320000000IT ORD CRAFA STEFANODaily master out of season, transaz. num.F20E5T1 - caparra Crafa Miriam Info aggiuntive:Data ordine: 18/01/2026Ragione sociale ordinante:CRAFA STEFANOIndirizzo ordinante: VIALE GIUSEPPE GARIBALDI 44D 30ID BONIFICO:2601183101942328480320000000ITDescrizione aggiuntiva del movimento:*INSTANT DEL 18/01/2026 ORE 13:55 ID. 2601183101942328480320000000IT ORD CRAFA STEFANODescrizione estesa del movimento: Daily master out of season, transaz. num.F20E5T1 - caparra Crafa Miriam','Cognome \'Crafa\' trovato nella causale, importo corrispondente.','2026-03-02 22:10:03','USR_admin0001'),(3,'2026','Evelyne Ceccato',0,NULL,NULL,NULL,NULL,NULL,'2026-03-02 22:10:03','USR_admin0001'),(4,'2026','Laura Xenia Berlingieri',0,NULL,NULL,NULL,NULL,NULL,'2026-03-02 22:10:03','USR_admin0001'),(5,'2026','Francesca Schievenin',1,'high','30/01/2026',250.00,'Bonifico a vs favore *INSTANT DEL 30/01/2026 ORE 20:05 ID. 0329624368362402480160101601IT ORD DALL AGNOL PAOLARicevuta n. F20E8T1 - full master schievenin francesca Info aggiuntive:Data ordine: 30/01/2026Localita ordinante:32030 CESIORagione sociale ordinante:DALL AGNOL PAOLAIndirizzo ordinante: VIA RIVA DEI BRAIT 1AID BONIFICO:0329624368362402480160101601ITDescrizione aggiuntiva del movimento:*INSTANT DEL 30/01/2026 ORE 20:05 ID. 0329624368362402480160101601IT ORD DALL AGNOL PAOLADescrizione estesa del movimento: Ricevuta n. F20E8T1 - full master schievenin francesca','Cognome \'Schievenin\' trovato nella causale, importo corrispondente.','2026-03-02 22:10:03','USR_admin0001'),(6,'2026','Sofia Trivellato',1,'high','09/02/2026',250.00,'Bonifico a vs favore *2026-02-09*CRIVELLARI ROBERTA FULL MASTER TRIVELLATO SOFIA Info aggiuntive:Data ordine:09/02/2026Ragione sociale ordinante: CRIVELLARI ROBERTAIndirizzo ordinante: VIA PIOGA 248 A 35011 CAMPODARID BONIFICO:0000028456458203483421062420ITDescrizi one aggiuntiva del movimento:*2026-02-09*CRIVELLARI ROBERTA FULL MASTER TRIVELLATO SOFIA','Cognome \'Trivellato\' trovato nella causale, importo corrispondente.','2026-03-02 22:10:03','USR_admin0001'),(7,'2026','Gloria Betterle',1,'high','03/02/2026',150.00,'Bonifico a vs favore *2026-02-03*BETTERLE PAOLO BATTAGGIA ALESSANDRA CAPARRA FTVOUTSEASON SETTIMANA 29/06-03/07GLORIA BETTERLE Info aggiuntive: Data ordine:03/02/2026Localita ordinante:30173 VENEZIA VE ITRagione sociale ordinante:BETTERLE PAOLO BATTAGGIA ALESSANDRAIndirizzo ordinante: VIA ANTONIO BALDISSERA 10 INTID BONIFICO:0306909142067104S90211802118ITDescrizione aggiuntiva del movimento:*2026-02-03*BETTERLE PAOLO BATTAGGIA ALESSANDRA CAPARRA FTVOUTSEASON SETTIMANA 29/06-03/07GLORIA BDescrizione estesa del movimento: ETTERLE','Cognome \'Betterle\' trovato nella causale, importo corrispondente.','2026-03-02 22:10:03','USR_admin0001'),(8,'2026','Giorgia Cavicchioli',1,'high','11/02/2026',250.00,'Bonifico a vs favore *2026-02-11*CAVICCHIOLI MASSIMO, TRAMBAIOLLI MONICA CAPARRA CONFIRMATORIA PER ISCRIZIONE CAMP GIORGIA CAVICCHIOLI Info aggiuntive: Data ordine: 11/02/2026Localita ordinante: GIACCIANO CON BARUCHELLARagione sociale ordinante: CAVICCHIOLI MASSIMO, TRAMBAIOLLI MONICAIndirizzo ordinante: VIA MADONNINA, 684ID_BONIFICO:1101260400804697Descrizione aggiuntiva del movimento:*2026-02-11*CAVICCHIOLI MASSIMO, TRAMBAIOLLI MONICA CAPARRA CONFIRMATORIA PER ISCRIZIONE CAMP GIORGDescrizione estesa del movimento:IA CAVICCHIOLI','Cognome \'Cavicchioli\' trovato nella causale, importo corrispondente.','2026-03-02 22:10:03','USR_admin0001'),(9,'2026','Silvia Rutili',1,'high','17/02/2026',150.00,'Bonifico a vs favore *INSTANT DEL 17/02/2026 ORE 11:12 ID. 0306924913757410485000099999IT ORD RUTILI FLAVIOSILVIA RUTILI - 29 Giugno - 3 Luglio -DAILY MASTER - CAPARRA CONF. Info aggiuntive:Data ordine: 17/02/2026Localita ordinante: 31039 RIESERagione sociale ordinante: RUTILI FLAVIOIndirizzo ordinante:VIA AURELIA 76AID_BONIFICO:0306924913757410485000099999ITDescrizione aggiuntiva del movimento:*INSTANT DEL 17/02/2026 ORE 11:12 ID. 0306924913757410485000099999IT ORD RUTILI FLAVIODescrizione estesa del movimento: SILVIA RUTILI - 29 Giugno - 3 Luglio -DAILY MASTER - CAPARRA CONF.','Cognome \'Rutili\' trovato nella causale, importo corrispondente.','2026-03-02 22:10:03','USR_admin0001'),(10,'2026','Anna Aurora Trombini',0,NULL,NULL,NULL,NULL,NULL,'2026-03-02 22:10:03','USR_admin0001');
/*!40000 ALTER TABLE `outseason_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_history`
--

DROP TABLE IF EXISTS `password_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_history` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pwd_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pwdhist_user` (`user_id`),
  KEY `idx_pwdhist_created` (`created_at`),
  CONSTRAINT `fk_pwdhist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_history`
--

LOCK TABLES `password_history` WRITE;
/*!40000 ALTER TABLE `password_history` DISABLE KEYS */;
INSERT INTO `password_history` VALUES ('PWH_2b4049c3','USR_d072372c','$2y$12$tSyj8CJGiWwl3rn5.opMCezg7JYR8AhX/GXwuLeNjA5gH115Jgjgy','2026-03-02 22:10:03'),('PWH_2e9a6fa1','USR_37ecc843','$2y$12$6HMxDsHZbiTamcFewzEot.xp2pOw5B4l58N3UJNlqUdECn91a99mm','2026-03-02 22:10:03'),('PWH_ad5f2f53','USR_37ecc843','$2y$12$ySdbkHorqhEJjPuKY7KT7.iIUc8m2lBSjTDKyQj5h7pQ30q6RpJVa','2026-03-02 22:10:03'),('PWH_c39763b4','USR_37ecc843','$2y$12$30T.MegG1QKzFam5JE0.Cut54NaHNtLLsib.0LdmTX4cpAN1bnbke','2026-03-02 22:10:03');
/*!40000 ALTER TABLE `password_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prt_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_plans`
--

DROP TABLE IF EXISTS `payment_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_plans` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `frequency` enum('MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL','CUSTOM') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MONTHLY',
  `start_date` date NOT NULL,
  `season` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pp_athlete` (`athlete_id`),
  KEY `idx_pp_tenant` (`tenant_id`),
  KEY `idx_pp_status` (`status`),
  KEY `fk_pp_creator` (`created_by`),
  CONSTRAINT `fk_pp_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_plans`
--

LOCK TABLES `payment_plans` WRITE;
/*!40000 ALTER TABLE `payment_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments_invoices`
--

DROP TABLE IF EXISTS `payments_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments_invoices` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `due_date` date NOT NULL,
  `beneficiary_user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payer_user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_beneficiary` (`beneficiary_user_id`),
  KEY `idx_payments_payer` (`payer_user_id`),
  KEY `idx_payments_tenant` (`tenant_id`),
  CONSTRAINT `fk_payments_beneficiary` FOREIGN KEY (`beneficiary_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_payer` FOREIGN KEY (`payer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments_invoices`
--

LOCK TABLES `payments_invoices` WRITE;
/*!40000 ALTER TABLE `payments_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `push_subscriptions`
--

DROP TABLE IF EXISTS `push_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `push_subscriptions` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `p256dh_key` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_push_endpoint` (`endpoint`(191)),
  KEY `idx_push_user` (`user_id`),
  CONSTRAINT `fk_push_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `push_subscriptions`
--

LOCK TABLES `push_subscriptions` WRITE;
/*!40000 ALTER TABLE `push_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `push_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rasd_registrations`
--

DROP TABLE IF EXISTS `rasd_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rasd_registrations` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rasd_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sport_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_form` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `affiliated_federation` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `affiliation_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_renewal` date DEFAULT NULL,
  `next_renewal` date DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rasd_tenant` (`tenant_id`),
  KEY `idx_rasd_status` (`status`),
  CONSTRAINT `fk_rasd_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rasd_registrations`
--

LOCK TABLES `rasd_registrations` WRITE;
/*!40000 ALTER TABLE `rasd_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `rasd_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_deadlines`
--

DROP TABLE IF EXISTS `societa_deadlines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_deadlines` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('aperto','completato','scaduto','annullato') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aperto',
  `linked_document_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_societa_deadlines_tenant` (`tenant_id`),
  KEY `idx_societa_deadlines_due` (`due_date`),
  KEY `idx_societa_deadlines_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_deadlines`
--

LOCK TABLES `societa_deadlines` WRITE;
/*!40000 ALTER TABLE `societa_deadlines` DISABLE KEYS */;
/*!40000 ALTER TABLE `societa_deadlines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_documents`
--

DROP TABLE IF EXISTS `societa_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_documents` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('statuto','affiliazione','licenza','assicurazione','altro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'altro',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expiry_date` date DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_societa_docs_tenant` (`tenant_id`),
  KEY `idx_societa_docs_expiry` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_documents`
--

LOCK TABLES `societa_documents` WRITE;
/*!40000 ALTER TABLE `societa_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `societa_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_members`
--

DROP TABLE IF EXISTS `societa_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_members` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FK to users table (nullable: external person)',
  `role_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Denormalised for external members',
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_societa_members_tenant` (`tenant_id`),
  KEY `idx_societa_members_role` (`role_id`),
  KEY `idx_societa_members_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_members`
--

LOCK TABLES `societa_members` WRITE;
/*!40000 ALTER TABLE `societa_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `societa_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_profile`
--

DROP TABLE IF EXISTS `societa_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_profile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mission` text COLLATE utf8mb4_unicode_ci,
  `vision` text COLLATE utf8mb4_unicode_ci,
  `values` text COLLATE utf8mb4_unicode_ci,
  `founded_year` smallint DEFAULT NULL,
  `primary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hex color, e.g. #FF0000',
  `secondary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `legal_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operative_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_societa_profile_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_profile`
--

LOCK TABLES `societa_profile` WRITE;
/*!40000 ALTER TABLE `societa_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `societa_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_roles`
--

DROP TABLE IF EXISTS `societa_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_roles` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `permissions_json` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON array of permission strings',
  `parent_role_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_societa_roles_tenant` (`tenant_id`),
  KEY `idx_societa_roles_parent` (`parent_role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_roles`
--

LOCK TABLES `societa_roles` WRITE;
/*!40000 ALTER TABLE `societa_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `societa_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_sponsors`
--

DROP TABLE IF EXISTS `societa_sponsors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_sponsors` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Sponsor',
  `stagione` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `facebook_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedin_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiktok_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importo` decimal(10,2) DEFAULT NULL,
  `rapporto` decimal(10,2) DEFAULT NULL,
  `sponsorizzazione` decimal(10,2) DEFAULT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_societa_sponsors_tenant` (`tenant_id`),
  KEY `idx_societa_sponsors_sort` (`tenant_id`,`sort_order`),
  KEY `idx_societa_sponsors_active` (`tenant_id`,`is_active`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_sponsors`
--

LOCK TABLES `societa_sponsors` WRITE;
/*!40000 ALTER TABLE `societa_sponsors` DISABLE KEYS */;
INSERT INTO `societa_sponsors` VALUES ('SSP_TEST_2','tenant_123','TestCase2','Sponsor','2024/2025',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,'2026-03-20 21:02:40','2026-03-20 21:02:40',0);
/*!40000 ALTER TABLE `societa_sponsors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `societa_titoli`
--

DROP TABLE IF EXISTS `societa_titoli`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `societa_titoli` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stagione` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Es. 2024/25',
  `campionato` enum('provinciale','regionale','nazionale') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'provinciale',
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Es. Under 18 Femminile',
  `piazzamento` tinyint NOT NULL DEFAULT '1' COMMENT '1 = 1° posto, 2 = 2° posto, 3 = 3° posto',
  `finali_nazionali` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Partecipazione alle finali nazionali',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_societa_titoli_tenant` (`tenant_id`),
  KEY `idx_societa_titoli_stagione` (`tenant_id`,`stagione`),
  KEY `idx_societa_titoli_active` (`tenant_id`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `societa_titoli`
--

LOCK TABLES `societa_titoli` WRITE;
/*!40000 ALTER TABLE `societa_titoli` DISABLE KEYS */;
INSERT INTO `societa_titoli` VALUES ('STT_test1234','TNT_default','2025/2026','provinciale','Under 16',1,0,NULL,'2026-03-19 21:59:11','2026-03-19 21:59:11',0);
/*!40000 ALTER TABLE `societa_titoli` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_members`
--

DROP TABLE IF EXISTS `staff_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_members` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `birth_place` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residence_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `residence_city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_code` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identity_document` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medical_cert_expires_at` date DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_esign_document_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_esign_signing_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_signed_pdf_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contract_signed_at` datetime DEFAULT NULL,
  `contract_valid_from` date DEFAULT NULL,
  `contract_valid_to` date DEFAULT NULL,
  `contract_monthly_fee` decimal(10,2) DEFAULT NULL,
  `contract_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_doc_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cf_doc_file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_tenant` (`tenant_id`),
  KEY `idx_staff_deleted` (`is_deleted`),
  CONSTRAINT `fk_staff_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_members`
--

LOCK TABLES `staff_members` WRITE;
/*!40000 ALTER TABLE `staff_members` DISABLE KEYS */;
INSERT INTO `staff_members` VALUES ('0349a4dcb53e3cb547e4','TNT_default','Mario','Rossi',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-09 22:51:58'),('13e9bf63a511664c2ab9','TNT_default','Simone','Vergano','Fisioterapista',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('20d7cfc410a9d716d5c8','TNT_default','Stefano','Cietto','Secondo Allenatore','1991-08-07',NULL,NULL,NULL,'3382986338','Ciettos00@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('31709e55d4a273ab1c4e','TNT_default','Chantal','Pollon','Dirigente',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('370e75809eff57f3e2a1','TNT_default','Francesco','Donnarumma','Dirigente',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('377ab73a77174202490c','TNT_default','Alessandro','Gobbo','Dirigente',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('4d3426c356098f95b076','TNT_default','Irene','Girotto','Preparatore Atletico','2001-04-10',NULL,NULL,NULL,'3425900866','girottoirene01@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('531f116bf7df6753a68f','TNT_default','Alessio','Carraro','Preparatore Atletico',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('6fe1d6128e05d79c9ff3','TNT_default','Catiuscia','Bazzi','Secondo Allenatore','1972-01-20',NULL,NULL,NULL,'3384516769','katiusciabazzi@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('74844e756d9e275ee55a','TNT_default','Nicola','Martignago','Primo Allenatore','1996-02-13',NULL,NULL,NULL,'3348062321','nico.martignago96@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('86405423953ea1632331','TNT_default','Marco','Vanzo','Primo Allenatore','1979-11-28',NULL,NULL,NULL,'3470800161','direttoretecnico@fusionteamvolley.it',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('a66920ae223813b7f2ca','TNT_default','Carlo','Chieco','Allenatore','1972-08-09',NULL,NULL,NULL,'3468040690','carloKie@libero.it',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:58:43'),('b105244ca9efc59269ce','TNT_default','Nicolò','Pellizzari','Secondo Allenatore','2006-02-20',NULL,NULL,NULL,'3664394242','nicolopellizzari4@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('c2e4c0af7059ea397705','TNT_default','Jacopo','Micheli','Secondo Allenatore','2001-02-23',NULL,NULL,NULL,'3703007815','jacopomicheli23@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('d2a733f7d2d0c09cc936','TNT_default','Marco','Cedolini','Secondo Allenatore',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('e743b7d8ba18bfdaaa1b','TNT_default','Nicola','Bragato','Dirigente',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('f45ec388bdc9ada825ef','TNT_default','Alessia','Carraro','Secondo Allenatore','2003-12-17',NULL,NULL,NULL,'3458233995','alessiacarraro10@gmail.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43'),('fb562129e3c5dd9baec9','TNT_default','Alessia','Carraro','Addetta Stampa',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,'2026-03-08 18:55:43','2026-03-08 18:55:43');
/*!40000 ALTER TABLE `staff_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_teams`
--

DROP TABLE IF EXISTS `staff_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_teams` (
  `staff_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_season_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`,`team_season_id`),
  KEY `fk_st_team_season` (`team_season_id`),
  CONSTRAINT `fk_st_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_teams`
--

LOCK TABLES `staff_teams` WRITE;
/*!40000 ALTER TABLE `staff_teams` DISABLE KEYS */;
INSERT INTO `staff_teams` VALUES ('0349a4dcb53e3cb547e4','TS_329e0cdc1d9511f','2026-03-09 23:52:23'),('0349a4dcb53e3cb547e4','TS_329e0ff21d9511f','2026-03-09 23:52:23');
/*!40000 ALTER TABLE `staff_teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_logs`
--

DROP TABLE IF EXISTS `task_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_logs` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interaction_date` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `outcome` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `esito` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Non ha risposto | Interessato | Richiamare | Confermato | Non interessato | In attesa | Altro',
  `attachment` longtext COLLATE utf8mb4_unicode_ci COMMENT 'File allegato in formato base64 data-URI',
  `schedule_followup` tinyint(1) NOT NULL DEFAULT '0',
  `followup_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_logs_task` (`task_id`),
  KEY `idx_task_logs_user` (`user_id`),
  CONSTRAINT `fk_task_logs_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_logs`
--

LOCK TABLES `task_logs` WRITE;
/*!40000 ALTER TABLE `task_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Interno',
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Media',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Da fare',
  `due_date` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `attachment` longtext COLLATE utf8mb4_unicode_ci COMMENT 'File allegato in formato base64 data-URI',
  `assigned_to` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_user` (`user_id`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_priority` (`priority`),
  KEY `idx_tasks_due` (`due_date`),
  KEY `idx_tasks_assigned` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `team_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `joined_at` date NOT NULL DEFAULT (curdate()),
  `left_at` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`team_id`,`user_id`),
  KEY `fk_team_members_user` (`user_id`),
  CONSTRAINT `fk_team_members_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_seasons`
--

DROP TABLE IF EXISTS `team_seasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_seasons` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `season` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_season` (`team_id`,`season`),
  CONSTRAINT `fk_ts_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_seasons`
--

LOCK TABLES `team_seasons` WRITE;
/*!40000 ALTER TABLE `team_seasons` DISABLE KEYS */;
INSERT INTO `team_seasons` VALUES ('TS_329e05c01d9511f','TEAM_u13a','2025-26',1,'2026-03-11 22:56:46','2026-03-11 22:56:46'),('TS_329e0cdc1d9511f','TEAM_u14a','2025-26',1,'2026-03-11 22:56:46','2026-03-11 22:56:46'),('TS_329e0ff21d9511f','TEAM_u16a','2025-26',1,'2026-03-11 22:56:46','2026-03-11 22:56:46'),('TS_329e120e1d9511f','TEAM_u18a','2025-26',1,'2026-03-11 22:56:46','2026-03-11 22:56:46');
/*!40000 ALTER TABLE `team_seasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `coach_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_hex` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#E6007E',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teams_category` (`category`),
  KEY `idx_teams_deleted_at` (`deleted_at`),
  KEY `fk_teams_coach` (`coach_id`),
  CONSTRAINT `fk_teams_coach` FOREIGN KEY (`coach_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES ('TEAM_u13a','1','U13',NULL,'#E6007E',1,NULL,'2026-03-02 22:10:03','2026-03-12 17:28:58'),('TEAM_u14a','1','U14',NULL,'#E6007E',1,NULL,'2026-03-02 22:10:03','2026-03-12 17:28:58'),('TEAM_u16a','1','U16',NULL,'#E6007E',1,NULL,'2026-03-02 22:10:03','2026-03-12 17:28:58'),('TEAM_u18a','1','U18',NULL,'#E6007E',1,NULL,'2026-03-02 22:10:03','2026-03-12 17:28:58');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_invitations`
--

DROP TABLE IF EXISTS `tenant_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_invitations` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roles` json NOT NULL,
  `invited_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invites_tenant` (`tenant_id`),
  KEY `idx_invites_email` (`email`),
  KEY `idx_invites_token` (`token`),
  KEY `idx_invites_status` (`status`),
  KEY `fk_invites_user` (`invited_by`),
  CONSTRAINT `fk_invites_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invites_user` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_invitations`
--

LOCK TABLES `tenant_invitations` WRITE;
/*!40000 ALTER TABLE `tenant_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_settings`
--

DROP TABLE IF EXISTS `tenant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_settings` (
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_id`,`setting_key`),
  CONSTRAINT `fk_tenant_settings_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_settings`
--

LOCK TABLES `tenant_settings` WRITE;
/*!40000 ALTER TABLE `tenant_settings` DISABLE KEYS */;
INSERT INTO `tenant_settings` VALUES ('TNT_default','club_name','Fusion Team Volley','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','federation','FIPAV','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','legal_form','ASD','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','max_athletes','500','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','max_teams','20','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','plan_tier','pro','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','primary_color','#E6007E','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','season_format','2025-2026','2026-03-03 00:45:24','2026-03-03 00:45:24'),('TNT_default','sport_type','pallavolo','2026-03-03 00:45:24','2026-03-03 00:45:24');
/*!40000 ALTER TABLE `tenant_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_users`
--

DROP TABLE IF EXISTS `tenant_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant_users` (
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roles` json NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tenant_id`,`user_id`),
  KEY `fk_tenant_users_user` (`user_id`),
  CONSTRAINT `fk_tenant_users_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tenant_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_users`
--

LOCK TABLES `tenant_users` WRITE;
/*!40000 ALTER TABLE `tenant_users` DISABLE KEYS */;
INSERT INTO `tenant_users` VALUES ('TNT_default','USR_admin0001','[\"superadmin\"]',1,'2026-03-02 22:10:03','2026-03-02 22:10:03');
/*!40000 ALTER TABLE `tenant_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenants_domain` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('TNT_default','Virtus Roma','virtus.fusionerp.it',1,'2026-03-02 22:10:03','2026-03-02 22:10:03');
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_details`
--

DROP TABLE IF EXISTS `tournament_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournament_details` (
  `event_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_url` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fee_per_athlete` decimal(8,2) DEFAULT '0.00',
  `accommodation_info` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  CONSTRAINT `fk_tourney_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_details`
--

LOCK TABLES `tournament_details` WRITE;
/*!40000 ALTER TABLE `tournament_details` DISABLE KEYS */;
INSERT INTO `tournament_details` VALUES ('EVT_1d1af7fa','',200.00,'','2026-03-05 22:28:39','2026-03-05 22:28:39'),('EVT_70b517b2','',199.95,'','2026-03-05 22:19:02','2026-03-05 22:19:02'),('EVT_f3f8dcc7','',199.96,'','2026-03-05 22:07:01','2026-03-05 22:07:01'),('EVT_ff4fe020','',199.93,'','2026-03-05 22:48:48','2026-03-05 22:48:48');
/*!40000 ALTER TABLE `tournament_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_matches`
--

DROP TABLE IF EXISTS `tournament_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tournament_matches` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `match_time` datetime NOT NULL,
  `opponent_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `court_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `our_score` smallint DEFAULT '0',
  `opponent_score` smallint DEFAULT '0',
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tourney_match_event` (`event_id`),
  CONSTRAINT `fk_tourney_match_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_matches`
--

LOCK TABLES `tournament_matches` WRITE;
/*!40000 ALTER TABLE `tournament_matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `tournament_matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `installment_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `payment_method` enum('BANK_TRANSFER','CARD','CASH','SEPA','STRIPE','OTHER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tx_athlete` (`athlete_id`),
  KEY `idx_tx_tenant` (`tenant_id`),
  KEY `idx_tx_installment` (`installment_id`),
  KEY `fk_tx_creator` (`created_by`),
  CONSTRAINT `fk_tx_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tx_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tx_installment` FOREIGN KEY (`installment_id`) REFERENCES `installments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tx_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transports`
--

DROP TABLE IF EXISTS `transports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transports` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `team_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `driver_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination_address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination_lat` decimal(10,7) DEFAULT NULL,
  `destination_lng` decimal(10,7) DEFAULT NULL,
  `departure_address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `arrival_time` time NOT NULL,
  `departure_time` time DEFAULT NULL,
  `transport_date` date NOT NULL,
  `athletes_json` json NOT NULL,
  `timeline_json` json DEFAULT NULL,
  `stats_json` json DEFAULT NULL,
  `ai_response` json DEFAULT NULL,
  `created_by` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_transports_team` (`team_id`),
  KEY `idx_transports_date` (`transport_date`),
  KEY `fk_transports_driver` (`driver_id`),
  CONSTRAINT `fk_transports_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transports`
--

LOCK TABLES `transports` WRITE;
/*!40000 ALTER TABLE `transports` DISABLE KEYS */;
/*!40000 ALTER TABLE `transports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_relationships`
--

DROP TABLE IF EXISTS `user_relationships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_relationships` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `child_user_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `relation_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_rel` (`parent_user_id`,`child_user_id`),
  KEY `fk_user_rel_child` (`child_user_id`),
  CONSTRAINT `fk_user_rel_child` FOREIGN KEY (`child_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_rel_parent` FOREIGN KEY (`parent_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_relationships`
--

LOCK TABLES `user_relationships` WRITE;
/*!40000 ALTER TABLE `user_relationships` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_relationships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pwd_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','manager','operator','readonly') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'readonly',
  `full_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Se 1, l''utente deve cambiare la password al prossimo accesso.',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Attivo',
  `blocked` tinyint(1) NOT NULL DEFAULT '0',
  `verification_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_expires_at` datetime DEFAULT NULL,
  `password_reset_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_deleted_at` (`deleted_at`),
  KEY `idx_users_must_change` (`must_change_password`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_blocked` (`blocked`),
  KEY `idx_users_token` (`verification_token`(64)),
  KEY `idx_users_pwd_reset_token` (`password_reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('USR_37ecc843','marco@marcovanzo.com','$2y$12$LXpo9FhWZDhI4MsNLvtKLOcFj1E.Gs.x.5ZsjGcT9Gr9qbuA9Om/S','admin','Marco Vanzo',NULL,NULL,'2026-03-02 20:44:45','2026-03-12 00:30:35',1,NULL,'2026-03-02 22:10:03','2026-03-12 00:30:35',0,'Attivo',0,NULL,NULL,NULL,NULL),('USR_admin0001','admin@fusionerp.it','$2y$12$wQnP01kdJEjyXCDP8n5MDeja9NiztC7RuNep6Os0hMdVQcK/gHAHa','admin','System Administrator',NULL,NULL,'2026-03-01 01:50:12','2026-03-02 16:31:03',0,'2026-03-02 20:46:27','2026-03-02 22:10:03','2026-03-02 22:10:03',0,'Disattivato',0,NULL,NULL,NULL,NULL),('USR_d072372c','n.martignago@fusionteamvolley.it','$2y$12$tSyj8CJGiWwl3rn5.opMCezg7JYR8AhX/GXwuLeNjA5gH115Jgjgy','admin','Nicola Martignago',NULL,NULL,NULL,'2026-03-03 08:42:39',1,NULL,'2026-03-02 22:10:03','2026-03-07 00:31:02',0,'Attivo',0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vald_test_results`
--

DROP TABLE IF EXISTS `vald_test_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vald_test_results` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `athlete_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `test_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `test_date` datetime NOT NULL,
  `test_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `metrics` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_test_id` (`test_id`),
  KEY `idx_athlete` (`athlete_id`),
  KEY `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_vald_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vald_test_results`
--

LOCK TABLES `vald_test_results` WRITE;
/*!40000 ALTER TABLE `vald_test_results` DISABLE KEYS */;
INSERT INTO `vald_test_results` VALUES ('VTR_00567dfa','TNT_default','ATH_e5a4103c','VTR_00567dfa','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1648.0800000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.74}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 824.0400000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 696}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 824.0400000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 56.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1236.0600000000002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1025.9298}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_017f6e44','TNT_default','ATH_6fca54e6','VTR_017f6e44','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1186.0290000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6236}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 625.6}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_01a512fb','TNT_default','ATH_672853f8','VTR_01a512fb','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1272.8475}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.61}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 636.42375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 553}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 636.42375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 34.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 925.99655625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 954.635625}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_01be75ba','TNT_default','ATH_e5a4103c','VTR_01be75ba','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1598.6376}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9836000000000005}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 723.84}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_02232219','TNT_default','ATH_e4095e31','VTR_02232219','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1230.174}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.242}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 495.95}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_031d8075','TNT_default','ATH_e4095e31','VTR_031d8075','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1679.42295}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6032}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 477.9}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_039aac29','TNT_default','ATH_d73ce862','VTR_039aac29','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1129.008375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9118}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 850.25}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_041154f2','TNT_default','ATH_8411262d','VTR_041154f2','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1698.478875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6107}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 768.96}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0449bf4c','TNT_default','ATH_812b19d1','VTR_0449bf4c','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1726.2902250000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4039}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 777.7}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_05920a13','TNT_default','ATH_2f6c59b4','VTR_05920a13','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1252.8351}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.53}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 666.9}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_05d14129','TNT_default','ATH_6ea16536','VTR_05d14129','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1692.225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.09}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 846.1125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 729}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 846.1125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 51.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1269.1687499999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1066.1017499999998}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_05e91893','TNT_default','ATH_54db9a34','VTR_05e91893','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1263.209175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8584}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 587.1}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_06c509c3','TNT_default','ATH_6ab8039f','VTR_06c509c3','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1174.2569999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1066999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 769.62}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_0779b133','TNT_default','ATH_95f24a3d','VTR_0779b133','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1645.137}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0903999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 916.65}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_07852fb4','TNT_default','ATH_8c0b5d87','VTR_07852fb4','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1776.83625}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1136}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 790.7900000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_093c0349','TNT_default','ATH_15ba0c86','VTR_093c0349','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1776.026925}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9367}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 757.5600000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0944513a','TNT_default','ATH_6fca54e6','VTR_0944513a','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.63}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.53}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 871}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 42.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 760.1768999999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 904.9725}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_0981bbb3','TNT_default','ATH_812b19d1','VTR_0981bbb3','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1298.89305}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8096}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 655.2}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0a11b16f','TNT_default','ATH_637bf272','VTR_0a11b16f','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1074.195}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.284}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 665.7}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0d1d9e25','TNT_default','ATH_a0060822','VTR_0d1d9e25','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1163.2943249999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7538000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 660.6}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0d7bcd3a','TNT_default','ATH_7df0509e','VTR_0d7bcd3a','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1817.3025}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 908.65125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 825}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 908.65125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 57.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1362.9768750000003}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1035.8624250000005}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0e4a3109','TNT_default','ATH_8c0b5d87','VTR_0e4a3109','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1998.297}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1012}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 510.22}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_0e7b390b','TNT_default','ATH_a389559c','VTR_0e7b390b','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2016.322875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.827}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 598.4300000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_0ec489d6','TNT_default','ATH_a0060822','VTR_0ec489d6','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1589.22}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.24}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 794.61}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 893}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 794.61}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 30.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1179.99585}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1191.915}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_0f2c5fdc','TNT_default','ATH_6ab8039f','VTR_0f2c5fdc','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1324.35}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.13}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 662.1750000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 656}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 662.1750000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 41.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 933.66675}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 993.2625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0fa372c4','TNT_default','ATH_848ea150','VTR_0fa372c4','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1788.4611}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.01}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 940.8}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_0fb82163','TNT_default','ATH_c16fcee1','VTR_0fb82163','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1043.14635}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2535}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 567.1}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_11501e78','TNT_default','ATH_a1639d48','VTR_11501e78','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1177.2}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.91}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 588.6}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 598}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 588.6}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 45}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 662.1750000000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 882.9000000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1179d6c3','TNT_default','ATH_1a873329','VTR_1179d6c3','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 961.4781}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2208}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 674.3100000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_13136030','TNT_default','ATH_5bba3b0d','VTR_13136030','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1662.868575}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4672000000000005}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 659.88}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_13960491','TNT_default','ATH_8dc7b566','VTR_13960491','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1908.38835}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9264}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 955.9}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_13bb8b67','TNT_default','ATH_b2dae3c0','VTR_13bb8b67','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1327.44015}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9729}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 587.52}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_14016810','TNT_default','ATH_e35f4884','VTR_14016810','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1824.66}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.31}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 912.33}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 637}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 912.33}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 33.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1368.495}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1300.07025}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_1539298f','TNT_default','ATH_637bf272','VTR_1539298f','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1828.7802}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.469}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 591.87}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1557ba1e','TNT_default','ATH_848ea150','VTR_1557ba1e','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1638.6623999999997}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1024}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 822.97}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1597f024','TNT_default','ATH_e21e52aa','VTR_1597f024','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1751.0849999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.35}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 875.5424999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 826}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 875.5424999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 59.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1313.3137499999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1195.1155124999998}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_1702780f','TNT_default','ATH_15ba0c86','VTR_1702780f','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1670.520375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8462}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 686.76}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1726bcca','TNT_default','ATH_8dc7b566','VTR_1726bcca','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1979.1675}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 989.58375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 841}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 989.58375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 57.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1172.6567437500005}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1484.375625}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_1727ff9c','TNT_default','ATH_737bcf9d','VTR_1727ff9c','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1282.41225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.57}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 646.8000000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_185f1024','TNT_default','ATH_f4016c19','VTR_185f1024','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1236.06}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2222}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 880}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_18a51b06','TNT_default','ATH_54db9a34','VTR_18a51b06','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1302.2775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.84}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 651.13875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 570}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 651.13875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 47.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 957.1739625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 976.708125}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_19054f3f','TNT_default','ATH_d73ce862','VTR_19054f3f','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1158.3647999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7514999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 512.04}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_193d02c2','TNT_default','ATH_a389559c','VTR_193d02c2','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1843.4952}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7748}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 639.1}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_1a8b4b1c','TNT_default','ATH_6ab8039f','VTR_1a8b4b1c','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1324.35}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1639}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 708.48}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1aa96588','TNT_default','ATH_b168cd8c','VTR_1aa96588','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1602.4635}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0608}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 559.98}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_1aafea6f','TNT_default','ATH_e4095e31','VTR_1aafea6f','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1662.7949999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.67}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 831.3974999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 531}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 831.3974999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 32.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1222.1543249999995}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1247.0962499999998}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_1ab94ce5','TNT_default','ATH_6ea16536','VTR_1ab94ce5','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1726.0694999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1009}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 743.58}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1afde58c','TNT_default','ATH_8411262d','VTR_1afde58c','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1752.11505}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8054}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 733.36}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1b23a781','TNT_default','ATH_1a873329','VTR_1b23a781','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1243.4175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.78}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 621.70875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 558}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 621.70875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 42.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 932.563125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 857.958075}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1b2d009c','TNT_default','ATH_c7053ff9','VTR_1b2d009c','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1706.9399999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.11}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 853.4699999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 860}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 853.4699999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1280.205}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1267.40295}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_1b5ab9e4','TNT_default','ATH_19075f16','VTR_1b5ab9e4','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1155.1275}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 577.56375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 690}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 577.56375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 56}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 649.7592187500001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 866.345625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1b63b8d5','TNT_default','ATH_b2dae3c0','VTR_1b63b8d5','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1341.1251000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8281}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 565.76}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_1bf1ba16','TNT_default','ATH_b168cd8c','VTR_1bf1ba16','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1683.3960000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9588}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 576.45}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_1c1e0c9d','TNT_default','ATH_5f38e64f','VTR_1c1e0c9d','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1993.073175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9019}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 611.62}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1d01ff8e','TNT_default','ATH_19075f16','VTR_1d01ff8e','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1243.1232}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1284}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 710.32}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_1d6127d0','TNT_default','ATH_4530391f','VTR_1d6127d0','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1643.9597999999996}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1102}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 672.59}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1de7b6d0','TNT_default','ATH_54db9a34','VTR_1de7b6d0','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1705.100625}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5066}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 688.01}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1e26c9b0','TNT_default','ATH_95f24a3d','VTR_1e26c9b0','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1481.8005}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0856}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 821}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_1eef6ca0','TNT_default','ATH_637bf272','VTR_1eef6ca0','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1758.4425}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 879.22125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 543}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 879.22125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 45.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1318.831875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1239.7019625}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_1fa12a74','TNT_default','ATH_9f83cf89','VTR_1fa12a74','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1795.23}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9008}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 894.4}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_207e95c5','TNT_default','ATH_848ea150','VTR_207e95c5','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1724.0094}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0706}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 735.08}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_220137c7','TNT_default','ATH_9f83cf89','VTR_220137c7','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1759.3254}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.016}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 851.4}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_23511381','TNT_default','ATH_6ea16536','VTR_23511381','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1607.6137499999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0137}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 714.42}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_2416d798','TNT_default','ATH_4530391f','VTR_2416d798','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 995.9112}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2084}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 729.9}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_244a6c8d','TNT_default','ATH_637bf272','VTR_244a6c8d','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1074.195}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.248}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 627.66}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_2532340d','TNT_default','ATH_a1639d48','VTR_2532340d','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1962.24525}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.28}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 693.55}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_262a475f','TNT_default','ATH_b168cd8c','VTR_262a475f','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1719.962775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9552}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 647}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_2652fea9','TNT_default','ATH_b2dae3c0','VTR_2652fea9','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1341.1251000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7014}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 505.92}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_26b47bc2','TNT_default','ATH_e21e52aa','VTR_26b47bc2','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1787.8725000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4659000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 932.04}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_26e2090e','TNT_default','ATH_4ab010e6','VTR_26e2090e','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1178.23005}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6872000000000005}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 670.6800000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_2736d23d','TNT_default','ATH_8ec56b3e','VTR_2736d23d','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1821.1284}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0989}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 640.34}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_295bf29d','TNT_default','ATH_4ab010e6','VTR_295bf29d','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 950.589}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.265}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 584.1}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_29918b4d','TNT_default','ATH_4ab010e6','VTR_29918b4d','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2071.2834}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1867}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 866.23}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_2b244c5b','TNT_default','ATH_54db9a34','VTR_2b244c5b','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1218.54915}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9579}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 727.9200000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_2be16d1f','TNT_default','ATH_e35f4884','VTR_2be16d1f','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1733.427}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3624}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 662.48}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_2c216b2c','TNT_default','ATH_c16fcee1','VTR_2c216b2c','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1022.6925}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2208}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 588.5}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_2cdd4f48','TNT_default','ATH_a0060822','VTR_2cdd4f48','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1509.759}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2152}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 955.51}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_2d5ea0f9','TNT_default','ATH_5f38e64f','VTR_2d5ea0f9','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1361.1375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7859999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 601}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_2dcc3ed0','TNT_default','ATH_7df0509e','VTR_2dcc3ed0','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1236.06}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.55}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 618.03}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 639}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 618.03}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 34.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 880.6927499999999}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 927.045}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_2df0d860','TNT_default','ATH_d7d0f473','VTR_2df0d860','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1558.686375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3482999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 555.39}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_2e1faf83','TNT_default','ATH_1d15384e','VTR_2e1faf83','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1670.1525}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.19}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 835.07625}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 788}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 835.07625}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 37.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1252.614375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1039.6699312499998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_2e92c441','TNT_default','ATH_737bcf9d','VTR_2e92c441','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1184.70465}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6642}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 671.44}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_2fbf1b4d','TNT_default','ATH_f4016c19','VTR_2fbf1b4d','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1236.06}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.26}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 618.03}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 880}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 618.03}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 52.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 927.045}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 843.61095}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_305a7c3d','TNT_default','ATH_19075f16','VTR_305a7c3d','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1243.1232}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2152}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 642.02}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_30c08cd4','TNT_default','ATH_b134c938','VTR_30c08cd4','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1511.5248}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1904}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 636.48}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_31b16a51','TNT_default','ATH_d7d0f473','VTR_31b16a51','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1624.3152750000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5846}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 566.61}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_32fbf726','TNT_default','ATH_5bba3b0d','VTR_32fbf726','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1803.61755}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7108}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 680.34}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_333b2feb','TNT_default','ATH_9f83cf89','VTR_333b2feb','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.63}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.83}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 764}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 52.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 787.3260749999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 904.9725}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_335916ee','TNT_default','ATH_4530391f','VTR_335916ee','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1643.9597999999996}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3176}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 679.12}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_34060a68','TNT_default','ATH_8dc7b566','VTR_34060a68','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2004.7716000000005}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7028}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 938.52}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_3415508f','TNT_default','ATH_637bf272','VTR_3415508f','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1811.195775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.183}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 570.15}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_3504b10b','TNT_default','ATH_5bba3b0d','VTR_3504b10b','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1698.5524499999997}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8047999999999995}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 613.64}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_355772ce','TNT_default','ATH_8411262d','VTR_355772ce','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1394.3934}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7108}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 494.95}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_356dcf4b','TNT_default','ATH_7b202bcb','VTR_356dcf4b','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 949.191075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.178}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 562.02}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_35874228','TNT_default','ATH_4ab010e6','VTR_35874228','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1000.62}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.15}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 500.31000000000006}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 531}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 500.31000000000006}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 46.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 750.4650000000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 682.9231500000002}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_3615874a','TNT_default','ATH_e4095e31','VTR_3615874a','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1320.8184}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2204}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 534.1}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_361ef04d','TNT_default','ATH_c0577c82','VTR_361ef04d','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 942.0543}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3446999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 777.6}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_36b785a7','TNT_default','ATH_8c0b5d87','VTR_36b785a7','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1692.225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.16}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 846.1125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 869}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 846.1125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 50.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1231.0936874999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1269.1687499999998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_36ca04b4','TNT_default','ATH_7ff67290','VTR_36ca04b4','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1582.1568000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9672}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 587.02}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_392bc0f0','TNT_default','ATH_f4016c19','VTR_392bc0f0','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1297.863}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1969999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 792}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_393aa2f6','TNT_default','ATH_848ea150','VTR_393aa2f6','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1706.9399999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1766}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 727.09}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_397069d1','TNT_default','ATH_b168cd8c','VTR_397069d1','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1618.65}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.02}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 809.325}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 549}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 809.325}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 48}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1189.7077500000005}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1213.9875000000002}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_39ecf2b8','TNT_default','ATH_848ea150','VTR_39ecf2b8','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1805.8248}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.2712999999999997}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 940.8}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_3a068e4a','TNT_default','ATH_a0060822','VTR_3a068e4a','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1199.2724999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.58}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 599.6362499999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 734}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 599.6362499999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 57}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 899.4543749999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 854.4816562499998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_3a6c3792','TNT_default','ATH_c16fcee1','VTR_3a6c3792','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1022.6925}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.09}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 511.34624999999994}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 535}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 511.34624999999994}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 53.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 636.6260812499999}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 767.0193749999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_3b5740b2','TNT_default','ATH_54db9a34','VTR_3b5740b2','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1655.4375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.62}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 827.71875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 643}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 827.71875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 37.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1229.16234375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1241.578125}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_3b6219e7','TNT_default','ATH_d7d0f473','VTR_3b6219e7','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1640.7225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.39}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 561}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 31.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1119.7931062500002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1230.541875}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_3c06b762','TNT_default','ATH_8c0b5d87','VTR_3c06b762','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2101.302}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.2848}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 504.96}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_3c0d7453','TNT_default','ATH_a0060822','VTR_3c0d7453','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1589.22}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1532}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 875.14}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_3cb8f35a','TNT_default','ATH_95f24a3d','VTR_3cb8f35a','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1581.8625}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.16}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 790.93125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 873}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 790.93125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 57.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1186.396875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1162.6689375}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_3cdfc427','TNT_default','ATH_19075f16','VTR_3cdfc427','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1189.7813250000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.957}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 669.3}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_3d3a0a9a','TNT_default','ATH_da3d068c','VTR_3d3a0a9a','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1648.0800000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.87}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 824.0400000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 679}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 824.0400000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 43.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1013.5692000000004}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1236.0600000000002}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_3d84768c','TNT_default','ATH_4ab010e6','VTR_3d84768c','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1108.9224}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.444}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 692.55}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_3d9a806f','TNT_default','ATH_c16fcee1','VTR_3d9a806f','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1684.8675}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.33}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 842.43375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 851}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 842.43375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 52.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1263.650625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1200.46809375}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_404ae07f','TNT_default','ATH_e21e52aa','VTR_404ae07f','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1663.5307499999997}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.35}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 784.6999999999999}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_414deadd','TNT_default','ATH_a1639d48','VTR_414deadd','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1868.805}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 934.4025}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 715}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 934.4025}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1401.60375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1317.507525}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_41a63db6','TNT_default','ATH_672853f8','VTR_41a63db6','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1221.9336}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5778}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 602.7700000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_41d9c129','TNT_default','ATH_eeb5e1aa','VTR_41d9c129','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1545.075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 772.5375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 533}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 772.5375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 44.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 984.9853125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1158.80625}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_42381bf3','TNT_default','ATH_eeb5e1aa','VTR_42381bf3','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1942.38}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0064}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 509.64}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_426e8be9','TNT_default','ATH_54db9a34','VTR_426e8be9','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1243.4175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.93}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 621.70875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 674}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 621.70875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 59.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 932.563125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 904.58623125}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_43ee0ebe','TNT_default','ATH_8c0b5d87','VTR_43ee0ebe','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1624.5359999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1367999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 912.45}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_4403242d','TNT_default','ATH_7188f043','VTR_4403242d','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1631.5992}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8618}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 788.4000000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_4425a54d','TNT_default','ATH_7b202bcb','VTR_4425a54d','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1795.37715}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.14}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 510.84}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_4464fb0d','TNT_default','ATH_2f6c59b4','VTR_4464fb0d','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 995.76405}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1367999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 653.76}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_44aa8936','TNT_default','ATH_637bf272','VTR_44aa8936','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1758.4425}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.404}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 494.13}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_44b28178','TNT_default','ATH_b168cd8c','VTR_44b28178','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1826.352225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.162}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 698.76}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_454bda89','TNT_default','ATH_812b19d1','VTR_454bda89','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1339.065}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.74}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 669.5325}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 720}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 669.5325}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 38.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 954.0838125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1004.29875}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_455d491e','TNT_default','ATH_8dc7b566','VTR_455d491e','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1880.209125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.632}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 908.28}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_4603cfe3','TNT_default','ATH_e5a4103c','VTR_4603cfe3','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1265.49}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.026}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 489.6}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_466b6771','TNT_default','ATH_5b77e11e','VTR_466b6771','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1798.4672999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6928999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 523.18}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_468ff982','TNT_default','ATH_28b06dd4','VTR_468ff982','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1258.1325000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6836000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 785.0699999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_47349095','TNT_default','ATH_8c0b5d87','VTR_47349095','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2060.1}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.04}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 1030.05}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 526}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 1030.05}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 59.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1545.0749999999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1467.8212499999995}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_473e4f45','TNT_default','ATH_28b06dd4','VTR_473e4f45','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1727.09955}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2177}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 855.9200000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_483e687c','TNT_default','ATH_4530391f','VTR_483e687c','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1016.65935}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0176}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 786.67}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_486ad302','TNT_default','ATH_95f24a3d','VTR_486ad302','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1512.9963000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3333999999999997}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 738.9}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_48f416f2','TNT_default','ATH_eeb5e1aa','VTR_48f416f2','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1942.38}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.76}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 971.19}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 548}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 971.19}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 39.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1456.785}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1427.6493}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_493fa74c','TNT_default','ATH_7188f043','VTR_493fa74c','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1699.5825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.74}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 849.79125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 730}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 849.79125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 57.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1274.686875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 956.01515625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_4995db6b','TNT_default','ATH_4530391f','VTR_4995db6b','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1037.4075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.06}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 518.70375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 811}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 518.70375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 50.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 778.055625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 630.22505625}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_49a0e30f','TNT_default','ATH_e9dc61c0','VTR_49a0e30f','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1810.312875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0235}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 898.8000000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_4a563a7f','TNT_default','ATH_19075f16','VTR_4a563a7f','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1294.92}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.24}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 647.46}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 683}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 647.46}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 39.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 971.19}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 922.6305}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_4a5d6026','TNT_default','ATH_eeb5e1aa','VTR_4a5d6026','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1622.32875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.368}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 506.35}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_4b5db619','TNT_default','ATH_f4016c19','VTR_4b5db619','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1753.660125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9696}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 636.9000000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_4d3e89cf','TNT_default','ATH_e4095e31','VTR_4d3e89cf','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1294.92}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.08}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 647.46}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 545}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 647.46}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 31.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 883.7829}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 971.19}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_4d6dc7b2','TNT_default','ATH_848ea150','VTR_4d6dc7b2','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1706.9399999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.06}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 853.4699999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 799}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 853.4699999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 48.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1280.205}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1164.98655}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_4de96136','TNT_default','ATH_10c7379a','VTR_4de96136','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 964.56825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.164}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 669.12}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_4e82df4f','TNT_default','ATH_15ba0c86','VTR_4e82df4f','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1640.7225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.15}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 839}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1218.2364562500002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1230.541875}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_4f0e24cd','TNT_default','ATH_8ec56b3e','VTR_4f0e24cd','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1751.0849999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.11}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 875.5424999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 634}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 875.5424999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 40.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1313.3137499999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1273.9143375}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_5022ef86','TNT_default','ATH_672853f8','VTR_5022ef86','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1311.0329250000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8354000000000004}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 530.88}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_50c76014','TNT_default','ATH_95f24a3d','VTR_50c76014','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1559.7900000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.18}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 779.8950000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 821}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 779.8950000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 31.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1169.8425000000002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1099.6519500000002}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_50dcc0c5','TNT_default','ATH_6fca54e6','VTR_50dcc0c5','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1083.391875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4924}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 659.6}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_5156666e','TNT_default','ATH_7df0509e','VTR_5156666e','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1174.2569999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6275000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 619.8299999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_5243ffee','TNT_default','ATH_5b77e11e','VTR_5243ffee','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1375.8525000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.74}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 687.9262500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 610}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 687.9262500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 31.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1031.8893750000002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 969.9760125}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_530c134c','TNT_default','ATH_5b77e11e','VTR_530c134c','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1362.0939750000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7052}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 591.6999999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_547fe132','TNT_default','ATH_1a873329','VTR_547fe132','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1019.7495}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1648}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 718.77}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_548c4913','TNT_default','ATH_d7d0f473','VTR_548c4913','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1640.7225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.78}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 636}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 59.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1144.40394375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1230.541875}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_54cf67ff','TNT_default','ATH_9f83cf89','VTR_54cf67ff','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1741.3731}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1312}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 868.6}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_554c1ffe','TNT_default','ATH_10c7379a','VTR_554c1ffe','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1296.53865}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.15}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 552}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_55b69b45','TNT_default','ATH_8dc7b566','VTR_55b69b45','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1927.665}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.72}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 963.8325}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 869}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 963.8325}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 44.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1445.7487500000002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1373.4613125}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_55d89ee6','TNT_default','ATH_95f24a3d','VTR_55d89ee6','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1606.5837}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.239}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 845.63}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_55faafaf','TNT_default','ATH_5b77e11e','VTR_55faafaf','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1389.6110250000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7922}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 567.3}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_567bf71f','TNT_default','ATH_e9dc61c0','VTR_567bf71f','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1775.2176}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2192}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 795.88}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_586dfaaf','TNT_default','ATH_15ba0c86','VTR_586dfaaf','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1607.90805}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1715}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 847.39}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_59788c6c','TNT_default','ATH_e4095e31','VTR_59788c6c','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1745.93475}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8704}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 477.9}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_59afc709','TNT_default','ATH_d73ce862','VTR_59afc709','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1242.8289}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.519}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 522.08}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_59bb6c17','TNT_default','ATH_8ec56b3e','VTR_59bb6c17','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1635.57225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3843}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 753.9}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_5ad1200b','TNT_default','ATH_f4016c19','VTR_5ad1200b','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1273.1418}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.386}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 932.8}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_5ae31ff9','TNT_default','ATH_7df0509e','VTR_5ae31ff9','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1799.1294750000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1330000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 849.75}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_5b4331ea','TNT_default','ATH_1d15384e','VTR_5b4331ea','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1653.450975}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0148}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 788}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_5b783432','TNT_default','ATH_672853f8','VTR_5b783432','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1234.662075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5617}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 597.24}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_5c6b4703','TNT_default','ATH_10c7379a','VTR_5c6b4703','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1035.6417}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.368}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 641.24}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_5d3763c3','TNT_default','ATH_5bba3b0d','VTR_5d3763c3','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1751.0849999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.88}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 875.5424999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 667}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 875.5424999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 49.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1076.917275}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1313.3137499999998}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_5df8bb01','TNT_default','ATH_7ff67290','VTR_5df8bb01','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1615.1184}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.144}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 652.9100000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_5e388d67','TNT_default','ATH_a1639d48','VTR_5e388d67','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1794.0528}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.86}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 772.2}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_5ec21d44','TNT_default','ATH_9f83cf89','VTR_5ec21d44','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.63}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8117}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 702.88}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_5eeda24a','TNT_default','ATH_4ab010e6','VTR_5eeda24a','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1765.8}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.07}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 882.9}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 720}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 882.9}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 45.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1324.35}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1297.8629999999998}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_5f01c551','TNT_default','ATH_6ea16536','VTR_5f01c551','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2132.2035}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9136}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 506}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_60248ca1','TNT_default','ATH_b134c938','VTR_60248ca1','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1182.4974}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.808}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 815.36}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_60435f16','TNT_default','ATH_7df0509e','VTR_60435f16','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1260.7812}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4725}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 702.9000000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_605ade42','TNT_default','ATH_6fca54e6','VTR_605ade42','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1140.4125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.64}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 570.2062500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 680}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 570.2062500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 855.309375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 838.2031875}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_60d3d9e6','TNT_default','ATH_15ba0c86','VTR_60d3d9e6','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1657.129725}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1715}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 880.95}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_60f6a9ba','TNT_default','ATH_672853f8','VTR_60f6a9ba','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1631.5992}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0829}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 777.15}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_615606d2','TNT_default','ATH_8411262d','VTR_615606d2','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1877.2661250000003}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8585}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 690.64}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_623adba8','TNT_default','ATH_e9dc61c0','VTR_623adba8','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1867.48065}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0235}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 898.8000000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_628b3986','TNT_default','ATH_637bf272','VTR_628b3986','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1074.195}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 537.0975}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 634}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 537.0975}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 31.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 805.64625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 781.4768625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_62fdb8fa','TNT_default','ATH_7b202bcb','VTR_62fdb8fa','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1795.37715}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.06}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 557.2800000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_6333d793','TNT_default','ATH_1d15384e','VTR_6333d793','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1686.854025}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.2338}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 843.1600000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_64b1a3c7','TNT_default','ATH_a14fbe0c','VTR_64b1a3c7','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1383.2099999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.54}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 691.6049999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 899}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 691.6049999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 43.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1016.6593499999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1037.4074999999998}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_64ef85b0','TNT_default','ATH_672853f8','VTR_64ef85b0','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1767.5658}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1304999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 753.6}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_654ecd33','TNT_default','ATH_d7d0f473','VTR_654ecd33','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1607.90805}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5846}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 527.3399999999999}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_65ea8b66','TNT_default','ATH_c7053ff9','VTR_65ea8b66','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1292.5656}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5504}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 721.6}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_66427b7c','TNT_default','ATH_a0060822','VTR_66427b7c','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1139.3088749999995}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8012000000000004}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 704.64}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_6954bd40','TNT_default','ATH_737bcf9d','VTR_6954bd40','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1184.5575}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.08}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 592.2787500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 885}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 592.2787500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 57.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 843.9972187500001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 888.4181250000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_69bc35cb','TNT_default','ATH_54db9a34','VTR_69bc35cb','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1589.22}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5876}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 662.29}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_69e463e6','TNT_default','ATH_c16fcee1','VTR_69e463e6','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1684.8675}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2236}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 765.9}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_6a3236bb','TNT_default','ATH_1d15384e','VTR_6a3236bb','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1162.485}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.21}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 581.2425000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 686}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 581.2425000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 43.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 871.8637500000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 819.5519250000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_6a4071de','TNT_default','ATH_e9dc61c0','VTR_6a4071de','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1655.7317999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1938}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 724.96}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_6ba1f7b9','TNT_default','ATH_b168cd8c','VTR_6ba1f7b9','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1861.815375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8236}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 666.41}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_6c238536','TNT_default','ATH_5bba3b0d','VTR_6c238536','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1714.2975}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.31}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 857.1487500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 611}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 857.1487500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 32.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1285.723125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1234.2942}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_6da18f36','TNT_default','ATH_c0577c82','VTR_6da18f36','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 949.191075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1948}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 833}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_6dbaec75','TNT_default','ATH_5b77e11e','VTR_6dbaec75','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1854.09}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.71}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 927.045}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 518}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 927.045}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 48.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1376.661825}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1390.5675}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_6eb169c2','TNT_default','ATH_28b06dd4','VTR_6eb169c2','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1258.1325000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0862000000000003}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 753.3499999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_709a0b4a','TNT_default','ATH_e35f4884','VTR_709a0b4a','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1354.3686}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5603999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 719.6800000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_70b6afa4','TNT_default','ATH_54db9a34','VTR_70b6afa4','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.114975}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9207}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 734.6600000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_710aa656','TNT_default','ATH_8ec56b3e','VTR_710aa656','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1721.655}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.27}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 860.8275}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 718}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 860.8275}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 44.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1291.24125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1252.5040125}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_71db5e48','TNT_default','ATH_6ab8039f','VTR_71db5e48','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1198.9782}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3209}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 739.14}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_722f065b','TNT_default','ATH_b134c938','VTR_722f065b','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.63}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 832}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 904.9725}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 742.0774499999999}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_7664ca86','TNT_default','ATH_812b19d1','VTR_7664ca86','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1325.67435}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8096}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 669.5999999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_766efbe0','TNT_default','ATH_2f6c59b4','VTR_766efbe0','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1265.49}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 632.745}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 702}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 632.745}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 35.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 920.643975}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 949.1175}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_76f0dc6a','TNT_default','ATH_54db9a34','VTR_76f0dc6a','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1575.9765}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.248}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 670.2199999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_77a22ce4','TNT_default','ATH_10c7379a','VTR_77a22ce4','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1015.335}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 507.6675}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 697}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 507.6675}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 700.58115}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 761.5012499999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_77e85d1a','TNT_default','ATH_4530391f','VTR_77e85d1a','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1677.5099999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.22}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 838.7549999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 653}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 838.7549999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 30.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1232.9698499999995}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1258.1324999999997}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_7883f76a','TNT_default','ATH_7ff67290','VTR_7883f76a','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1664.5608000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0192}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 581.03}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_78f6c338','TNT_default','ATH_1a873329','VTR_78f6c338','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1243.4175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6554}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 580.32}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_798e30be','TNT_default','ATH_b168cd8c','VTR_798e30be','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1773.1575}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.88}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 886.57875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 647}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 886.57875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 46.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1210.17999375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1329.868125}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_79afc462','TNT_default','ATH_b2dae3c0','VTR_79afc462','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 956.475}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.92}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 478.2375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 563}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 478.2375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 33}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 566.7114375000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 717.35625}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_7a23feb6','TNT_default','ATH_28b06dd4','VTR_7a23feb6','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1780.515}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.23}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 890.2574999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 823}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 890.2574999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 51.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1268.6169375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1335.38625}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_7ca23601','TNT_default','ATH_54db9a34','VTR_7ca23601','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1545.075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 772.5375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 713}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 772.5375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 33.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1158.80625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1100.8659375}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_7d8eeea9','TNT_default','ATH_5bba3b0d','VTR_7d8eeea9','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1645.7256}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3362}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 562.12}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_7e4a4c89','TNT_default','ATH_8ec56b3e','VTR_7e4a4c89','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1721.655}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.27}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 725.18}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_7ef8556d','TNT_default','ATH_1a873329','VTR_7ef8556d','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1218.54915}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6732}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 541.26}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_7f1ac98a','TNT_default','ATH_a14fbe0c','VTR_7f1ac98a','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1314.0495}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4014}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 863.04}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_7fd3b9e3','TNT_default','ATH_4ab010e6','VTR_7fd3b9e3','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 990.6138}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0924999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 515.0699999999999}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_82213cac','TNT_default','ATH_54db9a34','VTR_82213cac','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1721.655}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.62}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 655.86}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_824f7d61','TNT_default','ATH_7fbe27d7','VTR_824f7d61','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1274.686875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.134}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 527.16}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_8272b2e9','TNT_default','ATH_8411262d','VTR_8272b2e9','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1787.8725000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.77}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 893.9362500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 712}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 893.9362500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 33}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1287.2682}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1340.904375}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_82d4c4d0','TNT_default','ATH_4ab010e6','VTR_82d4c4d0','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1677.51}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0807}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 698.4}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_836477c2','TNT_default','ATH_4ab010e6','VTR_836477c2','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1155.1275}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.52}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 577.56375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 729}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 577.56375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 52.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 857.6821687500001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 866.345625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_83a05bd7','TNT_default','ATH_e35f4884','VTR_83a05bd7','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1263.209175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7762}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 692}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_8481bffc','TNT_default','ATH_54db9a34','VTR_8481bffc','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1514.1735}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.38}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 755.7800000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_84ca5b84','TNT_default','ATH_7ff67290','VTR_84ca5b84','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2035.3788}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9664999999999997}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 591.87}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_85817440','TNT_default','ATH_e5a4103c','VTR_85817440','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1648.0800000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.827}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 751.6800000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_8606cc02','TNT_default','ATH_28b06dd4','VTR_8606cc02','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1744.9046999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4022}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 773.62}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_8683605e','TNT_default','ATH_6ea16536','VTR_8683605e','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2132.2035}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.3504}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 490.82}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_86dc8df5','TNT_default','ATH_5b77e11e','VTR_86dc8df5','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1761.3855}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8468}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 528.36}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_87131119','TNT_default','ATH_2f6c59b4','VTR_87131119','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 985.905}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.16}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 492.9525}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 681}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 492.9525}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 50.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 739.42875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 695.063025}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_87e63d10','TNT_default','ATH_637bf272','VTR_87e63d10','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1074.195}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.116}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 595.9599999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_87eb66ca','TNT_default','ATH_4ab010e6','VTR_87eb66ca','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1854.09}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0807}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 792.0000000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_88126f7e','TNT_default','ATH_7df0509e','VTR_88126f7e','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1186.6175999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6895000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 683.73}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_8877aa35','TNT_default','ATH_8dc7b566','VTR_8877aa35','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1959.375825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.536}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 899.87}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_8890558f','TNT_default','ATH_6ab8039f','VTR_8890558f','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1236.06}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.19}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 618.03}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 762}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 618.03}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 56.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 927.045}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 899.2336499999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_88c74358','TNT_default','ATH_a389559c','VTR_88c74358','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1920.3075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.74}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 960.15375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 581}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 960.15375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 44.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1440.230625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1425.82831875}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_89d17a36','TNT_default','ATH_eeb5e1aa','VTR_89d17a36','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1545.075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.08}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 543.66}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_8b2dfc84','TNT_default','ATH_e4095e31','VTR_8b2dfc84','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1269.0216}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.026}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 528.65}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_8b9c3f8a','TNT_default','ATH_95f24a3d','VTR_8b9c3f8a','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1566.0438749999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2064}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 899.19}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_8d9d5ecd','TNT_default','ATH_10c7379a','VTR_8d9d5ecd','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1322.73135}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4250000000000005}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 518.88}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_8db8da9a','TNT_default','ATH_6ea16536','VTR_8db8da9a','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1641.45825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2535}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 772.74}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_8dbc821f','TNT_default','ATH_d73ce862','VTR_8dbc821f','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1106.200125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9409}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 805.5}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_8e2d9e09','TNT_default','ATH_6fca54e6','VTR_8e2d9e09','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1218.6962999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4841}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 853.58}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_8f398d97','TNT_default','ATH_e9dc61c0','VTR_8f398d97','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1672.8012}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2192}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 709.2}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_8fae3773','TNT_default','ATH_c7053ff9','VTR_8fae3773','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1689.8705999999995}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0101000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 834.1999999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_90aa6ceb','TNT_default','ATH_e35f4884','VTR_90aa6ceb','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1302.2775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.66}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 651.13875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 692}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 651.13875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 43}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 791.1335812499999}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 976.708125}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_90b7ec67','TNT_default','ATH_737bcf9d','VTR_90b7ec67','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1160.86635}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0908}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 867.3}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_9284e9c5','TNT_default','ATH_c0577c82','VTR_9284e9c5','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 971.19}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.19}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 485.595}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 810}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 485.595}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 49.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 728.3925}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 691.972875}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_930a31a6','TNT_default','ATH_a14fbe0c','VTR_930a31a6','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1438.5384}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5862}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 916.98}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_93e21282','TNT_default','ATH_7ff67290','VTR_93e21282','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2035.3788}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1735}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 597.3000000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_949ce77e','TNT_default','ATH_737bcf9d','VTR_949ce77e','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1209.13155}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5229}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 554.4}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_94d9e7a2','TNT_default','ATH_19075f16','VTR_94d9e7a2','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1189.7813250000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1849999999999996}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 676.1999999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_965777d4','TNT_default','ATH_7fbe27d7','VTR_965777d4','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1591.500825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.3826}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 602.64}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_967a946f','TNT_default','ATH_e5a4103c','VTR_967a946f','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1615.1184}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6008}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 730.8000000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_96e47b95','TNT_default','ATH_a389559c','VTR_96e47b95','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1155.1275}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.13}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 577.56375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 721}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 577.56375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 49.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 866.345625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 701.7399562500001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_9892003b','TNT_default','ATH_7fbe27d7','VTR_9892003b','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1287.5625}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.08}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 643.78125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 573}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 643.78125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 40}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 965.671875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 917.38828125}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_992f86c0','TNT_default','ATH_7188f043','VTR_992f86c0','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1648.595025}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.566}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 730}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_994439ea','TNT_default','ATH_b134c938','VTR_994439ea','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1254.8952}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4720000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 748.8000000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_9973fb27','TNT_default','ATH_e5a4103c','VTR_9973fb27','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1265.49}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.95}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 632.745}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 510}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 632.745}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 48.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 778.2763500000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 949.1175}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_997a54ad','TNT_default','ATH_9f83cf89','VTR_997a54ad','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1170.4310999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8666}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 733.4399999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_9a3dcafb','TNT_default','ATH_b168cd8c','VTR_9a3dcafb','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1651.023}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0404}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 565.47}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_9b6b171e','TNT_default','ATH_a14fbe0c','VTR_9b6b171e','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.63}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.64}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 615}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 32}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 841.6244249999999}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 904.9725}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_9d2321f5','TNT_default','ATH_1d15384e','VTR_9d2321f5','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1162.485}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2342}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 734.0200000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_9d5da39e','TNT_default','ATH_7b202bcb','VTR_9d5da39e','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1832.0175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 916.00875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 516}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 916.00875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 52.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1374.0131250000002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1264.0920750000002}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_9db10f80','TNT_default','ATH_a1639d48','VTR_9db10f80','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1153.656}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9191}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 550.16}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_9dc42e0a','TNT_default','ATH_da3d068c','VTR_9dc42e0a','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1730.4840000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.683}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 617.89}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_9e878089','TNT_default','ATH_7fbe27d7','VTR_9e878089','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1624.3152750000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1945}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 580.32}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_9f550361','TNT_default','ATH_848ea150','VTR_9f550361','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1719.0062999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1909}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 940.8}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_9f7753d3','TNT_default','ATH_b134c938','VTR_9f7753d3','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1511.5248}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3144}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 574.08}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_9fb5ebc6','TNT_default','ATH_b2dae3c0','VTR_9fb5ebc6','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1368.495}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.81}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 684.2475000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 544}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 684.2475000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 47.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 892.9429875000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1026.37125}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_a0ae74ed','TNT_default','ATH_c7053ff9','VTR_a0ae74ed','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1306.029825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5656}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 596.96}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_a0be1aae','TNT_default','ATH_7ff67290','VTR_a0be1aae','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1957.095}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.07}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 978.5475}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 543}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 978.5475}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 34.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1467.82125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1423.7866124999998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_a23c0f4d','TNT_default','ATH_8411262d','VTR_a23c0f4d','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1380.8556}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7108}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 521}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_a3629545','TNT_default','ATH_8ec56b3e','VTR_a3629545','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1803.61755}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2765}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 614.98}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_a427b7ee','TNT_default','ATH_8dc7b566','VTR_a427b7ee','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1946.94165}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9436}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 921.14}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_a4583ab1','TNT_default','ATH_6fca54e6','VTR_a4583ab1','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1117.60425}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5088}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 700.4}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_a5559561','TNT_default','ATH_e9dc61c0','VTR_a5559561','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2000.872125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0235}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 881.6800000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_a7442187','TNT_default','ATH_4ab010e6','VTR_a7442187','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1677.51}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1235000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 684}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_a7b1b44e','TNT_default','ATH_5f38e64f','VTR_a7b1b44e','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1361.1375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 680.56875}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 601}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 680.56875}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 41.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1020.853125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 898.3507500000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_a7bf6f27','TNT_default','ATH_2f6c59b4','VTR_a7bf6f27','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1005.6231}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.16}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 694.62}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_a8834d5e','TNT_default','ATH_7df0509e','VTR_a8834d5e','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1853.6485500000003}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1770000000000005}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 825}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_aa7f8682','TNT_default','ATH_15ba0c86','VTR_aa7f8682','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1657.129725}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.3435}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 755.1}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_aa92ee1c','TNT_default','ATH_9f83cf89','VTR_aa92ee1c','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1254.8952}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9215}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 718.16}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_ab610de3','TNT_default','ATH_5f38e64f','VTR_ab610de3','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1306.692}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.938}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 637.0600000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_ac15fac2','TNT_default','ATH_a14fbe0c','VTR_ac15fac2','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1266.9615}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6564}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 615}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ac344b30','TNT_default','ATH_9f83cf89','VTR_ac344b30','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1795.23}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.92}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 897.615}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 860}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 897.615}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 31.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1346.4225}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1144.459125}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_acd74500','TNT_default','ATH_da3d068c','VTR_acd74500','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1629.5390999999995}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2546}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 796.64}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ace9e2be','TNT_default','ATH_c0577c82','VTR_ace9e2be','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 998.11845}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2644}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 824.67}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_ae8d36f2','TNT_default','ATH_5f38e64f','VTR_ae8d36f2','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1935.0225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.9855}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 628.9300000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_ae906158','TNT_default','ATH_a0060822','VTR_ae906158','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1636.8966}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4136000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 812.63}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_aea0adfe','TNT_default','ATH_5b77e11e','VTR_aea0adfe','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1854.09}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6074}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 512.82}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_af818159','TNT_default','ATH_f4016c19','VTR_af818159','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1670.1525}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1211000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 579}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_afaad0ea','TNT_default','ATH_7fbe27d7','VTR_afaad0ea','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1248.935625}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9828}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 613.11}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_afb176d5','TNT_default','ATH_a14fbe0c','VTR_afb176d5','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1146.2985}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8368}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 602.7}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_afc5e962','TNT_default','ATH_b2dae3c0','VTR_afc5e962','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 918.216}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0028}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 557.37}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_b09a9d37','TNT_default','ATH_54db9a34','VTR_b09a9d37','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1341.345825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0608000000000004}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 547.1999999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_b0bb414f','TNT_default','ATH_5bba3b0d','VTR_b0bb414f','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1645.7256}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4541000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 586.56}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b0fba85e','TNT_default','ATH_672853f8','VTR_b0fba85e','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1699.5825}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.19}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 849.79125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 785}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 849.79125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 42.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1210.9525312499998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1274.686875}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b1ced46c','TNT_default','ATH_b2dae3c0','VTR_b1ced46c','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 956.475}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0120000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 546.11}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_b256e9f4','TNT_default','ATH_da3d068c','VTR_b256e9f4','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1696.0509}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.23}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 773.66}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_b2903914','TNT_default','ATH_7b202bcb','VTR_b2903914','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1027.474875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3888}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 517.9399999999999}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b2a21645','TNT_default','ATH_7df0509e','VTR_b2a21645','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1853.6485500000003}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1110000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 792}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b3121e37','TNT_default','ATH_1a873329','VTR_b3121e37','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1305.588375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0469999999999997}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 558}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_b35c3bb4','TNT_default','ATH_e9dc61c0','VTR_b35c3bb4','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1706.9399999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.27}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 853.4699999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 788}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 853.4699999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 47.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1164.98655}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1280.205}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_b3611536','TNT_default','ATH_672853f8','VTR_b3611536','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1631.5992}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2376}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 855.6500000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b38dcd33','TNT_default','ATH_6ea16536','VTR_b38dcd33','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2030.67}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.08}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 1015.335}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 506}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 1015.335}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 39.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1492.54245}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1523.0024999999998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b50022de','TNT_default','ATH_d73ce862','VTR_b50022de','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1170.4310999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6740000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 461.84}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_b5b003de','TNT_default','ATH_7ff67290','VTR_b5b003de','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1878.8112}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.2356}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 532.14}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b634c1d7','TNT_default','ATH_7fbe27d7','VTR_b634c1d7','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1274.686875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0368}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 618.84}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b65da0f8','TNT_default','ATH_6fca54e6','VTR_b65da0f8','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1194.5637}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5453}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 940.68}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_b6d50244','TNT_default','ATH_7ff67290','VTR_b6d50244','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1648.0800000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.04}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 824.0400000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 599}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 824.0400000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 48.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1236.0600000000002}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1149.5358}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_b7053ece','TNT_default','ATH_da3d068c','VTR_b7053ece','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1615.1184}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7017000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 746.9000000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_b7928ac0','TNT_default','ATH_4530391f','VTR_b7928ac0','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1627.1846999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.22}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 711.7700000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_b7ae73bf','TNT_default','ATH_a14fbe0c','VTR_b7ae73bf','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1146.2985}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7548}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 578.1}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_b8167024','TNT_default','ATH_8dc7b566','VTR_b8167024','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1979.1675}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8240000000000005}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 773.72}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_b8352024','TNT_default','ATH_a389559c','VTR_b8352024','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1108.9224}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1413}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 692.16}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_b9e72dc8','TNT_default','ATH_15ba0c86','VTR_b9e72dc8','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1758.4425}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.81}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 879.22125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 708}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 879.22125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 30.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1318.831875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1305.64355625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_ba31ad88','TNT_default','ATH_54db9a34','VTR_ba31ad88','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1545.075}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.152}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 655.96}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_badfdca7','TNT_default','ATH_54db9a34','VTR_badfdca7','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1181.246625}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9858}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 653.78}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_bb8cb2f6','TNT_default','ATH_f4016c19','VTR_bb8cb2f6','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1670.1525}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.01}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 835.07625}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 579}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 835.07625}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 58.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1240.0882312499998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1252.614375}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_bb916ced','TNT_default','ATH_b134c938','VTR_bb916ced','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1146.2985}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4400000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 840.32}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_bbcc5fd4','TNT_default','ATH_eeb5e1aa','VTR_bbcc5fd4','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1864.6848}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.024}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 504.16}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_bbea502b','TNT_default','ATH_10c7379a','VTR_bbea502b','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1309.635}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.25}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 654.8175}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 552}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 654.8175}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 45.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 913.4704124999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 982.22625}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_bc005abb','TNT_default','ATH_da3d068c','VTR_bc005abb','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1565.6760000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1131}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 706.16}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_bc2afa16','TNT_default','ATH_4ab010e6','VTR_bc2afa16','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2030.67}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.97}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 1015.335}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 841}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 1015.335}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 51.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1523.0024999999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1385.932275}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_bda64d68','TNT_default','ATH_812b19d1','VTR_bda64d68','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1743.7275000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.39}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 871.8637500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 707}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 871.8637500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 55}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1111.62628125}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1307.7956250000002}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_bdd6e0ab','TNT_default','ATH_10c7379a','VTR_bdd6e0ab','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1348.92405}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3625}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 535.4399999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_be67ceee','TNT_default','ATH_7fbe27d7','VTR_be67ceee','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1575.0936}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.2363}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 513.36}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_bf248370','TNT_default','ATH_6fca54e6','VTR_bf248370','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1218.6962999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5912000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 914.55}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_c0636f67','TNT_default','ATH_a389559c','VTR_c0636f67','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1143.576225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0735}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 713.79}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_c13f5f6f','TNT_default','ATH_2f6c59b4','VTR_c13f5f6f','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1252.8351}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.725}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 723.0600000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_c1d7d101','TNT_default','ATH_e21e52aa','VTR_c1d7d101','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1768.59585}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2825}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 784.6999999999999}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_c35ea789','TNT_default','ATH_d7d0f473','VTR_c35ea789','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1706.3514000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8868}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 623.28}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_c46669d9','TNT_default','ATH_737bcf9d','VTR_c46669d9','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1208.2486500000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0692000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 805.35}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_c4c623cd','TNT_default','ATH_848ea150','VTR_c4c623cd','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1736.37}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.01}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 868.185}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 896}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 868.185}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 47.2}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1302.2775}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1250.1863999999998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_c50778a9','TNT_default','ATH_d7d0f473','VTR_c50778a9','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1706.3514000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6732}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 572.4}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_c733652e','TNT_default','ATH_19075f16','VTR_c733652e','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1189.7813250000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.805}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 724.5}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_c7f7a366','TNT_default','ATH_a1639d48','VTR_c7f7a366','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1188.972}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9737}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 603.98}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_c80d5296','TNT_default','ATH_e35f4884','VTR_c80d5296','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1263.209175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5437999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 664.3199999999999}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_c873610b','TNT_default','ATH_e35f4884','VTR_c873610b','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1788.1668}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.31}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 668.85}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_c98f2c98','TNT_default','ATH_4ab010e6','VTR_c98f2c98','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1166.678775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.596}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 692.55}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_caefd3a8','TNT_default','ATH_812b19d1','VTR_caefd3a8','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1312.2837}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5834}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 748.8000000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_cb8791d4','TNT_default','ATH_8c0b5d87','VTR_cb8791d4','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1624.5359999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2296}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 825.55}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_cc55e656','TNT_default','ATH_7188f043','VTR_cc55e656','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1716.578325}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8618}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 781.1}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_cc90acb7','TNT_default','ATH_e5a4103c','VTR_cc90acb7','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1240.1802}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.969}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 504.9}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_cd0a77e8','TNT_default','ATH_c7053ff9','VTR_cd0a77e8','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1332.9582750000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7479999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 688.8000000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_cded2f53','TNT_default','ATH_eeb5e1aa','VTR_cded2f53','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1606.8780000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.14}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 533}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_ce494014','TNT_default','ATH_b134c938','VTR_ce494014','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1574.505}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.24}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 787.2525}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 624}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 787.2525}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 53.3}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1157.261175}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1180.87875}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ce7e5957','TNT_default','ATH_e21e52aa','VTR_ce7e5957','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1787.8725000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.37}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 893.9362500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 863}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 893.9362500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 51.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1340.904375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1260.4501125}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_cf454878','TNT_default','ATH_c0577c82','VTR_cf454878','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1019.7495}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2495}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 818.1}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_d0e132c4','TNT_default','ATH_8ec56b3e','VTR_d0e132c4','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1751.0849999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2099000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 608.64}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_d1b74720','TNT_default','ATH_5b77e11e','VTR_d1b74720','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1430.8866000000005}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6878}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 622.2}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_d1bc2bea','TNT_default','ATH_b134c938','VTR_d1bc2bea','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1574.505}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2524}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 599.04}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_d2850a3b','TNT_default','ATH_2f6c59b4','VTR_d2850a3b','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1202.2155}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.665}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 716.04}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_d36c5bfe','TNT_default','ATH_1a873329','VTR_d36c5bfe','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 980.9019}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1088}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 666.9}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_d3ba0f94','TNT_default','ATH_6ea16536','VTR_d3ba0f94','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2091.5901}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.2048}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 531.3000000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_d45f196e','TNT_default','ATH_28b06dd4','VTR_d45f196e','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1324.35}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.83}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 662.1750000000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 793}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 662.1750000000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 37.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 933.66675}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 993.2625}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_d5dd7666','TNT_default','ATH_6ab8039f','VTR_d5dd7666','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1284.6195}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2882}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 701.9200000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_d62f9295','TNT_default','ATH_e21e52aa','VTR_d62f9295','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1734.236325}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3837000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 914.78}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_d659349d','TNT_default','ATH_8ec56b3e','VTR_d659349d','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1721.655}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1811}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 660.5600000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_d6d5c513','TNT_default','ATH_2f6c59b4','VTR_d6d5c513','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 966.1869}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3224}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 681}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_dbb6142c','TNT_default','ATH_54db9a34','VTR_dbb6142c','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1263.209175}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.0791999999999997}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 581.4}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_dbdb58fb','TNT_default','ATH_10c7379a','VTR_dbdb58fb','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 995.0283}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.092}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 724.88}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_dc091711','TNT_default','ATH_812b19d1','VTR_dc091711','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1743.7275000000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4595}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 671.65}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_dc6171b1','TNT_default','ATH_7fbe27d7','VTR_dc6171b1','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1640.7225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.09}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 558}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 820.36125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 46.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1205.9310375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1230.541875}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_dc85fa20','TNT_default','ATH_737bcf9d','VTR_dc85fa20','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1208.2486500000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.08}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 973.5}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_dddbd517','TNT_default','ATH_8411262d','VTR_dddbd517','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1353.78}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.82}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 676.89}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 521}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 676.89}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 37.7}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1015.335}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 944.26155}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_deec8179','TNT_default','ATH_1d15384e','VTR_deec8179','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1686.854025}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1462}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 764.36}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_deee0492','TNT_default','ATH_e5a4103c','VTR_deee0492','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1278.1449}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0735}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 540.6}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_df0b0df7','TNT_default','ATH_c0577c82','VTR_df0b0df7','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 988.332975}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2412}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 874.6500000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_df0bd0f2','TNT_default','ATH_a0060822','VTR_df0bd0f2','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1223.25795}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4536000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 734}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_df5b8ad8','TNT_default','ATH_7b202bcb','VTR_df5b8ad8','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 978.5475}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.24}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 489.27375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 551}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 489.27375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 50.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 733.910625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 689.8759875}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_dfff7420','TNT_default','ATH_b2dae3c0','VTR_dfff7420','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 937.3455}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.966}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 591.15}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_dffff477','TNT_default','ATH_8c0b5d87','VTR_dffff477','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2039.499}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1216}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 499.7}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e0e93852','TNT_default','ATH_f4016c19','VTR_e0e93852','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1670.1525}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9696}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 521.1}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_e122cd28','TNT_default','ATH_4ab010e6','VTR_e122cd28','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2071.2834}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8912}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 790.54}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e206ac10','TNT_default','ATH_28b06dd4','VTR_e206ac10','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1816.1253}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2669}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 831.23}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e23277ad','TNT_default','ATH_737bcf9d','VTR_e23277ad','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1221.345}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.57}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 610.6725}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 616}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 610.6725}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 43.5}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 916.00875}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 879.3684}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_e4b060dd','TNT_default','ATH_5f38e64f','VTR_e4b060dd','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1388.3602500000002}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.767}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 558.93}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_e51e5e47','TNT_default','ATH_d73ce862','VTR_e51e5e47','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1206.63}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.55}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 502}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 603.3149999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 41.6}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 778.2763499999999}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 904.9725}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e59193b7','TNT_default','ATH_c7053ff9','VTR_e59193b7','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1792.2869999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2654000000000003}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 920.2}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e63bc447','TNT_default','ATH_a1639d48','VTR_e63bc447','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1153.656}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.9555}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 574.0799999999999}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_e70c3453','TNT_default','ATH_5f38e64f','VTR_e70c3453','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1935.0225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.09}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 967.51125}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 577}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 967.51125}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 56.4}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1451.2668749999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1320.6528562499998}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_e7385e68','TNT_default','ATH_7b202bcb','VTR_e7385e68','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 958.97655}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1904}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 501.41}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_e75883c1','TNT_default','ATH_a1639d48','VTR_e75883c1','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1812.74085}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.96}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 657.8000000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_e7c1c5a9','TNT_default','ATH_eeb5e1aa','VTR_e7c1c5a9','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1961.8038}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7424}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 520.6}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_e80e558c','TNT_default','ATH_8411262d','VTR_e80e558c','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1313.1666}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7836}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 489.7399999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e80ef960','TNT_default','ATH_e35f4884','VTR_e80ef960','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1879.3998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2838}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 592.41}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_e83af21a','TNT_default','ATH_c0577c82','VTR_e83af21a','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1010.0376}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0829}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 785.6999999999999}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_e8de2f6b','TNT_default','ATH_19075f16','VTR_e8de2f6b','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1256.0724}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4011999999999998}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 710.32}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_e99e224c','TNT_default','ATH_e9dc61c0','VTR_e99e224c','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1905.5925}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.13}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 952.79625}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 856}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 952.79625}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 36.9}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1429.194375}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1314.858825}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_e9af02cd','TNT_default','ATH_d73ce862','VTR_e9af02cd','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1140.4125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.97}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 570.2062500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 895}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 570.2062500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 47}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 786.884625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 855.309375}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ea7fe406','TNT_default','ATH_a389559c','VTR_ea7fe406','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1166.678775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.243}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 706.58}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_eb0eaeeb','TNT_default','ATH_1a873329','VTR_eb0eaeeb','2026-03-05 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 971.19}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.12}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 485.595}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 741}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 485.595}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 39.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 670.1211000000001}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 728.3925}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_ec49fc7c','TNT_default','ATH_da3d068c','VTR_ec49fc7c','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1612.91115}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2177}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 727.6999999999999}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ed2c5b21','TNT_default','ATH_15ba0c86','VTR_ed2c5b21','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1811.195775}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7014}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 764.6400000000001}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_ede5d2b6','TNT_default','ATH_c7053ff9','VTR_ede5d2b6','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1346.4225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.52}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 673.2112500000001}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 656}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 673.2112500000001}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 53.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 969.4242}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1009.816875}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ee17c13b','TNT_default','ATH_a389559c','VTR_ee17c13b','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1881.90135}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.653}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 633.2900000000001}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_ee5831ab','TNT_default','ATH_c7053ff9','VTR_ee5831ab','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1689.8705999999995}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2654000000000003}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 782.6}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_efab0485','TNT_default','ATH_e21e52aa','VTR_efab0485','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1663.5307499999997}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4445}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 768.18}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_efee22de','TNT_default','ATH_5f38e64f','VTR_efee22de','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1973.72295}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 2.1527}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 548.15}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_f092a59c','TNT_default','ATH_c16fcee1','VTR_f092a59c','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1617.4728}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3034}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 851}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_f1650beb','TNT_default','ATH_e4095e31','VTR_f1650beb','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1646.1670499999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.6533}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 541.62}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_f24717ca','TNT_default','ATH_c0577c82','VTR_f24717ca','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 978.5475}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.16}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 489.27375}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 833}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 489.27375}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 30.1}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 733.910625}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 711.8933062499999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_f2e8de30','TNT_default','ATH_1d15384e','VTR_f2e8de30','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1162.485}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1495}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 747.74}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_f4131af5','TNT_default','ATH_6ab8039f','VTR_f4131af5','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1390.5675}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.243}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 669.12}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_f4d55dbb','TNT_default','ATH_e21e52aa','VTR_f4d55dbb','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1841.5086750000005}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3152}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 914.78}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_f56c8f5c','TNT_default','ATH_d7d0f473','VTR_f56c8f5c','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1640.7225}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7622}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 636}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_f68f0a7f','TNT_default','ATH_da3d068c','VTR_f68f0a7f','2026-03-05 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1662.7949999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.23}, \"PeakForceLeft\": {\"Unit\": \"N\", \"Value\": 831.3974999999999}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 766}, \"PeakForceRight\": {\"Unit\": \"N\", \"Value\": 831.3974999999999}, \"JumpHeightTotal\": {\"Unit\": \"cm\", \"Value\": 49.8}, \"LandingForceLeft\": {\"Unit\": \"N\", \"Value\": 1247.0962499999998}, \"LandingForceRight\": {\"Unit\": \"N\", \"Value\": 1234.6252874999998}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_f72a0531','TNT_default','ATH_c16fcee1','VTR_f72a0531','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1032.9194249999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1772000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 513.6}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_f797e609','TNT_default','ATH_812b19d1','VTR_f797e609','2026-02-12 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1830.913875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.5429}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 714.07}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_f7dd8632','TNT_default','ATH_6ab8039f','VTR_f7dd8632','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1260.7812}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3566}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 685.8000000000001}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_f8028972','TNT_default','ATH_28b06dd4','VTR_f8028972','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1324.35}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.7934}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 808.86}}','2026-03-05 23:10:32','2026-03-05 23:10:32'),('VTR_f82f0ef1','TNT_default','ATH_a14fbe0c','VTR_f82f0ef1','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1383.2099999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.4784}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 854.05}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_f83226e5','TNT_default','ATH_95f24a3d','VTR_f83226e5','2026-02-26 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1502.769375}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.2876}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 838.0799999999999}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_f9148dff','TNT_default','ATH_4530391f','VTR_f9148dff','2026-02-19 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1089.277875}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1554000000000002}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 859.6600000000001}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_fa8763d8','TNT_default','ATH_4ab010e6','VTR_fa8763d8','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1040.6448000000005}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.1845}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 515.0699999999999}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_fb84bcfc','TNT_default','ATH_5bba3b0d','VTR_fb84bcfc','2026-02-26 23:10:32','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1681.0415999999998}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8612}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 707.02}}','2026-03-05 23:10:32','2026-03-13 11:27:44'),('VTR_fce1ab3c','TNT_default','ATH_c16fcee1','VTR_fce1ab3c','2026-02-19 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1752.2622}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3699}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 851}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_fdf18775','TNT_default','ATH_1d15384e','VTR_fdf18775','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1162.485}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.3189}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 631.12}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_fe2722e2','TNT_default','ATH_7b202bcb','VTR_fe2722e2','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1850.337675}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 0.98}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 516}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTR_fe482a82','TNT_default','ATH_d73ce862','VTR_fe482a82','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 1106.200125}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.0185}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 805.5}}','2026-03-05 23:10:33','2026-03-05 23:10:33'),('VTR_fefa4eaf','TNT_default','ATH_4ab010e6','VTR_fefa4eaf','2026-02-12 23:10:33','CMJ','{\"PeakForce\": {\"Unit\": \"N\", \"Value\": 2030.67}, \"RSIModified\": {\"Unit\": \"\", \"Value\": 1.8912}, \"TimeToTakeoff\": {\"Unit\": \"ms\", \"Value\": 916.69}}','2026-03-05 23:10:33','2026-03-13 11:27:44'),('VTST_9a383772','TNT_default','ATH_eeb5e1aa','3f24c435-dd0d-4bff-be5b-2e5bf68eaa63','2026-03-12 17:52:17','CMJ','{\"weight\": 62.59, \"testType\": \"CMJ\", \"JumpHeight\": {\"Value\": 32.9}, \"RSIModified\": {\"Value\": 0.46}, \"TimeToTakeoff\": {\"Value\": 721}, \"JumpHeightImpMom\": {\"Value\": 32.7}, \"LandingForceLeft\": {\"Value\": 1064.3}, \"PeakLandingForce\": {\"Value\": 2576.35}, \"LandingForceRight\": {\"Value\": 1649.4}}','2026-03-12 21:22:54','2026-03-13 11:27:44');
/*!40000 ALTER TABLE `vald_test_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_anomalies`
--

DROP TABLE IF EXISTS `vehicle_anomalies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_anomalies` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `reporter_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('low','medium','high','critical') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('open','in_progress','resolved') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `resolution_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `resolved_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vehicle_anomalies_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_vehicle_anomalies_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_anomalies`
--

LOCK TABLES `vehicle_anomalies` WRITE;
/*!40000 ALTER TABLE `vehicle_anomalies` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_anomalies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_maintenance`
--

DROP TABLE IF EXISTS `vehicle_maintenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_maintenance` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `maintenance_date` date NOT NULL,
  `type` enum('tagliando','gomme_estive','gomme_invernali','riparazione','revisione','altro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cost` decimal(10,2) DEFAULT '0.00',
  `mileage` int DEFAULT NULL,
  `next_maintenance_date` date DEFAULT NULL,
  `next_maintenance_mileage` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_vehicle_maintenance_vehicle` (`vehicle_id`),
  CONSTRAINT `fk_vehicle_maintenance_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_maintenance`
--

LOCK TABLES `vehicle_maintenance` WRITE;
/*!40000 ALTER TABLE `vehicle_maintenance` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_plate` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int DEFAULT '9',
  `status` enum('active','maintenance','out_of_service') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `insurance_expiry` date DEFAULT NULL,
  `road_tax_expiry` date DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_plate` (`license_plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES ('VEH_389093a7','RENAULT FUSIO','GP398DS',9,'active','2026-03-23','2026-03-06',NULL,'2026-03-06 00:53:34','2026-03-06 00:53:34');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_categories`
--

DROP TABLE IF EXISTS `website_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color_hex` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '#000000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_categories`
--

LOCK TABLES `website_categories` WRITE;
/*!40000 ALTER TABLE `website_categories` DISABLE KEYS */;
INSERT INTO `website_categories` VALUES (1,'Prima Squadra','prima-squadra','#0047AB','2026-03-08 21:59:55','2026-03-08 21:59:55'),(2,'Settore Giovanile','giovanili','#FF8C00','2026-03-08 21:59:55','2026-03-08 21:59:55'),(3,'Eventi','eventi','#228B22','2026-03-08 21:59:55','2026-03-08 21:59:55'),(4,'Società','societa','#696969','2026-03-08 21:59:55','2026-03-08 21:59:55');
/*!40000 ALTER TABLE `website_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_hero_slides`
--

DROP TABLE IF EXISTS `website_hero_slides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_hero_slides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` enum('image','video') COLLATE utf8mb4_unicode_ci DEFAULT 'image',
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `button_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_hero_slides`
--

LOCK TABLES `website_hero_slides` WRITE;
/*!40000 ALTER TABLE `website_hero_slides` DISABLE KEYS */;
/*!40000 ALTER TABLE `website_hero_slides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_news`
--

DROP TABLE IF EXISTS `website_news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `author_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `excerpt` text COLLATE utf8mb4_unicode_ci,
  `content_html` longtext COLLATE utf8mb4_unicode_ci,
  `is_published` tinyint(1) DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_website_news_category` (`category_id`),
  CONSTRAINT `fk_website_news_category` FOREIGN KEY (`category_id`) REFERENCES `website_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_news`
--

LOCK TABLES `website_news` WRITE;
/*!40000 ALTER TABLE `website_news` DISABLE KEYS */;
INSERT INTO `website_news` VALUES (1,NULL,NULL,1,'Vittoria clamorosa!','vittoria-clamorosa',NULL,'Un 3-0 che fa sognare','<p>Testo articolo</p>',1,'2026-03-08 22:59:55','2026-03-08 21:59:55','2026-03-08 21:59:55'),(2,NULL,1,4,'Fusion Team Volley vince il progetto europeo Erasmus+!','fusion-team-volley-vince-il-progetto-europeo-erasmus','/uploads/website/news_import_8bdb341872bfab8b5e478c5d5d636e31.jpg','Fusion Team Volley ha raggiunto un traguardo eccezionale, ottenendo il finanziamento per il progetto KA182 – \"Identità del gruppo, tecniche motivazionali e senso di appartenenza: nuovi strumenti per vincere\" nell\'ambito del prestigioso programma Erasmus+.','<p>Fusion Team Volley ha raggiunto un <strong>traguardo eccezionale</strong>, ottenendo il finanziamento per il progetto <strong>KA182 – \"Identità del gruppo, tecniche motivazionali e senso di appartenenza: nuovi strumenti per vincere\"</strong> nell\'ambito del prestigioso programma <strong>Erasmus+</strong>.</p>\n<p>Questo riconoscimento, attribuito dalla Commissione Europea e dalla sua Agenzia Nazionale Giovani, segna un momento di grande orgoglio per la nostra associazione e conferma l\'eccellenza del nostro lavoro educativo e sportivo.</p>\n<p>Il progetto coinvolgerà atlete, allenatori e staff in un percorso di crescita identitaria e motivazionale che si estenderà a tutto il settore giovanile. Un\'opportunità unica per imparare dalle migliori realtà sportive europee e portare innovazione nel nostro metodo di lavoro.</p>\n<p>Un grazie speciale a tutti coloro che hanno contribuito alla stesura del progetto e alla candidatura. Questo risultato appartiene all\'intera famiglia Fusion!</p>',1,'2025-08-08 08:00:00','2026-03-10 19:22:14','2026-03-10 19:22:14'),(3,NULL,1,1,'Nuove regole volley 2025-2028: cosa cambia','nuove-regole-volley-2025-2028-cosa-cambia','/uploads/website/news_import_cbe07bc3050109fe943e354ba0e7ab94.jpg','Il mondo della pallavolo si prepara a importanti cambiamenti regolamentari per il prossimo quadriennio. La FIVB ha annunciato le nuove regole che entreranno in vigore dal 2025.','<p>Il mondo della pallavolo si prepara a importanti <strong>cambiamenti regolamentari</strong> per il prossimo quadriennio olimpico. La FIVB ha annunciato le nuove regole che entreranno in vigore dal 2025, introducendo significative novità nel gioco.</p>\n<h2>Le principali novità</h2>\n<ul>\n<li><strong>Set alle 25 punti</strong>: alcune competizioni sperimentali adotteranno set da 25 punti al posto dei tradizionali 25.</li>\n<li><strong>Challenge system</strong>: ampliato l\'utilizzo del challenge per le categorie giovanili.</li>\n<li><strong>Libero</strong>: nuove norme sulla sostituzione del libero e sulla sua posizione in campo.</li>\n<li><strong>Battuta</strong>: introdotte modifiche ai tempi di battuta per velocizzare il gioco.</li>\n</ul>\n<h2>Impatto sulle nostre squadre</h2>\n<p>Il nostro staff tecnico è già al lavoro per adeguare gli allenamenti alle nuove norme. Maggiori dettagli verranno comunicate all\'inizio della stagione 2025-2026.</p>',1,'2025-07-25 08:00:00','2026-03-10 19:22:15','2026-03-10 19:22:15'),(4,NULL,1,2,'Psicologia dell\'allenamento costante nella pallavolo: motivazione e mentalità vincente','psicologia-allenamento-pallavolo','/uploads/website/news_import_267cd560cf063e890742bf81d6da2255.jpg','La pallavolo è uno sport di testa prima che di braccia. Esploriamo l\'importanza della mentalità e della motivazione durante gli allenamenti quotidiani.','<p>La pallavolo è uno sport di <strong>testa prima che di braccia</strong>. La capacità di mantenere alta la motivazione durante gli allenamenti quotidiani è ciò che distingue una buona giocatrice da una campionessa.</p>\n<h2>La mente come strumento di performance</h2>\n<p>Numerosi studi nel campo della psicologia sportiva dimostrano che gli atleti che adottano tecniche di visualizzazione e mindfulness migliorano significativamente le loro prestazioni. Per le giovani pallavoliste, questo aspetto è ancora più rilevante, poiché si trovano in una fase cruciale dello sviluppo.</p>\n<h2>Strategie pratiche per le nostre atlete</h2>\n<ul>\n<li><strong>Routine pre-allenamento</strong>: stabilire rituali positivi prima di ogni sessione.</li>\n<li><strong>Goal setting</strong>: fissare obiettivi a breve e lungo termine.</li>\n<li><strong>Dialogo interno positivo</strong>: sostituire i pensieri negativi con affermazioni costruttive.</li>\n<li><strong>Gestione degli errori</strong>: imparare a vedere l\'errore come opportunità di crescita.</li>\n</ul>',1,'2025-06-02 08:00:00','2026-03-10 19:22:17','2026-03-10 19:22:17'),(5,NULL,1,2,'Preparazione atletica estiva per pallavoliste: esercizi e consigli','preparazione-atletica-estiva-pallavolo','/uploads/website/news_import_1458f6c7f39a72d5629ce04a6d2653e4.jpg','L\'estate è il momento ideale per costruire le basi fisiche della prossima stagione. Ecco una serie di esercizi consigliati per le nostre atlete.','<p>L\'estate è il momento ideale per costruire le <strong>basi fisiche della prossima stagione</strong>. Ecco una serie di esercizi consigliati per le nostre atlete, con consigli pratici per mantenersi in forma durante il periodo estivo.</p>\n<h2>Allenamento cardiovascolare</h2>\n<p>Durante l\'estate raccomandiamo alle nostre atlete di mantenere un buon livello di condizione aerobica attraverso corsa, nuoto o ciclismo, almeno 3 volte a settimana per 30-45 minuti.</p>\n<h2>Forza e mobilità</h2>\n<ul>\n<li>Squat e affondi per la forza delle gambe</li>\n<li>Esercizi di spinta (piegamenti) per le braccia</li>\n<li>Core training: plank, crunch, russian twist</li>\n<li>Stretching dinamico per mantenere la mobilità articolare</li>\n</ul>\n<h2>Tecnica individuale</h2>\n<p>Non dimenticare la tecnica! Dedicare 20-30 minuti al giorno all\'alzata contro il muro o ai bagher individuali fa la differenza all\'inizio della stagione.</p>',1,'2025-06-02 08:00:00','2026-03-10 19:22:18','2026-03-10 19:22:18'),(6,NULL,1,2,'Recupero dopo infortunio per pallavoliste under 18: strategie efficaci','recupero-infortunio-volley-under18','/uploads/website/news_import_83e737f71009556e6f8f6b1abeba5464.jpg','Gestire un infortunio in giovane età richiede pazienza e un approccio scientifico al recupero. I consigli dei nostri fisioterapisti.','<p>Gestire un infortunio in giovane età richiede <strong>pazienza e un approccio scientifico</strong> al recupero. Abbiamo coinvolto i nostri fisioterapisti per darvi i migliori consigli su come affrontare questo momento difficile.</p>\n<h2>Le fasi del recupero</h2>\n<ol>\n<li><strong>Fase acuta (0-72h)</strong>: riposo, ghiaccio, compressione ed elevazione (protocollo RICE).</li>\n<li><strong>Fase sub-acuta</strong>: fisioterapia mirata, mobilizzazione progressiva.</li>\n<li><strong>Fase di ritorno al campo</strong>: allenamento graduale, prima individuale poi di squadra.</li>\n</ol>\n<h2>L\'importanza del supporto psicologico</h2>\n<p>Non sottovalutare l\'aspetto mentale: stare fuori dal campo può essere frustrante. Mantenere il contatto con la squadra e avere obiettivi chiari di recupero aiuta moltissimo.</p>',1,'2025-06-02 08:00:00','2026-03-10 19:22:19','2026-03-10 19:22:19'),(7,NULL,1,2,'Alimentazione per giovani pallavoliste: consigli nutrizionali per atlete under 18','alimentazione-giovani-pallavoliste','/uploads/website/news_import_04358c465e630bb3792b947ce2e41ec9.jpg','Cosa deve mangiare una giovane atleta per rendere al meglio? Scopri la dieta bilanciata ideale per la pallavolo giovanile.','<p>Cosa deve mangiare una giovane atleta per rendere al meglio? La <strong>nutrizione gioca un ruolo fondamentale</strong> nella performance e nel recupero delle nostre pallavoliste.</p>\n<h2>Macronutrienti per la performance</h2>\n<ul>\n<li><strong>Carboidrati</strong> (55-60% delle calorie): pasta, riso, pane integrale, patate. Sono il carburante principale durante l\'allenamento.</li>\n<li><strong>Proteine</strong> (25-30%): carne magra, pesce, uova, legumi. Essenziali per la crescita muscolare.</li>\n<li><strong>Grassi buoni</strong> (15-20%): olio d\'oliva, avocado, frutta secca. Importanti per la salute ormonale.</li>\n</ul>\n<h2>Idratazione</h2>\n<p>Fondamentale mantenere una corretta idratazione: almeno 1,5-2 litri di acqua al giorno, aumentando durante gli allenamenti. Evitare bevande zuccherate e alcoliche.</p>\n<h2>Timing dei pasti</h2>\n<p>Consumare un pasto ricco di carboidrati 2-3 ore prima dell\'allenamento. Dopo, entro 30-60 minuti, uno spuntino proteico per favorire il recupero muscolare.</p>',1,'2025-06-02 08:00:00','2026-03-10 19:22:20','2026-03-10 19:22:20'),(8,NULL,1,2,'Scheda di potenziamento per giovani pallavoliste under 18: esercizi e consigli','scheda-potenziamento-volley-under18','/uploads/website/news_import_a715fd6d08a2f3a10568d513f08f5e82.jpg','Un programma di forza specifico per la pallavolo giovanile deve concentrarsi sulla prevenzione degli infortuni e sull\'esplosività.','<p>Un programma di forza specifico per la pallavolo giovanile deve concentrarsi sulla <strong>prevenzione degli infortuni</strong> e sull\'<strong>esplosività</strong>. Ecco la scheda consigliata dal nostro preparatore atletico.</p>\n<h2>Struttura settimanale (3 sessioni)</h2>\n<p><strong>Lunedì – Forza generale</strong></p>\n<ul>\n<li>Squat: 3 x 10 ripetizioni</li>\n<li>Affondi alternati: 3 x 12</li>\n<li>Spinte su panca: 3 x 10</li>\n<li>Rematore con manubri: 3 x 10</li>\n<li>Plank: 3 x 45 secondi</li>\n</ul>\n<p><strong>Mercoledì – Esplosività</strong></p>\n<ul>\n<li>Squat jump: 4 x 8</li>\n<li>Box jump: 4 x 6</li>\n<li>Sprint brevi: 6 x 20m</li>\n<li>Salti verticali: batteria da 5 ripetizioni</li>\n</ul>\n<p><strong>Venerdì – Forza specifica pallavolo</strong></p>\n<ul>\n<li>Lanciata frontale con medicine ball</li>\n<li>Esercizi di spinta sopra la testa</li>\n<li>Stabilizzazione spalla</li>\n<li>Core rotation per il bagher</li>\n</ul>',1,'2025-06-02 08:00:00','2026-03-10 19:22:21','2026-03-10 19:22:21'),(9,NULL,1,2,'Come migliorare la comunicazione in campo nella pallavolo','comunicazione-campo-pallavolo','/uploads/website/news_import_b43b00d7507e88b21bc1a01453ab2ed7.jpg','In una squadra di pallavolo davvero affiatata, ogni giocatrice sa cosa aspettarsi dalle altre. La comunicazione è la chiave per vincere.','<p>In una squadra di pallavolo davvero affiatata, ogni giocatrice sa cosa aspettarsi dalle altre. La <strong>comunicazione verbale e non verbale</strong> è la chiave per evitare malintesi e massimizzare le performance collettive.</p>\n<h2>Comunicare in palestra</h2>\n<p>Durante gli allenamenti, incentiviamo sempre le nostre atlete a chiamare il pallone, dare indicazioni tattiche e incoraggiarsi a vicenda. Queste abitudini, consolidate in allenamento, diventano automatiche in partita.</p>\n<h2>Segnali e codici</h2>\n<ul>\n<li><strong>\"Mia!\"</strong>: indicare chiaramente la palla di propria competenza</li>\n<li><strong>Segnali mano della palleggiatrice</strong>: il codice di prima alzata che le atlete devono leggere</li>\n<li><strong>Time-out dell\'alzatrice</strong>: comunicazione rapida sulla gestione tattica dell\'azione</li>\n</ul>\n<h2>Team building per la comunicazione</h2>\n<p>Attività di team building fuori dal campo aiutano le atlete a conoscersi meglio, aumentando la fiducia reciproca e, di conseguenza, la qualità della comunicazione in partita.</p>',1,'2025-06-02 08:00:00','2026-03-10 19:22:22','2026-03-10 19:22:22'),(10,NULL,1,1,'Fusion Team Volley: settimo posto a livello nazionale comunicato dal Coach Mencarelli','fusion-team-volley-settimo-posto-nazionale','/uploads/website/news_import_688e9c85662223e8736c3ed949fa9571.jpg','Il Coach Marco Mencarelli commenta con orgoglio il settimo posto a livello nazionale conquistato dal settore giovanile del Fusion Team Volley.','<p>Il Coach <strong>Marco Mencarelli</strong> ha comunicato con orgoglio la conquista del <strong>settimo posto a livello nazionale</strong> per il settore giovanile del Fusion Team Volley. Un risultato che conferma la qualità del lavoro svolto negli ultimi anni.</p>\n<blockquote><p>\"Questo risultato è il frutto di anni di lavoro, dedizione e sacrificio da parte di tutte le nostre atlete e dello staff. Siamo orgogliosi di rappresentare il Veneto ai vertici nazionali del volley giovanile.\"</p><cite>– Coach Marco Mencarelli</cite></blockquote>\n<h2>Un percorso di crescita continua</h2>\n<p>L\'obiettivo del club non è solo quello di ottenere risultati sportivi, ma di formare persone complete: atlete che sappiano affrontare le sfide della vita con la stessa determinazione con cui scendono in campo.</p>\n<p>Il settimo posto tra i migliori settori giovanili d\'Italia è un riconoscimento del nostro metodo di lavoro, che mette al centro la crescita individuale dell\'atleta.</p>',1,'2025-02-07 08:00:00','2026-03-10 19:22:23','2026-03-10 19:22:23'),(11,NULL,1,4,'Fusion Team Volley: le nostre notizie su LaPiazzaWeb e Radio Veneto24','fusion-team-volley-notizie-media','/uploads/website/news_import_c28465b637c4ebfba2baedeccc2bee08.jpg','Siamo felici di annunciare la collaborazione con LaPiazzaWeb e Radio Veneto24 per la copertura mediatica della nostra stagione.','<p>Siamo felici di annunciare la <strong>collaborazione con LaPiazzaWeb e Radio Veneto24</strong> per la copertura mediatica della nostra stagione sportiva. D\'ora in poi potrete seguire tutte le notizie del Fusion Team Volley anche attraverso questi importanti media partner del territorio.</p>\n<h2>I nostri media partner</h2>\n<p><strong>LaPiazzaWeb</strong> è il portale di informazione locale più seguito del territorio veneziano, con aggiornamenti quotidiani su sport, cultura e attualità.</p>\n<p><strong>Radio Veneto24</strong> è la radio del territorio, con cui collaboreremo per dirette, interviste e aggiornamenti sui nostri risultati.</p>\n<h2>Come seguirci</h2>\n<p>Vi invitiamo a seguire le nostre pagine social e i canali dei nostri media partner per restare sempre aggiornati sulle partite, i risultati e le iniziative del club.</p>',1,'2024-10-15 08:00:00','2026-03-10 19:22:24','2026-03-10 19:22:24'),(12,NULL,1,4,'Nuove sinergie nel volley: Fusion Team Volley e MedoVolley insieme','sinergia-fusion-medovolley','/uploads/website/news_import_5d74a782a28e192026122c02d4ab2d46.jpg','Una nuova importante partnership per lo sviluppo del volley giovanile nel territorio. Fusion Team Volley e MedoVolley uniscono le forze.','<p>Fusion Team Volley e <strong>MedoVolley</strong> uniscono le forze per un progetto tecnico condiviso che vedrà protagoniste le giovani atlete del territorio. Questa partnership rappresenta un passo importante verso la creazione di un ecosistema del volley giovanile sempre più forte e strutturato.</p>\n<h2>Gli obiettivi della collaborazione</h2>\n<ul>\n<li>Condivisione delle metodologie di allenamento</li>\n<li>Organizzazione di tornei e campus congiunti</li>\n<li>Scambi di atlete e tecnici tra le due società</li>\n<li>Progettazione condivisa di campagne di sensibilizzazione allo sport</li>\n</ul>\n<h2>Una visione comune</h2>\n<p>Entrambe le società credono fermamente che la collaborazione tra realtà locali sia la chiave per elevare il livello complessivo della pallavolo giovanile nel Veneto. Insieme siamo più forti!</p>',1,'2024-08-28 08:00:00','2026-03-10 19:22:25','2026-03-10 19:22:25'),(13,NULL,1,1,'Ufficiali gli arrivi di nuovi atleti: il mercato del Fusion Team Volley','arrivi-nuovi-atleti-mercato','/uploads/website/news_import_6c1e44ecb0167feeb03d444b0d9674ec.jpg','Il Fusion Team Volley si assicura importanti novità nel settore tecnico in vista della prossima stagione sportiva.','<p>Il <strong>Fusion Team Volley</strong> si muove con decisione nel mercato estivo, assicurandosi importanti novità nel settore tecnico in vista della prossima stagione sportiva. La dirigenza ha lavorato duramente per costruire un gruppo competitivo e motivato.</p>\n<h2>Le novità nello staff</h2>\n<p>Il club è lieto di annunciare l\'arrivo di nuovi professionisti che andranno a rafforzare lo staff tecnico e fisico della società. I dettagli ufficiali verranno comunicati nelle prossime settimane.</p>\n<h2>Obiettivi per la nuova stagione</h2>\n<p>La prossima stagione vedrà il Fusion Team Volley impegnato a confermare e migliorare i risultati degli scorsi anni, con l\'obiettivo di continuare a crescere e formare atlete di qualità per il futuro della pallavolo italiana.</p>',1,'2023-06-08 08:00:00','2026-03-10 19:22:26','2026-03-10 19:22:26');
/*!40000 ALTER TABLE `website_news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_settings`
--

DROP TABLE IF EXISTS `website_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int DEFAULT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_setting` (`tenant_id`,`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_settings`
--

LOCK TABLES `website_settings` WRITE;
/*!40000 ALTER TABLE `website_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `website_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_messages`
--

DROP TABLE IF EXISTS `whatsapp_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whatsapp_messages` (
  `id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wa_message_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` enum('text','image','document','audio','video','reaction','interactive','unknown') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `body` text COLLATE utf8mb4_unicode_ci,
  `media_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` bigint unsigned NOT NULL,
  `status` enum('received','read','replied') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'received',
  `athlete_id` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tenant_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TNT_default',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wa_msg_id` (`wa_message_id`),
  KEY `idx_from_phone` (`from_phone`),
  KEY `idx_athlete` (`athlete_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_wamsg_athlete` FOREIGN KEY (`athlete_id`) REFERENCES `athletes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_messages`
--

LOCK TABLES `whatsapp_messages` WRITE;
/*!40000 ALTER TABLE `whatsapp_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_messages` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-21 10:11:34
