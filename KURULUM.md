# Crunchyroll Watch Party Kurulum Kılavuzu

Bu uzantı, Crunchyroll platformunda arkadaşlarınızla senkronize bir şekilde anime izlemenizi sağlar.

## Geliştirici Modunda Kurulum

1. Bu projenin tüm dosyalarını bilgisayarınıza indirin
2. Chrome tarayıcınızı açın
3. Adres çubuğuna `chrome://extensions` yazın ve Enter tuşuna basın
4. Sağ üst köşedeki "Geliştirici modu" seçeneğini etkinleştirin
5. "Paketlenmemiş öğe yükle" butonuna tıklayın
6. İndirdiğiniz proje klasörünü seçin
7. Uzantı başarıyla yüklenecektir

## Kullanım

1. Crunchyroll'da izlemek istediğiniz animeyi açın
2. Uzantı simgesine tıklayarak Watch Party panelini açın
3. "Parti Oluştur" butonuna tıklayarak yeni bir izleme partisi oluşturun
4. Size verilen Parti ID'sini arkadaşlarınızla paylaşın
5. Arkadaşlarınız "Partiye Katıl" butonuna tıklayıp bu ID'yi girerek partinize katılabilirler
6. Artık videoyu senkronize bir şekilde izleyebilir ve sohbet edebilirsiniz

## Notlar

- Bu uzantı sadece Crunchyroll.com sitesinde çalışır
- Senkronizasyon için ana kullanıcı (host) internet bağlantısı önemlidir
- Video oynatma/duraklatma ve zaman değişiklikleri otomatik olarak senkronize edilir

## Sorun Giderme

Eğer uzantı düzgün çalışmıyorsa:

1. Sayfayı yenilemeyi deneyin
2. Uzantıyı devre dışı bırakıp tekrar etkinleştirin
3. Tarayıcıyı kapatıp açın
4. Uzantıyı kaldırıp tekrar yükleyin

## Geliştirme

Bu uzantı şu anda temel özelliklerle demo amaçlı oluşturulmuştur. Tam işlevsel bir uygulama için:

1. Gerçek bir sunucu altyapısı (Node.js, Socket.io vb.) kurulmalıdır
2. WebRTC veya WebSocket teknolojileri ile gerçek zamanlı iletişim sağlanmalıdır
3. Kullanıcı kimlik doğrulama sistemi eklenmelidir
4. Güvenlik önlemleri alınmalıdır

## Sunucu Yapılandırması

Uzantının sunucu adresini yapılandırmak için:

1. `config.example.js` dosyasını `config.js` olarak kopyalayın
2. `config.js` dosyasındaki sunucu adreslerini kendi ortamınıza göre güncelleyin
3. Çalışma ortamını belirlemek için `ENVIRONMENT` değişkenini ayarlayın:
   - `development`: Yerel geliştirme ortamı (örn. localhost)
   - `test`: Test ortamı
   - `production`: Yayın ortamı

Örnek:
```javascript
// config.js
const CONFIG = {
  development: {
    WS_SERVER: 'ws://localhost:3000'
  },
  production: {
    WS_SERVER: 'wss://your-production-server.com'
  }
};

// Aktif çalışma ortamını belirle ('development' veya 'production')
const ENVIRONMENT = 'development';

export const WS_SERVER = CONFIG[ENVIRONMENT].WS_SERVER;
export const ENV = ENVIRONMENT;
```

Not: `config.js` dosyası `.gitignore` listesinde olduğundan GitHub'a yüklenmez. Bu, özel sunucu adreslerinizin gizli kalmasını sağlar.

## .env Dosyası ile Yapılandırma (Alternatif)

Config.js kullanımına alternatif olarak .env dosyası da kullanabilirsiniz:

1. `.env.example` dosyasını `.env` olarak kopyalayın
2. `.env` dosyasındaki değerleri kendi ortamınıza göre düzenleyin
3. Uzantıda `background.js` dosyasını şu şekilde güncelleyin:

```javascript
// background.js
import { WS_SERVER, ENV } from './config.js';
```

yerine:

```javascript
// background.js
import { WS_SERVER, ENV } from './env.js';
```

Bu değişikliği yapmak, uzantının yapılandırma bilgilerini `.env` dosyasından okumasını sağlayacaktır.

Not: `.env` dosyası da `.gitignore` içinde tanımlanmıştır, bu nedenle GitHub'a yüklenmez.

## Fly.io Sunucu Yapılandırması

Uzantı, varsayılan olarak aşağıdaki Fly.io WebSocket sunucusunu kullanmaktadır:

`wss://crunchyroll-watch-party-restless-grass-5027.fly.dev`

Kendi sunucunuzu oluşturmak isterseniz, Fly.io veya benzeri bir platformda şu adımları izleyin:

1. Hesap oluşturun ve Fly CLI'ı yükleyin (`npm install -g @fly/fly`)
2. Repository içindeki `server.js` dosyasını kullanarak bir proje oluşturun
3. `fly launch` komutunu çalıştırın
4. Oluşturduğunuz sunucu adresini `config.js` dosyasında güncelleyin

WebSocket sunucunuz başarıyla deploy edildikten sonra, aşağıdaki formatla `config.js` dosyasını güncellemeniz gerekir:

```javascript
production: {
  WS_SERVER: 'wss://sizin-sunucu-adiniz.fly.dev'
}
``` 