'use client'

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import PropTypes from 'prop-types';

const Globe = ({ globeData }) => {
  const meshRef = useRef();
  const [error, setError] = useState(null);
  
  const texture = useMemo(() => {
    return new THREE.TextureLoader().load('/world-map.jpg', 
      () => {
        console.log('Texture loaded successfully');
      },
      undefined,
      (err) => {
        console.error('Error loading texture:', err);
        setError('Failed to load world map texture');
      }
    );
  }, []);

  useEffect(() => {
    if (globeData && meshRef.current) {
      try {
        const geometry = meshRef.current.geometry;
        const positionAttribute = geometry.getAttribute('position');
        const colors = new Float32Array(positionAttribute.count * 3);

        for (let i = 0; i < positionAttribute.count; i++) {
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(positionAttribute, i);
          vertex.normalize();

          const lat = 90 - Math.acos(vertex.y) * 180 / Math.PI;
          const lon = (Math.atan2(-vertex.z, vertex.x) * 180 / Math.PI + 180) % 360 - 180;

          let color = new THREE.Color(0xcccccc); // Default color

          const existingCountry = globeData.existing.find(code => isPointInCountry(lat, lon, code));
          const potentialCountry = globeData.potential.find(code => isPointInCountry(lat, lon, code));
          const challengingCountry = globeData.challenging.find(code => isPointInCountry(lat, lon, code));

          if (existingCountry) {
            color.setHex(0xff0000); // Red for existing markets
          } else if (potentialCountry) {
            color.setHex(0x00ff00); // Green for potential markets (good fit)
          } else if (challengingCountry) {
            color.setHex(0xffff00); // Yellow for challenging or uncertain markets
          }

          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      } catch (err) {
        console.error('Error processing globe data:', err);
        setError('Error processing globe data: ' + err.message);
      }
    }
  }, [globeData]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={texture} vertexColors />
    </mesh>
  );
};

Globe.propTypes = {
  globeData: PropTypes.shape({
    existing: PropTypes.arrayOf(PropTypes.string).isRequired,
    potential: PropTypes.arrayOf(PropTypes.string).isRequired,
    challenging: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

const GlobeVisualization = ({ globeData, analysis, onClose }) => {
  console.log('Rendering GlobeVisualization with data:', globeData);
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex">
      <div className="w-3/4 h-full">
        <Canvas camera={{ position: [0, 0, 2.5] }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <Globe globeData={globeData} />
          <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        </Canvas>
      </div>
      <div className="w-1/4 bg-white p-4 overflow-auto">
        <h2 className="text-xl font-semibold mb-4 text-black">Global Market Analysis</h2>
        <div className="mb-4">
          <h3 className="font-semibold text-red-600">Existing Markets:</h3>
          <p className="text-black">{analysis.existing || 'No data available'}</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-green-600">Potential Markets:</h3>
          <p className="text-black">{analysis.potential || 'No data available'}</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-yellow-600">Challenging Markets:</h3>
          <p className="text-black">{analysis.challenging || 'No data available'}</p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

GlobeVisualization.propTypes = {
  globeData: PropTypes.shape({
    existing: PropTypes.arrayOf(PropTypes.string).isRequired,
    potential: PropTypes.arrayOf(PropTypes.string).isRequired,
    challenging: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  analysis: PropTypes.shape({
    existing: PropTypes.string,
    potential: PropTypes.string,
    challenging: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

// Expanded country boundaries (approximate)
const countryBoundaries = {
  'US': { minLat: 24.396308, maxLat: 49.384358, minLon: -125.000000, maxLon: -66.934570 },
  'CA': { minLat: 41.676556, maxLat: 83.110626, minLon: -141.002695, maxLon: -52.617711 },
  'GB': { minLat: 49.674, maxLat: 61.061, minLon: -8.648, maxLon: 1.768 },
  'FR': { minLat: 41.315, maxLat: 51.089, minLon: -5.142, maxLon: 9.662 },
  'DE': { minLat: 47.270, maxLat: 55.099, minLon: 5.866, maxLon: 15.042 },
  'JP': { minLat: 24.249, maxLat: 45.523, minLon: 122.934, maxLon: 153.987 },
  'AU': { minLat: -43.645, maxLat: -10.062, minLon: 113.338, maxLon: 153.569 },
  'BR': { minLat: -33.742, maxLat: 5.272, minLon: -73.985, maxLon: -34.793 },
  'IN': { minLat: 6.747, maxLat: 35.674, minLon: 68.162, maxLon: 97.395 },
  'CN': { minLat: 18.197, maxLat: 53.557, minLon: 73.498, maxLon: 134.773 },
  // Add more countries as needed
};

function isPointInCountry(lat, lon, countryCode) {
  const country = countryBoundaries[countryCode];
  if (!country) {
    console.warn(`Country code ${countryCode} not found in boundaries`);
    return false;
  }
  return lat >= country.minLat && lat <= country.maxLat && lon >= country.minLon && lon <= country.maxLon;
}

export default GlobeVisualization;