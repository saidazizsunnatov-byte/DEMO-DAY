// BLOOKLAR (Personajlar) ro'yxati va ularning vizual parametrlar
const BLOOKS = [
    {
        id: 'gold_dragon',
        name: 'Oltin Ajdaho (Gold Dragon)',
        rarity: 'Chroma',
        color: '#f59e0b',
        secondaryColor: '#b45309',
        faceEmoji: '🐉',
        ears: 'horns',
        description: 'Afsonaviy oltin ajdaho, xazinalar sohibi!',
        glowColor: 0xffd700
    },
    {
        id: 'cyber_bot',
        name: 'Kiber Robot (Cyber Bot)',
        rarity: 'Legendary',
        color: '#06b6d4',
        secondaryColor: '#0e7490',
        faceEmoji: '🤖',
        ears: 'antenna',
        description: 'Yuqori intellektli kiber texnologiya blooki.',
        glowColor: 0x00ffff
    },
    {
        id: 'ninja_cat',
        name: 'Ninja Mushuk (Ninja Cat)',
        rarity: 'Epic',
        color: '#1e293b',
        secondaryColor: '#e11d48',
        faceEmoji: '🐱',
        ears: 'cat',
        description: 'Tungi soyalarda chaqqon harakatlanuvchi jangchi.',
        glowColor: 0xff0055
    },
    {
        id: 'wizard',
        name: 'Sehrgar Bobo (Wizard)',
        rarity: 'Epic',
        color: '#8b5cf6',
        secondaryColor: '#6d28d9',
        faceEmoji: '🧙‍♂️',
        ears: 'hat',
        description: 'Qadimiy afsunlar va sehrli sandiqlar bilimdoni.',
        glowColor: 0xa855f7
    },
    {
        id: 'astro_bear',
        name: 'Koinot Ayig\'i (Astro Bear)',
        rarity: 'Rare',
        color: '#3b82f6',
        secondaryColor: '#1d4ed8',
        faceEmoji: '🐻',
        ears: 'bear',
        description: 'Yulduzlararo sayohat qiluvchi dovyurak ayiq.',
        glowColor: 0x60a5fa
    },
    {
        id: 'dino_rex',
        name: 'Dino Reks (Rex)',
        rarity: 'Rare',
        color: '#10b981',
        secondaryColor: '#047857',
        faceEmoji: '🦖',
        ears: 'spikes',
        description: 'Tarixdan ilgarigi qudratli yashil dinozavr.',
        glowColor: 0x34d399
    },
    {
        id: 'pirate_parrot',
        name: 'Qaroqchi To\'ti (Pirate)',
        rarity: 'Uncommon',
        color: '#ef4444',
        secondaryColor: '#b91c1c',
        faceEmoji: '🦜',
        ears: 'bandana',
        description: 'Dengiz qaroqchisi, oltinlarga juda o\'ch!',
        glowColor: 0xf87171
    },
    {
        id: 'smart_owl',
        name: 'Dono Boyo\'g\'li (Smart Owl)',
        rarity: 'Common',
        color: '#a855f7',
        secondaryColor: '#7e22ce',
        faceEmoji: '🦉',
        ears: 'glasses',
        description: 'Barcha savollarga to\'g\'ri javobni biladi.',
        glowColor: 0xc084fc
    }
];

// 3D Canvas yuz teksturasini generatsiya qilish
function createBlookFaceTexture(blook) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Asosiy fon
    ctx.fillStyle = blook.color;
    ctx.fillRect(0, 0, 256, 256);

    // Naqsh / ichki kvadrat
    ctx.fillStyle = blook.secondaryColor;
    ctx.fillRect(16, 16, 224, 224);
    ctx.fillStyle = blook.color;
    ctx.fillRect(28, 28, 200, 200);

    // Katta yuz ifodasi (Emoji)
    ctx.font = '120px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(blook.faceEmoji, 128, 128);

    if (typeof THREE !== 'undefined') {
        return new THREE.CanvasTexture(canvas);
    }
    return null;
}

// Boshqa tomonlar uchun kub teksturasi
function createBlookSideTexture(color, secondaryColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 116, 116);

    if (typeof THREE !== 'undefined') {
        return new THREE.CanvasTexture(canvas);
    }
    return null;
}

window.BLOOKS = BLOOKS;
window.createBlookFaceTexture = createBlookFaceTexture;
window.createBlookSideTexture = createBlookSideTexture;
