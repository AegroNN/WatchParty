// Crunchyroll Watch Party Sunucusu
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Express uygulaması
const app = express();
const port = process.env.PORT || 3000;

// HTTP sunucusu
const server = http.createServer(app);

// WebSocket sunucusu
const wss = new WebSocket.Server({ server });

// Aktif partiler
const parties = new Map();
// Bağlantılar
const connections = new Map();

// Ana sayfa
app.get('/', (req, res) => {
  res.send('Crunchyroll Watch Party Sunucusu Çalışıyor');
});

// WebSocket bağlantıları
wss.on('connection', (ws) => {
  console.log('Yeni bağlantı');
  
  const connectionId = uuidv4();
  connections.set(connectionId, { ws, partyId: null });
  
  // İstemciden mesaj alındığında
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(connectionId, data);
    } catch (error) {
      console.error('Mesaj işlenirken hata:', error);
    }
  });
  
  // Bağlantı kapatıldığında
  ws.on('close', () => {
    console.log('Bağlantı kapandı:', connectionId);
    const connection = connections.get(connectionId);
    
    if (connection && connection.partyId) {
      leaveParty(connectionId, connection.partyId);
    }
    
    connections.delete(connectionId);
  });
  
  // Bağlantı hata verdiğinde
  ws.on('error', (error) => {
    console.error('WebSocket hatası:', error);
  });
  
  // Yeni bağlantı bilgisi gönder
  ws.send(JSON.stringify({
    type: 'connection',
    connectionId
  }));
});

// Mesajları işle
function handleMessage(connectionId, data) {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  switch (data.type) {
    case 'create_party':
      createParty(connectionId, data);
      break;
      
    case 'join_party':
      joinParty(connectionId, data.partyId);
      break;
      
    case 'leave_party':
      leaveParty(connectionId, connection.partyId);
      break;
      
    case 'video_state':
      syncVideoState(connection.partyId, data.videoState, connectionId);
      break;
      
    case 'chat_message':
      sendChatMessage(connection.partyId, data.message, connectionId, data.sender);
      break;
      
    default:
      console.log('Bilinmeyen mesaj tipi:', data.type);
  }
}

// Parti oluştur
function createParty(connectionId, data) {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  // Rastgele bir parti ID'si oluştur veya kullanıcının sağladığını kullan
  const partyId = data.partyId || generatePartyId();
  
  // Parti zaten varsa, katılma işlemi yap
  if (parties.has(partyId)) {
    joinParty(connectionId, partyId);
    return;
  }
  
  // Yeni parti oluştur
  parties.set(partyId, {
    host: connectionId,
    participants: new Set([connectionId]),
    videoState: data.videoState || null,
    createdAt: Date.now()
  });
  
  // Bağlantıyı güncelle
  connection.partyId = partyId;
  connection.isHost = true;
  
  // Parti oluşturuldu bilgisi gönder
  connection.ws.send(JSON.stringify({
    type: 'party_created',
    partyId,
    isHost: true,
    participants: 1
  }));
  
  console.log(`Parti oluşturuldu: ${partyId}, Host: ${connectionId}`);
}

// Partiye katıl
function joinParty(connectionId, partyId) {
  const connection = connections.get(connectionId);
  if (!connection) return;
  
  // Parti mevcut değilse
  if (!parties.has(partyId)) {
    connection.ws.send(JSON.stringify({
      type: 'error',
      message: 'Parti bulunamadı'
    }));
    return;
  }
  
  const party = parties.get(partyId);
  
  // Kullanıcı zaten partide ise
  if (party.participants.has(connectionId)) {
    // Sadece mevcut video durumunu gönder
    if (party.videoState) {
      connection.ws.send(JSON.stringify({
        type: 'video_state',
        videoState: party.videoState
      }));
    }
    return;
  }
  
  // Yeni katılımcı ekle
  party.participants.add(connectionId);
  connection.partyId = partyId;
  connection.isHost = party.host === connectionId;
  
  // Katılımcıya parti bilgisi gönder
  connection.ws.send(JSON.stringify({
    type: 'party_joined',
    partyId,
    isHost: connection.isHost,
    participants: party.participants.size,
    videoState: party.videoState
  }));
  
  // Partideki diğer katılımcılara yeni katılımcı bilgisi gönder
  broadcastToParty(partyId, {
    type: 'participant_joined',
    participants: party.participants.size
  }, [connectionId]);
  
  console.log(`Partiye katılım: ${partyId}, Katılımcı: ${connectionId}, Toplam: ${party.participants.size}`);
}

// Partiden ayrıl
function leaveParty(connectionId, partyId) {
  if (!partyId || !parties.has(partyId)) return;
  
  const party = parties.get(partyId);
  const connection = connections.get(connectionId);
  
  // Katılımcıyı partiden çıkar
  party.participants.delete(connectionId);
  
  if (connection) {
    connection.partyId = null;
    connection.isHost = false;
    
    // Kullanıcıya partiden ayrıldığını bildir
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'party_left',
        partyId
      }));
    }
  }
  
  console.log(`Partiden ayrılma: ${partyId}, Katılımcı: ${connectionId}, Kalan: ${party.participants.size}`);
  
  // Partide katılımcı kalmadıysa, partiyi sil
  if (party.participants.size === 0) {
    parties.delete(partyId);
    console.log(`Parti silindi: ${partyId}`);
    return;
  }
  
  // Ayrılan kişi host ise, yeni host seç
  if (party.host === connectionId) {
    const newHost = Array.from(party.participants)[0];
    party.host = newHost;
    
    const newHostConnection = connections.get(newHost);
    if (newHostConnection) {
      newHostConnection.isHost = true;
      
      // Yeni host'a bilgi gönder
      if (newHostConnection.ws.readyState === WebSocket.OPEN) {
        newHostConnection.ws.send(JSON.stringify({
          type: 'became_host',
          partyId
        }));
      }
    }
    
    console.log(`Yeni host: ${newHost}`);
  }
  
  // Partideki diğer katılımcılara ayrılma bilgisi gönder
  broadcastToParty(partyId, {
    type: 'participant_left',
    participants: party.participants.size
  });
}

// Video durumunu senkronize et
function syncVideoState(partyId, videoState, senderId) {
  if (!partyId || !parties.has(partyId) || !videoState) return;
  
  const party = parties.get(partyId);
  const senderConnection = connections.get(senderId);
  
  // Sadece host video durumunu senkronize edebilir
  if (!senderConnection || !senderConnection.isHost) return;
  
  // Video durumunu güncelle
  party.videoState = videoState;
  
  // Tüm katılımcılara video durumunu gönder (host hariç)
  broadcastToParty(partyId, {
    type: 'video_state',
    videoState
  }, [senderId]);
}

// Sohbet mesajı gönder
function sendChatMessage(partyId, message, senderId, sender) {
  if (!partyId || !parties.has(partyId) || !message) return;
  
  // Tüm katılımcılara mesajı gönder
  broadcastToParty(partyId, {
    type: 'chat_message',
    message,
    sender: sender || 'Anonim',
    timestamp: Date.now()
  });
}

// Partideki tüm katılımcılara mesaj gönder
function broadcastToParty(partyId, data, excludeIds = []) {
  if (!partyId || !parties.has(partyId)) return;
  
  const party = parties.get(partyId);
  const message = JSON.stringify(data);
  
  for (const participantId of party.participants) {
    if (excludeIds.includes(participantId)) continue;
    
    const connection = connections.get(participantId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(message);
    }
  }
}

// Rastgele parti ID'si oluştur
function generatePartyId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Sunucuyu başlat
server.listen(port, () => {
  console.log(`Crunchyroll Watch Party sunucusu ${port} portunda çalışıyor`);
});

// Düzenli olarak aktif olmayan partileri temizle (30 dakika sonra)
setInterval(() => {
  const now = Date.now();
  for (const [partyId, party] of parties.entries()) {
    if (party.participants.size === 0 || now - party.createdAt > 30 * 60 * 1000) {
      parties.delete(partyId);
      console.log(`Aktif olmayan parti silindi: ${partyId}`);
    }
  }
}, 10 * 60 * 1000); 