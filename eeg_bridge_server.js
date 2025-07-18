// eeg_bridge_server.js (version finale avec /met/exc restauré)
const osc = require('node-osc');
const WebSocket = require('ws');

const OSC_LISTEN_PORT = 9000;
const WEBSOCKET_PORT = 8081;
const EXC_OVERRIDE_COOLDOWN = 2000; // 2 secondes de priorité pour les rotations manuelles

const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });
console.log(`[+] Serveur WebSocket en écoute sur le port ${WEBSOCKET_PORT}`);

wss.on('connection', ws => {
    console.log('[+] e-mindmachine connectée au pont !');
});

const oscServer = new osc.Server(OSC_LISTEN_PORT, '0.0.0.0', () => {
    console.log(`[+] Serveur OSC en écoute sur le port ${OSC_LISTEN_PORT}`);
});

let actionState = {
    winkL: false,
    blink: false,
    winkR: false
};

// NOUVEAU : Variable pour suivre le temps de la dernière rotation manuelle
let lastManualRotationTime = 0;

let eegData = {
    att: 0.5,
    eng: 0.5,
    exc: 0.5,
    int: 0.5,
    rel: 0.5,
    str: 0.5,
    audioMode: 'both',
    blinkMode: 'synchro'
};

let hasReceivedFirstValue = {
    att: false,
    eng: false,
    exc: false,
    int: false,
    rel: false,
    str: false
};

const blinkModes = ['alternating', 'synchro', 'crossed', 'balanced'];
let currentBlinkModeIndex = 1;

const audioModes = ['binaural', 'isochronen', 'both'];
let currentAudioModeIndex = 2;

function rotateBlinkMode(direction) {
    if (direction === 'left') {
        currentBlinkModeIndex = (currentBlinkModeIndex - 1 + blinkModes.length) % blinkModes.length;
    } else { // right
        currentBlinkModeIndex = (currentBlinkModeIndex + 1) % blinkModes.length;
    }
    const newMode = blinkModes[currentBlinkModeIndex];
    eegData.blinkMode = newMode;
    lastManualRotationTime = Date.now(); // On enregistre le moment de l'action manuelle
    console.log(`[+] Rotation manuelle du mode vers: ${newMode}`);
}

function rotateAudioMode() {
    currentAudioModeIndex = (currentAudioModeIndex + 1) % audioModes.length;
    const newMode = audioModes[currentAudioModeIndex];
    eegData.audioMode = newMode;
    console.log(`[+] Rotation du mode AUDIO vers: ${newMode}`);
}

function processOscMessage(address, value) {

    // --- Actions Manuelles (Priorité Haute) ---
    if (address === '/fac/eyeAct/winkL') {
        if (value > 0 && !actionState.winkL) {
            actionState.winkL = true;
            rotateBlinkMode('left');
            setTimeout(() => { actionState.winkL = false; }, 500);
        }
        return;
    }
    if (address === '/fac/eyeAct/blink') {
        if (value > 0 && !actionState.blink) {
            actionState.blink = true;
            rotateBlinkMode('right');
            setTimeout(() => { actionState.blink = false; }, 500);
        }
        return;
    }
    if (address === '/fac/eyeAct/winkR') {
        if (value > 0 && !actionState.winkR) {
            actionState.winkR = true;
            rotateAudioMode();
            setTimeout(() => { actionState.winkR = false; }, 500);
        }
        return;
    }

    // --- Contrôle "Slider" /met/exc (Priorité Basse) ---
    if (address === '/met/exc') {
        // On ne traite ce message que si aucune rotation manuelle n'a eu lieu récemment
        if (Date.now() - lastManualRotationTime < EXC_OVERRIDE_COOLDOWN) {
            return; // On ignore la valeur passive pour ne pas écraser l'action de l'utilisateur
        }

        let newMode;
        if (value < 0.25) {
            newMode = 'alternating';
            currentBlinkModeIndex = 0;
        } else if (value < 0.5) {
            newMode = 'synchro';
            currentBlinkModeIndex = 1;
        } else if (value < 0.8) {
            newMode = 'crossed';
            currentBlinkModeIndex = 2;
        } else {
            newMode = 'balanced';
            currentBlinkModeIndex = 3;
        }

        if (eegData.blinkMode !== newMode) {
            eegData.blinkMode = newMode;
            console.log(`[+] Mode changé par /met/exc vers: ${newMode}`);
        }
        return;
    }
    
    // --- Autres assignations de métriques ---
    let metric = null;
    if (address === '/fac/lAct/clench') metric = 'rel'; // clench -> volume isochrone
    else if (address === '/met/att' || address === '/fac/uAct/surprise') metric = 'att';
    else if (address === '/met/eng' || address === '/fac/uAct/frown') metric = 'eng';
    else if (address === '/met/int' || address === '/fac/lAct/smile') metric = 'int';
    else if (address === '/met/rel') metric = 'rel';
    else if (address === '/met/str') metric = 'str';
    else return;

    if (!hasReceivedFirstValue[metric] && value !== 0) {
        hasReceivedFirstValue[metric] = true;
    }
    if (hasReceivedFirstValue[metric]) {
        eegData[metric] = value;
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