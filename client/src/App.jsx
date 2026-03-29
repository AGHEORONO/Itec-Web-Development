import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import LandingPage from './components/LandingPage';
import NameModal from './components/NameModal';
import TopBar from './components/TopBar';
import Timeline from './components/Timeline';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import AIPanel from './components/AIPanel';
import { createCollaboration, getConnectedUsers } from './lib/collaboration';
import { executeCode, executeCodeInteractive, getAISuggestionStream } from './lib/pistonApi';
import { FileCode2, RefreshCw, X, Sparkles, Check } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { pushToGitHub } from './lib/githubApi';

function getShareUrl() {
  // Always prefer the actual current URL. If on Cloudflare, it uses Cloudflare.
  // If the page is on localhost dev server but the production build is tunneled,
  // construct the URL using the room path so it works either way.
  return window.location.href;
}

function copyToClipboard(text) {
  // navigator.clipboard only works in a Secure Context (HTTPS or localhost).
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }

  function fallbackCopy(txt) {
    const ta = document.createElement('textarea');
    ta.value = txt;
    // Prevent scrolling or rendering issues
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(ta);
  }
}

function getOrCreateRoomId() {
  const path = window.location.pathname;
  const match = path.match(/\/room\/(.+)/);
  if (match) return match[1];
  const id = Math.random().toString(36).substring(2, 10);
  window.history.replaceState(null, '', `/room/${id}`);
  return id;
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const userName = userProfile?.name || null;
  const [roomId] = useState(getOrCreateRoomId);
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [users, setUsers] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');

  // ── Visual States (FinalHackathon) ──
  const [isDark, setIsDark] = useState(true);
  const [themeHue, setThemeHue] = useState(() => Number(localStorage.getItem('itecify-theme-hue')) || 0);
  const [editorFont, setEditorFont] = useState("'JetBrains Mono','Fira Code','Consolas',monospace");
  const [favorites, setFavorites] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // ── Terminal messages (shared via Yjs) ──
  const [terminalMessages, setTerminalMessages] = useState([]);
  const terminalArrayRef = useRef(null);

  // ── File system (Yjs CRDT) ──
  const [files, setFiles] = useState(['main.py']);
  const [currentFile, setCurrentFile] = useState('main.py');
  const [isRgbMode, setIsRgbMode] = useState(false);
  const [folderColors, setFolderColors] = useState({});

  useEffect(() => {
    localStorage.setItem('itecify-theme-hue', themeHue);
  }, [themeHue]);

  useEffect(() => {
    const handleToggleRgb = () => setIsRgbMode(p => !p);
    window.addEventListener('toggle-rgb-mode', handleToggleRgb);
    return () => window.removeEventListener('toggle-rgb-mode', handleToggleRgb);
  }, []);

  const [activeYtext, setActiveYtext] = useState(null);

  const collabRef = useRef(null);
  const aiCollabRef = useRef(null);
  const editorValueRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const monacoRef = useRef(null);
  const execSessionRef = useRef(null);
  
  const [isGhostView, setIsGhostView] = useState(false);
  const isGhostViewRef = useRef(false);
  const isSwappingModelRef = useRef(false);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [ghostText, setGhostText] = useState(null);
  
  const [regenPopup, setRegenPopup] = useState(null);
  const aiBlocksRef = useRef([]);
  const isAiInjectingRef = useRef(false);

  const [inlineUIState, _setInlineUIState] = useState({ type: null, x: 0, y: 0, range: null, promptText: '', generatedRange: null, decorationCollection: null });
  const inlineUIRef = useRef(inlineUIState);
  const setInlineUI = useCallback((updater) => {
      const nextState = typeof updater === 'function' ? updater(inlineUIRef.current) : { ...inlineUIRef.current, ...updater };
      inlineUIRef.current = nextState;
      _setInlineUIState(nextState);
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDark(d => {
      document.documentElement.setAttribute('data-theme', d ? 'light' : 'dark');
      return !d;
    });
  }, []);

  // Toggle favorite
  const handleToggleFavorite = useCallback((fileName) => {
    setFavorites(prev => prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]);
  }, []);

  // Delete → Recycle Bin
  const handleDeleteFile = useCallback((fileName) => {
    if (!collabRef.current || files.length <= 1) return;
    setDeletedFiles(prev => [...prev, fileName]);
    collabRef.current.filesystem.delete(fileName);
    setFavorites(prev => prev.filter(f => f !== fileName));
    if (currentFile === fileName) {
      const remaining = files.filter(f => f !== fileName);
      if (remaining.length) setCurrentFile(remaining[0]);
    }
  }, [files, currentFile]);

  // Download File
  const handleDownloadFile = useCallback((fileName) => {
    if (!collabRef.current) return;
    const ytext = collabRef.current.filesystem.get(fileName);
    if (!ytext) return;
    const content = ytext.toString();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Restore from Recycle Bin
  const handleRestoreFile = useCallback((fileName) => {
    if (!collabRef.current) return;
    const newDoc = new Y.Text('');
    collabRef.current.filesystem.set(fileName, newDoc);
    setDeletedFiles(prev => prev.filter(f => f !== fileName));
    setCurrentFile(fileName);
  }, []);

  // Clear entire Recycle Bin
  const handleClearRecycleBin = useCallback(() => {
    setDeletedFiles([]);
  }, []);

  // ── Terminal message helpers ──
  const pushTerminalMessage = useCallback((msg) => {
    if (terminalArrayRef.current) {
      terminalArrayRef.current.push([JSON.stringify(msg)]);
    }
  }, []);

  const handleSendTerminalMessage = useCallback((text) => {
    if (isRunning && execSessionRef.current) {
        execSessionRef.current.write(text + '\n');
        pushTerminalMessage({
            type: 'user',
            author: userProfile?.name || 'Anonymous',
            text,
            color: collabRef.current?.color || '#38bdf8',
            timestamp: Date.now()
        });
        return;
    }

    pushTerminalMessage({
      type: 'user',
      author: userProfile?.name || 'Anonymous',
      text,
      color: collabRef.current?.color || '#38bdf8',
      timestamp: Date.now()
    });
  }, [userProfile, pushTerminalMessage, isRunning]);

  const handleClearTerminal = useCallback(() => {
    if (terminalArrayRef.current) {
      const len = terminalArrayRef.current.length;
      if (len > 0) {
        terminalArrayRef.current.delete(0, len);
      }
    }
  }, []);

  // Initialize collaboration
  useEffect(() => {
    if (!userProfile?.name) return;

    const collab = createCollaboration(roomId, userProfile);
    collabRef.current = collab;

    const updateUsers = () => setUsers(getConnectedUsers(collab.awareness));
    collab.awareness.on('change', updateUsers);
    updateUsers();

    const updateStatus = (event) => setWsStatus(event.status);
    collab.provider.on('status', updateStatus);

    const updateFiles = () => {
      const keys = Array.from(collab.filesystem.keys());
      if (keys.length === 0 && collab.provider.synced) {
        const defaultDoc = new Y.Text('');
        collab.filesystem.set('main.py', defaultDoc);
        setFiles(['main.py']);
      } else if (keys.length > 0) {
        setFiles(keys);
      }
    };
    collab.filesystem.observe(updateFiles);
    collab.provider.on('synced', updateFiles);
    updateFiles();

    // ── Folder Colors via Y.Map ──
    const updateFolderColors = () => {
        setFolderColors(collab.folderColors.toJSON());
    };
    collab.folderColors.observe(updateFolderColors);
    updateFolderColors();

    // ── Shared terminal messages via Y.Array ──
    const tArray = collab.ydoc.getArray('terminalMessages');
    terminalArrayRef.current = tArray;

    const syncMessages = () => {
      const msgs = [];
      tArray.forEach(item => {
        try { msgs.push(JSON.parse(item)); } catch (_) {}
      });
      setTerminalMessages(msgs);
    };
    tArray.observe(syncMessages);
    syncMessages();

    return () => {
      collab.awareness.off('change', updateUsers);
      collab.provider.off('status', updateStatus);
      collab.filesystem.unobserve(updateFiles);
      collab.folderColors.unobserve(updateFolderColors);
      tArray.unobserve(syncMessages);
      collab.provider.off('synced', updateFiles);
      collab.provider.destroy(); collab.ydoc.destroy();
    };
  }, [userProfile, roomId]);

  // Sync active Y.Text
  useEffect(() => {
    if (!collabRef.current) return;
    const ytext = collabRef.current.filesystem.get(currentFile);
    if (ytext) {
      setActiveYtext(ytext);
      setIsGhostView(false);
      setActiveNodeId(null);
      setGhostText(null);
    }
  }, [currentFile, files]);

  // Semantic Snapshot Capture Hook
  const captureSnapshot = useCallback((reason) => {
    // NEVER create snapshots while in Ghost View
    if (isGhostViewRef.current) return;
    if (!collabRef.current || !editorInstanceRef.current) return;
    const ydoc = collabRef.current.ydoc;
    const historyArray = ydoc.getArray(`${currentFile}-history`);
    
    // Push simple text object payload
    historyArray.push([{
        id: Date.now().toString(),
        reason,
        author: userName,
        color: users.find(u => u.name === userName)?.color || 'var(--accent)',
        timestamp: Date.now(),
        tag: null,
        text: editorInstanceRef.current.getValue() || ''
    }]);
  }, [currentFile, userName, users]);

  // Track text for execution
  useEffect(() => {
    if (!activeYtext) return;
    const observer = () => { editorValueRef.current = activeYtext.toString(); };
    activeYtext.observe(observer);
    editorValueRef.current = activeYtext.toString();
    return () => activeYtext.unobserve(observer);
  }, [activeYtext]);

  const handleSelectFile = (fileName) => {
    setCurrentFile(fileName);
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx') || fileName.endsWith('.ts')) setLanguage('javascript');
    else if (fileName.endsWith('.cpp') || fileName.endsWith('.c') || fileName.endsWith('.h')) setLanguage('cpp');
    else if (fileName.endsWith('.html')) setLanguage('html');
    else if (fileName.endsWith('.css')) setLanguage('css');
    else setLanguage('python');
  };

  const handleCreateFile = (fileName) => {
    if (!collabRef.current) return;
    const newDoc = new Y.Text('');
    collabRef.current.filesystem.set(fileName, newDoc);
    setCurrentFile(fileName);
  };

  const handleCreateFolder = (folderName) => {
    if (!collabRef.current) return;
    const newDoc = new Y.Text('');
    collabRef.current.filesystem.set(`${folderName}/.keep`, newDoc);
  };

  const handleMoveFile = (oldPath, newFolder) => {
    if (!collabRef.current) return;
    const fs = collabRef.current.filesystem;
    
    Array.from(fs.keys()).forEach(key => {
        if (key === oldPath || key.startsWith(oldPath + '/')) {
            const oldText = fs.get(key).toString();
            
            const relativePath = oldPath.includes('/') 
                ? key.substring(oldPath.lastIndexOf('/') + 1)
                : key;
                
            const destination = newFolder ? `${newFolder}/${relativePath}` : relativePath;
            
            const newDoc = new Y.Text(oldText);
            fs.set(destination, newDoc);
            fs.delete(key);
            
            if (currentFile === key) {
                setCurrentFile(destination);
            }
        }
    });
  };

  const handleExtractFolder = (folderPath) => {
    if (!collabRef.current) return;
    const fs = collabRef.current.filesystem;
    const parentPath = folderPath.includes('/') ? folderPath.substring(0, folderPath.lastIndexOf('/')) : '';
    
    Array.from(fs.keys()).forEach(key => {
        if (key.startsWith(folderPath + '/')) {
            const relativeToFolder = key.substring(folderPath.length + 1);
            if (!relativeToFolder) return;
            const destination = parentPath ? `${parentPath}/${relativeToFolder}` : relativeToFolder;
            const content = fs.get(key).toString();
            // Do not copy .keep if we are extracting and the folder might go away
            // Actually, keep it so that nested empty folders remain
            fs.set(destination, new Y.Text(content));
            fs.delete(key);
            if (currentFile === key) {
                setCurrentFile(destination);
            }
        }
    });

    // delete coloring
    const fcolors = collabRef.current.folderColors;
    if (fcolors.has(folderPath)) fcolors.delete(folderPath);
  };

  const handleSetFolderColor = (folderPath, color) => {
    if (!collabRef.current) return;
    if (color) {
      collabRef.current.folderColors.set(folderPath, color);
    } else {
      collabRef.current.folderColors.delete(folderPath);
    }
  };

  const handleDownloadWorkspace = async () => {
    if (!collabRef.current) return;
    const fs = collabRef.current.filesystem;
    const zip = new JSZip();
    
    Array.from(fs.keys()).forEach(key => {
        if (!key.endsWith('/.keep')) {
            zip.file(key, fs.get(key).toString());
        }
    });
    
    try {
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `itecify_workspace_${roomId}.zip`);
    } catch (err) {
        console.error("Error creating ZIP:", err);
    }
  };

  const handlePushToGitHub = async (token, repo, message) => {
    if (!collabRef.current) throw new Error("Not connected to collaboration server.");
    const fs = collabRef.current.filesystem;
    const files = [];

    Array.from(fs.keys()).forEach(key => {
        if (!key.endsWith('/.keep')) {
            files.push({
                path: key,
                content: fs.get(key).toString()
            });
        }
    });

    if (files.length === 0) {
        throw new Error("Workspace is empty, nothing to commit.");
    }

    return pushToGitHub({
        token,
        repo,
        message,
        files
    });
  };

  // Run code
  const handleRun = useCallback(async () => {
    const code = editorValueRef.current || '';
    if (!code.trim()) {
      pushTerminalMessage({ type: 'error', author: 'System', text: 'No code to execute', timestamp: Date.now() });
      setIsTerminalOpen(true);
      return;
    }

    if (language === 'html' || language === 'css') {
      setIsTerminalOpen(true);
      pushTerminalMessage({
        type: 'system', author: 'System',
        text: `▶ Rendering ${currentFile}...`,
        timestamp: Date.now()
      });
      
      const previewUrl = `/preview/${roomId}/${currentFile}`;
      window.open(previewUrl, '_blank');
      
      pushTerminalMessage({
        type: 'system', author: 'System',
        text: `✅ Opened Live Preview in a new tab. Output routing is enabled.`,
        timestamp: Date.now()
      });
      return;
    }

    setIsRunning(true);
    setIsTerminalOpen(true);
    pushTerminalMessage({
      type: 'system', author: 'System',
      text: `▶ Running ${currentFile} (${language})...`,
      timestamp: Date.now()
    });

    try {
      execSessionRef.current = executeCodeInteractive(
        language,
        code,
        (stdout) => pushTerminalMessage({ type: 'system', author: 'Output', text: stdout, timestamp: Date.now() }),
        (stderr) => pushTerminalMessage({ type: 'error', author: 'Error', text: stderr, timestamp: Date.now() }),
        (sysMsg) => pushTerminalMessage({ type: 'system', author: 'System', text: sysMsg, timestamp: Date.now() }),
        (code, time) => {
          pushTerminalMessage({
            type: 'system', author: 'System',
            text: `⏱ Process exited (${time || 0}ms)`,
            timestamp: Date.now()
          });
          setIsRunning(false);
          execSessionRef.current = null;
        }
      );
    } catch (err) {
      pushTerminalMessage({ type: 'error', author: 'Error', text: err.message, timestamp: Date.now() });
      setIsRunning(false);
    }
  }, [language, currentFile, pushTerminalMessage]);

  const handleKill = useCallback(() => {
    if (execSessionRef.current) {
        execSessionRef.current.kill();
    }
  }, []);

  // Accept AI → Replace via Monaco
  const handleAcceptAI = useCallback((code) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    const fullRange = model.getFullModelRange();
    
    isAiInjectingRef.current = true;
    editor.executeEdits('ai-accept', [{ range: fullRange, text: code, forceMoveMarkers: true }]);
    isAiInjectingRef.current = false;
    
    const collection = editor.createDecorationsCollection([{
      range: model.getFullModelRange(),
      options: { isWholeLine: true, className: 'ai-block-bg', linesDecorationsClassName: 'ai-block-margin', isHover: true }
    }]);
    
    aiBlocksRef.current.push({
         id: Date.now().toString(),
         prompt: 'AI Chat Panel Insertion',
         collection
    });
    
    captureSnapshot('AI Chat Insertion');
  }, [captureSnapshot]);

  // Inject Live → Stream into Monaco
  const handleInjectStream = useCallback(async (prompt) => {
    const editor = editorInstanceRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    isAiInjectingRef.current = true;

    const position = editor.getPosition();
    let currentLine = position.lineNumber;
    let currentCol = position.column;
    const startLine = currentLine;

    editor.executeEdits('ai-inject', [{ range: new monaco.Range(currentLine, currentCol, currentLine, currentCol), text: '\n', forceMoveMarkers: true }]);
    currentLine += 1; currentCol = 1;

    // Log AI activity in terminal
    pushTerminalMessage({
      type: 'ai', author: 'iTECKY Assistant',
      text: `Generating code for: "${prompt}"`,
      timestamp: Date.now()
    });

    try {
      await getAISuggestionStream(prompt, language, (chunkText) => {
        if (!chunkText) return;
        editor.executeEdits('ai-inject', [{ range: new monaco.Range(currentLine, currentCol, currentLine, currentCol), text: chunkText, forceMoveMarkers: true }]);
        const chunkLines = chunkText.split('\n');
        if (chunkLines.length > 1) { currentLine += chunkLines.length - 1; currentCol = chunkLines[chunkLines.length - 1].length + 1; }
        else { currentCol += chunkText.length; }
        editor.setPosition({ lineNumber: currentLine, column: currentCol });
        editor.revealLine(currentLine);
      });

      const collection = editor.createDecorationsCollection([{
        range: new monaco.Range(startLine + 1, 1, currentLine, 1),
        options: { isWholeLine: true, className: 'ai-block-bg', linesDecorationsClassName: 'ai-block-margin', isHover: true }
      }]);
      
      aiBlocksRef.current.push({
         id: Date.now().toString(),
         prompt,
         collection
      });

      pushTerminalMessage({
        type: 'ai', author: 'iTECKY Assistant',
        text: '✅ Code injection complete.',
        timestamp: Date.now()
      });
    } catch (err) {
      editor.executeEdits('ai-inject', [{ range: new monaco.Range(currentLine, currentCol, currentLine, currentCol), text: '// Stream Error', forceMoveMarkers: true }]);
      pushTerminalMessage({
        type: 'error', author: 'iTECKY Assistant',
        text: `Stream error: ${err.message}`,
        timestamp: Date.now()
      });
    } finally {
      isAiInjectingRef.current = false;
      captureSnapshot('AI Stream Insertion');
    }
  }, [language, pushTerminalMessage, captureSnapshot]);

  const handleRegenBlock = useCallback((blockId) => {
    const editor = editorInstanceRef.current;
    if (!editor || !monacoRef.current) return;
    const block = aiBlocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    
    const ranges = block.collection.getRanges();
    if (ranges.length === 0) return;
    const r = ranges[0];
    
    // Clear old text from Monaco
    isAiInjectingRef.current = true;
    editor.executeEdits('ai-regen', [{
      range: new monacoRef.current.Range(r.startLineNumber, 1, r.endLineNumber, editor.getModel().getLineMaxColumn(r.endLineNumber)),
      text: '', forceMoveMarkers: true 
    }]);
    isAiInjectingRef.current = false;
    
    // Reset cursor to start
    editor.setPosition({ lineNumber: r.startLineNumber, column: 1 });
    
    block.collection.clear();
    aiBlocksRef.current = aiBlocksRef.current.filter(b => b.id !== blockId);
    setRegenPopup(null);
    
    // Rerun stream from exact spot
    handleInjectStream(block.prompt);
  }, [handleInjectStream]);

  const getEditorCode = useCallback(() => editorValueRef.current || '', []);

  const updateInlinePosition = useCallback(() => {
      const editor = editorInstanceRef.current;
      if (!editor) return;
      const state = inlineUIRef.current;
      if (!state.type) return;

      let pos;
      if (state.type === 'result' && state.generatedRange) {
         pos = { lineNumber: state.generatedRange.endLineNumber, column: 1 };
      } else if (state.range) {
         pos = { lineNumber: state.range.endLineNumber, column: state.range.endColumn };
      }
      if (!pos) return;
      
      const coords = editor.getScrolledVisiblePosition(pos);
      if (!coords) return; 

      let newX = coords.left;
      let newY = coords.top + coords.height + 4;

      if (state.type === 'prompt') {
          newX = Math.max(10, coords.left - 20);
      } else if (state.type === 'result') {
          newX = Math.max(10, coords.left - Math.min(coords.left, 50));
      }

      if (state.x !== newX || state.y !== newY) {
          setInlineUI({ x: newX, y: newY });
      }
  }, [setInlineUI]);

  const handleInlineExecute = useCallback(async () => {
      const state = inlineUIRef.current;
      if (!state.promptText.trim() || !state.range) return;

      const editor = editorInstanceRef.current;
      const monaco = monacoRef.current;
      
      setInlineUI({ type: 'streaming' });
      isAiInjectingRef.current = true;

      const endLine = state.range.endLineNumber;
      editor.executeEdits('ai-inline', [{
          range: new monaco.Range(endLine, editor.getModel().getLineMaxColumn(endLine), endLine, editor.getModel().getLineMaxColumn(endLine)),
          text: '\n'
      }]);
      
      let currentLine = endLine + 1;
      let currentCol = 1;
      const startLine = currentLine;

      try {
          await getAISuggestionStream(state.promptText, language, (chunkText) => {
             if (!chunkText) return;
             editor.executeEdits('ai-inline', [{
                 range: new monaco.Range(currentLine, currentCol, currentLine, currentCol),
                 text: chunkText, forceMoveMarkers: true
             }]);
             const lines = chunkText.split('\n');
             if (lines.length > 1) {
                 currentLine += lines.length - 1;
                 currentCol = lines[lines.length - 1].length + 1;
             } else {
                 currentCol += chunkText.length;
             }
             editor.revealLine(currentLine);
             setTimeout(updateInlinePosition, 0);
          });
          
          const dec = editor.createDecorationsCollection([{
             range: new monaco.Range(startLine, 1, currentLine, 1),
             options: { isWholeLine: true, className: 'ai-block-bg', linesDecorationsClassName: 'ai-block-margin' }
          }]);

          setInlineUI({ type: 'result', generatedRange: new monaco.Range(startLine, 1, currentLine, currentCol), decorationCollection: dec });
          setTimeout(updateInlinePosition, 0);
      } catch (err) {
          pushTerminalMessage({ type: 'error', author: 'iTECify Inline AI', text: err.message, timestamp: Date.now() });
          setInlineUI({ type: null });
      } finally {
          isAiInjectingRef.current = false;
          captureSnapshot('Inline AI Generation');
      }
  }, [language, pushTerminalMessage, updateInlinePosition, setInlineUI, captureSnapshot]);

  const handleInlineAccept = useCallback(() => {
     const state = inlineUIRef.current;
     if (state.decorationCollection) state.decorationCollection.clear();
     setInlineUI({ type: null });
  }, [setInlineUI]);

  const handleInlineReject = useCallback(() => {
     const state = inlineUIRef.current;
     if (state.generatedRange && editorInstanceRef.current && monacoRef.current) {
         editorInstanceRef.current.executeEdits('ai-inline-reject', [{
            range: new monacoRef.current.Range(state.generatedRange.startLineNumber - 1, editorInstanceRef.current.getModel().getLineMaxColumn(state.generatedRange.startLineNumber - 1), state.generatedRange.endLineNumber, editorInstanceRef.current.getModel().getLineMaxColumn(state.generatedRange.endLineNumber)),
            text: ''
         }]);
     }
     if (state.decorationCollection) state.decorationCollection.clear();
     setInlineUI({ type: null });
  }, [setInlineUI]);

  // Show login
  if (!hasStarted) {
    return <LandingPage onStart={() => setHasStarted(true)} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  if (!userProfile?.name) {
    return <NameModal onSubmit={setUserProfile} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className={isRgbMode ? 'theme-rgb-mode' : ''} style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)',
      transition: 'background .7s', filter: `hue-rotate(${themeHue}deg)`
    }}>

      {/* Dynamic cursor styles */}
      <style>{users.map(u => `
        .yRemoteSelection-${u.clientId} { background-color: ${u.color}40; }
        .yRemoteSelectionHead-${u.clientId} {
            border-left: 2px solid ${u.color} !important;
            border-top: none !important;
            border-bottom: none !important;
            margin-left: -1px;
            position: relative;
        }
        .yRemoteSelectionHead-${u.clientId}::after {
            content: "${u.name}";
            position: absolute;
            top: 100%;
            left: -2px; /* Connects smoothly to the cursor line */
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 800;
            color: ${u.color}; /* Text matches colored line */
            background-color: var(--bg-app) !important; /* Appears empty/see-through while blocking background code */
            border: 1px solid ${u.color} !important; /* Outline matching the line color */
            border-radius: 0 6px 6px 6px !important; /* Flag shape */
            pointer-events: none;
            white-space: nowrap;
            z-index: 50;
        }
      `).join('\n')}</style>

      <TopBar
        language={language} onLanguageChange={setLanguage}
        onRun={handleRun} isRunning={isRunning}
        onShare={() => copyToClipboard(getShareUrl())}
        wsStatus={wsStatus} 
        isDark={isDark} onToggleTheme={toggleTheme}
        onToggleAI={() => setShowAI(!showAI)} isAiOpen={showAI}
        users={users}
      />



      <main style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sidebar
          users={users} files={files} currentFile={currentFile}
          onSelectFile={handleSelectFile} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile}
          favorites={favorites} onToggleFavorite={handleToggleFavorite}
          deletedFiles={deletedFiles} onRestoreFile={handleRestoreFile}
          onClearRecycleBin={handleClearRecycleBin}
          themeHue={themeHue} onThemeHueChange={setThemeHue}
          editorFont={editorFont} onEditorFontChange={setEditorFont}
          userName={userName}
          onDownloadFile={handleDownloadFile}
          onMoveFile={handleMoveFile}
          onCreateFolder={handleCreateFolder}
          onExtractFolder={handleExtractFolder}
          folderColors={folderColors}
          onSetFolderColor={handleSetFolderColor}
          onDownloadWorkspace={handleDownloadWorkspace}
          onPushToGitHub={handlePushToGitHub}
        />

        {/* Editor section */}
        <section className="mobile-panel-margin" style={{
          flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 0',
          background: 'var(--bg-panel)', minWidth: 0, position: 'relative', transition: 'background .7s'
        }}>

          {/* File tabs */}
          {files.filter(f => !f.endsWith('/.keep')).length > 0 && (
            <div style={{ display: 'flex', overflowX: 'auto', gap: 4 }}>
              {files.filter(f => !f.endsWith('/.keep')).map(f => {
                const isActive = currentFile === f;
                return (
                  <div key={f} onClick={() => handleSelectFile(f)} style={{
                    background: isActive ? 'var(--bg-terminal)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 12, fontFamily: 'monospace', fontWeight: 500,
                    padding: '10px 20px', borderRadius: '12px 12px 0 0',
                    border: '1px solid var(--border)', borderBottom: 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', opacity: isActive ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.opacity = 0.6; }}
                  >
                    <FileCode2 size={14} /> {f}
                  </div>
                )
              })}
            </div>
          )}

          {/* Editor */}
          <div style={{
            flex: 1, overflow: 'hidden', borderRadius: '0 12px 12px 12px', border: '1px solid var(--border)',
            background: 'var(--bg-terminal)', position: 'relative'
          }}>
            {collabRef.current && activeYtext ? (
              <CodeEditor
                ytext={activeYtext}
                awareness={collabRef.current.awareness}
                language={language}
                isDark={isDark}
                fontFamily={editorFont}
                ghostText={ghostText}
                onMount={(editor, monaco) => {
                  editorInstanceRef.current = editor;
                  monacoRef.current = monaco;
                  
                  editor.onDidChangeModelContent((e) => {
                     if (e.isFlush || isSwappingModelRef.current) return;
                     if (!isAiInjectingRef.current && !isGhostViewRef.current) {
                        let firedSemanticSnapshot = false;

                        for (const change of e.changes) {
                           const changeStart = change.range.startLineNumber;
                           const changeEnd = change.range.endLineNumber;
                           
                           // CLEAR ALL AI BLOCKS ON ANY HUMAN MODIFICATION
                           if (aiBlocksRef.current.length > 0) {
                               aiBlocksRef.current.forEach(b => b.collection.clear());
                               aiBlocksRef.current = [];
                               setRegenPopup(null);
                           }

                           // NEW Inline AI tracking logic
                           const inUI = inlineUIRef.current;
                           if (inUI.type === 'result' && inUI.generatedRange) {
                               const r = inUI.generatedRange;
                               if (changeStart <= r.endLineNumber && changeEnd >= r.startLineNumber) {
                                   if (inUI.decorationCollection) inUI.decorationCollection.clear();
                                   setInlineUI({ type: null });
                               }
                           }

                           // Semantic Capture Check
                           if (!firedSemanticSnapshot) {
                               if (change.text.length > 50 || change.text.includes('\n\n')) {
                                   captureSnapshot('Pasted Code');
                                   firedSemanticSnapshot = true;
                               } else if (change.text === '\n' || change.text === '\r\n') {
                                   captureSnapshot('Line Break');
                                   firedSemanticSnapshot = true;
                               }
                           }
                        }
                     }
                  });
                  
                  editor.onDidChangeCursorSelection((e) => {
                      const st = inlineUIRef.current;
                      if (st.type === 'prompt' || st.type === 'streaming' || st.type === 'result') return;
                      if (!e.selection || e.selection.isEmpty()) {
                          setInlineUI({ type: null });
                          return;
                      }
                      setInlineUI({ type: 'selection', range: e.selection });
                      setTimeout(updateInlinePosition, 0);
                  });

                  editor.onDidScrollChange(() => {
                      updateInlinePosition();
                  });

                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
                      const sel = editor.getSelection();
                      const range = (!sel || sel.isEmpty()) ? editor.getSelection() : sel;
                      setInlineUI({ type: 'prompt', range, promptText: '' });
                      setTimeout(updateInlinePosition, 0);
                  });

                  editor.addCommand(monaco.KeyCode.Escape, () => {
                      if (inlineUIRef.current.type === 'prompt') {
                          setInlineUI({ type: null });
                      }
                  });
                  
                  editor.onMouseDown((e) => {
                    setRegenPopup(null);
                  });
                }}
              />
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                color: 'var(--text-muted)', flexDirection: 'column', gap: 24
              }}>
                <FileCode2 size={80} style={{ opacity: .2 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, opacity: .4 }}>Workspace Offline</h2>
                <p style={{ fontSize: 12, opacity: .5, maxWidth: 300, textAlign: 'center' }}>
                  Select a document from the Explorer to start editing.
                </p>
              </div>
            )}

            {/* INLINE AI OVERLAYS */}
            {inlineUIState.type === 'selection' && (
               <button 
                  onClick={() => setInlineUI({ type: 'prompt', promptText: '' })}
                  className="animate-fade-in"
                  style={{
                     position: 'absolute', top: inlineUIState.y, left: inlineUIState.x, zIndex: 50,
                     background: 'var(--bg-primary-solid)', color: '#fff', border: '1px solid var(--border)',
                     padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                     display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                     whiteSpace: 'nowrap'
                  }}>
                  <Sparkles size={12} /> Edit (Ctrl+K)
               </button>
            )}

            {inlineUIState.type === 'prompt' && (
               <div 
                  className="animate-fade-in"
                  style={{
                     position: 'absolute', top: inlineUIState.y, left: inlineUIState.x, zIndex: 60,
                     background: 'var(--bg-input)', border: '1px solid var(--accent)', borderRadius: 8,
                     padding: 8, display: 'flex', alignItems: 'center', gap: 8,
                     boxShadow: '0 8px 30px rgba(0,0,0,0.5), 0 0 0 4px rgba(168,85,247,0.1)', minWidth: 350
                  }}>
                  <Sparkles size={16} color="var(--accent)" />
                  <input 
                     autoFocus
                     placeholder="Explain what to generate below selection..."
                     value={inlineUIState.promptText}
                     onChange={(e) => setInlineUI({ promptText: e.target.value })}
                     onKeyDown={(e) => {
                         if (e.key === 'Enter') handleInlineExecute();
                     }}
                     style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit'
                     }}
                  />
                  <button onClick={handleInlineExecute} disabled={!inlineUIState.promptText.trim()} style={{
                     background: 'var(--bg-primary-solid)', padding: '6px 10px', borderRadius: 6, color: '#fff', cursor: 'pointer', opacity: !inlineUIState.promptText.trim() ? 0.5 : 1, border: 'none', fontWeight: 600, fontSize: 11
                  }}>Submit ⏎</button>
               </div>
            )}

            {inlineUIState.type === 'streaming' && (
               <div 
                  style={{
                     position: 'absolute', top: inlineUIState.y, left: inlineUIState.x, zIndex: 60,
                     background: 'var(--bg-primary-light)', color: 'var(--accent)', border: '1px solid var(--accent-glow)', borderRadius: 20,
                     padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                     fontSize: 12, fontWeight: 700
                  }}>
                  <RefreshCw size={14} className="animate-spin" /> Generating...
               </div>
            )}

            {inlineUIState.type === 'result' && (
               <div 
                  className="animate-fade-in"
                  style={{
                     position: 'absolute', top: inlineUIState.y, left: inlineUIState.x, zIndex: 60,
                     background: 'var(--bg-panel)', border: '1px solid var(--border-primary)', borderRadius: 8,
                     display: 'flex', alignItems: 'center', padding: 4, gap: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                  }}>
                  <button onClick={handleInlineAccept} style={{ background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                     <Check size={14} /> Accept
                  </button>
                  <button onClick={handleInlineReject} style={{ background: 'transparent', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                     <X size={14} /> Reject
                  </button>
                  <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
                  <button onClick={handleInlineExecute} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                     <RefreshCw size={14} /> Regenerate
                  </button>
               </div>
            )}
          </div>

          <Terminal
            messages={terminalMessages}
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
            onSendMessage={handleSendTerminalMessage}
            onClearTerminal={handleClearTerminal}
          />

        </section>

        {/* AI Panel */}
        <AIPanel
          language={language} onAccept={handleAcceptAI} onInjectStream={handleInjectStream}
          getEditorCode={getEditorCode} isOpen={showAI} onClose={() => setShowAI(false)}
        />

        {/* AI Regen Popup */}
        {regenPopup && (
          <div style={{
            position: 'fixed', left: regenPopup.x + 15, top: regenPopup.y + 15, zIndex: 9999,
            background: 'var(--bg-panel)', padding: 12, borderRadius: 12, border: '1px solid var(--border-primary)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>AI-Generated Code</p>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', background: 'var(--bg-input)', padding: 8, borderRadius: 6, fontStyle: 'italic', marginBottom: 4 }} className="truncate">
              "{regenPopup.prompt}"
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
               <button 
                 onClick={() => handleRegenBlock(regenPopup.id)}
                 style={{
                    flex: 1, background: 'var(--bg-primary-light)', color: 'var(--accent)', border: '1px solid var(--accent-glow)',
                    padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                 }}>
                 <RefreshCw size={14} /> Regenerate
               </button>
               <button 
                 onClick={() => setRegenPopup(null)}
                 style={{
                    padding: '8px 12px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', 
                    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}>
                 <X size={14} />
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Timeline (bottom of screen) */}
      {collabRef.current?.ydoc && (
          <Timeline
            historyArray={collabRef.current.ydoc.getArray(`${currentFile}-history`)}
            currentFile={currentFile}
            userName={userName}
            userColor={users.find(u => u.name === userName)?.color || 'var(--accent)'}
            isGhostView={isGhostView}
            activeNodeId={activeNodeId}
            onManualKeyframe={() => captureSnapshot('Manual Keyframe')}
            onSelectNode={(node) => {
                isSwappingModelRef.current = true;
                if (!node) {
                    isGhostViewRef.current = false;
                    setIsGhostView(false);
                    setActiveNodeId(null);
                    setGhostText(null);
                } else {
                    isGhostViewRef.current = true;
                    setIsGhostView(true);
                    setActiveNodeId(node.id);
                    setGhostText(node.text);
                }
                setTimeout(() => { isSwappingModelRef.current = false; }, 100);
            }}
          />
      )}
    </div>
  );
}
