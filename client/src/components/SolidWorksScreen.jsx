import React, { useEffect, useRef, useState } from 'react';
import { Box, Wrench, Settings, Layers, Minimize2, X, Move, Rotate3d, MousePointer2 } from 'lucide-react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function SolidWorksScreen({ file, onClose }) {
    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const [showOopsie, setShowOopsie] = useState(true);
    const isStep = file?.name?.toLowerCase().endsWith('.step');

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = canvasContainerRef.current;
        if (!canvas || !container || isStep) return;

        // --- THREE.JS SETUP ---
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0); // Transparent so our CSS gradient shows

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);
        camera.position.set(0, -100, 100);
        camera.up.set(0, 0, 1); // Z is usually up in CAD

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lights mimicking SolidWorks soft studio environment
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(100, 100, 100);
        scene.add(dirLight);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight2.position.set(-100, -100, 50);
        scene.add(dirLight2);

        // Load actual STL
        let objectUrl = null;
        if (file?.file && !isStep) {
            const loader = new STLLoader();
            objectUrl = URL.createObjectURL(file.file);
            
            loader.load(objectUrl, (geometry) => {
                // Typical generic gray SolidWorks material
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0x95a5a6, 
                    metalness: 0.2,
                    roughness: 0.5,
                    polygonOffset: true,
                    polygonOffsetFactor: 1, // Pull polygons back to allow lines to show nicely
                    polygonOffsetUnits: 1
                });
                
                const mesh = new THREE.Mesh(geometry, material);
                
                // Center the part
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox.getCenter(center);
                mesh.position.sub(center); 
                
                // Add soft edges (SolidWorks "Shaded with Edges" mode)
                const edges = new THREE.EdgesGeometry(geometry, 25);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x2c3e50, opacity: 0.3, transparent: true }));
                mesh.add(line);

                scene.add(mesh);
                
                // Auto-fit camera to part size
                const size = new THREE.Vector3();
                geometry.boundingBox.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                
                camera.position.set(maxDim * 1.5, -maxDim * 1.5, maxDim * 1.5);
                controls.target.set(0, 0, 0);
                controls.update();

                // Small XYZ axis at the origin just for fun
                const axesHelper = new THREE.AxesHelper(maxDim * 0.5);
                scene.add(axesHelper);
            });
        }

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            renderer.dispose();
            window.removeEventListener('resize', handleResize);
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file, isStep]);

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 10 }}><Rotate3d size={14} color="#2980b9" /> Imported Body 1</div>
                    </div>
                </div>
                
                {/* Main Viewport */}
                <div ref={canvasContainerRef} style={{ 
                    flex: 1, position: 'relative',
                    background: 'linear-gradient(to bottom, #ffffff 0%, #a1b4c6 100%)' // Solidworks classic background
                }}>
                    {!isStep && <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />}
                    {isStep && (
                        <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                            <i>No geometry loaded. Please import an STL.</i>
                        </div>
                    )}
                    
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
                                
                                {isStep ? (
                                    <p style={{ fontSize: 12, margin: 0, color: '#333', lineHeight: 1.5 }}>
                                        <b>STEP files</b> are mathematically complex NURBS configurations that require heavy background computational kernels to evaluate.<br/><br/>
                                        Since this is the web browser, your computer would literally explode trying to parse this. <b>Please politely ask the Mechanical/Hardware team to export the file as `.STL`</b> and try again!
                                    </p>
                                ) : (
                                    <p style={{ fontSize: 12, margin: 0, color: '#333', lineHeight: 1.5 }}>
                                        It appears you dragged a <b>.STL</b> 3D mesh into a Web Collaborative Code Editor IDE...<br/><br/>
                                        Switching interface graphics buffer to full CAD visualization mode to prevent UI memory-corruption layout crashes. Have fun orbiting your part!
                                    </p>
                                )}
                            </div>
                        </div>
                        <div style={{ background: '#ecf0f1', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #bdc3c7' }}>
                            <button onClick={() => setShowOopsie(false)} style={{ padding: '6px 20px', background: '#e1e1e1', border: '1px solid #999', cursor: 'pointer', fontSize: 12 }}>Okay, I understand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
