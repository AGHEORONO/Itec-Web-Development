import React, { useEffect, useRef, useState } from 'react';
import { Box, Wrench, Settings, Layers, Minimize2, X, Move, Rotate3d, MousePointer2 } from 'lucide-react';

export default function SolidWorksScreen({ file, onClose }) {
    const canvasRef = useRef(null);
    const [showOopsie, setShowOopsie] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Simple 3D projection engine for a spinning cube to simulate a CAD render
        let angleX = 0.5;
        let angleY = 0.5;
        let animationId;
        
        const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
        
        const edges = [
            [0,1], [1,2], [2,3], [3,0], // back
            [4,5], [5,6], [6,7], [7,4], // front
            [0,4], [1,5], [2,6], [3,7]  // connectors
        ];

        const render = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            
            ctx.fillStyle = '#b3c3d0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw gradient background like solidworks viewport
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, '#a1b4c6');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const scale = Math.min(cx, cy) * 0.5;
            
            angleX += 0.005;
            angleY += 0.01;
            
            const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
            const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
            
            const projected = vertices.map(v => {
                let x = v[0], y = v[1], z = v[2];
                let x1 = x * cosY - z * sinY;
                let z1 = x * sinY + z * cosY;
                let y1 = y * cosX - z1 * sinX;
                let z2 = y * sinX + z1 * cosX;
                let p = 2 / (3 + z2);
                return [cx + x1 * p * scale, cy + y1 * p * scale];
            });
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            
            edges.forEach(e => {
                ctx.beginPath();
                ctx.moveTo(projected[e[0]][0], projected[e[0]][1]);
                ctx.lineTo(projected[e[1]][0], projected[e[1]][1]);
                ctx.stroke();
            });
            
            // Draw XYZ axis bottom left
            ctx.strokeStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(50, canvas.height-50); ctx.lineTo(100, canvas.height-50); ctx.stroke();
            ctx.strokeStyle = '#27ae60'; ctx.beginPath(); ctx.moveTo(50, canvas.height-50); ctx.lineTo(50, canvas.height-100); ctx.stroke();
            ctx.strokeStyle = '#2980b9'; ctx.beginPath(); ctx.moveTo(50, canvas.height-50); ctx.lineTo(25, canvas.height-25); ctx.stroke();
            
            animationId = requestAnimationFrame(render);
        };
        render();
        
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#e0e0e0', zIndex: 999999, display: 'flex', flexDirection: 'column',
            fontFamily: 'Segoe UI, Tahoma, sans-serif'
        }}>
            {/* Top Toolbar */}
            <div style={{ height: 40, background: '#f5f5f5', borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 10 }}>
                <div style={{ width: 20, height: 20, background: '#c0392b', color: '#fff', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>SW</div>
                <span style={{ fontSize: 13, color: '#333' }}>SolidWorks 2024 - [{file?.name || 'Part1.SLDPRT'}]</span>
                <div style={{ flex: 1 }} />
                <button onClick={onClose} style={{ background: '#e74c3c', border: '1px solid #c0392b', color: '#fff', padding: '4px 10px', cursor: 'pointer', borderRadius: 2, fontSize: 12 }}>X Exit CAD Mode</button>
            </div>
            
            {/* Ribbon */}
            <div style={{ height: 80, background: '#fafafa', borderBottom: '1px solid #ccc', display: 'flex', gap: 20, padding: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 4, cursor: 'pointer', border: '1px solid transparent' }}>
                    <Box size={32} color="#2980b9" />
                    <span style={{ fontSize: 11, color: '#333' }}>Extruded Boss</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 4, cursor: 'pointer', border: '1px solid transparent' }}>
                    <Wrench size={32} color="#7f8c8d" />
                    <span style={{ fontSize: 11, color: '#333' }}>Features</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 4, cursor: 'pointer', border: '1px solid transparent' }}>
                    <Settings size={32} color="#7f8c8d" />
                    <span style={{ fontSize: 11, color: '#333' }}>Options</span>
                </div>
            </div>
            
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* Left Tree */}
                <div style={{ width: 250, background: '#ffffff', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 6, background: '#e1e5ea', borderBottom: '1px solid #ccc', fontWeight: 600, fontSize: 12 }}>FeatureManager Design Tree</div>
                    <div style={{ padding: 10, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={14} color="#facc15" /> {file?.name || 'Part1'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10 }}><Move size={14} color="#bdc3c7" /> Front Plane</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10 }}><Move size={14} color="#bdc3c7" /> Top Plane</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10 }}><Move size={14} color="#bdc3c7" /> Right Plane</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10 }}><Rotate3d size={14} color="#2980b9" /> Imported1</div>
                    </div>
                </div>
                
                {/* Main Viewport */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <canvas ref={canvasRef} style={{ display: 'block' }} />
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, background: 'rgba(255,255,255,0.7)', padding: 4, borderRadius: 4, border: '1px solid #bdc3c7' }}>
                        <MousePointer2 size={16} color="#34495e" />
                        <Minimize2 size={16} color="#34495e" />
                    </div>
                </div>
            </div>

            {/* Oopsie Modal */}
            {showOopsie && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{ background: '#fff', border: '1px solid #2980b9', display: 'flex', flexDirection: 'column', width: 450, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                        <div style={{ background: '#2980b9', color: '#fff', padding: '6px 10px', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                            <span>SolidWorks Warning</span>
                            <span style={{ cursor: 'pointer' }} onClick={() => setShowOopsie(false)}><X size={14} /></span>
                        </div>
                        <div style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 15 }}>
                            <div style={{ 
                                width: 36, height: 36, borderRadius: '50%', background: '#f1c40f', color: '#000', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, fontWeight: 'bold', border: '2px solid #f39c12' 
                            }}>!</div>
                            <div>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#34495e' }}>Oopsie proiectant!</h3>
                                <p style={{ fontSize: 12, margin: 0, color: '#333', lineHeight: 1.5 }}>
                                    It appears you dragged a <b>{file?.name?.endsWith('.step') ? 'STEP' : 'STL'}</b> file into a collaborative web IDE.<br/><br/>
                                    Switching interface to CAD Mode to prevent an existential software crisis. Rendering mesh geometry placeholder...
                                </p>
                            </div>
                        </div>
                        <div style={{ background: '#ecf0f1', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #bdc3c7' }}>
                            <button onClick={() => setShowOopsie(false)} style={{ padding: '6px 20px', background: '#e1e1e1', border: '1px solid #999', cursor: 'pointer', fontSize: 12 }}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
