document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/settings'); // Public endpoint
        const data = await response.json();

        if (data.success) {
            const settings = data.data;

            // Update Footer Contact Info if elements exist
            if (settings.contact_address) {
                const addressEl = document.getElementById('footer-address');
                if (addressEl) addressEl.textContent = `📍 ${settings.contact_address}`;
            }
            if (settings.contact_phone) {
                const phoneEl = document.getElementById('footer-phone');
                if (phoneEl) phoneEl.textContent = `📞 ${settings.contact_phone}`;
            }
            if (settings.contact_email) {
                const emailEl = document.getElementById('footer-email');
                if (emailEl) emailEl.textContent = `✉️ ${settings.contact_email}`;
            }

            // Social Media Links - Show only if URL exists
            const socialLinks = [
                { id: 'footer-facebook', icon: '👍', text: 'تابعنا على فيسبوك', key: 'facebook_url' },
                { id: 'footer-twitter', icon: '𝕏', text: 'تابعنا على تويتر', key: 'twitter_url' },
                { id: 'footer-instagram', icon: '📷', text: 'تابعنا على انستغرام', key: 'instagram_url' }
            ];

            socialLinks.forEach(social => {
                const el = document.getElementById(social.id);
                if (el && settings[social.key]) {
                    const link = el.querySelector('a');
                    if (link) {
                        link.href = settings[social.key];
                        el.style.display = 'block';
                    }
                } else if (el) {
                    el.style.display = 'none';
                }
            });
        }
    } catch (e) {
        console.error('Error fetching system settings for footer:', e);
    }
});
