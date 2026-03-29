"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Settings, Play, Users, Terminal, Code, Sparkles, Loader2, Files, Plus, FileCode2, Sun, Moon, Send, X, ChevronUp, ChevronDown, Palette, Star, Trash2, RotateCcw } from "lucide-react";

const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then((mod) => mod.CodeEditor),
  { ssr: false }
);

export default function EditorWorkspace() {
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userColor] = useState(() => ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"][Math.floor(Math.random() * 7)]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // VFS (Virtual File System) States
  const [files, setFiles] = useState<{ name: string, lang: string }[]>([
    { name: "main.js", lang: "javascript" },
    { name: "structura.cpp", lang: "cpp" }
  ]);
  const [favoriteFiles, setFavoriteFiles] = useState<string[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<{ name: string, lang: string }[]>([]);
  const [activeFile, setActiveFile] = useState("main.js");
  const currentLang = files.find(f => f.name === activeFile)?.lang || "javascript";

  const [output, setOutput] = useState<string>("> iTECify System online...\n> Waiting for manual execution (Run Code) or AI assistance...");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<"files" | "users" | "settings" | "theme" | "favorites" | "trash">("files");

  // AI Assistant Layout State
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPendingSuggestion, setAiPendingSuggestion] = useState<string | null>(null);

  // Terminal Drawer State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Customization State
  const [themeHue, setThemeHue] = useState(0);
  const [editorFont, setEditorFont] = useState("'Fira Code', 'JetBrains Mono', 'Consolas', monospace");

  const editorRef = useRef<any>(null);

  const t = isDarkMode ? {
    app: "bg-[#322A42] text-purple-50",
    header: "bg-[#322A42]/90 border-purple-400/20",
    sidebarIcon: "bg-gradient-to-b from-[#322A42] to-[#282136] border-purple-400/20 shadow-[5px_0_30px_rgba(0,0,0,0.2)]",
    sidebarMenu: "bg-[#282136] border-purple-400/20",
    panelBg: "bg-[#282136] border-purple-400/20",
    input: "bg-[#1E182A] border-purple-400/30 text-purple-50 placeholder:text-purple-300/60",
    border: "border-purple-400/20",
    glass: "bg-[#282136]/70",
    terminalBg: "bg-[#1E182A] border-purple-400/30",
    cardHover: "hover:bg-purple-400/20 text-purple-200",
    textMuted: "text-purple-200/60",
    monacoTheme: "vs-dark",
    buttonAccent: "bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/30",
    activeText: "text-purple-300",
    select: "bg-[#1E182A] text-purple-100 border-purple-400/30 hover:bg-[#282136]",
    glow: "bg-gradient-to-r from-purple-600 to-indigo-600",
    tcPrimary: "text-purple-400",
    bgPrimaryLight: "bg-purple-500/10",
    bgPrimarySolid: "bg-purple-500",
    borderPrimary: "border-purple-500/20",
    focusRing: "focus:border-purple-500 focus:ring-purple-500"
  } : {
    app: "bg-[#f4f0f7] text-gray-800",
    header: "bg-[#f4f0f7]/80 border-purple-200",
    sidebarIcon: "bg-gradient-to-b from-[#f4f0f7] to-[#eaddf5] border-purple-200",
    sidebarMenu: "bg-[#eaddf5] border-purple-200",
    panelBg: "bg-[#eaddf5] border-purple-200",
    input: "bg-[#ffffff] border-purple-200 text-purple-900 placeholder:text-purple-400",
    border: "border-purple-200",
    glass: "bg-white/60",
    terminalBg: "bg-[#ffffff] border-purple-200",
    cardHover: "hover:bg-purple-500/10 text-purple-800",
    textMuted: "text-purple-800/60",
    monacoTheme: "light",
    buttonAccent: "bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]",
    activeText: "text-purple-700",
    select: "bg-[#ffffff] text-purple-800 border-purple-300 hover:bg-[#f8f5fb]",
    glow: "bg-gradient-to-r from-purple-300 to-indigo-300",
    tcPrimary: "text-purple-600",
    bgPrimaryLight: "bg-purple-500/10",
    bgPrimarySolid: "bg-purple-500",
    borderPrimary: "border-purple-500/20",
    focusRing: "focus:border-purple-500 focus:ring-purple-500"
  };

  const shape = {
    radius: "rounded-2xl",
    radiusBtn: "rounded-xl",
    radiusAvatar: "rounded-full",
    borderBase: "border",
    shadow: `shadow-[0_0_30px_rgba(var(--tw-shadow-color),0.15)]`,
    shadowExtreme: "shadow-[0_0_50px_rgba(0,0,0,0.2)]",
    backdrop: "backdrop-blur-3xl",
  };

  const handleAddFile = () => {
    const filename = prompt("Enter new file name (ex: app.py, script.ts, index.html):");
    if (!filename || filename.trim() === "") return;

    // Anticipează dacă un utilizator creează un fișier care se afla deja in Trash și omoară eroarea
    if (deletedFiles.some(f => f.name === filename) || files.some(f => f.name === filename)) {
      alert("A file with this name already exists in active memory or the Recycle Bin!");
      return;
    }

    let ext = filename.split('.').pop() || "js";
    const extToLang: Record<string, string> = { "js": "javascript", "ts": "typescript", "py": "python", "cpp": "cpp", "c": "cpp", "css": "css", "html": "html", "json": "json" };

    setFiles([...files, { name: filename, lang: extToLang[ext] || "javascript" }]);
    setActiveFile(filename);
  };

  // VFS Deletion Subroutines
  const handleToggleFavorite = (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    if (favoriteFiles.includes(filename)) {
      setFavoriteFiles(favoriteFiles.filter(f => f !== filename));
    } else {
      setFavoriteFiles([...favoriteFiles, filename]);
    }
  };

  const handleDeleteFile = (e: React.MouseEvent, file: { name: string, lang: string }) => {
    e.stopPropagation();
    setDeletedFiles([...deletedFiles, file]);
    setFiles(files.filter(f => f.name !== file.name));
    setFavoriteFiles(favoriteFiles.filter(f => f !== file.name));

    // Fallback: If deleting the currently opened tab, jump gracefully to another one or to absolute Zero
    if (activeFile === file.name) {
      const remaining = files.filter(f => f.name !== file.name);
      setActiveFile(remaining.length > 0 ? remaining[0].name : "");
    }
  };

  const handleRestoreFile = (e: React.MouseEvent, file: { name: string, lang: string }) => {
    e.stopPropagation();
    setFiles([...files, file]);
    setDeletedFiles(deletedFiles.filter(f => f.name !== file.name));
    setActiveFile(file.name);
  };

  const handleRunCode = async () => {
    if (!editorRef.current || !activeFile) {
      setOutput("> [System Error]: No active file logic bound for Sandbox execution.");
      setIsTerminalOpen(true);
      return;
    }
    const sourceCode = editorRef.current.getValue();

    setIsExecuting(true);
    setOutput((prev) => prev + `\n\n> ⚠️ Executing file '${activeFile}' in Sandbox...`);
    setIsTerminalOpen(true);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: currentLang, sourceCode }),
      });
      const data = await res.json();
      setOutput((prev) => prev + `\n[Terminal Output]:\n${data.output}`);
    } catch (err) {
      setOutput((prev) => prev + "\n[CRITICAL Error]: Cannot bind to Node Sandbox.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAskAI = async () => {
    if (!editorRef.current || !aiPrompt.trim() || !activeFile) return;
    const code = editorRef.current.getValue();

    setIsAiThinking(true);
    setAiPendingSuggestion(null);
    setOutput((prev) => prev + `\n\n> 🧠 iTECify AI evaluating '${activeFile}'. Request: "${aiPrompt}"...`);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, code, language: currentLang }),
      });
      const data = await res.json();

      setOutput((prev) => prev + `\n\n=== 👑 AI RESPONSE ===:\nGenerated suggestion ready for review.`);

      let cleanSuggestion = data.suggestion;
      const codeBlockRegex = /```[a-zA-Z]*\n([\s\S]*?)```/;
      const match = data.suggestion.match(codeBlockRegex);

      if (match && match[1]) {
        cleanSuggestion = match[1].trim();
      } else {
        cleanSuggestion = data.suggestion.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();
      }

      setAiPendingSuggestion(cleanSuggestion);
    } catch (err) {
      setOutput((prev) => prev + "\n\n[Terminal Error]: AI Engine unreachable.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleAcceptAi = () => {
    if (editorRef.current?.insertAtCursor && aiPendingSuggestion) {
      const formattedOutput = `\n/* --- iTECify AI Solution ---\n${aiPendingSuggestion}\n--- End AI --- */\n`;
      editorRef.current.insertAtCursor(formattedOutput);
      setOutput((prev) => prev + `\n> 🟢 AI Suggestion accepted and injected into '${activeFile}'.`);
    }
    setAiPendingSuggestion(null);
    setAiPrompt("");
  };

  const handleDenyAi = () => {
    setAiPendingSuggestion(null);
    setOutput((prev) => prev + `\n> 🔴 AI Suggestion rejected.`);
  };

  if (!isJoined) {
    return (
      <div
        className={`flex h-screen w-screen items-center justify-center transition-colors duration-700 ${t.app} relative overflow-hidden`}
        style={{ filter: `hue-rotate(${themeHue}deg)` }}
      >
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] ${t.glow} blur-[150px] rounded-full opacity-30`}></div>

        <div className={`p-10 ${shape.radius} ${t.glass} ${shape.borderBase} ${t.border} ${shape.shadowExtreme} ${shape.backdrop} w-[420px] z-10 relative transition-all duration-700 ${t.tcPrimary}`}>
          <div className={`w-12 h-12 ${t.input} flex items-center justify-center ${shape.radiusBtn} mb-8 ${shape.borderBase} ${t.border} shadow-inner`}>
            <Users className={`w-6 h-6 ${t.tcPrimary}`} />
          </div>

          <h1 className={`text-3xl font-extrabold mb-3 tracking-tight bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent`}>Enter your name</h1>
          <p className={`text-xs ${t.textMuted} mb-8 leading-relaxed font-medium transition-colors`}>Connect to the network with a name to receive an automatic vibrant P2P visual identifier.</p>

          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (!username.trim()) setUsername(`Dev-${Math.floor(Math.random() * 100)}`);
                setIsJoined(true);
              }
            }}
            placeholder="Ex: John Doe"
            className={`w-full ${t.input} ${shape.borderBase} ${shape.radiusBtn} px-5 py-4 mb-6 ${t.focusRing} outline-none transition-all font-medium text-sm`}
            autoFocus
          />

          <button
            onClick={() => {
              if (!username.trim()) setUsername(`Dev-${Math.floor(Math.random() * 100)}`);
              setIsJoined(true);
            }}
            className={`w-full ${t.buttonAccent} font-bold py-4 ${shape.radiusBtn} transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0`}
          >
            Confirm Name <Play className="w-3 h-3 fill-white" />
          </button>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute top-6 right-6 p-4 ${shape.radiusAvatar} transition-all ${shape.borderBase} ${shape.shadowExtreme} ${isDarkMode ? `${t.tcPrimary} ${t.borderPrimary} hover:${t.bgPrimaryLight} bg-[#1e1a29]` : `${t.tcPrimary} ${t.borderPrimary} hover:bg-stone-200 bg-white`}`}
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden transition-colors duration-700 ${t.app}`}
      style={{ filter: `hue-rotate(${themeHue}deg)` }}
    >
      <header className={`flex items-center justify-between h-[60px] px-6 border-b transition-all duration-700 ${t.header} ${shape.backdrop} z-20 shadow-sm ${shape.borderBase === 'border-2' && 'border-b-2'}`}>
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-8 h-8 ${shape.radiusBtn} ${t.bgPrimaryLight} ${shape.borderBase} ${t.borderPrimary}`}>
            <Code className={`w-4 h-4 ${t.tcPrimary}`} />
          </div>
          <span className={`font-extrabold tracking-tight text-sm hidden sm:inline ${t.tcPrimary}`}>iTECify <span className="opacity-50 font-normal">Workspace</span></span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex -space-x-2">
            {onlineUsers.map((u, i) => (
              <div key={i} title={`${u.name} (Online)`} style={{ backgroundColor: u.color }} className={`w-8 h-8 ${shape.radiusAvatar} border-[3px] ${isDarkMode ? 'border-[#1e1a29]' : 'border-[#f4f0f7]'} flex items-center justify-center text-[10px] font-bold text-white shadow-lg z-10 transition-transform hover:scale-110 cursor-help ring-1 ${t.borderPrimary}`}>
                {u.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>

          <div className={`h-5 w-[1px] ${t.border}`}></div>

          <select
            value={currentLang}
            onChange={(e) => setFiles(files.map(f => f.name === activeFile ? { ...f, lang: e.target.value } : f))}
            className={`${t.select} text-xs ${shape.borderBase} ${shape.radiusBtn} px-3 py-2 outline-none transition-colors duration-500 cursor-pointer shadow-sm font-bold`}
            disabled={!activeFile}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 ${shape.radiusBtn} transition-all ${shape.borderBase} ${isDarkMode ? `${t.borderPrimary} ${t.tcPrimary} hover:${t.bgPrimaryLight}` : `${t.borderPrimary} text-indigo-700 hover:bg-stone-300`}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
            disabled={!activeFile}
            className={`group flex items-center gap-2 ${t.cardHover} ${shape.borderBase} ${t.borderPrimary} text-[13px] font-bold px-4 py-2 ${shape.radiusBtn} transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-30 ${isAiSidebarOpen ? `${t.bgPrimaryLight} ring-1 ${t.borderPrimary}` : ''}`}
          >
            <Sparkles className={`w-3.5 h-3.5 group-hover:animate-pulse ${t.tcPrimary}`} />
            <span className="hidden lg:inline">AI Assistant</span>
            <span className="lg:hidden">AI</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isExecuting || !activeFile}
            className={`flex items-center gap-2 ${t.buttonAccent} text-[13px] font-bold px-5 py-2 ${shape.radiusBtn} transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50`}
          >
            {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span className="hidden lg:inline">Run Code</span>
            <span className="lg:hidden">Run</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <nav className={`w-16 border-r ${shape.borderBase === 'border-2' && 'border-r-2'} transition-colors duration-700 ${t.sidebarIcon} ${shape.shadowExtreme} flex flex-col items-center py-6 gap-6 z-10 shrink-0`}>
          <button
            onClick={() => setActiveSidebar("files")}
            className={`p-3 ${shape.radiusBtn} transition-all duration-300 relative ${activeSidebar === "files" ? `${t.activeText} ${t.bgPrimaryLight} shadow-[0_0_15px_currentColor]` : `${t.textMuted} hover:${t.tcPrimary} hover:${t.bgPrimaryLight}`}`}
            title="Files"
          >
            <Files className="w-[22px] h-[22px]" />
            {activeSidebar === "files" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${t.bgPrimarySolid} rounded-r-full`}></div>}
          </button>

          <button
            onClick={() => setActiveSidebar("favorites")}
            className={`p-3 ${shape.radiusBtn} transition-all duration-300 relative ${activeSidebar === "favorites" ? `${t.activeText} ${t.bgPrimaryLight} shadow-[0_0_15px_currentColor]` : `${t.textMuted} hover:text-yellow-400 hover:bg-yellow-400/10`}`}
            title="Favorite Documents"
          >
            <Star className="w-[22px] h-[22px] fill-transparent" />
            {favoriteFiles.length > 0 && <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>}
            {activeSidebar === "favorites" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${t.bgPrimarySolid} rounded-r-full`}></div>}
          </button>

          <div className="relative">
            <button
              onClick={() => setActiveSidebar("users")}
              className={`p-3 ${shape.radiusBtn} transition-all duration-300 relative ${activeSidebar === "users" ? `${t.activeText} ${t.bgPrimaryLight} shadow-[0_0_15px_currentColor]` : `${t.textMuted} hover:${t.tcPrimary} hover:${t.bgPrimaryLight}`}`}
              title="Active Members"
            >
              <Users className="w-[22px] h-[22px]" />
              {activeSidebar === "users" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${t.bgPrimarySolid} rounded-r-full`}></div>}
            </button>
            {onlineUsers.length > 0 && <span className={`absolute -top-1 -right-1 ${t.bgPrimarySolid} text-white text-[9px] w-[18px] h-[18px] ${shape.radiusAvatar} flex justify-center items-center font-bold shadow-md`}>{onlineUsers.length}</span>}
          </div>

          <div className="flex-1"></div>

          <button
            onClick={() => setActiveSidebar("trash")}
            className={`p-3 ${shape.radiusBtn} transition-all duration-300 relative ${activeSidebar === "trash" ? `text-red-400 bg-red-500/10 shadow-[0_0_15px_currentColor]` : `${t.textMuted} hover:text-red-400 hover:bg-red-500/10`}`}
            title="Recently Deleted (Recycle Bin)"
          >
            <Trash2 className="w-[22px] h-[22px]" />
            {deletedFiles.length > 0 && <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-red-400"></div>}
            {activeSidebar === "trash" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full`}></div>}
          </button>

          <button
            onClick={() => setActiveSidebar("theme")}
            className={`p-3 ${shape.radiusBtn} transition-all duration-300 relative ${activeSidebar === "theme" ? `${t.activeText} ${t.bgPrimaryLight} shadow-[0_0_15px_currentColor]` : `${t.textMuted} hover:${t.tcPrimary} hover:${t.bgPrimaryLight}`}`}
            title="Workspace Theming"
          >
            <Palette className="w-[22px] h-[22px]" />
            {activeSidebar === "theme" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${t.bgPrimarySolid} rounded-r-full`}></div>}
          </button>

          <button
            onClick={() => setActiveSidebar("settings")}
            className={`p-3 ${shape.radiusBtn} transition-all duration-300 relative ${activeSidebar === "settings" ? `${t.activeText} ${t.bgPrimaryLight} shadow-[0_0_15px_currentColor]` : `${t.textMuted} hover:${t.tcPrimary} hover:${t.bgPrimaryLight}`}`}
            title="Ecosystem Settings"
          >
            <Settings className="w-[22px] h-[22px]" />
            {activeSidebar === "settings" && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 ${t.bgPrimarySolid} rounded-r-full`}></div>}
          </button>
        </nav>

        <aside className={`w-72 border-r transition-colors duration-700 ${t.sidebarMenu} hidden md:flex flex-col shrink-0 z-0`}>
          <div className={`p-5 border-b ${t.borderPrimary} text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 ${t.bgPrimaryLight}`}>
            {activeSidebar === "files" && <><Files className={`w-3.5 h-3.5 ${t.tcPrimary}`} /> Session Explorer</>}
            {activeSidebar === "favorites" && <><Star className={`w-3.5 h-3.5 text-yellow-400`} /> Favorite Documents</>}
            {activeSidebar === "trash" && <><Trash2 className={`w-3.5 h-3.5 text-red-400`} /> Recycle Bin</>}
            {activeSidebar === "users" && <><Users className={`w-3.5 h-3.5 ${t.tcPrimary}`} /> Active Collaborators</>}
            {activeSidebar === "theme" && <><Palette className={`w-3.5 h-3.5 ${t.tcPrimary}`} /> Workspace Theming</>}
            {activeSidebar === "settings" && <><Settings className={`w-3.5 h-3.5 ${t.tcPrimary}`} /> Ecosystem Settings</>}
          </div>

          <div className="p-4 flex-1 overflow-auto custom-scrollbar">
            {activeSidebar === "users" && (
              <ul className="space-y-2">
                {onlineUsers.map((u, i) => (
                  <li key={i} className={`flex items-center gap-3 text-[13px] font-medium p-2.5 ${shape.radiusBtn} transition-colors border border-transparent ${t.cardHover}`}>
                    <div className="relative">
                      <div style={{ backgroundColor: u.color }} className={`w-7 h-7 ${shape.radiusBtn} flex items-center justify-center text-white text-[10px] font-black shadow-lg`}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 ${shape.radiusAvatar} bg-green-500 border-2 ${isDarkMode ? 'border-[#15121e]' : 'border-[#e0d6ed]'}`}></span>
                    </div>
                    <span className="truncate">{u.name} {u.name === username && <span className="text-[10px] opacity-50 font-bold ml-1">(You)</span>}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeSidebar === "files" && (
              <div className="text-[13px] font-medium space-y-1.5 flex flex-col">
                {files.length === 0 && <span className={`text-[11px] uppercase tracking-widest text-center mt-5 ${t.textMuted}`}>No Documents Available</span>}
                {files.map((f, i) => {
                  const isFaved = favoriteFiles.includes(f.name);
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveFile(f.name)}
                      className={`group flex items-center justify-between cursor-pointer p-2.5 ${shape.radiusBtn} transition-all ${activeFile === f.name ? `${t.activeText} ${t.bgPrimaryLight} shadow-sm ${shape.borderBase} ${t.borderPrimary}` : `${t.textMuted} border-transparent ${t.cardHover}`}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileCode2 className={`w-4 h-4 shrink-0 ${activeFile === f.name ? t.tcPrimary : "opacity-60"}`} />
                        <span className="truncate">{f.name}</span>
                      </div>

                      <div className={`flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${activeFile === f.name ? 'opacity-100' : ''}`}>
                        <button
                          onClick={(e) => handleToggleFavorite(e, f.name)}
                          className="p-1.5 rounded bg-black/10 hover:bg-black/20 transition-all focus:outline-none"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFaved ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400 hover:fill-yellow-400/20'}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFile(e, f)}
                          className="p-1.5 rounded bg-black/10 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-all focus:outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button onClick={handleAddFile} className={`mt-6 w-full cursor-pointer flex items-center justify-center gap-2 text-xs font-bold transition-all ${shape.radiusBtn} p-3 border border-dashed ${t.borderPrimary} hover:border-current ${t.textMuted} ${t.cardHover}`}>
                  <Plus className="w-3.5 h-3.5" /> New File
                </button>
              </div>
            )}

            {activeSidebar === "favorites" && (
              <div className="text-[13px] font-medium space-y-1.5">
                {favoriteFiles.length === 0 && <span className={`text-[11px] uppercase tracking-widest text-center mt-5 block ${t.textMuted}`}>No Favorites Pinned</span>}
                {files.filter(f => favoriteFiles.includes(f.name)).map((f, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveFile(f.name)}
                    className={`group flex items-center justify-between cursor-pointer p-2.5 ${shape.radiusBtn} transition-all ${activeFile === f.name ? `text-yellow-500 bg-yellow-400/10 shadow-sm ${shape.borderBase} border-yellow-400/20` : `${t.textMuted} border-transparent hover:bg-yellow-400/10 hover:text-yellow-300`}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Star className={`w-4 h-4 shrink-0 fill-yellow-400 text-yellow-400`} />
                      <span className="truncate">{f.name}</span>
                    </div>

                    <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <button
                        onClick={(e) => handleToggleFavorite(e, f.name)}
                        title="Unpin Favorite"
                        className="p-1.5 rounded text-gray-400 hover:bg-black/20 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSidebar === "trash" && (
              <div className="text-[13px] font-medium space-y-1.5 flex flex-col">
                {deletedFiles.length === 0 && <span className={`text-[11px] uppercase tracking-widest text-center mt-5 ${t.textMuted}`}>Recycle Bin is Empty</span>}
                {deletedFiles.map((f, i) => (
                  <div
                    key={i}
                    className={`group flex items-center justify-between p-2.5 ${shape.radiusBtn} transition-all bg-red-500/5 text-red-300/60 border border-red-500/10`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden line-through">
                      <FileCode2 className={`w-4 h-4 shrink-0 opacity-50`} />
                      <span className="truncate">{f.name}</span>
                    </div>

                    <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-all`}>
                      <button
                        onClick={(e) => handleRestoreFile(e, f)}
                        title="Restore Document"
                        className="p-1.5 rounded bg-black/20 text-green-400 hover:bg-green-500 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSidebar === "theme" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-3">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted} flex justify-between`}>
                    Interface Accent <span>{themeHue}°</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="range"
                      min="0" max="360"
                      value={themeHue}
                      onChange={(e) => setThemeHue(Number(e.target.value))}
                      className={`w-full h-2 ${shape.radiusAvatar} appearance-none cursor-pointer outline-none shadow-inner`}
                      style={{ background: 'linear-gradient(to right, #f43f5e, #eab308, #22c55e, #06b6d4, #3b82f6, #d946ef, #f43f5e)' }}
                    />
                  </div>
                  <p className={`text-[10.5px] font-medium leading-relaxed mt-1 ${t.textMuted}`}>Drag the slider to dynamically hue-rotate the overall interface elements uniformly in real-time.</p>
                </div>

                <div className={`flex flex-col gap-2 pt-5 border-t ${t.border}`}>
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Editor Typography</label>
                  <select
                    value={editorFont}
                    onChange={(e) => setEditorFont(e.target.value)}
                    className={`${t.select} text-xs ${shape.borderBase} ${shape.radiusBtn} ${t.borderPrimary} px-3 py-2.5 outline-none transition-colors duration-500 cursor-pointer shadow-sm font-bold w-full`}
                  >
                    <option value="'Fira Code', 'JetBrains Mono', 'Consolas', monospace">Standard (Fira Code)</option>
                    <option value="'Courier New', Courier, monospace">Courier (Classic type)</option>
                    <option value="'Monaco', monospace">Monaco (Mac OSX)</option>
                    <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans (Fun Hack)</option>
                  </select>
                </div>
              </div>
            )}

            {activeSidebar === "settings" && (
              <div className="text-sm">
                <div className={`${t.input} ${shape.radiusBtn} p-4 text-[11px] font-medium space-y-3 shadow-inner ${shape.borderBase} transition-colors duration-700`}>
                  <p className="flex flex-col gap-1"><span className={t.textMuted}>Execution Engine:</span><span className={`${t.tcPrimary} font-bold`}>Wandbox Cloud API</span></p>
                  <p className="flex flex-col gap-1"><span className={t.textMuted}>AI Co-pilot Brain:</span><span className={`${t.tcPrimary} font-bold`}>Gemini 2.5 Flash</span></p>
                  <p className="flex flex-col gap-1"><span className={t.textMuted}>Network Protocols:</span><span className={`${t.tcPrimary} font-bold`}>Y-Websocket Relay</span></p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className={`flex-1 flex flex-col p-4 pb-0 transition-colors duration-700 ${t.panelBg} min-w-0 relative`}>

          {!activeFile ? (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${t.textMuted} transition-all`}>
              <FileCode2 className={`w-20 h-20 mb-6 opacity-20`} />
              <h2 className="text-xl font-bold text-white/40 tracking-tight">Workspace Offline</h2>
              <p className="text-xs font-medium mt-2 max-w-[300px] text-center">There are no files actively opened in the IDE viewport. Select a document from the <span className="text-purple-300">Explorer</span> or restore one from <span className="text-red-300">Recycle Bin</span> to resume compilation.</p>
            </div>
          ) : (
            <div className="flex">
              <div className={`${t.terminalBg} border-b-0 ${t.tcPrimary} text-xs font-mono font-medium px-5 py-2.5 rounded-t-xl ${shape.borderBase} flex items-center gap-3 transition-all duration-700 z-10`}>
                <FileCode2 className="w-3.5 h-3.5" /> {activeFile}
              </div>
            </div>
          )}

          <div className={`flex-1 overflow-hidden transition-all duration-700 relative ${t.terminalBg} ${shape.shadow} ${shape.borderBase} rounded-b-xl rounded-tr-xl z-0 ${!activeFile && 'opacity-0 pointer-events-none'}`}>
            {activeFile && (
              <CodeEditor
                key={activeFile}
                editorRef={editorRef}
                language={currentLang}
                roomName={`file-${activeFile.replace('.', '-')}`}
                username={username}
                userColor={userColor}
                onUsersChange={setOnlineUsers}
                theme={t.monacoTheme}
                fontFamily={editorFont}
              />
            )}
          </div>

          <div className={`mt-4 rounded-t-xl ${shape.borderBase} border-b-0 shadow-[0_0._-10px_40px_-5px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${t.terminalBg} flex flex-col relative overflow-hidden z-10 ${isTerminalOpen ? 'h-[250px]' : 'h-[38px]'} ${!activeFile && 'opacity-0 pointer-events-none'}`}>
            <div className={`absolute top-0 inset-x-0 h-px ${t.glow}`}></div>

            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={`w-full flex items-center justify-between gap-2 ${t.bgPrimaryLight} hover:bg-opacity-50 py-2.5 px-4 border-b ${t.borderPrimary} cursor-pointer h-[38px] shrink-0 outline-none group`}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <div className={`w-2.5 h-2.5 ${shape.radiusAvatar} bg-red-400/80 group-hover:bg-red-400 transition-colors`}></div>
                  <div className={`w-2.5 h-2.5 ${shape.radiusAvatar} bg-amber-400/80 group-hover:bg-amber-400 transition-colors`}></div>
                  <div className={`w-2.5 h-2.5 ${shape.radiusAvatar} bg-green-400/80 group-hover:bg-green-400 transition-colors`}></div>
                </div>
                <span className={`tracking-widest text-[10px] font-black uppercase ${t.textMuted} group-hover:${t.tcPrimary} transition-colors`}>Console Output / System Logs</span>
              </div>
              <div className={`${t.textMuted} group-hover:${t.tcPrimary} transition-colors`}>
                {isTerminalOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </button>

            <div className={`flex-1 overflow-auto p-4 ${t.tcPrimary} whitespace-pre-wrap leading-relaxed custom-scrollbar text-[13px] font-mono transition-opacity duration-300 ${isTerminalOpen ? 'opacity-100' : 'opacity-0'}`}>
              {output}
            </div>
          </div>
        </section>

        <aside className={`transition-none duration-0 sm:transition-all sm:duration-500 ${t.sidebarMenu} flex flex-col z-10 shrink-0 ${isAiSidebarOpen ? `w-full sm:w-[350px] border-l ${t.borderPrimary}` : 'w-0 border-l-0 overflow-hidden'}`}>
          <div className={`p-5 border-b ${t.borderPrimary} text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-between gap-2 ${t.bgPrimaryLight}`}>
            <div className={`flex items-center gap-2 ${t.tcPrimary}`}>
              <Sparkles className="w-3.5 h-3.5" /> iTECify AI Co-Pilot
            </div>
            <button onClick={() => setIsAiSidebarOpen(false)} className={`p-1.5 ${shape.radiusBtn} transition-colors hover:${t.bgPrimaryLight} ${t.textMuted}`}><X className="w-4 h-4" /></button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${t.textMuted} flex items-center gap-2`}><Send className="w-3 h-3" /> Your Prompt</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isAiThinking || aiPendingSuggestion !== null}
                  placeholder="Explain what you want to generate, refactor, or fix..."
                  className={`w-full ${t.input} ${shape.borderBase} ${shape.radiusBtn} p-4 ${t.focusRing} outline-none transition-all text-[13px] min-h-[140px] resize-none whitespace-pre-wrap shadow-inner`}
                />

                <button
                  onClick={handleAskAI}
                  disabled={isAiThinking || !aiPrompt.trim() || aiPendingSuggestion !== null}
                  className={`mt-1 w-full ${t.buttonAccent} font-bold py-3.5 ${shape.radiusBtn} transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0`}
                >
                  {isAiThinking ? <Loader2 className={`w-4 h-4 animate-spin text-white`} /> : <Sparkles className="w-4 h-4" />}
                  {isAiThinking ? 'Analyzing codebase...' : 'Generate AI Code'}
                </button>
              </div>

              {aiPendingSuggestion && (
                <div className="flex flex-col gap-3 mt-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
                  <div className={`h-px w-full ${t.border} mb-2`}></div>

                  <label className={`text-[11px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-2`}>
                    <Code className="w-3 h-3" /> Code Preview
                  </label>

                  <div className={`${t.input} p-4 ${shape.radiusBtn} ${shape.borderBase} text-[12px] font-mono leading-relaxed max-h-[300px] overflow-auto custom-scrollbar shadow-inner text-green-300`}>
                    {aiPendingSuggestion}
                  </div>

                  <p className={`text-[10px] ${t.textMuted} font-medium mt-1`}>By accepting this, the snippet will be directly injected into your active file at your cursor position.</p>

                  <div className="flex gap-3 mt-2">
                    <button onClick={handleDenyAi} className={`flex-1 py-3.5 ${shape.radiusBtn} text-[13px] font-bold ${shape.borderBase} border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors shadow-sm`}>Reject</button>
                    <button onClick={handleAcceptAi} className={`flex-[2] py-3.5 ${shape.radiusBtn} text-[13px] font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5`}>Accept & Inject</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}
