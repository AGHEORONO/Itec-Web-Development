import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SkipBack, SkipForward, BookmarkPlus, Trash2, X } from 'lucide-react';

export default function Timeline({ historyArray, currentFile, userName, userColor, onSelectNode, isGhostView, activeNodeId, onManualKeyframe }) {
    const [nodes, setNodes] = useState([]);
    const [retroCount, setRetroCount] = useState(0);
    const railRef = useRef(null);

    // Sync from Y.Array
    useEffect(() => {
        if (!historyArray) {
            setNodes([]);
            return;
        }

        const sync = () => {
            setNodes(historyArray.toArray());
            if (railRef.current) {
                setTimeout(() => {
                    if (railRef.current) {
                        railRef.current.scrollLeft = railRef.current.scrollWidth;
                    }
                }, 50);
            }
        };

        historyArray.observe(sync);
        sync();

        return () => historyArray.unobserve(sync);
    }, [historyArray, currentFile]);

    if (!historyArray) return null;

    const handleJumpToStart = () => {
        if (nodes.length > 0) {
            const firstNodeId = nodes[0].id;
            if (activeNodeId === firstNodeId) {
                setRetroCount(c => {
                    const next = c + 1;
                    if (next >= 5) {
                        window.dispatchEvent(new CustomEvent('unlock-retro-theme'));
                        return 0;
                    }
                    return next;
                });
            } else {
                onSelectNode(nodes[0]);
                setRetroCount(0);
            }
        }
    };

    const handleJumpToEnd = () => {
        onSelectNode(null);
    };

    return (
        <div className="timeline-container" style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-header)',
            borderTop: '1px solid var(--border)',
            padding: '0 12px',
            gap: 8,
            userSelect: 'none',
            flexShrink: 0,
            overflow: 'hidden'
        }}>
            {/* Left Controls */}
            <button 
                onClick={handleJumpToStart} 
                disabled={nodes.length === 0}
                className="timeline-btn"
                title="Jump to beginning"
            >
                <SkipBack size={14} />
            </button>
            <button 
                onClick={onManualKeyframe} 
                className="timeline-btn"
                title="Add Manual Keyframe"
                style={{ color: 'var(--accent)' }}
            >
                <BookmarkPlus size={14} />
            </button>
            
            {/* The Rail */}
            <div 
                ref={railRef}
                style={{
                    flex: 1, height: '100%', display: 'flex', alignItems: 'center',
                    overflowX: 'auto', overflowY: 'hidden', position: 'relative',
                    padding: '0 20px', scrollbarWidth: 'none', msOverflowStyle: 'none'
                }}
                className="timeline-rail-scroll"
            >
                <div style={{
                    position: 'absolute', top: '50%', left: 20, right: 20, height: 2,
                    background: 'var(--border)', transform: 'translateY(-50%)', zIndex: 0
                }} />

                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1, minWidth: '100%' }}>
                    {nodes.map((node, idx) => {
                        const isActive = isGhostView && activeNodeId === node.id;
                        return (
                            <TimelineNode 
                                key={node.id}
                                node={node}
                                idx={idx}
                                isActive={isActive}
                                onClick={() => onSelectNode(node)}
                                onUpdateTag={(tagData) => {
                                    const raw = historyArray.get(idx);
                                    historyArray.delete(idx, 1);
                                    historyArray.insert(idx, [{ ...raw, tag: tagData }]);
                                }}
                                onDelete={() => {
                                    historyArray.delete(idx, 1);
                                    if (isActive) onSelectNode(null);
                                }}
                            />
                        );
                    })}

                    {/* LIVE NODE */}
                    <LiveNode 
                        isActive={!isGhostView}
                        onClick={() => onSelectNode(null)}
                    />
                </div>
            </div>

            {/* Ghost View Badge */}
            {isGhostView && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 6, color: '#ef4444', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em'
                }}>
                    GHOST VIEW
                    <button onClick={() => onSelectNode(null)} style={{
                        background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2
                    }}>
                        <X size={12} />
                    </button>
                </div>
            )}
            
            <button 
                onClick={handleJumpToEnd} 
                disabled={!isGhostView}
                className="timeline-btn"
                title="Return to Live"
            >
                <SkipForward size={14} />
            </button>
        </div>
    );
}

/* ── Live Node (always last, green pulsing bar) ── */
function LiveNode({ isActive, onClick }) {
    return (
        <div className={`timeline-node-wrapper ${isActive ? 'active' : ''}`} onClick={onClick} title="Live Document" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 20, height: 2, background: isActive ? 'var(--accent)' : 'var(--border)', marginRight: -2 }} />
            <div className={isActive ? 'pulse-glow' : ''} style={{
                width: 24, height: 16, borderRadius: 4, background: '#22c55e',
                border: '2px solid var(--bg-app)', cursor: 'pointer', position: 'relative', zIndex: 2,
                transition: 'all 0.2s'
            }} />
        </div>
    );
}

/* ── History Node with hover-for-color & right-click-for-delete ── */
function TimelineNode({ node, isActive, onClick, onUpdateTag, onDelete }) {
    const [isHovered, setIsHovered] = useState(false);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const hoverTimeout = useRef(null);
    const [rect, setRect] = useState(null);

    const { author, color, timestamp, reason, tag } = node;
    const tagColor = tag?.color || null;

    let displayTime = '';
    const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffInSeconds < 60) displayTime = 'Just now';
    else if (diffInSeconds < 3600) displayTime = `${Math.floor(diffInSeconds / 60)}m ago`;
    else displayTime = `${Math.floor(diffInSeconds / 3600)}h ago`;

    const handleMouseEnter = (e) => {
        clearTimeout(hoverTimeout.current);
        setRect(e.currentTarget.getBoundingClientRect());
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsHovered(false);
        }, 300);
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setRect(e.currentTarget.getBoundingClientRect());
        setShowDeleteMenu(true);
    };

    const COLORS = ['#ef4444', '#eab308', '#3b82f6', '#a855f7', '#22c55e'];

    return (
        <div 
            className={`timeline-node-wrapper ${isActive ? 'active' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleRightClick}
            title={`${reason || 'Edit'} · ${author} · ${displayTime}`}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
            <div style={{ width: 20, height: 2, background: 'var(--border)', marginRight: -2 }} />
            
            {/* The Bar Block */}
            <div 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                style={{
                    width: isActive ? 28 : (tagColor ? 24 : 16),
                    height: isActive ? 18 : (tagColor ? 16 : 12),
                    minWidth: isActive ? 28 : (tagColor ? 24 : 16),
                    borderRadius: 4,
                    background: tagColor || color,
                    border: `2px solid ${isActive ? '#fff' : 'var(--bg-app)'}`,
                    cursor: 'pointer', position: 'relative', zIndex: 2,
                    boxShadow: isActive ? `0 0 10px ${tagColor || color}` : 'none',
                    transition: 'all 0.15s ease'
                }}
            />

            {/* HOVER: Color Picker Popover (appears above) */}
            {isHovered && !showDeleteMenu && rect && createPortal(
                <div 
                    onMouseEnter={() => { clearTimeout(hoverTimeout.current); setIsHovered(true); }}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        position: 'fixed', top: rect.top - 36, left: rect.left + (rect.width / 2), transform: 'translateX(-50%)',
                        background: 'var(--bg-panel)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '4px 6px', display: 'flex', gap: 4, zIndex: 999999,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        animation: 'fadeIn 0.15s ease'
                    }}
                >
                    {COLORS.map(c => (
                        <div 
                            key={c} 
                            onClick={(e) => { e.stopPropagation(); onUpdateTag({ color: c }); setIsHovered(false); }}
                            style={{ 
                                width: 12, height: 12, borderRadius: '50%', background: c, cursor: 'pointer',
                                border: tagColor === c ? '2px solid #fff' : '2px solid transparent',
                                transition: 'transform 0.1s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    ))}
                    {/* Clear color button */}
                    {tagColor && (
                        <>
                            <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
                            <div 
                                onClick={(e) => { e.stopPropagation(); onUpdateTag({ color: null }); setIsHovered(false); }}
                                style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={8} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        </>
                    )}
                </div>
            , document.body)}

            {/* RIGHT-CLICK: Delete Confirmation */}
            {showDeleteMenu && rect && createPortal(
                <div 
                    style={{
                        position: 'fixed', top: rect.top - 40, left: rect.left + (rect.width / 2), transform: 'translateX(-50%)',
                        background: 'var(--bg-panel)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 6, padding: 6, display: 'flex', gap: 6, zIndex: 999999,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.15s ease'
                    }}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); setShowDeleteMenu(false); }}
                        style={{
                            background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                            padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                        }}
                    >
                        <Trash2 size={10} /> Delete
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(false); }}
                        style={{
                            background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
                            padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            , document.body)}
        </div>
    );
}
