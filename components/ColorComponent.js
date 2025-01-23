class ColorComponent {
    constructor() {
        this.container = document.getElementById('colorComponent');
        this.setupComponent();
    }

    generateDailyColor() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('dailyColor');
        const storedData = stored ? JSON.parse(stored) : null;

        if (storedData && storedData.date === today) {
            return {
                color: storedData.color,
                holographic: storedData.holographic
            };
        }

        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }

        const holographic = Math.random() < 0.01;

        localStorage.setItem('dailyColor', JSON.stringify({
            date: today,
            color: color,
            holographic: holographic
        }));

        return { color, holographic };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    }

    calculateContrastColor(hexcolor) {
        const r = parseInt(hexcolor.slice(1, 3), 16);
        const g = parseInt(hexcolor.slice(3, 5), 16);
        const b = parseInt(hexcolor.slice(5, 7), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }

    saveColorToHistory(color, date, holographic) {
        const history = localStorage.getItem('colorHistory') || '[]';
        const historyArray = JSON.parse(history);
        
        if (!historyArray.some(item => item.date === date)) {
            const rgb = this.hexToRgb(color);
            historyArray.push({ date, color, rgb, holographic });
            localStorage.setItem('colorHistory', JSON.stringify(historyArray));
        }
    }

    getColorHistory() {
        const history = localStorage.getItem('colorHistory') || '[]';
        return JSON.parse(history);
    }

    setupComponent() {
        this.container.innerHTML = '';
        const { color, holographic } = this.generateDailyColor();
        const rgbColor = this.hexToRgb(color);
        const textColor = this.calculateContrastColor(color);
        const today = new Date().toDateString();

        // Save today's color to history with holographic property
        this.saveColorToHistory(color, today, holographic);

        // Get updated color history
        const colorHistory = this.getColorHistory();
        const cardIndex = colorHistory.length;

        // Create main color card
        const card = document.createElement('div');
        card.className = 'color-card';
        card.style.backgroundColor = color;

        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        colorInfo.style.color = textColor;
        
        const hexCode = document.createElement('div');
        hexCode.className = 'color-code';
        hexCode.style.fontWeight = 'bold';
        hexCode.textContent = `HEX: ${color.toUpperCase()}`;

        const rgbCode = document.createElement('div');
        rgbCode.className = 'color-code';
        rgbCode.style.fontWeight = 'bold';
        rgbCode.textContent = `RGB(${rgbColor})`;

        const cardNumber = document.createElement('div');
        cardNumber.className = 'card-number';
        cardNumber.style.fontWeight = 'bold'; 
        cardNumber.textContent = cardIndex;
        cardNumber.style.position = 'absolute';
        cardNumber.style.top = '10px';
        cardNumber.style.right = '10px';
        cardNumber.style.color = textColor;

        colorInfo.appendChild(hexCode);
        colorInfo.appendChild(rgbCode);
        card.appendChild(colorInfo);
        card.appendChild(cardNumber);
        this.container.appendChild(card);

        // Add mouse move handlers to main card
        card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
        card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));

        // Add history section
        const historySection = document.createElement('div');
        historySection.className = 'history-section';
        
        const historyTitle = document.createElement('h2');
        historyTitle.textContent = 'COLOR HISTORY';
        historyTitle.className = 'history-title';
        
        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-container';
        
        colorHistory.reverse().forEach((item, index) => {
            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';
            historyCard.style.backgroundColor = item.color;
            
            const historyInfo = document.createElement('div');
            historyInfo.className = 'history-info';
            historyInfo.style.color = this.calculateContrastColor(item.color);
            historyInfo.style.fontWeight = 'bold';
            historyInfo.innerHTML = `${item.date}<br>${item.color}<br>RGB(${item.rgb})`;

            const historyCardNumber = document.createElement('div');
            historyCardNumber.className = 'card-number';
            historyCardNumber.style.fontWeight = 'bold';
            historyCardNumber.textContent = colorHistory.length - index;
            historyCardNumber.style.position = 'absolute';
            historyCardNumber.style.top = '10px';
            historyCardNumber.style.right = '10px';
            historyCardNumber.style.color = this.calculateContrastColor(item.color);
            
            historyCard.appendChild(historyInfo);
            historyCard.appendChild(historyCardNumber);
            historyContainer.appendChild(historyCard);

            // Add mouse move handlers to history cards
            historyCard.addEventListener('mousemove', (e) => this.handleMouseMove(e, historyCard));
            historyCard.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, historyCard));
        });

        historySection.appendChild(historyTitle);
        historySection.appendChild(historyContainer);
        this.container.appendChild(historySection);
    }

    handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate rotation
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    handleMouseLeave(e, card) {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
}

module.exports = ColorComponent;
