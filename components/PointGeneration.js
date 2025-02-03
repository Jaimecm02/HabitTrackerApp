class PointGeneration {
    static generatePoints(width, height, options = {}) {
        const {
            pointCount = 50,
            randomPointsFactor = 1/3
        } = options;

        const points = [
            [0, 0],
            [0, height],
            [width, 0],
            [width, height]
        ];
        
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleStep = Math.PI * 2 * goldenRatio;
        
        for (let i = 0; i < pointCount; i++) {
            const distance = (i / pointCount) * Math.min(width, height) / 2;
            const angle = i * angleStep;
            
            const x = width/2 + Math.cos(angle) * distance;
            const y = height/2 + Math.sin(angle) * distance;
            
            points.push([x, y]);
        }
        
        for (let i = 0; i < pointCount * randomPointsFactor; i++) {
            points.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }
        
        return points;
    }
}

module.exports = PointGeneration;
