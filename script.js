// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Target elements
    const elementsToAnimate = document.querySelectorAll('.fade-in');
    elementsToAnimate.forEach(el => observer.observe(el));

    // Navbar active state handling based on scrolling
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Mobile Menu Toggle
    const menuIcon = document.getElementById('menu-icon');
    const navLinksContainer = document.getElementById('nav-links');

    if (menuIcon && navLinksContainer) {
        menuIcon.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            const icon = menuIcon.querySelector('i');
            if (navLinksContainer.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('active');
                const icon = menuIcon.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Contact Button Interaction & Copy to Clipboard
    const contactBtn = document.querySelector('.contact-reveal-btn');
    const contactWrapper = document.querySelector('.contact-wrapper');
    const contactPopout = document.getElementById('contact-popout');

    if (contactBtn && contactWrapper) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactWrapper.classList.toggle('active');
        });

        if (contactPopout) {
            contactPopout.style.cursor = 'pointer';
            contactPopout.addEventListener('click', () => {
                const numberToCopy = window.contactNumberStr || '9360369359';
                navigator.clipboard.writeText(numberToCopy).then(() => {
                    const originalHTML = contactPopout.innerHTML;
                    contactPopout.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        contactPopout.innerHTML = originalHTML;
                    }, 2000);
                });
            });
        }
    }

    // Certificate Accordion Interaction
    const certHeaders = document.querySelectorAll('.cert-header');
    certHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const card = header.parentElement;
            card.classList.toggle('expanded');
        });
    });

    // AI Sparkles / Neural Network Background Canvas
    const canvas = document.getElementById('ai-sparkles-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        const particleCount = 70; // Adjust for density
        const connectDistance = 160;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.7; // Speed
                this.vy = (Math.random() - 0.5) * 0.7; // Speed
                this.size = Math.random() * 2 + 0.8; // Sparkle size
                // Colors: Mix of cyan and purple representing Neural Nodes
                this.color = Math.random() > 0.5 ? '#00f0ff' : '#b026ff';
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges gently
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 15; // Glow effect
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0; // Reset for lines
            }
        }

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Mouse interaction for pulling lines towards the cursor
        let mouse = { x: null, y: null };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections between nodes
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectDistance) {
                        ctx.beginPath();
                        // Opacity drops as distance increases
                        ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 * (1 - dist / connectDistance)})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        // Subtle curved data links
                        ctx.quadraticCurveTo(
                            particles[i].x,
                            particles[j].y,
                            particles[j].x,
                            particles[j].y
                        );
                        ctx.stroke();
                    }
                }

                // Draw connections to the mouse cursor
                if (mouse.x != null && mouse.y != null) {
                    const dx = particles[i].x - mouse.x;
                    const dy = particles[i].y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectDistance + 50) { // Mouse reach is a bit longer
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(176, 38, 255, ${0.6 * (1 - dist / (connectDistance + 50))})`;
                        ctx.lineWidth = 1.2;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    }

    // Fetch dynamic data from API (prefer Supabase client if configured)
    (async () => {
        try {
            let data = null;
            const sb = (typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null) || window.supabaseClient || window.supabase;
            if (sb && typeof sb.from === 'function' && !window.SUPABASE_CONFIG_PLACEHOLDER) {
                try {
                    const res = await sb.from('portfolio_settings').select('data').eq('id', 1).single();
                    if (!res.error && res.data) {
                        data = res.data.data || res.data;
                    }
                } catch (e) {
                    console.warn('Supabase fetch failed, falling back to API:', e);
                }
            }

            if (!data || Object.keys(data).length === 0) {
                try {
                    const resp = await fetch('/api/data?t=' + Date.now());
                    const json = await resp.json();
                    if (json && !json.error) data = json;
                } catch (e) {
                    console.warn('Backend API fetch failed:', e);
                }
            }

            if (data && data.hero) {
                const h1 = document.querySelector('.hero-content h1');
                if (h1) {
                    h1.textContent = data.hero.name;
                    h1.setAttribute('data-text', data.hero.name);
                }
                const role = document.querySelector('.hero-content .role');
                if (role) role.textContent = data.hero.role;
                const desc = document.querySelector('.hero-content .hero-desc');
                if (desc) desc.textContent = data.hero.description;

                const githubLink = document.querySelector('.social-links a[href*="github"]');
                if (githubLink) githubLink.href = data.hero.github;
                const linkedinLink = document.querySelector('.social-links a[href*="linkedin"]');
                if (linkedinLink) linkedinLink.href = data.hero.linkedin;

                const contactPopout = document.getElementById('contact-popout');
                if (contactPopout) {
                    contactPopout.innerHTML = `<i class="fas fa-copy"></i> Copy: ${data.hero.contact}`;
                    window.contactNumberStr = data.hero.contact;
                }
            }

            if (data.about && data.about.paragraphs) {
                const aboutText = document.querySelector('.about-text');
                if (aboutText) {
                    aboutText.innerHTML = data.about.paragraphs.map(p => `<p>${p}</p>`).join('');
                }
            }

            if (data.skills && (data.skills.languages?.length || data.skills.libraries?.length || data.skills.tools?.length)) {
                const skillsContainer = document.querySelector('.skills-container');
                if (skillsContainer) {
                    skillsContainer.innerHTML = '';
                    const addCategory = (title, tags) => {
                        if (!tags || tags.length === 0) return;
                        const catDiv = document.createElement('div');
                        catDiv.className = 'skill-category glass-card';
                        catDiv.innerHTML = `<h3>${title}</h3><div class="skill-tags">${tags.map(t => `<span>${t}</span>`).join('')}</div>`;
                        skillsContainer.appendChild(catDiv);
                    }
                    addCategory('Languages', data.skills.languages);
                    addCategory('Libraries / Frameworks', data.skills.libraries);
                    addCategory('Tools', data.skills.tools);
                }
            }

            if (Array.isArray(data.projects) && data.projects.length > 0) {
                const projectsGrid = document.querySelector('.projects-grid');
                if (projectsGrid) {
                    projectsGrid.innerHTML = data.projects.map(proj => {
                        const imageHTML = proj.image 
                            ? `<img src="${proj.image.startsWith('data:') || proj.image.startsWith('http') ? proj.image : '/' + proj.image}" alt="${proj.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px 16px 0 0;">`
                            : `<i class="fas ${proj.icon || 'fa-code'} fa-3x"></i>`;
                        
                        return `
                        <div class="project-card glass-card">
                            <div class="project-img ${proj.image ? '' : 'placeholder-img'}">
                                ${imageHTML}
                            </div>
                        <div class="project-content">
                            <h3>${proj.title}</h3>
                            <p>${proj.description}</p>
                            <div class="project-tech">
                                ${(proj.tech || []).map(t => `<span>${t}</span>`).join('')}
                            </div>
                            <a href="${proj.link || '#'}" class="view-btn">View Code <i class="fab fa-github"></i></a>
                        </div>
                    </div>`; 
                    }).join('');
                }
            }

            if (Array.isArray(data.achievements) && data.achievements.length > 0) {
                const certGrid = document.querySelector('.cert-grid');
                if (certGrid) {
                    certGrid.innerHTML = data.achievements.map((cert) => {
                        const imgSrc = cert.image ? (cert.image.startsWith('data:') || cert.image.startsWith('http') ? cert.image : '/' + cert.image) : '';
                        const imgHtml = imgSrc ? `<img src="${imgSrc}" alt="${cert.title}" class="cert-img" onerror="this.style.display='none'">` : '';
                        return `
                    <div class="cert-card glass-card">
                        <div class="cert-header">
                            <h3>${cert.title}</h3>
                            <span class="cert-date">${cert.date}</span>
                            <button class="cert-expand-btn"><i class="fas fa-chevron-down"></i></button>
                        </div>
                        <div class="cert-details">
                            <div class="cert-summary">
                                <p><strong>What I learned:</strong> ${cert.description}</p>
                            </div>
                            ${imgHtml}
                        </div>
                    </div>`;
                    }).join('');

                    // Re-bind accordion events for dynamically injected DOM
                    document.querySelectorAll('.cert-header').forEach(header => {
                        header.addEventListener('click', () => {
                            const card = header.parentElement;
                            card.classList.toggle('expanded');
                        });
                    });
                }
            }

            // Initialize 3D Vanilla-Tilt on Cards
            if (typeof VanillaTilt !== 'undefined') {
                VanillaTilt.init(document.querySelectorAll('.glass-card'), {
                    max: 8,
                    speed: 400,
                    glare: true,
                    "max-glare": 0.15,
                    perspective: 1000
                });
            }
        } catch (err) {
            console.error('Error fetching dynamic data:', err);
        }
    })();

    // 3D AI Object using Three.js
    const init3DObj = () => {
        const container = document.getElementById('ai-3d-container');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Core Glowing Node
        const coreGeometry = new THREE.IcosahedronGeometry(2, 1);
        const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xb026ff, wireframe: true, transparent: true, opacity: 0.3 });
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);

        const outerGeometry = new THREE.IcosahedronGeometry(2.3, 2);
        const outerMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.15 });
        const outerMesh = new THREE.Mesh(outerGeometry, outerMaterial);

        // Data Neural Network Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 700;
        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 8;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0x00f0ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);

        scene.add(coreMesh);
        scene.add(outerMesh);
        scene.add(particlesMesh);

        camera.position.z = 6;

        let targetX = 0;
        let targetY = 0;

        // Interactive Smooth Transition
        document.addEventListener('mousemove', (event) => {
            targetX = (event.clientX / window.innerWidth) * 2 - 1;
            targetY = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Animation Loop
        const animate3D = () => {
            requestAnimationFrame(animate3D);

            // Base rotation
            coreMesh.rotation.y += 0.005;
            coreMesh.rotation.x += 0.002;
            outerMesh.rotation.y -= 0.003;
            outerMesh.rotation.z -= 0.002;
            particlesMesh.rotation.y += 0.001;

            // Smooth parallax tilt applied to scene
            scene.rotation.x += 0.05 * (targetY * 0.5 - scene.rotation.x);
            scene.rotation.y += 0.05 * (targetX * 0.5 - scene.rotation.y);

            renderer.render(scene, camera);
        };
        animate3D();

        // Responsive resizing
        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    };
    init3DObj();
});
