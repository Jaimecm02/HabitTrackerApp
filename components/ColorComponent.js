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
            return storedData.color;
        }

        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }

        localStorage.setItem('dailyColor', JSON.stringify({
            date: today,
            color: color
        }));

        return color;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `RGB(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
    }

    calculateContrastColor(hexcolor) {
        const r = parseInt(hexcolor.slice(1, 3), 16);
        const g = parseInt(hexcolor.slice(3, 5), 16);
        const b = parseInt(hexcolor.slice(5, 7), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }

    saveColorToHistory(color, date) {
        const history = localStorage.getItem('colorHistory') || '[]';
        const historyArray = JSON.parse(history);
        
        // Check if we already have this date in history
        if (!historyArray.some(item => item.date === date)) {
            historyArray.push({ date, color });
            localStorage.setItem('colorHistory', JSON.stringify(historyArray));
        }
    }

    getColorHistory() {
        const history = localStorage.getItem('colorHistory') || '[]';
        return JSON.parse(history);
    }

    setupComponent() {
        this.container.innerHTML = '';
        const color = this.generateDailyColor();
        const rgbColor = this.hexToRgb(color);
        const textColor = this.calculateContrastColor(color);
        const today = new Date().toDateString();

        // Save today's color to history
        this.saveColorToHistory(color, today);

        // Get updated color history
        const colorHistory = this.getColorHistory();
        const cardIndex = colorHistory.length; // Get the index for the main card

        // Create main color card
        const card = document.createElement('div');
        card.className = 'color-card';
        card.style.backgroundColor = color;

        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        colorInfo.style.color = textColor;
        
        const hexCode = document.createElement('div');
        hexCode.className = 'color-code';
        hexCode.style.fontWeight = 'bold'; // Make hex code bold
        hexCode.textContent = `HEX: ${color.toUpperCase()}`;

        const rgbCode = document.createElement('div');
        rgbCode.className = 'color-code';
        rgbCode.style.fontWeight = 'bold'; // Make RGB code bold
        rgbCode.textContent = rgbColor;

        const cardNumber = document.createElement('div');
        cardNumber.className = 'card-number';
        cardNumber.style.fontWeight = 'bold'; // Make card number bold
        cardNumber.textContent = cardIndex; // Use card index
        cardNumber.style.position = 'absolute';
        cardNumber.style.top = '10px';
        cardNumber.style.right = '10px';
        cardNumber.style.color = textColor;

        colorInfo.appendChild(hexCode);
        colorInfo.appendChild(rgbCode);
        card.appendChild(colorInfo);
        card.appendChild(cardNumber);
        this.container.appendChild(card);

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
            historyInfo.textContent = `${item.date}: ${item.color}`;

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
        });

        historySection.appendChild(historyTitle);
        historySection.appendChild(historyContainer);
        this.container.appendChild(historySection);
    }
}

module.exports = ColorComponent;
