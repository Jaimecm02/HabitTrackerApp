const PointGeneration = require('./PointGeneration');

class GemPattern {
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

    drawGemPattern(ctx, triangles, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        triangles.forEach(triangle => {
            const centerX = (triangle[0][0] + triangle[1][0] + triangle[2][0]) / 3;
            const centerY = (triangle[0][1] + triangle[1][1] + triangle[2][1]) / 3;
            
            const distanceFromCenter = Math.hypot(
                centerX - width / 2,
                centerY - height / 2
            ) || 0;
            
            const maxDistance = Math.hypot(width / 2, height / 2) || 1;
            const proximity = Math.max(0, Math.min(1, 1 - (distanceFromCenter / maxDistance))) || 0;
            
            const gradient = ctx.createLinearGradient(
                triangle[0][0] || 0, 
                triangle[0][1] || 0,
                triangle[2][0] || 0, 
                triangle[2][1] || 0
            );
            
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
            
            const edgeOpacity = Math.max(0.1, Math.min(0.3, 0.1 + proximity * 0.2)) || 0.1;
            ctx.strokeStyle = `rgba(255, 255, 255, ${edgeOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
    }

    addDelaunayPattern(card, randomSeed) {
        const canvas = document.createElement('canvas');
        canvas.className = 'delaunay-pattern';
        
        const updateCanvas = () => {
            const rect = card.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            const points = PointGeneration.generatePoints(rect.width, rect.height, { randomSeed: randomSeed });
            const triangles = this.delaunayTriangulation(points);
            
            this.drawGemPattern(ctx, triangles, rect.width, rect.height);
        };

        card.appendChild(canvas);
        const observer = new ResizeObserver(updateCanvas);
        observer.observe(card);
        card._resizeObserver = observer;
    }
}

module.exports = GemPattern;
