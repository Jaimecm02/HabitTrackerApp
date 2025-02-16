const GemPattern = require('./UI/patterns/GemPattern');
const WebPattern = require('./UI/patterns/WebPattern');
const ChinesePattern = require('./UI/patterns/ChinesePattern');
const LavaPattern = require('./UI/patterns/LavaPattern');
const ScalesPattern = require('./UI/patterns/ScalesPattern');
const ColorUtils = require('./ColorUtils');
const fs = require('fs');
const path = require('path');
const { type } = require('os');

const MainCard = require('./UI/MainCard');
const HistoryCard = require('./UI/HistoryCard');
const HeartButton = require('./UI/HeartButton');
const Roulette = require('./UI/Roulette');

class ColorComponent {
    constructor() {
        this.container = document.getElementById('colorComponent');
        this.gemPattern = new GemPattern();
        this.webPattern = new WebPattern();
        this.chinesePattern = new ChinesePattern();
        this.lavaPattern = new LavaPattern();
        this.scalesPattern = new ScalesPattern();
        this.dbName = 'ColorHistoryDB';
        this.storeName = 'colorHistory';
        this.db = null;
        this.jsonFilePath = path.join(__dirname, 'colorHistory.json');
        this.mainCard = new MainCard(this);
        this.historyCard = new HistoryCard(this);
        this.heartButton = new HeartButton(this);
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
                const { color, secondColor, holographic, gradient, gem, web, chinese, lava, rotateCard, scales, borderType } = ColorUtils.generateRandomColor();
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
                    rotateCard,
                    scales,
                    borderType
                };
                
                this.saveColorToHistory(data, true);
                resolve(data);
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
        this.generateDailyColor().then((data) => {
            const today = new Date().toDateString();
    
            // Save today's color to history with all properties
            this.saveColorToHistory({ ...data, date: today });
    
            // Get updated color history
            this.getColorHistory().then(colorHistory => {
                const cardIndex = colorHistory.findIndex(item => item.date === today) + 1;
    
                // Create and append the white rectangle
                const roulette = Roulette.createRoulette(data);
                this.container.appendChild(roulette);

                // Create main color card
                const card = this.mainCard.createMainCard({ ...data, cardNumber: cardIndex });
                this.container.appendChild(card);
    
                // Create and append the separator
                const separator = document.createElement('div');
                this.container.appendChild(separator);
                separator.className = 'separator';

    
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

        colorHistory.forEach((item) => {
            const historyCard = this.historyCard.createHistoryCard(item);
            historyContainer.appendChild(historyCard);
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
        return this.heartButton.createHeartButton(color, cardData);
    }

    toggleLikeColor(button, cardData) {
        this.heartButton.toggleLikeColor(button, cardData);
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

}

module.exports = ColorComponent;
