import React, { useState, useRef, useEffect } from 'react';
import { demonTheme } from '@demon/core';
import { executeNativeTool, onFileWatcherEvent, askGemini } from '../ipc';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello. I am Demon. My logic engine and voice protocols are online.' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // STT Reference
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const tools = [
    {
      name: 'open_anything',
      description: 'Open a website, search YouTube, or search Google based on what the user asks for. Use this for any "open X", "play X on YouTube", or "search for X" request.',
      parameters: { 
        type: 'OBJECT',
        properties: { query: { type: 'STRING', description: 'URL, search term, or song/video name for YouTube' } },
        required: ['query']
      }
    },
    {
      name: 'launch_app',
      description: 'Launch a local Windows application or execute a command.',
      parameters: {
        type: 'OBJECT',
        properties: { command: { type: 'STRING', description: 'The CLI command or app name to run' } },
        required: ['command']
      }
    },
    {
      name: 'set_volume',
      description: 'Set the system volume level (0-100)',
      parameters: {
        type: 'OBJECT',
        properties: { level: { type: 'INTEGER', description: 'Volume level from 0 to 100' } },
        required: ['level']
      }
    },
    {
      name: 'set_brightness',
      description: 'Set the system screen brightness level (0-100)',
      parameters: {
        type: 'OBJECT',
        properties: { level: { type: 'INTEGER', description: 'Brightness level from 0 to 100' } },
        required: ['level']
      }
    },
    {
      name: 'get_active_window',
      description: 'Get the title and application of the currently focused window',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'list_processes',
      description: 'List top 50 currently running processes and their PIDs',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'search_files',
      description: 'Search for files using a glob pattern in a specified directory',
      parameters: {
        type: 'OBJECT',
        properties: { 
          pattern: { type: 'STRING', description: 'Fast-glob pattern, e.g. **/*.jpg' },
          directory: { type: 'STRING', description: 'Absolute path to directory to search' }
        },
        required: ['pattern', 'directory']
      }
    },
    {
      name: 'read_file_safe',
      description: 'Read a file safely, parsing text or summarizing binary files based on actual content type',
      parameters: {
        type: 'OBJECT',
        properties: { filePath: { type: 'STRING', description: 'Absolute path to file' } },
        required: ['filePath']
      }
    },
    {
      name: 'delete_file',
      description: 'Send a file to the OS recycle bin (trash)',
      parameters: {
        type: 'OBJECT',
        properties: { filePath: { type: 'STRING', description: 'Absolute path to file' } },
        required: ['filePath']
      }
    },
    {
      name: 'move_file',
      description: 'Move a file from source to a new destination directory',
      parameters: {
        type: 'OBJECT',
        properties: { 
          sourcePath: { type: 'STRING', description: 'Absolute path to the source file' },
          destinationDir: { type: 'STRING', description: 'Absolute path to the destination directory' }
        },
        required: ['sourcePath', 'destinationDir']
      }
    }
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
            setIsListening(false);
            // We could auto-send here, but letting the user see it first is safer
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Scaffold for Picovoice Porcupine Wake Word
  // Requires: npm install @picovoice/porcupine-web-react
  // Uncomment and configure with your AccessKey and .ppn file to enable "Hey Demon" background listening.
  /*
  import { usePorcupine } from '@picovoice/porcupine-web-react';
  const { keywordDetection, isLoaded, isListening: isPorcupineListening, error, init, start, stop } = usePorcupine();
  
  useEffect(() => {
    // Initialize once with your Picovoice AccessKey
    // const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;
    // init(accessKey, { customWritePath: 'hey_demon.ppn', label: 'Demon' }, { base64: '...model...' });
  }, []);

  useEffect(() => {
    if (keywordDetection !== null) {
      console.log('Wake word detected!');
      // Trigger Web Speech STT listening automatically when wake word is heard
      toggleListening();
    }
  }, [keywordDetection]);
  */

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput(''); // clear input when starting new dictation
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Basic text cleanup for TTS (remove emojis)
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Google US English'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 1.05;
      utterance.pitch = 0.9; // Slightly lower pitch for 'Demon' persona
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-organize watcher listener
  useEffect(() => {
    const cleanup = onFileWatcherEvent(async (data) => {
      if (data.event === 'add') {
        const sysMsg = `System Event: A new file was added at ${data.path}. Please analyze the file type and use the 'move_file' tool to automatically organize it into a better folder (like Documents, Pictures, or Videos) if it belongs there.`;
        
        const newEventMsg: Message = { id: Date.now().toString(), role: 'user', content: sysMsg };
        setMessages(prev => [...prev, newEventMsg]);
        
        handleAIProcessing([...messages, newEventMsg]);
      }
    });
    return cleanup;
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAIProcessing = async (currentHistory: Message[]) => {
    const geminiHistory = currentHistory.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    try {
      const response = await askGemini(geminiHistory, tools);
      
      if (!response.success) throw new Error(response.error);

      const responsePart: any = response.data.candidates[0].content.parts[0];

      if (responsePart.functionCall) {
        const { name, args } = responsePart.functionCall;
        
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: `⚙️ Executing Native Tool: ${name}(${JSON.stringify(args)})` 
        }]);

        const result = await executeNativeTool(name, args);
        
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: `✅ Tool Result: ${result.success ? 'Success' : 'Failed'} - ${result.output || result.error || result.message}` 
        }]);

      } else if (responsePart.text) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: responsePart.text 
        }]);
        speakText(responsePart.text);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: 'Error communicating with logic engine.' 
      }]);
      speakText('Error communicating with logic engine.');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    
    await handleAIProcessing([...messages, newUserMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '450px',
      height: '600px',
      maxHeight: '80vh',
      background: 'rgba(10, 10, 10, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${demonTheme.colors.border}`,
      borderRadius: '24px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: demonTheme.colors.dotPrimary, boxShadow: `0 0 8px ${demonTheme.colors.dotPrimary}` }} />
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500, letterSpacing: '1px', color: '#fff' }}>Demon Core</h2>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <div style={{
              fontSize: '0.75rem',
              color: demonTheme.colors.textMuted,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}>
              {msg.role}
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.4)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.2)' : demonTheme.colors.border}`,
              color: '#eaeaea',
              lineHeight: 1.5,
              fontSize: '0.95rem'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '20px',
        borderTop: `1px solid rgba(255,255,255,0.05)`,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={toggleListening}
          style={{
            background: isListening ? 'rgba(255,0,0,0.2)' : 'transparent',
            border: `1px solid ${isListening ? 'red' : demonTheme.colors.border}`,
            borderRadius: '12px',
            padding: '0 16px',
            color: isListening ? 'red' : demonTheme.colors.textPrimary,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Voice Dictation"
        >
          🎤
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak or type to Demon..."
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.5)',
            border: `1px solid ${demonTheme.colors.border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fff',
            outline: 'none',
            fontSize: '0.95rem',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = demonTheme.colors.outline}
          onBlur={(e) => e.target.style.borderColor = demonTheme.colors.border}
        />
        <button
          onClick={handleSend}
          style={{
            background: 'transparent',
            border: `1px solid ${demonTheme.colors.outline}`,
            borderRadius: '12px',
            padding: '0 20px',
            color: demonTheme.colors.textPrimary,
            cursor: 'pointer',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.8rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = demonTheme.colors.outline;
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = demonTheme.colors.textPrimary;
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
