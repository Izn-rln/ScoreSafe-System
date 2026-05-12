CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) CHECK (role IN ('teacher', 'student')) NOT NULL,
    bio TEXT,
    profile_photo VARCHAR(500),
    campus VARCHAR(100),
    is_verified SMALLINT DEFAULT 0,
    is_approved SMALLINT DEFAULT 0,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_whitelist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    campus VARCHAR(100),
    is_admin SMALLINT DEFAULT 0,
    is_pending SMALLINT DEFAULT 0,
    requested_by VARCHAR(255) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_items INT DEFAULT 0,
    category VARCHAR(20) CHECK (category IN ('Performance','Activity','Quiz','Recitation','Examination')),
    paper_image_url VARCHAR(500),
    is_finalized SMALLINT DEFAULT 0,
    recorded_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    old_score INT DEFAULT NULL,
    new_score INT DEFAULT NULL,
    performed_by_id INT REFERENCES users(id) ON DELETE SET NULL,
    record_id INT REFERENCES records(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subjects (name) VALUES
    ('Software Engineering'),
    ('Digital Marketing'),
    ('Data Structures'),
    ('Object Oriented Programming')
ON CONFLICT (name) DO NOTHING;

INSERT INTO teacher_whitelist (email, campus, is_admin) VALUES
    ('rollin.furio@sorsu.edu.ph', 'Bulan', 1)
ON CONFLICT (email) DO NOTHING;