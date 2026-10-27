// BLOOKHIT 3D O'yin Muhiti (Three.js bilan to'liq 3D Arena)

class Game3D {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // O'yin obyektlari
        this.player = null;
        this.bots = [];
        this.chests = [];
        this.coins = [];
        this.particles = [];
        this.decorations = [];

        // O'yinchi boshqaruvi
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        this.touchControls = {
            moveX: 0,
            moveZ: 0
        };

        this.playerVelocity = new THREE.Vector3();
        this.isGrounded = true;
        this.playerBlookData = null;
        this.playerName = "Siz";

        // Callbacklar
        this.onChestInteract = null;
        this.onCoinCollect = null;
        this.activeChest = null;

        this.isRunning = false;
        this.arenaRadius = 38;

        this.init();
    }

    init() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 14, 18);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Chiroqlar (Lighting)
        this.setupLights();

        // 5. Arena Dunyosi (Terrain, Island, Decor)
        this.buildArena();

        // 6. Tangalar va Sandiqlarni joylashtirish
        this.spawnChests();
        this.spawnCoins(25);

        // 7. Boshqaruv hodisalari
        this.setupEventListeners();

        // 8. O'lcham o'zgarganda
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff3d1, 1.2);
        dirLight.position.set(25, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 120;
        const d = 45;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
        this.scene.add(dirLight);

        // Rangli neon chiroqlar
        const pointLight1 = new THREE.PointLight(0x06b6d4, 1.5, 30);
        pointLight1.position.set(-20, 6, -20);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xf59e0b, 1.5, 30);
        pointLight2.position.set(20, 6, 20);
        this.scene.add(pointLight2);
    }

    buildArena() {
        // Asosiy Suzuvchi Orol platformasi (Hexagon/Circle)
        const islandGeo = new THREE.CylinderGeometry(this.arenaRadius, this.arenaRadius - 4, 4, 32);
        const islandMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.6,
            metalness: 0.2
        });
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.y = -2;
        island.receiveShadow = true;
        this.scene.add(island);

        // Yashil/Rangli Qoplama (O'yin maydoni)
        const topGeo = new THREE.CylinderGeometry(this.arenaRadius, this.arenaRadius, 0.4, 32);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0x10b981, // To'q yashil arena
            roughness: 0.7
        });
        const topField = new THREE.Mesh(topGeo, topMat);
        topField.position.y = 0.2;
        topField.receiveShadow = true;
        this.scene.add(topField);

        // Arena atrofidagi Neon Chegara (Glow Ring)
        const ringGeo = new THREE.TorusGeometry(this.arenaRadius, 0.4, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.4;
        this.scene.add(ring);

        // Arena markazidagi Blookit doirasi
        const centerGeo = new THREE.CylinderGeometry(8, 8, 0.45, 32);
        const centerMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.4 });
        const centerCircle = new THREE.Mesh(centerGeo, centerMat);
        centerCircle.position.y = 0.22;
        centerCircle.receiveShadow = true;
        this.scene.add(centerCircle);

        // Dekoratsiyalar: daraxtlar, kristallar, qoyalar
        this.buildDecorations();
    }

    buildDecorations() {
        // Rangli kristallar va stilistik daraxtlar
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + (Math.random() * 0.2);
            const dist = this.arenaRadius - 4 - Math.random() * 6;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            if (i % 2 === 0) {
                // Stilistik kubik daraxt
                const tree = this.createVoxelTree();
                tree.position.set(x, 0, z);
                this.scene.add(tree);
                this.decorations.push(tree);
            } else {
                // Sehrli porlovchi kristall
                const crystal = this.createCrystal();
                crystal.position.set(x, 0, z);
                this.scene.add(crystal);
                this.decorations.push(crystal);
            }
        }
    }

    createVoxelTree() {
        const group = new THREE.Group();
        // Tana (Tanasi jigar rang kub)
        const trunkGeo = new THREE.BoxGeometry(0.8, 3, 0.8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        group.add(trunk);

        // Barglar (Piramida shaklidagi kublar)
        const leafGeo1 = new THREE.BoxGeometry(2.8, 1.8, 2.8);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
        const leaves1 = new THREE.Mesh(leafGeo1, leafMat);
        leaves1.position.y = 3.5;
        leaves1.castShadow = true;
        group.add(leaves1);

        const leafGeo2 = new THREE.BoxGeometry(2, 1.5, 2);
        const leaves2 = new THREE.Mesh(leafGeo2, leafMat);
        leaves2.position.y = 4.8;
        leaves2.castShadow = true;
        group.add(leaves2);

        return group;
    }

    createCrystal() {
        const group = new THREE.Group();
        const geo = new THREE.OctahedronGeometry(1.2, 0);
        const colors = [0x06b6d4, 0x8b5cf6, 0xec4899, 0xf59e0b];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1.8;
        mesh.castShadow = true;
        group.add(mesh);

        // Taglik
        const baseGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.6, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.3;
        group.add(base);

        return group;
    }

    // 3D Blook Mesh (Personaj) yaratish
    createBlookMesh(blookData, isMainPlayer = false) {
        const group = new THREE.Group();

        // 1. Asosiy Blook Kubik Gavda (Rounded Box effekti)
        const size = 1.6;
        const boxGeo = new THREE.BoxGeometry(size, size, size);

        // Yuz teksturasi va yon tomonlar
        const faceTex = window.createBlookFaceTexture(blookData);
        const sideTex = window.createBlookSideTexture(blookData.color, blookData.secondaryColor);

        // Cube materials: [Right, Left, Top, Bottom, Front, Back]
        const materials = [
            sideTex ? new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.3 }) : new THREE.MeshStandardMaterial({ color: blookData.color }),
            sideTex ? new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.3 }) : new THREE.MeshStandardMaterial({ color: blookData.color }),
            new THREE.MeshStandardMaterial({ color: blookData.color, roughness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: blookData.secondaryColor, roughness: 0.3 }),
            faceTex ? new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.2 }) : new THREE.MeshStandardMaterial({ color: blookData.color }), // Old tomon - yuz
            sideTex ? new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.3 }) : new THREE.MeshStandardMaterial({ color: blookData.color })
        ];

        const body = new THREE.Mesh(boxGeo, materials);
        body.position.y = size / 2 + 0.3;
        body.castShadow = true;
        group.add(body);
        group.userData.body = body;

        // 2. Quloqlar yoki maxsus shoxchalar (Blook turiga qarab)
        if (blookData.ears === 'horns') {
            const hornGeo = new THREE.ConeGeometry(0.25, 0.8, 4);
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8 });
            const leftHorn = new THREE.Mesh(hornGeo, hornMat);
            leftHorn.position.set(-0.55, size + 0.6, 0);
            leftHorn.rotation.z = 0.3;
            group.add(leftHorn);

            const rightHorn = new THREE.Mesh(hornGeo, hornMat);
            rightHorn.position.set(0.55, size + 0.6, 0);
            rightHorn.rotation.z = -0.3;
            group.add(rightHorn);
        } else if (blookData.ears === 'bear') {
            const earGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12);
            const earMat = new THREE.MeshStandardMaterial({ color: blookData.secondaryColor });
            const leftEar = new THREE.Mesh(earGeo, earMat);
            leftEar.position.set(-0.65, size + 0.3, 0);
            leftEar.rotation.x = Math.PI / 2;
            group.add(leftEar);

            const rightEar = new THREE.Mesh(earGeo, earMat);
            rightEar.position.set(0.65, size + 0.3, 0);
            rightEar.rotation.x = Math.PI / 2;
            group.add(rightEar);
        } else if (blookData.ears === 'antenna') {
            const antGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
            const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
            const ant = new THREE.Mesh(antGeo, antMat);
            ant.position.set(0, size + 0.5, 0);
            group.add(ant);

            const ballGeo = new THREE.SphereGeometry(0.2, 12, 12);
            const ballMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
            const ball = new THREE.Mesh(ballGeo, ballMat);
            ball.position.set(0, size + 0.9, 0);
            group.add(ball);
        }

        // 3. Oyoqlar (kichik kubiklar)
        const legGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const legMat = new THREE.MeshStandardMaterial({ color: blookData.secondaryColor });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.4, 0.2, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.4, 0.2, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);

        group.userData.leftLeg = leftLeg;
        group.userData.rightLeg = rightLeg;

        // 4. Blook ustidagi Ism belgisi (Sprite Canvas)
        const nameSprite = this.createNameSprite(isMainPlayer ? "Siz 👑" : blookData.name);
        nameSprite.position.set(0, size + 1.2, 0);
        group.add(nameSprite);
        group.userData.nameSprite = nameSprite;

        return group;
    }

    createNameSprite(nameText) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Shaffof qora fon va hoshiya
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(10, 8, 236, 48, 16);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ism matni
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(3, 0.75, 1);
        return sprite;
    }

    // O'yinchini sahnaga o'rnatish
    spawnPlayer(blookData, name = "Siz") {
        if (this.player) {
            this.scene.remove(this.player);
        }
        this.playerBlookData = blookData;
        this.playerName = name;
        this.player = this.createBlookMesh(blookData, true);
        this.player.position.set(0, 0, 4);
        this.scene.add(this.player);
    }

    // AI Botlarni yaratish (Jonli Blooket arenasi)
    spawnBots(count = 4) {
        // Eski botlarni tozalash
        this.bots.forEach(b => this.scene.remove(b.mesh));
        this.bots = [];

        const botNames = ["Ali-King 🦁", "Madina-Pro 🌸", "Jasur-X ⚡", "Sardor-Dev 💻", "Anora-Star ⭐", "Bobur-Gold 💰"];
        const availableBlooks = window.BLOOKS.filter(b => b.id !== (this.playerBlookData ? this.playerBlookData.id : ''));

        for (let i = 0; i < count; i++) {
            const blook = availableBlooks[i % availableBlooks.length];
            const name = botNames[i % botNames.length];
            const botMesh = this.createBlookMesh(blook, false);

            // Xaritada tasodifiy joylashtirish
            const angle = (i / count) * Math.PI * 2;
            const dist = 12 + Math.random() * 14;
            botMesh.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            this.scene.add(botMesh);

            this.bots.push({
                mesh: botMesh,
                blook: blook,
                name: name,
                target: new THREE.Vector3(
                    (Math.random() - 0.5) * 40,
                    0,
                    (Math.random() - 0.5) * 40
                ),
                speed: 3.5 + Math.random() * 2,
                gold: Math.floor(Math.random() * 300) + 100,
                changeDirTimer: Math.random() * 3
            });
        }
    }

    // 3D Sandiqlar (Chests) yaratish
    spawnChests() {
        this.chests.forEach(c => this.scene.remove(c.mesh));
        this.chests = [];

        const chestPositions = [
            { x: -14, z: -12 },
            { x: 14, z: -12 },
            { x: -14, z: 12 },
            { x: 14, z: 12 },
            { x: 0, z: -18 },
            { x: -20, z: 0 },
            { x: 20, z: 0 }
        ];

        chestPositions.forEach((pos, idx) => {
            const chestGroup = this.createChestMesh();
            chestGroup.position.set(pos.x, 0, pos.z);
            this.scene.add(chestGroup);

            this.chests.push({
                id: idx,
                mesh: chestGroup,
                isOpen: false,
                respawnTimer: 0
            });
        });
    }

    createChestMesh() {
        const group = new THREE.Group();

        // Sandiq pastki qismi (Jigar yog'och)
        const baseGeo = new THREE.BoxGeometry(2.2, 1.3, 1.6);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x854d0e,
            roughness: 0.6,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.65;
        base.castShadow = true;
        group.add(base);

        // Oltin hoshiyalar
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.85,
            roughness: 0.2
        });
        const trimGeo = new THREE.BoxGeometry(2.26, 0.2, 1.66);
        const trim = new THREE.Mesh(trimGeo, goldMat);
        trim.position.y = 1.25;
        group.add(trim);

        // Sandiq qopqog'i
        const lidGeo = new THREE.BoxGeometry(2.24, 0.6, 1.64);
        const lid = new THREE.Mesh(lidGeo, baseMat);
        lid.position.set(0, 1.6, 0);
        lid.castShadow = true;
        group.add(lid);
        group.userData.lid = lid;

        // Oltin Qulf
        const lockGeo = new THREE.BoxGeometry(0.35, 0.45, 0.2);
        const lock = new THREE.Mesh(lockGeo, goldMat);
        lock.position.set(0, 1.15, 0.85);
        group.add(lock);

        // Sehrli porlash (Glow Ring)
        const glowGeo = new THREE.RingGeometry(1.4, 1.8, 24);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = Math.PI / 2;
        glow.position.y = 0.05;
        group.add(glow);
        group.userData.glow = glow;

        return group;
    }

    // 3D Oltin Tangalar (Floating Coins)
    spawnCoins(count = 20) {
        this.coins.forEach(c => this.scene.remove(c.mesh));
        this.coins = [];

        const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 20);
        const coinMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            metalness: 0.9,
            roughness: 0.15,
            emissive: 0xb45309,
            emissiveIntensity: 0.3
        });

        for (let i = 0; i < count; i++) {
            const coin = new THREE.Mesh(coinGeo, coinMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * (this.arenaRadius - 8);
            coin.position.set(
                Math.cos(angle) * dist,
                1.1 + Math.sin(i) * 0.3,
                Math.sin(angle) * dist
            );
            coin.rotation.x = Math.PI / 2;
            coin.castShadow = true;
            this.scene.add(coin);

            this.coins.push({
                mesh: coin,
                initialY: coin.position.y,
                value: 10 + Math.floor(Math.random() * 4) * 10
            });
        }
    }

    // Tangani qayta joylashtirish (olinganidan so'ng)
    respawnCoin(coin) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * (this.arenaRadius - 9);
        coin.mesh.position.set(
            Math.cos(angle) * dist,
            1.2,
            Math.sin(angle) * dist
        );
        coin.mesh.visible = true;
    }

    // Zarrachalar (Particles) portlashi effekti
    createBurstParticles(pos, color = 0xfacc15, count = 25) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const mat = new THREE.MeshBasicMaterial({ color: color });
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            p.position.y += 1;

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 7 + 3,
                (Math.random() - 0.5) * 8
            );

            this.scene.add(p);
            this.particles.push({
                mesh: p,
                vel: velocity,
                life: 1.0
            });
        }
    }

    // Klaviatura va Sensor boshqaruvi
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'Space':
                    if (this.isGrounded) {
                        this.playerVelocity.y = 9;
                        this.isGrounded = false;
                        window.soundManager.playJump();
                    }
                    break;
                case 'KeyE':
                    if (this.activeChest && this.onChestInteract) {
                        this.onChestInteract(this.activeChest);
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
        });
    }

    // Mobil / Virtual Joystik boshqaruvi
    setJoystickInput(x, z) {
        this.touchControls.moveX = x;
        this.touchControls.moveZ = z;
    }

    triggerJump() {
        if (this.isGrounded) {
            this.playerVelocity.y = 9;
            this.isGrounded = false;
            window.soundManager.playJump();
        }
    }

    // O'yinchi harakati yangilanishi
    updatePlayer(delta) {
        if (!this.player) return;

        let moveX = 0;
        let moveZ = 0;

        if (this.keys.forward) moveZ -= 1;
        if (this.keys.backward) moveZ += 1;
        if (this.keys.left) moveX -= 1;
        if (this.keys.right) moveX += 1;

        // Touch joystik qo'shish
        if (this.touchControls.moveX !== 0 || this.touchControls.moveZ !== 0) {
            moveX = this.touchControls.moveX;
            moveZ = this.touchControls.moveZ;
        }

        const moveDir = new THREE.Vector3(moveX, 0, moveZ);
        const isMoving = moveDir.lengthSq() > 0.01;

        if (isMoving) {
            moveDir.normalize();
            const speed = 10;
            this.player.position.x += moveDir.x * speed * delta;
            this.player.position.z += moveDir.z * speed * delta;

            // Blook harakat yo'nalishiga burilishi (Smooth rotation)
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            this.player.rotation.y = THREE.MathUtils.lerp(this.player.rotation.y, targetRotation, 10 * delta);

            // Blooket tebranish (wobble / yugurish) animatsiyasi
            const time = this.clock.getElapsedTime() * 15;
            if (this.player.userData.body) {
                this.player.userData.body.rotation.z = Math.sin(time) * 0.12;
            }
            if (this.player.userData.leftLeg && this.player.userData.rightLeg) {
                this.player.userData.leftLeg.rotation.x = Math.sin(time) * 0.6;
                this.player.userData.rightLeg.rotation.x = -Math.sin(time) * 0.6;
            }
        } else {
            // Tinch holat
            if (this.player.userData.body) {
                this.player.userData.body.rotation.z = 0;
            }
            if (this.player.userData.leftLeg && this.player.userData.rightLeg) {
                this.player.userData.leftLeg.rotation.x = 0;
                this.player.userData.rightLeg.rotation.x = 0;
            }
        }

        // Sakrash va tortishish kuchi (Gravity)
        this.playerVelocity.y -= 22 * delta;
        this.player.position.y += this.playerVelocity.y * delta;

        if (this.player.position.y <= 0) {
            this.player.position.y = 0;
            this.playerVelocity.y = 0;
            this.isGrounded = true;
        }

        // Arena chegarasidan chiqib ketmaslik
        const currentDist = Math.sqrt(this.player.position.x ** 2 + this.player.position.z ** 2);
        if (currentDist > this.arenaRadius - 1.5) {
            const angle = Math.atan2(this.player.position.z, this.player.position.x);
            this.player.position.x = Math.cos(angle) * (this.arenaRadius - 1.5);
            this.player.position.z = Math.sin(angle) * (this.arenaRadius - 1.5);
        }

        // Kamera o'yinchini orqasidan silliq kuzatib boradi
        const cameraTarget = new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + 11,
            this.player.position.z + 16
        );
        this.camera.position.lerp(cameraTarget, 6 * delta);
        this.camera.lookAt(
            this.player.position.x,
            this.player.position.y + 1.8,
            this.player.position.z
        );
    }

    // AI Botlar harakati
    updateBots(delta) {
        this.bots.forEach(bot => {
            bot.changeDirTimer -= delta;
            if (bot.changeDirTimer <= 0) {
                // Yangi nishon (yoki eng yaqin sandiqqa borish)
                bot.target.set(
                    (Math.random() - 0.5) * (this.arenaRadius * 1.5),
                    0,
                    (Math.random() - 0.5) * (this.arenaRadius * 1.5)
                );
                bot.changeDirTimer = 3 + Math.random() * 4;
            }

            const dir = new THREE.Vector3().subVectors(bot.target, bot.mesh.position);
            dir.y = 0;
            if (dir.lengthSq() > 1.0) {
                dir.normalize();
                bot.mesh.position.addScaledVector(dir, bot.speed * delta);
                bot.mesh.rotation.y = Math.atan2(dir.x, dir.z);

                const time = this.clock.getElapsedTime() * 12;
                if (bot.mesh.userData.body) {
                    bot.mesh.userData.body.rotation.z = Math.sin(time) * 0.1;
                }
            }

            // Chegarani tekshirish
            const dist = Math.sqrt(bot.mesh.position.x ** 2 + bot.mesh.position.z ** 2);
            if (dist > this.arenaRadius - 2) {
                bot.mesh.position.setLength(this.arenaRadius - 2);
                bot.changeDirTimer = 0;
            }
        });
    }

    // Sandiqlar va Tangalar to'qnashuvi
    checkCollisions() {
        if (!this.player) return;

        const playerPos = this.player.position;

        // 1. Tangalarni tekshirish
        this.coins.forEach(coin => {
            if (coin.mesh.visible) {
                const dist = playerPos.distanceTo(coin.mesh.position);
                if (dist < 1.8) {
                    // Tanga yig'ildi!
                    coin.mesh.visible = false;
                    window.soundManager.playCoin();
                    this.createBurstParticles(coin.mesh.position, 0xfacc15, 15);
                    if (this.onCoinCollect) {
                        this.onCoinCollect(coin.value);
                    }
                    setTimeout(() => {
                        this.respawnCoin(coin);
                    }, 4000);
                }
            }
        });

        // 2. Sandiqlarni tekshirish
        let closestChest = null;
        let minDist = 999;

        this.chests.forEach(chest => {
            const dist = playerPos.distanceTo(chest.mesh.position);
            if (dist < 3.2 && dist < minDist) {
                minDist = dist;
                closestChest = chest;
            }
        });

        this.activeChest = closestChest;
        const interactPrompt = document.getElementById('interact-prompt');
        if (interactPrompt) {
            if (this.activeChest && !this.activeChest.isOpen) {
                interactPrompt.style.display = 'flex';
            } else {
                interactPrompt.style.display = 'none';
            }
        }
    }

    // Zarrachalarni yangilash
    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.mesh.position.addScaledVector(p.vel, delta);
            p.vel.y -= 15 * delta; // og'irlik kuchi
            p.life -= delta * 1.5;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    // Tangalar va kristallar aylanishi
    updateEnvironment(delta) {
        const time = this.clock.getElapsedTime();

        // Tangalarni aylantirish va havoda suzdirish
        this.coins.forEach(coin => {
            if (coin.mesh.visible) {
                coin.mesh.rotation.z += 2.5 * delta;
                coin.mesh.position.y = coin.initialY + Math.sin(time * 3 + coin.mesh.position.x) * 0.15;
            }
        });

        // Sandiq porlash doiralarini aylantirish
        this.chests.forEach(chest => {
            if (chest.mesh.userData.glow) {
                chest.mesh.userData.glow.rotation.z += 1.0 * delta;
            }
        });

        // Kristallarni aylantirish
        this.decorations.forEach(d => {
            if (d.children[0] && d.children[0].geometry.type === 'OctahedronGeometry') {
                d.children[0].rotation.y += 0.8 * delta;
            }
        });
    }

    // Asosiy Render Sikli
    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        this.updatePlayer(delta);
        this.updateBots(delta);
        this.updateEnvironment(delta);
        this.checkCollisions();
        this.updateParticles(delta);

        this.renderer.render(this.scene, this.camera);
    }

    start() {
        this.isRunning = true;
        this.clock.start();
        this.animate();
    }

    stop() {
        this.isRunning = false;
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

window.Game3D = Game3D;
