const db = require('../database/connection');

// جلب جميع الإعدادات
exports.getAllSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM system_settings');

        // Convert to object { key: value }
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في جلب الإعدادات' });
    }
};

// تحديث الإعدادات
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value, key2: value2 }

        const promises = Object.keys(updates).map(async (key) => {
            // Upsert logic
            return db.query(`
                INSERT INTO system_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            `, [key, updates[key]]);
        });

        await Promise.all(promises);

        res.json({ success: true, message: 'تم تحديث الإعدادات بنجاح' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في تحديث الإعدادات' });
    }
};
