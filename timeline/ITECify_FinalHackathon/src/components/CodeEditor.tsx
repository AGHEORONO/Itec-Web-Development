"use client";

import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  language: string;
  theme?: string;
  roomName: string;
  username: string;
  userColor: string;
  editorRef: any; 
  onUsersChange: (users: any[]) => void;
  fontFamily?: string;
}

export const CodeEditor = ({ language, theme = "vs-dark", roomName, username, userColor, editorRef, onUsersChange, fontFamily }: CodeEditorProps) => {
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [isBindingReady, setIsBindingReady] = useState(false);

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);

    // Secure ref binding. Acum Frontend-ul poate apela sigur butonul Run / AI citind live
    if (editorRef) {
      editorRef.current = {
        getValue: () => editor.getValue(),
        insertAtCursor: (text: string) => {
          const position = editor.getPosition();
          if (position) {
            editor.executeEdits("ai-assistant", [{ 
              range: { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column }, 
              text: text, 
              forceMoveMarkers: true 
            }]);
            editor.pushUndoStop();
          } else {
            editor.setValue(editor.getValue() + "\n" + text);
          }
        }
      };
    }
  };

  useEffect(() => {
    // Așteptăm maparea completă a editorului în React înainte să conectăm serverele Yjs
    if (!editorInstance) return;
    
    // Iniționare motor centralizat (WebSocket Relay)
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "wss://demos.yjs.dev/ws", 
      `itecify-workspace-${roomName}`, 
      ydoc
    );
    
    const yText = ydoc.getText("monaco");
    const awareness = provider.awareness;
    
    awareness.setLocalStateField('user', {
      name: username,
      color: userColor
    });

    const updateUsers = () => {
      const states = Array.from(awareness.getStates().values());
      const users = states.map((s: any) => s.user).filter(Boolean);
      // Sistem de supraviețuire anti-clone: Oprim vizualizarea userilor care se dublează pe rețele proaste 
      const uniqueUsers = Array.from(new Set(users.map(u => JSON.stringify(u)))).map((s: any) => JSON.parse(s));
      onUsersChange(uniqueUsers);
    };

    awareness.on('change', updateUsers);
    updateUsers(); 

    const binding = new MonacoBinding(yText, editorInstance.getModel()!, new Set([editorInstance]), awareness);
    setIsBindingReady(true);

    // CRITICAL FIX: Când se unmount-ează tabul (ex: la schimbarea de fișier), ucidem conexiunile instant:
    return () => {
      binding.destroy();
      provider.disconnect();
      ydoc.destroy();
      setIsBindingReady(false);
    };
  }, [editorInstance, roomName, username, userColor]);

  return (
    <div className="w-full h-full bg-[#0d0d0d] relative">
      {!isBindingReady && (
         <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d0d]/80 text-background animate-pulse font-mono text-sm pointer-events-none transition-opacity">
           <span className="bg-primary px-4 py-2 rounded-full text-primary-foreground shadow-lg tracking-widest uppercase font-bold text-xs ring-2 ring-primary/20">
             Connecting WebSocket: {roomName}...
           </span>
         </div>
      )}
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme={theme}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: fontFamily || "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
          padding: { top: 20, bottom: 20 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          formatOnPaste: true,
          roundedSelection: false,
          scrollBeyondLastLine: false,
        }}
        loading={<div className="flex h-full w-full items-center justify-center text-muted-foreground animate-pulse font-mono text-xs tracking-widest">DOWNLOADING MONACO VS-CODE CORE...</div>}
      />
    </div>
  );
};

export default CodeEditor;
