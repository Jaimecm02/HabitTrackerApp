const ColorUtils = require('../../ColorUtils');

class ChinesePattern {
    getRandomChineseCharacter() {
        const characters = {
            '福': 'Fortune',
            '禄': 'Wealth',
            '寿': 'Longevity',
            '喜': 'Joy',
            '爱': 'Love',
            '德': 'Virtue',
            '智': 'Wisdom',
            '信': 'Trust',
            '仁': 'Kindness',
            '勇': 'Courage',
            '和': 'Peace',
            '平': 'Balance',
            '安': 'Safety',
            '康': 'Health',
            '宁': 'Tranquility'
        };
        const chars = Object.keys(characters);
        const char = chars[Math.floor(Math.random() * chars.length)];
        return { character: char, translation: characters[char] };
    }

    addChineseCharacter(container, color, storedChar = null, storedTranslation = null) {
        let character, translation;
        
        if (storedChar && storedTranslation) {
            character = storedChar;
            translation = storedTranslation;
        } else {
            const result = this.getRandomChineseCharacter();
            character = result.character;
            translation = result.translation;
        }
        
        const textColor = ColorUtils.calculateContrastColor(color);

        const charElement = document.createElement('div');
        charElement.className = 'chinese-character';
        charElement.style.color = textColor;
        charElement.textContent = character;

        const translationElement = document.createElement('div');
        translationElement.className = 'chinese-translation';
        translationElement.style.color = textColor;
        translationElement.textContent = translation;

        container.appendChild(charElement);
        container.appendChild(translationElement);
        
        return { character, translation };
    }
}

module.exports = ChinesePattern;
