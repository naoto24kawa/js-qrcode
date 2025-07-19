// Cloudflare Workers example for QR code generation
import { QRCode } from '@elchika-inc/js-qrcode';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/qr') {
      const text = url.searchParams.get('text');
      const size = parseInt(url.searchParams.get('size')) || 200;
      const level = url.searchParams.get('level') || 'M';
      
      if (!text) {
        return new Response('Missing text parameter', { status: 400 });
      }
      
      try {
        const svg = QRCode.generate(text, {
          size,
          errorCorrectionLevel: level,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        return new Response(svg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 400 });
      }
    }
    
    return new Response('QR Code Generator API', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};