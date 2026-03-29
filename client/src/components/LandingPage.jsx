import React, { useEffect, useRef } from 'react';
import { ArrowRight, Code2, Sun, Moon } from 'lucide-react';

export default function LandingPage({ onStart, isDark, onToggleTheme }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let ripples = [];
    
    // Gradient Theme Colors (Light Blue to Purple)
    const colors = ['#4facfe', '#6c8fff', '#ab3cff', '#8f5fff'];
    let mouse = { x: -1000, y: -1000 };
    let lastSpawnCoords = { x: -1000, y: -1000 };
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const spawnRipple = (x, y) => {
        ripples.push({
            x: x,
            y: y,
            radius: 2,
            maxRadius: Math.random() * 40 + 50, // Expands 50-90px
            speed: Math.random() * 1.2 + 1.0,  // Expansion speed
            alpha: 1.0,
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    };
    
    const moveHandler = (e) => {
       mouse.x = e.clientX;
       mouse.y = e.clientY;
       
       if (lastSpawnCoords.x === -1000) {
           spawnRipple(mouse.x, mouse.y);
           lastSpawnCoords.x = mouse.x;
           lastSpawnCoords.y = mouse.y;
       } else {
           // Only drop a ripple if mouse moved far enough (avoids clutter)
           const dx = mouse.x - lastSpawnCoords.x;
           const dy = mouse.y - lastSpawnCoords.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if (dist > 25) { // Spawn every 25 pixels of movement
               spawnRipple(mouse.x, mouse.y);
               lastSpawnCoords.x = mouse.x;
               lastSpawnCoords.y = mouse.y;
           }
       }
    };
    
    const leaveHandler = () => {
       mouse.x = -1000;
       mouse.y = -1000;
       lastSpawnCoords.x = -1000;
       lastSpawnCoords.y = -1000;
    };
    
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseout', leaveHandler);
    
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
          
          ctx.globalAlpha = Math.max(0, r.alpha * 0.8); // slight base transparency
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
       }
       ctx.globalAlpha = 1.0;
       
       animationId = requestAnimationFrame(render);
    };
    render();
    
    return () => {
       window.removeEventListener('resize', resize);
       window.removeEventListener('mousemove', moveHandler);
       window.removeEventListener('mouseout', leaveHandler);
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
      {/* Interactive AntiGravity Splash Canvas */}
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
          opacity: isDark ? 0.7 : 0.95
        }}
      />

      {/* Top Badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '6px 16px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--text-primary)',
        marginBottom: 32,
        backdropFilter: 'blur(4px)',
        userSelect: 'none'
      }}>
        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{"</>"}</span>
        <span>iTECify Web Development</span>
      </div>

      {/* Main Typography */}
      <h1 style={{
        fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
        fontWeight: 800,
        textAlign: 'center',
        letterSpacing: '-0.025em',
        lineHeight: 1.1,
        marginBottom: 24,
        zIndex: 10,
        userSelect: 'none'
      }}>
        <span style={{ color: 'var(--text-primary)' }}>Code Together,</span>
        <br />
        <span style={{
          background: 'linear-gradient(to right, #4facfe, #ab3cff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Smarter & Faster.
        </span>
      </h1>

      {/* Subtitle */}
      <p style={{
        maxWidth: 600,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 'clamp(0.875rem, 2vw, 15px)',
        lineHeight: 1.6,
        marginBottom: 40,
        zIndex: 10,
        fontWeight: 500,
        padding: '0 16px'
      }}>
        The ultimate platform for team collaboration. Real-time code editing, integrated artificial intelligence, and secure execution, designed for victory.
      </p>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        zIndex: 10
      }}>
        <button 
          onClick={onStart}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: 13,
            fontWeight: 'bold',
            padding: '12px 32px',
            borderRadius: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s',
            boxShadow: '0 0 20px rgba(59,130,246,0.2)',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          Open Workspace <ArrowRight size={16} />
        </button>
        <button 
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 'bold',
            padding: '12px 32px',
            borderRadius: 9999,
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-panel)'; e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          Learn More
        </button>
      </div>

      {/* Bottom Left Logo Circle */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        width: 40,
        height: 40,
        backgroundColor: '#000',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        userSelect: 'none'
      }}>
        <Code2 size={16} color="rgba(255, 255, 255, 0.7)" />
      </div>

      {/* Dark/Light toggle */}
      <button onClick={onToggleTheme} style={{
          position: 'absolute', top: 24, right: 24, padding: 16, borderRadius: '50%',
          border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--accent)', cursor: 'pointer',
          boxShadow: '0 0 50px rgba(0,0,0,.2)', transition: 'background .3s'
      }}>
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>
  );
}
