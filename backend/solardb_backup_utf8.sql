-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: solardb
-- ------------------------------------------------------
-- Server version	8.0.46

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

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','paid_leave','unpaid_leave','half_day','absent') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,1,'2026-10-15','present','2026-10-15 09:01:22'),(2,2,'2026-10-17','present','2026-10-16 21:46:31'),(3,3,'2026-10-17','present','2026-10-16 21:56:49');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_group_members`
--

DROP TABLE IF EXISTS `chat_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `member_id` int NOT NULL,
  `member_role` enum('admin','employee','customer','superadmin','junior_admin') NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_member` (`group_id`,`member_id`,`member_role`),
  CONSTRAINT `chat_group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `chat_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_group_members`
--

LOCK TABLES `chat_group_members` WRITE;
/*!40000 ALTER TABLE `chat_group_members` DISABLE KEYS */;
INSERT INTO `chat_group_members` VALUES (1,1,2,'customer','2026-10-16 19:06:44'),(2,1,3,'superadmin','2026-10-16 19:06:44'),(3,1,1,'junior_admin','2026-10-16 19:08:50'),(4,1,2,'junior_admin','2026-10-16 19:08:50'),(5,1,3,'junior_admin','2026-10-16 19:08:50');
/*!40000 ALTER TABLE `chat_group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_groups`
--

DROP TABLE IF EXISTS `chat_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(150) NOT NULL,
  `created_by` int NOT NULL,
  `created_by_role` enum('admin','employee','customer') NOT NULL DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_groups`
--

LOCK TABLES `chat_groups` WRITE;
/*!40000 ALTER TABLE `chat_groups` DISABLE KEYS */;
INSERT INTO `chat_groups` VALUES (1,'Customer Support 2',2,'customer','2026-10-16 19:05:44');
/*!40000 ALTER TABLE `chat_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `sender_role` enum('admin','employee','customer','superadmin','junior_admin') NOT NULL,
  `receiver_id` int DEFAULT NULL,
  `receiver_role` enum('admin','employee','customer','superadmin','junior_admin') DEFAULT NULL,
  `room` varchar(150) NOT NULL,
  `chat_type` enum('private','group') NOT NULL DEFAULT 'private',
  `group_id` int DEFAULT NULL,
  `type` enum('text','image','file') NOT NULL DEFAULT 'text',
  `message` text,
  `imageUrl` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room` (`room`),
  KEY `idx_sender` (`sender_id`,`sender_role`),
  KEY `idx_group` (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_message`
--

LOCK TABLES `chat_message` WRITE;
/*!40000 ALTER TABLE `chat_message` DISABLE KEYS */;
INSERT INTO `chat_message` VALUES (1,1,'admin',2,'admin','customer-5-admin-1','private',NULL,'text','Hello',NULL,'2026-10-16 14:31:14'),(4,3,'junior_admin',NULL,NULL,'support-1','group',1,'text','Hello, testing chat message',NULL,'2026-10-16 19:14:12'),(5,3,'superadmin',NULL,NULL,'support-1','group',1,'text','hello',NULL,'2026-10-16 21:49:16'),(6,3,'superadmin',NULL,NULL,'support-1','group',1,'image',NULL,'/uploads/1792187378017-812228938.png','2026-10-16 21:49:38'),(7,3,'superadmin',NULL,NULL,'support-1','group',1,'text','helo huys',NULL,'2026-10-17 10:55:19'),(8,3,'superadmin',NULL,NULL,'support-1','group',1,'image',NULL,'/uploads/1792250235883-453404969.png','2026-10-17 15:17:15'),(9,3,'superadmin',NULL,NULL,'support-1','group',1,'text','hii mayur',NULL,'2026-10-17 15:17:19');
/*!40000 ALTER TABLE `chat_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_message_status`
--

DROP TABLE IF EXISTS `chat_message_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message_status` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `receiver_role` enum('admin','employee','customer','superadmin','junior_admin') NOT NULL,
  `status` enum('unread','seen') NOT NULL DEFAULT 'unread',
  `seen_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_message_receiver` (`message_id`,`receiver_id`,`receiver_role`),
  CONSTRAINT `chat_message_status_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_message` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_message_status`
--

LOCK TABLES `chat_message_status` WRITE;
/*!40000 ALTER TABLE `chat_message_status` DISABLE KEYS */;
INSERT INTO `chat_message_status` VALUES (1,1,2,'admin','unread',NULL,'2026-10-16 14:31:14'),(2,4,1,'junior_admin','unread',NULL,'2026-10-16 19:14:12'),(3,4,2,'customer','unread',NULL,'2026-10-16 19:14:12'),(4,4,2,'junior_admin','unread',NULL,'2026-10-16 19:14:12'),(5,4,3,'superadmin','seen','2026-10-16 21:49:30','2026-10-16 19:14:12'),(6,5,1,'junior_admin','unread',NULL,'2026-10-16 21:49:16'),(7,5,2,'customer','unread',NULL,'2026-10-16 21:49:16'),(8,5,2,'junior_admin','unread',NULL,'2026-10-16 21:49:16'),(9,5,3,'junior_admin','unread',NULL,'2026-10-16 21:49:16'),(10,6,1,'junior_admin','unread',NULL,'2026-10-16 21:49:38'),(11,6,2,'customer','unread',NULL,'2026-10-16 21:49:38'),(12,6,2,'junior_admin','unread',NULL,'2026-10-16 21:49:38'),(13,6,3,'junior_admin','unread',NULL,'2026-10-16 21:49:38'),(14,7,1,'junior_admin','unread',NULL,'2026-10-17 10:55:19'),(15,7,2,'customer','unread',NULL,'2026-10-17 10:55:19'),(16,7,2,'junior_admin','unread',NULL,'2026-10-17 10:55:19'),(17,7,3,'junior_admin','unread',NULL,'2026-10-17 10:55:19'),(18,8,1,'junior_admin','unread',NULL,'2026-10-17 15:17:15'),(19,8,2,'customer','unread',NULL,'2026-10-17 15:17:15'),(20,8,2,'junior_admin','unread',NULL,'2026-10-17 15:17:15'),(21,8,3,'junior_admin','unread',NULL,'2026-10-17 15:17:15'),(22,9,1,'junior_admin','unread',NULL,'2026-10-17 15:17:19'),(23,9,2,'customer','unread',NULL,'2026-10-17 15:17:19'),(24,9,2,'junior_admin','unread',NULL,'2026-10-17 15:17:19'),(25,9,3,'junior_admin','unread',NULL,'2026-10-17 15:17:19');
/*!40000 ALTER TABLE `chat_message_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `admin_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` varchar(255) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
INSERT INTO `customer_addresses` VALUES (1,2,1,'Rahul Sharma','9876543210','rahul@example.com','MP Nagar, Bhopal',23.23310000,77.43430000,'2026-10-15 12:59:40'),(2,2,1,'Rahul Sharma','9876543210','rahul@example.com','Kolar Road, Bhopal',23.16450000,77.42100000,'2026-10-15 12:59:40'),(3,3,1,'mayur thakre','7383526390','mayur@gmail.com','Sonagiri, Sector C , room no. C70',23.24990000,77.46990000,'2026-10-17 15:15:05');
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (2,1,'Rahul Sharma','9876543210','rahul@example.com','2026-10-15 12:59:40'),(3,1,'mayur thakre','7383526390','mayur@gmail.com','2026-10-17 15:15:05');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_locations`
--

DROP TABLE IF EXISTS `employee_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_employee_location` (`employee_id`),
  KEY `idx_location_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_locations`
--

LOCK TABLES `employee_locations` WRITE;
/*!40000 ALTER TABLE `employee_locations` DISABLE KEYS */;
INSERT INTO `employee_locations` VALUES (1,2,23.23051600,77.48575600,'2026-10-16 21:48:00');
/*!40000 ALTER TABLE `employee_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_salary`
--

DROP TABLE IF EXISTS `employee_salary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `monthly_salary` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_salary`
--

LOCK TABLES `employee_salary` WRITE;
/*!40000 ALTER TABLE `employee_salary` DISABLE KEYS */;
INSERT INTO `employee_salary` VALUES (1,2,30000.00,'2026-10-16 21:47:02','2026-10-17 10:54:23'),(2,3,20000.00,'2026-10-16 21:56:58','2026-10-16 21:56:58');
/*!40000 ALTER TABLE `employee_salary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (2,3,'Yash Thakre','9685763064','thakreyash595@gmail.com','Technician','Sonagiri, Sector C , room no. C70\nSonagiri, sector C','2026-10-16 21:44:23'),(3,4,'shubham','7373837373','shubham@gmail.com','hotel manager','minal resendantial','2026-10-16 21:54:54');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `junior_admins`
--

DROP TABLE IF EXISTS `junior_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `junior_admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile_no` varchar(15) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `City` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `subscription_title` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `junior_admins`
--

LOCK TABLES `junior_admins` WRITE;
/*!40000 ALTER TABLE `junior_admins` DISABLE KEYS */;
INSERT INTO `junior_admins` VALUES (1,'rupam bisen','3737373737','yashthakre2gmail.com','12345','bhopal','indrapuri sector c','premium','2026-10-15 09:50:53'),(2,'Rahul Sharma','9876543210','rahul.sharma@example.com','Rahul@12345','Bhopal','MP Nagar, Bhopal, Madhya Pradesh','Premium','2026-10-15 10:50:14'),(3,'Arpan thakre','9373734937','arpan@gmail.com','arpan123','Bhopal','indrapuri','premium','2026-10-16 18:35:36'),(4,'deeksha thakre','9085763064','deeksha@gmail.com','123456','bhopal','Street','premium','2026-10-16 21:52:02');
/*!40000 ALTER TABLE `junior_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `problem` text,
  `status` enum('PENDING','ASSIGNED','IN_PROGRESS','HOLD','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `hold_reason` text,
  `employee_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_service_customer` (`customer_id`),
  KEY `idx_service_employee` (`employee_id`),
  KEY `idx_service_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,2,'cleaning','there is a dust on the corner side of solar','PENDING',NULL,NULL,'2026-10-16 21:45:55',NULL),(2,2,'cleaning','had to clean solar','PENDING',NULL,NULL,'2026-10-17 11:03:51',NULL),(3,3,'you have to repair your solar',NULL,'PENDING',NULL,NULL,'2026-10-17 15:15:39',NULL);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_name`
--

DROP TABLE IF EXISTS `site_name`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_name` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `admin_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_name`
--

LOCK TABLES `site_name` WRITE;
/*!40000 ALTER TABLE `site_name` DISABLE KEYS */;
INSERT INTO `site_name` VALUES (1,2,1),(2,2,1),(3,3,1);
/*!40000 ALTER TABLE `site_name` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `superadmins`
--

DROP TABLE IF EXISTS `superadmins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `superadmins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `only_one_superadmin` tinyint GENERATED ALWAYS AS (1) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_superadmin` (`only_one_superadmin`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `superadmins`
--

LOCK TABLES `superadmins` WRITE;
/*!40000 ALTER TABLE `superadmins` DISABLE KEYS */;
INSERT INTO `superadmins` (`id`, `name`, `email`, `password`, `created_at`) VALUES (3,'Main SuperAdmin','superadmin@example.com','SuperAdmin@123','2026-10-15 10:55:54');
/*!40000 ALTER TABLE `superadmins` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-14 21:05:37