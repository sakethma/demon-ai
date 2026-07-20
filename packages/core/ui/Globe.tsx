import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { demonTheme } from '../theme/tokens';

export const Globe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(demonTheme.colors.background);
    scene.fog = new THREE.Fog(demonTheme.colors.background, 10, 50);

    // Camera Setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Globe Geometry & Material
    const geometry = new THREE.IcosahedronGeometry(8, 12); // High-poly sphere approximation
    const material = new THREE.MeshBasicMaterial({
      color: demonTheme.colors.dotPrimary,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Inner Core
    const innerGeometry = new THREE.IcosahedronGeometry(7.5, 4);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: demonTheme.colors.background,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    });
    const innerGlobe = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerGlobe);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Gentle rotation
      globe.rotation.y += 0.001;
      globe.rotation.x += 0.0005;
      
      innerGlobe.rotation.y -= 0.0008;
      innerGlobe.rotation.z += 0.0004;

      // Dynamic breathing effect based on time
      const time = Date.now() * 0.001;
      const scale = 1 + Math.sin(time) * 0.02;
      globe.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: -1 }} />;
};
