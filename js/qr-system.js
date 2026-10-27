// QR Kod Generator va Kamera orqali Skanerlash Tizimi

class QRGameSystem {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.onScanSuccessCallback = null;
    }

    // Host va Bosh sahifa uchun QR kod generatsiya qilish
    generateHostQR(elementId, pin, customSize = 220) {
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = '';

        // To'liq URL yoki PIN kodi formati
        const currentUrl = window.location.href.split('?')[0];
        const fullUrl = `${currentUrl}?pin=${pin}`;

        // 1. Agar QRCode kutubxonasi mavjud bo'lsa
        if (typeof QRCode !== 'undefined') {
            try {
                new QRCode(container, {
                    text: fullUrl,
                    width: customSize,
                    height: customSize,
                    colorDark: "#0f172a",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                return;
            } catch (e) {
                console.warn("QRCode kutubxonasida xatolik, fallback ishlatiladi", e);
            }
        }

        // 2. Oflayn Canvas QR Fallback (SVG / Canvas yordamida chizish)
        const canvas = document.createElement('canvas');
        canvas.width = customSize;
        canvas.height = customSize;
        const ctx = canvas.getContext('2d');
        
        // QR kod o'rniga o'qilishi oson stilistik QR vizualizatsiyasi va API zaxirasi
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            container.innerHTML = '';
            container.appendChild(img);
        };
        img.onerror = () => {
            // Agar internet bo'lmasa, mahalliy Canvas QR chizish
            this.drawOfflineQrFallback(container, pin, customSize);
        };
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${customSize}x${customSize}&data=${encodeURIComponent(fullUrl)}&margin=10`;
        img.style.borderRadius = "12px";
        img.style.maxWidth = "100%";
        img.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        container.appendChild(img);
    }

    // Internet bo'lmaganda mahalliy chiroyli Canvas QR ko'rinishi
    drawOfflineQrFallback(container, pin, size) {
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = size * 0.04;

        // Burchakdagi 3 ta kvadrat (QR Position Markers)
        const drawMarker = (x, y, s) => {
            ctx.strokeRect(x, y, s, s);
            ctx.fillRect(x + s * 0.25, y + s * 0.25, s * 0.5, s * 0.5);
        };

        const mSize = size * 0.24;
        drawMarker(size * 0.08, size * 0.08, mSize);
        drawMarker(size - mSize - size * 0.08, size * 0.08, mSize);
        drawMarker(size * 0.08, size - mSize - size * 0.08, mSize);

        // O'rtadagi PIN va piksellar
        const step = size * 0.06;
        for (let r = 2; r < 14; r++) {
            for (let c = 2; c < 14; c++) {
                if (Math.sin(r * 3 + c * 5 + Number(pin || 123)) > 0) {
                    ctx.fillRect(r * step, c * step, step * 0.8, step * 0.8);
                }
            }
        }

        // Markazda PIN yozuvi
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(size * 0.25, size * 0.42, size * 0.5, size * 0.16);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(size * 0.08)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`PIN:${pin}`, size / 2, size / 2);

        container.appendChild(canvas);
    }

    // QR kodni rasm (PNG) sifatida yuklab olish
    downloadQR(containerId, pin) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const img = container.querySelector('img');
        const canvas = container.querySelector('canvas');

        let dataUrl = null;
        if (canvas) {
            dataUrl = canvas.toDataURL('image/png');
        } else if (img && img.src.startsWith('data:')) {
            dataUrl = img.src;
        } else if (img) {
            // Agar tashqi URL bo'lsa, canvas orqali olish
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.naturalWidth || 250;
            tempCanvas.height = tempCanvas.naturalHeight || 250;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);
            try {
                dataUrl = tempCanvas.toDataURL('image/png');
            } catch (e) {
                window.open(img.src, '_blank');
                return;
            }
        }

        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `Blookhit_QR_PIN_${pin}.png`;
            link.href = dataUrl;
            link.click();
        }
    }

    // Kamera orqali skanerlashni boshlash
    async startCameraScanner(elementId, onSuccess, onError) {
        this.onScanSuccessCallback = onSuccess;
        const scanElement = document.getElementById(elementId);
        if (!scanElement) return;

        try {
            // Agar avvalgi scanner ochiq bo'lsa, to'xtatamiz
            if (this.html5QrCode) {
                await this.stopScanner();
            }

            if (typeof Html5Qrcode === 'undefined') {
                throw new Error("HTML5 QR Code kutubxonasi mavjud emas");
            }

            this.html5QrCode = new Html5Qrcode(elementId);
            const config = {
                fps: 15,
                qrbox: { width: 240, height: 240 },
                aspectRatio: 1.0
            };

            await this.html5QrCode.start(
                { facingMode: "environment" }, // orqa kamera (telefonlarda) yoki asosiy kamera
                config,
                (decodedText, decodedResult) => {
                    this.handleDecodedText(decodedText);
                },
                (errorMessage) => {
                    // Skan davom etmoqda...
                    if (onError) onError(errorMessage);
                }
            );

            this.isScanning = true;
            console.log("Kamera skaneri ishga tushdi!");
        } catch (err) {
            console.error("Kamera ochishda xatolik:", err);
            // Xatolik xabarini berish
            if (onError) onError(err);
        }
    }

    // Matnni tekshirish va PIN kodni ajratib olish
    handleDecodedText(text) {
        console.log("Skanerlandi:", text);
        let detectedPin = null;

        // 1. Agar to'liq URL bo'lsa (?pin=123456)
        if (text.includes('pin=')) {
            const match = text.match(/pin=([0-9]{4,8})/i);
            if (match && match[1]) {
                detectedPin = match[1];
            }
        }
        // 2. Agar JSON formatda bo'lsa
        else if (text.startsWith('{') && text.includes('pin')) {
            try {
                const parsed = JSON.parse(text);
                if (parsed.pin) detectedPin = String(parsed.pin);
            } catch (e) {}
        }
        // 3. Agar to'g'ridan-to'g'ri son bo'lsa (4-8 xonali)
        else {
            const digits = text.replace(/[^0-9]/g, '');
            if (digits.length >= 4 && digits.length <= 8) {
                detectedPin = digits;
            }
        }

        if (detectedPin) {
            window.soundManager.playCorrect();
            if (this.isScanning) {
                this.stopScanner();
            }
            if (this.onScanSuccessCallback) {
                this.onScanSuccessCallback(detectedPin);
            }
        }
    }

    // Fayl (rasm) orqali QR skanerlash
    async scanFile(file) {
        if (!file) return;
        try {
            if (!this.html5QrCode) {
                this.html5QrCode = new Html5Qrcode("scanner-video-region");
            }
            const decodedText = await this.html5QrCode.scanFile(file, true);
            this.handleDecodedText(decodedText);
        } catch (err) {
            console.error("Fayldan QR o'qishda xatolik:", err);
            alert("Rasmda QR kod aniqlanmadi yoki rasm sifati yetarli emas!");
        }
    }

    // Skanerni to'xtatish
    async stopScanner() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
            } catch (e) {
                console.warn("Skaner to'xtatishda:", e);
            }
            this.isScanning = false;
        }
    }
}

window.qrGameSystem = new QRGameSystem();
