-- Reconstructed from the column lists in the project brief + the SQL used in the backend code.
-- VERIFY against your real `solardb` before use; do NOT run on a database that already has these tables.
CREATE DATABASE IF NOT EXISTS solardb;
USE solardb;

CREATE TABLE IF NOT EXISTS superadmins (
  id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS junior_admins (
  id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, mobile_no VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, City VARCHAR(100), address VARCHAR(255),
  subscription_title VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY, admin_id INT NOT NULL, name VARCHAR(100) NOT NULL, mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL, designation VARCHAR(100), address VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES junior_admins(id));

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY, admin_id INT NOT NULL, name VARCHAR(100) NOT NULL, mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES junior_admins(id));

CREATE TABLE IF NOT EXISTS customer_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, admin_id INT NOT NULL, name VARCHAR(100), mobile VARCHAR(20),
  email VARCHAR(150), address VARCHAR(500) NOT NULL, latitude DECIMAL(10,7), longitude DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE);

-- NOTE: brief lists a column `service_id`; the backend code uses `service_type`. Code is followed here.
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, service_type VARCHAR(100) NOT NULL, problem TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', hold_reason VARCHAR(255), employee_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id), FOREIGN KEY (employee_id) REFERENCES employees(id));

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY, employee_id INT NOT NULL, attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_date (employee_id, attendance_date), FOREIGN KEY (employee_id) REFERENCES employees(id));

-- salary upsert (ON DUPLICATE KEY) needs UNIQUE(employee_id)
CREATE TABLE IF NOT EXISTS employee_salary (
  id INT AUTO_INCREMENT PRIMARY KEY, employee_id INT NOT NULL UNIQUE, monthly_salary DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id));

CREATE TABLE IF NOT EXISTS employee_locations (
  id INT AUTO_INCREMENT PRIMARY KEY, employee_id INT NOT NULL, latitude DECIMAL(10,7) NOT NULL, longitude DECIMAL(10,7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (employee_id) REFERENCES employees(id));

CREATE TABLE IF NOT EXISTS site_name (
  id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT NOT NULL, admin_id INT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE);
-- Chat / expense / office-expense tables are NOT reconstructed here (schemas not provided).
