/**
 * Crunchyroll Watch Party Örnek Yapılandırma Dosyası
 * 
 * Yapılacaklar:
 * 1. Bu dosyayı "config.js" olarak kopyalayın.
 * 2. Kendi sunucu adresinizi üretim ortamı için güncelleyin.
 * 3. ENVIRONMENT değişkenini kullanım amacınıza göre değiştirin.
 * 
 * GÜVENLİK UYARISI:
 * Bu dosya sadece örnek amaçlıdır. config.js dosyası .gitignore'da yer alır ve 
 * GitHub'a gönderilmez. Bu, sunucu adreslerinizin gizli kalmasını sağlar.
 * Gerçek sunucu adresinizi ASLA public bir repo'ya yüklemeyiniz!
 */

// Sunucu adresleri (WebSocket)
const CONFIG = {
  // Geliştirme ortamı için sunucu adresi
  development: {
    WS_SERVER: 'ws://localhost:3000'
  },
  
  // Test ortamı için sunucu adresi
  test: {
    WS_SERVER: 'wss://YOUR_TEST_SERVER.example.com' // Kendi test sunucunuzu buraya girin
  },
  
  // Üretim ortamı için sunucu adresi
  production: {
    WS_SERVER: 'wss://YOUR_PRODUCTION_SERVER.example.com' // !!! Kendi üretim sunucu adresinizi buraya girin !!!
  }
};

// Aktif çalışma ortamını belirle
// 'development', 'test' veya 'production' olabilir
const ENVIRONMENT = 'development'; // !!! Kullanmak istediğiniz ortamı belirtin !!!

// Aktif ortama göre yapılandırmayı dışa aktar
export const WS_SERVER = CONFIG[ENVIRONMENT].WS_SERVER;

// Ortam bilgisini dışa aktar
export const ENV = ENVIRONMENT; 