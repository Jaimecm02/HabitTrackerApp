const ColorUtils = require('../ColorUtils');

class MainCard {
    constructor(colorComponent) {
        this.colorComponent = colorComponent;
    }

    createMainCard(data) {
        const { color, secondColor, holographic, gradient, gem, web, chinese, lava, chineseChar, chineseTranslation, rotateCard, randomSeed, scales, borderType } = data;
        const rgbColor = ColorUtils.hexToRgbString(color);
        const textColor = ColorUtils.calculateContrastColor(color);

        const card = document.createElement('div');
        card.className = `color-card${holographic ? ' holographic' : ''}
                                    ${gem ? ' gem' : ''}
                                    ${web ? ' web' : ''}
                                    ${chinese ? ' chinese' : ''}
                                    ${lava ? ' lava' : ''}
                                    ${scales ? ' scales' : ''}`;

        if (gradient) {
            card.style.background = `linear-gradient(45deg, ${color}, ${secondColor})`;
        } else {
            card.style.backgroundColor = color;
        }

        if (borderType !== 'none') {
            console.log(borderType); // Debugging: Check the borderType value
            card.classList.add(`border-${borderType}`); // Use backticks for template literals
        }

        if (gem) {
            this.colorComponent.gemPattern.addDelaunayPattern(card, randomSeed);
        } else if (web) {
            this.colorComponent.webPattern.addPattern(card, randomSeed, color);
        } else if (chinese) {
            this.colorComponent.chinesePattern.addChineseCharacter(card, color, chineseChar, chineseTranslation);
        } else if (lava) {
            this.colorComponent.lavaPattern.addPattern(card, color, gradient ? secondColor : null, randomSeed);
        } else if (scales) {
            this.colorComponent.scalesPattern.addScalesPattern(card, randomSeed, color, gradient ? secondColor : null);
        }

        const colorInfo = document.createElement('div');
        colorInfo.className = 'color-info';
        colorInfo.style.color = textColor;

        const hexCode = document.createElement('div');
        hexCode.className = 'color-code';
        hexCode.style.fontWeight = 'bold';
        hexCode.textContent = gradient ?
            `HEX: ${color.toUpperCase()} → ${secondColor.toUpperCase()}` :
            `HEX: ${color.toUpperCase()}`;

        const rgbCode = document.createElement('div');
        rgbCode.className = 'color-code';
        rgbCode.style.fontWeight = 'bold';
        rgbCode.innerHTML = gradient ?
            `RGB_1(${rgbColor})<br>RGB_2(${ColorUtils.hexToRgbString(secondColor)})<br>` :
            `RGB(${rgbColor})`;

        const cardNumber = document.createElement('div');
        cardNumber.className = 'card-number';
        cardNumber.style.fontWeight = 'bold';
        cardNumber.textContent = data.cardNumber;
        cardNumber.style.position = 'absolute';
        cardNumber.style.top = '10px';
        cardNumber.style.right = '10px';
        cardNumber.style.color = textColor;

        colorInfo.appendChild(hexCode);
        colorInfo.appendChild(rgbCode);
        card.appendChild(colorInfo);
        card.appendChild(cardNumber);

        const heartButton = this.colorComponent.createHeartButton(color, data);
        card.appendChild(heartButton);

        card.addEventListener('mousemove', (e) => this.colorComponent.handleMouseMove(e, card));
        card.addEventListener('mouseleave', (e) => this.colorComponent.handleMouseLeave(e, card));

        return card;
    }
}

module.exports = MainCard;