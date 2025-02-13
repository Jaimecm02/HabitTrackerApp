const ColorUtils = require('./ColorUtils');

class HistoryCard {
    constructor(colorComponent) {
        this.colorComponent = colorComponent;
    }

    createHistoryCard(item) {
        const historyCard = document.createElement('div');
        historyCard.className = `history-card${item.holographic ? ' holographic' : ''}
                                            ${item.gem ? ' gem' : ''}
                                            ${item.web ? ' web' : ''}
                                            ${item.chinese ? ' chinese' : ''}
                                            ${item.lava ? ' lava' : ''}
                                            ${item.scales ? ' scales' : ''}`;
        if (item.gradient) {
            historyCard.style.background = `linear-gradient(45deg, ${item.color}, ${item.secondColor})`;
        } else {
            historyCard.style.backgroundColor = item.color;
        }

        if (item.borderType !== 'none') {
            historyCard.classList.add(`border-${item.borderType}`);
        }

        if (item.gem) {
            this.colorComponent.gemPattern.addDelaunayPattern(historyCard, item.randomSeed);
        } else if (item.web) {
            this.colorComponent.webPattern.addPattern(historyCard, item.randomSeed);
        } else if (item.chinese) {
            this.colorComponent.chinesePattern.addChineseCharacter(historyCard, item.color, item.chineseChar, item.chineseTranslation);
        } else if (item.lava) {
            this.colorComponent.lavaPattern.addPattern(historyCard, item.color, item.gradient ? item.secondColor : null, item.randomSeed);
        } else if (item.scales) {
            this.colorComponent.scalesPattern.addScalesPattern(historyCard, item.randomSeed, item.color, item.gradient ? item.secondColor : null);
        }

        const historyInfo = document.createElement('div');
        historyInfo.className = 'history-info';
        historyInfo.style.color = ColorUtils.calculateContrastColor(item.color);
        historyInfo.style.fontWeight = 'bold';
        historyInfo.innerHTML = item.gradient ?
            `${item.date}<br>HEX: ${item.color} → ${item.secondColor}<br>RGB_1(${item.rgb})<br>RGB_2(${item.rgb2})<br>(${item.randomSeed})` :
            `${item.date}<br>HEX: ${item.color} <br>RGB(${item.rgb})<br>(${item.randomSeed})`;

        const historyCardNumber = document.createElement('div');
        historyCardNumber.className = 'card-number';
        historyCardNumber.style.fontWeight = 'bold';
        historyCardNumber.textContent = item.cardNumber;
        historyCardNumber.style.position = 'absolute';
        historyCardNumber.style.top = '10px';
        historyCardNumber.style.right = '10px';
        historyCardNumber.style.color = ColorUtils.calculateContrastColor(item.color);

        historyCard.appendChild(historyInfo);
        historyCard.appendChild(historyCardNumber);

        const heartButton = this.colorComponent.createHeartButton(item.color, item);
        historyCard.appendChild(heartButton);

        historyCard.addEventListener('mousemove', (e) => this.colorComponent.handleMouseMove(e, historyCard));
        historyCard.addEventListener('mouseleave', (e) => this.colorComponent.handleMouseLeave(e, historyCard));
        historyCard.addEventListener('click', () => {
            console.log(`History card clicked`);
        });

        return historyCard;
    }
}

module.exports = HistoryCard;