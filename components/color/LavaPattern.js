class LavaPattern {
    constructor() {
        this.blobCount = 7;
    }

    addPattern(card, cardColor) {
        const uniqueId = `lava-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add('lava-pattern');
        svg.setAttribute('viewBox', '0 0 400 600');
        
        const gradientColors = this.adjustColor(cardColor);
        
        // Add filter definitions with unique IDs
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <filter id="goo-${uniqueId}">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9" result="cm" />
            </filter>
            <radialGradient id="blobGradient-${uniqueId}" cx="50%" cy="50%" r="50%" fx="25%" fy="25%">
                <stop offset="0%" stop-color="${gradientColors.center}" />
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

    adjustColor(color) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return { center: '#FF69B4', edge: '#4B0082' };
        
        const oppositeColor = {
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        };

        const hsl = this.rgbToHsl(oppositeColor.r, oppositeColor.g, oppositeColor.b);
        
        // Use the same base color but adjust lightness and opacity for depth
        const centerColor = this.hslToRgb(
            hsl.h,
            Math.min(100, hsl.s + this.randomBetween(0, 10)),
            Math.min(100, hsl.l + this.randomBetween(10, 20))
        );
        
        const edgeColor = this.hslToRgb(
            hsl.h,
            Math.min(100, hsl.s),
            Math.max(20, hsl.l - this.randomBetween(10, 20))
        );

        // Vary opacity for visual interest
        const centerOpacity = 0.8 + (Math.random() * 0.2); // Between 0.8 and 1.0
        const edgeOpacity = 0.5 + (Math.random() * 0.3);   // Between 0.4 and 0.7

        return {
            center: `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, ${centerOpacity})`,
            edge: `rgba(${edgeColor.r}, ${edgeColor.g}, ${edgeColor.b}, ${edgeOpacity})`
        };
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
}

module.exports = LavaPattern;
