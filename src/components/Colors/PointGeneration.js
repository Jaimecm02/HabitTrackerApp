class PointGeneration {
    static seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    static deriveParameters(seed) {
        // Use different offsets for each parameter to ensure independence
        const pointCount = Math.floor(this.seededRandom(seed) * 81) + 20; // 20-100 points
        
        // Select distribution type
        const distributionRand = this.seededRandom(seed + 2);
        const distributions = ['goldenSpiral', 'clustered', 'uniform'];
        const distribution = distributions[Math.floor(distributionRand * distributions.length)];

        return {
            pointCount,
            distribution,
        };
    }

    static generatePoints(width, height, options = {}) {
        const {
            randomSeed = 72340,
            clusterCount = 3,
            clusterSpread = 0.4,
            centerX,
            centerY,
            spacingFactor = 1.21,
            minPointsPerCircle = 40
        } = options;

        // Derive parameters from seed
        const derivedParams = this.deriveParameters(randomSeed);
        
        const points = [
            [0, 0],
            [0, height],
            [width, 0],
            [width, height]
        ];

        switch (derivedParams.distribution) {
            case 'goldenSpiral':
                points.push(...this.generateGoldenSpiral(width, height, derivedParams.pointCount, randomSeed));
                break;
            case 'clustered':
                points.push(...this.generateClusters(width, height, derivedParams.pointCount, clusterCount, clusterSpread, randomSeed));
                break;
            case 'uniform':
                points.push(...this.generateUniform(width, height, derivedParams.pointCount, randomSeed));
                break;
            case 'radialGradient':
                let anchorX = centerX;
                let anchorY = centerY;
                
                if (!centerX || !centerY) {
                    switch (derivedParams.anchorPosition) {
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
                        default:
                            anchorX = width/2;
                            anchorY = height/2;
                    }
                }
                
                points.push(...this.generateRadialGradient(
                    width, height, derivedParams.pointCount,
                    anchorX, anchorY,
                    spacingFactor, minPointsPerCircle,
                    randomSeed
                ));
                break;
            default:
                throw new Error(`Unknown distribution type: ${derivedParams.distribution}`);
        }

        if (derivedParams.randomPointsFactor > 0) {
            points.push(...this.generateRandom(
                width, height, 
                Math.floor(derivedParams.pointCount * derivedParams.randomPointsFactor), 
                randomSeed
            ));
        }

        return points;
    }

    // Rest of the methods remain unchanged
    static generateGoldenSpiral(width, height, pointCount, seed) {
        const points = [];
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleStep = Math.PI * 2 * goldenRatio;

        for (let i = 0; i < pointCount; i++) {
            const distance = (i / pointCount) * Math.min(width, height) / 2;
            const angle = i * angleStep;
            
            const variation = this.seededRandom(seed + i) * 0.1;
            
            const x = width/2 + Math.cos(angle) * distance * (1 + variation);
            const y = height/2 + Math.sin(angle) * distance * (1 + variation);
            
            points.push([x, y]);
        }

        return points;
    }

    static generateClusters(width, height, pointCount, clusterCount, spread, seed) {
        const points = [];
        const clusters = [];

        for (let i = 0; i < clusterCount; i++) {
            clusters.push([
                this.seededRandom(seed + i * 2) * width,
                this.seededRandom(seed + i * 2 + 1) * height
            ]);
        }

        const pointsPerCluster = Math.floor(pointCount / clusterCount);
        clusters.forEach((cluster, clusterIndex) => {
            for (let i = 0; i < pointsPerCluster; i++) {
                const angle = this.seededRandom(seed + clusterCount + clusterIndex * pointsPerCluster + i * 2) * Math.PI * 2;
                const distance = this.seededRandom(seed + clusterCount + clusterIndex * pointsPerCluster + i * 2 + 1) * Math.min(width, height) * spread;
                
                const x = cluster[0] + Math.cos(angle) * distance;
                const y = cluster[1] + Math.sin(angle) * distance;
                
                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    points.push([x, y]);
                }
            }
        });

        return points;
    }

    static generateUniform(width, height, pointCount, seed) {
        const points = [];
        const cellSize = Math.sqrt((width * height) / pointCount);
        const grid = new Array(Math.ceil(width / cellSize))
            .fill(null)
            .map(() => new Array(Math.ceil(height / cellSize)).fill(false));

        for (let i = 0; i < pointCount; i++) {
            let attempts = 0;
            let placed = false;

            while (!placed && attempts < 30) {
                const x = this.seededRandom(seed + i * 2 + attempts) * width;
                const y = this.seededRandom(seed + i * 2 + 1 + attempts) * height;
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

    static generateRandom(width, height, count, seed) {
        const points = [];
        for (let i = 0; i < count; i++) {
            points.push([
                this.seededRandom(seed + i * 2) * width,
                this.seededRandom(seed + i * 2 + 1) * height
            ]);
        }
        return points;
    }

    static generateRadialGradient(width, height, pointCount, centerX, centerY, spacingFactor, minPointsPerCircle = 8, seed) {
        const points = [];
        const maxRadius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        
        points.push([centerX, centerY]);
        
        let currentRadius = Math.min(width, height) * 0.01;
        let pointsRemaining = pointCount - 1;
        let circleIndex = 0;
        let seedOffset = 0;
        
        while (pointsRemaining > 0 && currentRadius < maxRadius) {
            const circumference = 2 * Math.PI * currentRadius;
            const basePointCount = Math.ceil(circumference / (Math.min(width, height) * 0.1));
            
            const pointsInCircle = Math.min(
                Math.max(minPointsPerCircle, basePointCount),
                pointsRemaining
            );
            
            const angleStep = (2 * Math.PI) / pointsInCircle;
            for (let i = 0; i < pointsInCircle; i++) {
                const angleVariation = (this.seededRandom(seed + seedOffset++) - 0.5) * (angleStep * 0.25);
                const radiusVariation = (this.seededRandom(seed + seedOffset++) - 0.5) * (currentRadius * 0.1);
                
                const angle = i * angleStep + angleVariation;
                const radius = currentRadius + radiusVariation;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    points.push([x, y]);
                    pointsRemaining--;
                }
            }
            
            currentRadius += currentRadius * (spacingFactor - 1);
            circleIndex++;
        }
        
        return points;
    }
}

module.exports = PointGeneration;