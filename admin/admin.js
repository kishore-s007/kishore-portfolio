document.addEventListener('DOMContentLoaded', () => {
    let fullJsonData = {};

    // Helper to get active Supabase client instance safely
    function getClient() {
        if (typeof window.getSupabaseClient === 'function') {
            const c = window.getSupabaseClient();
            if (c && c.auth) return c;
        }
        if (window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.signInWithPassword === 'function') {
            return window.supabaseClient;
        }
        if (window.supabase && window.supabase.auth && typeof window.supabase.auth.signInWithPassword === 'function') {
            return window.supabase;
        }
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            const url = window.SUPABASE_URL || '';
            const key = window.SUPABASE_ANON_KEY || '';
            try {
                if (url && key) {
                    const c = window.supabase.createClient(url, key);
                    window.supabaseClient = c;
                    window.supabase = c;
                    return c;
                }
            } catch (e) {
                console.warn('Failed to construct supabase client in admin:', e);
            }
        }
        return null;
    }

    // UI Boundaries
    const toast = document.getElementById('toast');
    const saveBtn = document.getElementById('save-btn');
    const authBtn = document.getElementById('auth-btn');
    const loginOverlay = document.getElementById('login-overlay');
    const adminGrid = document.getElementById('admin-editor-grid');
    const authError = document.getElementById('auth-error');

    // On load: if Supabase client is present, check auth session and auto-login
    const sb = getClient();
    if (sb && sb.auth && typeof sb.auth.getSession === 'function') {
        sb.auth.getSession().then(({ data }) => {
            if (data && data.session) {
                loginOverlay.style.display = 'none';
                adminGrid.style.display = 'grid';
                loadAdminData();
            }
        }).catch(() => { });
    }

    // --- Custom Confirm Modal Utility ---
    function showConfirm(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const msg = document.getElementById('confirm-message');
            const okBtn = document.getElementById('confirm-ok');
            const cancelBtn = document.getElementById('confirm-cancel');
            const backdrop = modal.querySelector('.confirm-backdrop');

            msg.textContent = message;
            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                backdrop.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKey);
            };

            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            const onKey = (e) => { if (e.key === 'Escape') onCancel(); };

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
            backdrop.addEventListener('click', onCancel);
            document.addEventListener('keydown', onKey);
        });
    }

    // Containers
    const projContainer = document.getElementById('projects-container');
    const achvContainer = document.getElementById('achievements-container');

    // --- AUTHENTICATION ---
    authBtn.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        authBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        authBtn.disabled = true;
        authError.style.display = 'none';

        try {
            const sb = getClient();
            if (!sb || !sb.auth || typeof sb.auth.signInWithPassword !== 'function') {
                throw new Error('Supabase authentication client is not initialized. Please reload the page.');
            }
            const { data: signData, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
            loginOverlay.style.display = 'none';
            adminGrid.style.display = 'grid';
            loadAdminData();
        } catch (err) {
            authError.innerText = err.message || 'Authentication failed';
            authError.style.display = 'block';
        } finally {
            authBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Authenticate';
            authBtn.disabled = false;
        }
    });

    // --- LOAD DATA ---
    async function loadAdminData() {
        try {
            const sb = getClient();
            if (sb && typeof sb.from === 'function' && !window.SUPABASE_CONFIG_PLACEHOLDER) {
                const res = await sb.from('portfolio_settings').select('data').eq('id', 1).single();
                if (!res.error && res.data) {
                    fullJsonData = res.data.data || res.data;
                } else {
                    const resp = await fetch('/api/data?t=' + Date.now()).then(r => r.json()).catch(() => ({}));
                    if (resp && !resp.error) fullJsonData = resp;
                }
            } else {
                const resp = await fetch('/api/data?t=' + Date.now()).then(r => r.json()).catch(() => ({}));
                if (resp && !resp.error) fullJsonData = resp;
            }

            // HERO
            if (fullJsonData.hero) {
                if (document.getElementById('hero-name')) document.getElementById('hero-name').value = fullJsonData.hero.name || '';
                if (document.getElementById('hero-role')) document.getElementById('hero-role').value = fullJsonData.hero.role || '';
                if (document.getElementById('hero-desc')) document.getElementById('hero-desc').value = fullJsonData.hero.description || '';
                if (document.getElementById('hero-github')) document.getElementById('hero-github').value = fullJsonData.hero.github || '';
                if (document.getElementById('hero-linkedin')) document.getElementById('hero-linkedin').value = fullJsonData.hero.linkedin || '';
                if (document.getElementById('hero-contact')) document.getElementById('hero-contact').value = fullJsonData.hero.contact || '';
            }

            // ABOUT
            if (fullJsonData.about && Array.isArray(fullJsonData.about.paragraphs)) {
                if (document.getElementById('about-p1')) document.getElementById('about-p1').value = fullJsonData.about.paragraphs[0] || '';
                if (document.getElementById('about-p2')) document.getElementById('about-p2').value = fullJsonData.about.paragraphs[1] || '';
            }

            // SKILLS
            if (fullJsonData.skills) {
                document.getElementById('skills-languages').value = (fullJsonData.skills.languages || []).join(', ');
                document.getElementById('skills-libraries').value = (fullJsonData.skills.libraries || []).join(', ');
                document.getElementById('skills-tools').value = (fullJsonData.skills.tools || []).join(', ');
            }

            // PROJECTS
            projContainer.innerHTML = '';
            (fullJsonData.projects || []).forEach(proj => createProjectNode(proj));

            // ACHIEVEMENTS
            achvContainer.innerHTML = '';
            (fullJsonData.achievements || []).forEach(ach => createAchievementNode(ach));
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    }

    // --- UI GENERATORS ---

    document.getElementById('add-proj-btn').addEventListener('click', () => createProjectNode());
    document.getElementById('add-achv-btn').addEventListener('click', () => createAchievementNode());

    // Helper to resize and compress uploaded image data before saving
    function compressImageFile(file, maxWidth = 1200, quality = 0.85) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedDataUrl);
                };
                img.onerror = () => resolve(event.target.result);
            };
            reader.onerror = () => resolve('');
        });
    }

    function createProjectNode(projData = null) {
        const div = document.createElement('div');
        div.className = 'dynamic-item proj-item';

        let existingPreview = '';
        if (projData && projData.image) {
            const src = projData.image.startsWith('data:') ? projData.image : '/' + projData.image;
            existingPreview = `<div class="image-preview-container"><img src="${src}" /></div>`;
        }

        div.innerHTML = `
            <button class="remove-btn" title="Remove Project"><i class="fas fa-times"></i></button>
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="glass-input p-title" value="${projData ? projData.title : ''}" placeholder="Project Name">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="3" class="glass-input p-desc" placeholder="What did you build?">${projData ? projData.description : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Link / URL</label>
                <input type="text" class="glass-input p-link" value="${projData ? projData.link : '#'}" placeholder="https://github.com/...">
            </div>
            <div class="form-group">
                <label>FontAwesome Icon Code (Fallback)</label>
                <input type="text" class="glass-input p-icon" value="${projData ? projData.icon : 'fa-code'}" placeholder="fa-brain">
            </div>
            <div class="form-group">
                <label>Tech Stack (comma separated)</label>
                <input type="text" class="glass-input p-tech" value="${projData ? (projData.tech || []).join(', ') : ''}" placeholder="Python, React, SQL">
            </div>
            <div class="form-group">
                <label>Project Image Upload</label>
                <input type="file" class="glass-input p-file" accept="image/*">
                <input type="hidden" class="p-image-data" value="${projData ? (projData.image || '') : ''}">
                ${existingPreview}
            </div>
        `;

        const fileInput = div.querySelector('.p-file');
        const dataInput = div.querySelector('.p-image-data');
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const compressed = await compressImageFile(file);
                if (compressed) {
                    dataInput.value = compressed;
                    let preview = div.querySelector('.image-preview-container');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.className = 'image-preview-container';
                        fileInput.parentNode.appendChild(preview);
                    }
                    preview.innerHTML = `<img src="${compressed}" />`;
                }
            }
        });

        div.querySelector('.remove-btn').addEventListener('click', async () => {
            const ok = await showConfirm('Remove this project permanently?');
            if (ok) {
                div.remove();
                document.getElementById('save-btn').click();
            }
        });
        projContainer.appendChild(div);
    }

    function createAchievementNode(achData = null) {
        const div = document.createElement('div');
        div.className = 'dynamic-item achv-item';

        let existingPreview = '';
        if (achData && achData.image) {
            const src = achData.image.startsWith('data:') ? achData.image : '/' + achData.image;
            existingPreview = `<div class="image-preview-container"><img src="${src}" /></div>`;
        }

        div.innerHTML = `
            <button class="remove-btn" title="Remove Achievement"><i class="fas fa-times"></i></button>
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="glass-input a-title" value="${achData ? achData.title : ''}" placeholder="Certificate Name">
            </div>
            <div class="form-group">
                <label>Year / Date</label>
                <input type="text" class="glass-input a-date" value="${achData ? achData.date : ''}" placeholder="2025">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="3" class="glass-input a-desc" placeholder="Details about this achievement...">${achData ? achData.description : ''}</textarea>
            </div>
            <div class="form-group">
                <label>Image Upload</label>
                <input type="file" class="glass-input a-file" accept="image/*">
                <input type="hidden" class="a-image-data" value="${achData ? achData.image : ''}">
                ${existingPreview}
            </div>
        `;

        const fileInput = div.querySelector('.a-file');
        const dataInput = div.querySelector('.a-image-data');
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const compressed = await compressImageFile(file);
                if (compressed) {
                    dataInput.value = compressed;
                    let preview = div.querySelector('.image-preview-container');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.className = 'image-preview-container';
                        fileInput.parentNode.appendChild(preview);
                    }
                    preview.innerHTML = `<img src="${compressed}" />`;
                }
            }
        });

        div.querySelector('.remove-btn').addEventListener('click', async () => {
            const ok = await showConfirm('Remove this achievement permanently?');
            if (ok) {
                div.remove();
                document.getElementById('save-btn').click();
            }
        });
        achvContainer.appendChild(div);
    }

    // --- SAVE LOGIC ---
    saveBtn.addEventListener('click', async () => {
        // Build HERO
        const heroName = document.getElementById('hero-name')?.value || fullJsonData.hero?.name || 'KISHORE S';
        const heroRole = document.getElementById('hero-role')?.value || fullJsonData.hero?.role || 'AI & Data Science Innovator';
        const heroDesc = document.getElementById('hero-desc')?.value || fullJsonData.hero?.description || '';
        const heroGithub = document.getElementById('hero-github')?.value || fullJsonData.hero?.github || '';
        const heroLinkedin = document.getElementById('hero-linkedin')?.value || fullJsonData.hero?.linkedin || '';
        const heroContact = document.getElementById('hero-contact')?.value || fullJsonData.hero?.contact || '';

        // Build ABOUT
        const aboutP1 = document.getElementById('about-p1')?.value || fullJsonData.about?.paragraphs?.[0] || '';
        const aboutP2 = document.getElementById('about-p2')?.value || fullJsonData.about?.paragraphs?.[1] || '';

        // Build SKILLS
        const skillsLanguages = document.getElementById('skills-languages').value.split(',').map(s => s.trim()).filter(s => s);
        const skillsLibraries = document.getElementById('skills-libraries').value.split(',').map(s => s.trim()).filter(s => s);
        const skillsTools = document.getElementById('skills-tools').value.split(',').map(s => s.trim()).filter(s => s);

        // Build PROJECTS
        const projects = Array.from(document.querySelectorAll('.proj-item')).map(item => {
            return {
                title: item.querySelector('.p-title').value,
                description: item.querySelector('.p-desc').value,
                link: item.querySelector('.p-link').value,
                icon: item.querySelector('.p-icon').value,
                tech: item.querySelector('.p-tech').value.split(',').map(s => s.trim()).filter(s => s),
                image: item.querySelector('.p-image-data').value
            };
        });

        // Build ACHIEVEMENTS
        const achievements = Array.from(document.querySelectorAll('.achv-item')).map(item => {
            return {
                title: item.querySelector('.a-title').value,
                date: item.querySelector('.a-date').value,
                description: item.querySelector('.a-desc').value,
                image: item.querySelector('.a-image-data').value
            };
        });

        const payload = {
            hero: {
                name: heroName,
                role: heroRole,
                description: heroDesc,
                github: heroGithub,
                linkedin: heroLinkedin,
                contact: heroContact
            },
            about: {
                paragraphs: [aboutP1, aboutP2].filter(p => p)
            },
            skills: {
                languages: skillsLanguages,
                libraries: skillsLibraries,
                tools: skillsTools
            },
            projects: projects,
            achievements: achievements
        };

        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Cloud...';
        saveBtn.disabled = true;

        try {
            const sb = getClient();
            if (sb && typeof sb.from === 'function' && !window.SUPABASE_CONFIG_PLACEHOLDER) {
                const res = await sb.from('portfolio_settings').upsert({ id: 1, data: payload });
                if (res.error) throw res.error;
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 3000);
            } else {
                const apiRes = await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const apiJson = await apiRes.json();
                if (!apiRes.ok || apiJson.error) throw new Error(apiJson.error || 'API Save failed');
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 3000);
            }
        } catch (err) {
            alert('Save failed: ' + (err.message || err));
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    });

    // --- TAB SWITCHING LOGIC ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const el = document.getElementById(targetId);
            if (el) el.classList.add('active');
        });
    });
});
