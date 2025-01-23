class ColorComponent {
    constructor() {
        this.container = document.getElementById('colorComponent');
        this.setupComponent();
    }

    generateDailyColor() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('dailyColor');
        const storedData = stored ? JSON.parse(stored) : null;

        if (storedData && storedData.date === today) {
            return storedData.color;
        }

        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }

        localStorage.setItem('dailyColor', JSON.stringify({
            date: today,
            color: color
        }));

        return color;
    }

    setupComponent() {
        this.container.innerHTML = '';
        const color = this.generateDailyColor();

        const card = document.createElement('div');
        card.className = 'color-card';
        card.style.cssText = `
            background-color: ${color};
            width: 200px;
            height: 200px;
            border-radius: 10px;
            margin: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;

        const colorCode = document.createElement('div');
        colorCode.className = 'color-code';
        colorCode.textContent = color;
        colorCode.style.cssText = `
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 0 0 10px 10px;
        `;

        card.appendChild(colorCode);
        this.container.appendChild(card);
    }
}

module.exports = ColorComponent;
