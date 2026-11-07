# NatureSnap AI

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-CommonJS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Groq](https://img.shields.io/badge/Groq-API-f55036)](https://groq.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20site-234b35)](https://naturesnap-ai.onrender.com/)

Upload a nature photo and get a short, AI-generated report with an identification, facts, and an outdoor activity.

## Features

- **Image upload:** Upload a plant, flower, bird, animal, or other natural object.
- **AI-powered analysis:** Send the image to the Groq API for a generated report.
- **Nature insights:** See a possible common or scientific name and three short facts.
- **Outdoor activity:** Get one simple activity related to the subject.
- **Responsive interface:** Use the sage-green web interface on desktop or mobile.

## Tech Stack

- **Frontend:** HTML, CSS, and browser JavaScript
- **Backend:** Node.js and Express
- **AI integration:** Groq chat completions API with `qwen/qwen3.8-27b`
- **Uploads:** Multer memory storage
- **Deployment:** Render

## Live Demo

[Open NatureSnap AI](https://naturesnap-ai.onrender.com/)

The free Render instance may take **30–60 seconds** to wake up on the first visit.

## Screenshots

Add real screenshots to `docs/screenshots/home.png` and `docs/screenshots/result.png`. A placeholder folder is included, but this repository does not contain generated screenshots.

### Home

![NatureSnap AI home screen](docs/screenshots/home.png)

### Result

![NatureSnap AI result screen](docs/screenshots/result.png)

## Getting Started

### Prerequisites

- Node.js and npm
- A Groq API key
- Git

### Installation

```bash
git clone https://github.com/05unique-dotcom/NatureSnap-AI.git
cd NatureSnap-AI
npm install
```

Create `.env` in the project root:

```env
GROQ_API_KEY=your_key
```

Never commit `.env` or expose the API key publicly.

Start the application:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## How to Use

1. Select a photograph.
2. Preview the image.
3. Click **Analyze with AI**.
4. Read the generated nature report.

AI-generated identifications are suggestions and may not always be accurate. Verify important botanical information with reliable sources.

## How It Works

1. The browser uploads an image to the Express backend.
2. The backend checks that an image is present and within the upload limit.
3. The backend converts the image to a data URL and sends it to the Groq vision-capable model.
4. The response is returned as a short analysis and formatted in the browser.

## API / Endpoints

### `GET /`

Serves the NatureSnap AI web interface.

### `POST /api/analyze`

Accepts a multipart form upload using the field name `image`. Returns JSON in the form:

```json
{
  "analysis": "AI-generated nature report"
}
```

The endpoint returns an error message if no image is supplied, the upload is too large, the API key is unavailable, or the upstream analysis fails.

## Security

- Store API keys in environment variables.
- Keep `.env` excluded from version control using `.gitignore`.
- Never expose private credentials in frontend JavaScript or public repositories.
- Backend upload validation and size limits help reduce unsafe or excessive uploads.

## Project Goals

NatureSnap AI aims to make learning about nature interactive, accessible, and enjoyable through AI-assisted discovery.

## Future Improvements

Potential enhancements include:

- More structured plant identification reports
- Improved scientific-name formatting
- Image history and saved discoveries
- Additional information about plant care and habitats
- Accessibility and performance improvements
- Support for more categories of natural objects

## Project Structure

```text
.
├── .env.example             # Environment variable template
├── index.html               # Frontend interface and browser logic
├── server.js                # Express server and Groq API integration
├── package.json             # Project metadata, scripts, and dependencies
├── docs/screenshots/        # Location for real project screenshots
├── .github/                 # Issue, pull request, and CI configuration
├── CONTRIBUTING.md          # Contribution and pull request guidance
├── CODE_OF_CONDUCT.md       # Community conduct expectations
├── SECURITY.md              # Private vulnerability reporting guidance
└── LICENSE                  # MIT License
```

## Contributing

Suggestions, bug reports, and contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and pull request guidance.

## License

Licensed under the MIT License. See [LICENSE](LICENSE).

## Repository

[05unique-dotcom/NatureSnap-AI](https://github.com/05unique-dotcom/NatureSnap-AI)

Built with curiosity, AI, and a love for nature.
