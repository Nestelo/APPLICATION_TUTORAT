const https = require('https');
const http = require('http');

// Test simple de l'API forum
function testAPI() {
  console.log('🚀 Test de l\'API forum...');
  
  const options = {
    hostname: '192.168.43.210',
    port: 8000,
    path: '/api/forum/questions/',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ API accessible!');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Nombre de questions: ${jsonData.results ? jsonData.results.length : jsonData.length}`);
        
        if (jsonData.results && jsonData.results.length > 0) {
          const firstQuestion = jsonData.results[0];
          console.log(`Première question: ${firstQuestion.titre}`);
          console.log(`ID: ${firstQuestion.id}`);
        }
      } catch (e) {
        console.log('❌ Erreur parsing JSON:', e.message);
        console.log('Response brute:', data.substring(0, 200));
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ Erreur de connexion:', e.message);
  });

  req.end();
}

// Test de création de message vocal
function testVoiceMessage() {
  console.log('\n🎤 Test de création de message vocal...');
  
  // D'abord créer une question et une réponse
  const loginOptions = {
    hostname: '192.168.43.210',
    port: 8000,
    path: '/api/auth/login/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const loginData = JSON.stringify({
    email: 'motar@gmail.com',
    password: 'password123'
  });

  const loginReq = http.request(loginOptions, (loginRes) => {
    let loginData = '';

    loginRes.on('data', (chunk) => {
      loginData += chunk;
    });

    loginRes.on('end', () => {
      try {
        const loginResult = JSON.parse(loginData);
        if (loginResult.access) {
          console.log('✅ Connexion réussie');
          
          // Maintenant tester l'API messages vocaux
          const voiceOptions = {
            hostname: '192.168.43.210',
            port: 8000,
            path: '/api/forum/messages-vocaux/',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginResult.access}`,
              'Accept': 'application/json'
            }
          };

          const voiceReq = http.request(voiceOptions, (voiceRes) => {
            let voiceData = '';

            voiceRes.on('data', (chunk) => {
              voiceData += chunk;
            });

            voiceRes.on('end', () => {
              try {
                const voiceResult = JSON.parse(voiceData);
                console.log('✅ API messages vocaux accessible!');
                console.log(`Status: ${voiceRes.statusCode}`);
                console.log(`Messages vocaux: ${voiceResult.results ? voiceResult.results.length : 0}`);
              } catch (e) {
                console.log('❌ Erreur parsing messages vocaux:', e.message);
                console.log('Response brute:', voiceData.substring(0, 200));
              }
            });
          });

          voiceReq.on('error', (e) => {
            console.log('❌ Erreur API messages vocaux:', e.message);
          });

          voiceReq.end();
        } else {
          console.log('❌ Échec de connexion');
        }
      } catch (e) {
        console.log('❌ Erreur parsing login:', e.message);
      }
    });
  });

  loginReq.on('error', (e) => {
    console.log('❌ Erreur de connexion login:', e.message);
  });

  loginReq.write(loginData);
  loginReq.end();
}

// Exécuter les tests
testAPI();
setTimeout(testVoiceMessage, 2000);
