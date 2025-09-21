# Lucid – Your Legal Copilot 📄⚖️

**Simplify complex contracts into plain language, highlight risks, and ask questions like you would in a chat.**

---

## 🔍 Problem

Legal documents are filled with jargon and hidden clauses.  
Young professionals, students, and small businesses often sign contracts without truly understanding the risks.  
This leads to financial loss, unfair commitments, and lack of transparency.

---

## 💡 Solution

Lucid is an AI-powered legal copilot that makes documents clear and interactive:

- Upload a contract or legal PDF.
- Get a **plain-language summary** of what it means.
- See **line-by-line highlights** with risk labels:  
  🟥 High Risk | 🟨 Medium Risk | 🟩 Low Risk
- Ask questions in a **chat interface** and get grounded answers from the document.

---

## ⚡ Key Features

- **Document Summary** – Easy to read overview in simple English.
- **Risk Highlights** – Red, yellow, green highlights directly on the text.
- **Clause Explanations** – Hover or click to see why a line matters.
- **AI Chat Copilot** – Ask: _"What happens if I don't pay?"_ → Lucid answers from the document with dynamic AI responses.
- **Web Search Integration** – Get current information to supplement document analysis.
- **Visual PDF Canvas** – Interactive PDF viewer with highlighted risk areas.
- **Page-by-Page Analysis** – Detailed breakdown of each document page.
- **My Notes Feature** – Save important findings for future reference.
- **Privacy First** – Redacts sensitive data before analysis.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **PDF Processing**: PDF.js with interactive canvas rendering
- **AI**: Google Cloud Vertex AI (Gemini 1.5 Pro) with dynamic responses
- **OCR**: Google Cloud Document AI
- **Privacy**: Google Cloud DLP
- **Styling**: Tailwind CSS with custom components
- **Web Search**: Google Custom Search API integration

---

## ▶️ Demo

- **Video**: [3-minute YouTube demo](https://youtube.com/)
- **Live**: [Deployed on Vercel](https://lucid.vercel.app/)

---

## 🚀 Getting Started

```bash
git clone https://github.com/urja14kohli/lucid.git
cd lucid
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Required for AI functionality
GCP_PROJECT_ID=your_project_id
GCP_LOCATION=us-central1
VERTEX_MODEL=gemini-1.5-pro

# Optional for web search
GOOGLE_API_KEY=your_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🆕 Recent Enhancements

### AI Assistant Improvements
- **Dynamic AI Responses**: Real-time AI integration with Google Cloud Vertex AI
- **Web Search Integration**: Automatic web search for current information
- **Conversation Memory**: Maintains context across multiple questions
- **Typing Indicators**: Visual feedback during AI processing

### User Experience
- **Interactive PDF Canvas**: Visual PDF viewer with clickable risk highlights
- **Page-by-Page Analysis**: Detailed breakdown of each document page
- **My Notes Feature**: Save and manage important findings
- **Enhanced UI**: Improved responsive design and accessibility

### Technical Improvements
- **Build Optimization**: Fixed all ESLint warnings and build errors
- **Performance**: Optimized PDF rendering and AI response times
- **Code Quality**: TypeScript improvements and better error handling

---

## 👥 Team

Built by **Urja Kohli** at the Gen AI Exchange Hackathon  
Powered by Google Cloud AI tools

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/urja14kohli/lucid/issues).

---

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

<div align="center">
  <strong>Made with ❤️ for accessible legal understanding</strong>
</div>
