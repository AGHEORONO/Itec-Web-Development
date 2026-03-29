import { useState } from 'react';
import { Sparkles, X, Send, Loader2, Code, RefreshCcw } from 'lucide-react';
import { getAISuggestion } from '../lib/pistonApi';

export default function AIPanel({ language, onAccept, onInjectStream, getEditorCode, isOpen, onClose }) {
    const [prompt, setPrompt] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handlePreview = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setSuggestion(null);
        try {
            const contextCode = getEditorCode?.() || '';
            const result = await getAISuggestion(prompt, language, contextCode);
            setSuggestion(result.suggestion || '// No suggestion generated');
        } catch (err) {
            setSuggestion(`// Error: ${err.message || 'generating suggestion'}`);
        }
        setIsLoading(false);
    };

    const handleAccept = () => {
        if (suggestion) {
            onAccept(suggestion);
            setSuggestion(null);
            setPrompt('');
        }
    };

    const handleDeny = () => {
        setSuggestion(null);
    };

    const handleInject = () => {
        if (!prompt.trim()) return;
        onInjectStream(prompt);
    };

    if (!isOpen) return null;

    return (
        <aside style={{
            width: 350, borderLeft: '1px solid var(--border-primary)', background: 'var(--bg-sidebar-menu)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width .5s', overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: 20, borderBottom: '1px solid var(--border-primary)', fontSize: 10, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.12em', background: 'var(--bg-primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                    <Sparkles size={14} /> iTECify AI Co-Pilot
                </div>
                <button onClick={onClose} style={{
                    padding: 6, borderRadius: 12, border: 'none', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                    <X size={16} />
                </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Prompt */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label style={{
                            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <Send size={12} /> Your Prompt
                        </label>
                        <textarea
                            value={prompt} onChange={e => setPrompt(e.target.value)}
                            disabled={isLoading || suggestion !== null}
                            placeholder="Explain what you want to generate, refactor, or fix..."
                            style={{
                                width: '100%', minHeight: 140, resize: 'none', padding: 16, borderRadius: 12,
                                border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                                fontSize: 13, outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                                transition: 'border .3s,box-shadow .3s'
                            }}
                            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-glow)' }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                        />

                        {/* Action buttons row */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handlePreview} disabled={isLoading || !prompt.trim() || suggestion !== null}
                                style={{
                                    flex: 1, padding: '14px 0', borderRadius: 12, border: '1px solid rgba(168,85,247,.3)',
                                    background: 'var(--bg-primary-solid)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 0 20px rgba(168,85,247,.4)', opacity: (isLoading || !prompt.trim() || suggestion) ? 0.5 : 1,
                                    transition: 'all .15s'
                                }}>
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isLoading ? 'Analyzing...' : 'Preview'}
                            </button>
                            <button onClick={handleInject} disabled={isLoading || !prompt.trim()}
                                style={{
                                    flex: 1, padding: '14px 0', borderRadius: 12, border: '1px solid rgba(16,185,129,.3)',
                                    background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', fontSize: 13, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 0 20px rgba(16,185,129,.3)', opacity: (isLoading || !prompt.trim()) ? 0.5 : 1,
                                    transition: 'all .15s'
                                }}>
                                ⚡ Inject Live
                            </button>
                        </div>
                    </div>

                    {/* Suggestion preview */}
                    {suggestion && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ height: 1, background: 'var(--border)' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{
                                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                                    color: '#c084fc', display: 'flex', alignItems: 'center', gap: 8
                                }}>
                                    <Sparkles size={12} /> AI Snippet Container
                                </label>
                                <button onClick={handlePreview} disabled={isLoading} style={{
                                    fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
                                    background: 'rgba(168,85,247,0.15)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.4)',
                                    cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                    outline: 'none', transition: 'all 0.2s'
                                }}>
                                    <RefreshCcw size={10} className={isLoading ? "animate-spin" : ""} />
                                    Regenerate
                                </button>
                            </div>

                            <div style={{
                                padding: 16, borderRadius: 12, border: '1px solid rgba(168,85,247,0.5)', 
                                background: 'linear-gradient(145deg, rgba(88,28,135,0.4) 0%, rgba(49,46,129,0.3) 100%)',
                                boxShadow: 'inset 0 0 20px rgba(168,85,247,0.05), 0 8px 16px rgba(0,0,0,0.2)',
                                fontSize: 12, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6, maxHeight: 300, overflow: 'auto',
                                color: '#e9d5ff', whiteSpace: 'pre-wrap', position: 'relative'
                            }}>
                                {suggestion}
                            </div>

                            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                By accepting this, the snippet will replace the entire active file content.
                            </p>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={handleDeny}
                                    style={{
                                        flex: 1, padding: '14px 0', borderRadius: 12, border: '1px solid rgba(239,68,68,.3)',
                                        background: 'transparent', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        transition: 'all .2s'
                                    }}>
                                    Reject
                                </button>
                                <button onClick={handleAccept}
                                    style={{
                                        flex: 2, padding: '14px 0', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        background: 'linear-gradient(135deg,#16a34a,#059669)', color: '#fff',
                                        boxShadow: '0 0 20px rgba(16,185,129,.3)', transition: 'all .15s'
                                    }}>
                                    Accept & Inject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
