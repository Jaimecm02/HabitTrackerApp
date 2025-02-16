class ColorUtils {
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHsl(r, g, b) {
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

    static hslToRgb(h, s, l) {
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

    static adjustColor(color) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return { center: '#FF69B4', edge: '#4B0082' };
        
        const oppositeColor = {
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        };

        const hsl = this.rgbToHsl(oppositeColor.r, oppositeColor.g, oppositeColor.b);
        
        const centerColor = this.hslToRgb(
            hsl.h,
            Math.min(100, hsl.s + Math.floor(Math.random() * 10)),
            Math.min(100, hsl.l + Math.floor(Math.random() * 20 + 10))
        );
        
        const edgeColor = this.hslToRgb(
            hsl.h,
            Math.min(100, hsl.s),
            Math.max(20, hsl.l - Math.floor(Math.random() * 20 + 10))
        );

        const centerOpacity = 0.8 + (Math.random() * 0.2);
        const edgeOpacity = 0.5 + (Math.random() * 0.3);

        return {
            center: `rgba(${centerColor.r}, ${centerColor.g}, ${centerColor.b}, ${centerOpacity})`,
            edge: `rgba(${edgeColor.r}, ${edgeColor.g}, ${edgeColor.b}, ${edgeOpacity})`
        };
    }

    static hexToRgbString(hex) {
        const rgb = this.hexToRgb(hex);
        return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
    }

    static calculateContrastColor(hexcolor) {
        const r = parseInt(hexcolor.slice(1, 3), 16);
        const g = parseInt(hexcolor.slice(3, 5), 16);
        const b = parseInt(hexcolor.slice(5, 7), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }

    static generateRandomColor() {
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
        const scales = patternRoll >= 0.04 && patternRoll < 0.05; // 1% chance for scales pattern

        // Border type probabilities
        const borderRoll = Math.random();
        let borderType = 'none'; // Default to classic (no border)

        if (borderRoll < 0.05) { // 5% chance for Silver
            borderType = 'silver';
        } else if (borderRoll < 0.08) { // 3% chance for Gold
            borderType = 'gold';
        } else if (borderRoll < 0.095) { // 1.5% chance for Platinum
            borderType = 'platinum';
        } else if (borderRoll < 0.1) { // 0.5% chance for Rainbow
            borderType = 'rainbow';
        }

        return { color, secondColor, holographic, gradient, gem, web, chinese, lava, rotateCard, scales, borderType };
    }
}


module.exports = ColorUtils;
