class WebPattern {
    constructor() {
        this.EPSILON = 1e-8;
    }

    delaunayTriangulation(points) {
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
            if (Math.abs(d) < this.EPSILON) return null;
    
            const a2 = ax * ax + ay * ay;
            const b2 = bx * bx + by * by;
            const c2 = cx * cx + cy * cy;
    
            const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
            const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
            const radius = Math.hypot(ux - ax, uy - ay);
    
            return { x: ux, y: uy, radius };
        };

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
        
        for (let i = 0; i < pointCount; i++) {
            const distance = (i / pointCount) * Math.min(width, height) / 2;
            const angle = i * angleStep;
            
            const x = width/2 + Math.cos(angle) * distance;
            const y = height/2 + Math.sin(angle) * distance;
            
            points.push([x, y]);
        }
        
        for (let i = 0; i < pointCount/3; i++) {
            points.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }
        
        return points;
    }

    calculateVoronoiCells(points, triangles) {
        const cells = new Map();
        points.forEach(point => cells.set(point.toString(), []));

        triangles.forEach(triangle => {
            const center = this.calculateTriangleCenter(triangle);
            if (!center) return;

            [
                [triangle[0], triangle[1]],
                [triangle[1], triangle[2]],
                [triangle[2], triangle[0]]
            ].forEach(([p1, p2]) => {
                const p1Str = p1.toString();
                const p2Str = p2.toString();
                
                if (cells.has(p1Str)) {
                    cells.get(p1Str).push({
                        point: p1,
                        center: center,
                        neighbor: p2
                    });
                }
                if (cells.has(p2Str)) {
                    cells.get(p2Str).push({
                        point: p2,
                        center: center,
                        neighbor: p1
                    });
                }
            });
        });

        return cells;
    }

    calculateTriangleCenter(triangle) {
        const [ax, ay] = triangle[0];
        const [bx, by] = triangle[1];
        const [cx, cy] = triangle[2];

        const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(d) < this.EPSILON) return null;

        const a2 = ax * ax + ay * ay;
        const b2 = bx * bx + by * by;
        const c2 = cx * cx + cy * cy;

        const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
        const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;

        return [ux, uy];
    }

    drawPattern(ctx, cells, width, height) {
        ctx.clearRect(0, 0, width, height);

        cells.forEach((cellData) => {
            if (cellData.length < 3) return;

            const point = cellData[0].point;
            cellData.sort((a, b) => {
                const angleA = Math.atan2(a.center[1] - point[1], a.center[0] - point[0]);
                const angleB = Math.atan2(b.center[1] - point[1], b.center[0] - point[0]);
                return angleA - angleB;
            });

            ctx.beginPath();
            ctx.moveTo(cellData[0].center[0], cellData[0].center[1]);
            for (let i = 1; i < cellData.length; i++) {
                ctx.lineTo(cellData[i].center[0], cellData[i].center[1]);
            }
            ctx.closePath();

            const centerX = cellData.reduce((sum, v) => sum + v.center[0], 0) / cellData.length;
            const centerY = cellData.reduce((sum, v) => sum + v.center[1], 0) / cellData.length;
            const distanceFromCenter = Math.hypot(centerX - width / 2, centerY - height / 2);
            const maxDistance = Math.hypot(width / 2, height / 2);
            const proximity = Math.max(0, Math.min(1, 1 - (distanceFromCenter / maxDistance)));

            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, 50
            );
            
            // Increased opacity values
            const baseOpacity = Math.max(0.2, Math.min(0.5, 0.2 + proximity * 0.3));
            gradient.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity * 2.5})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, ${baseOpacity})`);

            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 255, 255, ${baseOpacity * 2})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    addPattern(card) {
        const canvas = document.createElement('canvas');
        canvas.className = 'voronoi-pattern';
        
        const updateCanvas = () => {
            const rect = card.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            const points = this.generatePoints(rect.width, rect.height);
            const triangles = this.delaunayTriangulation(points);
            const cells = this.calculateVoronoiCells(points, triangles);
            
            this.drawPattern(ctx, cells, rect.width, rect.height);
        };

        card.appendChild(canvas);
        const observer = new ResizeObserver(updateCanvas);
        observer.observe(card);
        card._resizeObserver = observer;
    }
}

module.exports = WebPattern;
