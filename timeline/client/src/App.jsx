import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import NameModal from './components/NameModal';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import AIPanel from './components/AIPanel';
import Timeline from './components/Timeline';
import { createCollaboration, getConnectedUsers } from './lib/collaboration';
import { executeCode, getAISuggestionStream } from './lib/pistonApi';
import { FileCode2 } from 'lucide-react';

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
  const [userName, setUserName] = useState(null);
  const [roomId] = useState(getOrCreateRoomId);
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [users, setUsers] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');

  // ── Visual States (FinalHackathon) ──
  const [isDark, setIsDark] = useState(true);
  const [themeHue, setThemeHue] = useState(0);
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
  const [activeYtext, setActiveYtext] = useState(null);

  const collabRef = useRef(null);
  const aiCollabRef = useRef(null);
  const editorValueRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const monacoRef = useRef(null);
  const undoManagersRef = useRef(new Map());
  const [activeUndoManager, setActiveUndoManager] = useState(null);

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
    pushTerminalMessage({
      type: 'user',
      author: userName || 'Anonymous',
      text,
      color: collabRef.current?.color || '#38bdf8',
      timestamp: Date.now()
    });
  }, [userName, pushTerminalMessage]);

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
    if (!userName) return;

    const collab = createCollaboration(roomId, userName);
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
      tArray.unobserve(syncMessages);
      collab.provider.off('synced', updateFiles);
      collab.provider.destroy(); collab.ydoc.destroy();
    };
  }, [userName, roomId]);

  // Sync active Y.Text
  useEffect(() => {
    if (!collabRef.current) return;
    const ytext = collabRef.current.filesystem.get(currentFile);
    if (ytext) {
      setActiveYtext(ytext);
      let um = undoManagersRef.current.get(currentFile);
      if (!um) { 
        // extremely high capture timeout so it relies on manual break points
        um = new Y.UndoManager(ytext, { captureTimeout: 3600000 }); 
        undoManagersRef.current.set(currentFile, um); 
      }
      setActiveUndoManager(um);
    }
  }, [currentFile, files]);

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
    handleSelectFile(fileName);
  };

  // Run code
  const handleRun = useCallback(async () => {
    const code = editorValueRef.current || '';
    if (!code.trim()) {
      pushTerminalMessage({ type: 'error', author: 'System', text: 'No code to execute', timestamp: Date.now() });
      setIsTerminalOpen(true);
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
      const result = await executeCode(language, code);
      if (result.stdout) {
        pushTerminalMessage({ type: 'system', author: 'Output', text: result.stdout, timestamp: Date.now() });
      }
      if (result.stderr) {
        pushTerminalMessage({ type: 'error', author: 'Error', text: result.stderr, timestamp: Date.now() });
      }
      if (result.error) {
        pushTerminalMessage({ type: 'error', author: 'Error', text: result.error, timestamp: Date.now() });
      }
      pushTerminalMessage({
        type: 'system', author: 'System',
        text: `⏱ Process exited (${result.time || 0}ms)`,
        timestamp: Date.now()
      });
    } catch (err) {
      pushTerminalMessage({ type: 'error', author: 'Error', text: err.message, timestamp: Date.now() });
    }
    setIsRunning(false);
  }, [language, currentFile, pushTerminalMessage]);

  // Accept AI → Replace via Monaco
  const handleAcceptAI = useCallback((code) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    
    if (activeUndoManager) activeUndoManager.stopCapturing();

    const model = editor.getModel();
    if (!model) return;
    const fullRange = model.getFullModelRange();
    editor.executeEdits('ai-accept', [{ range: fullRange, text: code, forceMoveMarkers: true }]);
    
    if (activeUndoManager) activeUndoManager.stopCapturing();
  }, [activeUndoManager]);

  // Inject Live → Stream into Monaco
  const handleInjectStream = useCallback(async (prompt) => {
    const editor = editorInstanceRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (activeUndoManager) activeUndoManager.stopCapturing();

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

      editor.createDecorationsCollection([{
        range: new monaco.Range(startLine + 1, 1, currentLine, 1),
        options: { isWholeLine: true, className: 'ai-block-bg', linesDecorationsClassName: 'ai-block-margin' }
      }]);

      pushTerminalMessage({
        type: 'ai', author: 'iTECKY Assistant',
        text: '✅ Code injection complete.',
        timestamp: Date.now()
      });
      if (activeUndoManager) activeUndoManager.stopCapturing();
    } catch (err) {
      editor.executeEdits('ai-inject', [{ range: new monaco.Range(currentLine, currentCol, currentLine, currentCol), text: '// Stream Error', forceMoveMarkers: true }]);
      pushTerminalMessage({
        type: 'error', author: 'iTECKY Assistant',
        text: `Stream error: ${err.message}`,
        timestamp: Date.now()
      });
      if (activeUndoManager) activeUndoManager.stopCapturing();
    }
  }, [language, pushTerminalMessage, activeUndoManager]);

  const getEditorCode = useCallback(() => editorValueRef.current || '', []);

  // Show login
  if (!userName) {
    return <NameModal onSubmit={setUserName} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-app)',
      transition: 'background .7s', filter: `hue-rotate(${themeHue}deg)`
    }}>

      {/* Dynamic cursor styles */}
      <style>{users.map(u => `
        .yRemoteSelection-${u.clientId}{background-color:${u.color}40}
        .yRemoteSelectionHead-${u.clientId}{border-color:${u.color}}
        .yRemoteSelectionHead-${u.clientId}::after{content:"${u.name}";background-color:${u.color}}
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
        />

        {/* Editor section */}
        <section style={{
          flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 0',
          background: 'var(--bg-panel)', minWidth: 0, position: 'relative', transition: 'background .7s'
        }}>

          {/* File tab */}
          {currentFile && (
            <div style={{ display: 'flex' }}>
              <div style={{
                background: 'var(--bg-terminal)', color: 'var(--accent)', fontSize: 12, fontFamily: 'monospace', fontWeight: 500,
                padding: '10px 20px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <FileCode2 size={14} /> {currentFile}
              </div>
            </div>
          )}

          {/* Editor */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '0 12px 12px 12px', border: '1px solid var(--border)',
            background: 'var(--bg-terminal)', position: 'relative'
          }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {collabRef.current && activeYtext ? (
                <CodeEditor
                  ytext={activeYtext}
                  awareness={collabRef.current.awareness}
                  language={language}
                  isDark={isDark}
                  fontFamily={editorFont}
                  undoManager={activeUndoManager}
                  onMount={(editor, monaco) => {
                    editorInstanceRef.current = editor;
                    monacoRef.current = monaco;
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
            </div>

            <Timeline 
              undoManager={activeUndoManager} 
              userName={userName} 
              userColor={collabRef.current?.color || 'var(--accent)'} 
            />
          </div>

          {/* Terminal */}
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
      </main>
    </div>
  );
}
