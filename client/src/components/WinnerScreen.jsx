import React, { useEffect, useRef } from 'react';
import { Trophy, Home, Sun, Moon } from 'lucide-react';

export default function WinnerScreen({ isDark, onToggleTheme }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let animationId;
        let ripples = [];

        // Gold & Purple Theme Colors for Winner
        const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#a855f7', '#d946ef'];
        let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            mouse.x = window.innerWidth / 2;
            mouse.y = window.innerHeight / 2;
        };
        window.addEventListener('resize', resize);
        resize();

        const spawnRipple = (x, y) => {
            ripples.push({
                x: x,
                y: y,
                radius: 5,
                maxRadius: Math.random() * 100 + 100, // Expands larger
                speed: Math.random() * 2 + 1.5,
                alpha: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        };

        // Auto spawn ripples for extra celebration
        const autoSpawnInterval = setInterval(() => {
            spawnRipple(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight
            );
        }, 300);

        const moveHandler = (e) => {
           spawnRipple(e.clientX, e.clientY);
        };

        window.addEventListener('mousemove', moveHandler);

        const render = () => {
           ctx.clearRect(0, 0, canvas.width, canvas.height);

           for (let i = ripples.length - 1; i >= 0; i--) {
              let r = ripples[i];

              r.radius += r.speed;
              r.alpha = 1.0 - (r.radius / r.maxRadius);

              if (r.alpha <= 0) {
                  ripples.splice(i, 1);
                  continue;
              }

              ctx.globalAlpha = Math.max(0, r.alpha * 0.9);
              ctx.beginPath();
              ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
              ctx.strokeStyle = r.color;
              ctx.lineWidth = 2.5;
              ctx.stroke();
           }
           ctx.globalAlpha = 1.0;

           animationId = requestAnimationFrame(render);
        };
        render();

        return () => {
           window.removeEventListener('resize', resize);
           window.removeEventListener('mousemove', moveHandler);
           clearInterval(autoSpawnInterval);
           cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div className="animate-fade-in" style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            transition: 'background .7s'
        }}>
            <canvas 
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: isDark ? 0.8 : 1.0
                }}
            />

            <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                padding: '3rem',
                borderRadius: '2rem',
                background: 'rgba(20, 20, 30, 0.4)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 20px 80px rgba(245, 158, 11, 0.15)',
                userSelect: 'none'
            }}>
                <Trophy size={80} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))' }} />

                <h1 style={{
                    fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                    fontWeight: 900,
                    textAlign: 'center',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    margin: 0,
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d946ef 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0px 4px 12px rgba(245, 158, 11, 0.3))'
                }}>
                    CONGRATULATIONS!
                </h1>

                <p style={{
                    maxWidth: 500,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                    lineHeight: 1.6,
                    margin: 0,
                    fontWeight: 500,
                }}>
                    You found the secret winner room. <br/> Excellent work exploring the application.
                </p>

                <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                        marginTop: 16,
                        backgroundColor: '#fbbf24',
                        color: '#000',
                        fontSize: 14,
                        fontWeight: 'bold',
                        padding: '14px 36px',
                        borderRadius: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 0.2s',
                        boxShadow: '0 0 30px rgba(251, 191, 36, 0.4)',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
                >
                    <Home size={16} /> Return to Home
                </button>
            </div>

            <button onClick={onToggleTheme} style={{
                position: 'absolute', top: 24, right: 24, padding: 16, borderRadius: '50%',
                border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--accent)', cursor: 'pointer',
                boxShadow: '0 0 50px rgba(0,0,0,.2)', transition: 'background .3s', zIndex: 20
            }}>
                {isDark ? <Sun size={24} /> : <Moon size={24} />}
            </button>
        </div>
    );
}
