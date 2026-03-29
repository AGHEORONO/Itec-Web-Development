import { useState, useEffect } from 'react';
import { Files, Star, Users, Trash2, Palette, Settings, Plus, FileCode2, RotateCcw, X, Download, Blocks, Search, Folder, ChevronRight, ChevronDown, Archive, RefreshCw, CheckCircle2, Upload } from 'lucide-react';

const GithubIcon = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
);

const buildTree = (files) => {
    const root = { name: 'Workspace', type: 'folder', path: '', children: [] };
    files.forEach(filePath => {
        const parts = filePath.split('/');
        let currentLevel = root.children;
        let currentPath = '';

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const isFile = index === parts.length - 1;
            
            let existingNode = currentLevel.find(n => n.name === part);
            if (existingNode) {
                if (!isFile) currentLevel = existingNode.children;
            } else {
                const newNode = {
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    path: currentPath,
                    children: isFile ? undefined : []
                };
                currentLevel.push(newNode);
                if (!isFile) currentLevel = newNode.children;
            }
        });
    });
    
    const sortTree = (nodes) => {
        nodes.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
        nodes.forEach(n => { if (n.children) sortTree(n.children); });
    };
    sortTree(root.children);
    return root.children;
};

const FileTreeNode = ({ 
    node, level, currentFile, expandedFolders, toggleFolder, 
    onSelectFile, onDownloadFile, onToggleFavorite, isFav, onDeleteFile, onMoveFile, filesCount,
    folderColors, onOpenContextMenu
}) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders.has(node.path);
    const isActive = currentFile === node.path;
    const isHidden = !isFolder && node.name === '.keep';

    if (isHidden) return null;

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', node.path);
        e.stopPropagation();
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFolder) e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFolder) e.currentTarget.style.background = 'transparent';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFolder) e.currentTarget.style.background = 'transparent';
        const sourcePath = e.dataTransfer.getData('text/plain');
        if (sourcePath && sourcePath !== node.path && !sourcePath.startsWith(node.path + '/')) {
            onMoveFile(sourcePath, node.path);
        }
    };

    return (
        <div 
            onDragOver={isFolder ? handleDragOver : undefined}
            onDragLeave={isFolder ? handleDragLeave : undefined}
            onDrop={isFolder ? handleDrop : undefined}
            style={{ display: 'flex', flexDirection: 'column', gap: 2, transition: 'background 0.2s' }}
        >
            <div 
                draggable
                onDragStart={handleDragStart}
                onClick={e => {
                    e.stopPropagation();
                    isFolder ? toggleFolder(node.path) : onSelectFile(node.path);
                }}
                onContextMenu={e => {
                    if (isFolder) {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenContextMenu(node.path, e.clientX, e.clientY);
                    }
                }}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: `6px 12px 6px ${12 + (level * 16)}px`,
                    borderRadius: 8, cursor: 'pointer', transition: 'all .2s',
                    background: isActive ? 'var(--bg-primary-light)' : 'transparent',
                    color: isActive ? 'var(--text-active)' : 'var(--text-muted)',
                    border: isActive ? '1px solid var(--border-primary)' : '1px solid transparent',
                    fontWeight: isActive ? 500 : 400, fontSize: 13
                }}
                className="file-node-hover"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    {isFolder ? (
                        <>
                            {isExpanded ? <ChevronDown size={14} style={{ opacity: 0.6 }} /> : <ChevronRight size={14} style={{ opacity: 0.6 }} />}
                            <Folder size={14} fill={isExpanded ? (folderColors?.[node.path] || 'var(--accent)') : 'transparent'} color={folderColors?.[node.path] || 'var(--accent)'} style={{ flexShrink: 0 }} />
                        </>
                    ) : (
                        <>
                            <FileCode2 size={14} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0, marginLeft: 20 }} />
                        </>
                    )}
                    <span className="truncate">{node.name}</span>
                </div>
                
                {!isFolder && (
                    <div className="file-actions" style={{ display: 'none', gap: 2, flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); onDownloadFile(node.path) }}
                            title="Download file"
                            style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <Download size={12} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); onToggleFavorite(node.path) }}
                            title={isFav(node.path) ? 'Remove from favorites' : 'Add to favorites'}
                            style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: isFav(node.path) ? '#facc15' : 'var(--text-muted)' }}>
                            <Star size={12} fill={isFav(node.path) ? '#facc15' : 'none'} />
                        </button>
                        {filesCount > 1 && (
                            <button onClick={e => { e.stopPropagation(); onDeleteFile(node.path) }}
                                title="Delete file"
                                style={{ padding: 4, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isFolder && isExpanded && node.children && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {node.children.map(child => (
                        <FileTreeNode 
                            key={child.path} node={child} level={level + 1} 
                            currentFile={currentFile} expandedFolders={expandedFolders} 
                            toggleFolder={toggleFolder} onSelectFile={onSelectFile} 
                            onDownloadFile={onDownloadFile} onToggleFavorite={onToggleFavorite} 
                            isFav={isFav} onDeleteFile={onDeleteFile} onMoveFile={onMoveFile}
                            filesCount={filesCount} folderColors={folderColors} onOpenContextMenu={onOpenContextMenu}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar({
    users, files, currentFile, onSelectFile, onCreateFile, onDeleteFile,
    favorites, onToggleFavorite, deletedFiles, onRestoreFile, onClearRecycleBin,
    themeHue, onThemeHueChange, editorFont, onEditorFontChange,
    userName, onDownloadFile, onMoveFile, onDownloadWorkspace, onCreateFolder,
    onPushToGitHub, folderColors, onSetFolderColor, onExtractFolder
}) {
    const [activeTab, setActiveTab] = useState('files');
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [contextMenu, setContextMenu] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // GitHub State
    const [githubPat, setGithubPat] = useState(localStorage.getItem('github_pat') || '');
    const [githubRepo, setGithubRepo] = useState(localStorage.getItem('github_repo') || '');
    const [commitMessage, setCommitMessage] = useState('');
    const [pushStatus, setPushStatus] = useState(null);

    const handlePush = async () => {
        if (!githubPat || !githubRepo || !commitMessage) return;
        localStorage.setItem('github_pat', githubPat);
        localStorage.setItem('github_repo', githubRepo);
        setPushStatus('pushing');
        try {
            await onPushToGitHub(githubPat, githubRepo, commitMessage);
            setPushStatus('success');
            setCommitMessage('');
            setTimeout(() => setPushStatus(null), 3000);
        } catch (err) {
            setPushStatus('error');
            alert(err.message);
        }
    };

    const toggleFolder = (folderPath) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderPath)) next.delete(folderPath);
            else next.add(folderPath);
            return next;
        });
    };

    const tree = buildTree(files);

    const handleDropToRoot = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.background = 'transparent';
        const sourcePath = e.dataTransfer.getData('text/plain');
        if (sourcePath && sourcePath.includes('/')) {
            onMoveFile(sourcePath, '');
        }
    };


    useEffect(() => {
        if (activeTab !== 'theme') return;

        let sequence = '';
        const target = 'rgbrgbrgb';

        const handleKeyDown = (e) => {
            sequence += e.key.toLowerCase();
            if (sequence.length > target.length) {
                sequence = sequence.slice(-target.length);
            }
            if (sequence === target) {
                window.dispatchEvent(new CustomEvent('toggle-rgb-mode'));
                sequence = ''; // reset sequence
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleCreate = (e) => {
        e.preventDefault();
        if (newFileName) {
            if (isCreatingFolder) {
                onCreateFolder(newFileName);
            } else if (!files.includes(newFileName)) {
                onCreateFile(newFileName);
            }
            setNewFileName('');
            setIsCreating(false);
            setIsCreatingFolder(false);
        }
    };

    const handleFileUpload = async (e) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const lowerName = file.name.toLowerCase();
            if (lowerName.endsWith('.stl') || lowerName.endsWith('.step')) {
                window.dispatchEvent(new CustomEvent('solidworks-easter-egg', { detail: { file, name: file.name } }));
                return;
            }
            const text = await file.text();
            onCreateFile(file.name, text);
        }
        e.target.value = '';
    };

    const handleFolderUpload = async (e) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const lowerName = file.name.toLowerCase();
            if (lowerName.endsWith('.stl') || lowerName.endsWith('.step')) {
                window.dispatchEvent(new CustomEvent('solidworks-easter-egg', { detail: { file, name: file.name } }));
                return;
            }
            const path = file.webkitRelativePath || file.name;
            const text = await file.text();
            onCreateFile(path, text);
        }
        e.target.value = '';
    };

    const tabs = [
        { id: 'files', icon: Files, label: 'Files' },
        { id: 'github', icon: GithubIcon, label: 'Source Control' },
        { id: 'favorites', icon: Star, label: 'Favorites' },
        { id: 'users', icon: Users, label: 'Users', badge: users.length },
        { id: 'extensions', icon: Blocks, label: 'Extensions' },
        { id: 'spacer' },
        { id: 'trash', icon: Trash2, label: 'Trash', isRed: true, badge: deletedFiles?.length },
        { id: 'theme', icon: Palette, label: 'Theme' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    const panelTitles = {
        files: 'Session Explorer', github: 'Source Control', favorites: 'Favorite Documents', users: 'Active Collaborators',
        extensions: 'Extensions Marketplace',
        trash: 'Recycle Bin', theme: 'Workspace Theming', settings: 'Ecosystem Settings'
    };

    const isFav = (f) => favorites?.includes(f);

    return (
        <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
            <style>{`
                .file-node-hover:hover .file-actions { display: flex !important; }
                .file-node-hover:hover { background: rgba(255,255,255,0.03); }
            `}</style>
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
                        <button key={tab.id} onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)} title={tab.label}
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

            {/* Mobile Backdrop */}
            {isMobile && activeTab && (
                <div className="mobile-overlay-backdrop" onClick={() => setActiveTab(null)} />
            )}

            {/* Panel */}
            <aside 
                className={isMobile && activeTab ? 'mobile-overlay-panel' : ''}
                style={{
                width: activeTab ? (isMobile ? 'calc(100vw - 64px)' : 280) : 0, 
                opacity: activeTab ? 1 : 0, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'var(--bg-sidebar-menu)', borderRight: activeTab ? '1px solid var(--border)' : 'none',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0
            }}>
                <div style={{ minWidth: isMobile ? 'calc(100vw - 64px)' : 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                        <div 
                            style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}
                            onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                            onDragLeave={e => { e.preventDefault(); e.currentTarget.style.background = 'transparent'; }}
                            onDrop={handleDropToRoot}
                        >
                            {tree.map(node => (
                                <FileTreeNode 
                                    key={node.path} node={node} level={0} 
                                    currentFile={currentFile} expandedFolders={expandedFolders} 
                                    toggleFolder={toggleFolder} onSelectFile={onSelectFile} 
                                    onDownloadFile={onDownloadFile} onToggleFavorite={onToggleFavorite} 
                                    isFav={isFav} onDeleteFile={onDeleteFile} onMoveFile={onMoveFile}
                                    filesCount={files.length} folderColors={folderColors}
                                    onOpenContextMenu={(path, x, y) => setContextMenu({ path, x, y })}
                                />
                            ))}

                            {isCreating ? (
                                <form onSubmit={handleCreate} style={{ marginTop: 8 }}>
                                    <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)}
                                        onBlur={() => setTimeout(() => { setIsCreating(false); setIsCreatingFolder(false); }, 150)} 
                                        placeholder={isCreatingFolder ? "folder/path..." : "filename.ext"}
                                        style={{
                                            width: '100%', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--accent)',
                                            background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                                            boxShadow: '0 0 0 2px var(--accent-glow)'
                                        }} />
                                </form>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => { setIsCreating(true); setIsCreatingFolder(false); }} title="New File"
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: 8, border: '1px dashed var(--border-primary)',
                                                background: 'transparent', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .2s'
                                            }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                            <Plus size={12} /> File
                                        </button>
                                        <button onClick={() => { setIsCreating(true); setIsCreatingFolder(true); }} title="New Folder"
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: 8, border: '1px dashed var(--border-primary)',
                                                background: 'transparent', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .2s'
                                            }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                            <Folder size={12} /> Folder
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <label title="Upload File(s)"
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                                                background: 'var(--bg-input)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .2s'
                                            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                                            <Upload size={12} /> Upload File
                                            <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
                                        </label>
                                        <label title="Upload Folder"
                                            style={{
                                                flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--border)',
                                                background: 'var(--bg-input)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .2s'
                                            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                                            <Upload size={12} /> Upload Folder
                                            <input type="file" webkitdirectory="true" directory="true" style={{ display: 'none' }} onChange={handleFolderUpload} />
                                        </label>
                                    </div>
                                </div>
                            )}

                            <button onClick={onDownloadWorkspace}
                                style={{
                                    marginTop: 12, width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                                    background: 'var(--bg-primary-light)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s'
                                }}>
                                <Archive size={14} /> Download Workspace ZIP
                            </button>
                        </div>
                    )}

                    {/* GITHUB */}
                    {activeTab === 'github' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <style>{`
                                @keyframes spin { 100% { transform: rotate(360deg); } }
                                .spin { animation: spin 1s linear infinite; }
                            `}</style>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>GitHub Personal Access Token</label>
                                <input type="password" value={githubPat} onChange={e => setGithubPat(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none'
                                    }} />
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Requires 'repo' scope. Stored locally.</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Repository</label>
                                <input value={githubRepo} onChange={e => setGithubRepo(e.target.value)}
                                    placeholder="username/repository"
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none'
                                    }} />
                            </div>

                            <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Commit Message</label>
                                <textarea value={commitMessage} onChange={e => setCommitMessage(e.target.value)}
                                    placeholder="Update collaborative workspace" rows={3}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', resize: 'vertical'
                                    }} />
                            </div>

                            <button onClick={handlePush} disabled={!githubPat || !githubRepo || !commitMessage || pushStatus === 'pushing'}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                                    background: pushStatus === 'success' ? '#22c55e' : 'var(--accent)', 
                                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s',
                                    opacity: (!githubPat || !githubRepo || !commitMessage || pushStatus === 'pushing') ? 0.6 : 1
                                }}>
                                {pushStatus === 'pushing' ? <RefreshCw className="spin" size={16} /> :
                                 pushStatus === 'success' ? <CheckCircle2 size={16} /> :
                                 <GithubIcon size={16} />}
                                {pushStatus === 'pushing' ? 'Publishing...' :
                                 pushStatus === 'success' ? 'Pushed Successfully!' :
                                 'Commit & Push'}
                            </button>
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
                                            width: 28, height: 28, borderRadius: 12, background: u.avatar?.type === 'image' ? 'transparent' : u.color, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 900, overflow: 'hidden'
                                        }}>
                                            {u.avatar?.type === 'image' && u.avatar?.data ? (
                                                <img src={u.avatar.data} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : u.avatar?.type === 'icon' ? (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                            ) : (
                                                u.name.substring(0, 2).toUpperCase()
                                            )}
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

                    {/* EXTENSIONS */}
                    {activeTab === 'extensions' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                                <input placeholder="Search Extensions in Marketplace..."
                                    style={{
                                        width: '100%', padding: '8px 12px 8px 30px', borderRadius: 12, border: '1px solid var(--border)',
                                        background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, outline: 'none'
                                    }} />
                            </div>

                            {[
                                { name: 'Python snippet pack', author: 'iTECify', desc: 'A snippet pack to make you more productive working with python', installed: true },
                                { name: 'Prettier - Code formatter', author: 'Prettier', desc: 'Code formatter using prettier', installed: true },
                                { name: 'Docker', author: 'Microsoft', desc: 'Makes it easy to create, manage, and debug containerized applications.', installed: false },
                                { name: 'ESLint', author: 'Microsoft', desc: 'Integrates ESLint JavaScript into VS Code.', installed: false },
                            ].map((ext, i) => (
                                <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-input)', display: 'flex', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Blocks size={16} color="var(--accent)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ext.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>{ext.author}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {ext.desc}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {ext.installed ? (
                                                <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 10, cursor: 'not-allowed' }}>
                                                    <Settings size={12} /> Manage
                                                </button>
                                            ) : (
                                                <button style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                                    Install
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px dashed var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}>
                                Load More Extensions...
                            </button>
                        </div>
                    )}
                </div>
                </div>
            </aside>
            
            {contextMenu && (
                <div style={{
                    position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999,
                    background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', padding: 8, minWidth: 160,
                    display: 'flex', flexDirection: 'column', gap: 4
                }}>
                    <div style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Folder Color
                    </div>
                    <div style={{ display: 'flex', gap: 6, padding: '4px 8px', flexWrap: 'wrap', maxWidth: 140 }}>
                        {['#38bdf8', '#facc15', '#4ade80', '#f87171', '#c084fc', '#fb923c', '#9ca3af', 'var(--accent)'].map(c => (
                            <button key={c} onClick={() => { onSetFolderColor(contextMenu.path, c); setContextMenu(null); }}
                                style={{
                                    width: 20, height: 20, borderRadius: '50%', background: c, border: folderColors?.[contextMenu.path] === c ? '2px solid #fff' : '2px solid transparent',
                                    outline: 'none', cursor: 'pointer'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <button onClick={() => { onExtractFolder(contextMenu.path); setContextMenu(null); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                            background: 'transparent', border: 'none', color: '#f87171', fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', textAlign: 'left', width: '100%'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <Trash2 size={14} /> Extract & Delete Folder
                    </button>
                    <button onClick={() => { 
                           onSetFolderColor(contextMenu.path, null);
                           setContextMenu(null); 
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                            background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', textAlign: 'left', width: '100%'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        Reset Style
                    </button>
                </div>
            )}
        </div>
    );
}
