import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- GAME STATE ---
const G = {
    started: false,
    player: {
        health: 100,
        ammo: 6,
        honor: 0,
        mounted: false,
        shootCooldown: 0,
        dead: false
    },
    horse: {
        mesh: null as THREE.Mesh | null,
        stamina: 100,
        near: false
    },
    time: 0.5,
    timeSpeed: 0.0001,
    npcs: [] as any[],
    campfires: [] as any[],
    interactTarget: null as any,
    monologueOpen: false,
    mapOpen: false,
    inventoryOpen: false,
    journalOpen: false,
    dlgTimer: 0,
    gallopTimer: 0,
    houses: [] as THREE.Mesh[],
    obstacles: [] as THREE.Object3D[],
    fragments: [] as any[],
    effects: [] as any[],
    muzzleFlash: null as THREE.PointLight | null,
    missions: [
        { id: 'horse', text: 'Encuentra a tu caballo Ceniza', completed: false, type: 'location', target: null as THREE.Vector3 | null, reward: { honor: 10, text: '+10 Honor' } as any },
        { id: 'bandits', text: 'Elimina a 5 bandidos', completed: false, type: 'kill', targetCount: 5, currentCount: 0, reward: { honor: 20, ammo: 6, text: '+20 Honor, +6 Balas' } as any },
        { id: 'fragment', text: 'Encuentra un fragmento del pasado', completed: false, type: 'collect', target: null as THREE.Vector3 | null, reward: { honor: 30, text: '+30 Honor' } as any },
        { id: 'town', text: 'Llega al pueblo', completed: false, type: 'location', target: null as THREE.Vector3 | null, reward: { honor: 50, health: 100, text: '+50 Honor, Salud al máximo' } as any }
    ],
    currentMission: 0
};

// --- AUDIO ---
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
    } catch(e) {}
}
function playGunshot() {
    if (!audioCtx || !masterGain) return;
    try {
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random()*2-1) * Math.exp(-i / (audioCtx.sampleRate * 0.04));
        }
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const flt = audioCtx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 2200;
        const g = audioCtx.createGain(); g.gain.value = 0.6;
        src.connect(flt); flt.connect(g); g.connect(masterGain);
        src.start();
    } catch(e) {}
}

function playHitSound() {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(g); g.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } catch(e) {}
}

function playMissionCompleteSound() {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.2); // C#5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.4); // E5
        g.gain.setValueAtTime(0, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
        g.gain.setValueAtTime(0.5, audioCtx.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
        osc.connect(g); g.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.8);
    } catch(e) {}
}

function playGallopSound() {
    if (!audioCtx || !masterGain) return;
    try {
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
            d[i] = (Math.random()*2-1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
        }
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const flt = audioCtx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 400;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0.2, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        src.connect(flt); flt.connect(g); g.connect(masterGain);
        src.start();
    } catch(e) {}
}

function playReloadSound() {
    if (!audioCtx || !masterGain) return;
    try {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        g.gain.setValueAtTime(0.2, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(g); g.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) {}
}

// --- UI HELPERS ---
function showNotif(msg: string, duration = 3000) {
    const el = document.getElementById('notification');
    if (!el) return;
    el.innerHTML = msg.replace(/\n/g, '<br>');
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), duration);
}
function updateHealthHUD() {
    const el = document.getElementById('healthBar');
    if (el) el.style.width = Math.max(0, G.player.health) + '%';
}

function updateAmmoHUD() {
    const el = document.getElementById('ammoText');
    if (el) el.textContent = 'BALAS  ' + '●'.repeat(G.player.ammo) + '○'.repeat(6 - G.player.ammo);
}
function changeHonor(amt: number, reason: string) {
    G.player.honor = Math.max(-100, Math.min(100, G.player.honor + amt));
    showNotif(`${amt > 0 ? '+' : ''}${amt} Honor: ${reason}`);
    updateHonorVisuals();
}
function getHonorTier() {
    const h = G.player.honor;
    if (h >= 80) return 'legend';
    if (h >= 20) return 'good';
    if (h > -20) return 'neutral';
    if (h > -80) return 'shady';
    return 'outlaw';
}
function updateHonorVisuals() {
    const bar = document.getElementById('honorBar');
    const rep = document.getElementById('repValue');
    if (!bar) return;
    bar.style.width = ((G.player.honor + 100) / 2) + '%';
    const colors: any = { legend: '#f0c040', good: '#50c878', neutral: '#a0a8b0', shady: '#c07840', outlaw: '#c03030' };
    bar.style.background = colors[getHonorTier()] || '#a0a8b0';
    if (rep) {
        const labels: any = { legend: '★ Leyenda', good: '✦ Hombre de Palabra', neutral: '· Forastero', shady: '⚠ Sombra', outlaw: '☠ Sin Redención' };
        rep.textContent = labels[getHonorTier()] || '· Forastero';
    }
}

// --- THREE.JS SETUP ---
let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
let controls: PointerLockControls;
let raycaster: THREE.Raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, isRunning = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

// --- 3D OBJECT GENERATORS ---
function createCactus() {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
    
    // Main trunk
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 0.8), mat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);
    
    // Left arm
    if (Math.random() > 0.3) {
        const armGeo = new THREE.BoxGeometry(1.2, 0.6, 0.6);
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(-1, 2.5, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        group.add(arm);
        
        const upArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), mat);
        upArm.position.set(-1.3, 3.25, 0);
        upArm.castShadow = true;
        upArm.receiveShadow = true;
        group.add(upArm);
    }
    
    // Right arm
    if (Math.random() > 0.3) {
        const armGeo = new THREE.BoxGeometry(1.2, 0.6, 0.6);
        const arm = new THREE.Mesh(armGeo, mat);
        arm.position.set(1, 1.5, 0);
        arm.castShadow = true;
        arm.receiveShadow = true;
        group.add(arm);
        
        const upArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), mat);
        upArm.position.set(1.3, 2.25, 0);
        upArm.castShadow = true;
        upArm.receiveShadow = true;
        group.add(upArm);
    }
    
    return group;
}

function createRock() {
    const geo = new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.5, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a, flatShading: true });
    const rock = new THREE.Mesh(geo, mat);
    rock.scale.set(1, Math.random() * 0.5 + 0.5, 1);
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
}

function createNPC() {
    const group = new THREE.Group();
    
    // Materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 }); // Red shirt for bandits
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), shirtMat);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMat);
    head.position.y = 2.1;
    head.castShadow = true;
    group.add(head);
    
    // Hat
    const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), hatMat);
    hatBase.position.y = 2.45;
    hatBase.castShadow = true;
    group.add(hatBase);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16), hatMat);
    hatTop.position.y = 2.6;
    hatTop.castShadow = true;
    group.add(hatTop);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.2, 0.6, 0);
    legL.castShadow = true;
    group.add(legL);
    
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.2, 0.6, 0);
    legR.castShadow = true;
    group.add(legR);
    
    // Arms
    const armGeo = new THREE.BoxGeometry(0.3, 1.1, 0.3);
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.55, 1.25, 0);
    armL.castShadow = true;
    group.add(armL);
    
    const armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0.55, 1.25, 0);
    armR.castShadow = true;
    group.add(armR);
    
    return group;
}

function createHorse() {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x5c4033 }); // Brown
    const maneMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a }); // Black mane/tail
    
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.4), mat);
    body.position.y = 1.6;
    body.castShadow = true;
    group.add(body);
    
    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.8), mat);
    neck.position.set(0, 2.4, -1);
    neck.rotation.x = Math.PI / 6;
    neck.castShadow = true;
    group.add(neck);
    
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 1.2), mat);
    head.position.set(0, 3.0, -1.4);
    head.castShadow = true;
    group.add(head);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 1.6, 0.3);
    const positions = [
        [-0.45, 0.8, -0.9], [0.45, 0.8, -0.9], // Front
        [-0.45, 0.8, 0.9], [0.45, 0.8, 0.9]    // Back
    ];
    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        group.add(leg);
    });
    
    // Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.0, 0.2), maneMat);
    tail.position.set(0, 1.6, 1.3);
    tail.rotation.x = -Math.PI / 8;
    tail.castShadow = true;
    group.add(tail);
    
    return group;
}

function createHouse() {
    const group = new THREE.Group();
    
    // Materials
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b }); // Wood
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3018 }); // Dark wood roof
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    
    // Main building
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 6), woodMat);
    body.position.y = 2.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // Roof (Pyramid/Prism)
    const roofGeo = new THREE.ConeGeometry(6, 3, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 6.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    
    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.2), doorMat);
    door.position.set(0, 1.5, 3.05);
    group.add(door);
    
    // Porch floor
    const porch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 3), woodMat);
    porch.position.set(0, 0.1, 4.5);
    porch.receiveShadow = true;
    group.add(porch);
    
    // Porch pillars
    const pillarGeo = new THREE.BoxGeometry(0.3, 4, 0.3);
    const p1 = new THREE.Mesh(pillarGeo, woodMat);
    p1.position.set(-3.8, 2, 5.8);
    p1.castShadow = true;
    group.add(p1);
    
    const p2 = new THREE.Mesh(pillarGeo, woodMat);
    p2.position.set(3.8, 2, 5.8);
    p2.castShadow = true;
    group.add(p2);
    
    // Porch roof
    const pRoof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.3, 3.4), roofMat);
    pRoof.position.set(0, 4, 4.5);
    pRoof.castShadow = true;
    group.add(pRoof);
    
    return group;
}

function createFragment() {
    const geo = new THREE.OctahedronGeometry(0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x008888, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1;
    (mesh as any).isFragment = true;
    return mesh;
}

function init3D() {
    const canvas = (window as any).gameCanvas || document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 2; // Player height

    // Muzzle flash
    G.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 10);
    G.muzzleFlash.position.set(0.5, -0.5, -1);
    camera.add(G.muzzleFlash);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    controls = new PointerLockControls(camera, document.body);
    
    // Click to lock pointer
    document.addEventListener('click', () => {
        if (G.started && !G.monologueOpen && !G.player.dead && !G.inventoryOpen && !G.journalOpen && !G.mapOpen) {
            if (!controls.isLocked) {
                controls.lock();
            } else {
                // Shoot
                if (G.player.ammo > 0 && G.player.shootCooldown <= 0) {
                    G.player.ammo--;
                    G.player.shootCooldown = 0.5;
                    updateAmmoHUD();
                    
                    // Flash effect
                    const flash = document.createElement('div');
                    flash.className = 'fixed inset-0 bg-white z-[999] pointer-events-none transition-opacity duration-100';
                    document.body.appendChild(flash);
                    setTimeout(() => flash.style.opacity = '0', 50);
                    setTimeout(() => flash.remove(), 150);

                    // Raycast
                    const raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                    const intersects = raycaster.intersectObjects(G.npcs, true);
                    
                    if (intersects.length > 0) {
                        let hitNPC = intersects[0].object as any;
                        while (hitNPC.parent && !hitNPC.isNPC) {
                            hitNPC = hitNPC.parent;
                        }
                        if (hitNPC.isNPC && !hitNPC.isDead) {
                            hitNPC.health -= 50;
                            if (hitNPC.health <= 0) {
                                hitNPC.isDead = true;
                                hitNPC.children.forEach((child: any) => {
                                    if (child.material) child.material.color.setHex(0x444444);
                                });
                                hitNPC.rotation.x = -Math.PI / 2;
                                hitNPC.position.y = 0.5;
                                changeHonor(-10, 'Bandido eliminado');
                            } else {
                                showNotif('Bandido herido');
                            }
                        }
                    }
                } else if (G.player.ammo <= 0) {
                    showNotif('Sin munición (R para recargar)');
                }
            }
        }
    });

    scene.add(camera);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Soft white light
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    scene.add(dirLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c }); // Sand color
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Crosshair
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.width = '4px';
    crosshair.style.height = '4px';
    crosshair.style.backgroundColor = 'white';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.borderRadius = '50%';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.zIndex = '100';
    document.body.appendChild(crosshair);

    raycaster = new THREE.Raycaster();

    gen3DWorld();

    document.addEventListener('keydown', (e) => {
        if (G.monologueOpen && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
            (window as any).closeMonologue();
        }
    });

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
}

function gen3DWorld() {
    // Generate Cacti
    for (let i = 0; i < 100; i++) {
        const cactus = createCactus();
        cactus.position.x = Math.random() * 400 - 200;
        cactus.position.z = Math.random() * 400 - 200;
        cactus.position.y = 0;
        (cactus as any).radius = 1;
        scene.add(cactus);
        G.obstacles.push(cactus);
    }

    // Generate Rocks
    for (let i = 0; i < 50; i++) {
        const rock = createRock();
        rock.position.x = Math.random() * 400 - 200;
        rock.position.z = Math.random() * 400 - 200;
        rock.position.y = 0;
        rock.rotation.y = Math.random() * Math.PI;
        (rock as any).radius = 1.5;
        scene.add(rock);
        G.obstacles.push(rock);
    }

    // Generate Town (Houses)
    for (let i = 0; i < 5; i++) {
        const house = createHouse();
        house.position.x = Math.random() * 60 - 30;
        house.position.z = Math.random() * 60 - 30;
        house.position.y = 0;
        house.rotation.y = Math.random() * Math.PI;
        (house as any).radius = 4;
        scene.add(house);
        G.houses.push(house as any);
        G.obstacles.push(house);
    }

    // Generate NPCs (Bandits)
    for (let i = 0; i < 30; i++) {
        const npc = createNPC();
        npc.position.x = Math.random() * 200 - 100;
        npc.position.z = Math.random() * 200 - 100;
        npc.position.y = 0;
        (npc as any).isNPC = true;
        (npc as any).health = 100;
        (npc as any).wanderAngle = Math.random() * Math.PI * 2;
        (npc as any).wanderTimer = 0;
        scene.add(npc);
        G.npcs.push(npc);
    }

    // Generate Fragments
    for (let i = 0; i < 3; i++) {
        const frag = createFragment();
        frag.position.x = Math.random() * 80 - 40;
        frag.position.z = Math.random() * 80 - 40;
        scene.add(frag);
        G.fragments.push(frag);
    }

    // Generate Horse
    const horse = createHorse();
    horse.position.set(5, 0, -5);
    horse.castShadow = true;
    horse.receiveShadow = true;
    scene.add(horse);
    G.horse.mesh = horse;

    // Set mission targets
    G.missions[0].target = G.horse.mesh!.position;
    if (G.fragments.length > 0) {
        G.missions[2].target = G.fragments[0].position;
    }
    if (G.houses.length > 0) {
        G.missions[3].target = G.houses[0].position;
    }
    updateMissionUI();
}

function updateMissionUI() {
    const tracker = document.getElementById('mission-tracker');
    if (!tracker) return;
    
    if (G.currentMission < G.missions.length) {
        const m = G.missions[G.currentMission];
        let progress = '';
        if (m.type === 'kill') {
            progress = ` (${m.currentCount}/${m.targetCount})`;
        }
        let rewardHtml = '';
        if (m.reward) {
            rewardHtml = `<div class="text-[10px] text-[#c8961e]/80 mt-1 uppercase tracking-wider">Recompensa: ${m.reward.text}</div>`;
        }
        tracker.innerHTML = `<div class="bg-black/80 border border-[#c8961e]/50 px-4 py-2 rounded text-[#c8961e] font-cinzel text-sm tracking-wider shadow-[0_0_15px_rgba(200,150,30,0.3)] flex flex-col items-center">
            <div class="flex items-center gap-2"><span class="text-lg">⭐</span> Misión: ${m.text}${progress}</div>
            ${rewardHtml}
        </div>`;
    } else {
        tracker.innerHTML = `<div class="bg-black/80 border border-[#2e8b57]/50 px-4 py-2 rounded text-[#2e8b57] font-cinzel text-sm tracking-wider shadow-[0_0_15px_rgba(46,139,87,0.3)]">
            Todas las misiones completadas
        </div>`;
    }
}

function checkMissions() {
    if (G.currentMission >= G.missions.length) return;
    
    const m = G.missions[G.currentMission];
    let completed = false;
    
    if (m.id === 'horse' && G.player.mounted) {
        completed = true;
    } else if (m.id === 'town' && m.target && camera.position.distanceTo(m.target) < 20) {
        completed = true;
    } else if (m.id === 'bandits' && m.currentCount! >= m.targetCount!) {
        completed = true;
    } else if (m.id === 'fragment' && m.currentCount! >= 1) {
        completed = true;
    }
    
    if (completed) {
        m.completed = true;
        
        // Apply rewards
        if (m.reward) {
            if (m.reward.honor) changeHonor(m.reward.honor, 'Recompensa de misión');
            if (m.reward.ammo) {
                G.player.ammo = Math.min(6, G.player.ammo + m.reward.ammo);
                updateAmmoHUD();
            }
            if (m.reward.health) {
                G.player.health = Math.min(100, G.player.health + m.reward.health);
                updateHealthHUD();
            }
        }
        
        G.currentMission++;
        playMissionCompleteSound();
        const rewardText = m.reward ? `\n<span class="text-[#c8961e] text-sm">Recompensa: ${m.reward.text}</span>` : '';
        showNotif(`¡Misión Completada!${rewardText}`, 5000);
        updateMissionUI();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event: KeyboardEvent) {
    if (!controls.isLocked) return;
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': isRunning = true; break;
        case 'KeyR':
            if (G.player.ammo < 6) {
                G.player.ammo = 6;
                updateAmmoHUD();
                playReloadSound();
                showNotif('Recargado');
            }
            break;
        case 'KeyF':
            // Mount/Dismount
            if (G.player.mounted) {
                G.player.mounted = false;
                camera.position.y = 2; // Normal height
                if (G.horse.mesh) {
                    G.horse.mesh.position.copy(camera.position);
                    G.horse.mesh.position.y = 0;
                    
                    // Place horse slightly in front
                    const dir = new THREE.Vector3();
                    camera.getWorldDirection(dir);
                    dir.y = 0;
                    dir.normalize();
                    G.horse.mesh.position.add(dir.multiplyScalar(3));
                    
                    scene.add(G.horse.mesh);
                }
                showNotif('Desmontado');
            } else {
                if (G.horse.mesh && camera.position.distanceTo(G.horse.mesh.position) < 5) {
                    G.player.mounted = true;
                    camera.position.y = 3.5; // Horse height
                    scene.remove(G.horse.mesh); // Hide horse while riding
                    showNotif('Montado en Ceniza');
                }
            }
            break;
        case 'KeyE':
            if (G.interactTarget && !G.interactTarget.isDead) {
                if (G.interactTarget.isFragment) {
                    scene.remove(G.interactTarget);
                    G.fragments = G.fragments.filter(f => f !== G.interactTarget);
                    G.interactTarget = null;
                    const hint = document.getElementById('interactHint');
                    if (hint) hint.style.opacity = '0';
                    
                    // Update stats
                    const statFrags = document.getElementById('map-stat-fragments');
                    if (statFrags) statFrags.textContent = (parseInt(statFrags.textContent || '0') + 1).toString();
                    
                    // Update mission
                    if (G.currentMission < G.missions.length && G.missions[G.currentMission].id === 'fragment') {
                        G.missions[G.currentMission].currentCount = 1;
                        checkMissions();
                    }
                    
                    showNotif('Fragmento recogido');
                    playMissionCompleteSound();
                } else if (!G.monologueOpen) {
                    G.monologueOpen = true;
                    const m = document.getElementById('monologue-screen');
                    if (m) m.classList.add('visible');
                    const text = document.getElementById('monologueText');
                    if (text) text.textContent = '"¿Qué miras, forastero? Sigue tu camino."';
                    const attr = document.getElementById('monologueAttr');
                    if (attr) attr.textContent = '— Bandido';
                    controls.unlock();
                }
            }
            break;
        case 'KeyC':
            if (!G.monologueOpen) {
                G.monologueOpen = true;
                const m = document.getElementById('monologue-screen');
                if (m) m.classList.add('visible');
                const text = document.getElementById('monologueText');
                if (text) text.textContent = '"El desierto en 3D... una nueva perspectiva."';
                const attr = document.getElementById('monologueAttr');
                if (attr) attr.textContent = '— Pensamientos al fuego';
                controls.unlock();
            }
            break;
        case 'KeyJ':
            if (!G.journalOpen && !G.inventoryOpen && !G.mapOpen && !G.monologueOpen) {
                G.journalOpen = true;
                const j = document.getElementById('journal');
                if (j) j.classList.add('visible');
                controls.unlock();
                
                // Populate journal
                const jBody = document.getElementById('journalBody');
                if (jBody) {
                    let missionsHtml = '<div class="mt-6 mb-2 font-cinzel text-[#c8961e] text-xl border-b border-[#b4823c]/40 pb-1">Registro de Misiones</div>';
                    
                    for (let idx = 0; idx < G.missions.length; idx++) {
                        const m = G.missions[idx];
                        // Only show completed missions, the current mission, and maybe the next one if we want, but let's just show up to currentMission
                        if (idx <= G.currentMission) {
                            const isCurrent = idx === G.currentMission;
                            const statusColor = m.completed ? 'text-green-600/80' : (isCurrent ? 'text-[#c8961e]' : 'text-[#d2b482]/60');
                            const statusIcon = m.completed ? '✓' : (isCurrent ? '○' : '·');
                            const titleColor = m.completed ? 'text-[#d2b482]/60 line-through' : 'text-[#d2b482]';
                            
                            let progress = '';
                            if (m.type === 'kill' && !m.completed) {
                                progress = ` <span class="text-sm text-[#b4823c]/80">(${m.currentCount}/${m.targetCount})</span>`;
                            }
                            
                            missionsHtml += `
                                <div class="mb-3 p-3 bg-black/20 border border-[#b4823c]/20 rounded-sm">
                                    <div class="flex items-start gap-3">
                                        <div class="font-cinzel ${statusColor} text-lg mt-0.5">${statusIcon}</div>
                                        <div class="flex-1">
                                            <div class="font-cinzel ${titleColor} text-md">${m.text}${progress}</div>
                                            <div class="font-crimson text-[#b4823c]/70 text-sm mt-1">Recompensa: ${m.reward.text}</div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    }

                    jBody.innerHTML = `
                        <div class="mb-4 pb-2 border-b border-[#b4823c]/20">
                            <div class="font-cinzel text-[#c8961e] text-lg mb-1">El Desierto de Ceniza</div>
                            <div class="font-crimson text-[#d2b482]/80 italic">Día 1</div>
                            <div class="font-crimson text-[#d2b482] mt-2 leading-relaxed">
                                He llegado a este lugar olvidado por Dios. Los bandidos merodean por las dunas. Debo tener cuidado.
                                Mi caballo, Ceniza, es mi única compañía.
                            </div>
                        </div>
                        ${missionsHtml}
                    `;
                }
            } else if (G.journalOpen) {
                (window as any).closeJournal();
            }
            break;
        case 'KeyI':
            if (!G.inventoryOpen && !G.journalOpen && !G.mapOpen && !G.monologueOpen) {
                G.inventoryOpen = true;
                const i = document.getElementById('inventory');
                if (i) i.classList.add('visible');
                controls.unlock();
                
                // Populate inventory
                const invGrid = document.getElementById('invGrid');
                if (invGrid) {
                    invGrid.innerHTML = `
                        <div class="aspect-square bg-black/40 border border-[#b4823c]/30 flex items-center justify-center cursor-pointer hover:bg-[#b4823c]/20 transition-colors" onclick="document.getElementById('invDetailName').textContent='Revólver'; document.getElementById('invDetailText').textContent='Un viejo revólver de seis tiros. Confiable.'">
                            <span class="text-2xl">🔫</span>
                        </div>
                        <div class="aspect-square bg-black/40 border border-[#b4823c]/30 flex items-center justify-center cursor-pointer hover:bg-[#b4823c]/20 transition-colors" onclick="document.getElementById('invDetailName').textContent='Munición'; document.getElementById('invDetailText').textContent='Balas calibre .45.'">
                            <span class="text-2xl">🪙</span>
                        </div>
                        <div class="aspect-square bg-black/40 border border-[#b4823c]/30 flex items-center justify-center cursor-pointer hover:bg-[#b4823c]/20 transition-colors" onclick="document.getElementById('invDetailName').textContent='Cantimplora'; document.getElementById('invDetailText').textContent='Agua fresca. Vital en el desierto.'">
                            <span class="text-2xl">💧</span>
                        </div>
                    `;
                }
            } else if (G.inventoryOpen) {
                (window as any).closeInventory();
            }
            break;
        case 'KeyM':
            if (!G.mapOpen && !G.inventoryOpen && !G.journalOpen && !G.monologueOpen) {
                G.mapOpen = true;
                const m = document.getElementById('world-map');
                if (m) m.classList.remove('hidden');
                if (m) m.classList.add('flex');
                controls.unlock();
                
                // Draw map
                const mapCanvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
                if (mapCanvas) {
                    mapCanvas.width = mapCanvas.clientWidth;
                    mapCanvas.height = mapCanvas.clientHeight;
                    const ctx = mapCanvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#0e0a05';
                        ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
                        
                        // Draw player
                        ctx.fillStyle = '#c8961e';
                        ctx.beginPath();
                        ctx.arc(mapCanvas.width / 2, mapCanvas.height / 2, 5, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw NPCs
                        ctx.fillStyle = '#8b0000';
                        for (const npc of G.npcs) {
                            if (!npc.isDead) {
                                const nx = mapCanvas.width / 2 + (npc.position.x - camera.position.x) * 2;
                                const ny = mapCanvas.height / 2 + (npc.position.z - camera.position.z) * 2;
                                ctx.beginPath();
                                ctx.arc(nx, ny, 3, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                        
                        // Draw Houses
                        ctx.fillStyle = '#4a3018';
                        for (const house of G.houses) {
                            const hx = mapCanvas.width / 2 + (house.position.x - camera.position.x) * 2;
                            const hy = mapCanvas.height / 2 + (house.position.z - camera.position.z) * 2;
                            ctx.fillRect(hx - 4, hy - 4, 8, 8);
                        }
                        
                        // Draw Horse
                        if (!G.player.mounted && G.horse.mesh) {
                            ctx.fillStyle = '#5c4033';
                            const hx = mapCanvas.width / 2 + (G.horse.mesh.position.x - camera.position.x) * 2;
                            const hy = mapCanvas.height / 2 + (G.horse.mesh.position.z - camera.position.z) * 2;
                            ctx.beginPath();
                            ctx.arc(hx, hy, 4, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = '#c8961e';
                            ctx.stroke();
                        }
                        
                        // Draw Mission Target
                        if (G.currentMission < G.missions.length) {
                            const m = G.missions[G.currentMission];
                            if (m.target) {
                                const tx = mapCanvas.width / 2 + (m.target.x - camera.position.x) * 2;
                                const ty = mapCanvas.height / 2 + (m.target.z - camera.position.z) * 2;
                                ctx.fillStyle = '#ffff00';
                                ctx.beginPath();
                                ctx.arc(tx, ty, 6, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.strokeStyle = '#000';
                                ctx.stroke();
                            }
                        }
                    }
                    
                    // Update stats
                    const statMissions = document.getElementById('map-stat-missions');
                    if (statMissions) statMissions.textContent = `${G.currentMission}/${G.missions.length}`;
                    const statTime = document.getElementById('map-stat-time');
                    if (statTime) {
                        const h = Math.floor(G.time * 24);
                        const m = Math.floor((G.time * 24 * 60) % 60);
                        statTime.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    }
                }
            } else if (G.mapOpen) {
                (window as any).closeWorldMap();
            }
            break;
        case 'KeyK':
            showNotif('Partida guardada correctamente');
            break;
    }
}

function onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isRunning = false; break;
    }
}

function createImpact(position: THREE.Vector3, normal: THREE.Vector3) {
    const geo = new THREE.PlaneGeometry(0.3, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 1, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.position.add(normal.clone().multiplyScalar(0.01));
    mesh.lookAt(position.clone().add(normal));
    scene.add(mesh);
    
    G.effects.push({
        mesh,
        life: 0.2, // 0.2 seconds
        type: 'impact'
    });
}

function onMouseDown(event: MouseEvent) {
    if (!controls.isLocked || G.player.dead) return;
    if (event.button === 0) {
        if (G.player.ammo > 0 && G.player.shootCooldown <= 0) {
            G.player.ammo--;
            G.player.shootCooldown = 0.5; // seconds
            updateAmmoHUD();
            playGunshot();
            
            if (G.muzzleFlash) {
                G.muzzleFlash.intensity = 5;
            }

            // Raycast for shooting
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            
            if (intersects.length > 0) {
                const hit = intersects[0];
                createImpact(hit.point, hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0));
                
                let obj = hit.object as any;
                while (obj.parent && !obj.isNPC) {
                    obj = obj.parent;
                }
                if (obj.isNPC && !obj.isDead) {
                    obj.health -= 50;
                    playHitSound();
                    if (obj.health <= 0) {
                        obj.isDead = true;
                        if (obj.children) {
                            obj.children.forEach((child: any) => {
                                if (child.material) child.material.color.setHex(0x444444);
                            });
                        } else if (obj.material) {
                            obj.material.color.setHex(0x444444); // Turn gray when dead
                        }
                        obj.rotation.z = Math.PI / 2; // Fall over
                        obj.position.y = 0.5;
                        changeHonor(-10, 'Asesinato');
                        
                        // Update mission if active
                        if (G.currentMission < G.missions.length && G.missions[G.currentMission].id === 'bandits') {
                            G.missions[G.currentMission].currentCount!++;
                            updateMissionUI();
                            checkMissions();
                        }
                    }
                }
            }
            
            if (G.player.ammo === 0) showNotif('¡Sin balas! [ R ] para recargar');
        }
    }
}

function updateHUD(delta: number, time: number) {
    const hint = document.getElementById('interactHint');
    if (hint) {
        let nearNPC = null;
        for (const npc of G.npcs) {
            if (!npc.isDead && camera.position.distanceTo(npc.position) < 5) {
                nearNPC = npc;
                break;
            }
        }
        
        let nearFrag = null;
        if (!nearNPC) {
            for (const frag of G.fragments) {
                if (camera.position.distanceTo(frag.position) < 5) {
                    nearFrag = frag;
                    break;
                }
            }
        }

        if (nearNPC) {
            hint.textContent = '[ E ] Hablar con Bandido';
            hint.style.opacity = '1';
            G.interactTarget = nearNPC;
        } else if (nearFrag) {
            hint.textContent = '[ E ] Recoger Fragmento';
            hint.style.opacity = '1';
            G.interactTarget = nearFrag;
        } else if (!G.player.mounted && G.horse.mesh && camera.position.distanceTo(G.horse.mesh.position) < 5) {
            hint.textContent = '[ F ] Montar a Ceniza';
            hint.style.opacity = '1';
            G.interactTarget = null;
        } else if (G.player.mounted) {
            hint.textContent = '[ F ] Desmontar';
            hint.style.opacity = '1';
            G.interactTarget = null;
        } else {
            hint.style.opacity = '0';
            G.interactTarget = null;
        }
    }

    if (G.player.mounted && (moveForward || moveBackward || moveLeft || moveRight)) {
        G.gallopTimer -= delta;
        if (isRunning) {
            G.horse.stamina = Math.max(0, G.horse.stamina - 0.5);
            if (G.gallopTimer <= 0) {
                playGallopSound();
                G.gallopTimer = 0.25; // Faster gallop
            }
        } else {
            G.horse.stamina = Math.min(100, G.horse.stamina + 0.2);
            if (G.gallopTimer <= 0) {
                playGallopSound();
                G.gallopTimer = 0.5; // Slower walk
            }
        }
    } else {
        G.horse.stamina = Math.min(100, G.horse.stamina + 0.2);
    }
    const sb = document.getElementById('staminaBar');
    if (sb) sb.style.width = G.horse.stamina + '%';
    const sr = document.getElementById('staminaRow');
    if (sr) sr.style.opacity = G.player.mounted ? '1' : '0';

    // Animate fragments
    for (const frag of G.fragments) {
        frag.rotation.y += delta;
        frag.rotation.x += delta * 0.5;
        frag.position.y = 1 + Math.sin(time * 0.003 + frag.position.x) * 0.2;
    }

    // Draw minimap
    const mCanvas = (window as any).minimapCanvas as HTMLCanvasElement;
    if (mCanvas) {
        const ctx = mCanvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, mCanvas.width, mCanvas.height);
            
            const cx = mCanvas.width / 2;
            const cy = mCanvas.height / 2;
            const scale = 1.5; // Zoom level

            ctx.save();
            ctx.translate(cx, cy);
            // Rotate map so player's view is always UP
            ctx.rotate(camera.rotation.y);
            
            // Draw grid
            ctx.strokeStyle = 'rgba(180, 130, 60, 0.15)';
            ctx.lineWidth = 1;
            const gridSize = 20;
            const offsetX = (camera.position.x * scale) % gridSize;
            const offsetZ = (camera.position.z * scale) % gridSize;
            
            ctx.beginPath();
            for (let x = -cx - gridSize; x < cx + gridSize; x += gridSize) {
                ctx.moveTo(x - offsetX, -cy);
                ctx.lineTo(x - offsetX, cy);
            }
            for (let z = -cy - gridSize; z < cy + gridSize; z += gridSize) {
                ctx.moveTo(-cx, z - offsetZ);
                ctx.lineTo(cx, z - offsetZ);
            }
            ctx.stroke();

            // Draw player vision cone
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, cx, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6);
            ctx.lineTo(0, 0);
            ctx.fill();
            
            // Draw NPCs
            ctx.fillStyle = '#ff3333'; // Brighter red
            for (const npc of G.npcs) {
                if (!npc.isDead) {
                    const dx = (npc.position.x - camera.position.x) * scale;
                    const dz = (npc.position.z - camera.position.z) * scale;
                    // Only draw if within radius
                    if (dx*dx + dz*dz < (cx*cx)) {
                        ctx.beginPath();
                        ctx.arc(dx, dz, 3, 0, Math.PI * 2);
                        ctx.fill();
                        // Draw small outline
                        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
            
            // Draw Houses
            ctx.fillStyle = '#4a3018';
            for (const house of G.houses) {
                const dx = (house.position.x - camera.position.x) * scale;
                const dz = (house.position.z - camera.position.z) * scale;
                if (dx*dx + dz*dz < (cx*cx)) {
                    ctx.fillRect(dx - 4, dz - 4, 8, 8);
                    ctx.strokeStyle = 'rgba(200, 150, 30, 0.3)';
                    ctx.strokeRect(dx - 4, dz - 4, 8, 8);
                }
            }

            // Draw horse
            if (!G.player.mounted && G.horse.mesh) {
                ctx.fillStyle = '#c8961e';
                const dx = (G.horse.mesh.position.x - camera.position.x) * scale;
                const dz = (G.horse.mesh.position.z - camera.position.z) * scale;
                if (dx*dx + dz*dz < (cx*cx)) {
                    ctx.beginPath();
                    ctx.arc(dx, dz, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
            
            // Draw current mission target
            if (G.currentMission < G.missions.length) {
                const m = G.missions[G.currentMission];
                if (m.target) {
                    const dx = (m.target.x - camera.position.x) * scale;
                    const dz = (m.target.z - camera.position.z) * scale;
                    // Clamp to edge if outside map
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    let drawX = dx;
                    let drawZ = dz;
                    if (dist > cx - 8) {
                        drawX = (dx / dist) * (cx - 8);
                        drawZ = (dz / dist) * (cx - 8);
                    }
                    
                    const pulse = (Math.sin(performance.now() / 150) + 1) / 2; // 0 to 1
                    
                    ctx.fillStyle = `rgba(255, 255, 0, ${0.4 + pulse * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(drawX, drawZ, 4 + pulse * 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            
            ctx.restore();

            // Draw compass directions (N, S, E, W)
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(camera.rotation.y);
            
            // Draw a subtle ring for the compass
            ctx.beginPath();
            ctx.arc(0, 0, cx - 12, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200, 150, 30, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#c8961e';
            ctx.font = 'bold 12px Cinzel';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('N', 0, -cy + 12);
            
            ctx.fillStyle = 'rgba(200, 150, 30, 0.6)';
            ctx.font = '10px Cinzel';
            ctx.fillText('S', 0, cy - 12);
            ctx.fillText('E', cx - 12, 0);
            ctx.fillText('W', -cx + 12, 0);
            ctx.restore();

            // Draw player (fixed in center, pointing UP)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.lineTo(cx + 4, cy + 4);
            ctx.lineTo(cx - 4, cy + 4);
            ctx.fill();
            // Player outline
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.lineTo(cx + 4, cy + 4);
            ctx.lineTo(cx - 4, cy + 4);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    checkMissions();
}

function getAvoidanceForce(pos: THREE.Vector3) {
    const force = new THREE.Vector3();
    for (const obs of G.obstacles) {
        const radius = (obs as any).radius || 1;
        const dist = pos.distanceTo(obs.position);
        const minDistance = radius + 2; // 2 units buffer
        if (dist < minDistance && dist > 0) {
            const repulsion = pos.clone().sub(obs.position).normalize();
            repulsion.y = 0;
            // Stronger force the closer they are
            repulsion.multiplyScalar((minDistance - dist) / minDistance);
            force.add(repulsion);
        }
    }
    return force;
}

function loop() {
    requestAnimationFrame(loop);

    if (!G.started || G.player.dead) return;

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (G.player.shootCooldown > 0) {
        G.player.shootCooldown -= delta;
    }
    
    // Update Muzzle Flash
    if (G.muzzleFlash && G.muzzleFlash.intensity > 0) {
        G.muzzleFlash.intensity -= delta * 50;
        if (G.muzzleFlash.intensity < 0) G.muzzleFlash.intensity = 0;
    }
    
    // Update Effects
    for (let i = G.effects.length - 1; i >= 0; i--) {
        const effect = G.effects[i];
        effect.life -= delta;
        if (effect.life <= 0) {
            scene.remove(effect.mesh);
            G.effects.splice(i, 1);
        } else {
            if (effect.type === 'impact') {
                effect.mesh.scale.setScalar(1 + (0.2 - effect.life) * 5);
                effect.mesh.material.opacity = effect.life / 0.2;
            }
        }
    }

    if (controls.isLocked) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        let speed = G.player.mounted ? (isRunning && G.horse.stamina > 5 ? 200 : 100) : (isRunning ? 80 : 40);

        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Basic collision with ground
        if (camera.position.y < (G.player.mounted ? 3.5 : 2)) {
            velocity.y = 0;
            camera.position.y = (G.player.mounted ? 3.5 : 2);
        }
    }

    // NPC Logic
    for (const npc of G.npcs) {
        if (!npc.isDead) {
            const distToPlayer = npc.position.distanceTo(camera.position);
            
            if (distToPlayer < 15) {
                // Attack player
                npc.rotation.y = Math.atan2(camera.position.x - npc.position.x, camera.position.z - npc.position.z);
                
                if (distToPlayer > 3) {
                    // Move towards player with obstacle avoidance
                    const npcSpeed = 3;
                    const desiredDir = new THREE.Vector3(
                        camera.position.x - npc.position.x,
                        0,
                        camera.position.z - npc.position.z
                    ).normalize();
                    
                    const avoidance = getAvoidanceForce(npc.position);
                    desiredDir.add(avoidance.multiplyScalar(2)).normalize();
                    
                    npc.position.x += desiredDir.x * npcSpeed * delta;
                    npc.position.z += desiredDir.z * npcSpeed * delta;
                    
                    // Update rotation to face movement direction
                    npc.rotation.y = Math.atan2(desiredDir.x, desiredDir.z);
                } else {
                    // Attack
                    if (!npc.attackCooldown || npc.attackCooldown <= 0) {
                        G.player.health -= 10;
                        updateHealthHUD();
                        playHitSound();
                        showNotif('¡Te están atacando!');
                        npc.attackCooldown = 1.5;
                        
                        // Flash red
                        const flash = document.createElement('div');
                        flash.className = 'fixed inset-0 bg-red-500/30 z-[999] pointer-events-none transition-opacity duration-100';
                        document.body.appendChild(flash);
                        setTimeout(() => flash.style.opacity = '0', 50);
                        setTimeout(() => flash.remove(), 150);
                        
                        if (G.player.health <= 0) {
                            G.player.dead = true;
                            controls.unlock();
                            showNotif('Has muerto.');
                            const ts = document.getElementById('title-screen');
                            if (ts) {
                                ts.classList.remove('opacity-0', 'pointer-events-none');
                                ts.querySelector('h2')?.remove();
                                const h2 = document.createElement('h2');
                                h2.className = 'font-cinzel text-red-500 text-center mb-5 text-4xl tracking-[0.2em]';
                                h2.textContent = 'HAS MUERTO';
                                ts.insertBefore(h2, ts.firstChild);
                            }
                        }
                    }
                }
            } else {
                // Wander
                npc.wanderTimer -= delta;
                if (npc.wanderTimer <= 0) {
                    npc.wanderAngle = Math.random() * Math.PI * 2;
                    npc.wanderTimer = 2 + Math.random() * 3;
                }
                // Move NPC with obstacle avoidance
                const npcSpeed = 2;
                const desiredDir = new THREE.Vector3(
                    Math.cos(npc.wanderAngle),
                    0,
                    Math.sin(npc.wanderAngle)
                ).normalize();
                
                const avoidance = getAvoidanceForce(npc.position);
                if (avoidance.lengthSq() > 0) {
                    // If avoiding, change wander angle to match new direction
                    desiredDir.add(avoidance.multiplyScalar(2)).normalize();
                    npc.wanderAngle = Math.atan2(desiredDir.z, desiredDir.x);
                }
                
                npc.position.x += desiredDir.x * npcSpeed * delta;
                npc.position.z += desiredDir.z * npcSpeed * delta;
                
                // Keep within bounds
                if (npc.position.x > 100) npc.position.x = 100;
                if (npc.position.x < -100) npc.position.x = -100;
                if (npc.position.z > 100) npc.position.z = 100;
                if (npc.position.z < -100) npc.position.z = -100;
                
                // Face direction of movement
                npc.rotation.y = -npc.wanderAngle + Math.PI / 2;
            }
            
            if (npc.attackCooldown > 0) {
                npc.attackCooldown -= delta;
            }
        }
    }

    updateHUD(delta, time);

    renderer.render(scene, camera);
    prevTime = time;
}

export function initGame(canvas: HTMLCanvasElement, minimap: HTMLCanvasElement) {
    // We don't start immediately, we wait for the user to click "Nueva Partida"
    // But we can store the canvas references if needed.
    // The actual 3D init happens in startGame()
    (window as any).gameCanvas = canvas;
    (window as any).minimapCanvas = minimap;
}

function startBackgroundMusic() {
    if (!audioCtx || !masterGain) return;
    
    // 1. Ambient Wind (White Noise + Lowpass Filter)
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    const windFilter = audioCtx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400; // Low rumble
    
    // Modulate wind filter frequency
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Very slow
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start();
    
    const windGain = audioCtx.createGain();
    windGain.gain.value = 0.05; // Quiet wind
    
    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    whiteNoise.start();
    
    // 2. Occasional Western Whistle
    function playWhistle() {
        if (!audioCtx || !masterGain) return;
        
        // Random western note (E minor pentatonic: E3, G3, A3, B3, D4, E4)
        const notes = [164.81, 196.00, 220.00, 246.94, 293.66, 329.63];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // Ennio Morricone style whistle (sine/triangle)
        osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        // Slide up/down sometimes
        if (Math.random() > 0.7) {
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, audioCtx.currentTime + 0.5);
        } else if (Math.random() > 0.7) {
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioCtx.currentTime + 0.5);
        }
        
        // Envelope
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.0);
        
        // Reverb effect (simple delay)
        const delay = audioCtx.createDelay();
        delay.delayTime.value = 0.4;
        const feedback = audioCtx.createGain();
        feedback.gain.value = 0.4;
        delay.connect(feedback);
        feedback.connect(delay);
        
        osc.connect(gain);
        gain.connect(masterGain);
        gain.connect(delay);
        delay.connect(masterGain);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 2.5);
        
        // Schedule next whistle
        setTimeout(playWhistle, 4000 + Math.random() * 8000);
    }
    
    // Start whistling after a delay
    setTimeout(playWhistle, 2000);
}

export function startGame(tutorial = false) {
    initAudio();
    startBackgroundMusic();
    const ts = document.getElementById('title-screen');
    if (ts) ts.classList.add('opacity-0', 'pointer-events-none');

    init3D();

    setTimeout(() => {
        if (ts) ts.style.display = 'none';
        const ui = document.getElementById('game-ui');
        if (ui) ui.classList.add('visible');
        const bt = document.getElementById('barTop');
        if (bt) bt.classList.add('active');
        const bb = document.getElementById('barBottom');
        if (bb) bb.classList.add('active');
        
        updateHonorVisuals();
        updateAmmoHUD();
        G.started = true;
        
        showNotif('Haz clic para jugar (WASD para mover, Ratón para mirar)');

        requestAnimationFrame(loop);
    }, 1000);
}

// Attach to window for HTML buttons
(window as any).startGame = startGame;
(window as any).closeTutorial = () => {
    const tut = document.getElementById('tutorial-overlay');
    if (tut) {
        tut.classList.add('hidden');
        tut.classList.remove('flex');
    }
};
(window as any).closeMonologue = () => {
    const m = document.getElementById('monologue-screen');
    if (m) m.classList.remove('visible');
    G.monologueOpen = false;
    if (G.started && !G.inventoryOpen && !G.journalOpen && !G.mapOpen) controls.lock();
};
(window as any).closeInventory = () => {
    G.inventoryOpen = false;
    const i = document.getElementById('inventory');
    if (i) i.classList.remove('visible');
    if (G.started && !G.monologueOpen && !G.journalOpen && !G.mapOpen) controls.lock();
};
(window as any).closeJournal = () => {
    G.journalOpen = false;
    const j = document.getElementById('journal');
    if (j) j.classList.remove('visible');
    if (G.started && !G.monologueOpen && !G.inventoryOpen && !G.mapOpen) controls.lock();
};
(window as any).closeWorldMap = () => {
    G.mapOpen = false;
    const m = document.getElementById('world-map');
    if (m) m.classList.add('hidden');
    if (m) m.classList.remove('flex');
    if (G.started && !G.monologueOpen && !G.inventoryOpen && !G.journalOpen) controls.lock();
};
(window as any).setMapTab = () => {};
(window as any).useSelectedItem = () => {};
(window as any).loadGame = () => { showNotif("Cargar partida no implementado en 3D"); };
