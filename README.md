# Habit Tracker Desktop Application

A desktop application built with Electron.

## Installation

1. Clone this repository
2. Install dependencies:
```sh
npm install
```

## Development

To run the application in development mode:
```sh
npm start
```

## Building

To create a new version:

1. Update the version in `package.json`:
```json
{
  "version": "1.1.0"
}
```

2. Build the application:
```sh
npm run package
npm run make
```

## Requirements

- Node.js 14.x or higher
- npm 6.x or higher

## Components

### Habit Tracker
The Habit Tracker component is responsible for managing user habits. It allows users to add new habits, delete existing ones, and mark habits as complete for the day. The component also calculates streaks and displays them, providing visual feedback on the user's progress.

### Analytics
The Analytics component provides visual analytics for the habits. It includes features such as weekly trends and habit comparisons. Users can see their total habits, completion rates for the current month, best streaks, and consistency percentages. The component uses Chart.js to render interactive charts.

### Color Component
The Color Component generates and displays daily colors. It includes special effects like holographic and gem patterns. The component saves the daily color to local storage and maintains a history of past colors. It also provides a preview section to showcase different types of color cards, including normal, holographic, gradient, and gem cards.

## License

MIT License
