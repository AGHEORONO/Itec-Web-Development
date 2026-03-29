import { useEffect, useState, useRef } from 'react';
import { Play, SkipBack, SkipForward, Clock, User } from 'lucide-react';

export default function Timeline({ undoManager, userName, userColor }) {
    const [history, setHistory] = useState({ undoLength: 0, redoLength: 0 });
    const railRef = useRef(null);

    useEffect(() => {
        if (!undoManager) {
            setHistory({ undoLength: 0, redoLength: 0 });
            return;
        }

        const updateState = () => {
            // Force an update to sync with the manager's stacks
            setHistory({
                undoLength: undoManager.undoStack.length,
                redoLength: undoManager.redoStack.length,
            });

            // Ensure we scroll to the playhead when it updates
            if (railRef.current) {
                setTimeout(() => {
                    const activeNode = railRef.current.querySelector('.timeline-node.active');
                    if (activeNode) {
                        activeNode.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                }, 50);
            }
        };

        // Initialize metadata for existing items
        undoManager.undoStack.forEach(item => {
            if (!item.meta.has('author')) {
                item.meta.set('author', userName);
                item.meta.set('color', userColor);
                item.meta.set('timestamp', Date.now());
            }
        });

        // Listen for additions to either track
        const onStackItemAdded = (event) => {
            // When an item is added (either a new edit, or a popped redo moving to undo, etc.)
            if (!event.stackItem.meta.has('author')) {
                event.stackItem.meta.set('author', userName);
                event.stackItem.meta.set('color', userColor);
                event.stackItem.meta.set('timestamp', Date.now());
            }
            updateState();
        };

        const onStackItemPopped = () => {
            updateState();
        };

        undoManager.on('stack-item-added', onStackItemAdded);
        undoManager.on('stack-item-popped', onStackItemPopped);
        
        // Initial setup
        updateState();

        return () => {
            undoManager.off('stack-item-added', onStackItemAdded);
            undoManager.off('stack-item-popped', onStackItemPopped);
        };
    }, [undoManager, userName, userColor]);

    if (!undoManager) return null;

    const totalNodes = history.undoLength + history.redoLength;
    const currentIndex = history.undoLength; // 0 means at the very beginning (everything is redone), totalNodes means at the very end

    // Handler to jump to a specific index
    const handleJumpTo = (targetIndex) => {
        if (targetIndex === currentIndex) return;

        if (targetIndex < currentIndex) {
            // We need to undo
            const undoSteps = currentIndex - targetIndex;
            for (let i = 0; i < undoSteps; i++) {
                if (undoManager.undoStack.length > 0) {
                    undoManager.undo();
                } else break;
            }
        } else {
            // We need to redo
            const redoSteps = targetIndex - currentIndex;
            for (let i = 0; i < redoSteps; i++) {
                if (undoManager.redoStack.length > 0) {
                    undoManager.redo();
                } else break;
            }
        }
    };

    const handleJumpToStart = () => {
        handleJumpTo(0);
    };

    const handleJumpToEnd = () => {
        handleJumpTo(totalNodes);
    };

    return (
        <div className="timeline-container" style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-header)',
            borderTop: '1px solid var(--border)',
            padding: '0 16px',
            gap: 12,
            userSelect: 'none',
            flexShrink: 0
        }}>
            {/* Left Controls */}
            <button 
                onClick={handleJumpToStart} 
                disabled={currentIndex === 0}
                className="timeline-btn"
                title="Jump to beginning"
            >
                <SkipBack size={14} />
            </button>
            <button 
                onClick={() => handleJumpTo(Math.max(0, currentIndex - 1))} 
                disabled={currentIndex === 0}
                className="timeline-btn"
                title="Undo (Ctrl+Z)"
            >
                ↩
            </button>

            {/* The Rail */}
            <div 
                ref={railRef}
                style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    position: 'relative',
                    padding: '0 40px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none',  /* IE and Edge */
                }}
                className="timeline-rail-scroll"
            >
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 40,
                    right: 40,
                    height: 2,
                    background: 'var(--border)',
                    transform: 'translateY(-50%)',
                    zIndex: 0
                }} />

                {/* Nodes Array */}
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    {/* "Base" Node (Start of history) */}
                    <TimelineNode 
                        isStart={true}
                        isActive={currentIndex === 0}
                        isFuture={false}
                        onClick={() => handleJumpTo(0)}
                    />

                    {/* Undo Stack (Past Nodes) */}
                    {undoManager.undoStack.map((item, idx) => (
                        <TimelineNode 
                            key={`undo-${idx}`}
                            item={item}
                            isActive={idx + 1 === currentIndex}
                            isFuture={false}
                            onClick={() => handleJumpTo(idx + 1)}
                            isLastPast={idx + 1 === currentIndex}
                        />
                    ))}

                    {/* Redo Stack (Future Nodes) Note: Redo stack in Yjs is typically reverse chronological, 
                        so the "next" redo is at the end of the array. Let's reverse it visually so the next redo is the first node to the right. */}
                    {[...undoManager.redoStack].reverse().map((item, idx) => {
                        const targetIdx = currentIndex + idx + 1;
                        return (
                            <TimelineNode 
                                key={`redo-${idx}`}
                                item={item}
                                isActive={false}
                                isFuture={true}
                                onClick={() => handleJumpTo(targetIdx)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Right Controls */}
            <button 
                onClick={() => handleJumpTo(Math.min(totalNodes, currentIndex + 1))} 
                disabled={currentIndex === totalNodes}
                className="timeline-btn"
                title="Redo (Ctrl+Y)"
            >
                ↪
            </button>
            <button 
                onClick={handleJumpToEnd} 
                disabled={currentIndex === totalNodes}
                className="timeline-btn"
                title="Jump to latest"
            >
                <SkipForward size={14} />
            </button>
        </div>
    );
}

function TimelineNode({ item, isActive, isFuture, isStart, onClick, isLastPast }) {
    const author = item ? item.meta.get('author') : 'Start';
    const color = item ? item.meta.get('color') || 'var(--accent)' : 'var(--text-muted)';
    const ts = item ? item.meta.get('timestamp') : null;

    let displayTime = '';
    if (ts) {
        const diffInSeconds = Math.floor((Date.now() - ts) / 1000);
        if (diffInSeconds < 60) displayTime = 'Just now';
        else if (diffInSeconds < 3600) displayTime = `${Math.floor(diffInSeconds / 60)}m ago`;
        else displayTime = `${Math.floor(diffInSeconds / 3600)}h ago`;
    }

    return (
        <div 
            className={`timeline-node-wrapper ${isFuture ? 'future' : ''} ${isActive ? 'active' : ''}`}
            onClick={onClick}
            title={isStart ? 'Initial State' : `${author}\n${displayTime}`}
        >
            <div 
                className={`timeline-connector ${isFuture ? 'dashed' : 'solid'}`} 
                style={{ 
                    width: 30, // Distance between nodes
                    height: 2,
                    background: isFuture ? 'transparent' : 'var(--accent)',
                    borderTop: isFuture ? '2px dashed var(--border)' : 'none',
                    marginRight: -2,
                    transition: 'all 0.3s'
                }} 
            />
            <div 
                className={`timeline-node ${isActive ? 'pulse-glow' : ''}`}
                style={{
                    width: isActive ? 16 : 10,
                    height: isActive ? 16 : 10,
                    borderRadius: '50%',
                    background: isActive ? 'var(--accent)' : (isFuture ? 'var(--bg-app)' : color),
                    border: `2px solid ${isActive ? '#fff' : (isFuture ? 'var(--border)' : color)}`,
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    opacity: isFuture ? 0.6 : 1,
                    boxShadow: isActive ? `0 0 12px ${color}` : 'none'
                }}
            />
        </div>
    );
}
