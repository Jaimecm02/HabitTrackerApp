function calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedDates = [...dates].sort((a, b) => {
        const dateA = new Date(a + 'T00:00:00');
        const dateB = new Date(b + 'T00:00:00');
        return dateB - dateA;
    });
    
    let streak = 0;
    let currentDate = today;
    
    for (const date of sortedDates) {
        const habitDate = new Date(date + 'T00:00:00');
        habitDate.setHours(0, 0, 0, 0);
        
        const daysDifference = Math.floor((currentDate - habitDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference > 1) {
            break;
        }
        
        streak++;
        currentDate = habitDate;
    }
    
    return streak;
}

function getStreakLevel(streak) {
    if (streak >= 365) return 'streak-diamond';
    if (streak >= 180) return 'streak-platinum';
    if (streak >= 90) return 'streak-gold';
    if (streak >= 30) return 'streak-silver';
    if (streak >= 7) return 'streak-bronze';
    return '';
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function createYearGrid(habit, year) {
    const grid = document.createElement('div');
    grid.className = 'year-grid';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);
    
    const startDate = new Date(year, 0, 1);
    startDate.setHours(0, 0, 0, 0);
    
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    
    const firstDayOfWeek = (startDate.getDay() + 6) % 7;
    const emptyCells = firstDayOfWeek;
    
    const totalCells = totalDays + emptyCells;
    const columns = Math.ceil(totalCells / 7);
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    for (let i = 0; i < emptyCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell empty-cell';
        grid.appendChild(cell);
    }
    
    // Calculate the maximum number of repetitions for the habit
    let maxRepetitions = 1;
    if (habit.multipleCompletions && habit.repetitions) {
        const reps = Object.values(habit.repetitions);
        if (reps.length > 0) {
            const max = Math.max(...reps);
            maxRepetitions = max > 0 ? max : 1;
        }
    }
    
    for (let i = 0; i < totalDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
    
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        currentDate.setHours(0, 0, 0, 0);
    
        const dateStr = formatDate(currentDate);
        
        cell.setAttribute('data-date', dateStr);
    
        const dayNumber = document.createElement('span');
        dayNumber.textContent = currentDate.getDate();
        dayNumber.style.fontSize = '8px';
        dayNumber.style.position = 'absolute';
        dayNumber.style.top = '2px';
        dayNumber.style.left = '2px';
        dayNumber.style.color = 'rgba(255, 255, 255, 0.5)';
        cell.appendChild(dayNumber);
    
        // Handle cell coloring based on habit type
        if (habit.multipleCompletions) {
            // Check repetitions for multiple completions
            const rep = habit.repetitions ? habit.repetitions[dateStr] : 0;
            if (rep > 0) {
                const opacity = rep / maxRepetitions;
                cell.style.backgroundColor = `rgba(${hexToRgb(habit.color)}, ${opacity})`;
            }
        } else {
            // Check dates array for non-multiple completions
            if (habit.dates.includes(dateStr)) {
                cell.style.backgroundColor = habit.color;
            }
        }
    
        if (dateStr === todayStr) {
            cell.classList.add('today');
        }
    
        grid.appendChild(cell);
    }
    
    return grid;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

module.exports = {
    calculateStreak,
    getStreakLevel,
    createYearGrid
};