/**
 * Crunchyroll Watch Party .env Yardımcı Dosyası
 * 
 * Bu dosya, ortam değişkenlerini yükleyip kullanılabilir hale getirir.
 * Artık sunucu adresleri GitHub'da gizli tutulacak şekilde düzenlenmiştir.
 * 
 * Sunucu adresleri:
 * 1. Önce Chrome storage'da kontrol edilir
 * 2. Storage'da yoksa varsayılan geliştirici değerleri kullanılır
 */

// Gerekli değişkenleri kontrol et ve varsayılan değerleri tanımla
async function getEnvVars() {
  return new Promise((resolve) => {
    try {
      // Önce Chrome storage'dan sunucu adreslerini yüklemeyi dene
      chrome.storage.local.get(['serverConfig'], function(result) {
        // Varsayılan değerler (sadece geliştirme ortamı adresleri görünür)
        const DEFAULT_ENV = {
          // Ortam
          ENVIRONMENT: 'production',
          
          // Sunucu adresleri - sadece geliştirme adresi açık, diğerleri gizli
          WS_SERVER_DEV: 'ws://localhost:3000',
          WS_SERVER_TEST: 'HIDDEN_TEST_SERVER_URL', // Gizli
          WS_SERVER_PROD: 'HIDDEN_PRODUCTION_SERVER_URL', // Gizli
          
          // Diğer değişkenler
          DEBUG: false,
          VERSION: '1.0.0'
        };
        
        // Storage'dan okunan yapılandırma (varsa)
        const storageConfig = result.serverConfig || {};
        
        // Yapılandırmayı birleştir (storage'daki değerler öncelikli)
        const ENV_VARS = {
          ...DEFAULT_ENV,
          ...storageConfig
        };
        
        // Aktif ortama göre sunucu adresini seç
        const environment = ENV_VARS.ENVIRONMENT || 'production';
        
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
        
        // Eğer sunucu adresi "HIDDEN_" ile başlıyorsa (ve geliştirme ortamında değilsek),
        // bir uyarı logla ve kullanıcıya bildir
        if (httpserver.startsWith('HIDDEN_') && environment !== 'development') {
          console.warn('Sunucu adresi yapılandırılmamış! Güvenlik nedeniyle sunucu adresleri GitHub\'da saklanmaz.');
          console.warn('Lütfen uzantı yapılandırmasından veya config.js dosyasından gerçek sunucu adresini belirleyin.');
          
          // Yapılandırma eksik, geçici olarak demo sunucuya yönlendir
          // NOT: Bu değer de GitHub'da görünmeyecek, sadece örnek
          httpserver = 'wss://demo-server.example.com';
        }
        
        resolve({
          ENVIRONMENT: environment,
          WS_SERVER: httpserver,
          DEBUG: ENV_VARS.DEBUG || false,
          VERSION: ENV_VARS.VERSION || '1.0.0'
        });
      });
    } catch (error) {
      console.error('Ortam değişkenleri yüklenirken hata:', error);
      
      // Hata durumunda varsayılan değerleri kullan
      resolve({
        ENVIRONMENT: 'development',
        WS_SERVER: 'ws://localhost:3000', // Sadece geliştirme sunucusu görünür
        DEBUG: false,
        VERSION: '1.0.0'
      });
    }
  });
}

// Ortam değişkenlerini başlangıçta yükle
let env = {
  ENVIRONMENT: 'development',
  WS_SERVER: 'ws://localhost:3000',
  DEBUG: false,
  VERSION: '1.0.0'
};

// Değişkenleri yükle ve dışa aktar
getEnvVars().then(loadedEnv => {
  env = loadedEnv;
  console.log('Ortam değişkenleri yüklendi:', env.ENVIRONMENT);
});

// Dışa aktarılan değişkenler
export const getEnvironment = () => env;
export const WS_SERVER = () => env.WS_SERVER;
export const ENV = () => env.ENVIRONMENT;
export const DEBUG = () => env.DEBUG;
export const VERSION = () => env.VERSION; 