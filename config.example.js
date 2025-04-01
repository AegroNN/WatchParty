/**
 * Crunchyroll Watch Party Örnek Yapılandırma Dosyası
 * 
 * Yapılacaklar:
 * 1. Bu dosyayı "config.js" olarak kopyalayın.
 * 2. Kendi sunucu adresinizi veya geliştirme ortamınıza göre ayarları güncelleyin.
 * 3. ENVIRONMENT değişkenini kullanım amacınıza göre değiştirin.
 * 
 * Not: config.js dosyası .gitignore'da yer alır ve GitHub'a gönderilmez.
 * Bu şekilde yerel geliştirme ayarlarınız gizli kalır.
 */

// Sunucu adresleri (WebSocket)
const CONFIG = {
  // Geliştirme ortamı için sunucu adresi
  development: {
    WS_SERVER: 'ws://localhost:3000'
  },
  
  // Test ortamı için sunucu adresi
  test: {
    WS_SERVER: 'wss://test-server-url.example.com'
  },
  
  // Üretim ortamı için sunucu adresi
  production: {
    WS_SERVER: 'wss://crunchyroll-watch-party-restless-grass-5027.fly.dev'
  }
};

// Aktif çalışma ortamını belirle
// 'development', 'test' veya 'production' olabilir
const ENVIRONMENT = 'production';

// Aktif ortama göre yapılandırmayı dışa aktar
export const WS_SERVER = CONFIG[ENVIRONMENT].WS_SERVER;

// Ortam bilgisini dışa aktar
export const ENV = ENVIRONMENT; 