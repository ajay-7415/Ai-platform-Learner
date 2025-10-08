import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, MessageSquare, BarChart3, Play, Menu, X, Plus, Send, BookOpen, Brain, Trophy, ChevronRight, Loader } from 'lucide-react';

const LearningApp = () => {
  const [activeTab, setActiveTab] = useState('quiz');
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [chats, setChats] = useState([{ id: 1, title: 'New Chat', messages: [] }]);
  const [activeChat, setActiveChat] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [progress, setProgress] = useState({ totalQuizzes: 0, avgScore: 0, strengths: [], weaknesses: [] });
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);

  // Handle file upload with better error handling
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setUploadStatus('Error: Please upload a PDF file');
      return;
    }
    
    setLoading(true);
    setUploadStatus('Loading PDF...');
    
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text from PDF using a simpler method
      const uint8Array = new Uint8Array(arrayBuffer);
      let text = '';
      
      // Simple text extraction (works for basic PDFs)
      for (let i = 0; i < uint8Array.length; i++) {
        if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
          text += String.fromCharCode(uint8Array[i]);
        }
      }
      
      // Store PDF data
      const newPdf = {
        id: Date.now(),
        name: file.name,
        file: file,
        arrayBuffer: arrayBuffer,
        text: text,
        numPages: 1 // We'll display using iframe
      };
      
      setPdfs(prev => [...prev, newPdf]);
      setSelectedPdf(newPdf);
      setCurrentPage(1);
      setUploadStatus('PDF loaded successfully!');
      
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setUploadStatus('Error loading PDF. Please try again.');
    }
    
    setLoading(false);
  };

  // Generate quiz using ChatGPT
  const generateQuiz = async () => {
    if (!selectedPdf) {
      alert('Please select a PDF first');
      return;
    }
    
    if (!apiKey) {
      alert('Please enter your OpenAI API key at the top of the page');
      return;
    }

    setLoading(true);
    setUploadStatus('Generating quiz from PDF content...');
    
    try {
      // Extract meaningful text from PDF
      let pdfText = selectedPdf.text.substring(0, 3000);
      
      // If extracted text is too short or seems corrupted, use sample content
      if (pdfText.length < 100 || pdfText.replace(/[^a-zA-Z]/g, '').length < 50) {
        pdfText = `This is educational content about ${selectedPdf.name}. Create a general quiz about the topic based on the filename.`;
      }
      
      console.log('API Key present:', !!apiKey);
      console.log('Sending request to OpenAI...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are a quiz generator. Always respond with valid JSON only, no additional text.'
          }, {
            role: 'user',
            content: `Generate a quiz with 5 MCQs, 3 SAQs, and 2 LAQs based on this content. Return ONLY valid JSON in this exact format:
{
  "mcqs": [
    {"question": "Question 1?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Explanation here"}
  ],
  "saqs": [
    {"question": "Question?", "answer": "Answer here", "explanation": "Explanation"}
  ],
  "laqs": [
    {"question": "Question?", "answer": "Detailed answer", "explanation": "Explanation"}
  ]
}

Content: ${pdfText}`
          }],
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response received');
      
      let content = data.choices[0].message.content.trim();
      console.log('Raw content:', content.substring(0, 100));
      
      // Clean up the response to get pure JSON
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find JSON object in the response
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        content = content.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('Cleaned content:', content.substring(0, 100));
      
      const quizData = JSON.parse(content);
      
      // Validate quiz structure
      if (!quizData.mcqs || !quizData.saqs || !quizData.laqs) {
        throw new Error('Invalid quiz format received');
      }
      
      console.log('Quiz parsed successfully:', {
        mcqs: quizData.mcqs.length,
        saqs: quizData.saqs.length,
        laqs: quizData.laqs.length
      });
      
      setQuiz(quizData);
      setUserAnswers({});
      setQuizSubmitted(false);
      setUploadStatus('Quiz generated successfully!');
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setUploadStatus(`Error: ${error.message}. Check console for details.`);
      
      // Show more helpful error message
      if (error.message.includes('401')) {
        alert('Invalid API key. Please check your OpenAI API key.');
      } else if (error.message.includes('429')) {
        alert('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('JSON')) {
        alert('Failed to parse quiz. The AI response was not in the correct format. Please try again.');
      } else {
        alert(`Error generating quiz: ${error.message}`);
      }
    }
    setLoading(false);
  };

  // Submit quiz
  const submitQuiz = () => {
    if (!quiz) return;
    
    let correct = 0;
    let total = quiz.mcqs.length;
    
    quiz.mcqs.forEach((q, idx) => {
      if (userAnswers[`mcq-${idx}`] === q.correct) correct++;
    });
    
    const score = Math.round((correct / total) * 100);
    
    setProgress(prev => ({
      totalQuizzes: prev.totalQuizzes + 1,
      avgScore: Math.round((prev.avgScore * prev.totalQuizzes + score) / (prev.totalQuizzes + 1)),
      strengths: score >= 70 ? [...prev.strengths, selectedPdf.name] : prev.strengths,
      weaknesses: score < 70 ? [...prev.weaknesses, selectedPdf.name] : prev.weaknesses
    }));
    
    setQuizSubmitted(true);
  };

  // Send chat message
  const sendMessage = async () => {
    if (!chatInput.trim() || !apiKey) return;

    const newMessage = { role: 'user', content: chatInput };
    const updatedChats = chats.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [...chat.messages, newMessage] }
        : chat
    );
    setChats(updatedChats);
    setChatInput('');
    setLoading(true);

    try {
      const context = selectedPdf ? `You are a helpful teacher. Use this content as reference: ${selectedPdf.text.substring(0, 2000)}` : 'You are a helpful teacher.';
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: context },
            ...updatedChats.find(c => c.id === activeChat).messages,
            newMessage
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.choices[0].message.content };
      
      setChats(prevChats => prevChats.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, aiMessage] }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key.' };
      setChats(prevChats => prevChats.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
    }
    setLoading(false);
  };

  // Create new chat
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: `Chat ${chats.length + 1}`,
      messages: []
    };
    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
  };

  // Recommend YouTube videos based on PDF content
  const recommendYouTubeVideos = async () => {
    if (!selectedPdf) {
      alert('Please select a PDF first');
      return;
    }

    if (!apiKey) {
      alert('Please enter your OpenAI API key to get video recommendations');
      return;
    }

    setLoadingVideos(true);
    setUploadStatus('Finding relevant educational videos...');

    try {
      // Extract topics from PDF using AI
      let pdfText = selectedPdf.text.substring(0, 2000);
      
      // If PDF text is too short or invalid, use filename
      if (pdfText.length < 50) {
        pdfText = `Educational content about ${selectedPdf.name}`;
      }

      console.log('Analyzing PDF for video recommendations...');
      console.log('PDF text length:', pdfText.length);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: 'You are an educational content analyzer. Always respond with valid JSON only.'
          }, {
            role: 'user',
            content: `Analyze this educational content and extract the main subject and 4 specific topics. Return ONLY valid JSON in this exact format:
{"subject": "subject name", "topics": ["topic1", "topic2", "topic3", "topic4"]}

Content: ${pdfText}

Filename: ${selectedPdf.name}`
          }],
          temperature: 0.5,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices[0].message.content.trim();
      
      console.log('API response:', content);
      
      // Clean JSON - handle multiple formats
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find JSON object
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        content = content.substring(jsonStart, jsonEnd + 1);
      }
      
      const topicsData = JSON.parse(content);
      
      console.log('Parsed topics:', topicsData);

      // Validate data
      if (!topicsData.subject || !topicsData.topics || !Array.isArray(topicsData.topics)) {
        throw new Error('Invalid response format');
      }

      // Generate video recommendations
      const videos = [];
      
      // Add a general subject video first
      const subjectQuery = encodeURIComponent(`${topicsData.subject} complete tutorial`);
      videos.push({
        id: 'video-main',
        title: `${topicsData.subject} - Complete Course`,
        description: `Comprehensive ${topicsData.subject} course covering all fundamental concepts.`,
        thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
        searchUrl: `https://www.youtube.com/results?search_query=${subjectQuery}`,
        topic: topicsData.subject,
        channel: 'Educational Content'
      });
      
      // Add topic-specific videos
      topicsData.topics.forEach((topic, idx) => {
        const searchQuery = `${topicsData.subject} ${topic} explained`;
        const encodedQuery = encodeURIComponent(searchQuery);
        
        videos.push({
          id: `video-${idx}`,
          title: `${topic}`,
          description: `Learn about ${topic} in ${topicsData.subject}. Clear explanations with examples and practice problems.`,
          thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
          searchUrl: `https://www.youtube.com/results?search_query=${encodedQuery}`,
          topic: topic,
          channel: 'Educational Videos'
        });
      });

      console.log('Generated videos:', videos.length);
      
      setYoutubeVideos(videos);
      setUploadStatus(`Found ${videos.length} video recommendations!`);
      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Error getting video recommendations:', error);
      setUploadStatus(`Error: ${error.message}`);
      
      // Provide fallback recommendations based on filename
      const filename = selectedPdf.name.toLowerCase();
      let subject = 'General Education';
      
      if (filename.includes('physic')) subject = 'Physics';
      else if (filename.includes('math') || filename.includes('calculus') || filename.includes('algebra')) subject = 'Mathematics';
      else if (filename.includes('chem')) subject = 'Chemistry';
      else if (filename.includes('bio')) subject = 'Biology';
      else if (filename.includes('history')) subject = 'History';
      
      const fallbackVideos = [
        {
          id: 'fallback-1',
          title: `${subject} - Introduction`,
          description: `Introduction to ${subject} concepts and fundamentals.`,
          thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
          searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' tutorial')}`,
          topic: subject,
          channel: 'Educational Channels'
        },
        {
          id: 'fallback-2',
          title: `${subject} - Key Concepts`,
          description: `Important concepts and theories in ${subject}.`,
          thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
          searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' key concepts')}`,
          topic: 'Core Concepts',
          channel: 'Educational Channels'
        },
        {
          id: 'fallback-3',
          title: `${subject} - Problem Solving`,
          description: `Practice problems and solutions in ${subject}.`,
          thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
          searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' problems solved')}`,
          topic: 'Practice',
          channel: 'Educational Channels'
        }
      ];
      
      setYoutubeVideos(fallbackVideos);
      setUploadStatus('Showing general recommendations (API error occurred)');
    }

    setLoadingVideos(false);
  };

  const currentChat = chats.find(c => c.id === activeChat);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-300`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            LearnAI
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'quiz' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Quiz</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'chat' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>AI Tutor</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'pdf' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" />
            <span>PDF Viewer</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'progress' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Progress</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'videos' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
          >
            <Play className="w-5 h-5" />
            <span>Videos</span>
          </button>
        </nav>

        {/* PDF List */}
        <div className="p-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Your PDFs</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {pdfs.map(pdf => (
              <button
                key={pdf.id}
                onClick={() => {
                  setSelectedPdf(pdf);
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded truncate ${selectedPdf?.id === pdf.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                title={pdf.name}
              >
                {pdf.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Loading...' : 'Upload PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploadStatus && (
            <p className="text-xs mt-2 text-center text-gray-600">{uploadStatus}</p>
          )}
        </div>

        {/* Chat History */}
        {activeTab === 'chat' && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Chats</h3>
              <button onClick={createNewChat} className="p-1 hover:bg-gray-100 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded ${activeChat === chat.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            {selectedPdf && (
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="max-w-xs truncate">{selectedPdf.name}</span>
              </span>
            )}
          </div>
        </header>

        {/* API Key Input */}
        {showApiInput && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key (required for quiz & chat)"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowApiInput(false)}
                disabled={!apiKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OpenAI Platform</a>
            </p>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'quiz' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Quiz Generator</h2>
                <p className="text-gray-600 mb-4">
                  {selectedPdf ? `Generate a quiz from: ${selectedPdf.name}` : 'Upload a PDF to start generating quizzes'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={generateQuiz}
                    disabled={!selectedPdf || loading || !apiKey}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Quiz with AI'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      // Generate a sample quiz for testing
                      setQuiz({
                        mcqs: [
                          {
                            question: "What is the SI unit of force?",
                            options: ["Newton", "Joule", "Watt", "Pascal"],
                            correct: 0,
                            explanation: "The Newton (N) is the SI unit of force, named after Sir Isaac Newton."
                          },
                          {
                            question: "Which law states that for every action, there is an equal and opposite reaction?",
                            options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"],
                            correct: 2,
                            explanation: "Newton's Third Law states that for every action, there is an equal and opposite reaction."
                          },
                          {
                            question: "What is the formula for kinetic energy?",
                            options: ["mgh", "1/2 mv²", "Fd", "Pt"],
                            correct: 1,
                            explanation: "Kinetic energy is given by KE = 1/2 mv², where m is mass and v is velocity."
                          },
                          {
                            question: "What is the acceleration due to gravity on Earth?",
                            options: ["9.8 m/s", "9.8 m/s²", "10 m/s", "10 m/s²"],
                            correct: 1,
                            explanation: "The acceleration due to gravity on Earth is approximately 9.8 m/s²."
                          },
                          {
                            question: "Which quantity is a vector?",
                            options: ["Speed", "Distance", "Velocity", "Energy"],
                            correct: 2,
                            explanation: "Velocity is a vector quantity as it has both magnitude and direction."
                          }
                        ],
                        saqs: [
                          {
                            question: "Define momentum and state its unit.",
                            answer: "Momentum is the product of mass and velocity of an object. Its SI unit is kg·m/s.",
                            explanation: "Momentum (p) = mass (m) × velocity (v). It is a vector quantity."
                          },
                          {
                            question: "What is the difference between speed and velocity?",
                            answer: "Speed is a scalar quantity that refers to how fast an object is moving, while velocity is a vector quantity that refers to the rate of change of position with direction.",
                            explanation: "Speed only has magnitude, while velocity has both magnitude and direction."
                          },
                          {
                            question: "State the law of conservation of energy.",
                            answer: "Energy can neither be created nor destroyed; it can only be converted from one form to another. The total energy of an isolated system remains constant.",
                            explanation: "This is one of the fundamental laws of physics."
                          }
                        ],
                        laqs: [
                          {
                            question: "Derive the equations of motion for uniformly accelerated motion.",
                            answer: "The three equations of motion are: 1) v = u + at, 2) s = ut + 1/2at², 3) v² = u² + 2as. These can be derived using calculus or graphical methods, where u is initial velocity, v is final velocity, a is acceleration, t is time, and s is displacement.",
                            explanation: "These equations are fundamental in kinematics and describe the motion of objects under constant acceleration."
                          },
                          {
                            question: "Explain Newton's Second Law of Motion with examples.",
                            answer: "Newton's Second Law states that the rate of change of momentum is directly proportional to the applied force and takes place in the direction of force. Mathematically, F = ma. Examples include: pushing a car (more force needed for heavier car), kicking a ball (harder kick gives more acceleration), etc.",
                            explanation: "This law establishes the relationship between force, mass, and acceleration, which is fundamental to classical mechanics."
                          }
                        ]
                      });
                      setUserAnswers({});
                      setQuizSubmitted(false);
                      setUploadStatus('Sample quiz loaded for testing!');
                      setTimeout(() => setUploadStatus(''), 3000);
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Try Sample Quiz
                  </button>
                </div>
                {!apiKey && (
                  <p className="text-sm text-orange-600 mt-3">
                    ⚠️ Please enter your OpenAI API key at the top to generate custom quizzes from your PDF
                  </p>
                )}
              </div>

              {quiz && (
                <div className="space-y-6">
                  {/* MCQs */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-4">Multiple Choice Questions</h3>
                    {quiz.mcqs.map((q, idx) => (
                      <div key={idx} className="mb-6 pb-6 border-b last:border-0">
                        <p className="font-semibold mb-3">{idx + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => (
                            <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                              quizSubmitted 
                                ? optIdx === q.correct 
                                  ? 'bg-green-50 border-green-500' 
                                  : userAnswers[`mcq-${idx}`] === optIdx 
                                    ? 'bg-red-50 border-red-500' 
                                    : 'bg-gray-50'
                                : userAnswers[`mcq-${idx}`] === optIdx 
                                  ? 'bg-blue-50 border-blue-500' 
                                  : 'hover:bg-gray-50'
                            }`}>
                              <input
                                type="radio"
                                name={`mcq-${idx}`}
                                checked={userAnswers[`mcq-${idx}`] === optIdx}
                                onChange={() => setUserAnswers(prev => ({ ...prev, [`mcq-${idx}`]: optIdx }))}
                                disabled={quizSubmitted}
                                className="w-4 h-4"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                        {quizSubmitted && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700"><strong>Explanation:</strong> {q.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* SAQs */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-4">Short Answer Questions</h3>
                    {quiz.saqs.map((q, idx) => (
                      <div key={idx} className="mb-6 pb-6 border-b last:border-0">
                        <p className="font-semibold mb-3">{idx + 1}. {q.question}</p>
                        <textarea
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          placeholder="Your answer..."
                          disabled={quizSubmitted}
                        />
                        {quizSubmitted && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm"><strong>Model Answer:</strong> {q.answer}</p>
                            <p className="text-sm mt-2"><strong>Explanation:</strong> {q.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* LAQs */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-4">Long Answer Questions</h3>
                    {quiz.laqs.map((q, idx) => (
                      <div key={idx} className="mb-6 pb-6 border-b last:border-0">
                        <p className="font-semibold mb-3">{idx + 1}. {q.question}</p>
                        <textarea
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="5"
                          placeholder="Your answer..."
                          disabled={quizSubmitted}
                        />
                        {quizSubmitted && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm"><strong>Model Answer:</strong> {q.answer}</p>
                            <p className="text-sm mt-2"><strong>Explanation:</strong> {q.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!quizSubmitted && (
                    <button
                      onClick={submitQuiz}
                      className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {currentChat?.messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with your AI tutor</p>
                    {selectedPdf && <p className="text-sm mt-2">Currently studying: {selectedPdf.name}</p>}
                  </div>
                )}
                {currentChat?.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white shadow-sm'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white shadow-sm p-4 rounded-lg">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder="Ask your AI tutor..."
                  className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !chatInput.trim() || !apiKey}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">PDF Viewer</h2>
                {selectedPdf ? (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                      <iframe
                        src={URL.createObjectURL(selectedPdf.file)}
                        className="w-full h-full"
                        title="PDF Viewer"
                      />
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                      <p><strong>File:</strong> {selectedPdf.name}</p>
                      <p className="mt-2"><strong>Text Preview:</strong></p>
                      <p className="mt-1 text-xs max-h-20 overflow-y-auto">
                        {selectedPdf.text.substring(0, 500)}...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Upload a PDF to view</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Play className="w-6 h-6 text-red-500" />
                  YouTube Video Recommendations
                </h2>
                <p className="text-gray-600 mb-4">
                  {selectedPdf 
                    ? `Get educational video recommendations based on: ${selectedPdf.name}` 
                    : 'Upload a PDF to get relevant video recommendations'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={recommendYouTubeVideos}
                    disabled={!selectedPdf || loadingVideos || !apiKey}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingVideos ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Finding Videos...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Get AI Recommendations
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      // Show sample video recommendations
                      const sampleVideos = [
                        {
                          id: 'sample-1',
                          title: 'Physics - Complete Introduction',
                          description: 'Comprehensive physics course covering mechanics, motion, forces, energy, and more. Perfect for Class 11 students.',
                          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                          searchUrl: 'https://www.youtube.com/results?search_query=physics+class+11+complete+course',
                          topic: 'Physics',
                          channel: 'Khan Academy'
                        },
                        {
                          id: 'sample-2',
                          title: 'Newton\'s Laws of Motion Explained',
                          description: 'Deep dive into Newton\'s three laws of motion with real-world examples and problem-solving techniques.',
                          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                          searchUrl: 'https://www.youtube.com/results?search_query=newtons+laws+of+motion+explained',
                          topic: 'Mechanics',
                          channel: 'CrashCourse Physics'
                        },
                        {
                          id: 'sample-3',
                          title: 'Kinematics - Motion in a Straight Line',
                          description: 'Learn about displacement, velocity, acceleration, and equations of motion with solved examples.',
                          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                          searchUrl: 'https://www.youtube.com/results?search_query=kinematics+motion+straight+line',
                          topic: 'Kinematics',
                          channel: 'Physics Wallah'
                        },
                        {
                          id: 'sample-4',
                          title: 'Work, Energy and Power',
                          description: 'Understanding the relationship between work, energy, and power with practical applications.',
                          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                          searchUrl: 'https://www.youtube.com/results?search_query=work+energy+power+physics',
                          topic: 'Energy',
                          channel: 'Vedantu'
                        },
                        {
                          id: 'sample-5',
                          title: 'Gravitation and Gravitational Force',
                          description: 'Explore universal gravitation, gravitational potential energy, and satellite motion.',
                          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                          searchUrl: 'https://www.youtube.com/results?search_query=gravitation+physics+tutorial',
                          topic: 'Gravitation',
                          channel: 'Unacademy'
                        }
                      ];
                      setYoutubeVideos(sampleVideos);
                      setUploadStatus('Sample video recommendations loaded!');
                      setTimeout(() => setUploadStatus(''), 3000);
                    }}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Try Sample Videos
                  </button>
                </div>
                {!apiKey && (
                  <p className="text-sm text-orange-600 mt-3">
                    ⚠️ Enter your OpenAI API key for personalized recommendations, or try sample videos
                  </p>
                )}
              </div>

              {youtubeVideos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Recommended Videos ({youtubeVideos.length})
                  </h3>
                  {youtubeVideos.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-40 h-24 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full bg-gradient-to-br from-red-500 to-red-600"><svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></div>';
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-90">
                                <Play className="w-6 h-6 text-white ml-1" fill="white" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{video.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {video.topic}
                            </span>
                            <span>{video.channel}</span>
                          </div>
                          <a
                            href={video.searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                          >
                            <Play className="w-4 h-4" />
                            Search on YouTube
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> These recommendations are based on the content of your PDF. Click "Search on YouTube" to find the best educational videos on each topic.
                    </p>
                  </div>
                </div>
              )}

              {youtubeVideos.length === 0 && !loadingVideos && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Click the button above to get video recommendations</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Your Progress
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Quizzes</p>
                    <p className="text-3xl font-bold text-blue-600">{progress.totalQuizzes}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-green-600">{progress.avgScore}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold mb-4 text-green-600">Strengths</h3>
                {progress.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {[...new Set(progress.strengths)].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-700">
                        <ChevronRight className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Take more quizzes to identify your strengths</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold mb-4 text-orange-600">Areas to Improve</h3>
                {progress.weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {[...new Set(progress.weaknesses)].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-700">
                        <ChevronRight className="w-4 h-4 text-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Great job! Keep up the good work</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LearningApp;