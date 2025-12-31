CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('school_name', 'مدرسة التواصل والعلوم', 'اسم المدرسة'),
('contact_email', 'info@altawasol.edu.ly', 'البريد الإلكتروني للتواصل'),
('contact_phone', '+218 91 123 4567', 'رقم الهاتف للتواصل'),
('contact_address', 'طرابلس، ليبيا', 'عنوان المدرسة'),
('facebook_url', '#', 'رابط فيسبوك'),
('twitter_url', '#', 'رابط تويتر'),
('instagram_url', '#', 'رابط انستغرام');
