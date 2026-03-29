import { useState } from 'react';

export default function FileExplorer({ files, currentFile, onSelectFile, onCreateFile, onDeleteFile }) {
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

    return (
        <div className="flex flex-col flex-1 px-3 py-2 min-h-0">
            <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                    Explorer
                </h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-5 h-5 flex items-center justify-center rounded transition-all hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="New File"
                >
                    +
                </button>
            </div>

            <div className="flex-1 overflow-auto flex flex-col gap-0.5">
                {files.map((file) => (
                    <div
                        key={file}
                        onClick={() => onSelectFile(file)}
                        className="group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all duration-200"
                        style={{
                            background: currentFile === file ? 'var(--bg-hover)' : 'transparent',
                            color: currentFile === file ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: currentFile === file ? 500 : 400
                            // borderLeft: currentFile === file ? '2px solid var(--mauve)' : '2px solid transparent',
                        }}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] opacity-70">📄</span>
                            <span className="text-xs truncate">{file}</span>
                        </div>
                        {files.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteFile(file); }}
                                className="w-4 h-4 rounded items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 text-[10px] transition-all"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {isCreating && (
                <div className="mt-2 px-1">
                    <form onSubmit={handleCreate}>
                        <input
                            autoFocus
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onBlur={() => setIsCreating(false)}
                            placeholder="filename.ext"
                            className="w-full text-xs px-2 py-1.5 rounded outline-none border transition-all"
                            style={{
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--mauve)',
                                boxShadow: '0 0 0 2px var(--mauve-glow)'
                            }}
                        />
                    </form>
                </div>
            )}
        </div>
    );
}
