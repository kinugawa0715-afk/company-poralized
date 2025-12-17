document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================================
    // 1. Lenis (スムーズスクロール)
    // ========================================================
    // 慣性スクロールの設定。不要な場合は削除しても動きますが、世界観維持のため残します。
    const lenis = new Lenis({
        duration: 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false
    });
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


    // ========================================================
    // 2. GSAP設定 (アニメーション)
    // ========================================================
    gsap.registerPlugin(ScrollTrigger);

    // 文字分割関数（タイトルのタイプライター演出用）
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

    // グローバル変数（マウス位置）
    let mouseX = 0, mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - windowHalfX) * 0.05;
        mouseY = (e.clientY - windowHalfY) * 0.05;
    });


    // ========================================================
    // 3. Top Page 3D Animation (Logo & Particles)
    // ========================================================
    const initTopHero3D = () => {
        const canvas = document.querySelector('#webgl-canvas');
        const heroSection = document.querySelector('#hero');
        if (!canvas || !heroSection) return;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0b0b0b, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 100;
        
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // パーティクル
        const particleGeometry = new THREE.BufferGeometry();
        const count = 1000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 300;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
            size: 0.7, color: 0x3399ff, transparent: true, opacity: 0.6
        }));
        scene.add(particles);

        // 3Dテキスト
        let textMesh;
        const fontLoader = new THREE.FontLoader();
        fontLoader.load('https://unpkg.com/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            const textGeometry = new THREE.TextGeometry('poralized', {
                font: font, size: 20, height: 1, curveSegments: 6,
                bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.2, bevelSegments: 3
            });
            textGeometry.computeBoundingBox();
            const centerOffset = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
            textGeometry.translate(centerOffset, 0, 0);

            const material = new THREE.MeshBasicMaterial({
                color: 0x3399ff, transparent: true, opacity: 0.8, wireframe: true, blending: THREE.AdditiveBlending
            });
            textMesh = new THREE.Mesh(textGeometry, material);
            
            // 位置調整
            const isMobile = window.innerWidth <= 768;
            if(isMobile) {
                textMesh.position.set(0, 0, -20);
                textMesh.scale.set(0.7, 0.7, 0.7);
            } else {
                textMesh.position.set(-15, 0, -20);
            }
            textMesh.rotation.y = 0.2; 
            scene.add(textMesh);

            // アニメーションシーケンス
            canvas.style.opacity = 1;
            splitTextToChars('.hero-title');

            const tl = gsap.timeline({ delay: 0.5 });
            tl.add("start", "+=1.0");

            tl.to(material, { opacity: 0, duration: 2.0, ease: "power2.inOut" }, "start");
            tl.to(textMesh.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 2.0, ease: "power2.out" }, "start");

            tl.fromTo(".hero-sub", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 1.5, ease: "power3.out" }, "start+=0.5");
            tl.to(".hero-title .char", { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.5, stagger: 0.05, ease: "power4.out" }, "start+=0.8");
            tl.fromTo([".hero-lead", ".hero-cta"], { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, stagger: 0.2, ease: "power2.out" }, "start+=2.0");
            tl.fromTo(".scroll-down", { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, "start+=3.0");
        });

        // ループアニメーション
        const animate = () => {
            requestAnimationFrame(animate);
            particles.rotation.y += 0.001;
            
            if (textMesh && textMesh.material.opacity > 0.01) {
                const time = Date.now() * 0.001;
                textMesh.rotation.y = 0.2 + Math.sin(time) * 0.1; 
                textMesh.position.x += (mouseX * 0.1 - textMesh.position.x) * 0.05;
                textMesh.position.y += (-mouseY * 0.1 - textMesh.position.y) * 0.05;
            }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    };


    // ========================================================
    // 4. Philosophy Page 3D (Geometric Core)
    // ========================================================
    const initPhilosophy3D = () => {
        const canvas = document.querySelector('#vision-canvas');
        const container = document.querySelector('#vision-3d-container'); 
        if (!canvas || !container) return;

        const scene = new THREE.Scene();

        // カメラ設定: コンテナの縦横比に合わせる
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        
        // ▼▼▼ 修正ポイント: 画面幅に応じてカメラ位置を調整（見切れ防止） ▼▼▼
        const updateCameraPosition = () => {
            if (window.innerWidth <= 768) {
                camera.position.z = 45; // スマホなど画面が狭いときはカメラを引く
            } else {
                camera.position.z = 30; // PCなど広い画面は標準距離
            }
        };
        updateCameraPosition(); // 初期実行

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas, antialias: true, alpha: true
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 幾何学オブジェクト
        const geometry = new THREE.IcosahedronGeometry(10, 1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x3399ff, wireframe: true, transparent: true, opacity: 0.3 
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // 内側のコア
        const coreGeo = new THREE.IcosahedronGeometry(5, 0);
        const coreMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, wireframe: true, transparent: true, opacity: 0.6 
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        scene.add(core);

        // アニメーションループ
        let time = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.005;

            sphere.rotation.x = time * 0.5;
            sphere.rotation.y = time * 0.3;
            core.rotation.x = -time * 0.5;
            core.rotation.y = -time * 0.8;

            sphere.position.y = Math.sin(time) * 1;

            // マウス連動
            sphere.rotation.y += mouseX * 0.05;
            sphere.rotation.x += mouseY * 0.05;
            
            core.position.x = -mouseX * 2;
            core.position.y = mouseY * 2;

            renderer.render(scene, camera);
        };
        animate();
        
        setTimeout(() => { canvas.style.opacity = 1; }, 500);

        // リサイズ時の処理
        window.addEventListener('resize', () => {
            // カメラ位置（距離）の再計算
            updateCameraPosition();
            
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    };


    // ========================================================
    // 5. 実行判定 & 共通アニメーション
    // ========================================================
    
    // Topページ用3D実行
    if (document.querySelector('#hero')) {
        initTopHero3D();
    } else {
        // 下層ページ用ヘッダー演出
        const tl = gsap.timeline();
        tl.fromTo(".page-header h2", {y: 20, opacity:0}, {y:0, opacity:1, duration:1});
    }

    // Philosophyページ用3D実行
    if (document.querySelector('#vision-canvas')) {
        initPhilosophy3D();
    }

    // 共通フェードイン (スクロール連動)
    const fadeElements = document.querySelectorAll('.fade-in-section, .feature-item, .ceo-message, .goal-box, .form-wrapper, .section-header, .tech-detail');
    fadeElements.forEach(el => {
        gsap.fromTo(el, { y: 50, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 1.0, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
        });
    });

    // パララックス (スクロール連動)
    const parallaxImages = document.querySelectorAll('.parallax-img');
    parallaxImages.forEach(img => {
        gsap.to(img, {
            y: -50, ease: "none",
            scrollTrigger: { trigger: img.closest('section'), start: "top bottom", end: "bottom top", scrub: true }
        });
    });

});