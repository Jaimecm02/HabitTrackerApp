class ScalesPattern {

    generatePoints(width, height) {
        const points = [];

        // Grid parameters
        const dx = width/8; // Horizontal spacing between circles
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
        // If secondColor is provided, force global gradient
        if (secondColor) {
            gradientType = 'global';
        }

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 0.5;
    
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

        function getRgbaString(rgb, alpha) {
            return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        }
    
        const baseColor = hexToRgb(color);
        const lightColor = adjustColor(baseColor, 3);
        const veryLightColor = adjustColor(baseColor, 8);
        const darkColor = adjustColor(baseColor, -3);
        const veryDarkColor = adjustColor(baseColor, -8);
    
        let secondColorRgb = secondColor ? hexToRgb(secondColor) : null;
    
        scales.sort((a, b) => a.y - b.y);
    
        if (gradientType === 'global') {
            // Create a global gradient for the entire card
            const globalGradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // Enhanced global gradient with smoother transitions
            if (secondColorRgb) {
                globalGradient.addColorStop(0, getRgbaString(baseColor, 1));
                globalGradient.addColorStop(0.3, getRgbaString(adjustColor(baseColor, 5), 0.95));
                globalGradient.addColorStop(0.5, getRgbaString(secondColorRgb, 0.9));
                globalGradient.addColorStop(0.7, getRgbaString(adjustColor(secondColorRgb, -5), 0.95));
                globalGradient.addColorStop(1, getRgbaString(secondColorRgb, 1));
            } else {
                globalGradient.addColorStop(0, getRgbaString(baseColor, 1));
                globalGradient.addColorStop(1, getRgbaString(baseColor, 1));
            }
    
            ctx.fillStyle = globalGradient;
        }
    
        scales.forEach(scale => {
            if (gradientType === 'perScale') {
                // Create multiple gradients for more complex lighting effect
                const mainGradient = ctx.createRadialGradient(
                    scale.x, scale.y - scale.radius * 0.15, 0,
                    scale.x, scale.y, scale.radius * 1.05
                );

                const highlightGradient = ctx.createRadialGradient(
                    scale.x, scale.y - scale.radius * 0.3, scale.radius * 0.1,
                    scale.x, scale.y - scale.radius * 0.2, scale.radius * 0.8
                );
        
                // Single color gradient since second color forces global
                mainGradient.addColorStop(0, getRgbaString(veryLightColor, 0.95));
                mainGradient.addColorStop(0.3, getRgbaString(lightColor, 0.9));
                mainGradient.addColorStop(0.5, getRgbaString(baseColor, 0.85));
                mainGradient.addColorStop(0.7, getRgbaString(darkColor, 0.85));
                mainGradient.addColorStop(1, getRgbaString(veryDarkColor, 0.9));
        
                // Draw the main shape with the gradient
                ctx.beginPath();
                ctx.arc(scale.x, scale.y, scale.radius, 0, Math.PI * 2);
                ctx.fillStyle = mainGradient;
                ctx.fill();
                
                // Add subtle highlight overlay
                ctx.beginPath();
                ctx.arc(scale.x, scale.y, scale.radius, 0, Math.PI * 2);
                ctx.fillStyle = highlightGradient;
                ctx.globalCompositeOperation = 'overlay';
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            } else {
                // For global gradient, just draw the circles
                ctx.beginPath();
                ctx.arc(scale.x, scale.y, scale.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Add very subtle stroke
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