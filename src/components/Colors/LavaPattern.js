const ColorUtils = require('./ColorUtils');

class LavaPattern {
    constructor() {
        this.blobCount = 7;
    }

    addPattern(card, cardColor, secondColor = null) {
        const uniqueId = `lava-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add('lava-pattern');
        svg.setAttribute('viewBox', '0 0 400 600');
        
        let gradientColors;
        if (secondColor) {
            // For gradient cards, create more dynamic gradients using both colors
            const color1 = ColorUtils.adjustColor(cardColor);
            const color2 = ColorUtils.adjustColor(secondColor);
            gradientColors = {
                center: color1.center,
                middle: color2.center,
                edge: color2.edge
            };
        } else {
            gradientColors = ColorUtils.adjustColor(cardColor);
        }
        
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <filter id="goo-${uniqueId}">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9" result="cm" />
            </filter>
            <radialGradient id="blobGradient-${uniqueId}" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
                <stop offset="0%" stop-color="${gradientColors.center}" />
                ${secondColor ? `<stop offset="50%" stop-color="${gradientColors.middle}" />` : ''}
                <stop offset="100%" stop-color="${gradientColors.edge}" />
            </radialGradient>
        `;
        svg.appendChild(defs);

        // Create blob container with unique filter reference
        const blobContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        blobContainer.setAttribute('filter', `url(#goo-${uniqueId})`);

        // Create blobs with unique gradient reference
        for (let i = 0; i < this.blobCount; i++) {
            const blob = this.createBlob(uniqueId);
            blobContainer.appendChild(blob);
            this.animateBlob(blob);
        }

        svg.appendChild(blobContainer);
        card.appendChild(svg);
    }

    createBlob(uniqueId) {
        const blob = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        blob.setAttribute('r', this.randomBetween(20, 50));
        blob.setAttribute('cx', this.randomBetween(100, 300));
        blob.setAttribute('cy', -50);
        blob.setAttribute('fill', `url(#blobGradient-${uniqueId})`);
        return blob;
    }

    animateBlob(blob) {
        const duration = this.randomBetween(14, 20);
        const delay = this.randomBetween(0, 10);
        
        const animate = () => {
            const keyframes = [
                { transform: `translateY(0)`, offset: 0 },
                { transform: `translateY(600px)`, offset: 1 }
            ];

            const timing = {
                duration: duration * 1000,
                iterations: Infinity,
                direction: 'alternate',
                easing: 'ease-in-out',
                delay: delay * 1000
            };

            blob.animate(keyframes, timing);
        };

        animate();
    }

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}

module.exports = LavaPattern;
