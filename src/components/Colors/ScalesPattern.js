class ScalesPattern {

    generatePoints(width, height) {
        const points = [];

        // Grid parameters
        const dx = 45; // Horizontal spacing between circles
        const dy = (dx * Math.sqrt(3)) / 7; // Vertical spacing between circles
        const radius = dx / 2; // Radius of each circle

        // Number of circles in x and y directions
        const nbx = Math.ceil(width / dx) + 2;
        const nby = Math.ceil(height / dy) + 4;

        // Generate points in a hexagonal grid
        for (let ky = 0; ky < nby; ky++) {
            for (let kx = 0; kx < nbx; kx++) {
                // Calculate the x and y positions with offset for every other row
                const x = (kx - 1 + (ky % 2) / 2) * dx;
                const y = (nby - 3 - ky) * dy;

                // Add the point if it's within the canvas bounds
                if (x >= -radius && x <= width + radius && y >= -radius && y <= height + radius) {
                    points.push([x, y]);
                }
            }
        }

        return points;
    }

    generateScales(width, height, points) {
        // Creates circles around each point
        const scales = [];
        points.forEach(point => {
            const scale = {
                x: point[0],
                y: point[1],
                radius: Math.min(width, height) / 15
            };
            scales.push(scale);
        });

        return scales;
    }

    drawScales(ctx, scales, color, secondColor = null, gradientType = 'perScale') {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'; // Lighter stroke for subtle effect
        ctx.lineWidth = 1;
    
        function hexToRgb(hex) {
            const bigint = parseInt(hex.slice(1), 16);
            return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
        }
    
        function adjustColor(color, amount) {
            return [
                Math.max(0, Math.min(255, color[0] + amount)),
                Math.max(0, Math.min(255, color[1] + amount)),
                Math.max(0, Math.min(255, color[2] + amount))
            ];
        }
    
        const baseColor = hexToRgb(color);
        const lightColor = adjustColor(baseColor, 5); // Softer highlight
        const darkColor = adjustColor(baseColor, -5); // Softer shadow
    
        const lightColorStr = `rgb(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]})`;
        const darkColorStr = `rgb(${darkColor[0]}, ${darkColor[1]}, ${darkColor[2]})`;
    
        let secondColorRgb = null;
        if (secondColor) {
            secondColorRgb = hexToRgb(secondColor);
        }
    
        scales.sort((a, b) => a.y - b.y);
    
        if (gradientType === 'global') {
            // Create a global gradient for the entire card
            const globalGradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
    
            if (secondColorRgb) {
                // Use base color and second color for the gradient
                globalGradient.addColorStop(0, `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`);
                globalGradient.addColorStop(1, `rgb(${secondColorRgb[0]}, ${secondColorRgb[1]}, ${secondColorRgb[2]})`);
            } else {
                // Use base color for both ends of the gradient (solid color)
                globalGradient.addColorStop(0, `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`);
                globalGradient.addColorStop(1, `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`);
            }
    
            ctx.fillStyle = globalGradient;
        }
    
        scales.forEach(scale => {
            if (gradientType === 'perScale') {
                const gradient = ctx.createRadialGradient(
                    scale.x, scale.y - scale.radius * 0.2, scale.radius * 0.4, // Larger highlight area
                    scale.x, scale.y, scale.radius
                );
    
                if (secondColorRgb) {
                    // Blend the second color into the gradient
                    const midColor = [
                        (baseColor[0] + secondColorRgb[0]) / 2,
                        (baseColor[1] + secondColorRgb[1]) / 2,
                        (baseColor[2] + secondColorRgb[2]) / 2
                    ];
                    gradient.addColorStop(0, lightColorStr);
                    gradient.addColorStop(0.2, `rgb(${midColor[0]}, ${midColor[1]}, ${midColor[2]})`); // Adjusted color stop
                    gradient.addColorStop(1, darkColorStr);
                } else {
                    gradient.addColorStop(0, lightColorStr);
                    gradient.addColorStop(0.2, `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`); // Adjusted color stop
                    gradient.addColorStop(1, darkColorStr);
                }
    
                ctx.fillStyle = gradient;
            }
    
            ctx.beginPath();
            ctx.arc(scale.x, scale.y, scale.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    addScalesPattern(card, randomSeed, color, secondColor = null, gradientType = 'perScale') {
        const canvas = document.createElement('canvas');
        canvas.className = 'scales-pattern';

        const updateCanvas = () => {
            const rect = card.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            const points = this.generatePoints(rect.width, rect.height, randomSeed);
            const scales = this.generateScales(rect.width, rect.height, points);

            this.drawScales(ctx, scales, color, secondColor, gradientType);
        };

        card.appendChild(canvas);
        const observer = new ResizeObserver(updateCanvas);
        observer.observe(card);
        card._resizeObserver = observer;
    }
}

module.exports = ScalesPattern;