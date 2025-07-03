# Smart Mind Map (智能思维导图)
**Minimalist Design · Intelligent Parsing · Efficient Visualization**

## Project Introduction
Struggling with fragmented information? Smart Mind Map provides you with a professional solution!
Powered by cutting-edge AI technology, we can intelligently convert complex text into clearly structured mind maps, helping you quickly clarify your thoughts and improve information processing efficiency.

### 🌟 Core Advantages:
1. **Intelligent Semantic Parsing** - Uses Gemini large model technology to accurately identify logical relationships in text while preserving the original meaning
2. **Minimalist User Experience** - Generate professional mind maps in just one step
3. **Seamless Workflow Integration** - Fully compatible with mainstream document formats, supports multi-format export and easy sharing
Visualize your thinking, structure your knowledge!

## Core Features
- **Flexible Input:** Supports both file upload and direct text input
- **AI Deep Parsing:** Intelligent content analysis based on the Gemini-2.0-Flash large model
- **Real-Time Visualization:** Streaming response for instant mind map generation
- **Interactive Operations:** Supports zoom, drag, node expand/collapse, and more
- **Multi-Format Output:** Export to HTML/Markdown and other common formats
- **API Customization:** Open API key and endpoint configuration

## Interface Preview
![PixPin_2025-04-18_17-33-34](https://github.com/user-attachments/assets/66112159-b5c4-4005-aadb-c5cf1a419e20)

![PixPin_2025-04-18_17-33-50](https://github.com/user-attachments/assets/71cbf5fe-64d9-4f51-a003-7c0372803e0c)

## Quick Start
1. Clone the repository:
```bash
git clone https://github.com/your-username/smart-markmap.git
cd smart-markmap
```
2. Install dependencies:
```bash
npm install
# Or use another package manager
yarn/pnpm/bun install
```
3. Start the development server:
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to experience it.

## User Guide
1. Choose input method (upload file / enter text)
2. Configure Gemini API parameters (you need to apply for an API key yourself)
3. Submit content, and the system will automatically generate a mind map
4. Use the toolbar to adjust the mind map display
5. Supports export as HTML/Markdown for saving

## Technical Architecture
- **Frontend Framework:** Next.js 15.3.1 + React 19
- **UI Design:** TailwindCSS 4 + custom components
- **Visualization Engine:** Markmap series libraries
- **Document Processing:** React-Dropzone, DOCX, etc.
- **Network Communication:** fetch

## Deployment
Recommended one-click deployment with Vercel:
1. Push code to your GitHub repository
2. Import the project on [Vercel platform](https://vercel.com/new)
3. Configure environment variables
4. Complete deployment

## Contributing
You are welcome to contribute in the following ways:
- Submit feature suggestions or bug reports
- Participate in code development
- Improve project documentation
Please submit your contributions via Issue or Pull Request.

## License
[MIT](LICENSE)
---
Delivering value through technology, sharing wisdom through open source ❤️
