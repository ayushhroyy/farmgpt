// Simple test for vision AI
import { visionAI } from './src/integrations/ai/vision.ts';

// Create a simple test image (1x1 pixel PNG)
const createTestImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#00FF00'; // Green pixel to simulate farm
  ctx.fillRect(0, 0, 1, 1);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'test-farm.png', { type: 'image/png' });
      resolve(file);
    });
  });
};

// Test the vision AI
const testVisionAI = async () => {
  console.log('Testing Vision AI...');
  try {
    const testImage = await createTestImage();
    console.log('Test image created:', testImage);

    const result = await visionAI.analyzeImage(testImage);
    console.log('Analysis result:', result);

    if (result.isFarmRelated || result.isSunRelated) {
      console.log('✅ Test passed - AI detected content');
    } else {
      console.log('❌ Test failed - AI did not detect any content');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run test if this script is executed directly
if (typeof window !== 'undefined') {
  testVisionAI();
}
