# 🎓 AI Learning Companion

An intelligent learning application that transforms your PDF textbooks into interactive quizzes, provides AI tutoring, and recommends relevant educational YouTube videos.

## 🌟 Features

### Must-Have Features ✅

#### 1. **Source Selector**
- Upload and manage multiple PDF coursebooks
- Switch between different PDFs seamlessly
- Pre-seeded with sample educational content for testing

#### 2. **PDF Viewer**
- Full PDF viewing with embedded viewer
- Navigate through pages easily
- Text extraction for AI processing
- Clean, readable interface

#### 3. **Quiz Generator Engine**
- **MCQs (Multiple Choice Questions)** - 5 questions with 4 options each
- **SAQs (Short Answer Questions)** - 3 questions with model answers
- **LAQs (Long Answer Questions)** - 2 detailed questions
- **Features:**
  - AI-powered question generation from PDF content
  - Automatic scoring for MCQs
  - Detailed explanations for each question
  - Option to generate new quiz sets
  - Sample quiz available for testing without API key

#### 4. **Progress Tracking**
- Track total quizzes taken
- Calculate average scores
- Identify strengths (topics with 70%+ scores)
- Identify weaknesses (topics with <70% scores)
- Visual dashboard with statistics

### Nice-to-Have Features ⭐

#### 1. **Chat UI (ChatGPT-inspired)**
- Clean, modern chat interface
- Multiple chat sessions
- Left sidebar with chat history
- Create new chats on the fly
- Mobile responsive design
- Message history preserved per chat

#### 2. **AI Tutor Integration**
- Context-aware responses based on selected PDF
- Powered by OpenAI's GPT-3.5-turbo
- Natural conversation flow
- Acts as virtual teaching companion
- Explains concepts from your study material

#### 3. **YouTube Videos Recommender**
- AI analyzes PDF content to extract key topics
- Generates personalized video recommendations
- Direct YouTube search links for each topic
- Visual video cards with descriptions
- Organized by relevance and subject matter

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API Key (for AI features)
- PDF files of your coursebooks

### Installation

1. **Get an OpenAI API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create an account or sign in
   - Generate a new API key
   - Copy the key (you'll need it in the app)

2. **Open the Application**
   - TColne the github repo https://github.com/ajay-7415/Ai-platform-Learner.git
   - Install all the package by running the command (npm install)
   - No backend server needed

### Setup

1. **Enter API Key**
   - When you first open the app, you'll see a yellow banner at the top
   - Paste your OpenAI API key
   - Click "Save"
   - Your key is stored locally in memory (not saved permanently)

2. **Upload a PDF**
   - Click the "Upload PDF" button in the left sidebar
   - Select your PDF coursebook
   - Wait for "PDF loaded successfully!" message
   - The PDF will appear in your PDF list

## 📖 How to Use

### Using the Quiz Feature

1. **Select a PDF** from the sidebar
2. Navigate to the **Quiz** tab
3. Choose one of two options:
   - **"Generate Quiz with AI"** - Creates custom quiz from your PDF (requires API key)
   - **"Try Sample Quiz"** - Loads a pre-made physics quiz instantly
4. Answer the questions:
   - MCQs: Click radio buttons to select answers
   - SAQs/LAQs: Type your answers in text boxes
5. Click **"Submit Quiz"** to see results
6. Review explanations and model answers
7. Generate a new quiz anytime

### Using the AI Tutor

1. Navigate to the **AI Tutor** tab
2. Select a PDF (optional, but recommended for context)
3. Type your question in the input box
4. Press Enter or click Send
5. The AI will respond based on your PDF content
6. Create new chat sessions using the "+" button
7. Switch between chats using the sidebar

### Viewing PDFs

1. Navigate to the **PDF Viewer** tab
2. Select a PDF from the sidebar
3. View the PDF in the embedded viewer
4. Scroll to navigate through the document
5. See extracted text preview below the viewer

### Getting Video Recommendations

1. Navigate to the **Videos** tab
2. Select a PDF
3. Click **"Get Video Recommendations"**
4. Wait for AI to analyze your PDF content
5. Browse recommended videos
6. Click **"Search on YouTube"** to find videos on each topic

### Tracking Progress

1. Navigate to the **Progress** tab
2. View your statistics:
   - Total quizzes taken
   - Average score percentage
   - Strengths (topics you excel at)
   - Weaknesses (areas to improve)

## 🔧 Technical Details

### Technologies Used
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **OpenAI GPT-3.5-turbo** - AI features
- **Browser APIs** - File handling, PDF rendering

### API Usage

The app makes API calls to OpenAI for:
- Quiz generation (~2000-2500 tokens per request)
- Chat responses (~500-1000 tokens per request)
- Video recommendations (~500 tokens per request)

**Cost Estimate:** With GPT-3.5-turbo pricing at $0.50 per 1M input tokens and $1.50 per 1M output tokens, typical usage costs are minimal (pennies per session).

### Data Storage

- **All data is stored in-memory** (React state)
- No localStorage or sessionStorage used
- Data persists during your browser session
- Refresh the page to reset all data
- Your API key is never stored permanently

## 🎯 Use Cases

### For Students
- Convert textbooks into practice quizzes
- Get instant tutoring on difficult topics
- Find supplementary video content
- Track learning progress over time

### For Teachers
- Create quick assessment materials
- Provide AI tutoring support to students
- Curate video resources for lessons

### For Self-Learners
- Test knowledge on any PDF material
- Get explanations in conversational format
- Discover relevant educational videos

## 🐛 Troubleshooting

### PDF Upload Issues
- **Problem:** PDF won't upload
- **Solution:** Ensure file is a valid PDF, try a different PDF

### Quiz Generation Fails
- **Problem:** "Invalid API key" error
- **Solution:** Double-check your OpenAI API key, ensure it's active
- **Alternative:** Use "Try Sample Quiz" to test the interface

### Chat Not Responding
- **Problem:** No response from AI tutor
- **Solution:** 
  - Verify API key is entered
  - Check browser console (F12) for errors
  - Ensure you have API credits available

### Videos Not Loading
- **Problem:** No video recommendations appear
- **Solution:**
  - Ensure API key is valid
  - Check that PDF has sufficient text content
  - Try with a different PDF

### Rate Limit Errors
- **Problem:** "Rate limit exceeded" message
- **Solution:** Wait 60 seconds before trying again

## 💡 Tips & Best Practices

1. **PDF Quality:** Use PDFs with clear, extractable text for best results
2. **Quiz Variety:** Generate multiple quizzes from the same PDF for different questions
3. **Chat Context:** Select relevant PDFs before chatting for better AI responses
4. **Progress Tracking:** Take quizzes regularly to see meaningful progress trends
5. **API Key Security:** Never share your API key publicly

## 🔒 Privacy & Security

- Your API key is stored only in browser memory
- PDF content is processed locally in your browser
- No data is sent to external servers except OpenAI API calls
- No user data is collected or stored permanently
- All processing happens client-side

## 🚧 Known Limitations

1. PDF text extraction may not work perfectly with scanned images
2. Complex mathematical equations might not parse correctly
3. API rate limits apply (100 requests per hour for free tier)
4. Video recommendations use YouTube search (not direct video links)
5. Progress data is lost on page refresh

## 🔄 Future Enhancements

- [ ] RAG (Retrieval Augmented Generation) with citations
- [ ] Page number references in quiz questions
- [ ] Export quiz results to PDF
- [ ] Persistent data storage
- [ ] Support for more file formats (DOCX, PPTX)
- [ ] Voice input/output for chat
- [ ] Collaborative study sessions
- [ ] Spaced repetition learning

## 📝 License

This project is provided as-is for educational purposes.

## 🤝 Support

For issues, questions, or suggestions:
- Check the Troubleshooting section above
- Review browser console for error messages
- Ensure you're using a modern browser
- Verify your OpenAI API key is valid

## 🎓 Educational Use

This app is designed to enhance learning, not replace it. Use it as a supplement to:
- Traditional studying methods
- Classroom instruction
- Hands-on practice
- Critical thinking exercises

---

**Built with ❤️ for learners everywhere**

*Transform your PDFs into interactive learning experiences!*