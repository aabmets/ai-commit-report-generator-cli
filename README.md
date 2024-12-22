# AI Git Weekly Report Generator

A command-line tool that generates intelligent weekly reports from your GitHub repository commits using AI. This tool analyzes your git commit history and provides structured, meaningful summaries of development activities.

## Features

- Fetch and analyze git commits within specified date ranges
- Generate AI-powered summaries of commit changes
- Categorize changes into features, fixes, breaking changes, and refactors
- Track development tools usage and patterns
- Support for multiple authors and collaborative analysis
- Interactive CLI interface

## Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm package manager
- Git repository
- Google AI API key (for AI-powered summaries)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd ai-cli-github-weekly-report-generator
```

2. Install dependencies using pnpm:
```bash
pnpm install
```

3. Create a `.env` file in the root directory and add your Google AI API key:
```env
GOOGLE_API_KEY=your_api_key_here
```

## Usage

Start the CLI tool:
```bash
pnpm start
```

The interactive CLI will guide you through:
- Selecting date ranges for report generation
- Choosing specific authors or analyzing all contributors
- Generating detailed summaries of development activities

## Tech Stack

- TypeScript
- LangChain with Google AI
- CLI Progress
- Inquirer for interactive CLI
- date-fns for date manipulation
- Zod for schema validation
- Chalk for CLI styling

## Project Structure

- `commitFetcher.ts`: Handles Git commit retrieval and analysis
- `commitSummary.ts`: Defines the schema for commit summaries
- `renderers.ts`: Manages output rendering
- `services/menu.service.ts`: Handles CLI menu interactions
- `json-local-cache.ts`: Manages local caching of data

## License

MIT

## Author

[Sid Ali Assoul](https://github.com/stormsidali2001)
