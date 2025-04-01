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

# Sunucu Adreslerinin Gizlenmesi

## Güvenlik

Bu proje sunucu adreslerini public GitHub repo'sunda gizlenmesini sağlayacak şekilde tasarlanmıştır. Bu özellik şu nedenlerle önemlidir:

1. WebSocket sunucu adreslerinin açık kaynak kodunda görünmesi, sunucu üzerinde potansiyel DDoS veya istismar saldırılarına karşı savunmasız kılabilir.
2. Paylaşılan bir repo'da gerçek sunucu adreslerinin bulunması, sunucunuzun izinsiz kullanımına yol açabilir.

## Güvenli Yapılandırma

Güvenli bir şekilde sunucu adreslerini yapılandırmak için iki yöntem sunulmuştur:

### 1. config.js Yöntemi (Önerilen)

1. `config.example.js` dosyasını `config.js` olarak kopyalayın
2. `config.js` dosyasında üretim sunucu adresinizi güncelleyin
3. ENVIRONMENT değişkenini "production" olarak ayarlayın

Bu dosya, `.gitignore` listesinde olduğundan, GitHub'a gönderilmeyecektir. Bu şekilde sunucu adresleriniz gizli kalır.

### 2. Chrome Storage Yöntemi

Uzantının kurulum sırasında Chrome Storage'a sunucu adreslerini kaydetmesini sağlayabilirsiniz. Bu yöntem, farklı kullanıcıların uzantıyı farklı sunucu adresleriyle yapılandırmasına olanak tanır.

## Geliştirme Amaçlı Kullanım

Geliştirme ortamında çalışırken:

1. `config.js` dosyasında ENVIRONMENT değişkenini "development" olarak ayarlayabilirsiniz.
2. Bu durumda `ws://localhost:3000` adresi kullanılacak ve yerel geliştirme sunucunuza bağlanacaktır.

## Proje Paylaşımı

Bu projeyi fork ederek veya klonlayarak geliştirmeye devam ederken:
- `.gitignore` dosyasını **asla silmeyin** - bu `config.js` dosyasının yanlışlıkla paylaşılmasını önler
- GitHub'a push etmeden önce `env.js` dosyasının gerçek sunucu adreslerini içermediğinden emin olun
- Hassas bilgiler içeren diğer dosyaları `.gitignore` dosyasına eklemeyi unutmayın
