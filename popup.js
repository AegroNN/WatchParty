// Popup.js - Crunchyroll Watch Party

document.addEventListener('DOMContentLoaded', function () {
  // DOM Elementleri
  const headerUsername = document.getElementById('header-username');
  const partyUsername = document.getElementById('party-username');
  const mainScreen = document.getElementById('main-screen');
  const partyScreen = document.getElementById('party-screen');
  const mainButtons = document.getElementById('main-buttons');
  const usernameForm = document.getElementById('username-form');
  const usernameInput = document.getElementById('username-input');
  const saveUsernameBtn = document.getElementById('save-username-btn');
  const cancelUsernameBtn = document.getElementById('cancel-username-btn');
  const createPartyBtn = document.getElementById('create-party-btn');
  const joinPartyBtn = document.getElementById('join-party-btn');
  const leavePartyBtn = document.getElementById('leave-party-btn');
  const partyCodeDisplay = document.getElementById('party-code-display');
  const copyCodeBtn = document.getElementById('copy-code-btn');
  const partyNameDisplay = document.getElementById('party-name-display');
  const editPartyNameBtn = document.getElementById('edit-party-name-btn');
  const editPartyNameForm = document.getElementById('edit-party-name-form');
  const partyNameInput = document.getElementById('party-name-input');
  const savePartyNameBtn = document.getElementById('save-party-name-btn');
  const cancelPartyNameBtn = document.getElementById('cancel-party-name-btn');
  const joinPartyForm = document.getElementById('join-party-form');
  const partyCodeInput = document.getElementById('party-code-input');
  const confirmJoinBtn = document.getElementById('confirm-join-btn');
  const cancelJoinBtn = document.getElementById('cancel-join-btn');
  const membersList = document.getElementById('members-list');
  const toast = document.getElementById('toast');
  const initialLoadingOverlay = document.getElementById('initial-loading-overlay');
  const loadingStatus = initialLoadingOverlay.querySelector('.loading-status');
  const loadingSubstatus = initialLoadingOverlay.querySelector('.loading-substatus');
  
  // WebSocket durum paneliyle ilgili elementleri tanımla
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.className = 'debug-panel';
  debugPanel.style.display = 'none';
  
  const debugHeader = document.createElement('div');
  debugHeader.className = 'debug-header';
  debugHeader.innerHTML = '<span>WebSocket Durum Paneli</span><button id="close-debug">Kapat</button>';
  
  const debugContent = document.createElement('div');
  debugContent.className = 'debug-content';
  
  const serverStatusSection = document.createElement('div');
  serverStatusSection.className = 'debug-section';
  serverStatusSection.innerHTML = `
    <h3>Sunucu Bağlantısı</h3>
    <div id="server-status" class="status-unknown">Bilinmiyor</div>
    <div id="server-info">
      <p><strong>Adres:</strong> <span id="server-address">-</span></p>
      <p><strong>Son durum:</strong> <span id="server-last-status">-</span></p>
      <p><strong>Bağlantı zamanı:</strong> <span id="server-connection-time">-</span></p>
    </div>
  `;
  
  const serverMessagesSection = document.createElement('div');
  serverMessagesSection.className = 'debug-section';
  serverMessagesSection.innerHTML = `
    <h3>Son Mesajlar</h3>
    <div id="server-messages"></div>
  `;
  
  // Debug paneli yapısını oluştur
  debugContent.appendChild(serverStatusSection);
  debugContent.appendChild(serverMessagesSection);
  debugPanel.appendChild(debugHeader);
  debugPanel.appendChild(debugContent);
  
  // Debug butonunu oluştur
  const debugButton = document.createElement('button');
  debugButton.id = 'debug-button';
  debugButton.className = 'debug-toggle-button';
  debugButton.textContent = 'Bağlantı Durumu';
  
  // Body'ye debug paneli ve butonu ekle
  document.body.appendChild(debugPanel);
  document.body.appendChild(debugButton);
  
  // Debug paneli CSS stillerini ekle
  const debugStyles = document.createElement('style');
  debugStyles.textContent = `
    .debug-panel {
      position: fixed;
      top: 10%;
      left: 10%;
      width: 80%;
      height: 80%;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }
    
    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background-color: #f0f0f0;
      border-bottom: 1px solid #ccc;
    }
    
    .debug-header button {
      background-color: #ff6b6b;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .debug-content {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
    }
    
    .debug-section {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    
    .debug-section h3 {
      margin-top: 0;
      color: #333;
      font-size: 16px;
    }
    
    #server-status {
      padding: 5px 10px;
      display: inline-block;
      margin-bottom: 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .status-unknown {
      background-color: #999;
      color: white;
    }
    
    .status-connecting {
      background-color: #ffc107;
      color: black;
    }
    
    .status-connected {
      background-color: #4caf50;
      color: white;
    }
    
    .status-disconnected {
      background-color: #f44336;
      color: white;
    }
    
    .status-error {
      background-color: #9c27b0;
      color: white;
    }
    
    #server-messages {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ccc;
      padding: 8px;
      border-radius: 4px;
      background-color: #f9f9f9;
      font-family: monospace;
      font-size: 12px;
    }
    
    .server-message {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    
    .server-message pre {
      margin: 5px 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .message-received {
      color: #2196F3;
    }
    
    .message-error {
      color: #F44336;
    }
    
    .debug-toggle-button {
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 9999;
      background-color: rgba(33, 150, 243, 0.8);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(debugStyles);
  
  // Debug paneli için event listener'ları ekle
  document.getElementById('close-debug').addEventListener('click', function() {
    debugPanel.style.display = 'none';
  });
  
  debugButton.addEventListener('click', function() {
    if (debugPanel.style.display === 'none') {
      debugPanel.style.display = 'flex';
    } else {
      debugPanel.style.display = 'none';
    }
  });
  
  // Durum değişkenleri
  let currentUsername = 'Anonim';
  let currentPartyCode = null;
  let currentPartyName = 'Yeni Parti';
  let isHost = false;
  let members = [];
  let connectionStatus = 'disconnected';
  
  // Parti oluşturma/hata istatistikleri ve debug bilgileri
  const debugInfo = {
    attempts: 0,
    errors: [],
    lastError: null,
    lastAttemptTime: null,
    connectionHistory: []
  };
  
  /**
   * Debug günlüğü tut
   */
  function logDebugInfo(action, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      details,
      connectionStatus
    };
    
    debugInfo.connectionHistory.push(logEntry);
    
    // En son 20 kaydı tut
    if (debugInfo.connectionHistory.length > 20) {
      debugInfo.connectionHistory.shift();
    }
    
    console.log(`[DEBUG] ${action}:`, details);
    
    // Hata durumunu chrome.storage.local'a kaydet
    if (action === 'error') {
      debugInfo.lastError = details;
      debugInfo.errors.push({ timestamp, details });
      
      chrome.storage.local.set({ debugInfo: debugInfo }, function() {
        console.log('Debug bilgileri kaydedildi');
      });
    }
  }
  
  /**
   * Ağ durumunu kontrol et
   */
  function checkNetworkStatus() {
    return {
      online: navigator.onLine,
      connectionStatus: connectionStatus
    };
  }
  
  // Sayfa yüklendiğinde kullanıcı adını ve mevcut parti durumunu al
  initApp();
  
  // Popup kapanırken kaydedilecek durum güncelleme değişkenleri
  let popupLastUpdated = Date.now();
  let needsUpdate = false;
  
  /**
   * Popup penceresinin yüksekliğini içeriğe göre ayarla
   * Bu fonksiyon görünür içeriğin yüksekliğini hesaplar ve popup boyutunu buna göre ayarlar
   */
  function adjustPopupHeight() {
    // console.log('Popup yüksekliği ayarlanıyor...');
    
    // Mevcut görünür içeriği bul
    let visibleContent = null;
    let padding = 24; // Ekstra padding için alan (px)
    
    if (initialLoadingOverlay.style.display === 'flex') {
      visibleContent = initialLoadingOverlay;
    } else if (mainScreen.style.display === 'block') {
      visibleContent = mainScreen;
    } else if (partyScreen.style.display === 'block') {
      visibleContent = partyScreen;
    } else if (!editPartyNameForm.classList.contains('hidden')) {
      visibleContent = editPartyNameForm;
    }
    
    if (!visibleContent) {
      console.error('Görünür içerik bulunamadı, boyut ayarlanamıyor');
      return;
    }
    
    // Toast mesajını boyut hesaplamaya dahil etme
    if (toast.classList.contains('show')) {
      padding += toast.offsetHeight + 20; // Toast yüksekliği + margin
    }
    
    // İçeriğin tam yüksekliğini hesapla
    const contentHeight = visibleContent.scrollHeight;
    
    // Min 300px, max 600px arasında bir yükseklik ayarla
    const newHeight = Math.max(300, Math.min(600, contentHeight + padding));
    
    // console.log('İçerik yüksekliği:', contentHeight, 'Yeni popup yüksekliği:', newHeight);
    
    // Mevcut yüksekliği kontrol et
    const currentHeight = parseInt(document.documentElement.style.height) || 0;
    
    // Eğer yükseklik değişmediyse DOM'u gereksiz yere güncelleme
    if (newHeight === currentHeight) {
      return;
    }
    
    // Chrome extension popup boyutlandırmada en iyi yöntem
    document.documentElement.style.height = newHeight + 'px';
    document.body.style.height = newHeight + 'px';
    
    // Üye listesinin max-height değerini de ayarla
    if (membersList && members.length > 0) {
      // Parti ekranının diğer elementlerinin toplam yüksekliği
      const otherElementsHeight = Array.from(partyScreen.children)
        .filter(el => el !== membersList.parentElement)
        .reduce((total, el) => total + el.offsetHeight, 0);
      
      // Üye listesi için kalan alanı hesapla (ekran yüksekliği - diğer elementler - padding)
      const availableHeight = newHeight - otherElementsHeight - 80;
      const newMaxHeight = Math.max(100, Math.min(300, availableHeight));
      
      // Eğer yeni max-height değeri önceki ile aynıysa güncelleme
      const currentMaxHeight = parseInt(membersList.style.maxHeight) || 0;
      if (newMaxHeight !== currentMaxHeight) {
        membersList.style.maxHeight = newMaxHeight + 'px';
        // console.log('Üye listesi max-height:', newMaxHeight);
      }
    }
  }
  
  // Periyodik ekran güncelleme fonksiyonu (500ms'de bir kontrol eder)
  const updateInterval = setInterval(function() {
    if (needsUpdate) {
      // console.log('Ekran güncelleniyor... Son güncellemeden bu yana geçen süre:', Date.now() - popupLastUpdated, 'ms');
      needsUpdate = false;
      popupLastUpdated = Date.now();
      
      // Eğer yükleme ekranı hala görünüyorsa ve bağlantı kurulduysa, ekranı göster
      if (initialLoadingOverlay.style.display === 'flex' && connectionStatus === 'connected') {
        // console.log('Bağlantı var ama yükleme ekranı hala görünüyor, ekranı güncelle');
        
        // Yükleme ekranını kapat
        initialLoadingOverlay.style.display = 'none';
        
        // Parti aktifse parti ekranını, değilse ana ekranı göster
        if (currentPartyCode) {
          // console.log('Aktif parti var, parti ekranını göster');
          mainScreen.style.display = 'none';
          partyScreen.style.display = 'block';
          partyScreen.classList.add('active');
        } else {
          // console.log('Aktif parti yok, ana ekranı göster');
          mainScreen.style.display = 'block';
          partyScreen.style.display = 'none';
          partyScreen.classList.remove('active');
        }
      }
      
      // Eğer bir parti içindeyse parti ekranının görünür olduğundan emin ol
      if (currentPartyCode) {
        // console.log('Aktif parti var, parti ekranını göster');
        try {
          // DOM elementlerinin varlığını kontrol et
          if (mainScreen && partyScreen && initialLoadingOverlay.style.display !== 'flex') {
            mainScreen.style.display = 'none';
            partyScreen.style.display = 'block';
            partyScreen.classList.add('active');
            
            if (usernameForm) usernameForm.classList.remove('active');
            if (joinPartyForm) joinPartyForm.classList.add('hidden');
            if (editPartyNameForm) editPartyNameForm.classList.add('hidden');
            
            // Parti bilgilerini güncelle
            if (partyCodeDisplay) partyCodeDisplay.textContent = currentPartyCode;
            if (partyNameDisplay) partyNameDisplay.textContent = currentPartyName;
            
            // Kullanıcı adını güncelle
            if (headerUsername) headerUsername.textContent = currentUsername === 'Anonim' ? 'Merhabalar, Anonim...' : 'Merhabalar, ' + currentUsername;
            if (partyUsername) partyUsername.textContent = currentUsername;
          } else {
            console.error('DOM elementleri bulunamadı, güncelleme yapılamıyor');
          }
        } catch (error) {
          console.error('Ekran güncellenirken hata oluştu:', error);
        }
      } else {
        // console.log('Aktif parti yok, ana ekranı göster');
        try {
          // DOM elementlerinin varlığını kontrol et
          if (mainScreen && partyScreen && initialLoadingOverlay.style.display !== 'flex') {
            mainScreen.style.display = 'block';
            partyScreen.style.display = 'none';
            partyScreen.classList.remove('active');
            
            if (usernameForm) usernameForm.classList.remove('active');
            if (joinPartyForm) joinPartyForm.classList.add('hidden');
            if (editPartyNameForm) editPartyNameForm.classList.add('hidden');
            if (mainButtons) mainButtons.style.display = 'flex';
            
            // Kullanıcı adını güncelle
            if (headerUsername) headerUsername.textContent = currentUsername === 'Anonim' ? 'Merhabalar, Anonim...' : 'Merhabalar, ' + currentUsername;
          } else {
            console.error('DOM elementleri bulunamadı, güncelleme yapılamıyor');
          }
        } catch (error) {
          console.error('Ekran güncellenirken hata oluştu:', error);
        }
      }
      
      // Storage'a parti durumunu kaydet
      if (currentPartyCode) {
        savePartyState();
      }
      
      // Popup yüksekliğini güncelle
      setTimeout(adjustPopupHeight, 50); // Küçük bir gecikme ile boyutu güncelle (DOM güncellemesi için)
    }
  }, 500);
  
  // Sayfa kapanırken interval'i temizle
  window.addEventListener('unload', function() {
    // console.log('Popup kapanıyor, interval temizleniyor');
    clearInterval(updateInterval);
  });
  
  // Event Listeners
  headerUsername.addEventListener('click', toggleUsernameForm);
  partyUsername.addEventListener('click', toggleUsernameForm);
  saveUsernameBtn.addEventListener('click', saveUsername);
  cancelUsernameBtn.addEventListener('click', cancelUsernameEdit);
  createPartyBtn.addEventListener('click', createParty);
  joinPartyBtn.addEventListener('click', showJoinPartyForm);
  leavePartyBtn.addEventListener('click', leaveParty);
  copyCodeBtn.addEventListener('click', copyPartyCode);
  editPartyNameBtn.addEventListener('click', showEditPartyNameForm);
  savePartyNameBtn.addEventListener('click', savePartyName);
  cancelPartyNameBtn.addEventListener('click', cancelPartyNameEdit);
  confirmJoinBtn.addEventListener('click', joinParty);
  cancelJoinBtn.addEventListener('click', cancelJoinParty);
  
  // Chrome extension message listeners
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // console.log('Chrome mesajı alındı:', message);
    
    // WebSocket bağlantı durumu mesajlarını işle
    if (message.action === 'connectionStatus') {
      // console.log('Bağlantı durumu mesajı alındı:', message);
      updateConnectionStatusUI(message);
    }
    
    // WebSocket sunucu mesajlarını işle
    if (message.action === 'serverMessage') {
      // console.log('Sunucu mesajı alındı:', message);
      updateServerMessagesUI(message);
    }
    
    if (message.type === 'CONNECTION_STATUS') {
      // console.log('Bağlantı durumu güncelleniyor:', message.status);
      handleConnectionStatus(message.status);
    } else if (message.type === 'PARTY_CREATED') {
      // console.log('Parti oluşturuldu, kod:', message.partyCode);
      // Zaman aşımı varsa temizle (global scope'a taşınmalı)
      if (window.partyCreationTimeout) {
        clearTimeout(window.partyCreationTimeout);
        window.partyCreationTimeout = null;
      }
      handlePartyCreated(message.partyCode);
      needsUpdate = true;
    } else if (message.type === 'PARTY_JOINED') {
      // console.log('Partiye katılındı, kod:', message.partyCode, 'host mu:', message.isHost);
      handlePartyJoined(message.partyCode, message.isHost);
      needsUpdate = true;
    } else if (message.type === 'PARTY_LEFT') {
      // console.log('Partiden ayrılındı');
      handlePartyLeft();
      needsUpdate = true;
    } else if (message.type === 'MEMBERS_UPDATED') {
      // console.log('Üyeler güncellendi:', message.members);
      updateMembers(message.members);
      needsUpdate = true;
    } else if (message.type === 'MEMBER_CONNECTION_STATUS') {
      // console.log('Üye bağlantı durumu güncellendi:', message.memberId, message.status);
      updateMemberConnectionStatus(message.memberId, message.status);
    } else if (message.type === 'PARTY_NAME_UPDATED') {
      // console.log('Parti adı güncellendi:', message.partyName);
      updatePartyName(message.partyName);
      needsUpdate = true;
    } else if (message.type === 'ERROR') {
      console.error('Hata alındı:', message.error);
      // Tüm butonların loading durumlarını kaldır
      setButtonLoading(createPartyBtn, false);
      setButtonLoading(joinPartyBtn, false);
      setButtonLoading(confirmJoinBtn, false);
      setButtonLoading(leavePartyBtn, false);
      setButtonLoading(saveUsernameBtn, false);
      setButtonLoading(savePartyNameBtn, false);
      
      // Devre dışı bırakılmış butonları normale çevir
      joinPartyBtn.disabled = false;
      createPartyBtn.disabled = false;
      cancelJoinBtn.disabled = false;
      headerUsername.style.pointerEvents = 'auto';
      
      // Hatanın hangi işlemle ilgili olduğunu belirleme
      if (message.context === 'createParty') {
        // Parti oluşturma hatası
        handlePartyCreationError(message.error);
      } else if (message.context === 'joinParty') {
        // Partiye katılma hatası özel işlemi eklenebilir
        showRetryToast(message.error, 'Tekrar Dene', () => {
          // Parti kodunu tutup tekrar deneyelim
          const partyCode = partyCodeInput.value.trim();
          if (partyCode) {
            joinParty();
          }
        });
      } else {
        // Genel hata durumu
        showToast(message.error, 'error');
      }
    }
    
    return true; // Asenkron işlem için true döndür
  });
  
  /**
   * Uygulamayı başlat ve kullanıcı tercihlerini yükle
   */
  function initApp() {
    console.log('%cUygulama başlatılıyor...', 'color: blue; font-weight: bold');
    
    // Debug logları için
    logDebugInfo('init_app', {
      timestamp: Date.now(),
      version: '1.2.0',
      online: navigator.onLine,
      userAgent: navigator.userAgent
    });
    
    // Başlangıçta ana ekranı ve parti ekranını gizle
    mainScreen.style.display = 'none';
    partyScreen.style.display = 'none';
    
    // Loading ekranını göster
    initialLoadingOverlay.style.display = 'flex';
    loadingStatus.textContent = 'Crunchyroll Watch Party';
    loadingSubstatus.textContent = 'Sunucuya bağlanılıyor...';
    
    // Timeout - 60 saniye içinde bağlanamazsa bildiri göster
    let connectionTimeout = setTimeout(() => {
      handleConnectionTimeout();
    }, 60000); // 60 saniye (1 dakika)
    
    // Bağlantı durumunu değişkenine kaydet
    window.connectionTimeout = connectionTimeout;
    
    // İşlem adımlarını logla
    console.log('%c1. Kullanıcı adı yükleniyor...', 'color: green');
    
    // Popup yüksekliğini başlangıçta ayarla
    setTimeout(adjustPopupHeight, 100);
    
    // Kaydedilmiş kullanıcı adını al
    chrome.storage.local.get(['username'], function(result) {
      if (result.username) {
        currentUsername = result.username;
        console.log('%c✓ Kullanıcı adı yüklendi: ' + currentUsername, 'color: green');
        updateUsernameDisplay();
      } else {
        console.log('%c✓ Kullanıcı adı bulunamadı, kullanıcı adı ekranı gösteriliyor', 'color: orange');
        
        // Loading ekranını kapat
        initialLoadingOverlay.style.display = 'none';
        
        // Kullanıcı adı formunu göster
        mainScreen.style.display = 'block';
        partyScreen.style.display = 'none';
        mainButtons.style.display = 'none';
        usernameForm.classList.add('active');
        joinPartyForm.classList.add('hidden');
        editPartyNameForm.classList.add('hidden');
        
        // İptal butonunu gizle (kullanıcı adı girmeden çıkamasın)
        cancelUsernameBtn.style.display = 'none';
        
        // Popup yüksekliğini güncelle
        setTimeout(adjustPopupHeight, 100);
        
        // Kullanıcı adı input'una focus
        usernameInput.focus();
        
        // Toast mesajı göster
        showToast('Lütfen bir kullanıcı adı belirleyin', 'info');
        
        // WebSocket bağlantısını başlat
        chrome.runtime.sendMessage({ action: 'reconnect' });
        
        // Burada fonksiyonu sonlandır ve parti durumunu kontrol etme
        return;
      }
      
      // Parti durumu kontrolü
      console.log('%c2. Parti durumu kontrol ediliyor...', 'color: green');
      
      // Mevcut parti durumunu kontrol et
      chrome.storage.local.get(['partyState'], function(result) {
        if (result.partyState && result.partyState.isActive) {
          console.log('%c✓ Aktif parti bulundu, kod: ' + result.partyState.partyId, 'color: green');
          
          currentPartyCode = result.partyState.partyId;
          currentPartyName = result.partyState.partyName || 'Yeni Parti';
          isHost = result.partyState.isHost;
          
          // Yükleme mesajını güncelle
          loadingSubstatus.textContent = 'Aktif parti bulundu, parti bilgileri yükleniyor...';
          
          // Parti bilgilerini güncelle
          updatePartyInfo();
          
          // Üyeleri al ve güncelle
          if (result.partyState.participants) {
            console.log('%c✓ Kaydedilmiş katılımcılar bulundu: ' + result.partyState.participants.length + ' üye', 'color: green');
            logDebugInfo('participants_loaded', {
              count: result.partyState.participants.length,
              members: result.partyState.participants.map(p => ({ username: p.username, isHost: p.isHost }))
            });
            
            updateMembers(result.partyState.participants);
          } else {
            // Kendini ekle (henüz katılımcı yoksa)
            console.log('%c✓ Katılımcı bulunamadı, kendimizi ekliyoruz', 'color: orange');
            const currentUser = {
              id: chrome.runtime.id,
              username: currentUsername,
              isHost: isHost,
              connectionStatus: 'connected'
            };
            updateMembers([currentUser]);
          }
          
          // Background scripte parti durumunu bildir
          console.log('%c3. Sunucuya yeniden bağlanılıyor...', 'color: blue');
          loadingSubstatus.textContent = 'Parti sunucusuna yeniden bağlanılıyor...';
          
          logDebugInfo('reconnect_party', {
            partyId: currentPartyCode,
            isHost: isHost,
            timestamp: Date.now()
          });
          
          chrome.runtime.sendMessage({
            action: 'reconnectParty',
            partyId: currentPartyCode,
            isHost: isHost
          }, function(response) {
            if (response && response.error) {
              console.error('%c✕ Yeniden bağlanma hatası: ' + response.error, 'color: red');
              logDebugInfo('reconnect_error', { error: response.error });
            } else if (response && response.success) {
              console.log('%c✓ Parti sunucusuna yeniden bağlanıldı', 'color: green');
            } else {
              console.log('%c⚠ Yeniden bağlanma yanıtı belirsiz', 'color: orange');
            }
          });
          
          // Ekran güncellemesi için işaretle
          needsUpdate = true;
          popupLastUpdated = Date.now();
        } else {
          console.log('%c✓ Aktif parti bulunamadı', 'color: orange');
          loadingSubstatus.textContent = 'Parti bulunamadı, ana ekran hazırlanıyor...';
        }
        
        console.log('%c4. Crunchyroll kontrolü yapılıyor...', 'color: blue');
        // Şu anki sekmenin Crunchyroll olup olmadığını kontrol et
        checkIfCrunchyroll();
        console.log('geçti');
        
        // WebSocket bağlantısını başlat
        chrome.runtime.sendMessage({ action: 'reconnect' }, function(response) {
          console.log('Bağlantı mesajı gönderildi:', response);
        });
      });
    });
    
    console.log('%c5. Sunucu bağlantı durumu kontrol ediliyor...', 'color: blue');
    // Bağlantı durumunu kontrol et
    chrome.runtime.sendMessage({ action: 'checkConnectionStatus' }, function(response) {
      if (response && response.status) {
        console.log('%c✓ Bağlantı durumu alındı: ' + response.status, 'color: green');
        // Bağlantı durumunu güncelle
        handleConnectionStatus(response.status);
      } else {
        console.warn('%c⚠ Bağlantı durumu alınamadı', 'color: orange');
        logDebugInfo('connection_status_query_failed', {
          response: response,
          timestamp: Date.now()
        });
      }
    });
    
    // İşlem sonuçları özeti
    logDebugInfo('init_completed', {
      timestamp: Date.now()
    });
  }
  
  /**
   * Bağlantı zaman aşımını ele alan fonksiyon
   */
  function handleConnectionTimeout() {
    console.error('Bağlantı zaman aşımına uğradı, 60 saniye içinde bağlantı sağlanamadı');
    
    // Zaman aşımı sürecini temizle
    if (window.connectionTimeout) {
      clearTimeout(window.connectionTimeout);
      window.connectionTimeout = null;
    }
    
    // Bağlantı durumunu güncelle ve hata göster
    if (initialLoadingOverlay.style.display === 'flex') {
      loadingStatus.textContent = 'Bağlantı Hatası';
      loadingStatus.classList.add('error');
      loadingSubstatus.textContent = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
      loadingSubstatus.classList.add('error');
      
      // Yeniden dene butonu ekle
      const retryButton = document.createElement('button');
      retryButton.textContent = 'Yeniden Dene';
      retryButton.classList.add('retry-button');
      retryButton.addEventListener('click', function() {
        console.log('Yeniden bağlantı deneniyor...');
        
        // Hata göstergesini kaldır
        loadingStatus.classList.remove('error');
        loadingSubstatus.classList.remove('error');
        loadingStatus.textContent = 'Crunchyroll Watch Party';
        loadingSubstatus.textContent = 'Sunucuya bağlanılıyor...';
        
        // Yeniden deneme butonunu kaldır
        this.remove();
        
        // Zaman aşımı sürecini yeniden başlat
        window.connectionTimeout = setTimeout(() => {
          handleConnectionTimeout();
        }, 60000); // 60 saniye (1 dakika)
        
        // Background scripte bağlanma mesajı gönder
        chrome.runtime.sendMessage({ action: 'reconnect' }, function(response) {
          console.log('Yeniden bağlanma mesajı gönderildi:', response);
        });
      });
      
      // Eğer önceden bir buton eklenmişse kaldır
      const existingRetryButton = initialLoadingOverlay.querySelector('.retry-button');
      if (existingRetryButton) {
        existingRetryButton.remove();
      }
      
      // Yeni butonu ekle
      initialLoadingOverlay.querySelector('.loading-container').appendChild(retryButton);
    }
  }
  
  /**
   * Crunchyroll'da olup olmadığını kontrol et
   */
  function checkIfCrunchyroll() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const isCrunchyroll = currentTab && currentTab.url && currentTab.url.includes('crunchyroll.com');
      
      if (!isCrunchyroll) {
        // Crunchyroll'da değiliz, butonları devre dışı bırakalım
        createPartyBtn.disabled = true;
        joinPartyBtn.disabled = true;
        
        // Eğer parti içerisinde değilsek, uyarı göster
        if (!currentPartyCode) {
          showToast('Bu uzantı sadece Crunchyroll sitesinde çalışır', 'error');
        }
      } else {
        // Crunchyroll'dayız, parti içerisinde değilsek butonları etkinleştir
        if (!currentPartyCode) {
          createPartyBtn.disabled = false;
          joinPartyBtn.disabled = false;
        }
      }
    });
  }
  
  /**
   * Kullanıcı adını gösteren metni güncelle
   */
  function updateUsernameDisplay() {
    if (currentUsername === 'Anonim') {
      headerUsername.textContent = 'Merhabalar, Anonim...';
    } else {
      headerUsername.textContent = 'Merhabalar, ' + currentUsername;
    }
    
    partyUsername.textContent = currentUsername;
  }
  
  /**
   * Kullanıcı adı formunu göster/gizle
   */
  function toggleUsernameForm() {
    if (usernameForm.style.display === 'block' || usernameForm.classList.contains('active')) {
      hideUsernameForm();
    } else {
      showUsernameForm();
    }
  }
  
  /**
   * Kullanıcı adı formunu göster
   */
  function showUsernameForm() {
    mainButtons.style.display = 'none';
    joinPartyForm.classList.add('hidden');
    editPartyNameForm.classList.add('hidden');
    usernameForm.classList.add('active');
    usernameInput.value = currentUsername === 'Anonim' ? '' : currentUsername;
    usernameInput.focus();
    
    // Popup yüksekliğini güncelle
    setTimeout(adjustPopupHeight, 100);
  }
  
  /**
   * Kullanıcı adı formunu gizle
   */
  function hideUsernameForm() {
    usernameForm.classList.remove('active');
    
    // Ana ekrandaysa butonları göster
    if (!partyScreen.classList.contains('active')) {
      mainButtons.style.display = 'flex';
    }
    
    // Popup yüksekliğini güncelle
    setTimeout(adjustPopupHeight, 100);
  }
  
  /**
   * Kullanıcı adını kaydet
   */
  function saveUsername() {
    const newUsername = usernameInput.value.trim();
    
    if (newUsername === '') {
      showToast('Kullanıcı adı boş olamaz', 'error');
      return;
    }
    
    if (newUsername.length > 20) {
      showToast('Kullanıcı adı en fazla 20 karakter olabilir', 'error');
      return;
    }
    
    // Loading durumunu göster
    setButtonLoading(saveUsernameBtn, true);
    
    currentUsername = newUsername;
    
    // Kullanıcı adını yerel depolamaya kaydet
    chrome.storage.local.set({ username: currentUsername }, function() {
      // Mevcut parti durumunu da güncelle
      chrome.storage.local.get(['partyState'], function(result) {
        if (result.partyState) {
          result.partyState.username = currentUsername;
          chrome.storage.local.set({ partyState: result.partyState });
        }
        
        // Loading durumunu kaldır
        setButtonLoading(saveUsernameBtn, false);
        
        // Kullanıcı adını göster
        updateUsernameDisplay();
        
        // Parti içindeyse, kullanıcı adı değişikliğini background.js'e bildir
        if (currentPartyCode) {
          chrome.runtime.sendMessage({
            action: 'updateUsername',
            username: currentUsername
          });
        }
        
        hideUsernameForm();
        showToast('Kullanıcı adınız kaydedildi', 'success');
      });
    });
  }
  
  /**
   * Kullanıcı adı düzenlemeyi iptal et
   */
  function cancelUsernameEdit() {
    // Eğer kullanıcı adı Anonim ise ve iptal butonu görünür ise, iptal edilemesin
    if (currentUsername === 'Anonim' && cancelUsernameBtn.style.display !== 'none') {
      showToast('Lütfen önce bir kullanıcı adı belirleyin', 'error');
      return;
    }
    
    hideUsernameForm();
  }
  
  /**
   * Parti oluştur
   */
  function createParty() {
    console.log('Parti oluşturuluyor...');
    
    // Debug kayıtları tut
    debugInfo.attempts++;
    debugInfo.lastAttemptTime = new Date().toISOString();
    logDebugInfo('create_party_start', {
      networkStatus: checkNetworkStatus(),
      username: currentUsername,
      attempts: debugInfo.attempts
    });
    
    // Loading animasyonunu göster
    setButtonLoading(createPartyBtn, true);
    
    // Diğer butonları devre dışı bırak
    joinPartyBtn.disabled = true;
    headerUsername.style.pointerEvents = 'none';
    
    // Parti oluşturma zaman aşımı kontrolü
    const partyCreationTimeout = setTimeout(() => {
      console.error('Parti oluşturma zaman aşımına uğradı');
      logDebugInfo('timeout', {
        message: 'Parti oluşturma zaman aşımına uğradı',
        networkStatus: checkNetworkStatus(),
        duration: '30 saniye'
      });
      handlePartyCreationError('Parti oluşturma zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }, 30000); // 30 saniye zaman aşımı
    
    // Global değişkene ata ki mesaj listener'da erişebilelim
    window.partyCreationTimeout = partyCreationTimeout;
    
    // Background scripte parti oluşturma isteği gönder
    chrome.runtime.sendMessage({
      action: 'createParty',
      username: currentUsername
    }, function(response) {
      console.log('Parti oluştur isteği gönderildi, yanıt:', response);
      
      // Debug kayıtları tut
      logDebugInfo('create_party_response', {
        response: response,
        networkStatus: checkNetworkStatus()
      });
      
      // Zaman aşımını temizle
      clearTimeout(partyCreationTimeout);
      window.partyCreationTimeout = null;
      
      // Hata kontrolü (eğer background script yanıt verirse)
      if (response && response.error) {
        handlePartyCreationError(response.error);
      }
    });
  }
  
  /**
   * Parti oluşturulduğunda çağrılır
   */
  function handlePartyCreated(partyCode) {
    console.log('Parti oluşturuldu fonksiyonu çağrıldı, kod:', partyCode);
    
    // Debug kayıtları tut
    logDebugInfo('party_created_success', {
      partyCode: partyCode,
      networkStatus: checkNetworkStatus(),
      attempts: debugInfo.attempts
    });
    
    // Hata sayacını sıfırla
    debugInfo.attempts = 0;
    
    // Loading animasyonunu kaldır
    setButtonLoading(createPartyBtn, false);
    
    // Diğer butonların durumlarını normale çevir
    joinPartyBtn.disabled = false;
    headerUsername.style.pointerEvents = 'auto';
    
    currentPartyCode = partyCode;
    isHost = true;
    
    // Parti bilgilerini güncelle
    updatePartyInfo();
    
    // Ekran güncellemesi için işaretle
    needsUpdate = true;
    
    try {
      // Ekranı hemen güncelle
      // console.log('Parti ekranına geçiliyor...');
      mainScreen.style.display = 'none';
      partyScreen.style.display = 'block';
      partyScreen.classList.add('active');
      editPartyNameForm.classList.add('hidden');
      usernameForm.classList.remove('active');
      joinPartyForm.classList.add('hidden');
      
      // Popup yüksekliğini güncelle
      setTimeout(adjustPopupHeight, 100);
    } catch (error) {
      console.error('Ekran güncellenirken hata oluştu:', error);
      logDebugInfo('screen_update_error', {
        error: error.message,
        stack: error.stack
      });
    }
    
    // Parti kodunu kopyala
    copyPartyCode();
    
    // Parti durumunu kaydet
    savePartyState();
    
    showToast('Parti oluşturuldu ve kod kopyalandı!', 'success');
    // console.log('Parti oluşturma işlemi tamamlandı');
  }
  
  /**
   * Parti oluşturma hatası durumunda
   */
  function handlePartyCreationError(errorMessage) {
    console.error('Parti oluşturma hatası:', errorMessage);
    
    // Hata istatistiklerini güncelle
    debugInfo.attempts++;
    debugInfo.lastAttemptTime = new Date().toISOString();
    logDebugInfo('error', {
      message: errorMessage,
      networkStatus: checkNetworkStatus(),
      attempts: debugInfo.attempts
    });
    
    // Loading durumunu kaldır
    setButtonLoading(createPartyBtn, false);
    
    // Diğer butonların durumlarını normale çevir
    joinPartyBtn.disabled = false;
    headerUsername.style.pointerEvents = 'auto';
    
    // Hata mesajını analiz et ve uygun şekilde yanıt ver
    if (errorMessage.includes('bağlantı') || errorMessage.includes('connection') || 
        errorMessage.includes('sunucu') || errorMessage.includes('server')) {
      // Bağlantı hatası - sunucu bağlantısı bekleyelim
      const retryDelay = 10000; // 10 saniye
      
      showToast('Sunucu bağlantısı beklenirken hata oluştu. ' + retryDelay/1000 + ' saniye içinde tekrar denenecek...', 'error');
      
      // Otomatik olarak tekrar deneme
      setTimeout(() => {
        // Hala bağlantı yoksa, manuel yeniden deneme seçeneği göster
        if (connectionStatus !== 'connected') {
          showRetryToast('Sunucuya hala bağlanılamadı. Manuel olarak tekrar denemek ister misiniz?', 'Tekrar Dene', () => {
            logDebugInfo('retry_manual', { message: 'Kullanıcı manuel olarak tekrar denedi' });
            createParty();
          });
        } else {
          // Bağlantı sağlandıysa otomatik olarak tekrar dene
          // console.log('Sunucu bağlantısı sağlandı, parti oluşturma tekrar deneniyor...');
          logDebugInfo('retry_auto', { message: 'Bağlantı sağlandı, otomatik olarak tekrar deneniyor' });
          createParty();
        }
      }, retryDelay);
    } else {
      // Diğer hata türleri için standart yeniden deneme
      showRetryToast(errorMessage, 'Tekrar Dene', () => {
        logDebugInfo('retry_manual', { message: 'Kullanıcı manuel olarak tekrar denedi' });
        createParty();
      });
    }
  }
  
  /**
   * Yeniden deneme seçeneği içeren toast mesajı göster
   */
  function showRetryToast(message, buttonText, callback) {
    // Mevcut toast'ı temizle
    toast.innerHTML = '';
    toast.className = 'toast error';
    
    // Hata mesajı
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);
    
    // Yeniden deneme butonu
    const retryButton = document.createElement('button');
    retryButton.textContent = buttonText;
    retryButton.className = 'retry-button';
    retryButton.addEventListener('click', () => {
      toast.classList.remove('show');
      if (callback) callback();
    });
    toast.appendChild(retryButton);
    
    toast.classList.add('show');
    
    // 10 saniye sonra toast'ı gizle (daha uzun süre göster)
    setTimeout(function() {
      if (toast.classList.contains('show')) {
        toast.classList.remove('show');
      }
    }, 10000);
  }
  
  /**
   * Partiye katılma formunu göster
   */
  function showJoinPartyForm() {
    mainButtons.style.display = 'none';
    usernameForm.classList.remove('active');
    editPartyNameForm.classList.add('hidden');
    joinPartyForm.classList.remove('hidden');
    partyCodeInput.value = '';
    partyCodeInput.focus();
    
    // Popup yüksekliğini güncelle
    setTimeout(adjustPopupHeight, 100);
  }
  
  /**
   * Partiye katıl
   */
  function joinParty() {
    const partyCode = partyCodeInput.value.trim();
    
    if (partyCode === '') {
      showToast('Parti kodu boş olamaz', 'error');
      return;
    }
    
    console.log('Partiye katılınıyor, kod:', partyCode);
    
    // Loading animasyonunu göster
    setButtonLoading(confirmJoinBtn, true);
    
    // İptal butonunu devre dışı bırak
    cancelJoinBtn.disabled = true;
    
    // Background scripte partiye katılma isteği gönder
    chrome.runtime.sendMessage({
      action: 'joinParty',
      partyId: partyCode,
      username: currentUsername
    }, function(response) {
      console.log('Partiye katıl isteği gönderildi, yanıt:', response);
    });
  }
  
  /**
   * Partiye katılma işlemini iptal et
   */
  function cancelJoinParty() {
    joinPartyForm.classList.add('hidden');
    mainButtons.style.display = 'flex';
    
    // Popup yüksekliğini güncelle
    setTimeout(adjustPopupHeight, 100);
  }
  
  /**
   * Partiye katılındığında çağrılır
   */
  function handlePartyJoined(partyCode, host) {
    console.log('Partiye katılındı fonksiyonu çağrıldı, kod:', partyCode, 'host mu:', host);
    
    // Loading animasyonunu kaldır
    setButtonLoading(confirmJoinBtn, false);
    
    // İptal butonunu normale çevir
    cancelJoinBtn.disabled = false;
    
    currentPartyCode = partyCode;
    isHost = host;
    
    // Parti bilgilerini güncelle
    updatePartyInfo();
    
    // Parti durumunu kaydet
    savePartyState();
    
    // Ekran güncellemesi için işaretle
    needsUpdate = true;
    
    try {
      // Ekranı hemen güncelle
      // console.log('Parti ekranına geçiliyor...');
      mainScreen.style.display = 'none';
      partyScreen.style.display = 'block';
      partyScreen.classList.add('active');
      editPartyNameForm.classList.add('hidden');
      usernameForm.classList.remove('active');
      joinPartyForm.classList.add('hidden');
      
      // Popup yüksekliğini güncelle
      setTimeout(adjustPopupHeight, 100);
    } catch (error) {
      console.error('Ekran güncellenirken hata oluştu:', error);
    }
    
    showToast('Partiye katıldınız!', 'success');
    // console.log('Partiye katılma işlemi tamamlandı');
  }
  
  /**
   * Partiden ayrıl
   */
  function leaveParty() {
    console.log('Partiden ayrılınıyor...');
    
    // Loading durumunu göster
    setButtonLoading(leavePartyBtn, true);
    
    // Background scripte partiden ayrılma isteği gönder
    chrome.runtime.sendMessage({
      action: 'leaveParty'
    }, function(response) {
      console.log('Partiden ayrıl isteği gönderildi, yanıt:', response);
    });
  }
  
  /**
   * Partiden ayrıldığında çağrılır
   */
  function handlePartyLeft() {
    console.log('Partiden ayrılındı fonksiyonu çağrıldı');
    
    // Loading durumunu kaldır
    setButtonLoading(leavePartyBtn, false);
    
    currentPartyCode = null;
    isHost = false;
    members = [];
    
    // Parti durumunu güncelle - parti aktif değil olarak işaretle
    chrome.storage.local.get(['partyState'], function(result) {
      if (result.partyState) {
        result.partyState.isActive = false;
        chrome.storage.local.set({ partyState: result.partyState }, function() {
          // console.log('Parti durumu güncellendi, aktif değil olarak işaretlendi');
        });
      }
    });
    
    // Ekran güncellemesi için işaretle
    needsUpdate = true;
    
    try {
      // Ekranı hemen güncelle
      // console.log('Ana ekrana geçiliyor...');
      mainScreen.style.display = 'block';
      partyScreen.style.display = 'none';
      partyScreen.classList.remove('active');
      editPartyNameForm.classList.add('hidden');
      mainButtons.style.display = 'flex';
      usernameForm.classList.remove('active');
      joinPartyForm.classList.add('hidden');
      
      // Popup yüksekliğini güncelle
      setTimeout(adjustPopupHeight, 100);
    } catch (error) {
      console.error('Ekran güncellenirken hata oluştu:', error);
    }
    
    showToast('Partiden ayrıldınız', 'info');
    // console.log('Partiden ayrılma işlemi tamamlandı');
  }
  
  /**
   * Parti kodunu kopyala
   */
  function copyPartyCode() {
    if (!currentPartyCode) return;
    
    navigator.clipboard.writeText(currentPartyCode).then(function() {
      showToast('Parti kodu panoya kopyalandı', 'success');
    }, function() {
      showToast('Kopyalama başarısız oldu', 'error');
    });
  }
  
  /**
   * Parti adı düzenleme formunu göster
   */
  function showEditPartyNameForm() {
    if (!isHost) {
      showToast('Sadece parti sahibi adını değiştirebilir', 'error');
      return;
    }
    
    mainScreen.style.display = 'none';
    partyScreen.style.display = 'none';
    editPartyNameForm.classList.remove('hidden');
    partyNameInput.value = currentPartyName;
    partyNameInput.focus();
    
    // Popup yüksekliğini güncelle
    setTimeout(adjustPopupHeight, 100);
  }
  
  /**
   * Parti adını kaydet
   */
  function savePartyName() {
    const newPartyName = partyNameInput.value.trim();
    
    if (newPartyName === '') {
      showToast('Parti adı boş olamaz', 'error');
      return;
    }
    
    if (newPartyName.length > 30) {
      showToast('Parti adı en fazla 30 karakter olabilir', 'error');
      return;
    }
    
    // Loading durumunu göster
    setButtonLoading(savePartyNameBtn, true);
    
    currentPartyName = newPartyName;
    
    // Parti adını güncelle
    chrome.runtime.sendMessage({
      action: 'updatePartyName',
      partyName: currentPartyName
    });
    
    // Storage'daki parti durumunu güncelle
    chrome.storage.local.get(['partyState'], function(result) {
      if (result.partyState) {
        result.partyState.partyName = currentPartyName;
        chrome.storage.local.set({ partyState: result.partyState }, function() {
          // Loading durumunu kaldır
          setButtonLoading(savePartyNameBtn, false);
          
          cancelPartyNameEdit();
          
          // Parti adını göster
          partyNameDisplay.textContent = currentPartyName;
          
          showToast('Parti adı güncellendi', 'success');
        });
      } else {
        // Loading durumunu kaldır
        setButtonLoading(savePartyNameBtn, false);
      }
    });
  }
  
  /**
   * Parti adı düzenlemeyi iptal et
   */
  function cancelPartyNameEdit() {
    editPartyNameForm.classList.add('hidden');
    partyScreen.style.display = 'block';
    
    // Popup yüksekliğini güncelle
    setTimeout(adjustPopupHeight, 100);
  }
  
  /**
   * Bağlantı durumunu işle
   */
  function handleConnectionStatus(status) {
    // console.log('Bağlantı durumu işleniyor:', status, 'önceki durum:', connectionStatus);
    logDebugInfo('connection_status_change', {
      prevStatus: connectionStatus,
      newStatus: status,
      timestamp: Date.now()
    });
    
    // Eğer bağlantı durumu değiştiyse
    if (status !== connectionStatus) {
      connectionStatus = status;
      
      if (status === 'connected') {
        // Bağlantı başarılıysa, loading overlay'i kaldır ve timeout'u temizle
        if (window.connectionTimeout) {
          clearTimeout(window.connectionTimeout);
          window.connectionTimeout = null;
        }
        
        // Hata göstergesini kaldır
        loadingStatus.classList.remove('error');
        loadingSubstatus.classList.remove('error');
        
        // Yeniden deneme butonunu kaldır
        const existingRetryButton = initialLoadingOverlay.querySelector('.retry-button');
        if (existingRetryButton) {
          existingRetryButton.remove();
        }
        
        // Loading substatus mesajını güncelle
        if (initialLoadingOverlay.style.display === 'flex') {
          loadingSubstatus.textContent = 'Bağlantı başarılı! Ekran hazırlanıyor...';
          
          // 1 saniye sonra loading ekranını kapat
          setTimeout(() => {
            initialLoadingOverlay.style.display = 'none';
            
            // Eğer kullanıcı adı hala Anonim ise ve username formu aktifse değişiklik yapma
            if (currentUsername === 'Anonim' && usernameForm.classList.contains('active')) {
              console.log('Kullanıcı adı hala Anonim, username formunda kalınıyor...');
              return;
            }
            
            // Parti aktifse parti ekranını, değilse ana ekranı göster
            if (currentPartyCode) {
              // console.log('Aktif parti var, parti ekranını göster');
              mainScreen.style.display = 'none';
              partyScreen.style.display = 'block';
              partyScreen.classList.add('active');
              usernameForm.classList.remove('active');
              joinPartyForm.classList.add('hidden');
              editPartyNameForm.classList.add('hidden');
            } else {
              // console.log('Aktif parti yok, ana ekranı göster');
              mainScreen.style.display = 'block';
              partyScreen.style.display = 'none';
              partyScreen.classList.remove('active');
              usernameForm.classList.remove('active');
              joinPartyForm.classList.add('hidden');
              editPartyNameForm.classList.add('hidden');
            }
        
        // Popup yüksekliğini güncelle
        setTimeout(adjustPopupHeight, 100);
          }, 1000);
        }
        
        showToast('Sunucuya bağlandı', 'success');
      } else if (status === 'connecting') {
        // Loading mesajını güncelle
        if (initialLoadingOverlay.style.display === 'flex') {
          loadingStatus.classList.remove('error');
          loadingSubstatus.classList.remove('error');
          loadingStatus.textContent = 'Crunchyroll Watch Party';
          loadingSubstatus.textContent = 'Sunucuyla bağlantı kuruluyor...';
        }
        
        showToast('Sunucuya bağlanıyor...', 'info');
        
        // Eğer uzun süre "connecting" durumunda kalırsa, zaman aşımı kontrolü
        if (window.connectingTimeout) clearTimeout(window.connectingTimeout);
        window.connectingTimeout = setTimeout(() => {
          if (connectionStatus === 'connecting') {
            // console.warn('Bağlantı durumu uzun süredir "connecting" durumunda kaldı, hata mesajı gösteriliyor');
            // Bağlantı zaman aşımı işleyicisini çağır
            handleConnectionTimeout();
          }
        }, 60000); // 60 saniye (1 dakika) connecting durumunda kalırsa timeout olur
        
      } else if (status === 'disconnected') {
        // Connecting timeout'u temizle
        if (window.connectingTimeout) {
          clearTimeout(window.connectingTimeout);
          window.connectingTimeout = null;
        }
        
        showToast('Sunucu bağlantısı kesildi', 'error');
        
        // Loading ekranı hala görünüyorsa
        if (initialLoadingOverlay.style.display === 'flex') {
          loadingSubstatus.textContent = 'Sunucu bağlantısı kesildi, yeniden bağlanılıyor...';
          
          // Eğer bağlantı yeniden kurulamazsa ve loading ekranındaysak
          // Bağlantı timeout'unu yeniden başlat
          if (!window.connectionTimeout) {
            window.connectionTimeout = setTimeout(() => {
              handleConnectionTimeout();
            }, 60000); // 60 saniye (1 dakika)
          }
        }
        
        // Parti oluşturma veya partiye katılma aşamasındaysa
        if (createPartyBtn.classList.contains('loading') || confirmJoinBtn.classList.contains('loading')) {
          // console.error('Bağlantı kesildiği için işlem iptal edildi');
          
          // Zaman aşımını temizle
          if (window.partyCreationTimeout) {
            clearTimeout(window.partyCreationTimeout);
            window.partyCreationTimeout = null;
          }
          
          // Tüm butonları normale çevir
          setButtonLoading(createPartyBtn, false);
          setButtonLoading(confirmJoinBtn, false);
          joinPartyBtn.disabled = false;
          cancelJoinBtn.disabled = false;
          headerUsername.style.pointerEvents = 'auto';
          
          // Parti oluşturma/katılma denemesi varken bağlantı kesildiyse
          showRetryToast('Sunucu bağlantısı kesildiği için işlem iptal edildi. Bağlantı sağlandığında tekrar deneyin.', 'Tekrar Dene', () => {
            // Partiye katılma formundaysa
            if (joinPartyForm.style.display === 'block' || !joinPartyForm.classList.contains('hidden')) {
              joinParty();
            } else {
              // Ana ekrandaysa, parti oluşturmayı dene
              createParty();
            }
          });
        }
      }
    }
  }
  
  /**
   * Üyenin bağlantı durumunu güncelle
   */
  function updateMemberConnectionStatus(memberId, status) {
    // Üye listesinde belirtilen ID'ye sahip üyeyi bul
    const memberIndex = members.findIndex(member => member.id === memberId);
    
    if (memberIndex !== -1) {
      // Üyenin bağlantı durumunu güncelle
      members[memberIndex].connectionStatus = status;
      
      // UI'da bağlantı durumunu güncelle
      const memberItems = membersList.querySelectorAll('.member-item');
      if (memberItems[memberIndex]) {
        const connectionDot = memberItems[memberIndex].querySelector('.connection-dot');
        if (connectionDot) {
          connectionDot.classList.remove('connected', 'disconnected');
          connectionDot.classList.add(status === 'connected' ? 'connected' : 'disconnected');
        }
      }
    }
  }
  
  /**
   * Parti üyelerini güncelle
   */
  function updateMembers(newMembers) {
    const hasCountChanged = members.length !== newMembers.length;
    
    // Mevcut üye listesini güncelle
    members = newMembers;
    
    // Üye listesini temizle
    membersList.innerHTML = '';
    
    // Üyeleri listele
    members.forEach(function(member) {
      const memberItem = document.createElement('div');
      memberItem.className = 'member-item';
      
      // Bağlantı durumu noktası
      const connectionDot = document.createElement('span');
      connectionDot.className = 'connection-dot';
      // Bağlantı durumunu kontrol et, varsayılan olarak 'connected' kabul ediyoruz
      const isConnected = member.connectionStatus !== 'disconnected';
      connectionDot.classList.add(isConnected ? 'connected' : 'disconnected');
      memberItem.appendChild(connectionDot);
      
      const memberIcon = document.createElement('i');
      memberIcon.className = 'material-icons';
      memberIcon.textContent = 'person';
      
      const memberName = document.createElement('span');
      memberName.className = 'member-name';
      memberName.textContent = member.username || 'Anonim';
      
      memberItem.appendChild(memberIcon);
      memberItem.appendChild(memberName);
      
      // Eğer üye host ise, taç ikonunu ekle
      if (member.isHost) {
        const hostIcon = document.createElement('i');
        hostIcon.className = 'material-icons host-icon';
        hostIcon.textContent = 'military_tech'; // veya 'emoji_events', 'stars'
        hostIcon.title = 'Parti Sahibi';
        memberItem.appendChild(hostIcon);
      }
      
      // Eğer bu üye kendisi ise, "Siz" rozetini ekle
      if (member.id === chrome.runtime.id) {
        const youBadge = document.createElement('span');
        youBadge.className = 'member-you-badge';
        youBadge.textContent = 'SİZ';
        memberItem.appendChild(youBadge);
      }
      
      membersList.appendChild(memberItem);
    });
    
    // Eğer üye sayısı değiştiyse, popup yüksekliğini güncelle
    if (hasCountChanged) {
      setTimeout(adjustPopupHeight, 100);
    }
  }
  
  /**
   * Parti adını güncelle
   */
  function updatePartyName(partyName) {
    currentPartyName = partyName;
    partyNameDisplay.textContent = currentPartyName;
  }
  
  /**
   * Parti bilgilerini güncelle
   */
  function updatePartyInfo() {
    partyCodeDisplay.textContent = currentPartyCode;
    partyNameDisplay.textContent = currentPartyName;
  }
  
  /**
   * Ana ekranı göster
   */
  function showMainScreen() {
    mainScreen.style.display = 'block';
    partyScreen.style.display = 'none';
    editPartyNameForm.classList.add('hidden');
    mainButtons.style.display = 'flex';
    usernameForm.classList.remove('active');
    joinPartyForm.classList.add('hidden');
  }
  
  /**
   * Parti ekranını göster
   */
  function showPartyScreen() {
    mainScreen.style.display = 'none';
    partyScreen.style.display = 'block';
    partyScreen.classList.add('active');
    editPartyNameForm.classList.add('hidden');
    usernameForm.classList.remove('active');
    joinPartyForm.classList.add('hidden');
  }
  
  /**
   * Toast mesajı göster
   */
  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type === 'error') {
      toast.classList.add('error');
    } else if (type === 'success') {
      toast.classList.add('success');
    }
    
    toast.classList.add('show');
    
    // 3 saniye sonra toast'ı gizle
    setTimeout(function() {
      toast.classList.remove('show');
    }, 3000);
  }
  
  /**
   * Butonun loading durumunu ayarla
   * @param {HTMLElement} button - Loading durumunu değiştirilecek buton
   * @param {boolean} isLoading - Loading durumu açık/kapalı
   */
  function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }
  
  /**
   * Parti durumunu yerel depolamaya kaydet
   */
  function savePartyState() {
    console.log('Parti durumu kaydediliyor...');
    
    const partyState = {
      isActive: true,
      partyId: currentPartyCode,
      partyName: currentPartyName,
      isHost: isHost,
      username: currentUsername,
      participants: members.length > 0 ? members : [{
        id: chrome.runtime.id,
        username: currentUsername,
        isHost: isHost,
        connectionStatus: 'connected'
      }]
    };
    
    console.log('Kaydedilen parti durumu:', partyState);
    
    chrome.storage.local.set({ partyState: partyState }, function() {
      console.log('Parti durumu başarıyla kaydedildi');
    });
  }
  
  // Pencere boyutu değiştiğinde popup boyutunu güncelle
  window.addEventListener('resize', adjustPopupHeight);
  
  // Sayfa içeriği değiştiğinde (örn. görünüm değiştiğinde) popup boyutunu güncelle
  const observer = new MutationObserver(function(mutations) {
    // Görünür içerik değişikliği varsa yüksekliği ayarla
    const shouldUpdate = mutations.some(mutation => {
      // Display veya class değişikliği olup olmadığını kontrol et
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'style' && 
            mutation.target.style && 
            mutation.target.style.display !== undefined) {
          return true;
        }
        
        if (mutation.attributeName === 'class' && 
            mutation.target.classList && 
            (mutation.target.classList.contains('hidden') || 
            mutation.target.classList.contains('active'))) {
          return true;
        }
      } else if (mutation.type === 'childList') {
        // Eğer membersList'e yeni üyeler eklendiyse veya çıkarıldıysa
        if (mutation.target === membersList) {
          return true;
        }
      }
      
      return false;
    });
    
    if (shouldUpdate) {
      setTimeout(adjustPopupHeight, 100);
    }
  });
  
  // Tüm içeriği izle
  observer.observe(document.body, { 
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['style', 'class']
  });
  
  /**
   * WebSocket bağlantı durumunu UI'da güncelle
   */
  function updateConnectionStatusUI(statusData) {
    const serverStatus = document.getElementById('server-status');
    const serverAddress = document.getElementById('server-address');
    const serverLastStatus = document.getElementById('server-last-status');
    const serverConnectionTime = document.getElementById('server-connection-time');
    
    // Durum indikatörlerini güncelle
    const connectionDot = document.getElementById('connection-dot');
    const connectionText = document.getElementById('connection-text');
    
    if (connectionDot && connectionText) {
      // CSS sınıflarını temizle
      connectionDot.classList.remove('connection-online', 'connection-offline', 'connection-connecting');
      
      // Duruma göre CSS ve metin ekle
      if (statusData.status === 'connected') {
        connectionDot.classList.add('connection-online');
        connectionText.textContent = 'Fly.io sunucusuyla bağlantı kuruldu';
      } else if (statusData.status === 'connecting') {
        connectionDot.classList.add('connection-connecting');
        connectionText.textContent = 'Fly.io sunucusuyla bağlantı kuruluyor...';
      } else if (statusData.status === 'disconnected') {
        connectionDot.classList.add('connection-offline');
        connectionText.textContent = 'Fly.io sunucusuyla bağlantı kesildi, yeniden bağlanılıyor...';
      } else if (statusData.status === 'error') {
        connectionDot.classList.add('connection-offline');
        connectionText.textContent = 'Bağlantı hatası: ' + (statusData.error || 'Bilinmeyen hata');
      }
    }
    
    // Durum indikatorünü güncelle
    if (serverStatus) {
      serverStatus.textContent = getStatusDisplayText(statusData.status);
      serverStatus.className = ''; // Tüm sınıfları temizle
      serverStatus.classList.add('status-' + statusData.status);
    }
    
    // Sunucu bilgilerini güncelle
    if (statusData.serverInfo) {
      if (serverAddress) serverAddress.textContent = statusData.serverInfo.url || '-';
      if (serverLastStatus) serverLastStatus.textContent = new Date().toLocaleTimeString() + ' - ' + statusData.status;
      
      if (serverConnectionTime) {
        if (statusData.status === 'connected' && statusData.serverInfo.connectionTime) {
          serverConnectionTime.textContent = formatDateTime(statusData.serverInfo.connectionTime);
        } else if (statusData.status === 'disconnected' && statusData.serverInfo.disconnectionTime) {
          serverConnectionTime.textContent = 'Bağlantı kesildi: ' + formatDateTime(statusData.serverInfo.disconnectionTime);
        } else if (statusData.status === 'error' && statusData.serverInfo.errorTime) {
          serverConnectionTime.textContent = 'Hata: ' + formatDateTime(statusData.serverInfo.errorTime);
        } else if (statusData.status === 'connecting' && statusData.serverInfo.connectionStartTime) {
          serverConnectionTime.textContent = 'Bağlanıyor: ' + formatDateTime(statusData.serverInfo.connectionStartTime);
        }
      }
    }
    
    // İşlem adımlarını logla
    if (statusData.status === 'connected') {
      console.log('%c✓ Sunucuya bağlandı: ' + statusData.serverInfo?.url, 'color: green; font-weight: bold');
      
      // Loading ekranını kapat
      if (initialLoadingOverlay && initialLoadingOverlay.style.display === 'flex') {
        hideInitialLoadingOverlay();
      }
    } else if (statusData.status === 'connecting') {
      console.log('%c→ Sunucuya bağlanılıyor: ' + statusData.serverInfo?.url, 'color: orange');
      
      // Loading durum metnini güncelle
      if (loadingSubstatus) {
        loadingSubstatus.textContent = 'Sunucuya bağlanılıyor...';
      }
    } else if (statusData.status === 'disconnected') {
      console.log('%c✗ Sunucu bağlantısı kesildi', 'color: red');
      
      // Loading durum metnini güncelle
      if (loadingSubstatus) {
        loadingSubstatus.textContent = 'Sunucu bağlantısı kesildi. Yeniden bağlanılıyor...';
      }
    } else if (statusData.status === 'error') {
      console.log('%c✗ Sunucu bağlantı hatası: ' + statusData.error, 'color: red; font-weight: bold');
      
      // Loading durum metnini güncelle
      if (loadingSubstatus) {
        loadingSubstatus.textContent = 'Bağlantı hatası: ' + statusData.error;
      }
    }
    
    // Sunucu durumunu debug bilgilerine kaydet
    logDebugInfo('server_connection', {
      status: statusData.status,
      time: new Date().toISOString(),
      url: statusData.serverInfo?.url || 'bilinmiyor',
      errorMessage: statusData.error || null
    });
  }
  
  /**
   * Sunucudan gelen mesajları UI'da güncelle
   */
  function updateServerMessagesUI(messageData) {
    const serverMessages = document.getElementById('server-messages');
    
    // Yeni mesaj öğesi oluştur
    const messageElement = document.createElement('div');
    messageElement.className = 'server-message';
    
    // Mesaj zamanı
    const timeElement = document.createElement('div');
    timeElement.textContent = formatDateTime(messageData.timestamp);
    timeElement.style.fontSize = '11px';
    timeElement.style.color = '#666';
    
    // Mesaj içeriği
    const contentElement = document.createElement('pre');
    contentElement.className = messageData.status === 'received' ? 'message-received' : 'message-error';
    
    if (messageData.status === 'received') {
      contentElement.textContent = JSON.stringify(messageData.message, null, 2);
    } else {
      contentElement.textContent = 'HATA: ' + messageData.error + '\nHAM VERİ: ' + messageData.rawData;
    }
    
    // Elementleri mesaj konteynerine ekle
    messageElement.appendChild(timeElement);
    messageElement.appendChild(contentElement);
    
    // Mesajı listenin başına ekle
    if (serverMessages.firstChild) {
      serverMessages.insertBefore(messageElement, serverMessages.firstChild);
    } else {
      serverMessages.appendChild(messageElement);
    }
    
    // Maksimum 20 mesaj tut, eski mesajları sil
    while (serverMessages.children.length > 20) {
      serverMessages.removeChild(serverMessages.lastChild);
    }
  }
  
  /**
   * Bağlantı durumu için okunabilir metin döndür
   */
  function getStatusDisplayText(status) {
    switch (status) {
      case 'connected':
        return 'Bağlı';
      case 'connecting':
        return 'Bağlanıyor...';
      case 'disconnected':
        return 'Bağlantı Kesildi';
      case 'error':
        return 'Bağlantı Hatası';
      default:
        return 'Bilinmiyor';
    }
  }
  
  /**
   * ISO tarih formatını okunabilir formata dönüştür
   */
  function formatDateTime(isoDateString) {
    if (!isoDateString) return '-';
    
    try {
      const date = new Date(isoDateString);
      return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
    } catch (e) {
      return isoDateString;
    }
  }
}); 