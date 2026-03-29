import { useState } from 'react';
import { Files, Star, Users, Trash2, Palette, Settings, Plus, FileCode2, RotateCcw, X } from 'lucide-react';

export default function Sidebar({
    users, files, currentFile, onSelectFile, onCreateFile, onDeleteFile,
    favorites, onToggleFavorite, deletedFiles, onRestoreFile, onClearRecycleBin,
    themeHue, onThemeHueChange, editorFont, onEditorFontChange,
    userName
}) {
    const [activeTab, setActiveTab] = useState('files');
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (newFileName && !files.includes(newFileName)) {
            onCreateFile(newFileName);
            setNewFileName('');
            setIsCreating(false);
        }
    };

    const tabs = [
        { id: 'files', icon: Files, label: 'Files' },
        { id: 'favorites', icon: Star, label: 'Favorites' },
        { id: 'users', icon: Users, label: 'Users', badge: users.length },
        { id: 'spacer' },
        { id: 'trash', icon: Trash2, label: 'Trash', isRed: true, badge: deletedFiles?.length },
        { id: 'theme', icon: Palette, label: 'Theme' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    const panelTitles = {
        files: 'Session Explorer', favorites: 'Favorite Documents', users: 'Active Collaborators',
        trash: 'Recycle Bin', theme: 'Workspace Theming', settings: 'Ecosystem Settings'
    };

    const isFav = (f) => favorites?.includes(f);

    return (
        <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
            {/* Icon Bar */}
            <nav style={{
                width: 64, background: 'var(--bg-sidebar-icon)', borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 24, flexShrink: 0
            }}>
                {tabs.map((tab) => {
                    if (tab.id === 'spacer') return <div key="spacer" style={{ flex: 1 }} />;
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} title={tab.label}
                            style={{
                                position: 'relative', padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all .3s',
                                background: isActive ? 'var(--bg-primary-light)' : 'transparent',
                                color: isActive ? 'var(--text-active)' : (tab.isRed && isActive ? '#f87171' : 'var(--text-muted)'),
                                boxShadow: isActive ? '0 0 15px currentColor' : 'none'
                            }}>
                            <Icon size={22} />
                            {isActive && <div style={{
                                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 24,
                                background: tab.isRed ? '#ef4444' : 'var(--bg-primary-solid)', borderRadius: '0 4px 4px 0'
                            }} />}
                            {tab.badge > 0 && <span style={{
                                position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
                                background: tab.isRed ? '#ef4444' : 'var(--bg-primary-solid)', color: '#fff', fontSize: 9, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>{tab.badge}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Panel */}
            <aside style={{
                width: 280, background: 'var(--bg-sidebar-menu)', borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0
            }}>
                {/* Panel header */}
                <div style={{
                    padding: '20px', borderBottom: '1px solid var(--border-primary)', fontSize: 10, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', background: 'var(--bg-primary-light)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    {panelTitles[activeTab]}
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                    {/* FILES */}
                    {activeTab === 'files' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {files.map(f => (
                                <div key={f} onClick={() => onSelectFile(f)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                                        borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                                        background: currentFile === f ? 'var(--bg-primary-light)' : 'transparent',
                                        color: currentFile === f ? 'var(--text-active)' : 'var(--text-muted)',
                                        border: currentFile === f ? '1px solid var(--border-primary)' : '1px solid transparent',
                                        fontWeight: currentFile === f ? 500 : 400, fontSize: 13
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                        <FileCode2 size={16} style={{ opacity: currentFile === f ? 1 : .6, flexShrink: 0 }} />
                                        <span className="truncate">{f}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                        <button onClick={e => { e.stopPropagation(); onToggleFavorite(f) }}
                                            title={isFav(f) ? 'Remove from favorites' : 'Add to favorites'}
                                            style={{
                                                padding: 5, borderRadius: 8, background: isFav(f) ? 'rgba(250,204,21,.12)' : 'rgba(255,255,255,.04)',
                                                border: isFav(f) ? '1px solid rgba(250,204,21,.25)' : '1px solid transparent',
                                                cursor: 'pointer', color: isFav(f) ? '#facc15' : 'var(--text-muted)',
                                                transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            <Star size={13} fill={isFav(f) ? '#facc15' : 'none'} />
                                        </button>
                                        {files.length > 1 && (
                                            <button onClick={e => { e.stopPropagation(); onDeleteFile(f) }}
                                                title="Delete file"
                                                style={{
                                                    padding: 5, borderRadius: 8, background: 'rgba(255,255,255,.04)',
                                                    border: '1px solid transparent', cursor: 'pointer', color: 'var(--text-muted)',
                                                    transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.12)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.25)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isCreating ? (
                                <form onSubmit={handleCreate} style={{ marginTop: 8 }}>
                                    <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)}
                                        onBlur={() => setIsCreating(false)} placeholder="filename.ext"
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--accent)',
                                            background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                                            boxShadow: '0 0 0 2px var(--accent-glow)'
                                        }} />
                                </form>
                            ) : (
                                <button onClick={() => setIsCreating(true)}
                                    style={{
                                        marginTop: 24, width: '100%', padding: 12, borderRadius: 12, border: '1px dashed var(--border-primary)',
                                        background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s'
                                    }}>
                                    <Plus size={14} /> New File
                                </button>
                            )}
                        </div>
                    )}

                    {/* FAVORITES */}
                    {activeTab === 'favorites' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(!favorites || favorites.length === 0) && (
                                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginTop: 20, color: 'var(--text-muted)' }}>No Favorites Pinned</p>
                            )}
                            {favorites?.filter(f => files.includes(f)).map(f => (
                                <div key={f} onClick={() => onSelectFile(f)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                                        borderRadius: 12, cursor: 'pointer', background: currentFile === f ? 'rgba(250,204,21,.1)' : 'transparent',
                                        color: currentFile === f ? '#facc15' : 'var(--text-muted)', fontSize: 13, transition: 'all .2s'
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Star size={16} fill="#facc15" color="#facc15" />
                                        <span>{f}</span>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); onToggleFavorite(f) }}
                                        style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', opacity: 0, transition: 'opacity .2s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* USERS */}
                    {activeTab === 'users' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {users.map(u => (
                                <div key={u.clientId} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                                    borderRadius: 12, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', transition: 'all .2s'
                                }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 12, background: u.color, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 900
                                        }}>
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span style={{
                                            position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%',
                                            background: 'var(--green)', border: '2px solid var(--bg-sidebar-menu)'
                                        }} />
                                    </div>
                                    <span className="truncate">{u.name} {u.isLocal && <span style={{ fontSize: 10, opacity: .5, fontWeight: 700, marginLeft: 4 }}>(You)</span>}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TRASH */}
                    {activeTab === 'trash' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(!deletedFiles || deletedFiles.length === 0) && (
                                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginTop: 20, color: 'var(--text-muted)' }}>Recycle Bin is Empty</p>
                            )}
                            {deletedFiles && deletedFiles.length > 0 && (
                                <button onClick={onClearRecycleBin}
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: 12,
                                        border: '1px solid rgba(239,68,68,.3)',
                                        background: 'linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.05))',
                                        color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        transition: 'all .2s', marginBottom: 8
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.25)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.5)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.05))'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.3)'; }}
                                >
                                    <Trash2 size={14} /> Clear Recycle Bin ({deletedFiles.length})
                                </button>
                            )}
                            {deletedFiles?.map(f => (
                                <div key={f} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
                                    borderRadius: 12, background: 'rgba(239,68,68,.05)', color: 'rgba(248,113,113,.6)',
                                    border: '1px solid rgba(239,68,68,.1)', fontSize: 13
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="line-through">
                                        <FileCode2 size={16} style={{ opacity: .5 }} />
                                        <span>{f}</span>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); onRestoreFile(f) }}
                                        title="Restore" style={{
                                            padding: 6, borderRadius: 8, background: 'rgba(0,0,0,.2)', border: 'none',
                                            cursor: 'pointer', color: '#4ade80', transition: 'all .2s'
                                        }}>
                                        <RotateCcw size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* THEME */}
                    {activeTab === 'theme' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div>
                                <label style={{
                                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)',
                                    display: 'flex', justifyContent: 'space-between', marginBottom: 12
                                }}>
                                    Interface Accent <span>{themeHue}°</span>
                                </label>
                                <input type="range" min="0" max="360" value={themeHue || 0} onChange={e => onThemeHueChange(Number(e.target.value))}
                                    style={{
                                        width: '100%', height: 8, borderRadius: 99, appearance: 'none', cursor: 'pointer', outline: 'none',
                                        background: 'linear-gradient(to right,#f43f5e,#eab308,#22c55e,#06b6d4,#3b82f6,#d946ef,#f43f5e)'
                                    }} />
                                <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                                    Drag the slider to dynamically hue-rotate the overall interface in real-time.
                                </p>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
                                    Editor Typography
                                </label>
                                <select value={editorFont} onChange={e => onEditorFontChange(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--select-border)',
                                        background: 'var(--select-bg)', color: 'var(--select-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none'
                                    }}>
                                    <option value="'JetBrains Mono','Fira Code','Consolas',monospace">JetBrains Mono</option>
                                    <option value="'Courier New',Courier,monospace">Courier (Classic)</option>
                                    <option value="'Monaco',monospace">Monaco (Mac)</option>
                                    <option value="'Comic Sans MS','Comic Sans',cursive">Comic Sans (Fun)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS */}
                    {activeTab === 'settings' && (
                        <div style={{
                            background: 'var(--bg-input)', borderRadius: 12, padding: 16, fontSize: 11, fontWeight: 500,
                            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12
                        }}>
                            <p style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Execution Engine:</span>
                                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Docker-in-Docker Sandbox</span>
                            </p>
                            <p style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>AI Co-pilot Brain:</span>
                                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>iTECKY Assistant (Groq LLaMA 3.1 8B)</span>
                            </p>
                            <p style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Network Protocols:</span>
                                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Y-WebSocket CRDT Relay</span>
                            </p>
                            <p style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Resource Limits:</span>
                                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>128MB RAM / 0.5 CPU / No Network</span>
                            </p>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
