import { useState, useRef } from 'react';
import { Users, Play, Sun, Moon, Image as ImageIcon, Type, User } from 'lucide-react';
import { USER_COLORS } from '../lib/collaboration';

export default function NameModal({ onSubmit, isDark, onToggleTheme, currentRoomId }) {
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState(currentRoomId || '');
    const [color, setColor] = useState(USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);
    const [avatarType, setAvatarType] = useState('letters'); // letters, icon, image
    const [avatarData, setAvatarData] = useState(null);
    
    const fileInputRef = useRef(null);
    const placeholder = isDark ? "Evil John Doe" : "Good John Doe";

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                
                // Keep aspect ratio & center crop
                const scale = Math.max(64 / img.width, 64 / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (64 - w) / 2;
                const y = (64 - h) / 2;
                
                ctx.drawImage(img, x, y, w, h);
                setAvatarData(canvas.toDataURL('image/jpeg', 0.8));
                setAvatarType('image'); // automatically switch type
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const v = name.trim() || placeholder;
        onSubmit({
            name: v,
            color,
            avatar: { type: avatarType, data: avatarData },
            roomCode
        });
    };

    return (
        <div className="animate-fade-in" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw',
            background: 'var(--bg-app)', position: 'relative', overflow: 'hidden', transition: 'background .7s'
        }}>
            {/* Glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400,
                background: `linear-gradient(135deg, ${color}, var(--glow-to))`, filter: 'blur(150px)', borderRadius: '50%', opacity: .3, pointerEvents: 'none', transition: 'background 0.3s'
            }} />

            <form onSubmit={handleSubmit} style={{
                position: 'relative', zIndex: 10, width: 440, padding: '2.5rem', borderRadius: 24,
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                backdropFilter: 'blur(40px)', boxShadow: '0 0 50px rgba(0,0,0,.2)'
            }}>
                {/* Header Profile Icon Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: avatarType === 'image' ? 'transparent' : color, border: `2px solid ${color}`,
                        boxShadow: `0 0 20px ${color}40`, overflow: 'hidden', transition: 'all 0.3s', color: '#fff', fontSize: 24, fontWeight: 800
                    }}>
                        {avatarType === 'image' && avatarData ? <img src={avatarData} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                         avatarType === 'icon' ? <User size={32} /> :
                         (name.trim() ? name.substring(0, 2).toUpperCase() : placeholder.substring(0, 2).toUpperCase())}
                    </div>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
                    Your Profile
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                    Customize your appearance before joining the collaboration session.
                </p>

                {/* Name Input */}
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</label>
                    <input
                        type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`Ex: ${placeholder}`} autoFocus maxLength={20}
                        style={{
                            width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)',
                            background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                            transition: 'all .3s'
                        }}
                        onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}30`; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                {/* Color Selection */}
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theme Color</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {USER_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setColor(c)}
                                style={{
                                    width: 24, height: 24, borderRadius: '50%', background: c, border: `2px solid ${color === c ? 'var(--text-primary)' : 'transparent'}`,
                                    cursor: 'pointer', transform: color === c ? 'scale(1.2)' : 'none', transition: 'transform 0.2s', padding: 0
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Avatar Type Selection */}
                <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avatar Style</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[{ id: 'letters', icon: Type, label: 'Initials' }, { id: 'icon', icon: User, label: 'Default' }].map(type => (
                            <button key={type.id} type="button" onClick={() => setAvatarType(type.id)}
                                style={{
                                    flex: 1, padding: '10px 0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                    background: avatarType === type.id ? 'var(--bg-primary-light)' : 'var(--bg-input)',
                                    border: `1px solid ${avatarType === type.id ? color : 'var(--border)'}`,
                                    color: avatarType === type.id ? color : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                <type.icon size={18} />
                                <span style={{ fontSize: 11, fontWeight: 600 }}>{type.label}</span>
                            </button>
                        ))}
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                background: avatarType === 'image' ? 'var(--bg-primary-light)' : 'var(--bg-input)',
                                border: `1px solid ${avatarType === 'image' ? color : 'var(--border)'}`,
                                color: avatarType === 'image' ? color : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                            <ImageIcon size={18} />
                            <span style={{ fontSize: 11, fontWeight: 600 }}>Upload</span>
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* Room Code */}
                <div style={{ marginBottom: 32 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Code (Auto-generated)</label>
                    <input
                        type="text" value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Paste room code to join"
                        style={{
                            width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)',
                            background: 'var(--bg-input)', color: 'var(--accent)', fontSize: 14, outline: 'none',
                            transition: 'all .3s', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em'
                        }}
                        onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}30`; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>

                <button type="submit" style={{
                    width: '100%', padding: '16px 0', borderRadius: 12, border: `1px solid ${color}80`,
                    background: color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: `0 0 20px ${color}60`, transition: 'transform .15s'
                }}>
                    Join Workspace <Play size={12} fill="white" />
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
