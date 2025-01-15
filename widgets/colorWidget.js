class ColorWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.render();
        this.update();
    }

    render() {
        this.container.innerHTML = `
            <div class="widget-card">
                <h2>Daily Color</h2>
                <div class="color-box" id="colorBox"></div>
                <p>Color: <span id="colorValue"></span></p>
            </div>
        `;
    }

    generateDailyColor() {
        const today = new Date().toDateString();
        const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const r = (seed * 123) % 255;
        const g = (seed * 456) % 255;
        const b = (seed * 789) % 255;
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    update() {
        const color = this.generateDailyColor();
        document.getElementById('colorBox').style.backgroundColor = color;
        document.getElementById('colorValue').textContent = color;
    }
}

module.exports = ColorWidget;
