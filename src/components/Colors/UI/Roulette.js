const ChinesePattern = require('./patterns/ChinesePattern');
const GemPattern = require('./patterns/GemPattern');
const WebPattern = require('./patterns/WebPattern');
const LavaPattern = require('./patterns/LavaPattern');
const ScalesPattern = require('./patterns/ScalesPattern');

class Roulette {
    static createRoulette() {
        const rouletteContainer = document.createElement('div');
        rouletteContainer.className = 'roulette-container';

        // Create and append rectangles
        this.createRectangles(rouletteContainer);
        
        setTimeout(() => {
            this.startAnimation(rouletteContainer);
        }, 100);

        return rouletteContainer;
    }

    static getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        let secondColor = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
            secondColor += letters[Math.floor(Math.random() * 16)];
        }
        
        // Match probabilities from ColorComponent
        const holographic = Math.random() < 0.035;
        const gradient = Math.random() < 0.065;
        const rotateCard = Math.random() < 0.01;

        const patternRoll = Math.random();
        const gem = patternRoll < 0.01;
        const web = patternRoll >= 0.01 && patternRoll < 0.02;
        const chinese = patternRoll >= 0.02 && patternRoll < 0.03;
        const lava = patternRoll >= 0.03 && patternRoll < 0.04;
        const scales = patternRoll >= 0.04 && patternRoll < 0.05;

        const borderRoll = Math.random();
        let borderType = 'none';
        if (borderRoll < 0.05) {
            borderType = 'silver';
        } else if (borderRoll < 0.08) {
            borderType = 'gold';
        } else if (borderRoll < 0.095) {
            borderType = 'platinum';
        } else if (borderRoll < 0.1) {
            borderType = 'rainbow';
        }

        return { 
            color, 
            secondColor, 
            holographic, 
            gradient, 
            gem, 
            web, 
            chinese, 
            lava, 
            rotateCard, 
            scales, 
            borderType 
        };
    }
    
    static applySpecialEffects(rectangle, colorData) {
        // Add appropriate class names first
        rectangle.className = `roulette-rectangle${colorData.holographic ? ' holographic' : ''}
                             ${colorData.gem ? ' gem' : ''}
                             ${colorData.web ? ' web' : ''}
                             ${colorData.chinese ? ' chinese' : ''}
                             ${colorData.lava ? ' lava' : ''}
                             ${colorData.scales ? ' scales' : ''}`;

        // Apply background color or gradient
        if (colorData.gradient) {
            rectangle.style.background = `linear-gradient(45deg, ${colorData.color}, ${colorData.secondColor})`;
        } else {
            rectangle.style.backgroundColor = colorData.color;
        }

        // Apply card rotation if needed
        if (colorData.rotateCard) {
            rectangle.style.transform = 'rotate(180deg)';
        }

        // Generate a random seed for patterns
        const randomSeed = Math.random();

        // Apply patterns based on the roll, matching MainCard.js implementation
        if (colorData.gem) {
            const gemPattern = new GemPattern();
            gemPattern.addDelaunayPattern(rectangle, randomSeed);
        } else if (colorData.web) {
            const webPattern = new WebPattern();
            webPattern.addPattern(rectangle, randomSeed, colorData.color);
        } else if (colorData.chinese) {
            const chinesePattern = new ChinesePattern();
            const result = chinesePattern.getRandomChineseCharacter();
            chinesePattern.addChineseCharacter(rectangle, colorData.color, result.character, result.translation);
        } else if (colorData.lava) {
            const lavaPattern = new LavaPattern();
            lavaPattern.addPattern(rectangle, colorData.color, colorData.gradient ? colorData.secondColor : null, randomSeed);
        } else if (colorData.scales) {
            const scalesPattern = new ScalesPattern();
            scalesPattern.addScalesPattern(rectangle, randomSeed, colorData.color, colorData.gradient ? colorData.secondColor : null);
        }

        // Apply border effects
        if (colorData.borderType !== 'none') {
            rectangle.classList.add(`border-${colorData.borderType}`);
        }
    }
    
    static createRectangles(container) {
        const numberOfRectangles = 80;
        const targetIndex = Math.floor(numberOfRectangles * 0.85);
    
        for (let i = 0; i < numberOfRectangles; i++) {
            const rectangle = document.createElement('div');
            rectangle.className = 'roulette-rectangle';
            
            if (i === targetIndex) {
                rectangle.style.backgroundColor = '#FFFFFF';
                rectangle.classList.add('target-card');
                rectangle.dataset.index = i;
            } else {
                const colorData = this.getRandomColor();
                this.applySpecialEffects(rectangle, colorData);
            }
            
            rectangle.style.left = `${i * 250}px`;
            container.appendChild(rectangle);
        }
    }

    static startAnimation(container) {
        const rectangles = container.querySelectorAll('.roulette-rectangle');
        const targetCard = container.querySelector('.target-card');
        const containerWidth = container.offsetWidth;
        const centerPosition = containerWidth / 2 - 100;
        const targetIndex = parseInt(targetCard.dataset.index);
        const targetInitialPosition = targetIndex * 250;
        const distanceToMove = -(targetInitialPosition - centerPosition);
        
        rectangles.forEach(rectangle => {
            rectangle.style.transform = 'translateX(0)';
        });

        container.offsetHeight;

        rectangles.forEach(rectangle => {
            rectangle.style.transition = 'transform 8s cubic-bezier(0.1, 0.7, 0.1, 1)';
            rectangle.style.transform = `translateX(${distanceToMove}px)`;
        });
    }

    static cleanup(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
}

module.exports = Roulette;