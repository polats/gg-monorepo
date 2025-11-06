import { useGLTF } from '@react-three/drei';

// Configure Draco decoder to use local files instead of external CDN
// This must be called before any GLTF models are loaded
useGLTF.setDecoderPath('/draco/');
