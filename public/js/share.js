/**
 * Utility to share the application or copy link to clipboard with QR Code
 */
window.shareApp = async () => {
    const shareData = {
        title: 'CivicReport',
        text: 'Join me in improving our city! Report and track civic issues easily.',
        url: window.location.origin
    };

    // 1. Try Native Share first (Mobile)
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (err) {
            console.log('Native share cancelled or failed, falling back to UI');
        }
    }

    // 2. Desktop Fallback: Show Modal with QR Code + Copy Link
    showShareModal(shareData.url);
};

function showShareModal(url) {
    // Remove existing modal if any
    const existing = document.getElementById('share-modal-dynamic');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'share-modal-dynamic';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(5px);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s ease-out;
    `;

    // QR Code API (using quickchart.io for simplicity without client-side libs)
    // Encodes the current URL directly into a QR code image
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=250&dark=000000&light=ffffff&margin=1`;

    modal.innerHTML = `
        <div style="
            background: #1e293b;
            padding: 2rem;
            border-radius: 1rem;
            border: 1px solid rgba(148, 163, 184, 0.2);
            text-align: center;
            max-width: 90%;
            width: 350px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            position: relative;
        ">
            <button onclick="document.getElementById('share-modal-dynamic').remove()" style="
                position: absolute; top: 10px; right: 10px;
                background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;
            ">×</button>
            
            <h3 style="color: white; margin-bottom: 0.5rem;">📱 Open on Mobile</h3>
            <p style="color: #94a3b8; margin-bottom: 1.5rem; font-size: 0.9rem;">Scan this code to open the app instantly</p>
            
            <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 1.5rem;">
                <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
            </div>

            <div style="display: flex; gap: 10px;">
                <input type="text" value="${url}" readonly style="
                    flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid #475569;
                    background: #0f172a; color: #cbd5e1; font-size: 0.9rem;
                ">
                <button id="copy-btn-action" style="
                    padding: 0.5rem 1rem; background: #6366f1; color: white; border: none;
                    border-radius: 6px; cursor: pointer; font-weight: 600;
                ">Copy</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Initial Animation style
    const style = document.createElement('style');
    style.innerHTML = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    document.head.appendChild(style);

    // Copy Handler
    document.getElementById('copy-btn-action').addEventListener('click', async () => {
        await navigator.clipboard.writeText(url);
        const btn = document.getElementById('copy-btn-action');
        btn.textContent = 'Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.style.background = '#6366f1';
        }, 2000);
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
