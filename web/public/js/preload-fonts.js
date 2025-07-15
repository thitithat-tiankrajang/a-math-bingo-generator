// public/js/preload-fonts.js
// Script สำหรับ preload ฟอนต์ไทย

(function() {
    // Preload Thai font
    const loadThaiFont = async () => {
      try {
        const response = await fetch('/font/THSarabunNew.ttf');
        const fontArrayBuffer = await response.arrayBuffer();
        
        // Convert to base64
        const fontBase64 = arrayBufferToBase64(fontArrayBuffer);
        
        // Store in window for later use
        window.thaiFont = fontBase64;
        
        // Dispatch event to notify components
        window.dispatchEvent(new CustomEvent('thaiFontLoaded', { 
          detail: { fontBase64 } 
        }));
        
      } catch (error) {
        alert(error);
      }
    };
    
    // Helper function
    function arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
    
    // Load font when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadThaiFont);
    } else {
      loadThaiFont();
    }
  })();