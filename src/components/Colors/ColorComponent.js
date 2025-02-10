const GemPattern = require('./GemPattern');
const WebPattern = require('./WebPattern');
const ChinesePattern = require('./ChinesePattern');
const LavaPattern = require('./LavaPattern');
const ColorUtils = require('./ColorUtils');
const fs = require('fs');
const path = require('path');
const { type } = require('os');

class ColorComponent {
    constructor() {
        this.container = document.getElementById('colorComponent');
        this.gemPattern = new GemPattern();
        this.webPattern = new WebPattern();
        this.chinesePattern = new ChinesePattern();
        this.lavaPattern = new LavaPattern();
        this.dbName = 'ColorHistoryDB';
        this.storeName = 'colorHistory';
        this.db = null; 
        this.jsonFilePath = path.join(__dirname, 'colorHistory.json');
        this.initDB();
    }

    initDB() {
        const request = indexedDB.open(this.dbName, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
                const store = db.createObjectStore(this.storeName, { keyPath: 'cardNumber', autoIncrement: true });
            } else {
                const store = event.target.transaction.objectStore(this.storeName);
                if (!store.indexNames.contains('cardNumber')) {
                    store.createIndex('cardNumber', 'cardNumber', { unique: true });
                }
            }
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadFromJSON(); // Load initial data from JSON
            this.updateCardNumbers(); // Update card numbers if necessary
            this.setupComponent();
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
        };
    }

    saveToJSON() {
        this.getColorHistory().then(colorHistory => {
            const jsonData = JSON.stringify(colorHistory, null, 2);
            fs.writeFile(this.jsonFilePath, jsonData, (err) => {
                if (err) console.error('Error saving to JSON:', err);
                else console.log('Data synced to JSON file');
            });
        });
    }

    loadFromJSON() {
        try {
            if (fs.existsSync(this.jsonFilePath)) {
                const jsonData = fs.readFileSync(this.jsonFilePath, 'utf8');
                const colorHistory = JSON.parse(jsonData);
                
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                // Clear existing data
                store.clear();
                
                // Import JSON data
                colorHistory.forEach(entry => {
                    store.put(entry);
                });
            }
        } catch (err) {
            console.error('Error loading from JSON:', err);
        }
    }

    updateCardNumbers() {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const allData = event.target.result;
            allData.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
            allData.forEach((data, index) => {
                data.cardNumber = index + 1;
                store.put(data);
            });
            this.saveToJSON(); // Sync to JSON after updating
        };

        request.onerror = (event) => {
            console.error('Error updating card numbers:', event.target.error.message);
        };
    }

    generateDailyColor() {
        const today = new Date().toDateString();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = (event) => {
                const allEntries = event.target.result;
                const existingEntry = allEntries.find(entry => entry.date === today);
                
                if (existingEntry) {
                    resolve(existingEntry);
                    return;
                }

                // Only generate new color if there's no existing entry
                const { color, secondColor, holographic, gradient, gem, web, chinese, lava, rotateCard } = this.generateRandomColor();
                let chineseChar = null;
                let chineseTranslation = null;
                
                if (chinese) {
                    const result = this.chinesePattern.getRandomChineseCharacter();
                    chineseChar = result.character;
                    chineseTranslation = result.translation;
                }

                const data = {
                    date: today,
                    color,
                    secondColor,
                    holographic,
                    gradient,
                    gem,
                    web,
                    chinese,
                    lava,
                    chineseChar,
                    chineseTranslation,
                    rgb: ColorUtils.hexToRgbString(color),
                    rgb2: gradient ? ColorUtils.hexToRgbString(secondColor) : null,
                    cardNumber: 0,
                    liked: false,
                    randomSeed: Math.random(),
                    rotateCard
                };
                
                this.saveColorToHistory(data, true);
                resolve(data);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
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
    
        const rotateCard = Math.random() < 0.01; // 1% chance of rotated card
        const patternRoll = Math.random();
        const gem = patternRoll < 0.01; // 1% chance for gem pattern
        const web = patternRoll >= 0.01 && patternRoll < 0.02; // 1% chance for web pattern
        const chinese = patternRoll >= 0.02 && patternRoll < 0.03; // 1% chance for Chinese character
        const lava = patternRoll >= 0.03 && patternRoll < 0.04; // 1% chance for lava pattern

        return { color, secondColor, holographic, gradient, gem, web, chinese, lava, rotateCard };
    }

    saveColorToHistory(data) {
        if (!this.db) {
            console.error('Database is not initialized.');
            return;
        }

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const allEntries = event.target.result;
            const existingEntry = allEntries.find(entry => entry.date === data.date);
            
            if (existingEntry) {
                // If entry exists, don't save again
                return;
            }

            const cardNumber = allEntries.length + 1;
            data.cardNumber = cardNumber;

            store.put(data).onsuccess = () => {
                console.log('Color history saved successfully.');
                this.saveToJSON();
            };
        };
    }

    getColorHistory() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    setupComponent() {
        if (!this.db) {
            console.error('Database is not initialized.');
            return;
        }
        this.container.innerHTML = '';
        this.generateDailyColor().then(({ color, secondColor, holographic, gradient, gem, web, chinese, lava, chineseChar, chineseTranslation, rotateCard }) => {
            const rgbColor = ColorUtils.hexToRgbString(color);
            const textColor = ColorUtils.calculateContrastColor(color);
            const today = new Date().toDateString();

            // Save today's color to history with all properties
            this.saveColorToHistory({ color, secondColor, date: today, holographic, gradient, gem, web, chinese, lava, chineseChar, chineseTranslation, rotateCard });

            // Get updated color history
            this.getColorHistory().then(colorHistory => {
                const cardIndex = colorHistory.findIndex(item => item.date === today) + 1;

                // Create main color card
                const card = document.createElement('div');
                card.id = 'color-card-' + Date.now();
                card.className = `color-card${holographic ? ' holographic' : ''}${gem ? ' gem' : ''}${web ? ' web' : ''}${chinese ? ' chinese' : ''}${lava ? ' lava' : ''}`;
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
                    this.chinesePattern.addChineseCharacter(card, color, chineseChar, chineseTranslation);
                } else if (lava) {
                    this.lavaPattern.addPattern(card, color, gradient ? secondColor : null);
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
                    `RGB_1(${rgbColor})<br>RGB_2(${ColorUtils.hexToRgbString(secondColor)})<br>` :
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
                    chinese,
                    lava,
                    chineseChar,
                    chineseTranslation,
                    liked: this.isColorLiked(color),
                    cardNumber: cardIndex
                };

                // Add heart button to main card
                const heartButton = this.createHeartButton(color, cardData);
                card.appendChild(heartButton);

                // Add mouse move handlers to main card
                card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
                card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));

                // Add history section
                this.addHistorySection(colorHistory);
            });
        });
    }

    addHistorySection(colorHistory) {
        if (!this.db) {
            console.error('Database is not initialized.');
            return;
        }

        const historySection = document.createElement('div');
        historySection.className = 'history-section';

        const historyTitle = document.createElement('h2');
        historyTitle.textContent = 'COLOR HISTORY';
        historyTitle.className = 'history-title';

        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-container';

        // Sort by date in descending order (most recent first)
        colorHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        colorHistory.forEach((item, index) => {
            const historyCard = document.createElement('div');
            historyCard.className = `history-card${item.holographic ? ' holographic' : ''}${item.gem ? ' gem' : ''}${item.web ? ' web' : ''}${item.chinese ? ' chinese' : ''}${item.lava ? ' lava' : ''}`;
            if (item.gradient) {
                historyCard.style.background = `linear-gradient(45deg, ${item.color}, ${item.secondColor})`;
            } else {
                historyCard.style.backgroundColor = item.color;
            }

            if (item.gem) {
                this.gemPattern.addDelaunayPattern(historyCard, item.randomSeed);
            } else if (item.web) {
                this.webPattern.addPattern(historyCard, item.randomSeed);
            } else if (item.chinese) {
                this.chinesePattern.addChineseCharacter(historyCard, item.color, item.chineseChar, item.chineseTranslation);
            } else if (item.lava) {
                this.lavaPattern.addPattern(historyCard, item.color, item.gradient ? item.secondColor : null);
            }

            const historyInfo = document.createElement('div');
            historyInfo.className = 'history-info';
            historyInfo.style.color = ColorUtils.calculateContrastColor(item.color);
            historyInfo.style.fontWeight = 'bold';
            historyInfo.innerHTML = item.gradient ? 
                `${item.date}<br>HEX: ${item.color} → ${item.secondColor}<br>RGB_1(${item.rgb})<br>RGB_2(${item.rgb2})` :
                `${item.date}<br>HEX: ${item.color} <br>RGB(${item.rgb})`;

            const historyCardNumber = document.createElement('div');
            historyCardNumber.className = 'card-number';
            historyCardNumber.style.fontWeight = 'bold';
            historyCardNumber.textContent = item.cardNumber;
            historyCardNumber.style.position = 'absolute';
            historyCardNumber.style.top = '10px';
            historyCardNumber.style.right = '10px';
            historyCardNumber.style.color = ColorUtils.calculateContrastColor(item.color);

            historyCard.appendChild(historyInfo);
            historyCard.appendChild(historyCardNumber);
            historyContainer.appendChild(historyCard);

            // Add heart button to history cards
            const heartButton = this.createHeartButton(item.color, item);
            historyCard.appendChild(heartButton);

            // Add mouse move handlers to history cards
            historyCard.addEventListener('mousemove', (e) => this.handleMouseMove(e, historyCard));
            historyCard.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, historyCard));
            historyCard.addEventListener('click', () => {
                console.log(`History card clicked`);
            });
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

    cleanup() {
        document.querySelectorAll('.gem, .web').forEach(card => {
            if (card._resizeObserver) {
                card._resizeObserver.disconnect();
            }
        });
    }

    createHeartButton(color, cardData) {
        const button = document.createElement('button');
        button.className = 'like-button';
        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path class="heart-path" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>`;
        
        const textColor = ColorUtils.calculateContrastColor(color);
        button.style.color = textColor;

        // Check liked status from database
        this.isColorLiked(cardData.cardNumber).then(isLiked => {
            if (isLiked) {
                button.classList.add('liked');
            }
        });

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleLikeColor(button, cardData);
        });

        return button;
    }

    toggleLikeColor(button, cardData) {
        const isLiked = button.classList.toggle('liked');
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        // Find the record using cardNumber
        const request = store.get(cardData.cardNumber);
        
        request.onsuccess = (event) => {
            const record = event.target.result;
            if (record) {
                record.liked = isLiked;
                store.put(record).onsuccess = () => {
                    // Update UI for all instances of this color
                    document.querySelectorAll('.history-card, .color-card').forEach(card => {
                        const heartBtn = card.querySelector('.like-button');
                        if (heartBtn && parseInt(card.querySelector('.card-number').textContent) === cardData.cardNumber) {
                            heartBtn.className = `like-button${isLiked ? ' liked' : ''}`;
                        }
                    });
                    this.saveToJSON(); // Sync to JSON after updating
                };
            }
        };
    }

    isColorLiked(cardNumber) {
        if (!this.db) return false;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(cardNumber);
            
            request.onsuccess = (event) => {
                const record = event.target.result;
                resolve(record ? record.liked : false);
            };
            
            request.onerror = () => resolve(false);
        });
    }

    getCardColor(card) {
        const background = card.style.background || card.style.backgroundColor;
        if (background.includes('linear-gradient')) {
            return background.match(/#[a-fA-F0-9]{6}/g)[0];
        }
        return background;
    }

}

module.exports = ColorComponent;
