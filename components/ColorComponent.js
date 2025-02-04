const GemPattern = require('./GemPattern');
const WebPattern = require('./WebPattern');
const ChinesePattern = require('./ChinesePattern');

class ColorComponent {
    constructor() {
        this.container = document.getElementById('colorComponent');
        this.gemPattern = new GemPattern();
        this.webPattern = new WebPattern();
        this.chinesePattern = new ChinesePattern();
        this.likedColors = JSON.parse(localStorage.getItem('likedColors') || '[]');
        this.setupComponent();
    }

    generateDailyColor() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('dailyColor');
        const storedData = stored ? JSON.parse(stored) : null;

        if (storedData && storedData.date === today) {
            return {
                color: storedData.color,
                secondColor: storedData.secondColor,
                holographic: storedData.holographic,
                gradient: storedData.gradient,
                gem: storedData.gem,
                web: storedData.web,
                chinese: storedData.chinese
            };
        }

        const { color, secondColor, holographic, gradient, gem, web, chinese } = this.generateRandomColor();

        localStorage.setItem('dailyColor', JSON.stringify({
            date: today,
            color: color,
            secondColor: secondColor,
            holographic: holographic,
            gradient: gradient,
            gem: gem,
            web: web,
            chinese: chinese
        }));

        return { color, secondColor, holographic, gradient, gem, web, chinese };
    }

    generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        let secondColor = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
            secondColor += letters[Math.floor(Math.random() * 16)];
        }

        const holographic = Math.random() < 0.035; // 3.5% chance of holographic color (one every 30 days)
        const gradient = Math.random() < 0.065; // 6.5% chance of gradient color (two every 30 days)
        
        const patternRoll = Math.random();
        const gem = patternRoll < 0.01; // 1% chance for gem pattern
        const web = patternRoll >= 0.01 && patternRoll < 0.02; // 1% chance for web pattern
        const chinese = patternRoll >= 0.02 && patternRoll < 0.03; // 1% chance for Chinese character

        return { color, secondColor, holographic, gradient, gem, web, chinese };
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

    saveColorToHistory(color, date, holographic, gradient, secondColor, gem, web, chinese) {
        const history = localStorage.getItem('colorHistory') || '[]';
        const historyArray = JSON.parse(history);
        
        if (!historyArray.some(item => item.date === date)) {
            const rgb = this.hexToRgb(color);
            const rgb2 = gradient ? this.hexToRgb(secondColor) : null;
            historyArray.push({ 
                date, 
                color, 
                secondColor,
                rgb, 
                rgb2,
                holographic, 
                gradient,
                gem,
                web,
                chinese
            });
            localStorage.setItem('colorHistory', JSON.stringify(historyArray));
        }
    }

    getColorHistory() {
        const history = localStorage.getItem('colorHistory') || '[]';
        return JSON.parse(history);
    }

    setupComponent() {
        this.container.innerHTML = '';
        const { color, secondColor, holographic, gradient, gem, web, chinese } = this.generateDailyColor();
        const rgbColor = this.hexToRgb(color);
        const textColor = this.calculateContrastColor(color);
        const today = new Date().toDateString();

        // Save today's color to history with all properties
        this.saveColorToHistory(color, today, holographic, gradient, secondColor, gem, web, chinese);

        // Get updated color history
        const colorHistory = this.getColorHistory();
        const cardIndex = colorHistory.length;

        // Create main color card
        const card = document.createElement('div');
        card.className = `color-card${holographic ? ' holographic' : ''}${gem ? ' gem' : ''}${web ? ' web' : ''}${chinese ? ' chinese' : ''}`;
        if (gradient) {
            card.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
        } else {
            card.style.backgroundColor = color;
        }

        if (gem) {
            this.gemPattern.addDelaunayPattern(card);
        } else if (web) {
            this.webPattern.addPattern(card);
        } else if (chinese) {
            this.chinesePattern.addChineseCharacter(card, color);
        }

        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        colorInfo.style.color = textColor;
        
        const hexCode = document.createElement('div');
        hexCode.className = 'color-code';
        hexCode.style.fontWeight = 'bold';
        hexCode.textContent = gradient ? 
            `HEX: ${color.toUpperCase()} → ${secondColor.toUpperCase()}` :
            `HEX: ${color.toUpperCase()}`;

        const rgbCode = document.createElement('div');
        rgbCode.className = 'color-code';
        rgbCode.style.fontWeight = 'bold';
        rgbCode.innerHTML = gradient ?
            `RGB_1(${rgbColor})<br>RGB_2(${this.hexToRgb(secondColor)})<br>` :
            `RGB(${rgbColor})`;

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

        const cardData = {
            color,
            secondColor,
            date: today,
            holographic,
            gradient,
            gem,
            web,
            chinese
        };

        // Add heart button to main card
        const heartButton = this.createHeartButton(color, cardData);
        card.appendChild(heartButton);

        // Add mouse move handlers to main card
        card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
        card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));

        // Add history section
        this.addHistorySection(colorHistory);

        // Add preview section after history section
        this.addPreviewSection();

        // Add test section
        // this.addTestSection();
    }

    addHistorySection(colorHistory) {
        const historySection = document.createElement('div');
        historySection.className = 'history-section';
        
        const historyTitle = document.createElement('h2');
        historyTitle.textContent = 'COLOR HISTORY';
        historyTitle.className = 'history-title';
        
        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-container';
        
        colorHistory.reverse().forEach((item, index) => {
            const historyCard = document.createElement('div');
            historyCard.className = `history-card${item.holographic ? ' holographic' : ''}${item.gem ? ' gem' : ''}${item.web ? ' web' : ''}${item.chinese ? ' chinese' : ''}`;
            if (item.gradient) {
                historyCard.style.background = `linear-gradient(45deg, ${item.color}, ${item.secondColor})`;
            } else {
                historyCard.style.backgroundColor = item.color;
            }
            
            if (item.gem) {
                this.gemPattern.addDelaunayPattern(historyCard);
            } else if (item.web) {
                this.webPattern.addPattern(historyCard);
            } else if (item.chinese) {
                this.chinesePattern.addChineseCharacter(historyCard, item.color);
            }

            const historyInfo = document.createElement('div');
            historyInfo.className = 'history-info';
            historyInfo.style.color = this.calculateContrastColor(item.color);
            historyInfo.style.fontWeight = 'bold';
            historyInfo.innerHTML = item.gradient ? 
                `${item.date}<br>HEX: ${item.color} → ${item.secondColor}<br>RGB_1(${item.rgb})<br>RGB_2(${item.rgb2})` :
                `${item.date}<br>HEX: ${item.color} <br>RGB(${item.rgb})`;

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

            // Add heart button to history cards
            const heartButton = this.createHeartButton(item.color, item);
            historyCard.appendChild(heartButton);

            // Add mouse move handlers to history cards
            historyCard.addEventListener('mousemove', (e) => this.handleMouseMove(e, historyCard));
            historyCard.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, historyCard));
        });

        historySection.appendChild(historyTitle);
        historySection.appendChild(historyContainer);
        this.container.appendChild(historySection);
    }

    addPreviewSection() {
        const previewSection = document.createElement('div');
        previewSection.className = 'preview-section';
        
        const previewTitle = document.createElement('h2');
        previewTitle.textContent = 'CARD TYPES';
        previewTitle.className = 'preview-title';
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';

        // Create example cards
        const normalCard = this.createPreviewCard('#FF5733', false, false, false, false, 'Normal Card');
        const holoCard = this.createPreviewCard('#4287f5', true, false, false, false, 'Holographic Card');
        const gradientCard = this.createPreviewCard('#33ff57', false, true, false, false, 'Gradient Card', '#5733ff');
        const gemCard = this.createPreviewCard('#f54287', false, false, true, false, 'Gem Card');
        const webCard = this.createPreviewCard('#87f542', false, false, false, true, 'Web Card');
        const gradientWebCard = this.createPreviewCard('#ff9933', false, true, false, true, 'Gradient Web Card', '#9933ff');
        const holoWebCard = this.createPreviewCard('#42f587', true, false, false, true, 'Holographic Web Card');
        const holoGradientWebCard = this.createPreviewCard('#8742f5', true, true, false, true, 'Holographic Gradient Web Card', '#f54287');
        const chineseCard = this.createPreviewCard('#e85d75', false, false, false, false, 'Chinese Character Card');
        this.chinesePattern.addChineseCharacter(chineseCard, '#e85d75');

        [normalCard, holoCard, gradientCard, gemCard, webCard, gradientWebCard, 
         holoWebCard, holoGradientWebCard, chineseCard].forEach(card => {
            previewContainer.appendChild(card);
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
        });

        previewSection.appendChild(previewTitle);
        previewSection.appendChild(previewContainer);
        this.container.appendChild(previewSection);
    }

    createPreviewCard(color, holographic, gradient, gem, web, label, secondColor = '#ffffff') {
        const card = document.createElement('div');
        card.className = `preview-card${holographic ? ' holographic' : ''}${gem ? ' gem' : ''}${web ? ' web' : ''}`;
        
        if (gradient) {
            card.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
        } else {
            card.style.backgroundColor = color;
        }

        if (gem) {
            this.gemPattern.addDelaunayPattern(card);
        } else if (web) {
            this.webPattern.addPattern(card);
        }

        const cardLabel = document.createElement('div');
        cardLabel.className = 'preview-label';
        cardLabel.style.color = this.calculateContrastColor(color);
        cardLabel.textContent = label;
        
        card.appendChild(cardLabel);

        return card;
    }

    addTestSection() {
        const testSection = document.createElement('div');
        testSection.className = 'test-section';

        const testTitle = document.createElement('h2');
        testTitle.textContent = 'TEST SECTION: 50 RANDOM GENERATIONS';
        testTitle.className = 'test-title';

        const testContainer = document.createElement('div');
        testContainer.className = 'test-container';

        for (let i = 0; i < 50; i++) {
            const { color, secondColor, holographic, gradient, gem, web, chinese } = this.generateRandomColor();
            const testCard = document.createElement('div');
            testCard.className = `history-card${holographic ? ' holographic' : ''}${gem ? ' gem' : ''}${web ? ' web' : ''}${chinese ? ' chinese' : ''}`;
            
            if (gradient) {
                testCard.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
            } else {
                testCard.style.backgroundColor = color;
            }

            if (gem) {
                testCard.classList.add('gem');
                this.gemPattern.addDelaunayPattern(testCard);
            } else if (web) {
                testCard.classList.add('web');
                this.webPattern.addPattern(testCard);
            } else if (chinese) {
                this.chinesePattern.addChineseCharacter(testCard, color);
            }

            const testInfo = document.createElement('div');
            testInfo.className = 'history-info';
            testInfo.style.color = this.calculateContrastColor(color);
            testInfo.style.fontWeight = 'bold';
            testInfo.innerHTML = gradient ? 
                `HEX: ${color.toUpperCase()} → ${secondColor.toUpperCase()}<br>RGB_1(${this.hexToRgb(color)})<br>RGB_2(${this.hexToRgb(secondColor)})` :
                `HEX: ${color.toUpperCase()}<br>RGB(${this.hexToRgb(color)})`;

            testCard.appendChild(testInfo);
            testContainer.appendChild(testCard);

            testCard.addEventListener('mousemove', (e) => this.handleMouseMove(e, testCard));
            testCard.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, testCard));
        }

        testSection.appendChild(testTitle);
        testSection.appendChild(testContainer);
        this.container.appendChild(testSection);
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

    cleanup() {
        document.querySelectorAll('.gem, .web').forEach(card => {
            if (card._resizeObserver) {
                card._resizeObserver.disconnect();
            }
        });
    }

    createHeartButton(color, cardData) {
        const button = document.createElement('button');
        button.className = `like-button${this.isColorLiked(color) ? ' liked' : ''}`;
        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path class="heart-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>`;
        
        const textColor = this.calculateContrastColor(color);
        button.style.color = textColor;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLikeColor(button, cardData);
        });

        return button;
    }

    toggleLikeColor(button, cardData) {
        const isLiked = button.classList.toggle('liked');
        
        if (isLiked) {
            this.likedColors.push(cardData);
        } else {
            const index = this.likedColors.findIndex(c => 
                c.color === cardData.color && c.date === cardData.date
            );
            if (index !== -1) {
                this.likedColors.splice(index, 1);
            }
        }

        localStorage.setItem('likedColors', JSON.stringify(this.likedColors));

        // Update all instances of this color in history
        document.querySelectorAll('.history-card, .color-card').forEach(card => {
            const heartBtn = card.querySelector('.like-button');
            if (heartBtn && this.getCardColor(card) === cardData.color) {
                heartBtn.className = `like-button${isLiked ? ' liked' : ''}`;
            }
        });
    }

    isColorLiked(color) {
        return this.likedColors.some(c => c.color === color);
    }

    // Add new helper method to get card's color
    getCardColor(card) {
        const background = card.style.background || card.style.backgroundColor;
        if (background.includes('linear-gradient')) {
            return background.match(/#[a-fA-F0-9]{6}/g)[0];
        }
        return background;
    }
}

module.exports = ColorComponent;
