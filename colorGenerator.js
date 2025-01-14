function generateDailyColor() {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const r = (seed * 123) % 255;
    const g = (seed * 456) % 255;
    const b = (seed * 789) % 255;
    
    return `rgb(${r}, ${g}, ${b})`;
}

module.exports = { generateDailyColor };
