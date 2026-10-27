// O'yin viktorina savollari bazasi
const DEFAULT_QUESTIONS = [
    {
        id: 1,
        question: "7 × 8 nechiga teng?",
        options: ["54", "56", "64", "48"],
        answer: 1, // index 1 = "56"
        category: "Matematika"
    },
    {
        id: 2,
        question: "O'zbekiston poytaxti qaysi shahar?",
        options: ["Samarqand", "Buxoro", "Toshkent", "Xiva"],
        answer: 2,
        category: "Geografiya"
    },
    {
        id: 3,
        question: "Veb-sahifaning asosiy tuzilishi (skeleti) qaysi tilda yoziladi?",
        options: ["CSS", "HTML", "Python", "SQL"],
        answer: 1,
        category: "IT / Dasturlash"
    },
    {
        id: 4,
        question: "Quyosh sistemasidagi eng katta sayyora qaysi?",
        options: ["Mars", "Venera", "Saturn", "Yupiter"],
        answer: 3,
        category: "Astronomiya"
    },
    {
        id: 5,
        question: "100 ning 25 foizi (25%) qancha bo'ladi?",
        options: ["20", "25", "50", "15"],
        answer: 1,
        category: "Matematika"
    },
    {
        id: 6,
        question: "Alisher Navoiy qaysi asrda yashab ijod etgan?",
        options: ["XIV asr", "XV asr", "XVI asr", "XVII asr"],
        answer: 1,
        category: "Tarix & Adabiyot"
    },
    {
        id: 7,
        question: "Kompyuterning asosiy 'miyasi' deb qaysi qurilma aytiladi?",
        options: ["Monitor", "Videokarta", "Protsessor (CPU)", "Operativ xotira (RAM)"],
        answer: 2,
        category: "IT / Texnologiya"
    },
    {
        id: 8,
        question: "1 soatda necha sekund bor?",
        options: ["3600", "600", "1200", "7200"],
        answer: 0,
        category: "Mantiq"
    },
    {
        id: 9,
        question: "Yer sharining eng chuqur cho'kmasi nima deb ataladi?",
        options: ["Baykal", "Mariana cho'kmasi", "Kaspiy", "Bermud uchburchagi"],
        answer: 1,
        category: "Geografiya"
    },
    {
        id: 10,
        question: "Dunyodagi eng tez yuguruvchi quruqlikdagi jonivor qaysi?",
        options: ["Sher", "Gepard", "Bo'ri", "Kiyik"],
        answer: 1,
        category: "Tabiat"
    },
    {
        id: 11,
        question: "Algoritm so'zi qaysi buyuk alloma nomi bilan bog'liq?",
        options: ["Ibn Sino", "Al-Xorazmiy", "Beruniy", "Mirzo Ulug'bek"],
        answer: 1,
        category: "Tarix"
    },
    {
        id: 12,
        question: "1 bayt (byte) necha bitga teng?",
        options: ["4 bit", "8 bit", "16 bit", "32 bit"],
        answer: 1,
        category: "IT / Dasturlash"
    },
    {
        id: 13,
        question: "Uchburchakning ichki burchaklari yig'indisi necha gradus?",
        options: ["90°", "180°", "270°", "360°"],
        answer: 1,
        category: "Geometriya"
    },
    {
        id: 14,
        question: "Eng kichik tub son qaysi?",
        options: ["0", "1", "2", "3"],
        answer: 2,
        category: "Matematika"
    },
    {
        id: 15,
        question: "Amir Temur tavallud topgan shahar?",
        options: ["Samarqand", "Shahrisabz (Kesh)", "Toshkent", "Buxoro"],
        answer: 1,
        category: "Tarix"
    }
];

// O'yinchi o'z savollarini qo'shishi mumkin
class QuestionManager {
    constructor() {
        this.questions = [...DEFAULT_QUESTIONS];
        this.loadCustomQuestions();
    }

    loadCustomQuestions() {
        try {
            const saved = localStorage.getItem('blookhit_custom_questions');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.questions = [...DEFAULT_QUESTIONS, ...parsed];
                }
            }
        } catch (e) {
            console.warn("Savollarni o'qishda xatolik", e);
        }
    }

    addQuestion(questionText, options, answerIndex, category = "Maxsus") {
        const newQ = {
            id: Date.now(),
            question: questionText,
            options: options,
            answer: answerIndex,
            category: category
        };
        this.questions.push(newQ);
        try {
            const saved = localStorage.getItem('blookhit_custom_questions');
            const list = saved ? JSON.parse(saved) : [];
            list.push(newQ);
            localStorage.setItem('blookhit_custom_questions', JSON.stringify(list));
        } catch (e) {
            console.error(e);
        }
        return newQ;
    }

    getRandomQuestion(excludeIds = []) {
        const available = this.questions.filter(q => !excludeIds.includes(q.id));
        if (available.length === 0) {
            return this.questions[Math.floor(Math.random() * this.questions.length)];
        }
        return available[Math.floor(Math.random() * available.length)];
    }
}

window.questionManager = new QuestionManager();
