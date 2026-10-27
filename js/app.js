// BLOOKHIT - Asosiy O'yin Boshqaruv Tizimi

class BlookhitApp {
    constructor() {
        this.currentScreen = 'home';
        this.gamePin = null;
        this.isHost = false;
        this.playerName = "O'yinchi";
        this.selectedBlook = window.BLOOKS[0];

        this.game3D = null;
        this.gold = 0;
        this.shield = false;
        this.multiplier = 1;
        this.gameTimeLeft = 180; // 3 daqiqa
        this.gameTimerInterval = null;

        this.homePin = Math.floor(100000 + Math.random() * 900000).toString();
        this.currentQuestion = null;
        this.currentChestCallback = null;

        this.init();
    }

    init() {
        this.renderBlookSelectors();
        this.setupNavigation();
        this.setupMobileJoysticks();
        this.checkUrlForPin();

        // Bosh sahifadagi Jonli QR Kodni chizish
        this.renderHomeQR();

        // Savol qo'shish formasi
        this.setupQuestionModal();
    }

    // URL orqali PIN kelgan bo'lsa tekshirish (masalan QR kod skaner qilinganda)
    checkUrlForPin() {
        const urlParams = new URLSearchParams(window.location.search);
        const pin = urlParams.get('pin');
        if (pin) {
            const joinInput = document.getElementById('join-pin-input');
            if (joinInput) joinInput.value = pin;
            this.switchScreen('join-screen');
        }
    }

    // Sahifalarni almashtirish
    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenId;
        }

        // Agar skaner ekrandan chiqilsa, kamerani to'xtatish
        if (screenId !== 'scanner-screen') {
            window.qrGameSystem.stopScanner();
        }
    }

    // Blooklarni tanlash kartochkalarini chiqarish
    renderBlookSelectors() {
        const containers = [
            document.getElementById('blook-grid-home'),
            document.getElementById('blook-grid-join')
        ];

        containers.forEach(container => {
            if (!container) return;
            container.innerHTML = '';

            window.BLOOKS.forEach((blook, index) => {
                const card = document.createElement('div');
                card.className = `blook-select-card ${blook.id === this.selectedBlook.id ? 'selected' : ''}`;
                card.style.borderColor = blook.color;
                card.innerHTML = `
                    <div class="blook-avatar-preview" style="background: ${blook.color}">
                        <span class="blook-emoji">${blook.faceEmoji}</span>
                    </div>
                    <div class="blook-info">
                        <span class="blook-name">${blook.name.split('(')[0]}</span>
                        <span class="blook-rarity ${blook.rarity.toLowerCase()}">${blook.rarity}</span>
                    </div>
                `;

                card.addEventListener('click', () => {
                    window.soundManager.playClick();
                    this.selectedBlook = blook;
                    document.querySelectorAll('.blook-select-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                });

                container.appendChild(card);
            });
        });
    }

    // Tugmalar va boshqaruvlarni ulash
    setupNavigation() {
        // Asosiy sahifa tugmalari
        document.getElementById('btn-home-join')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.switchScreen('join-screen');
        });

        document.getElementById('btn-home-scan')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.openScannerScreen();
        });

        document.getElementById('btn-home-host')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.startHostRoom();
        });

        document.getElementById('btn-home-solo')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.startSoloGame();
        });

        // Orqaga qaytish tugmalari
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => {
                window.soundManager.playClick();
                this.switchScreen('home-screen');
            });
        });

        // Join Screen orqali kirish
        document.getElementById('btn-submit-join')?.addEventListener('click', () => {
            const pin = document.getElementById('join-pin-input').value.trim();
            const name = document.getElementById('join-name-input').value.trim() || "O'yinchi";
            if (!pin || pin.length < 4) {
                alert("Iltimos, to'g'ri o'yin PIN kodini kiriting!");
                return;
            }
            this.playerName = name;
            this.gamePin = pin;
            this.startGameSession();
        });

        // Skaner ekranidagi tugmalar
        document.getElementById('btn-file-scan')?.addEventListener('click', () => {
            document.getElementById('qr-file-input')?.click();
        });

        document.getElementById('qr-file-input')?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                window.qrGameSystem.scanFile(e.target.files[0]);
            }
        });

        document.getElementById('btn-demo-scan')?.addEventListener('click', () => {
            // Tezkor test skanerlash
            const demoPin = this.gamePin || "884219";
            window.qrGameSystem.handleDecodedText(`https://blookhit.io/?pin=${demoPin}`);
        });

        // Host ekrani
        document.getElementById('btn-host-start')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.startGameSession();
        });

        // 3D O'yindagi E (Sandiq ochish) tugmasi
        document.getElementById('btn-action-interact')?.addEventListener('click', () => {
            if (this.game3D && this.game3D.activeChest) {
                this.handleChestInteraction(this.game3D.activeChest);
            }
        });

        // 3D O'yinda va Bosh sahifada QR kod chiqarish tugmalari
        document.getElementById('btn-open-quick-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.openQuickQrModal(this.homePin);
        });

        document.getElementById('btn-home-fullscreen-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.openQuickQrModal(this.homePin);
        });

        document.getElementById('btn-game-show-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.openQuickQrModal(this.gamePin || this.homePin);
        });

        document.getElementById('btn-home-refresh-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.homePin = Math.floor(100000 + Math.random() * 900000).toString();
            this.renderHomeQR();
        });

        document.getElementById('btn-home-download-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            window.qrGameSystem.downloadQR('home-qr-container', this.homePin);
        });

        // Katta QR Modal tugmalari
        document.getElementById('btn-close-quick-qr')?.addEventListener('click', () => {
            document.getElementById('quick-qr-modal')?.classList.remove('active');
        });

        document.getElementById('btn-modal-refresh-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            this.homePin = newPin;
            this.renderHomeQR();
            this.openQuickQrModal(newPin);
        });

        document.getElementById('btn-modal-download-qr')?.addEventListener('click', () => {
            window.soundManager.playClick();
            const currentModalPin = document.getElementById('modal-qr-pin')?.innerText || this.homePin;
            window.qrGameSystem.downloadQR('modal-qr-container', currentModalPin);
        });

        // Sakrash tugmasi (mobil uchun)
        document.getElementById('btn-action-jump')?.addEventListener('click', () => {
            if (this.game3D) {
                this.game3D.triggerJump();
            }
        });

        // Sandiq tanlash (Gold Quest tanlovlari)
        document.querySelectorAll('.mystery-chest-card').forEach((chestBtn, idx) => {
            chestBtn.addEventListener('click', () => {
                this.revealChestReward(idx);
            });
        });

        // O'yinni qayta o'ynash
        document.getElementById('btn-play-again')?.addEventListener('click', () => {
            window.soundManager.playClick();
            this.switchScreen('home-screen');
        });
    }

    // Bosh sahifadagi Jonli QR Kodni chiqarish
    renderHomeQR() {
        const pinEl = document.getElementById('home-qr-pin');
        if (pinEl) pinEl.innerText = this.homePin;
        window.qrGameSystem.generateHostQR('home-qr-container', this.homePin, 180);
    }

    // Katta QR Kod modalini chiqarish (istalgan vaqtda)
    openQuickQrModal(pin) {
        const targetPin = pin || this.homePin;
        const modal = document.getElementById('quick-qr-modal');
        const modalPin = document.getElementById('modal-qr-pin');
        if (modalPin) modalPin.innerText = targetPin;
        if (modal) modal.classList.add('active');

        window.qrGameSystem.generateHostQR('modal-qr-container', targetPin, 230);
    }

    // Skaner ekranini ochish va kamerani faollashtirish
    openScannerScreen() {
        this.switchScreen('scanner-screen');
        const statusText = document.getElementById('scanner-status');
        if (statusText) statusText.innerText = "Kameraga QR kodni ko'rsating...";

        window.qrGameSystem.startCameraScanner(
            'scanner-video-region',
            (pin) => {
                // Skan muvaffaqiyatli!
                if (statusText) statusText.innerText = `Topildi! PIN: ${pin}`;
                this.gamePin = pin;
                const joinPin = document.getElementById('join-pin-input');
                if (joinPin) joinPin.value = pin;
                setTimeout(() => {
                    this.switchScreen('join-screen');
                }, 800);
            },
            (error) => {
                // Skan jarayoni davom etmoqda yoki xatolik
                if (error && error.name === 'NotAllowedError') {
                    if (statusText) statusText.innerText = "Kameraga ruxsat berilmadi! Fayl orqali yuklang yoki PIN kiriting.";
                }
            }
        );
    }

    // Host xonasini yaratish
    startHostRoom() {
        this.isHost = true;
        this.gamePin = Math.floor(100000 + Math.random() * 900000).toString();

        document.getElementById('host-pin-display').innerText = this.gamePin;
        this.switchScreen('host-screen');

        // Katta QR kod chizish
        window.qrGameSystem.generateHostQR('host-qr-container', this.gamePin);

        // Lobby o'yinchilarini yangilash
        this.updateHostLobby();
    }

    updateHostLobby() {
        const list = document.getElementById('host-players-list');
        if (!list) return;

        // Boshlang'ich simulated o'yinchilar
        this.playersList = [
            { name: "Siz (Host) 👑", blook: this.selectedBlook, gold: 0 },
            { name: "Ali-King 🦁", blook: window.BLOOKS[1], gold: 0 },
            { name: "Madina-Pro 🌸", blook: window.BLOOKS[2], gold: 0 },
            { name: "Jasur-X ⚡", blook: window.BLOOKS[3], gold: 0 }
        ];

        list.innerHTML = '';
        this.playersList.forEach(p => {
            const badge = document.createElement('div');
            badge.className = 'lobby-player-badge';
            badge.innerHTML = `
                <span class="player-emoji" style="background:${p.blook.color}">${p.blook.faceEmoji}</span>
                <span class="player-name">${p.name}</span>
            `;
            list.appendChild(badge);
        });

        document.getElementById('host-players-count').innerText = `${this.playersList.length} ta o'yinchi`;
    }

    // Yakkama-yakka (Solo) o'yinni boshlash
    startSoloGame() {
        this.isHost = false;
        this.gamePin = "SOLO";
        this.playerName = "Siz";
        this.startGameSession();
    }

    // O'yin seansini (3D Arena) boshlash
    startGameSession() {
        this.switchScreen('game-screen');
        this.gold = 0;
        this.shield = false;
        this.multiplier = 1;
        this.gameTimeLeft = 120; // 2 daqiqa poyga

        this.updateHud();

        // 3D Sahnani ishga tushirish
        if (!this.game3D) {
            this.game3D = new window.Game3D('game-canvas-container');
        } else {
            this.game3D.init();
        }

        this.game3D.spawnPlayer(this.selectedBlook, this.playerName);
        this.game3D.spawnBots(5);

        // O'yin hodisalari
        this.game3D.onCoinCollect = (val) => {
            this.addGold(val * this.multiplier);
        };

        this.game3D.onChestInteract = (chest) => {
            this.handleChestInteraction(chest);
        };

        this.game3D.start();

        // Taymer va botlar simulyatsiyasini boshlash
        this.startGameTimer();
    }

    // Taymer
    startGameTimer() {
        if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);

        this.gameTimerInterval = setInterval(() => {
            this.gameTimeLeft--;
            const mins = Math.floor(this.gameTimeLeft / 60);
            const secs = this.gameTimeLeft % 60;
            const timerEl = document.getElementById('hud-timer');
            if (timerEl) {
                timerEl.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }

            // Botlar ham tasodifiy ball yig'ib turadi
            if (this.game3D && this.game3D.bots) {
                this.game3D.bots.forEach(bot => {
                    if (Math.random() < 0.25) {
                        bot.gold += Math.floor(Math.random() * 50) + 20;
                    }
                });
            }

            this.updateLeaderboardHud();

            if (this.gameTimeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    // Sandiqqa duch kelganda viktorina savolini ko'rsatish
    handleChestInteraction(chest) {
        if (chest.isOpen) return;

        window.soundManager.playChestOpen();
        this.currentChestCallback = chest;

        // Savol olish
        const q = window.questionManager.getRandomQuestion();
        this.currentQuestion = q;

        // Modalni ko'rsatish
        const modal = document.getElementById('question-modal');
        const qText = document.getElementById('modal-q-text');
        const qCategory = document.getElementById('modal-q-category');
        const optionsContainer = document.getElementById('modal-options-grid');

        qText.innerText = q.question;
        qCategory.innerText = q.category;
        optionsContainer.innerHTML = '';

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option-btn';
            btn.style.backgroundColor = colors[idx % colors.length];
            btn.innerHTML = `<span class="opt-num">${idx + 1}</span> <span>${opt}</span>`;

            btn.addEventListener('click', () => {
                this.checkAnswer(idx, btn);
            });

            optionsContainer.appendChild(btn);
        });

        modal.classList.add('active');
    }

    // Javobni tekshirish
    checkAnswer(selectedIdx, btnElement) {
        const modal = document.getElementById('question-modal');
        const isCorrect = selectedIdx === this.currentQuestion.answer;

        if (isCorrect) {
            window.soundManager.playCorrect();
            btnElement.classList.add('correct');
            setTimeout(() => {
                modal.classList.remove('active');
                this.openMysteryChestModal();
            }, 600);
        } else {
            window.soundManager.playWrong();
            btnElement.classList.add('wrong');
            setTimeout(() => {
                modal.classList.remove('active');
            }, 800);
        }
    }

    // 3 ta sirli sandiq ochish (Gold Quest mexanikasi!)
    openMysteryChestModal() {
        const modal = document.getElementById('mystery-chest-modal');
        document.querySelectorAll('.mystery-chest-card').forEach(c => {
            c.classList.remove('opened');
            c.querySelector('.chest-reward-content').innerHTML = '❓';
        });
        modal.classList.add('active');
    }

    revealChestReward(selectedIndex) {
        window.soundManager.playChestOpen();

        const rewards = [
            { type: 'gold', amount: 250, label: "+250 Oltin! 💰" },
            { type: 'gold', amount: 500, label: "+500 Oltin! 🏆" },
            { type: 'gold', amount: 100, label: "+100 Oltin! ✨" },
            { type: 'swap', label: "SWAP! Eng boy o'yinchi bilan o'rin almashdingiz! ⚡" },
            { type: 'double', label: "2X Ko'paytiruvchi! 🚀" },
            { type: 'shield', label: "Qalqon (Shield) himoyasi! 🛡️" }
        ];

        const cards = document.querySelectorAll('.mystery-chest-card');
        const chosenCard = cards[selectedIndex];
        chosenCard.classList.add('opened');

        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        chosenCard.querySelector('.chest-reward-content').innerHTML = `
            <div class="reward-title">${reward.label}</div>
        `;

        // Mukofotni hisoblash
        if (reward.type === 'gold') {
            this.addGold(reward.amount);
            window.soundManager.playCoin();
        } else if (reward.type === 'swap') {
            window.soundManager.playSwap();
            // Eng boy bot bilan oltin almashish
            if (this.game3D && this.game3D.bots.length > 0) {
                const richestBot = [...this.game3D.bots].sort((a, b) => b.gold - a.gold)[0];
                if (richestBot && richestBot.gold > this.gold) {
                    const temp = this.gold;
                    this.gold = richestBot.gold;
                    richestBot.gold = temp;
                } else {
                    this.addGold(300);
                }
            }
        } else if (reward.type === 'double') {
            this.gold = Math.max(100, this.gold * 2);
            window.soundManager.playCoin();
        } else if (reward.type === 'shield') {
            this.shield = true;
        }

        this.updateHud();

        // 3D sandiqni vaqtinchalik yopish/ochish
        if (this.currentChestCallback) {
            this.currentChestCallback.isOpen = true;
            if (this.currentChestCallback.mesh.userData.lid) {
                this.currentChestCallback.mesh.userData.lid.rotation.x = -Math.PI / 3;
            }
            setTimeout(() => {
                this.currentChestCallback.isOpen = false;
                if (this.currentChestCallback.mesh.userData.lid) {
                    this.currentChestCallback.mesh.userData.lid.rotation.x = 0;
                }
            }, 8000);
        }

        setTimeout(() => {
            document.getElementById('mystery-chest-modal').classList.remove('active');
        }, 1500);
    }

    addGold(amount) {
        this.gold += amount;
        this.updateHud();
        // Zarracha yoki ko'tarilish effekti
        const goldEl = document.getElementById('hud-gold');
        if (goldEl) {
            goldEl.classList.add('pulse');
            setTimeout(() => goldEl.classList.remove('pulse'), 300);
        }
    }

    updateHud() {
        const goldEl = document.getElementById('hud-gold');
        if (goldEl) goldEl.innerText = this.gold.toLocaleString();

        const shieldEl = document.getElementById('hud-shield');
        if (shieldEl) {
            shieldEl.style.display = this.shield ? 'inline-block' : 'none';
        }
    }

    updateLeaderboardHud() {
        const lbContainer = document.getElementById('hud-leaderboard-list');
        if (!lbContainer) return;

        let allPlayers = [
            { name: this.playerName + " (Siz)", gold: this.gold, isMe: true }
        ];

        if (this.game3D && this.game3D.bots) {
            this.game3D.bots.forEach(b => {
                allPlayers.push({ name: b.name, gold: b.gold, isMe: false });
            });
        }

        allPlayers.sort((a, b) => b.gold - a.gold);

        lbContainer.innerHTML = '';
        allPlayers.slice(0, 5).forEach((p, idx) => {
            const item = document.createElement('div');
            item.className = `lb-item ${p.isMe ? 'is-me' : ''}`;
            item.innerHTML = `
                <span class="lb-rank">#${idx + 1}</span>
                <span class="lb-name">${p.name}</span>
                <span class="lb-gold">${p.gold} 💰</span>
            `;
            lbContainer.appendChild(item);
        });
    }

    // O'yin yakuni
    endGame() {
        if (this.gameTimerInterval) clearInterval(this.gameTimerInterval);
        if (this.game3D) this.game3D.stop();

        window.soundManager.playWin();

        // Canvas confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }

        let allPlayers = [
            { name: this.playerName, blook: this.selectedBlook, gold: this.gold, isMe: true }
        ];

        if (this.game3D && this.game3D.bots) {
            this.game3D.bots.forEach(b => {
                allPlayers.push({ name: b.name, blook: b.blook, gold: b.gold, isMe: false });
            });
        }

        allPlayers.sort((a, b) => b.gold - a.gold);

        // Natijalar ekranini to'ldirish
        this.switchScreen('gameover-screen');

        const podium = document.getElementById('podium-container');
        if (podium && allPlayers.length >= 3) {
            podium.innerHTML = `
                <div class="podium-step step-2">
                    <div class="podium-blook">${allPlayers[1].blook.faceEmoji}</div>
                    <div class="podium-name">${allPlayers[1].name}</div>
                    <div class="podium-gold">${allPlayers[1].gold} 💰</div>
                    <div class="podium-bar">2</div>
                </div>
                <div class="podium-step step-1">
                    <div class="crown">👑</div>
                    <div class="podium-blook">${allPlayers[0].blook.faceEmoji}</div>
                    <div class="podium-name">${allPlayers[0].name}</div>
                    <div class="podium-gold">${allPlayers[0].gold} 💰</div>
                    <div class="podium-bar">1</div>
                </div>
                <div class="podium-step step-3">
                    <div class="podium-blook">${allPlayers[2].blook.faceEmoji}</div>
                    <div class="podium-name">${allPlayers[2].name}</div>
                    <div class="podium-gold">${allPlayers[2].gold} 💰</div>
                    <div class="podium-bar">3</div>
                </div>
            `;
        }
    }

    // Mobil joystik
    setupMobileJoysticks() {
        const joyBase = document.getElementById('virtual-joystick');
        const joyThumb = document.getElementById('joystick-thumb');
        if (!joyBase || !joyThumb) return;

        let isDragging = false;
        let startX, startY;

        const onStart = (e) => {
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = joyBase.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            let dx = touch.clientX - startX;
            let dy = touch.clientY - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 40;

            if (dist > maxRadius) {
                dx = (dx / dist) * maxRadius;
                dy = (dy / dist) * maxRadius;
            }

            joyThumb.style.transform = `translate(${dx}px, ${dy}px)`;

            if (this.game3D) {
                this.game3D.setJoystickInput(dx / maxRadius, dy / maxRadius);
            }
        };

        const onEnd = () => {
            isDragging = false;
            joyThumb.style.transform = `translate(0px, 0px)`;
            if (this.game3D) {
                this.game3D.setJoystickInput(0, 0);
            }
        };

        joyBase.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        joyBase.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    // Maxsus savol qo'shish modali
    setupQuestionModal() {
        const openBtn = document.getElementById('btn-open-add-q');
        const modal = document.getElementById('custom-q-modal');
        const closeBtn = document.getElementById('btn-close-custom-q');
        const form = document.getElementById('custom-q-form');

        openBtn?.addEventListener('click', () => {
            window.soundManager.playClick();
            modal?.classList.add('active');
        });

        closeBtn?.addEventListener('click', () => {
            modal?.classList.remove('active');
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            const qText = document.getElementById('input-q-text').value;
            const opt1 = document.getElementById('input-opt-1').value;
            const opt2 = document.getElementById('input-opt-2').value;
            const opt3 = document.getElementById('input-opt-3').value;
            const opt4 = document.getElementById('input-opt-4').value;
            const correctOpt = parseInt(document.getElementById('select-correct-opt').value, 10);
            const cat = document.getElementById('input-q-cat').value || "Maxsus";

            window.questionManager.addQuestion(qText, [opt1, opt2, opt3, opt4], correctOpt, cat);
            window.soundManager.playCorrect();
            alert("Savolingiz muvaffaqiyatli qo'shildi!");
            modal?.classList.remove('active');
            form.reset();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.blookhitApp = new BlookhitApp();
});
