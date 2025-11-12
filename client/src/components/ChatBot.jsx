import React, { useState, useEffect, useRef } from "react";
import { supabase } from '../supabaseClient';
import "./../styles/ChatBot.css";

const ChatBot = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Get current user on component mount
  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      setUser(user);
      setUserLoaded(true);
    } catch (error) {
      console.error('Error getting user:', error);
      setUserLoaded(true);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced speech synthesis function
  const speakText = async (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('No text provided for speech synthesis');
      return;
    }

    // Stop any ongoing speech
    stopSpeaking();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure speech settings
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Set voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.includes('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utteranceRef.current = utterance;
      setIsSpeaking(true);

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  };

  // Extract main response from Puter.js response
  const extractMainResponse = (response) => {
    console.log("Raw Puter.js response:", response);
    
    // Case 1: Direct string response
    if (typeof response === 'string') {
      return response;
    }
    
    // Case 2: response.content (most common)
    if (response?.content) {
      return response.content;
    }
    
    // Case 3: response.message with content array (OpenAI-like format)
    if (response?.message?.content) {
      if (Array.isArray(response.message.content)) {
        // Extract text from content array
        return response.message.content
          .map(item => item.text || '')
          .filter(text => text.trim())
          .join(' ');
      } else if (typeof response.message.content === 'string') {
        return response.message.content;
      }
    }
    
    // Case 4: response.choices[0].message.content (OpenAI format)
    if (response?.choices?.[0]?.message?.content) {
      return response.choices[0].message.content;
    }
    
    // Case 5: response.data or response.result
    if (response?.data) {
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    }
    
    if (response?.result) {
      return typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
    }
    
    // Case 6: Fallback - stringify the response
    console.warn("Could not extract main response, using fallback:", response);
    return typeof response === 'object' ? JSON.stringify(response) : String(response);
  };

  // Log action to Supabase
  const logAction = async (action) => {
    if (!user) {
      console.warn("Cannot log action, user not loaded yet:", action);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('History')
        .insert([
          { 
            user_id: user.id, 
            action: action,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error logging action:', error);
      }
    } catch (error) {
      console.error('Exception logging action:', error);
    }
  };

  // Save individual message to chat_history
  const saveMessage = async (message) => {
    if (!user) {
      console.warn("Cannot save message, user not loaded");
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          user_query: message.type === 'user' ? message.query : '',
          ai_response: message.type === 'ai' ? message.response.content : '',
          message_type: message.type,
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error("Error saving message:", error);
      }
    } catch (error) {
      console.error("Exception saving message:", error);
    }
  };

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Close the stream immediately after checking
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  // Initialize SpeechRecognition only after user is loaded
  useEffect(() => {
    if (!userLoaded) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        console.log("Final speech result:", finalTranscript);
        setQuery(finalTranscript);
        logAction(`Used voice input: "${finalTranscript}"`);
        
        // Auto-stop after getting final result
        setTimeout(() => {
          if (listening) {
            recognition.stop();
          }
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          alert('Microphone permission denied. Please allow microphone access.');
          break;
        case 'no-speech':
          console.log('No speech detected');
          break;
        default:
          console.error('Speech recognition error:', event.error);
      }
      
      setListening(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [userLoaded]);

  const handleSend = async () => {
    if (!query.trim()) return;
    
    // Stop any ongoing speech or recognition
    stopSpeaking();
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
    
    setIsLoading(true);

    const userMessage = { 
      query, 
      type: 'user', 
      timestamp: new Date().toLocaleTimeString() 
    };

    // Add user message immediately to UI
    setMessages(prev => [...prev, userMessage]);

    // Log the user's query and save message
    await logAction(`Asked question: "${query}"`);
    await saveMessage(userMessage);

    try {
      const response = await window.puter.ai.chat(query, { model: "gpt-4.1-nano" });

      // Extract the main response text
      const mainResponse = extractMainResponse(response);
      console.log("Extracted main response:", mainResponse);

      const aiMessage = { 
        query, 
        response: {
          content: mainResponse,
          raw: response // Keep raw response for debugging
        },
        type: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };

      // Add AI message to UI
      setMessages(prev => [...prev, aiMessage]);
      setQuery("");
      setIsLoading(false);

      // Log the AI response and save message
      await logAction(`Received AI response: "${mainResponse.substring(0, 100)}..."`);
      await saveMessage(aiMessage);

      // Speak the response immediately
      if (mainResponse.trim()) {
        await speakText(mainResponse);
        await logAction("Used text-to-speech for AI response");
      }
    } catch (err) {
      console.error("Puter.js error:", err);
      const errorMessage = { 
        query, 
        response: { content: "Error: AI didn't respond. Please try again." }, 
        type: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };
      
      // Add error message to UI
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      
      // Log and save error
      await logAction("AI request failed");
      await saveMessage(errorMessage);
    }
  };

  const handleMic = async () => {
    // Check browser support first
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Try Chrome or Edge.");
      return;
    }

    if (listening) {
      // Stop listening
      try {
        recognitionRef.current?.stop();
        setListening(false);
        await logAction("Stopped voice recording");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
        setListening(false);
      }
    } else {
      // Start listening - check permissions first
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        alert('Please allow microphone access to use voice input.');
        return;
      }

      try {
        // Stop any ongoing speech
        stopSpeaking();
        
        // Check if we need to reinitialize recognition
        if (!recognitionRef.current) {
          console.log("Reinitializing speech recognition...");
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.lang = "en-US";
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onstart = () => setListening(true);
          recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              }
            }
            if (finalTranscript) {
              setQuery(finalTranscript);
              recognition.stop();
            }
          };
          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setListening(false);
          };
          recognition.onend = () => setListening(false);

          recognitionRef.current = recognition;
        }

        // Start recognition
        recognitionRef.current.start();
        await logAction("Started voice recording");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        
        // Handle specific errors
        if (error.name === 'NotAllowedError') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please check your audio hardware.');
        } else {
          alert('Error accessing microphone. Please try again.');
        }
        
        setListening(false);
      }
    }
  };

  const handleStop = async () => {
    // Stop speech synthesis
    stopSpeaking();
    
    // Stop speech recognition if active
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      await logAction("Stopped all audio (voice + speech)");
    } else if (isSpeaking) {
      await logAction("Stopped AI speech");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Load chat history from Supabase when user is loaded
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages = data.map(item => ({
          query: item.user_query,
          response: { content: item.ai_response },
          type: item.message_type,
          timestamp: new Date(item.created_at).toLocaleTimeString()
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Clean up speech synthesis on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (listening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [listening]);

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1 className="chatbot-title">Nexus AI Assistant</h1>
        <p className="chatbot-subtitle">Powered by Puter.js • Speak or type your questions</p>
        {user && (
          <div className="user-session-info">
            <small>Logged in as: {user.email}</small>
            {!userLoaded && <small> (Loading...)</small>}
          </div>
        )}
        {!user && userLoaded && (
          <div className="user-session-info">
            <small>Not logged in - history won't be saved</small>
          </div>
        )}
      </div>

      <div className="chatbot-input-section">
        <div className="chatbot-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question or click the mic to speak..."
            className="chatbot-input"
            disabled={isLoading}
          />
        </div>
        <div className="chatbot-buttons">
          <button 
            onClick={handleSend} 
            className="chatbot-button primary"
            disabled={isLoading || !query.trim()}
          >
            <span>🚀</span> Send
          </button>
          <button 
            onClick={handleMic} 
            className={`chatbot-button secondary ${listening ? 'listening' : ''}`}
            disabled={isLoading || !userLoaded}
          >
            <span>{listening ? "🎙️" : "🎤"}</span> 
            {listening ? "Listening..." : "Speak"}
          </button>
          <button 
            onClick={handleStop} 
            className={`chatbot-button danger ${(isSpeaking || listening) ? 'active' : ''}`}
            disabled={!isSpeaking && !listening}
          >
            <span>⏹️</span> Stop
          </button>
        </div>
      </div>

      <div className="chatbot-status">
        <div className="status-indicator">
          <div className={`status-dot ${listening ? 'listening' : isSpeaking ? 'speaking' : ''}`}></div>
          <span>
            {listening ? "🎤 Listening... Speak now" : 
             isSpeaking ? "🔊 Speaking response..." :
             isLoading ? "🤔 Processing your request..." : 
             !userLoaded ? "⏳ Loading user session..." :
             "✅ Ready to help"}
          </span>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <div className="empty-chat-text">No messages yet</div>
            <div className="empty-chat-subtext">Start a conversation by sending a message</div>
            {!user && userLoaded && (
              <div className="login-reminder">
                <p>💡 Sign in to save your chat history across sessions!</p>
              </div>
            )}
          </div>
        ) : (
          messages.map((message, idx) => (
            <div key={idx} className={`message ${message.type === 'user' ? 'message-user' : 'message-ai'}`}>
              <div className="message-header">
                <div className={`message-avatar ${message.type === 'user' ? 'avatar-user' : 'avatar-ai'}`}>
                  {message.type === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`message-sender ${message.type === 'user' ? 'sender-user' : 'sender-ai'}`}>
                  {message.type === 'user' ? 'You' : 'Nexus AI'}
                </div>
                {message.type === 'ai' && isSpeaking && idx === messages.length - 1 && (
                  <div className="speaking-indicator">
                    <span className="pulse-dot"></span>
                    Speaking...
                  </div>
                )}
              </div>
              <div className="message-content">
                {message.type === 'user' ? (
                  message.query
                ) : (
                  message.response.content
                )}
              </div>
              <div className="message-time">
                {message.timestamp}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="chatbot-loading">
            <span>AI is thinking</span>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBot;
























// import React, { useState, useEffect, useRef } from "react";
// import { supabase } from '../supabaseClient';
// import "./../styles/ChatBot.css";

// const ChatBot = () => {
//   const [query, setQuery] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [listening, setListening] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [user, setUser] = useState(null);
//   const [userLoaded, setUserLoaded] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const recognitionRef = useRef(null);
//   const utteranceRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // Get current user on component mount
//   useEffect(() => {
//     getCurrentUser();
//   }, []);

//   const getCurrentUser = async () => {
//     try {
//       const { data: { user }, error } = await supabase.auth.getUser();
//       if (error) {
//         console.error('Error getting user:', error);
//         return;
//       }
//       setUser(user);
//       setUserLoaded(true);
//     } catch (error) {
//       console.error('Error getting user:', error);
//       setUserLoaded(true);
//     }
//   };

//   // Scroll to bottom of messages
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Enhanced speech synthesis function
//   const speakText = async (text) => {
//     if (!text || typeof text !== 'string') {
//       console.warn('No text provided for speech synthesis');
//       return;
//     }

//     // Stop any ongoing speech
//     stopSpeaking();

//     return new Promise((resolve) => {
//       const utterance = new SpeechSynthesisUtterance(text);
      
//       // Configure speech settings
//       utterance.rate = 0.9; // Slightly slower for better comprehension
//       utterance.pitch = 1.0;
//       utterance.volume = 1.0;
      
//       // Set voice if available
//       const voices = speechSynthesis.getVoices();
//       const preferredVoice = voices.find(voice => 
//         voice.lang.includes('en') && voice.name.includes('Female')
//       ) || voices.find(voice => voice.lang.includes('en'));
      
//       if (preferredVoice) {
//         utterance.voice = preferredVoice;
//       }

//       utteranceRef.current = utterance;
//       setIsSpeaking(true);

//       utterance.onend = () => {
//         setIsSpeaking(false);
//         utteranceRef.current = null;
//         resolve();
//       };
      
//       utterance.onerror = (event) => {
//         console.error('Speech synthesis error:', event);
//         setIsSpeaking(false);
//         utteranceRef.current = null;
//         resolve();
//       };

//       speechSynthesis.speak(utterance);
//     });
//   };

//   const stopSpeaking = () => {
//     if (speechSynthesis.speaking) {
//       speechSynthesis.cancel();
//       setIsSpeaking(false);
//       utteranceRef.current = null;
//     }
//   };

//   // Extract main response from Puter.js response
//   const extractMainResponse = (response) => {
//     console.log("Raw Puter.js response:", response);
    
//     // Case 1: Direct string response
//     if (typeof response === 'string') {
//       return response;
//     }
    
//     // Case 2: response.content (most common)
//     if (response?.content) {
//       return response.content;
//     }
    
//     // Case 3: response.message with content array (OpenAI-like format)
//     if (response?.message?.content) {
//       if (Array.isArray(response.message.content)) {
//         // Extract text from content array
//         return response.message.content
//           .map(item => item.text || '')
//           .filter(text => text.trim())
//           .join(' ');
//       } else if (typeof response.message.content === 'string') {
//         return response.message.content;
//       }
//     }
    
//     // Case 4: response.choices[0].message.content (OpenAI format)
//     if (response?.choices?.[0]?.message?.content) {
//       return response.choices[0].message.content;
//     }
    
//     // Case 5: response.data or response.result
//     if (response?.data) {
//       return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
//     }
    
//     if (response?.result) {
//       return typeof response.result === 'string' ? response.result : JSON.stringify(response.result);
//     }
    
//     // Case 6: Fallback - stringify the response
//     console.warn("Could not extract main response, using fallback:", response);
//     return typeof response === 'object' ? JSON.stringify(response) : String(response);
//   };

//   // Log action to Supabase
//   const logAction = async (action) => {
//     if (!user) {
//       console.warn("Cannot log action, user not loaded yet:", action);
//       return;
//     }
    
//     try {
//       const { data, error } = await supabase
//         .from('History')
//         .insert([
//           { 
//             user_id: user.id, 
//             action: action,
//             created_at: new Date().toISOString()
//           }
//         ]);

//       if (error) {
//         console.error('Error logging action:', error);
//       }
//     } catch (error) {
//       console.error('Exception logging action:', error);
//     }
//   };

//   // Save individual message to chat_history
//   const saveMessage = async (message) => {
//     if (!user) {
//       console.warn("Cannot save message, user not loaded");
//       return;
//     }

//     try {
//       const { error } = await supabase
//         .from('chat_history')
//         .insert([{
//           user_id: user.id,
//           user_query: message.type === 'user' ? message.query : '',
//           ai_response: message.type === 'ai' ? message.response.content : '',
//           message_type: message.type,
//           created_at: new Date().toISOString(),
//         }]);

//       if (error) {
//         console.error("Error saving message:", error);
//       }
//     } catch (error) {
//       console.error("Exception saving message:", error);
//     }
//   };

//   // Initialize SpeechRecognition only after user is loaded
//   useEffect(() => {
//     if (!userLoaded) return;

//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) {
//       alert("Your browser does not support Speech Recognition");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.continuous = false;
//     recognition.lang = "en-US";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onstart = () => {
//       setListening(true);
//     };

//     recognition.onresult = async (event) => {
//       const speechResult = event.results[0][0].transcript;
//       setQuery(speechResult);
//       await logAction(`Used voice input: "${speechResult}"`);
//     };

//     recognition.onerror = (event) => {
//       console.error('Speech recognition error:', event.error);
//       setListening(false);
//     };

//     recognition.onend = () => {
//       setListening(false);
//     };

//     recognitionRef.current = recognition;
//   }, [userLoaded]);

//   const handleSend = async () => {
//     if (!query.trim()) return;
    
//     // Stop any ongoing speech or recognition
//     stopSpeaking();
//     if (listening) {
//       recognitionRef.current?.stop();
//       setListening(false);
//     }
    
//     setIsLoading(true);

//     const userMessage = { 
//       query, 
//       type: 'user', 
//       timestamp: new Date().toLocaleTimeString() 
//     };

//     // Add user message immediately to UI
//     setMessages(prev => [...prev, userMessage]);

//     // Log the user's query and save message
//     await logAction(`Asked question: "${query}"`);
//     await saveMessage(userMessage);

//     try {
//       const response = await window.puter.ai.chat(query, { model: "gpt-4.1-nano" });

//       // Extract the main response text
//       const mainResponse = extractMainResponse(response);
//       console.log("Extracted main response:", mainResponse);

//       const aiMessage = { 
//         query, 
//         response: {
//           content: mainResponse,
//           raw: response // Keep raw response for debugging
//         },
//         type: 'ai',
//         timestamp: new Date().toLocaleTimeString()
//       };

//       // Add AI message to UI
//       setMessages(prev => [...prev, aiMessage]);
//       setQuery("");
//       setIsLoading(false);

//       // Log the AI response and save message
//       await logAction(`Received AI response: "${mainResponse.substring(0, 100)}..."`);
//       await saveMessage(aiMessage);

//       // Speak the response immediately
//       if (mainResponse.trim()) {
//         await speakText(mainResponse);
//         await logAction("Used text-to-speech for AI response");
//       }
//     } catch (err) {
//       console.error("Puter.js error:", err);
//       const errorMessage = { 
//         query, 
//         response: { content: "Error: AI didn't respond. Please try again." }, 
//         type: 'ai',
//         timestamp: new Date().toLocaleTimeString()
//       };
      
//       // Add error message to UI
//       setMessages(prev => [...prev, errorMessage]);
//       setIsLoading(false);
      
//       // Log and save error
//       await logAction("AI request failed");
//       await saveMessage(errorMessage);
//     }
//   };

//   const handleMic = async () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition not available in your browser");
//       return;
//     }

//     if (listening) {
//       recognitionRef.current.stop();
//       setListening(false);
//       await logAction("Stopped voice recording");
//     } else {
//       // Stop any ongoing speech
//       stopSpeaking();
      
//       try {
//         recognitionRef.current.start();
//         await logAction("Started voice recording");
//       } catch (error) {
//         console.error("Error starting speech recognition:", error);
//         setListening(false);
//       }
//     }
//   };

//   const handleStop = async () => {
//     // Stop speech synthesis
//     stopSpeaking();
    
//     // Stop speech recognition if active
//     if (listening) {
//       recognitionRef.current.stop();
//       setListening(false);
//       await logAction("Stopped all audio (voice + speech)");
//     } else if (isSpeaking) {
//       await logAction("Stopped AI speech");
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   // Load chat history from Supabase when user is loaded
//   useEffect(() => {
//     if (user) {
//       loadChatHistory();
//     }
//   }, [user]);

//   const loadChatHistory = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('chat_history')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: true });

//       if (error) {
//         console.error('Error loading chat history:', error);
//         return;
//       }

//       if (data && data.length > 0) {
//         const loadedMessages = data.map(item => ({
//           query: item.user_query,
//           response: { content: item.ai_response },
//           type: item.message_type,
//           timestamp: new Date(item.created_at).toLocaleTimeString()
//         }));
//         setMessages(loadedMessages);
//       }
//     } catch (error) {
//       console.error('Error loading chat history:', error);
//     }
//   };

//   // Clean up speech synthesis on component unmount
//   useEffect(() => {
//     return () => {
//       stopSpeaking();
//       if (listening) {
//         recognitionRef.current?.stop();
//       }
//     };
//   }, []);

//   return (
//     <div className="chatbot-container">
//       <div className="chatbot-header">
//         <h1 className="chatbot-title">Nexus AI Assistant</h1>
//         <p className="chatbot-subtitle">Powered by Puter.js • Speak or type your questions</p>
//         {user && (
//           <div className="user-session-info">
//             <small>Logged in as: {user.email}</small>
//             {!userLoaded && <small> (Loading...)</small>}
//           </div>
//         )}
//         {!user && userLoaded && (
//           <div className="user-session-info">
//             <small>Not logged in - history won't be saved</small>
//           </div>
//         )}
//       </div>

//       <div className="chatbot-input-section">
//         <div className="chatbot-input-wrapper">
//           <input
//             type="text"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Type your question or click the mic to speak..."
//             className="chatbot-input"
//             disabled={isLoading}
//           />
//         </div>
//         <div className="chatbot-buttons">
//           <button 
//             onClick={handleSend} 
//             className="chatbot-button primary"
//             disabled={isLoading || !query.trim()}
//           >
//             <span>🚀</span> Send
//           </button>
//           <button 
//             onClick={handleMic} 
//             className={`chatbot-button secondary ${listening ? 'listening' : ''}`}
//             disabled={isLoading || !userLoaded}
//           >
//             <span>{listening ? "🎙️" : "🎤"}</span> 
//             {listening ? "Listening..." : "Speak"}
//           </button>
//           <button 
//             onClick={handleStop} 
//             className={`chatbot-button danger ${(isSpeaking || listening) ? 'active' : ''}`}
//             disabled={!isSpeaking && !listening}
//           >
//             <span>⏹️</span> Stop
//           </button>
//         </div>
//       </div>

//       <div className="chatbot-status">
//         <div className="status-indicator">
//           <div className={`status-dot ${listening ? 'listening' : isSpeaking ? 'speaking' : ''}`}></div>
//           <span>
//             {listening ? "🎤 Listening... Speak now" : 
//              isSpeaking ? "🔊 Speaking response..." :
//              isLoading ? "🤔 Processing your request..." : 
//              !userLoaded ? "⏳ Loading user session..." :
//              "✅ Ready to help"}
//           </span>
//         </div>
//       </div>

//       <div className="chatbot-messages">
//         {messages.length === 0 ? (
//           <div className="empty-chat">
//             <div className="empty-chat-icon">💬</div>
//             <div className="empty-chat-text">No messages yet</div>
//             <div className="empty-chat-subtext">Start a conversation by sending a message</div>
//             {!user && userLoaded && (
//               <div className="login-reminder">
//                 <p>💡 Sign in to save your chat history across sessions!</p>
//               </div>
//             )}
//           </div>
//         ) : (
//           messages.map((message, idx) => (
//             <div key={idx} className={`message ${message.type === 'user' ? 'message-user' : 'message-ai'}`}>
//               <div className="message-header">
//                 <div className={`message-avatar ${message.type === 'user' ? 'avatar-user' : 'avatar-ai'}`}>
//                   {message.type === 'user' ? '👤' : '🤖'}
//                 </div>
//                 <div className={`message-sender ${message.type === 'user' ? 'sender-user' : 'sender-ai'}`}>
//                   {message.type === 'user' ? 'You' : 'Nexus AI'}
//                 </div>
//                 {message.type === 'ai' && isSpeaking && idx === messages.length - 1 && (
//                   <div className="speaking-indicator">
//                     <span className="pulse-dot"></span>
//                     Speaking...
//                   </div>
//                 )}
//               </div>
//               <div className="message-content">
//                 {message.type === 'user' ? (
//                   message.query
//                 ) : (
//                   message.response.content
//                 )}
//               </div>
//               <div className="message-time">
//                 {message.timestamp}
//               </div>
//             </div>
//           ))
//         )}

//         {isLoading && (
//           <div className="chatbot-loading">
//             <span>AI is thinking</span>
//             <div className="loading-dots">
//               <div className="loading-dot"></div>
//               <div className="loading-dot"></div>
//               <div className="loading-dot"></div>
//             </div>
//           </div>
//         )}
        
//         <div ref={messagesEndRef} />
//       </div>
//     </div>
//   );
// };

// export default ChatBot;