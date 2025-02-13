function calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    let currentDate = today;

    for (const date of sortedDates) {
        const habitDate = new Date(date);
        habitDate.setHours(0, 0, 0, 0);

        // Break streak if we miss a day
        if ((currentDate - habitDate) / (1000 * 60 * 60 * 24) > 1) {
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

function createYearGrid(habit) {
    const grid = document.createElement('div');
    grid.className = 'year-grid';
    
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    
    // Calculate leap year
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const totalDays = isLeapYear ? 366 : 365;
    
    // Get the number of empty cells for the start of the grid
    const weekStart = 1; // Monday
    const firstDayOfWeek = (startDate.getDay() + 6) % 7; // Adjust to start from Monday
    const emptyCells = (7 + firstDayOfWeek - weekStart) % 7;
    
    // Calculate the number of columns (weeks)
    const totalCells = totalDays + emptyCells;
    const columns = Math.ceil(totalCells / 7);
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Create empty cells
    for (let i = 0; i < emptyCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell empty-cell';
        grid.appendChild(cell);
    }
    
    // Create day cells
    for (let i = 0; i < totalDays; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';

        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const [yyyy, mm, dd] = dateStr.split('-');
        const formattedDate = `${dd}-${mm}-${yyyy}`;
        cell.setAttribute('data-date', formattedDate);
        
        if (habit.dates.includes(dateStr)) {
            cell.style.backgroundColor = habit.color;
        }
        
        // Only allow clicking if it's today's date
        if (dateStr === today) {
            cell.classList.add('today');
            cell.addEventListener('click', async () => {
                const result = await this.ipcRenderer.invoke('toggle-habit-date', {
                    habitId: habit.id,
                    date: dateStr
                });
                
                if (result) {
                    const habitIndex = this.habits.findIndex(h => h.id === habit.id);
                    if (habitIndex !== -1) {
                        this.habits[habitIndex] = result;
                        cell.style.backgroundColor = result.dates.includes(dateStr) ? habit.color : '';
                    }
                }
            });
        }
        
        grid.appendChild(cell);
    }
    
    return grid;
}

module.exports = {
    calculateStreak,
    getStreakLevel,
    createYearGrid
};