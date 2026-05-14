document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Lenis (スムーズスクロール)
    const lenis = new Lenis({
        duration: 1.0, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true, smoothTouch: false
    });
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // アンカーリンクのスムーススクロール
    document.querySelectorAll('a.scroll-link').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                lenis.scrollTo(targetId, { offset: -90 }); // ヘッダーの高さを考慮
            }
        });
    });

    // 2. GSAP
    gsap.registerPlugin(ScrollTrigger);

    // 文字分割関数
    const splitTextToChars = (selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const nodes = Array.from(element.childNodes);
            let newHtml = '';
            nodes.forEach(node => {
                if (node.nodeType === 3) {
                    const text = node.textContent;
                    const chars = text.split('').map(char => {
                        if (char.trim() === '') return ' '; 
                        return `<span class="char" style="display:inline-block; opacity:0; filter:blur(10px); will-change:transform, opacity;">${char}</span>`;
                    }).join('');
                    newHtml += chars;
                } else { newHtml += node.outerHTML; }
            });
            element.innerHTML = newHtml;
        });
    };

    // 3. Three.js (Topページのみ実行)
    const initThreeJS = () => {
        const canvas = document.querySelector('#webgl-canvas');
        const heroSection = document.querySelector('#hero');
        if (!canvas || !heroSection) return; // 下層ページではここで終了

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8f9fa);
        scene.fog = new THREE.FogExp2(0xf8f9fa, 0.002);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 100;
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 粒子
        const particleGeometry = new THREE.BufferGeometry();
        const count = 1200;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const color1 = new THREE.Color(0x81cae3);
        const color2 = new THREE.Color(0x333333);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            const mixedColor = Math.random() > 0.5 ? color1 : color2;
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
            size: 0.8, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
        }));
        scene.add(particles);

        // 3Dテキスト
        let textMesh;
        const updateTextPosition = () => {
            if (!textMesh) return;
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                textMesh.position.set(0, -10, -60);
                textMesh.scale.set(0.6, 0.6, 0.6); 
            } else {
                textMesh.position.set(35, 0, -40);
                textMesh.scale.set(1, 1, 1);
            }
        };

        const fontLoader = new THREE.FontLoader();
        fontLoader.load('https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const textGeometry = new THREE.TextGeometry('poralized', {
                font: font, size: 22, height: 1, curveSegments: 6,
                bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.1, bevelSegments: 3
            });
            textGeometry.computeBoundingBox();
            const centerOffset = - 0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );
            textGeometry.translate(centerOffset, 0, 0);
            textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({
                color: 0x81cae3, transparent: true, opacity: 0.15, wireframe: true, blending: THREE.NormalBlending
            }));
            textMesh.rotation.y = -0.3; 
            scene.add(textMesh);
            updateTextPosition();
        });

        // アニメーションループ
        let mouseX = 0, mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX - windowHalfX); mouseY = (e.clientY - windowHalfY);
        });

        let isHeroVisible = true;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { isHeroVisible = entry.isIntersecting; });
        });
        observer.observe(heroSection);

        const animate = () => {
            requestAnimationFrame(animate);
            if (!isHeroVisible) return;

            particles.rotation.y += 0.002;
            particles.rotation.y += 0.05 * (mouseX * 0.0005 - particles.rotation.y);
            
            if (textMesh) {
                const time = Date.now() * 0.0005;
                textMesh.rotation.y = -0.3 + Math.sin(time) * 0.1; 
                textMesh.rotation.x = Math.cos(time) * 0.05;
                const isMobile = window.innerWidth <= 768;
                const targetBaseX = isMobile ? 0 : 35;
                const targetBaseY = isMobile ? -10 : 0;
                textMesh.position.x += ((targetBaseX + mouseX * 0.01) - textMesh.position.x) * 0.05;
                textMesh.position.y += ((targetBaseY - mouseY * 0.01) - textMesh.position.y) * 0.05;
            }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            updateTextPosition();
        });
        setTimeout(() => { canvas.style.opacity = 1; }, 500);
    };

    // 実行
    initThreeJS();

    // 共通フェードイン・パララックス
    if (document.querySelector('#hero')) {
        splitTextToChars('.hero-title');
        const tl = gsap.timeline({ delay: 0.5 });
        tl.fromTo(".hero-sub", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 1.5, ease: "power3.out" }, 0.5);
        tl.to(".hero-title .char", { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.5, stagger: 0.08, ease: "power4.out" }, 1.0);
        tl.fromTo([".hero-lead", ".hero-cta"], { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: "power2.out" }, 2.5);
        tl.fromTo(".scroll-down", { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, 3.5);
    }

    const fadeElements = document.querySelectorAll('.fade-in-section, .feature-item, .ceo-message, .goal-box, .form-wrapper, .section-header');
    fadeElements.forEach(el => {
        gsap.fromTo(el, { y: 50, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 1.0, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
        });
    });

    const parallaxImages = document.querySelectorAll('.parallax-img');
    parallaxImages.forEach(img => {
        gsap.to(img, {
            y: -50, ease: "none",
            scrollTrigger: { trigger: img.closest('section'), start: "top bottom", end: "bottom top", scrub: true }
        });
    });
});