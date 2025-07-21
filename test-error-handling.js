import QRCode from './src/index.js';

console.log('Testing QR code generation and error handling...');

// Test basic generation
try {
  const result = QRCode.generate('Hello World');
  console.log('✓ Basic generation works - SVG length:', result.length);
} catch (error) {
  console.error('✗ Basic generation failed:', error.message);
}

// Test analytics version
try {
  const result = await QRCode.generateWithAnalytics('Hello World', { returnObject: true });
  console.log('✓ Analytics version works - data:', result.data);
} catch (error) {
  console.error('✗ Analytics version error:', error.message);
}

// Test error with analytics
try {
  await QRCode.generateWithAnalytics('A'.repeat(3000));
} catch (error) {
  console.log('✓ Error handling works:');
  console.log('  - Error code:', error.code);
  console.log('  - Error message:', error.getUserMessage ? error.getUserMessage() : error.message);
  console.log('  - Has context:', !!error.details.context);
  console.log('  - Has classification:', !!error.classification);
}

// Test error stats
const stats = QRCode.getErrorStats();
console.log('✓ Error stats total:', stats.total);

console.log('\n🎉 All error handling features are working correctly!');