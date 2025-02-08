class PointGeneration {
    static generatePoints(width, height, options = {}) {
        const {
            pointCount = 500,
            randomPointsFactor = 1/3,
            distribution = 'goldenSpiral', // new parameter
            clusterCount = 3,             // for clustered distribution
            clusterSpread = 0.4,          // for clustered distribution
            centerX,                      // for radialGradient distribution
            centerY,                      // for radialGradient distribution
            anchorPosition = 'bottomLeft',    // 'center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'
            spacingFactor = 1.21,          // for radialGradient distribution - controls how quickly spacing increases
            minPointsPerCircle = 40        // minimum points in each circle to prevent gaps
        } = options;

        // Always start with corner points
        const points = [
            [0, 0],
            [0, height],
            [width, 0],
            [width, height]
        ];

        switch (distribution) {
            case 'goldenSpiral':
                points.push(...this.generateGoldenSpiral(width, height, pointCount));
                break;
            case 'clustered':
                points.push(...this.generateClusters(width, height, pointCount, clusterCount, clusterSpread));
                break;
            case 'uniform':
                points.push(...this.generateUniform(width, height, pointCount));
                break;
                case 'radialGradient':
                    // Determine center point based on anchorPosition
                    let anchorX = centerX;
                    let anchorY = centerY;
                    
                    if (!centerX || !centerY) {
                        switch (anchorPosition) {
                            case 'topLeft':
                                anchorX = 0;
                                anchorY = 0;
                                break;
                            case 'topRight':
                                anchorX = width;
                                anchorY = 0;
                                break;
                            case 'bottomLeft':
                                anchorX = 0;
                                anchorY = height;
                                break;
                            case 'bottomRight':
                                anchorX = width;
                                anchorY = height;
                                break;
                            default: // 'center'
                                anchorX = width/2;
                                anchorY = height/2;
                        }
                    }
                    
                    points.push(...this.generateRadialGradient(
                        width, height, pointCount, 
                        anchorX, anchorY, 
                        spacingFactor, minPointsPerCircle
                    ));
                    break;
            default:
                throw new Error(`Unknown distribution type: ${distribution}`);
        }

        // Add random points if factor > 0
        if (randomPointsFactor > 0) {
            points.push(...this.generateRandom(width, height, Math.floor(pointCount * randomPointsFactor)));
        }

        return points;
    }

    static generateGoldenSpiral(width, height, pointCount) {
        const points = [];
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleStep = Math.PI * 2 * goldenRatio;

        for (let i = 0; i < pointCount; i++) {
            const distance = (i / pointCount) * Math.min(width, height) / 2;
            const angle = i * angleStep;
            
            const x = width/2 + Math.cos(angle) * distance;
            const y = height/2 + Math.sin(angle) * distance;
            
            points.push([x, y]);
        }

        return points;
    }

    static generateClusters(width, height, pointCount, clusterCount, spread) {
        const points = [];
        const clusters = [];

        // Generate cluster centers
        for (let i = 0; i < clusterCount; i++) {
            clusters.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }

        // Generate points around clusters
        const pointsPerCluster = Math.floor(pointCount / clusterCount);
        clusters.forEach(cluster => {
            for (let i = 0; i < pointsPerCluster; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * Math.min(width, height) * spread;
                
                const x = cluster[0] + Math.cos(angle) * distance;
                const y = cluster[1] + Math.sin(angle) * distance;
                
                // Ensure points are within bounds
                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    points.push([x, y]);
                }
            }
        });

        return points;
    }

    static generateUniform(width, height, pointCount) {
        const points = [];
        // Using Poisson disk-like sampling for more uniform distribution
        const cellSize = Math.sqrt((width * height) / pointCount);
        const grid = new Array(Math.ceil(width / cellSize))
            .fill(null)
            .map(() => new Array(Math.ceil(height / cellSize)).fill(false));

        for (let i = 0; i < pointCount; i++) {
            let attempts = 0;
            let placed = false;

            while (!placed && attempts < 30) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const gridX = Math.floor(x / cellSize);
                const gridY = Math.floor(y / cellSize);

                if (!grid[gridX][gridY]) {
                    points.push([x, y]);
                    grid[gridX][gridY] = true;
                    placed = true;
                }

                attempts++;
            }
        }

        return points;
    }

    static generateRandom(width, height, count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            points.push([
                Math.random() * width,
                Math.random() * height
            ]);
        }
        return points;
    }

    static generateRadialGradient(width, height, pointCount, centerX, centerY, spacingFactor, minPointsPerCircle = 8) {
        const points = [];
        
        // Determine maximum radius based on anchor position
        const maxRadius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        
        // Add the center point first
        points.push([centerX, centerY]);
        
        // Generate concentric circles with increasing spacing
        let currentRadius = Math.min(width, height) * 0.01; // Start with 5% of smaller dimension
        let pointsRemaining = pointCount - 1;
        let circleIndex = 0;
        
        while (pointsRemaining > 0 && currentRadius < maxRadius) {
            // Calculate number of points for this circle based on circumference
            const circumference = 2 * Math.PI * currentRadius;
            const basePointCount = Math.ceil(circumference / (Math.min(width, height) * 0.1)); // Scale with size
            
            const pointsInCircle = Math.min(
                Math.max(minPointsPerCircle, basePointCount), // Ensure minimum points
                pointsRemaining
            );
            
            // Generate points around the circle with slight randomization
            const angleStep = (2 * Math.PI) / pointsInCircle;
            for (let i = 0; i < pointsInCircle; i++) {
                // Add small random variation to angle and radius for natural look
                const angleVariation = (Math.random() - 0.5) * (angleStep * 0.25);
                const radiusVariation = (Math.random() - 0.5) * (currentRadius * 0.1);
                
                const angle = i * angleStep + angleVariation;
                const radius = currentRadius + radiusVariation;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                // Only add point if it's within bounds
                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    points.push([x, y]);
                    pointsRemaining--;
                }
            }
            
            // Increase radius with smoother progression
            currentRadius += currentRadius * (spacingFactor - 1);
            circleIndex++;
        }
        
        return points;
    }
}

module.exports = PointGeneration;