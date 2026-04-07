-- Use the default Railway database name
USE railway;

-- 1. Users Table (No changes needed here)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL, 
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL,
    bio TEXT,
    profile_photo VARCHAR(255),
    campus VARCHAR(100),
    is_verified TINYINT(1) DEFAULT 0,
    is_approved TINYINT(1) DEFAULT 0, 
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subjects Table (No changes needed)
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Teacher Whitelist (No changes needed)
CREATE TABLE IF NOT EXISTS teacher_whitelist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    campus VARCHAR(100),
    is_admin TINYINT(1) DEFAULT 0,
    is_pending TINYINT(1) DEFAULT 0,
    requested_by VARCHAR(255) DEFAULT NULL
);

-- 4. Records Table (FIXED: Added NULL to recorded_by_id)
CREATE TABLE IF NOT EXISTS records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    score INT NOT NULL,
    total_items INT DEFAULT 0,
    category ENUM('Performance', 'Activity', 'Quiz', 'Recitation', 'Examination'),
    paper_image_url VARCHAR(255),
    is_finalized TINYINT(1) DEFAULT 0,
    recorded_by_id INT NULL, -- ✅ FIX: Allow NULL so record stays if teacher is gone
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Audit Logs (FIXED: Added NULL to performed_by_id)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL, 
    description TEXT,
    old_score INT DEFAULT NULL,
    new_score INT DEFAULT NULL,
    performed_by_id INT NULL, -- ✅ FIX: Allow NULL so log stays if teacher is gone
    record_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);

-- 6. Initial Data
INSERT IGNORE INTO subjects (name) VALUES 
    ('Software Engineering'), 
    ('Digital Marketing'),
    ('Data Structures'),
    ('Object Oriented Programming');

INSERT IGNORE INTO teacher_whitelist (email, campus, is_admin) VALUES 
    ('rollin.furio@sorsu.edu.ph', 'Bulan', 1);