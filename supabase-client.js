// Supabase client initializer
function readEnv(name) {
    try {
        if (typeof window !== 'undefined') {
            if (window[name]) return window[name];
            if (window.__env && window.__env[name]) return window.__env[name];
        }
        if (typeof process !== 'undefined' && process.env) {
            if (process.env[name]) return process.env[name];
        }
    } catch (e) {
        // ignore
    }
    return null;
}

const SUPABASE_URL = readEnv('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = readEnv('SUPABASE_ANON_KEY') || '';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

function initSupabaseClient() {
    try {
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
            window.supabase = window.supabaseClient;
            return window.supabaseClient;
        }

        const createClientFn = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
            ? window.supabase.createClient
            : (typeof window !== 'undefined' && typeof window.createClient === 'function')
                ? window.createClient
                : (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function')
                    ? supabase.createClient
                    : null;

        if (createClientFn) {
            const client = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = client;
            window.supabase = client;
            return client;
        }
    } catch (e) {
        console.warn('Error initializing supabase client:', e);
    }
    return null;
}

window.getSupabaseClient = initSupabaseClient;
initSupabaseClient();

try {
    window.SUPABASE_CONFIG_PLACEHOLDER = (
        !SUPABASE_URL || !SUPABASE_ANON_KEY ||
        (typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('REPLACE_ME')) ||
        (typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.startsWith('REPLACE_ME'))
    );
} catch (e) {
    /* noop */
}
