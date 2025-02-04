class LavaPattern {
    constructor() {
        this.blobCount = 5;
    }

    addPattern(card) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add('lava-pattern');
        svg.setAttribute('viewBox', '0 0 400 600');
        
        // Add filter definitions
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <filter id="goo-${card.id}">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9" result="cm" />
            </filter>
        `;
        svg.appendChild(defs);

        // Create blob container
        const blobContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        blobContainer.setAttribute('filter', `url(#goo-${card.id})`);

        // Create blobs
        for (let i = 0; i < this.blobCount; i++) {
            const blob = this.createBlob(card.style.backgroundColor);
            blobContainer.appendChild(blob);
            this.animateBlob(blob);
        }

        svg.appendChild(blobContainer);
        card.appendChild(svg);
    }

    createBlob(color) {
        const blob = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        blob.setAttribute('r', this.randomBetween(20, 50));
        blob.setAttribute('cx', this.randomBetween(100, 300));
        blob.setAttribute('cy', -50);
        blob.setAttribute('fill', this.adjustColor(color));
        return blob;
    }

    animateBlob(blob) {
        const duration = this.randomBetween(14, 50);
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

    adjustColor(color) {
        // Calculate contrast color for blobs
        const rgb = this.hexToRgb(color);
        if (!rgb) return '#FFFFFF';
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        const blobColor = brightness > 128 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
        return blobColor;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

module.exports = LavaPattern;
