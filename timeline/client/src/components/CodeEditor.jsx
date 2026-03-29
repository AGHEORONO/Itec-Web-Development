import { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { getAutocompletion } from '../lib/pistonApi';

export default function CodeEditor({ ytext, awareness, language, onMount, isDark, fontFamily, undoManager }) {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const bindingRef = useRef(null);
    const providerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [editorLoaded, setEditorLoaded] = useState(false);
    
    // We need to keep track of the latest undoManager for our event listeners 
    // without re-registering them repeatedly on undoManager change.
    const undoManagerRef = useRef(undoManager);
    useEffect(() => {
        undoManagerRef.current = undoManager;
    }, [undoManager]);

    function handleEditorDidMount(editor, monaco) {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Custom dark theme matching the purple palette
        monaco.editor.defineTheme('itecify-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1E182A',
                'editor.lineHighlightBackground': '#282136',
                'editorCursor.foreground': '#c084fc',
                'editor.selectionBackground': '#a855f730',
                'editorLineNumber.foreground': '#6b21a850',
                'editorLineNumber.activeForeground': '#c084fc',
                'editorGhostText.foreground': '#6b21a8aa',
            }
        });
        monaco.editor.defineTheme('itecify-light', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#ffffff',
                'editor.lineHighlightBackground': '#f5f3ff',
                'editorCursor.foreground': '#7c3aed',
                'editor.selectionBackground': '#a855f720',
                'editorGhostText.foreground': '#7c3aed66',
            }
        });

        editor.updateOptions({ theme: isDark ? 'itecify-dark' : 'itecify-light' });

        // Register inline completions provider for all languages
        registerInlineProvider(monaco);

        // --- Custom History Checkpoints ---
        // 1. Break history when user hits Enter (newline)
        editor.onKeyDown((e) => {
            if (e.keyCode === monaco.KeyCode.Enter) {
                if (undoManagerRef.current) undoManagerRef.current.stopCapturing();
            }
        });

        // 2. Break history when user pastes
        const domNode = editor.getContainerDomNode();
        domNode.addEventListener('paste', () => {
            // Stop capturing right before the paste
            if (undoManagerRef.current) undoManagerRef.current.stopCapturing();
            // Stop capturing right after the paste finishes
            setTimeout(() => {
                if (undoManagerRef.current) undoManagerRef.current.stopCapturing();
            }, 50);
        });

        setEditorLoaded(true);
        if (onMount) onMount(editor, monaco);
    }

    // Register the AI inline completions provider (ghost text)
    function registerInlineProvider(monaco) {
        // Dispose previous provider if any
        if (providerRef.current) {
            providerRef.current.dispose();
            providerRef.current = null;
        }

        let debounceTimer = null;
        let lastRequestId = 0;

        providerRef.current = monaco.languages.registerInlineCompletionsProvider('*', {
            provideInlineCompletions: async (model, position, context, token) => {
                // Clear any pending debounce
                if (debounceTimer) clearTimeout(debounceTimer);

                const requestId = ++lastRequestId;

                // Debounce: wait 600ms after last keystroke
                return new Promise((resolve) => {
                    debounceTimer = setTimeout(async () => {
                        // If cancelled or a newer request came in, bail
                        if (token.isCancellationRequested || requestId !== lastRequestId) {
                            return resolve({ items: [] });
                        }

                        const code = model.getValue();
                        const line = position.lineNumber;
                        const col = position.column;
                        const currentLineText = model.getLineContent(line);

                        // Don't autocomplete on empty lines, very short lines, or comments
                        if (currentLineText.trim().length < 2) {
                            return resolve({ items: [] });
                        }

                        try {
                            const result = await getAutocompletion(code, language, line, col);

                            // Check cancellation again after async call
                            if (token.isCancellationRequested || requestId !== lastRequestId) {
                                return resolve({ items: [] });
                            }

                            const completion = result.completion;
                            if (!completion || !completion.trim()) {
                                return resolve({ items: [] });
                            }

                            resolve({
                                items: [{
                                    insertText: completion,
                                    range: {
                                        startLineNumber: line,
                                        startColumn: col,
                                        endLineNumber: line,
                                        endColumn: col,
                                    },
                                    label: 'iTECify AI',
                                }],
                            });
                        } catch (err) {
                            resolve({ items: [] });
                        }
                    }, 600);
                });
            },
            freeInlineCompletions: () => {},
        });
    }

    // Sync theme changes
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.updateOptions({ theme: isDark ? 'itecify-dark' : 'itecify-light' });
        }
    }, [isDark]);

    // Sync font changes
    useEffect(() => {
        if (editorRef.current && fontFamily) {
            editorRef.current.updateOptions({ fontFamily });
        }
    }, [fontFamily]);

    // Yjs binding
    useEffect(() => {
        if (editorRef.current && ytext && awareness && editorLoaded) {
            if (bindingRef.current) bindingRef.current.destroy();
            editorRef.current.getModel().setValue(ytext.toString());
            bindingRef.current = new MonacoBinding(ytext, editorRef.current.getModel(), new Set([editorRef.current]), awareness);
            if (undoManager) {
                undoManager.addTrackedOrigin(bindingRef.current);
            }
            setIsReady(true);
        }
        return () => {
            if (bindingRef.current) { bindingRef.current.destroy(); bindingRef.current = null; }
        };
    }, [ytext, awareness, editorLoaded]);

    // Cleanup provider on unmount
    useEffect(() => {
        return () => {
            if (providerRef.current) { providerRef.current.dispose(); providerRef.current = null; }
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', background: 'var(--bg-terminal)', position: 'relative' }}>
            {/* Connection overlay */}
            {!isReady && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(30,24,42,.8)'
                }}>
                    <span className="animate-pulse" style={{
                        background: 'var(--bg-primary-solid)', color: '#fff', padding: '8px 20px',
                        borderRadius: 99, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                        boxShadow: '0 0 20px var(--accent-glow)'
                    }}>
                        Connecting WebSocket…
                    </span>
                </div>
            )}
            <Editor
                height="100%"
                width="100%"
                language={language}
                theme={isDark ? 'itecify-dark' : 'vs-dark'}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: fontFamily || "'JetBrains Mono','Fira Code','Consolas',monospace",
                    padding: { top: 20, bottom: 20 },
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    formatOnPaste: true,
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    // Enable inline suggestions (ghost text)
                    inlineSuggest: {
                        enabled: true,
                        showToolbar: 'onHover',
                    },
                    // Also enable standard suggestions
                    quickSuggestions: true,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnCommitCharacter: true,
                    tabCompletion: 'on',
                    wordBasedSuggestions: 'currentDocument',
                }}
                loading={
                    <div style={{
                        display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.15em'
                    }}
                        className="animate-pulse">
                        DOWNLOADING MONACO VS-CODE CORE...
                    </div>
                }
            />
        </div>
    );
}
