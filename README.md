# Smart Escape

Smart Escape is a frontend-only emergency evacuation route simulator built with React and JavaScript.

It helps users find the lowest-cost evacuation route inside a building while considering blocked rooms, blocked corridors, and closed exits. The route is automatically recalculated whenever the building conditions change.

## Features

* Interactive building map
* Lowest-cost evacuation route using Dijkstra's algorithm
* Blocked node handling
* Blocked corridor handling
* Closed exit handling
* Automatic route recalculation
* Bangla and English language support
* Building configuration through JSON import
* Reset simulation
* Visual route highlighting
* Frontend-only application with no backend or database

## How It Works

Smart Escape represents the building as a graph.

* **Nodes** represent rooms, corridors, and exits
* **Edges** represent connections between nodes
* **Costs** represent the movement cost between connected nodes
* **Blocked nodes** cannot be used in the route
* **Blocked corridors** cannot be crossed
* **Closed exits** are excluded from possible evacuation routes

Dijkstra's algorithm is used to calculate the lowest-cost available route to a safe exit.

When the building conditions change, the route is recalculated automatically.

## Tech Stack

* React
* JavaScript
* Vite
* CSS
* SVG
* Dijkstra's Algorithm

## Run Locally

```bash
npm install
npm run dev
```

Then open the local development URL shown in the terminal.

## Project Type

Frontend-only web application.

No backend, database, or server-side storage is required.

## License

This project is licensed under the MIT License.
