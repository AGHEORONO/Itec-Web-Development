import { useState } from 'react';
import { Sun, Moon, Sparkles, Play, Loader2, Share2, Check } from 'lucide-react';

export default function TopBar({ language, onLanguageChange, onRun, isRunning, onShare, wsStatus, isDark, onToggleTheme, onToggleAI, isAiOpen, users }) {
    const [copied, setCopied] = useState(false);

    const handleShare = () => {
        if (onShare) onShare();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 24px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', backdropFilter: 'blur(40px)',
            zIndex: 20, flexShrink: 0, transition: 'background .7s'
        }}>
            {/* Left: Logo + Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* {/} Braces Icon */}
                <div style={{
                    width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#1a1425', border: '1px solid rgba(168,85,247,.35)',
                    boxShadow: '0 2px 12px rgba(134,59,255,.25)'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 3C6.34 3 5 4.34 5 6V9C5 10.1 4.1 11 3 11V13C4.1 13 5 13.9 5 15V18C5 19.66 6.34 21 8 21" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                        <path d="M16 3C17.66 3 19 4.34 19 6V9C19 10.1 19.9 11 21 11V13C19.9 13 19 13.9 19 15V18C19 19.66 17.66 21 16 21" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 7L12 17" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                    iTECify <span style={{ opacity: .5, fontWeight: 400 }}>Workspace</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: wsStatus === 'connected' ? 'var(--green)' : 'var(--yellow)' }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: wsStatus === 'connected' ? 'var(--green)' : 'var(--yellow)',
                        boxShadow: `0 0 8px ${wsStatus === 'connected' ? 'var(--green)' : 'var(--yellow)'}`
                    }} />
                    {wsStatus === 'connected' ? 'CONNECTED' : 'CONNECTING...'}
                </div>
            </div>

            {/* Right: Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* User avatars */}
                <div style={{ display: 'flex', marginRight: 4 }}>
                    {(users || []).slice(0, 5).map((u, i) => (
                        <div key={u.clientId} title={u.name} style={{
                            width: 32, height: 32, borderRadius: '50%', background: u.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff',
                            border: `3px solid var(--bg-app)`, marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
                            boxShadow: '0 2px 8px rgba(0,0,0,.2)', transition: 'transform .15s', cursor: 'help'
                        }}>
                            {u.name.substring(0, 2).toUpperCase()}
                        </div>
                    ))}
                </div>

                <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

                {/* Share Button */}
                <button onClick={handleShare} title="Copy room link to share with collaborators"
                    style={{
                        position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12,
                        border: copied ? '1px solid rgba(34,197,94,.4)' : '1px solid var(--border-primary)',
                        background: copied ? 'rgba(34,197,94,.15)' : 'transparent',
                        color: copied ? 'var(--green)' : 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        transition: 'all .3s ease',
                        boxShadow: copied ? '0 0 15px rgba(34,197,94,.3)' : 'none'
                    }}>
                    {copied ? <Check size={14} color="var(--green)" /> : <Share2 size={14} color="var(--accent)" />}
                    {copied ? 'Link Copied!' : 'Share'}
                </button>

                <div style={{ width: 1, height: 20, background: 'var(--border)' }} />



                {/* Language selector */}
                <select value={language} onChange={e => onLanguageChange(e.target.value)}
                    style={{
                        padding: '8px 12px', borderRadius: 12, border: '1px solid var(--select-border)', fontSize: 12, fontWeight: 700,
                        background: 'var(--select-bg)', color: 'var(--select-text)', cursor: 'pointer', outline: 'none'
                    }}>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                </select>

                {/* Dark/Light */}
                <button onClick={onToggleTheme} style={{
                    padding: 8, borderRadius: 12, border: '1px solid var(--border-primary)',
                    background: 'transparent', color: 'var(--accent)', cursor: 'pointer'
                }}>
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {/* AI */}
                <button onClick={onToggleAI}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12,
                        border: '1px solid var(--border-primary)', background: isAiOpen ? 'var(--bg-primary-light)' : 'transparent',
                        color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                        boxShadow: isAiOpen ? '0 0 15px var(--accent-glow)' : 'none'
                    }}>
                    <Sparkles size={14} color="var(--accent)" /> AI
                </button>

                {/* Run */}
                <button onClick={onRun} disabled={isRunning}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 12, border: '1px solid rgba(168,85,247,.3)',
                        background: 'var(--bg-primary-solid)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(168,85,247,.4)', opacity: isRunning ? .5 : 1, transition: 'all .15s'
                    }}>
                    {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
                    Run
                </button>
            </div>
        </header>
    );
}
