// eeg_bridge_server.js (mis à jour)
const osc = require('node-osc');
const WebSocket = require('ws');

const OSC_LISTEN_PORT = 9000;
const WEBSOCKET_PORT = 8081;

const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });
console.log(`[+] Serveur WebSocket en écoute sur le port ${WEBSOCKET_PORT}`);

wss.on('connection', ws => {
    console.log('[+] e-mindmachine connectée au pont !');
});

const oscServer = new osc.Server(OSC_LISTEN_PORT, '0.0.0.0', () => {
    console.log(`[+] Serveur OSC en écoute sur le port ${OSC_LISTEN_PORT}`);
});

// On stocke la dernière valeur reçue pour chaque métrique
let eegData = {
    att: 0, // Attention -> Fréquence de clignotement
    eng: 0, // Engagement -> Fréquence porteuse
    exc: 0, // Excitement -> NOUVEAU: Mode de clignotement
    int: 0, // Interest -> NOUVEAU: Volume des battements binauraux
    rel: 0, // Relaxation -> Volume des sons isochrones
    str: 0  // Stress -> Volume de l'alternophonie
};

oscServer.on('message', function (msg) {
    const address = msg[0];
    const value = msg[1];
    
    if (address === '/met/att') eegData.att = value;
    else if (address === '/met/eng') eegData.eng = value;
    else if (address === '/met/exc') eegData.exc = value;
    else if (address === '/met/int') eegData.int = value;
    else if (address === '/met/rel') eegData.rel = value;
    else if (address === '/met/str') eegData.str = value;
    else return;

    console.log('Données EEG actuelles:', eegData);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(eegData));
        }
    });
});

oscServer.on('bundle', function (bundle) {
    console.log("--- BUNDLE OSC REÇU ---");
    
    bundle.elements.forEach(message => {
        const address = message[0];
        const value = message[1];
        
        if (address === '/met/att') eegData.att = value;
        else if (address === '/met/eng') eegData.eng = value;
        else if (address === '/met/exc') eegData.exc = value;
        else if (address === '/met/int') eegData.int = value;
        else if (address === '/met/rel') eegData.rel = value;
        else if (address === '/met/str') eegData.str = value;
    });

    console.log('Données EEG traitées :', eegData);
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(eegData));
        }
    });
});