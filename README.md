**🌿 NatureSnap AI**

**Discover nature. Understand the world around you.**

NatureSnap AI is an AI-powered nature discovery web application that helps users identify plants and other natural objects from photographs. Upload an image and receive an AI-generated description, interesting facts, and a simple nature-related activity.

The project combines an intuitive botanical-inspired interface with AI-powered image understanding to make exploring nature more engaging and accessible.

**✨ Features**

- **📸 Image Upload:** Upload photographs of plants, flowers, and other natural objects.
- **🤖 AI-Powered Analysis:** Generate image-based descriptions using the Groq API.
- **🌱 Nature Insights:** Explore possible identifications, scientific names, and interesting facts.
- **🌍 Outdoor Activities:** Discover simple activities that encourage outdoor exploration.
- **🎨 Premium Botanical Design:** A clean, responsive interface inspired by sage green and cream colors.
- **⚡ Live Deployment:** Access the application online through its hosted website.

**🛠️ Tech Stack**

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **AI Integration:** Groq API
- **Deployment:** Render
- **Development Environment:** GitHub Codespaces

🚀 Getting Started

Follow these steps to run the project locally.

Prerequisites

Make sure you have the following:

- Node.js and npm installed
- A Groq API key
- Git installed

1. Clone the Repository

git clone https://github.com/05unique-dotcom/NatureSnap-AI.git
cd NatureSnap-AI

2. Install Dependencies

npm install

3. Configure Environment Variables

Create a ".env" file in the project root and add the environment variable expected by your backend:

GROQ_API_KEY=your_groq_api_key

Important: Use the exact variable name referenced in "server.js". If your backend uses a different name, configure ".env" accordingly.

Never commit your ".env" file or expose your API key publicly.

4. Start the Application

npm start

Open the local URL shown by your server, typically:

http://localhost:3000

📖 How to Use

1. Open NatureSnap AI in your browser.
2. Select a photograph from your device.
3. Preview the selected image.
4. Click Analyze with AI.
5. Read the generated nature report and explore the facts.

AI-generated identifications are suggestions and may not always be accurate. Verify important botanical information with reliable sources.

🔐 Security

- Store API keys in environment variables.
- Keep ".env" excluded from version control using ".gitignore".
- Never expose private credentials in frontend JavaScript or public repositories.
- Validate uploaded images and enforce suitable file-size limits on the backend.

🌱 Project Goals

NatureSnap AI aims to make learning about nature interactive, accessible, and enjoyable. It encourages curiosity about plants and the natural world through AI-assisted discovery.

🔮 Future Improvements

Potential enhancements include:

- More structured plant identification reports
- Improved scientific-name formatting
- Image history and saved discoveries
- Additional information about plant care and habitats
- Accessibility and performance improvements
- Support for more categories of natural objects

🤝 Contributing

Suggestions, bug reports, and contributions are welcome. Feel free to open an issue or submit a pull request to help improve the project.

📄 License

Please refer to the repository's "LICENSE" (LICENSE) file for the applicable license terms.

---

Built with curiosity, AI, and a love for nature. 🌿
