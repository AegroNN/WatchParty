// Crunchyroll Watch Party Content Script

// Sayfada video oynatıcısını bulmak için kullanılan seçiciler
const VIDEO_SELECTOR = 'video';
const PLAYER_CONTAINER_SELECTOR = '.vilos-main-container';

// Parti durumu
let partyState = {
  isHost: false,
  partyId: null,
  participants: [],
  isWatching: false,
  lastUpdateTimestamp: 0,
  username: 'Anonim' // Kullanıcı adı (gerçek uygulamada oturum açmış kullanıcı adı kullanılabilir)
};

// Bağlantı durumu
let connectionStatus = {
  isConnected: false,
  connectionId: null
};

// Video oynatıcısına erişelim
function getVideoPlayer() {
  return document.querySelector(VIDEO_SELECTOR);
}

// Video durumunu alma
function getVideoState() {
  const videoElement = getVideoPlayer();
  if (!videoElement) return null;
  
  return {
    currentTime: videoElement.currentTime,
    paused: videoElement.paused,
    playbackRate: videoElement.playbackRate,
    duration: videoElement.duration,
    videoUrl: window.location.href
  };
}

// Video durumunu ayarlama (senkronize etme)
function syncVideoState(state) {
  const videoElement = getVideoPlayer();
  if (!videoElement || !state) return;
  
  // Zaman farkı 2 saniyeden fazlaysa zaman güncellenir
  if (Math.abs(videoElement.currentTime - state.currentTime) > 2) {
    videoElement.currentTime = state.currentTime;
  }
  
  // Oynatma durumu senkronize edilir
  if (state.paused && !videoElement.paused) {
    videoElement.pause();
  } else if (!state.paused && videoElement.paused) {
    videoElement.play().catch(error => {
      console.error('Video otomatik oynatılamadı:', error);
      // Kullanıcıya bilgi ver
      const statusElement = document.getElementById('watch-party-status');
      if (statusElement) {
        statusElement.textContent = 'Video otomatik oynatma engellendi. Lütfen manuel olarak oynatın.';
        statusElement.style.color = '#ff6b6b';
        
        // 5 saniye sonra durumu sıfırla
        setTimeout(() => {
          statusElement.textContent = partyState.isHost ? 'Host modunda izliyorsunuz' : 'Parti modunda izliyorsunuz';
          statusElement.style.color = '';
        }, 5000);
      }
    });
  }
  
  // Oynatma hızı senkronize edilir
  if (videoElement.playbackRate !== state.playbackRate) {
    videoElement.playbackRate = state.playbackRate;
  }
}

// Watch Party arayüzünü oluşturma
function createWatchPartyUI() {
  const playerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
  if (!playerContainer || document.getElementById('watch-party-container')) return;
  
  const watchPartyContainer = document.createElement('div');
  watchPartyContainer.id = 'watch-party-container';
  watchPartyContainer.innerHTML = `
    <div class="watch-party-header">
      <h3>Crunchyroll Watch Party</h3>
      <div class="party-controls">
        <button id="create-party-btn">Parti Oluştur</button>
        <button id="join-party-btn">Partiye Katıl</button>
        <button id="leave-party-btn" style="display:none;">Partiden Ayrıl</button>
        <button id="minimize-party-btn" class="icon-btn">_</button>
      </div>
    </div>
    <div class="watch-party-content" style="display:none;">
      <div class="party-info">
        <p>Parti ID: <span id="party-id">N/A</span></p>
        <p>Katılımcılar: <span id="participant-count">0</span></p>
        <p>Durum: <span id="watch-party-status">Bağlı değil</span></p>
        <p>Kullanıcı Adı: <input type="text" id="username-input" placeholder="Anonim" maxlength="15"></p>
      </div>
      <div class="chat-container">
        <div id="chat-messages"></div>
        <div class="chat-input">
          <input type="text" id="chat-message-input" placeholder="Mesaj yazın...">
          <button id="send-message-btn">Gönder</button>
        </div>
      </div>
    </div>
  `;
  
  playerContainer.appendChild(watchPartyContainer);
  
  // Drag & Drop özelliği ekle
  makeDraggable(watchPartyContainer);
  
  // Butonlara olay dinleyicileri ekle
  document.getElementById('create-party-btn').addEventListener('click', createParty);
  document.getElementById('join-party-btn').addEventListener('click', promptJoinParty);
  document.getElementById('leave-party-btn').addEventListener('click', leaveParty);
  document.getElementById('send-message-btn').addEventListener('click', sendChatMessage);
  document.getElementById('chat-message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
  document.getElementById('minimize-party-btn').addEventListener('click', toggleMinimize);
  
  // Kullanıcı adı değişikliğini dinle
  document.getElementById('username-input').addEventListener('change', (e) => {
    partyState.username = e.target.value.trim() || 'Anonim';
    
    // Kullanıcı adını kaydet
    savePartyState();
  });
  
  // Mevcut kullanıcı adını göster
  chrome.storage.local.get(['username'], (result) => {
    if (result.username) {
      partyState.username = result.username;
      document.getElementById('username-input').value = result.username;
    }
  });
}

// UI öğesini sürüklenebilir yapma
function makeDraggable(element) {
  const header = element.querySelector('.watch-party-header');
  if (!header) return;
  
  let isDragging = false;
  let offsetX, offsetY;
  
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    // Sürükleme sırasında stil değiştir
    element.style.transition = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    
    // Ekran dışına çıkmasını engelle
    const maxX = window.innerWidth - element.offsetWidth;
    const maxY = window.innerHeight - element.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(x, maxX));
    const boundedY = Math.max(0, Math.min(y, maxY));
    
    element.style.left = boundedX + 'px';
    element.style.top = boundedY + 'px';
    element.style.right = 'auto';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.transition = 'all 0.3s ease';
    }
  });
}

// Panel boyutunu küçült/büyüt
function toggleMinimize() {
  const container = document.getElementById('watch-party-container');
  const button = document.getElementById('minimize-party-btn');
  
  if (container.classList.contains('minimized')) {
    container.classList.remove('minimized');
    button.textContent = '_';
  } else {
    container.classList.add('minimized');
    button.textContent = '+';
  }
}

// Parti oluşturma
function createParty() {
  // Bağlantı durumunu kontrol et
  chrome.runtime.sendMessage({action: 'getConnectionStatus'}, (response) => {
    connectionStatus.isConnected = response.connected;
    connectionStatus.connectionId = response.connectionId;
    
    // Parti ID'si oluştur
    partyState.isHost = true;
    partyState.partyId = generatePartyId();
    
    // Şu anki video durumunu al
    const videoState = getVideoState();
    
    // Parti durumunu güncelle
    updatePartyUI(true);
    
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Parti oluşturuluyor...';
    }
    
    // Background script'e mesaj gönder
    chrome.runtime.sendMessage(
      {
        action: 'createParty',
        partyId: partyState.partyId,
        videoState,
        username: partyState.username
      },
      (response) => {
        if (response && response.success) {
          // Başarılı oldu, kullanıcıya bilgi ver
          alert(`Parti oluşturuldu! ID: ${partyState.partyId}\nBu ID'yi arkadaşlarınızla paylaşın.`);
          
          // Kullanıcı adını kaydet
          savePartyState();
          
          // Durum mesajını güncelle
          if (statusElement) {
            statusElement.textContent = 'Host modunda izliyorsunuz';
          }
        } else {
          // Hata oluştu
          alert('Parti oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
          
          // Parti durumunu sıfırla
          partyState.isHost = false;
          partyState.partyId = null;
          updatePartyUI(false);
          
          if (statusElement) {
            statusElement.textContent = 'Bağlı değil';
          }
        }
      }
    );
  });
}

// Partiye katılma
function promptJoinParty() {
  const partyId = prompt('Katılmak istediğiniz parti ID\'sini girin:');
  if (!partyId) return;
  
  joinParty(partyId);
}

function joinParty(partyId) {
  // Bağlantı durumunu kontrol et
  chrome.runtime.sendMessage({action: 'getConnectionStatus'}, (response) => {
    connectionStatus.isConnected = response.connected;
    connectionStatus.connectionId = response.connectionId;
    
    // Parti durumunu güncelle
    partyState.isHost = false;
    partyState.partyId = partyId;
    
    // UI'ı güncelle
    updatePartyUI(true);
    
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Partiye katılınıyor...';
    }
    
    // Background script'e mesaj gönder
    chrome.runtime.sendMessage(
      {
        action: 'joinParty',
        partyId: partyState.partyId,
        username: partyState.username
      },
      (response) => {
        if (response && response.success) {
          // Kullanıcı adını kaydet
          savePartyState();
          
          // Durum mesajını güncelle
          if (statusElement) {
            statusElement.textContent = 'Parti modunda izliyorsunuz';
          }
        } else {
          // Hata oluştu
          alert('Partiye katılırken bir hata oluştu. Lütfen geçerli bir Parti ID girdiğinizden emin olun.');
          
          // Parti durumunu sıfırla
          partyState.isHost = false;
          partyState.partyId = null;
          updatePartyUI(false);
          
          if (statusElement) {
            statusElement.textContent = 'Bağlı değil';
          }
        }
      }
    );
  });
}

// Partiden ayrılma
function leaveParty() {
  // Background script'e mesaj gönder
  chrome.runtime.sendMessage(
    {
      action: 'leaveParty'
    },
    (response) => {
      // Parti durumunu sıfırla
      partyState = {
        isHost: false,
        partyId: null,
        participants: [],
        isWatching: false,
        lastUpdateTimestamp: 0,
        username: partyState.username // Kullanıcı adını koru
      };
      
      // UI'ı güncelle
      updatePartyUI(false);
      
      // Kullanıcıya bilgi ver
      const statusElement = document.getElementById('watch-party-status');
      if (statusElement) {
        statusElement.textContent = 'Bağlı değil';
      }
      
      // Sohbet mesajlarını temizle
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.innerHTML = '';
      }
    }
  );
}

// UI'yı güncelle
function updatePartyUI(inParty) {
  document.getElementById('create-party-btn').style.display = inParty ? 'none' : 'inline-block';
  document.getElementById('join-party-btn').style.display = inParty ? 'none' : 'inline-block';
  document.getElementById('leave-party-btn').style.display = inParty ? 'inline-block' : 'none';
  document.querySelector('.watch-party-content').style.display = inParty ? 'block' : 'none';
  
  if (inParty) {
    document.getElementById('party-id').textContent = partyState.partyId;
    document.getElementById('participant-count').textContent = partyState.participants.length;
    document.getElementById('watch-party-status').textContent = partyState.isHost ? 'Host modunda izliyorsunuz' : 'Parti modunda izliyorsunuz';
  }
}

// Parti durumunu kaydetme
function savePartyState() {
  // Kullanıcı adını kaydet
  chrome.storage.local.set({ username: partyState.username });
}

// Sohbet mesajı gönderme
function sendChatMessage() {
  const input = document.getElementById('chat-message-input');
  const message = input.value.trim();
  
  if (message && partyState.partyId) {
    // Background script'e mesaj gönder
    chrome.runtime.sendMessage(
      {
        action: 'chatMessage',
        message: message,
        sender: partyState.username
      },
      (response) => {
        if (response && response.success) {
          // Başarılı oldu, input'u temizle
          input.value = '';
        } else {
          // Hata oluştu, kullanıcıya bilgi ver
          alert('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      }
    );
  }
}

// Sohbet mesajı alma ve gösterme
function addChatMessage(sender, message, timestamp) {
  const chatMessages = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message';
  
  // Zaman bilgisi
  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  messageElement.innerHTML = `<span class="message-time">[${time}]</span> <strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Rastgele parti ID'si oluşturma
function generatePartyId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Video olaylarını dinle
function setupVideoListeners() {
  const videoElement = getVideoPlayer();
  if (!videoElement) return;
  
  videoElement.addEventListener('play', onVideoEvent);
  videoElement.addEventListener('pause', onVideoEvent);
  videoElement.addEventListener('seeked', onVideoEvent);
  videoElement.addEventListener('ratechange', onVideoEvent);
}

// Video olayı işleme
function onVideoEvent(event) {
  // Sadece host ise video olaylarını gönder
  chrome.storage.local.get(['partyState', 'username'], (result) => {
    if (!result.partyState || !result.partyState.isActive || !result.partyState.isHost) return;
    
    const now = Date.now();
    // 500ms içinde çok fazla güncelleme göndermeyi önleme
    if (now - partyState.lastUpdateTimestamp < 500) return;
    
    partyState.lastUpdateTimestamp = now;
    
    // Kullanıcı adını ayarla
    const username = result.username || partyState.username;
    
    // Video durumunu gönder
    const videoState = getVideoState();
    if (videoState) {
      let eventType = '';
      
      // Olayın tipini belirle
      switch(event.type) {
        case 'play':
          eventType = 'videoPlayed';
          break;
        case 'pause':
          eventType = 'videoPaused';
          break;
        case 'seeked':
          eventType = 'videoSeeked';
          break;
        case 'ratechange':
          eventType = 'videoRateChanged';
          break;
      }
      
      // Video durum güncellemesini gönder
      chrome.runtime.sendMessage({
        action: 'videoSync',
        videoState: videoState,
        username: username,
        eventType: eventType,
        time: videoState.currentTime
      });
    }
  });
}

// Chrome runtime mesajlarını dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Parti oluşturulduğunda
  if (message.action === 'partyCreated') {
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Host modunda izliyorsunuz';
    }
  }
  
  // Partiye katılındığında
  else if (message.action === 'partyJoined') {
    // Katılımcı sayısını güncelle
    partyState.participants = message.participants - 1; // Kendi dışındakiler
    document.getElementById('participant-count').textContent = partyState.participants;
    
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Parti modunda izliyorsunuz';
    }
    
    // Video durumunu senkronize et
    if (message.videoState) {
      syncVideoState(message.videoState);
    }
  }
  
  // Kullanıcı adı değiştirildiğinde
  else if (message.action === 'usernameChanged') {
    // Yeni kullanıcı adını kaydet
    if (message.username) {
      partyState.username = message.username;
      
      // Kullanıcı adı alanını güncelle
      const usernameInput = document.getElementById('username-input');
      if (usernameInput) {
        usernameInput.value = message.username;
      }
      
      // Kullanıcıya bilgi ver
      addChatMessage('Sistem', 'Kullanıcı adınız değiştirildi: ' + message.username);
      
      // Diğer katılımcılara bilgi ver
      chrome.runtime.sendMessage({
        action: 'chatMessage',
        message: 'Kullanıcı adını şu şekilde değiştirdi: ' + message.username,
        sender: 'Sistem',
        systemMessage: true
      });
    }
  }
  
  // Partiden ayrılındığında
  else if (message.action === 'partyLeft') {
    // Parti durumunu sıfırla
    partyState = {
      isHost: false,
      partyId: null,
      participants: [],
      isWatching: false,
      lastUpdateTimestamp: 0,
      username: partyState.username // Kullanıcı adını koru
    };
    
    // UI'ı güncelle
    updatePartyUI(false);
    
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Bağlı değil';
    }
    
    // Sohbet mesajlarını temizle
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
  }
  
  // Yeni katılımcı katıldığında
  else if (message.action === 'participantJoined') {
    // Katılımcı sayısını güncelle
    partyState.participants = message.participants - 1; // Kendi dışındakiler
    document.getElementById('participant-count').textContent = partyState.participants;
    
    // Sistem mesajı göster
    addChatMessage('Sistem', 'Yeni bir katılımcı partiye katıldı.');
  }
  
  // Katılımcı ayrıldığında
  else if (message.action === 'participantLeft') {
    // Katılımcı sayısını güncelle
    partyState.participants = message.participants - 1; // Kendi dışındakiler
    document.getElementById('participant-count').textContent = partyState.participants;
    
    // Sistem mesajı göster
    addChatMessage('Sistem', 'Bir katılımcı partiden ayrıldı.');
  }
  
  // Host olunduğunda
  else if (message.action === 'becameHost') {
    partyState.isHost = true;
    
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Host modunda izliyorsunuz';
    }
    
    // Sistem mesajı göster
    addChatMessage('Sistem', 'Artık partinin host\'usunuz.');
  }
  
  // Video durumu güncellendiğinde
  else if (message.action === 'syncVideoState') {
    syncVideoState(message.videoState);
  }
  
  // Yeni sohbet mesajı geldiğinde
  else if (message.action === 'newChatMessage') {
    addChatMessage(message.sender, message.message, message.timestamp);
  }
  
  // Sunucu hatası oluştuğunda
  else if (message.action === 'serverError') {
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = 'Hata: ' + message.message;
      statusElement.style.color = '#ff6b6b';
    }
    
    // Sistem mesajı göster
    addChatMessage('Sistem', 'Hata: ' + message.message);
  }
  
  // Bağlantı durumu güncellendiğinde
  else if (message.action === 'connectionStatus') {
    connectionStatus.isConnected = message.status === 'connected';
    
    // Kullanıcıya bilgi ver
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      if (message.status === 'connected') {
        statusElement.textContent = partyState.partyId ? (partyState.isHost ? 'Host modunda izliyorsunuz' : 'Parti modunda izliyorsunuz') : 'Bağlı, parti yok';
        statusElement.style.color = '';
      } else {
        statusElement.textContent = 'Bağlantı kesildi';
        statusElement.style.color = '#ff6b6b';
      }
    }
  }
  
  sendResponse({success: true});
  return true;
});

// İçerik betiği başlatma
function init() {
  // Sayfanın tam olarak yüklenmesini bekleyelim
  window.addEventListener('load', () => {
    console.log('Crunchyroll Watch Party başlatılıyor...');
    
    // Sayfa değişikliklerini dinleyelim (SPA uygulamalar için)
    const observer = new MutationObserver((mutations) => {
      if (!document.querySelector(VIDEO_SELECTOR) && !document.querySelector(PLAYER_CONTAINER_SELECTOR)) return;
      
      createWatchPartyUI();
      setupVideoListeners();
      
      // Crunchyroll'un video oynatıcısı yüklendiyse artık gözlemlemeyi durdurabiliriz
      if (document.querySelector(VIDEO_SELECTOR)) {
        observer.disconnect();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // İlk çalıştırmayı da yapalım
    if (document.querySelector(VIDEO_SELECTOR) || document.querySelector(PLAYER_CONTAINER_SELECTOR)) {
      createWatchPartyUI();
      setupVideoListeners();
    }
  });
}

init(); 