# Git Visually Frontend

This directory contains the frontend application for **Git Visually**, an interactive dashboard that visualizes Git repositories using **Tambo AI's Generative UI**.

## Purpose

The frontend provides a rich, interactive interface for users to:
1.  **Input**: Enter a GitHub repository URL.
2.  **Analyze**: Trigger the backend analysis.
3.  **Visualize**: Interact with AI-generated visualizations of the repository's structure, dependencies, and execution flow.
4.  **Explore**: Dive deep into specific files and functions using specialized viewers.

## Architecture

The frontend is a modern Single Page Application (SPA) built with:
*   **React 18**
*   **Vite** (Build tool)
*   **TypeScript**

### The Tambo AI Aspect (Generative UI)

The core innovation of this project is its use of **Generative UI**, powered by the **Tambo React SDK** (`@tambo-ai/react`).

Unlike traditional dashboards with static widgets, Git Visually uses an AI assistant to **dynamically select and render** the most appropriate visualization based on the user's query and the repository's data.

*   **`TamboProvider`** (`src/providers/TamboProvider.tsx`): Wraps the application to provide the AI context and connection.
*   **`useTamboThread`**: Maps the conversation state to the UI. The assistant "speaks" not just in text, but in **UI Components**.
*   **`AnalysisView`** (`src/components/AnalysisView.tsx`): The main orchestrator. It receives a JSON analysis from the backend and feeds it into the Tambo thread context. The AI then decides which component to render:
    *   **Dependency Graph**: For architectural overviews.
    *   **Execution Flow**: For understanding data movement.
    *   **Function Explorer**: For deep code inspection.

### Key Components

*   **`src/components/visualizations/`**:
    *   **`DependencyGraph.tsx`**: Force-directed graph for file dependencies.
    *   **`ExecutionFlowView.tsx`**: Layered architecture view with data flow arrows.
    *   **`FunctionExplorer.tsx`**: Interactive file browser with function lists.
*   **`src/components/RepoInput.tsx`**: Simple, validation-ready input form for repository URLs.

## Getting Started

### Prerequisites

*   Node.js 16+
*   npm or yarn

### Installation

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.
