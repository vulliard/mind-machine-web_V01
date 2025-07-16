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

// 1. Les valeurs sont initialisées
let eegData = {
    att: 0.5,
    eng: 0.5, 
    exc: 0.5, 
    int: 0.5,
    rel: 0.5,
    str: 0.5,
    audioMode: 'both' // NOUVEAU: Ajout du mode audio
};

// 2. Suivi de l'activation des métriques
let hasReceivedFirstValue = {
    att: false,
    eng: false,
    exc: false,
    int: false,
    rel: false,
    str: false
};

// 3. Logique de rotation pour les modes
const blinkModes = ['alternating', 'synchro', 'crossed'];
let currentBlinkModeIndex = 1; 

const audioModes = ['binaural', 'isochronen', 'both'];
let currentAudioModeIndex = 2; // Index initial pour 'both'

const modeToExcValue = {
    'alternating': 0.1,
    'synchro': 0.5,
    'crossed': 0.8
};

function rotateBlinkMode(direction) {
    if (direction === 'left') {
        currentBlinkModeIndex = (currentBlinkModeIndex - 1 + blinkModes.length) % blinkModes.length;
    } else { // right
        currentBlinkModeIndex = (currentBlinkModeIndex + 1) % blinkModes.length;
    }
    const newMode = blinkModes[currentBlinkModeIndex];
    eegData.exc = modeToExcValue[newMode];
    console.log(`[+] Rotation du mode de CLIGNOTEMENT vers: ${newMode}`);
}

// NOUVEAU: Fonction pour faire tourner le mode AUDIO
function rotateAudioMode() {
    currentAudioModeIndex = (currentAudioModeIndex + 1) % audioModes.length;
    const newMode = audioModes[currentAudioModeIndex];
    eegData.audioMode = newMode;
    console.log(`[+] Rotation du mode AUDIO vers: ${newMode}`);
}

// Fonction pour traiter les messages OSC
function processOscMessage(address, value) {
    // Gestion prioritaire des clignements pour la rotation
    if (address === '/fac/eyeAct/blink') {
        rotateBlinkMode('left');
        return; 
    }
    if (address === '/fac/eyeAct/winkL') {
        rotateBlinkMode('right');
        return; 
    }
    // NOUVEAU: Gestion du clignement droit pour le mode audio
    if (address === '/fac/eyeAct/winkR') {
        rotateAudioMode();
        return;
    }

    let metric = null;
    
    // Association des autres adresses OSC
    if (address === '/met/att' || address === '/fac/uAct/surprise') metric = 'att';
    else if (address === '/met/eng' || address === '/fac/uAct/frown') metric = 'eng';
    else if (address === '/met/exc' || address === '/fac/lAct/clench') metric = 'exc';
    else if (address === '/met/int' || address === '/fac/lAct/smile') metric = 'int';
    else if (address === '/met/rel') metric = 'rel';
    else if (address === '/met/str') metric = 'str';
    else return;

    // Logique d'activation
    if (!hasReceivedFirstValue[metric] && value !== 0) {
        console.log(`[+] Première valeur non-nulle reçue pour '${metric}'. Activation du suivi.`);
        hasReceivedFirstValue[metric] = true;
    }

    if (hasReceivedFirstValue[metric]) {
        eegData[metric] = value;
        if (metric === 'exc') {
            if (value < 0.33) currentBlinkModeIndex = 0;
            else if (value < 0.66) currentBlinkModeIndex = 1;
            else currentBlinkModeIndex = 2;
        }
    }
}

oscServer.on('message', function (msg) {
    processOscMessage(msg[0], msg[1]);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(eegData));
        }
    });
});

oscServer.on('bundle', function (bundle) {
    bundle.elements.forEach(message => {
        processOscMessage(message[0], message[1]);
    });
    console.log('Données EEG traitées :', eegData);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(eegData));
        }
    });
});