const ChinesePattern = require('./patterns/ChinesePattern');
const GemPattern = require('./patterns/GemPattern');
const WebPattern = require('./patterns/WebPattern');
const LavaPattern = require('./patterns/LavaPattern');
const ScalesPattern = require('./patterns/ScalesPattern');
const ColorUtils = require('../ColorUtils');

class Roulette {
    static createRouletteModal(dailyColorData, onComplete) {
        const modal = document.createElement('div');
        modal.className = 'roulette-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'roulette-modal-content';

        const rouletteContainer = document.createElement('div');
        rouletteContainer.className = 'roulette-container';

        // Create and append rectangles with the daily color data
        this.createRectangles(rouletteContainer, dailyColorData);
        
        const skipButton = document.createElement('button');
        skipButton.className = 'skip-button';
        skipButton.textContent = 'Skip';
        skipButton.addEventListener('click', () => {
            modal.remove();
            if (onComplete) onComplete();
        });

        modalContent.appendChild(rouletteContainer);
        modalContent.appendChild(skipButton);
        modal.appendChild(modalContent);

        setTimeout(() => {
            this.startAnimation(rouletteContainer);
            // Auto-close modal after animation
            // setTimeout(() => {
            //     modal.remove();
            //     if (onComplete) onComplete();
            // }, 10500); // 8.5 seconds (8s animation + 0.5s buffer)
        }, 100);

        return modal;
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

        // Apply patterns based on the roll
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
    
    static createRectangles(container, dailyColorData) {
        const numberOfRectangles = 80;
        const targetIndex = Math.floor(numberOfRectangles * 0.85);
    
        for (let i = 0; i < numberOfRectangles; i++) {
            const rectangle = document.createElement('div');
            rectangle.className = 'roulette-rectangle';
            
            if (i === targetIndex) {
                // Use the daily color data for the target card
                this.applySpecialEffects(rectangle, dailyColorData);
                rectangle.classList.add('target-card');
                rectangle.dataset.index = i;
            } else {
                const colorData = ColorUtils.generateRandomColor();
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