import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Send, Trash2 } from 'lucide-react';

export default function Terminal({ messages, isOpen, onToggle, onSendMessage, onClearTerminal }) {
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current && isOpen) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const getAuthorColor = (type) => {
        switch (type) {
            case 'ai': return '#a78bfa';
            case 'system': return '#4ade80';
            case 'error': return '#f87171';
            default: return '#38bdf8';
        }
    };

    const getAuthorIcon = (type) => {
        switch (type) {
            case 'ai': return '🤖';
            case 'system': return '⚙️';
            case 'error': return '⚠️';
            default: return '›';
        }
    };

    return (
        <div style={{
            marginTop: 16, borderRadius: '16px 16px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
            background: 'var(--bg-terminal)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'height .5s cubic-bezier(.25,.1,.25,1)', height: isOpen ? 280 : 38, flexShrink: 0, position: 'relative'
        }}>
            {/* Glow bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: 'linear-gradient(90deg,var(--glow-from),var(--glow-to))'
            }} />

            {/* Toggle bar */}
            <button onClick={onToggle} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', height: 38, flexShrink: 0, border: 'none', borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-primary-light)', cursor: 'pointer', outline: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(248,113,113,.8)' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(251,191,36,.8)' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(74,222,128,.8)' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
                        Console Output / System Logs
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {onClearTerminal && messages && messages.length > 0 && (
                        <div onClick={(e) => { e.stopPropagation(); onClearTerminal(); }}
                            style={{
                                padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,.1)',
                                border: '1px solid rgba(239,68,68,.2)', cursor: 'pointer', color: '#f87171',
                                fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all .2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
                        >
                            <Trash2 size={10} /> Clear
                        </div>
                    )}
                    <div style={{ color: 'var(--text-muted)' }}>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                </div>
            </button>

            {/* Messages */}
            <div ref={scrollRef} style={{
                flex: 1, overflow: 'auto', padding: '12px 16px',
                fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 13, lineHeight: 1.7,
                opacity: isOpen ? 1 : 0, transition: 'opacity .3s', display: 'flex', flexDirection: 'column', gap: 4
            }}>
                {(!messages || messages.length === 0) && (
                    <span style={{ color: 'var(--text-muted)', opacity: .5 }}>
                        $ Run your code or type a command below...
                    </span>
                )}
                {messages && messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{
                            color: msg.color || getAuthorColor(msg.type),
                            fontWeight: 700, flexShrink: 0, minWidth: 0,
                            fontSize: msg.type === 'system' || msg.type === 'error' ? 11 : 13
                        }}>
                            {getAuthorIcon(msg.type)} {msg.author}:
                        </span>
                        <span style={{
                            color: msg.type === 'error' ? '#fca5a5' : (msg.type === 'system' ? '#86efac' : 'var(--accent)'),
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                        }}>
                            {msg.text}
                        </span>
                    </div>
                ))}
            </div>

            {/* Input bar */}
            {isOpen && (
                <form onSubmit={handleSubmit} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderTop: '1px solid var(--border-primary)',
                    background: 'rgba(0,0,0,.15)', flexShrink: 0
                }}>
                    <span style={{
                        color: 'var(--accent)', fontWeight: 700, fontSize: 13,
                        fontFamily: "'JetBrains Mono','Fira Code',monospace", flexShrink: 0
                    }}>$</span>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command or message..."
                        style={{
                            flex: 1, padding: '6px 10px', borderRadius: 8,
                            border: '1px solid var(--border)', background: 'var(--bg-input)',
                            color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                            fontFamily: "'JetBrains Mono','Fira Code',monospace",
                            transition: 'border .3s'
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
                    />
                    <button type="submit" disabled={!input.trim()}
                        style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-primary)',
                            background: input.trim() ? 'var(--bg-primary-solid)' : 'transparent',
                            color: input.trim() ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                            transition: 'all .2s', flexShrink: 0
                        }}>
                        <Send size={12} /> Send
                    </button>
                </form>
            )}
        </div>
    );
}
