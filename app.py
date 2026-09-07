import os
from flask import Flask, request, jsonify, send_from_directory, session, Response
import json
from flask_session import Session
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment logic
load_dotenv()

app = Flask(__name__, static_url_path='', static_folder='.')

# Secure Session Configuration
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'fallback-development-key-123')
try:
    session_dir = '/tmp/flask_session'
    os.makedirs(session_dir, exist_ok=True)
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = session_dir
    Session(app)
except Exception as e:
    print(f"Flask-Session fallback to default signed cookie sessions: {e}")

# Init Supabase
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "") or os.environ.get("SUPABASE_ANON_KEY", "")

supabase = None
try:
    if url and key and url.startswith("http"):
        supabase = create_client(url, key)
    else:
        print("===================================================================")
        print("CRITICAL WARNING: PLEASE FILL OUT YOUR .ENV FILE WITH VALID URLS!")
        print("The portfolio will boot, but the database saves will fail safely.")
        print("===================================================================")
except Exception as e:
    print(f"Failed to boot database connection: {e}")

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/admin')
def admin():
    return send_from_directory('admin', 'index.html')

@app.route('/api/login', methods=['POST'])
def login():
    try:
        if not supabase:
            return jsonify({"error": "Auth backend not configured. Set SUPABASE_URL and SUPABASE_KEY in .env."}), 500
        credentials = request.json
        res = supabase.auth.sign_in_with_password({
            "email": credentials.get('email'),
            "password": credentials.get('password')
        })
        # Save session tokens to flask securely
        session['user_id'] = res.user.id
        session['access_token'] = res.session.access_token
        session['refresh_token'] = res.session.refresh_token
        # Make the session persistent so the browser retains it across refreshes
        session.permanent = True
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route('/api/session', methods=['GET'])
def session_status():
    if session.get('user_id') and session.get('access_token'):
        return jsonify({"logged_in": True, "user_id": session.get('user_id')})
    return jsonify({"logged_in": False})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "success"})

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        if not supabase:
            return jsonify({"error": "Supabase client not initialized. Check .env configuration."}), 500

        # Public select access (if RLS public SELECT is enabled)
        response = supabase.table('portfolio_settings').select('data').eq('id', 1).execute()
        if hasattr(response, 'data') and response.data and len(response.data) > 0:
            return jsonify(response.data[0].get('data', {}))
        return jsonify({})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/data', methods=['POST'])
def update_data():
    if not session.get('user_id') or not session.get('access_token'):
        return jsonify({"error": "Unauthorized Access. Please login via /admin."}), 401
    
    if not supabase:
        return jsonify({"error": "Supabase backend not configured. Check .env settings."}), 500

    try:
        data = request.json

        # Hydrate the client session to pass strict update RLS policies
        if hasattr(supabase, 'auth'):
            supabase.auth.set_session(session.get('access_token'), session.get('refresh_token'))

        # Upsert directly to Supabase
        supabase.table('portfolio_settings').upsert({
            'id': 1,
            'data': data
        }).execute()

        return jsonify({"status": "success", "message": "Supabase sync complete!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/supabase-client.js')
def serve_supabase_client():
    """Dynamically serve a small Supabase client initializer using env vars.
    This allows local Flask dev (and simple deploys) to inject keys without
    editing static files. If keys are missing, the generated file will set
    the placeholder flag so the frontend falls back safely.
    """
    sup_url = os.environ.get('SUPABASE_URL', '')
    sup_key = os.environ.get('SUPABASE_ANON_KEY', '') or os.environ.get('SUPABASE_KEY', '')

    # Safely JSON-encode strings for embedding in JS
    js_url = json.dumps(sup_url)
    js_key = json.dumps(sup_key)

    # Determine whether placeholders are present
    placeholder_flag = 'true' if (not sup_url or not sup_key) else 'false'

    payload = f"""
// Supabase client initializer (injected by Flask)
const SUPABASE_URL = {js_url};
const SUPABASE_ANON_KEY = {js_key};

try {{
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {{
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }} else if (typeof createClient === 'function') {{
        // some UMD builds expose a global createClient
        window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }} else {{
        console.warn('Supabase UMD not found. Make sure the CDN script is included before this file.');
    }}
}} catch (e) {{
    console.warn('Error initializing supabase client:', e);
}}

// Expose a flag the frontend can check to detect missing configuration
window.SUPABASE_CONFIG_PLACEHOLDER = {placeholder_flag};
"""

    return Response(payload, mimetype='application/javascript')


@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
