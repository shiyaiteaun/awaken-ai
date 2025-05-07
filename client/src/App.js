import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';import {
  ArrowUpCircle, // This might be replaced by ArrowUp if ArrowUpCircle is not used elsewhere
  ArrowUp, // Added for the new send button icon
  ClockHistory,
  PersonCircle,
  Upload,
  BoxArrowRight,
  X,
  ChevronDown,
  Paperclip,
  Search as SearchIcon
} from 'react-bootstrap-icons';
import FileUpload from './components/FileUpload';
import Login from './components/Login';
import Registration from './components/Registration';
import logo from './logo.png';

// --- Authentication Context ---
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedAuthStatus = localStorage.getItem('isAuthenticated');
    return storedAuthStatus === 'true';
  });

  const navigate = useNavigate();

  const login = useCallback(() => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    navigate('/');
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  const value = { isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// --- Protected Route Component ---
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- Main Application Layout (Protected) ---
function MainApplication() {
  const { logout } = useAuth();

  const [aiQuestion, setAiQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [showUserMenuSidebar, setShowUserMenuSidebar] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState('gemini'); // Default model
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const resultsContainerRef = useRef(null);
  const modelDropdownRef = useRef(null);

  useEffect(() => {
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = resultsContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modelDropdownRef]);


  const toggleHistorySidebar = () => {
    setShowHistorySidebar(!showHistorySidebar);
    if (showUserMenuSidebar) setShowUserMenuSidebar(false);
  };

  const toggleUserMenuSidebar = () => {
    setShowUserMenuSidebar(!showUserMenuSidebar);
    if (showHistorySidebar) setShowHistorySidebar(false);
  };

  const toggleUploadModal = () => {
    setShowUploadModal(!showUploadModal);
    if (showHistorySidebar) setShowHistorySidebar(false);
    if (showUserMenuSidebar) setShowUserMenuSidebar(false);
  };

  const handleUploadSuccess = (message) => {
    setUploadStatus(message || 'File uploaded successfully!');
    setShowUploadModal(false);
    setTimeout(() => setUploadStatus(''), 5000);
  };

  const handleUploadError = (message) => {
    setUploadStatus(`Upload failed: ${message || 'Unknown error'}`);
    setTimeout(() => setUploadStatus(''), 5000);
  };

  const handleModelSelect = (model) => {
    setSelectedAiModel(model);
    setShowModelDropdown(false);
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userMessage = { type: 'user', text: aiQuestion };
    setChatHistory(prev => [...prev, userMessage]);
    const currentQuestion = aiQuestion; // Store current question before clearing
    setAiQuestion(''); // Clear input after sending
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          model: selectedAiModel,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON (e.g., HTML error page)
          const errorText = await response.text();
          console.error("Non-JSON error response:", errorText);
          errorData = { message: `Server error: ${response.status}. Please check server logs.` };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = { type: 'ai', text: data.answer };
      setChatHistory(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error("AI Error:", err);
      const displayErrorMessage = err.message || 'Failed to get response from AI.';
      setError(displayErrorMessage); // Set error state to display in UI
      // Optionally, add error to chat history as well, if not already handled by the error display logic
      // const errorMessageEntry = { type: 'ai', text: `Error: ${displayErrorMessage}`, isError: true };
      // setChatHistory(prev => [...prev, errorMessageEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <img src={logo} alt="Awaken AI Logo" className="header-logo" />
          <span className="header-brand-name">Awaken AI</span>
          <h1 className="header-title">AI Assistance</h1>
          <div className="header-icons">
            {/* <button onClick={toggleHistorySidebar} className="icon-button" title="History">
              <ClockHistory size={20} />
            </button> */} {/* Removed History Icon Button */}
            <button onClick={toggleUserMenuSidebar} className="icon-button" title="User Menu">
              <PersonCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className={`results-view-container ${chatHistory.length === 0 && !isLoading && !error ? 'empty' : ''}`} ref={resultsContainerRef}>
          {chatHistory.length === 0 && !isLoading && !error && (
            <div className="ai-greeting">
              <img src={logo} alt="Awaken AI Logo" className="greeting-logo" />
              <p className="greeting-text">How can I help you today?</p>
            </div>
          )}
          {chatHistory.map((item, index) => (
            <div key={index} className={`chat-message ${item.type === 'user' ? 'user-message' : 'ai-message'} ${item.isError ? 'error-message-chat' : ''}`}>
              <div className="message-bubble">
                <p>{item.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="loading-indicator">
              <p>Awaken AI is thinking...</p>
            </div>
          )}
          {error && !isLoading && (
             <div className="chat-message ai-message error-message-chat">
                <div className="message-bubble">
                    <p>{error}</p>
                </div>
            </div>
          )}
        </div>

        <div className="search-area-container">
          <form onSubmit={handleAskAI} className="search-box"> {/* search-box class form ပေါ်ကိုပြောင်း */}
            <input
              type="text"
              className="form-control main-question-input" // main-question-input class အသစ်ထည့်
              placeholder="What do you want to know?" // Placeholder text from image
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              disabled={isLoading}
            />
            <div className="search-box-bottom-controls"> {/* Controls အတွက် div အသစ် */}
              <div className="model-selector" ref={modelDropdownRef}>
                <button type="button" className="model-selector-button" onClick={() => setShowModelDropdown(!showModelDropdown)}>
                  {selectedAiModel.charAt(0).toUpperCase() + selectedAiModel.slice(1)} <ChevronDown size={14} /> {/* Display selected model name */}
                </button>
                {showModelDropdown && (
                  <ul className="model-dropdown-list">
                    {['gemini', 'gpt-4', 'claude', 'deepseek'].map(model => (
                      <li key={model} onClick={() => handleModelSelect(model)}>
                        {model.charAt(0).toUpperCase() + model.slice(1)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="submit" className="ask-button" disabled={isLoading || !aiQuestion.trim()}>
                Awaken <ArrowUp size={16} /> {/* Text and new icon from image */}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Sidebars */}
      <div className={`sidebar history-sidebar ${showHistorySidebar ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h3>Chat History</h3>
          <button onClick={toggleHistorySidebar} className="close-button"><X size={24} /></button>
        </div>
        <div className="sidebar-content">
          {/* Actual history items will be rendered here */}
          <div className="history-group">
            <h4>Today</h4>
            <ul className="history-list">
              {/* Example: <li>Previous chat title</li> */}
            </ul>
          </div>
          <div className="history-group">
            <h4>Yesterday</h4>
            <ul className="history-list">
              {/* Example: <li>Another chat title</li> */}
            </ul>
          </div>
        </div>
      </div>

      <div className={`sidebar user-menu-sidebar ${showUserMenuSidebar ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h3>User Menu</h3>
          <button onClick={toggleUserMenuSidebar} className="close-button"><X size={24} /></button>
        </div>
        <div className="sidebar-content">
          <ul className="user-menu-list">
            <li>
              <button onClick={() => { toggleHistorySidebar(); setShowUserMenuSidebar(false); }} className="menu-button">
                <ClockHistory className="me-2" /> Recent Chats
              </button>
            </li>
            <li>
              <button onClick={toggleUploadModal} className="menu-button">
                <Upload className="me-2" /> Upload File
              </button>
            </li>
            <li>
              <button onClick={logout} className="menu-button btn-danger">
                <BoxArrowRight className="me-2" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
         <div className={`upload-modal-overlay ${showUploadModal ? 'show' : ''}`}>
            <div className="upload-modal-content">
                <FileUpload
                    onClose={toggleUploadModal}
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                />
            </div>
        </div>
      )}

      {/* Upload Status Message */}
      {uploadStatus && (
        <div className={`upload-status-indicator ${uploadStatus.includes('failed') ? 'error' : 'success'}`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}

// --- Router Setup ---
function RootApp() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApplication />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default RootApp;