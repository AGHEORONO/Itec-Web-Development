import React from 'react';

export default function ImageViewer({ dataUrl, filename }) {
    if (!dataUrl.startsWith('data:image/')) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', height: '100%', color: '#f87171', background: '#1e1e1e', fontFamily: 'monospace'
            }}>
                <p>Error: Invalid image data format or file is corrupted.</p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            overflow: 'auto',
            background: '#1e1e1e',
            color: '#e5e5e5',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                marginBottom: '20px',
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                opacity: 0.8
            }}>
                {filename}
            </div>
            
            <div style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'%23303030\' d=\'M0 0h8v8H0zm8 8h8v8H8z\'/%3E%3Cpath fill=\'%23404040\' d=\'M8 0h8v8H8zM0 8h8v8H0z\'/%3E%3C/svg%3E")',
                backgroundColor: '#2b2b2b',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                borderRadius: '8px',
                overflow: 'hidden',
                padding: '0',
                border: '1px solid #444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <img 
                    src={dataUrl} 
                    alt={filename} 
                    style={{ 
                        maxWidth: '80vw', 
                        maxHeight: '70vh', 
                        display: 'block', 
                        objectFit: 'contain',
                        minWidth: '50px',
                        minHeight: '50px'
                    }} 
                />
            </div>
        </div>
    );
}

