import { useState } from 'react';
import { Users, Play, Sun, Moon } from 'lucide-react';

export default function NameModal({ onSubmit, isDark, onToggleTheme }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const v = name.trim() || `Dev-${Math.floor(Math.random() * 100)}`;
        onSubmit(v);
    };

    return (
        <div className="animate-fade-in" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw',
            background: 'var(--bg-app)', position: 'relative', overflow: 'hidden', transition: 'background .7s'
        }}>
            {/* Glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400,
                background: `linear-gradient(135deg,var(--glow-from),var(--glow-to))`, filter: 'blur(150px)', borderRadius: '50%', opacity: .3, pointerEvents: 'none'
            }} />

            <form onSubmit={handleSubmit} style={{
                position: 'relative', zIndex: 10, width: 420, padding: '2.5rem', borderRadius: 20,
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                backdropFilter: 'blur(40px)', boxShadow: '0 0 50px rgba(0,0,0,.2)'
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-input)', border: '1px solid var(--border)', marginBottom: 32
                }}>
                    <Users size={24} color="var(--accent)" />
                </div>

                <h1 style={{
                    fontSize: 28, fontWeight: 800, marginBottom: 10,
                    background: 'linear-gradient(135deg,#c084fc,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    Enter your name
                </h1>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
                    Connect to the network with a name to receive an automatic vibrant P2P visual identifier.
                </p>

                <input
                    type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: John Doe" autoFocus maxLength={20}
                    style={{
                        width: '100%', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)',
                        background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 24,
                        transition: 'border .3s,box-shadow .3s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />

                <button type="submit" style={{
                    width: '100%', padding: '16px 0', borderRadius: 12, border: '1px solid rgba(168,85,247,.3)',
                    background: 'var(--bg-primary-solid)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 20px rgba(168,85,247,.4)', transition: 'transform .15s'
                }}>
                    Confirm Name <Play size={12} fill="white" />
                </button>
            </form>

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
