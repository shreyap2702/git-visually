# Git Visually

**Git Visually** is an interactive tool that transforms static Git repositories into dynamic, visual explorations. Powered by **Tambo AI's Generative UI**, it intelligently analyzes code structure and generates tailored visualizations to help you understand complex projects faster.

## Features

*   **Generative UI**: Automatically selects the best visualization component based on your query and the repository's data.
*   **Dependency Graph**: Interactive force-directed graph showing file relationships and dependencies.
*   **Execution Flow**: High-level architectural view illustrating data movement between layers.
*   **Function Explorer**: Deep dive into individual files with a GitHub-themed function browser.
*   **AI Chat Interface**: Ask questions about the codebase and get visual answers.

## 🏗 Architecture & The Tambo AI Aspect

The project consists of two main parts:

1.  **Backend** (`/backend`): A Python service that clones repositories, analyzes file structures, and extracts metadata into a structured JSON format.
2.  **Frontend** (`/frontend`): A react application that uses the **Tambo React SDK** (`@tambo-ai/react`) to connect the backend analysis with the UI.

### How it Works (Generative UI)

The "magic" happens in the integration with **Tambo AI**. Instead of hardcoding which chart to show, the frontend feeds the backend's analysis JSON into the AI context. The AI assistant then:
1.  Understands the user's intent (e.g., "Show me the database schema" vs. "How does the login flow work?").
2.  Selects the most appropriate React component (`DependencyGraph`, `ExecutionFlowView`, etc.) from the available library.
3.  Populates the component with the relevant data from the analysis.
4.  Renders the visualization seamlessly within the chat interface.

## Getting Started

To run the full application, you need to start both the backend and frontend servers.

### 1. Start the Backend

```bash
cd backend
# Install dependencies
uv sync # or pip install -r requirements.txt
# Run the server
uv run src/api.py # or python src/api.py
```

### 2. Start the Frontend

```bash
cd frontend
# Install dependencies (first time only)
npm install
# Run the dev server
npm run dev
```

Visit `http://localhost:5173` to start visualizing!

## Documentation

For more detailed information, see the README files in each directory:

*   [Backend Documentation](./backend/README.md)
*   [Frontend Documentation](./frontend/README.md)
