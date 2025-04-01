// Background script - Crunchyroll Watch Party
// Arka planda çalışacak ve partileri yönetecek

// WebSocket sunucu adresini config.js dosyasından yükle
import { WS_SERVER, ENV } from './config.js';

// Ortam loglaması
console.log('Aktif ortam:', ENV);
console.log('WebSocket sunucu adresi:', WS_SERVER);

// Aktif parti oturumları
const activeSessions = new Map();

// WebSocket bağlantımız
let socket = null;
let connectionId = null;
let reconnectAttempts = 0;
let reconnectTimeout = null;

// Chrome storage değişikliklerini dinle
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.partyState) {
    const newValue = changes.partyState.newValue;
    const oldValue = changes.partyState.oldValue || { isActive: false };
    
    // Parti durumu aktifleştirildiğinde WebSocket bağlantısı kur
    if (newValue && newValue.isActive && !oldValue.isActive) {
      connectToServer();
      
      // Parti ID'sine göre oturum oluştur veya güncelle
      if (newValue.partyId) {
        const tabId = newValue.tabId;
        if (tabId) {
          activeSessions.set(newValue.partyId, {
            tabId,
            isHost: newValue.isHost,
            participants: newValue.participants || []
          });
        }
      }
    } 
    // Parti durumu devre dışı bırakıldığında
    else if (oldValue.isActive && (!newValue || !newValue.isActive)) {
      // Eğer aktif bir parti ve bağlantı varsa
      if (oldValue.partyId && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'leave_party',
          partyId: oldValue.partyId
        }));
      }
      
      // Oturumu kaldır
      if (oldValue.partyId) {
        activeSessions.delete(oldValue.partyId);
      }
    }
  }
});

// Uzantının kurulumunda
chrome.runtime.onInstalled.addListener(() => {
  console.log('Crunchyroll Watch Party uzantısı kuruldu');
  
  // Crunchyroll uzantı ikonunu güncelle
  chrome.action.setIcon({
    path: {
      "16": "images/icon16.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    }
  });
  
  // Parti durumunu sıfırla
  chrome.storage.local.set({ 
    partyState: {
      isActive: false,
      isHost: false,
      partyId: null,
      participants: [],
      tabId: null
    }
  });
  
  // Uzantı kurulduğunda WebSocket sunucusuna bağlan
  connectToServer();
});

// Chrome tarayıcı başlatıldığında
chrome.runtime.onStartup.addListener(() => {
  console.log('Chrome başlatıldı, Crunchyroll Watch Party aktif');
  
  // Chrome başlatıldığında WebSocket sunucusuna bağlan
  connectToServer();
});

// Content scriptler ve popuptan gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // İlgili sekmeyi kontrol et
  const tabId = sender.tab ? sender.tab.id : null;
  
  // Parti oluşturma mesajı
  if (message.action === 'createParty') {
    console.log('Yeni parti oluşturuldu:', message.partyId);
    
    // Kullanıcı adını al
    const username = message.username || 'Anonim';
    
    // Parti durumunu güncelle
    chrome.storage.local.set({ 
      partyState: {
        isActive: true,
        isHost: true,
        partyId: message.partyId,
        participants: [],
        tabId,
        username: username
      }
    });
    
    // WebSocket bağlantısı yoksa kur
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connectToServer();
    }
    
    // Sunucuya parti oluşturma mesajı gönder
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'create_party',
        partyId: message.partyId,
        videoState: message.videoState,
        username: username
      }));
    } else {
      // Bağlantı kurulamadıysa, istemi kaydet ve bağlantı kurulunca gönder
      if (!socket) {
        connectToServer(() => {
          socket.send(JSON.stringify({
            type: 'create_party',
            partyId: message.partyId,
            videoState: message.videoState,
            username: username
          }));
        });
      }
    }
    
    sendResponse({ success: true });
  }
  
  // Partiye katılma mesajı
  else if (message.action === 'joinParty') {
    console.log('Partiye katılım:', message.partyId);
    
    // Kullanıcı adını al
    const username = message.username || 'Anonim';
    
    // Parti durumunu güncelle
    chrome.storage.local.set({ 
      partyState: {
        isActive: true,
        isHost: false,
        partyId: message.partyId,
        participants: [],
        tabId,
        username: username
      }
    });
    
    // WebSocket bağlantısı yoksa kur
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connectToServer();
    }
    
    // Sunucuya partiye katılma mesajı gönder
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'join_party',
        partyId: message.partyId,
        username: username
      }));
    } else {
      // Bağlantı kurulamadıysa, istemi kaydet ve bağlantı kurulunca gönder
      if (!socket) {
        connectToServer(() => {
          socket.send(JSON.stringify({
            type: 'join_party',
            partyId: message.partyId,
            username: username
          }));
        });
      }
    }
    
    sendResponse({ success: true });
  }
  
  // Partiden ayrılma mesajı
  else if (message.action === 'leaveParty') {
    console.log('Partiden ayrılma');
    
    // Sunucuya partiden ayrılma mesajı gönder
    if (socket && socket.readyState === WebSocket.OPEN) {
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState && result.partyState.partyId) {
          socket.send(JSON.stringify({
            type: 'leave_party',
            partyId: result.partyState.partyId
          }));
        }
      });
    }
    
    // Parti durumunu sıfırla
    chrome.storage.local.set({ 
      partyState: {
        isActive: false,
        isHost: false,
        partyId: null,
        participants: [],
        tabId: null
      }
    });
    
    sendResponse({ success: true });
  }
  
  // Video senkronizasyon mesajı (sadece host gönderebilir)
  else if (message.action === 'videoSync') {
    chrome.storage.local.get(['partyState'], (result) => {
      if (result.partyState && result.partyState.isActive && result.partyState.isHost) {
        // Sunucuya video durumunu gönder
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'video_state',
            videoState: message.videoState,
            partyId: result.partyState.partyId,
            username: message.username || result.partyState.username,
            eventType: message.eventType,
            time: message.time
          }));
        }
        
        // Eğer eventType belirtilmişse, bu bir kullanıcı etkileşimidir
        // Tüm aktif sekmelere bildirim gönderelim
        if (message.eventType) {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'partyEvent',
                eventType: message.eventType,
                username: message.username || result.partyState.username,
                time: message.time
              });
            });
          });
        }
      }
    });
    
    sendResponse({ success: true });
  }
  
  // Sohbet mesajı
  else if (message.action === 'chatMessage') {
    chrome.storage.local.get(['partyState'], (result) => {
      if (result.partyState && result.partyState.isActive) {
        // Sunucuya mesajı gönder
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'chat_message',
            message: message.message,
            sender: message.sender,
            partyId: result.partyState.partyId
          }));
        }
      }
    });
    
    sendResponse({ success: true });
  }
  
  // WebSocket bağlantı durumunu talep etme
  else if (message.action === 'getConnectionStatus') {
    sendResponse({ 
      connected: socket && socket.readyState === WebSocket.OPEN,
      connectionId
    });
  }
  
  // Popup.js için bağlantı durumu kontrolü
  else if (message.action === 'checkConnectionStatus') {
    sendResponse({ 
      status: socket && socket.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
      connectionId
    });
  }
  
  // Sunucu bağlantısını yeniden başlatma
  else if (message.action === 'reconnect') {
    // Mevcut bağlantıyı kapat (eğer varsa)
    if (socket) {
      socket.close();
    }
    
    // Yeni bağlantı kur
    connectToServer();
    
    sendResponse({
      success: true,
      message: 'Sunucu bağlantısı yeniden başlatıldı'
    });
  }
  
  return true; // Asenkron yanıt için
});

// Sekme kapatıldığında parti oturumunu temizle
chrome.tabs.onRemoved.addListener((tabId) => {
  // Sekmeye ait bir parti varsa temizle
  chrome.storage.local.get(['partyState'], (result) => {
    if (result.partyState && result.partyState.tabId === tabId && result.partyState.isActive) {
      // Sunucuya partiden ayrılma mesajı gönder
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'leave_party',
          partyId: result.partyState.partyId
        }));
      }
      
      // Parti durumunu sıfırla
      chrome.storage.local.set({
        partyState: {
          isActive: false,
          isHost: false,
          partyId: null,
          participants: [],
          tabId: null
        }
      });
    }
  });
});

// WebSocket bağlantısı kurma
function connectToServer(callback) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket zaten bağlı, tekrar bağlanmaya gerek yok');
    // Bağlantı durumunu popup'a bildir
    console.log(WS_SERVER)
    chrome.runtime.sendMessage({
      action: 'connectionStatus',
      status: 'connected',
      serverInfo: {
        url: WS_SERVER,
        connectionTime: new Date().toISOString()
      }
    });
    
    if (callback) callback();
    return;
  }
  
  try {
    console.log('WebSocket bağlantısı başlatılıyor: ' + WS_SERVER);
    
    // Bağlantı başlama zamanını kaydet
    const connectionStartTime = new Date().toISOString();
    
    // Bağlantı durumunu popup'a bildir
    chrome.runtime.sendMessage({
      action: 'connectionStatus',
      status: 'connecting',
      serverInfo: {
        url: WS_SERVER,
        connectionStartTime: connectionStartTime
      }
    });
    
    // Mevcut bağlantıyı kapat
    if (socket) {
      socket.close();
    }
    
    // Yeni bağlantı kur
    socket = new WebSocket(WS_SERVER);
    
    // Bağlantı açıldığında
    socket.onopen = () => {
      const connectionTime = new Date().toISOString();
      console.log('WebSocket bağlantısı kuruldu - Zaman: ' + connectionTime);
      reconnectAttempts = 0;
      clearTimeout(reconnectTimeout);
      
      // Chrome storage'daki tüm sekmeleri bilgilendir
      chrome.runtime.sendMessage({
        action: 'connectionStatus',
        status: 'connected',
        serverInfo: {
          url: WS_SERVER,
          connectionTime: connectionTime,
          connectionDuration: new Date() - new Date(connectionStartTime) + 'ms'
        }
      });
      
      if (callback) callback();
    };
    
    // Mesaj alındığında
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket mesajı alındı:', data);
        
        // Sunucudan gelen mesajı popup'a bildir
        chrome.runtime.sendMessage({
          action: 'serverMessage',
          status: 'received',
          message: data,
          timestamp: new Date().toISOString()
        });
        
        handleServerMessage(data);
      } catch (error) {
        console.error('WebSocket mesajı işlenirken hata:', error);
        // Mesaj işleme hatasını popup'a bildir
        chrome.runtime.sendMessage({
          action: 'serverMessage',
          status: 'error',
          error: error.message,
          rawData: event.data,
          timestamp: new Date().toISOString()
        });
      }
    };
    
    // Bağlantı kapandığında
    socket.onclose = (event) => {
      console.log('WebSocket bağlantısı kapandı, kod: ' + event.code + ', neden: ' + event.reason);
      
      // Chrome storage'daki tüm sekmeleri bilgilendir
      chrome.runtime.sendMessage({
        action: 'connectionStatus',
        status: 'disconnected',
        serverInfo: {
          url: WS_SERVER,
          code: event.code,
          reason: event.reason,
          disconnectionTime: new Date().toISOString()
        }
      });
      
      // Yeniden bağlanmayı dene
      attemptReconnect();
    };
    
    // Bağlantı hatası
    socket.onerror = (error) => {
      console.error('WebSocket hatası:', error);
      
      // Chrome storage'daki tüm sekmeleri bilgilendir
      chrome.runtime.sendMessage({
        action: 'connectionStatus',
        status: 'error',
        error: error.message,
        serverInfo: {
          url: WS_SERVER,
          errorTime: new Date().toISOString()
        }
      });
    };
  } catch (error) {
    console.error('WebSocket bağlantısı kurulurken hata:', error);
    
    // Bağlantı hatasını popup'a bildir
    chrome.runtime.sendMessage({
      action: 'connectionStatus',
      status: 'error',
      error: error.message,
      serverInfo: {
        url: WS_SERVER,
        errorTime: new Date().toISOString()
      }
    });
    
    attemptReconnect();
  }
}

// Yeniden bağlanma denemesi
function attemptReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  // Maksimum 5 deneme yap, her denemede süreyi arttır
  if (reconnectAttempts < 5) {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectAttempts++;
    
    console.log(`${delay}ms sonra yeniden bağlanılacak (deneme: ${reconnectAttempts})`);
    
    reconnectTimeout = setTimeout(() => {
      connectToServer();
    }, delay);
  } else {
    console.log('Yeniden bağlanma denemeleri başarısız oldu');
    
    // Chrome storage'daki tüm sekmeleri bilgilendir
    chrome.runtime.sendMessage({
      action: 'connectionStatus',
      status: 'failed'
    });
  }
}

// Sunucudan gelen mesajları işle
function handleServerMessage(data) {
  console.log('Sunucudan mesaj alındı:', data);
  
  switch (data.type) {
    // Bağlantı bilgisi
    case 'connection':
      connectionId = data.connectionId;
      break;
      
    // Parti oluşturuldu
    case 'party_created':
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState) {
          chrome.storage.local.set({
            partyState: {
              ...result.partyState,
              partyId: data.partyId,
              isHost: data.isHost,
              participants: data.participants - 1 // Kendi dışındakiler
            }
          });
        }
      });
      
      // İlgili content script'e bilgi gönder
      broadcastToContentScripts({
        action: 'partyCreated',
        partyId: data.partyId
      });
      break;
      
    // Partiye katılındı
    case 'party_joined':
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState) {
          chrome.storage.local.set({
            partyState: {
              ...result.partyState,
              isHost: data.isHost,
              participants: data.participants - 1 // Kendi dışındakiler
            }
          });
        }
      });
      
      // İlgili content script'e bilgi ve video durumu gönder
      broadcastToContentScripts({
        action: 'partyJoined',
        participants: data.participants,
        videoState: data.videoState
      });
      break;
      
    // Partiden ayrılındı
    case 'party_left':
      // Storage'ı güncelle
      chrome.storage.local.set({
        partyState: {
          isActive: false,
          isHost: false,
          partyId: null,
          participants: [],
          tabId: null
        }
      });
      
      // İlgili content script'e bilgi gönder
      broadcastToContentScripts({
        action: 'partyLeft'
      });
      break;
      
    // Parti katılımcısı eklendi
    case 'participant_joined':
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState && result.partyState.isActive) {
          chrome.storage.local.set({
            partyState: {
              ...result.partyState,
              participants: data.participants - 1 // Kendi dışındakiler
            }
          });
          
          // İlgili sekmeye mesaj gönder
          chrome.tabs.sendMessage(result.partyState.tabId, {
            action: 'participantJoined',
            participants: data.participants
          });
          
          // Tüm sekmelere bildirim gönder
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'partyEvent',
                eventType: 'userJoined',
                username: data.username || 'Bir kullanıcı'
              });
            });
          });
        }
      });
      break;
      
    // Parti katılımcısı ayrıldı
    case 'participant_left':
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState && result.partyState.isActive) {
          chrome.storage.local.set({
            partyState: {
              ...result.partyState,
              participants: data.participants - 1 // Kendi dışındakiler
            }
          });
          
          // İlgili sekmeye mesaj gönder
          chrome.tabs.sendMessage(result.partyState.tabId, {
            action: 'participantLeft',
            participants: data.participants
          });
          
          // Tüm sekmelere bildirim gönder
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, {
                action: 'partyEvent',
                eventType: 'userLeft',
                username: data.username || 'Bir kullanıcı'
              });
            });
          });
        }
      });
      break;
      
    // Host olma
    case 'became_host':
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState) {
          chrome.storage.local.set({
            partyState: {
              ...result.partyState,
              isHost: true
            }
          });
        }
      });
      
      // İlgili content script'e bilgi gönder
      broadcastToContentScripts({
        action: 'becameHost'
      });
      break;
      
    // Video durumu güncellendi
    case 'video_state':
      chrome.storage.local.get(['partyState'], (result) => {
        if (result.partyState && result.partyState.isActive && !result.partyState.isHost) {
          // Host olmayanlara video durumunu gönder
          chrome.tabs.sendMessage(result.partyState.tabId, {
            action: 'syncVideoState',
            videoState: data.videoState
          });
          
          // Belirli bir olay tipi varsa, tüm sekmelere bildirim gönder
          if (data.eventType) {
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'partyEvent',
                  eventType: data.eventType,
                  username: data.username || 'Bir kullanıcı',
                  time: data.time
                });
              });
            });
          }
        }
      });
      break;
      
    // Sohbet mesajı
    case 'chat_message':
      // İlgili content script'e mesajı gönder
      broadcastToContentScripts({
        action: 'newChatMessage',
        message: data.message,
        sender: data.sender,
        timestamp: data.timestamp
      });
      break;
      
    // Hata
    case 'error':
      console.error('Sunucu hatası:', data.message);
      
      // İlgili content script'e bilgi gönder
      broadcastToContentScripts({
        action: 'serverError',
        message: data.message
      });
      break;
  }
}

// Tüm ilgili content script'lere mesaj gönder
function broadcastToContentScripts(message) {
  chrome.storage.local.get(['partyState'], (result) => {
    if (result.partyState && result.partyState.tabId) {
      chrome.tabs.sendMessage(result.partyState.tabId, message);
    }
  });
} 