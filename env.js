/**
 * Crunchyroll Watch Party .env Yardımcı Dosyası
 * 
 * Bu dosya, .env dosyasından ortam değişkenlerini 
 * yükleyip kullanılabilir hale getirir.
 * 
 * Not: Chrome uzantıları doğrudan process.env'e erişemediğinden
 * bir yardımcı fonksiyon kullanıyoruz.
 */

// Gerekli değişkenleri kontrol et ve varsayılan değerleri tanımla
function getEnvVars() {
  try {
    // .env dosyası yüklenmişse değerleri al
    // Burada normalde dotenv gibi bir kütüphane kullanılabilir
    // Ancak basit bir örnek yapısı kullanacağız
    
    // Yayın ortamı için sabit değerleri tanımla
    // Bu değerler normalde .env dosyasından yüklenecek
    const ENV_VARS = {
      // Ortam
      ENVIRONMENT: 'production',
      
      // Sunucu adresleri
      WS_SERVER_DEV: 'ws://localhost:3000',
      WS_SERVER_TEST: 'wss://test-server.example.com',
      WS_SERVER_PROD: 'wss://crunchyroll-watch-party-restless-grass-5027.fly.dev',
      
      // Diğer değişkenler
      DEBUG: false,
      VERSION: '1.0.0'
    };
    
    // Aktif ortama göre sunucu adresini seç
    const environment = ENV_VARS.ENVIRONMENT;
    
    let httpserver;
    switch(environment) {
      case 'development':
        httpserver = ENV_VARS.WS_SERVER_DEV;
        break;
      case 'test':
        httpserver = ENV_VARS.WS_SERVER_TEST;
        break;
      case 'production':
      default:
        httpserver = ENV_VARS.WS_SERVER_PROD;
    }
    
    return {
      ENVIRONMENT: environment,
      WS_SERVER: httpserver,
      DEBUG: ENV_VARS.DEBUG,
      VERSION: ENV_VARS.VERSION
    };
  } catch (error) {
    console.error('Ortam değişkenleri yüklenirken hata:', error);
    
    // Hata durumunda varsayılan değerleri kullan
    return {
      ENVIRONMENT: 'production',
      WS_SERVER: 'https://crunchyroll-watch-party-restless-grass-5027.fly.dev',
      DEBUG: false,
      VERSION: '1.0.0'
    };
  }
}

// Ortam değişkenlerini dışa aktar
export const env = getEnvVars();
export const WS_SERVER = env.WS_SERVER;
export const ENV = env.ENVIRONMENT;
export const DEBUG = env.DEBUG;
export const VERSION = env.VERSION; 