class ColorComponent {
    constructor() {
        this.container = document.getElementById('colorComponent');
        this.setupComponent();
    }

    delaunayTriangulation(points) {
        // Helper functions
        const EPSILON = 1e-8;
        
        function Triangle(a, b, c) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.edges = [[a, b], [b, c], [c, a]];
            this.circumcircle = this.calculateCircumcircle();
        }
    
        Triangle.prototype.calculateCircumcircle = function() {
            const [ax, ay] = this.a;
            const [bx, by] = this.b;
            const [cx, cy] = this.c;
    
            const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
            if (Math.abs(d) < EPSILON) return null; // Collinear points
    
            const a2 = ax * ax + ay * ay;
            const b2 = bx * bx + by * by;
            const c2 = cx * cx + cy * cy;
    
            const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
            const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
            const radius = Math.hypot(ux - ax, uy - ay);
    
            return { x: ux, y: uy, radius };
        };
    
        // Bowyer-Watson algorithm implementation
        const superTriangle = this.createSuperTriangle(points);
        let triangles = [new Triangle(superTriangle[0], superTriangle[1], superTriangle[2])];
    
        points.forEach(point => {
            const badTriangles = [];
            triangles.forEach(triangle => {
                if (triangle.circumcircle && 
                    Math.hypot(point[0] - triangle.circumcircle.x, 
                              point[1] - triangle.circumcircle.y) <= triangle.circumcircle.radius) {
                    badTriangles.push(triangle);
                }
            });
    
            const polygon = [];
            badTriangles.forEach(triangle => {
                triangle.edges.forEach(edge => {
                    const edgeKey = edge.map(p => `${p[0]},${p[1]}`).sort().join('-');
                    const shared = badTriangles.some(other => 
                        other !== triangle && 
                        other.edges.some(e => 
                            e[0] === edge[1] && e[1] === edge[0]
                        )
                    );
                    if (!shared) polygon.push(edge);
                });
            });
    
            triangles = triangles.filter(t => !badTriangles.includes(t));
            polygon.forEach(edge => {
                triangles.push(new Triangle(edge[0], edge[1], point));
            });
        });
    
        // Filter out triangles with super triangle vertices
        const superPoints = new Set(superTriangle.map(p => `${p[0]},${p[1]}`));
        return triangles
            .filter(t => 
                !superPoints.has(`${t.a[0]},${t.a[1]}`) &&
                !superPoints.has(`${t.b[0]},${t.b[1]}`) &&
                !superPoints.has(`${t.c[0]},${t.c[1]}`)
            )
            .map(t => [t.a, t.b, t.c]);
    }
    
    createSuperTriangle(points) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
    
        points.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
    
        const dx = (maxX - minX) * 10;
        const dy = (maxY - minY) * 10;
        return [
            [minX - dx, minY - dy * 3],
            [minX - dx, maxY + dy],
            [maxX + dx * 3, maxY + dy]
        ];
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
                gem: storedData.gem  // Add gem property
            };
        }

        const { color, secondColor, holographic, gradient, gem } = this.generateRandomColor();

        localStorage.setItem('dailyColor', JSON.stringify({
            date: today,
            color: color,
            secondColor: secondColor,
            holographic: holographic,
            gradient: gradient,
            gem: gem  // Add gem property
        }));

        return { color, secondColor, holographic, gradient, gem };
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
        const gem = Math.random() < 0.01; // 1% chance of gem pattern

        return { color, secondColor, holographic, gradient, gem };
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

    saveColorToHistory(color, date, holographic, gradient, secondColor, gem) {
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
                gem
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
        const { color, secondColor, holographic, gradient, gem } = this.generateDailyColor();
        const rgbColor = this.hexToRgb(color);
        const textColor = this.calculateContrastColor(color);
        const today = new Date().toDateString();

        // Save today's color to history with all properties
        this.saveColorToHistory(color, today, holographic, gradient, secondColor, gem);  // Added gem parameter

        // Get updated color history
        const colorHistory = this.getColorHistory();
        const cardIndex = colorHistory.length;

        // Create main color card
        const card = document.createElement('div');
        card.className = `color-card${holographic ? ' holographic' : ''}${gem ? ' gem' : ''}`;  // Added gem class
        if (gradient) {
            card.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
        } else {
            card.style.backgroundColor = color;
        }

        if (gem) {
            this.addDelaunayPattern(card);
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

    addDelaunayPattern(card) {
        const canvas = document.createElement('canvas');
        canvas.className = 'delaunay-pattern';
        
        // Handle high DPI displays
        const updateCanvas = () => {
            const rect = card.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            // Generate better distributed points using golden ratio
            const points = this.generatePoints(rect.width, rect.height);
            const triangles = this.delaunayTriangulation(points);
            
            this.drawGemPattern(ctx, triangles, rect.width, rect.height);
        };

        // Initial render
        card.appendChild(canvas);
        // Use ResizeObserver to handle card size changes
        const observer = new ResizeObserver(updateCanvas);
        observer.observe(card);
        
        // Store observer reference for cleanup
        card._resizeObserver = observer;
    }

    generatePoints(width, height) {
        const points = [
            [0, 0],
            [0, height],
            [width, 0],
            [width, height]
        ];
        
        const pointCount = 50;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleStep = Math.PI * 2 * goldenRatio;
        
        // Generate points in a spiral pattern for better distribution
        for (let i = 0; i < pointCount; i++) {
            const distance = (i / pointCount) * Math.min(width, height) / 2;
            const angle = i * angleStep;
            
            const x = width/2 + Math.cos(angle) * distance;
            const y = height/2 + Math.sin(angle) * distance;
            
            points.push([x, y]);
        }
        
        // Add some controlled randomness
        for (let i = 0; i < pointCount/2; i++) {
            points.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }
        
        return points;
    }

    drawGemPattern(ctx, triangles, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        triangles.forEach(triangle => {
            const centerX = (triangle[0][0] + triangle[1][0] + triangle[2][0]) / 3;
            const centerY = (triangle[0][1] + triangle[1][1] + triangle[2][1]) / 3;
            
            const distanceFromCenter = Math.hypot(
                centerX - width / 2,
                centerY - height / 2
            ) || 0; // Ensure we have a number, not NaN
            
            const maxDistance = Math.hypot(width / 2, height / 2) || 1; // Prevent division by zero
            const proximity = Math.max(0, Math.min(1, 1 - (distanceFromCenter / maxDistance))) || 0;
            
            // Create more gem-like gradients with safe opacity values
            const gradient = ctx.createLinearGradient(
                triangle[0][0] || 0, 
                triangle[0][1] || 0,
                triangle[2][0] || 0, 
                triangle[2][1] || 0
            );
            
            // Ensure opacity values are valid numbers between 0 and 1
            const baseOpacity1 = Math.max(0.1, Math.min(0.4, 0.1 + proximity * 0.3)) || 0.1;
            const baseOpacity2 = Math.max(0.05, Math.min(0.2, 0.05 + proximity * 0.15)) || 0.05;
            
            gradient.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity1})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${baseOpacity2})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${baseOpacity1})`);
            
            ctx.beginPath();
            ctx.moveTo(triangle[0][0] || 0, triangle[0][1] || 0);
            ctx.lineTo(triangle[1][0] || 0, triangle[1][1] || 0);
            ctx.lineTo(triangle[2][0] || 0, triangle[2][1] || 0);
            ctx.closePath();
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add subtle edges with safe opacity value
            const edgeOpacity = Math.max(0.1, Math.min(0.3, 0.1 + proximity * 0.2)) || 0.1;
            ctx.strokeStyle = `rgba(255, 255, 255, ${edgeOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
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
            historyCard.className = `history-card${item.holographic ? ' holographic' : ''}${item.gem ? ' gem' : ''}`;  // Added gem class
            if (item.gradient) {
                historyCard.style.background = `linear-gradient(45deg, ${item.color}, ${item.secondColor})`;
            } else {
                historyCard.style.backgroundColor = item.color;
            }
            
            if (item.gem) {
                this.addDelaunayPattern(historyCard);
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
        const normalCard = this.createPreviewCard('#FF5733', false, false, false, 'Normal Card');
        const holoCard = this.createPreviewCard('#4287f5', true, false, false, 'Holographic Card');
        const gradientCard = this.createPreviewCard('#33ff57', false, true, false, 'Gradient Card', '#5733ff');
        const gemCard = this.createPreviewCard('#f54287', false, false, true, 'Gem Card');
        const gradientGemCard = this.createPreviewCard('#ff9933', false, true, true, 'Gradient Gem Card', '#9933ff');
        const holoGemCard = this.createPreviewCard('#87f542', true, false, true, 'Holographic Gem Card');
        const holoGradientCard = this.createPreviewCard('#42f587', true, true, false, 'Holographic Gradient Card', '#f58742');
        const holoGradientGemCard = this.createPreviewCard('#8742f5', true, true, true, 'Holographic Gradient Gem Card', '#f54287');

        [normalCard, holoCard, gradientCard, gemCard, gradientGemCard, holoGemCard, holoGradientCard, holoGradientGemCard].forEach(card => {
            previewContainer.appendChild(card);
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
            card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
        });

        previewSection.appendChild(previewTitle);
        previewSection.appendChild(previewContainer);
        this.container.appendChild(previewSection);
    }

    createPreviewCard(color, holographic, gradient, gem, label, secondColor = '#ffffff') {
        const card = document.createElement('div');
        card.className = `preview-card${holographic ? ' holographic' : ''}${gem ? ' gem' : ''}`;
        
        if (gradient) {
            card.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
        } else {
            card.style.backgroundColor = color;
        }

        if (gem) {
            this.addDelaunayPattern(card);
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
            const { color, secondColor, holographic, gradient, gem } = this.generateRandomColor();
            const testCard = document.createElement('div');
            testCard.className = `history-card${holographic ? ' holographic' : ''}`; // Use the same class as history cards
            if (gradient) {
                testCard.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
            } else {
                testCard.style.backgroundColor = color;
            }

            if (gem) {
                testCard.classList.add('gem');
                this.addDelaunayPattern(testCard);
            }

            const testInfo = document.createElement('div');
            testInfo.className = 'history-info'; // Use the same class as history info
            testInfo.style.color = this.calculateContrastColor(color);
            testInfo.style.fontWeight = 'bold';
            testInfo.innerHTML = gradient ? 
                `HEX: ${color.toUpperCase()} → ${secondColor.toUpperCase()}<br>RGB_1(${this.hexToRgb(color)})<br>RGB_2(${this.hexToRgb(secondColor)})<br>GEM: ${gem}` :
                `HEX: ${color.toUpperCase()}<br>RGB(${this.hexToRgb(color)})<br>GEM: ${gem}`;

            testCard.appendChild(testInfo);
            testContainer.appendChild(testCard);

            // Add mouse move handlers to test cards
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
        document.querySelectorAll('.gem').forEach(card => {
            if (card._resizeObserver) {
                card._resizeObserver.disconnect();
            }
        });
    }
}

module.exports = ColorComponent;
