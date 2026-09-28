'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Basic Three.js setup
    const scene = new THREE.Scene();
    
    // Transparent background
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    // Position camera
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Create a group to hold objects
    const group = new THREE.Group();
    scene.add(group);

    // Create a stylized geometric shape (Icosahedron)
    const geometry = new THREE.IcosahedronGeometry(2.5, 0);
    
    // Wireframe outer shell
    const materialWire = new THREE.MeshBasicMaterial({
      color: 0x2563eb, // var(--color-accent)
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    
    // Solid inner shell with nice lighting
    const materialSolid = new THREE.MeshStandardMaterial({
      color: 0xdbeafe, // var(--color-accent-light)
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
    });

    const meshWire = new THREE.Mesh(geometry, materialWire);
    const meshSolid = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3, 0), materialSolid);
    
    group.add(meshWire);
    group.add(meshSolid);

    // Add smaller floating cubes
    for (let i = 0; i < 8; i++) {
      const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.7,
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      
      // Random positions around the main shape
      const radius = 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      cube.position.x = radius * Math.sin(phi) * Math.cos(theta);
      cube.position.y = radius * Math.sin(phi) * Math.sin(theta);
      cube.position.z = radius * Math.cos(phi);
      
      // Random rotation
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      
      group.add(cube);
    }

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x2563eb, 1);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Animation Loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.005;

      // Rotate group
      group.rotation.x = time * 0.5;
      group.rotation.y = time * 0.8;

      // Float effect on group
      group.position.y = Math.sin(time * 2) * 0.2;

      // Rotate individual cubes slightly
      for (let i = 2; i < group.children.length; i++) {
        group.children[i].rotation.x += 0.01;
        group.children[i].rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      materialWire.dispose();
      materialSolid.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
