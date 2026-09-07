// Lightweight inline auth helper to ensure the Authenticate button works
window.inlineAdminAuth = async function() {
    const emailEl = document.getElementById('auth-email');
    const passEl = document.getElementById('auth-password');
    const authError = document.getElementById('auth-error');
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn || !emailEl || !passEl) return;
    const email = emailEl.value;
    const password = passEl.value;

    authBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    authBtn.disabled = true;
    if (authError) authError.style.display = 'none';

    try {
        const sb = (typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null) 
            || (window.supabaseClient && window.supabaseClient.auth ? window.supabaseClient : null)
            || (window.supabase && window.supabase.auth ? window.supabase : null)
            || (window.supabase && typeof window.supabase.createClient === 'function' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null);

        if (!sb || !sb.auth || typeof sb.auth.signInWithPassword !== 'function') {
            throw new Error('Supabase client failed to initialize. Please check your network and configuration.');
        }

        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const loginOverlay = document.getElementById('login-overlay');
        const adminGrid = document.getElementById('admin-editor-grid');
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (adminGrid) adminGrid.style.display = 'grid';
        if (typeof loadAdminData === 'function') loadAdminData();
    } catch (err) {
        if (authError) {
            authError.innerText = err.message || 'Authentication failed';
            authError.style.display = 'block';
        }
    } finally {
        authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Authenticate';
        authBtn.disabled = false;
    }
};

document.addEventListener('click', (ev) => {
    const target = ev.target.closest && ev.target.closest('#auth-btn');
    if (target) {
        ev.preventDefault();
        window.inlineAdminAuth();
    }
});
