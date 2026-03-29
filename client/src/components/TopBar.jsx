import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Sparkles, Play, Loader2, Share2, Check, ChevronDown } from 'lucide-react';

export default function TopBar({ language, onLanguageChange, onRun, isRunning, onShare, wsStatus, undoManager, isDark, onToggleTheme, onToggleAI, isAiOpen, users }) {
    const [copied, setCopied] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [romania, setRomania] = useState(false);
    const langRef = useRef(null);

    // Easter egg
    useEffect(() => {
        const handleEgg = () => setRomania(true);
        window.addEventListener('romania-egg', handleEgg);
        return () => window.removeEventListener('romania-egg', handleEgg);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setIsLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languages = [
        { id: 'javascript', label: 'Node.js' },
        { id: 'typescript', label: 'TypeScript' },
        { id: 'python', label: 'Python 3' },
        { id: 'cpp', label: 'C++ (G++)' },
        { id: 'java', label: 'Java 17' },
        { id: 'go', label: 'Go 1.20' },
        { id: 'rust', label: 'Rust' },
        { id: 'ruby', label: 'Ruby' },
        { id: 'php', label: 'PHP' },
        { id: 'html', label: 'HTML/CSS' },
    ];

    const handleShare = () => {
        if (onShare) onShare();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <header className="mobile-topbar-px" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 24px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg-header)', backdropFilter: 'blur(40px)',
            zIndex: 20, flexShrink: 0, transition: 'background .7s'
        }}>
            {/* Left: Logo + Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* {/} Braces Icon */}
                {romania ? (
                    <img src="/baiatulsalut.jpeg" alt="baiatulsalut" style={{
                        width: 48, height: 48, borderRadius: 10, objectFit: 'cover',
                        border: '2px solid #a855f7', boxShadow: '0 0 20px #a855f7'
                    }} />
                ) : (
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
                )}
                <span className="hidden-mobile" style={{ fontWeight: 800, fontSize: 14, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
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
            <div className="mobile-shrink-gap" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* User avatars */}
                <div className="hidden-mobile" style={{ display: 'flex', marginRight: 4 }}>
                    {(users || []).slice(0, 5).map((u, i) => (
                        <div key={u.clientId} title={u.name} style={{
                            width: 32, height: 32, borderRadius: '50%', background: u.avatar?.type === 'image' ? 'transparent' : u.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff',
                            border: `3px solid var(--bg-app)`, marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i,
                            boxShadow: '0 2px 8px rgba(0,0,0,.2)', transition: 'transform .15s', cursor: 'help',
                            overflow: 'hidden'
                        }}>
                            {u.avatar?.type === 'image' && u.avatar?.data ? (
                                <img src={u.avatar.data} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : u.avatar?.type === 'icon' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            ) : (
                                u.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                    ))}
                </div>

                <div className="hidden-mobile" style={{ width: 1, height: 20, background: 'var(--border)' }} />

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
                    <span className="mobile-btn-text">{copied ? 'Link Copied!' : 'Share'}</span>
                </button>

                <div className="hidden-mobile" style={{ width: 1, height: 20, background: 'var(--border)' }} />



                {/* Custom Language selector */}
                <div ref={langRef} style={{ position: 'relative' }}>
                    <button onClick={() => setIsLangOpen(!isLangOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 12,
                            border: '1px solid var(--select-border)', background: 'var(--select-bg)', color: 'var(--select-text)',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', transition: 'all .2s'
                        }}>
                        <span className="mobile-btn-text">{languages.find(l => l.id === language)?.label || language}</span>
                        {!languages.find(l => l.id === language) && <span style={{display: 'none'}} className="mobile-btn-text">{language}</span>}
                        {languages.find(l => l.id === language) && <span style={{display: 'none'}} className="mobile-btn-text"></span>}
                        <ChevronDown size={14} style={{ transform: isLangOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', opacity: 0.6 }} />
                    </button>

                    {isLangOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 8, padding: 6,
                            background: 'var(--bg-sidebar-menu)', border: '1px solid var(--border-primary)', borderRadius: 14,
                            minWidth: 160, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2,
                            maxHeight: 350, overflowY: 'auto'
                        }}>
                            <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                                Environments
                            </div>
                            {languages.map(l => {
                                const isActive = language === l.id;
                                return (
                                    <button key={l.id} onClick={() => { onLanguageChange(l.id); setIsLangOpen(false); }}
                                        style={{
                                            padding: '10px 12px', background: isActive ? 'var(--bg-primary-light)' : 'transparent',
                                            border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                            color: isActive ? 'var(--text-active)' : 'var(--text-primary)',
                                            fontSize: 13, fontWeight: isActive ? 700 : 500, transition: 'all .2s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                                    >
                                        {l.label}
                                        {isActive && <Check size={14} color="var(--accent)" />}
                                    </button>
                                );
                            })}
                            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                            <div style={{
                                padding: '10px 12px', fontSize: 12, color: 'var(--accent)', fontWeight: 600,
                                cursor: 'help', textAlign: 'center', opacity: 0.8
                            }} title="The execution engine automatically builds Isolated Docker instances for any standard language.">
                                + New Env Container...
                            </div>
                        </div>
                    )}
                </div>

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
                    <span className="mobile-btn-text">Run</span>
                </button>
            </div>
        </header>
    );
}
