const ColorUtils = require('../ColorUtils');

class HeartButton {
    constructor(colorComponent) {
        this.colorComponent = colorComponent;
    }

    createHeartButton(color, cardData) {
        const button = document.createElement('button');
        button.className = 'like-button';
        
        // Updated SVG with explicit dimensions and styling
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" style="display: block;">
                <path class="heart-path" 
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    style="stroke-width: 2;"
                />
            </svg>`;

        const textColor = ColorUtils.calculateContrastColor(color);
        button.style.color = textColor;
        
        // Ensure button is visible with proper z-index and opacity
        button.style.opacity = '1';
        button.style.zIndex = '9999';
        button.style.pointerEvents = 'auto';

        // Check liked status from database
        this.colorComponent.isColorLiked(cardData.cardNumber).then(isLiked => {
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

        const transaction = this.colorComponent.db.transaction([this.colorComponent.storeName], 'readwrite');
        const store = transaction.objectStore(this.colorComponent.storeName);

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
                    this.colorComponent.saveToJSON();
                };
            }
        };
    }
}

module.exports = HeartButton;