# Crunchyroll Watch Party

Crunchyroll platformunda arkadaşlarınızla senkronize bir şekilde anime izlemenizi sağlayan Chrome uzantısı.

## Özellikler
- Crunchyroll'da senkronize video oynatma
- Gerçek zamanlı sohbet
- Kolay kullanım ve bağlantı paylaşımı

## Kurulum

1. Bu repoyu klonlayın
2. `npm install` komutunu çalıştırın
3. `config.example.js` dosyasını `config.js` olarak kopyalayın ve gerekli ayarları yapın
4. Chrome uzantı sayfasına gidin (chrome://extensions)
5. Geliştirici modunu açın
6. "Paketlenmemiş öğe yükle" butonuna tıklayın
7. Bu klasörü seçin

## Sunucu

Bu uzantı, WebSocket sunucusu üzerinden farklı kullanıcılar arasında video senkronizasyonu sağlar. Sunucu, şu adreste barındırılmaktadır:

`https://crunchyroll-watch-party-restless-grass-5027.fly.dev`

Kendi sunucunuzu kurmak için:

1. `server.js` dosyasını kullanarak yerel veya uzak bir sunucu başlatabilirsiniz
2. `config.js` dosyasında sunucu adresini güncelleyebilirsiniz
3. Sunucu kodları [fly.io](https://fly.io) veya benzer platformlara deploy edilebilir
