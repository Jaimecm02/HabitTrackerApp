class Roulette {
    static createRoulette() {
        const rouletteContainer = document.createElement('div');
        rouletteContainer.className = 'roulette-container';

        // Create and append rectangles
        this.createRectangles(rouletteContainer);
        
        // Add a slight delay before starting the animation to ensure DOM is ready
        setTimeout(() => {
            this.startAnimation(rouletteContainer);
        }, 100);

        return rouletteContainer;
    }

    static getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    static createRectangles(container) {
        const numberOfRectangles = 80;
        const targetIndex = Math.floor(numberOfRectangles * 0.85); // 85% position
    
        for (let i = 0; i < numberOfRectangles; i++) {
            const rectangle = document.createElement('div');
            rectangle.className = 'roulette-rectangle';
            
            // Set the target card to white, others to random colors
            if (i === targetIndex) {
                rectangle.style.backgroundColor = '#FFFFFF';
                rectangle.classList.add('target-card');
                rectangle.dataset.index = i;
            } else {
                rectangle.style.backgroundColor = this.getRandomColor();
            }
            
            rectangle.style.left = `${i * 250}px`;
            container.appendChild(rectangle);
        }
    }

    static startAnimation(container) {
        const rectangles = container.querySelectorAll('.roulette-rectangle');
        const targetCard = container.querySelector('.target-card');
        const containerWidth = container.offsetWidth;
        
        // Calculate the center position
        const centerPosition = containerWidth / 2 - 100; // 100 is half the card width
        
        // Calculate how far the target card needs to move to reach center
        const targetIndex = parseInt(targetCard.dataset.index);
        const targetInitialPosition = targetIndex * 250; // Initial position of target card
        const distanceToMove = -(targetInitialPosition - centerPosition);
        
        // Reset all rectangles to starting position
        rectangles.forEach(rectangle => {
            rectangle.style.transform = 'translateX(0)';
        });

        // Force reflow
        container.offsetHeight;

        // Apply the animation to move left
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