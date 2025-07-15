// Global variable declarations
let isLeftLight = false;
let visualTimeoutId = null; 
let BLINK_FREQUENCY_HZ;
let audioContext = null;
let masterGainNode = null;
let currentCarrierFrequency;
let currentBBMultiplier;
let currentAudioMode;
let currentBinauralVolume;
let currentIsochronenVolume;
let currentAlternophonyVolume;
let currentLanguage = 'en';
let currentSession = 'manual';
let sessionTimeoutId = null;
let rampIntervalId = null; 
let currentBlinkMode = 'alternating';
let currentVisualMode = 'circle';
let lastBlinkTime = 0;

let eegSocket = null;

// Audio nodes
let binauralOscillatorLeft = null;
let binauralOscillatorRight = null;
let binauralMasterGain = null;
let isochronicOscillator = null;
let isochronicEnvelopeGain = null;
let isochronicPanner = null;
let isochronicMasterGain = null;
let crackleIsPlaying = false;
let crackleTimeoutId = null;
let crackleNoiseBuffer = null;
let crackleVolumeNode = null;
let alternophonyIsPlaying = false;
let alternophonyNoiseNode = null;
let alternophonyEnvelopeGain = null;
let alternophonyPannerNode = null;
let alternophonyMasterGain = null;

const musicLoopAudio = new Audio();
musicLoopAudio.loop = true;
let musicIsPlaying = false;

// Variables for generated waves
let waveIsPlaying = false;
let waveRumbleNode = null;
let waveHissNode = null;
let waveMasterVolume = null;
let waveLfoNode = null;
let waveMetaLfoNode = null;

// Ambiance system variables
let currentAmbiance = null;
let ambianceIsPlaying = false;

const SOUND_DURATION_S = 0.02;

const sessions = {
    deepRelaxation: [ 
        { startFreq: 10, endFreq: 8, duration: 120, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 6, duration: 120, blinkMode: 'synchro' },
        { startFreq: 6,  endFreq: 4, duration: 120, blinkMode: 'alternating' },
        { startFreq: 4,  endFreq: 4, duration: 240, blinkMode: 'crossed' }
    ],
    concentration: [ 
        { startFreq: 8,  endFreq: 10, duration: 60, blinkMode: 'synchro' },
        { startFreq: 10, endFreq: 12, duration: 60, blinkMode: 'synchro' },
        { startFreq: 12, endFreq: 15, duration: 120, blinkMode: 'alternating' },
        { startFreq: 15, endFreq: 15, duration: 60, blinkMode: 'synchro' }
    ],
    sleep: [
        { startFreq: 8, endFreq: 5, duration: 120, blinkMode: 'alternating' },
        { startFreq: 5, endFreq: 3, duration: 120, blinkMode: 'crossed' },
        { startFreq: 3, endFreq: 1, duration: 180, blinkMode: 'alternating' },
        { startFreq: 1, endFreq: 1, duration: 180, blinkMode: 'synchro' }
    ],
    meditation: [
        { startFreq: 10, endFreq: 7, duration: 240, blinkMode: 'alternating' },
        { startFreq: 7,  endFreq: 5, duration: 360, blinkMode: 'crossed' },
        { startFreq: 5,  endFreq: 5, duration: 600, blinkMode: 'synchro' }
    ],
    fastRelaxation: [ 
        { startFreq: 10, endFreq: 8, duration: 60, blinkMode: 'alternating' },
        { startFreq: 8,  endFreq: 6, duration: 60, blinkMode: 'synchro' },
        { startFreq: 6,  endFreq: 4, duration: 60, blinkMode: 'alternating' },
        { startFreq: 4,  endFreq: 4, duration: 120, blinkMode: 'crossed' }
    ],
    fastMeditation: [
        { startFreq: 10, endFreq: 7, duration: 120, blinkMode: 'alternating' },
        { startFreq: 7,  endFreq: 5, duration: 180, blinkMode: 'crossed' },
        { startFreq: 5,  endFreq: 5, duration: 300, blinkMode: 'synchro' }
    ],
    eeg: [],
    user1: [],
    user2: []
};

// --- Global DOM References ---
let leftPanel, centerPanel, rightPanel, startButton, colorPicker;
let carrierFrequencySlider, carrierFrequencyInput;
let blinkRateSlider, blinkFrequencyInput;
let audioModeRadios;
let bbMultiplierRadios;
let binauralVolumeSlider, isochronenVolumeSlider, alternophonyVolumeSlider;
let binauralBeatFrequencyDisplay;
let warningButton, warningModal, understoodButton;
let helpButton, helpModal;
let flagFr, flagEn;
let appContainer, visualPanelsWrapper, immersiveExitButton, frequencyDisplayOverlay;
let crackleToggleButton, crackleVolumeSlider;
let alternophonyToggleButton;
let sessionSelect;
let blinkModeRadios;
let set432hzButton;
let musicLoopSelect, musicLoopVolumeSlider, musicToggleButton;
let sessionHelpButton, sessionGraphModal;
let aboutButton, aboutModal;
let customSessionModal, customSessionForm, customSessionTableBody, saveCustomSessionButton, cancelCustomSessionButton, editSessionButton;
let visualModeSelect;
let leftCanvas, rightCanvas, leftCtx, rightCtx;

// DOM References for the ambiance system
let ambianceSelect, ambianceToggleButton, ambianceVolumeSlider;


// --- Global Functions ---

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-en]').forEach(element => {
        const text = element.getAttribute(lang === 'en' ? 'data-en' : 'data-fr');
        if (!text) return;
        if (element.id === 'startButton') {
            element.textContent = visualTimeoutId ? (lang === 'en' ? 'Stop' : 'Arrêter') : text;
        } else if (element.tagName === 'LI' || element.tagName === 'P' || element.tagName === 'H2' || element.tagName === 'H3' || element.tagName === 'H4' || element.tagName === 'SPAN' || element.tagName === 'OPTION') {
            element.innerHTML = text;
        } else {
            element.textContent = text;
        }
    });
    document.querySelectorAll('.lang-flag').forEach(flag => {
        flag.classList.toggle('active', flag.dataset.lang === lang);
    });
}

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGainNode = audioContext.createGain();
            masterGainNode.connect(audioContext.destination);
            masterGainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        } catch (e) {
            alert('Your browser does not support the Web Audio API.');
        }
    }
}

function synchronizeMusicLoop() {
    if (musicLoopAudio && !musicLoopAudio.paused) {
        musicLoopAudio.playbackRate = BLINK_FREQUENCY_HZ / 8.0;
    }
}

// --- Functions for EEG Feedback ---

function handleEEGData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        const minVol = 0.25;
        const volRange = 0.50;

        const attValue = parseFloat(data.att);
        if (!isNaN(attValue) && attValue >= 0 && attValue <= 1) {
            const minFreq = 1;
            const maxFreq = 16;
            BLINK_FREQUENCY_HZ = minFreq + (attValue * (maxFreq - minFreq));
        }

        const engValue = parseFloat(data.eng);
        if (!isNaN(engValue) && engValue >= 0 && engValue <= 1) {
            const minCarrier = 40;
            const maxCarrier = 440;
            currentCarrierFrequency = minCarrier + (engValue * (maxCarrier - minCarrier));
            carrierFrequencyInput.value = currentCarrierFrequency.toFixed(0);
            carrierFrequencySlider.value = currentCarrierFrequency;
            if (visualTimeoutId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) {
                startBinauralBeats();
            }
        }

        const intValue = parseFloat(data.int);
        if (!isNaN(intValue) && intValue >= 0 && intValue <= 1) {
            currentBinauralVolume = minVol + (intValue * volRange);
            binauralVolumeSlider.value = currentBinauralVolume * 100;
             if (binauralMasterGain && audioContext) {
                binauralMasterGain.gain.setTargetAtTime(currentBinauralVolume, audioContext.currentTime, 0.01);
            }
        }

        const excValue = parseFloat(data.exc);
        if (!isNaN(excValue) && excValue >= 0 && excValue <= 1) {
            let newMode;
            if (excValue < 0.33) newMode = 'alternating';
            else if (excValue < 0.66) newMode = 'synchro';
            else newMode = 'crossed';
            if (newMode !== currentBlinkMode) {
                currentBlinkMode = newMode;
                document.querySelector(`input[name="blinkMode"][value="${newMode}"]`).checked = true;
            }
        }
        
        const relValue = parseFloat(data.rel);
        if (!isNaN(relValue) && relValue >= 0 && relValue <= 1) {
            currentIsochronenVolume = minVol + (relValue * volRange);
            isochronenVolumeSlider.value = currentIsochronenVolume * 100;
        }

        const strValue = parseFloat(data.str);
        if (!isNaN(strValue) && strValue >= 0 && strValue <= 1) {
            currentAlternophonyVolume = minVol + (strValue * volRange);
            alternophonyVolumeSlider.value = currentAlternophonyVolume * 100;
            if (alternophonyMasterGain && audioContext) {
                alternophonyMasterGain.gain.setTargetAtTime(currentAlternophonyVolume, audioContext.currentTime, 0.01);
            }
        }

        updateFrequencyDisplays();

    } catch (e) {
        console.error("Erreur lors du traitement des données EEG JSON:", e);
    }
}

function connectEEG() {
    if (eegSocket) return; 
    eegSocket = new WebSocket('ws://localhost:8081');
    eegSocket.onopen = () => {
        console.log("Connecté au pont EEG !");
        frequencyDisplayOverlay.textContent = "EEG";
    };
    eegSocket.onmessage = (event) => handleEEGData(event.data);
    eegSocket.onerror = (error) => {
        console.error("Erreur WebSocket EEG:", error);
        alert("Impossible de se connecter au serveur pont EEG. Assurez-vous qu'il est bien lancé.");
        if (visualTimeoutId) startButton.click();
    };
    eegSocket.onclose = () => {
        console.log("Déconnecté du pont EEG.");
        eegSocket = null;
        if (currentSession === 'eeg' && visualTimeoutId) startButton.click();
    };
}

function disconnectEEG() {
    if (eegSocket) {
        eegSocket.close();
    }
}

// --- End of EEG Functions ---


function getSynchronizedBinauralBeatFrequency() {
    return BLINK_FREQUENCY_HZ * currentBBMultiplier;
}

function startBinauralBeats() {
    initAudioContext();
    stopBinauralBeats();
    const binauralBeatFreq = getSynchronizedBinauralBeatFrequency();
    const freqLeftEar = currentCarrierFrequency - (binauralBeatFreq / 2);
    const freqRightEar = currentCarrierFrequency + (binauralBeatFreq / 2);
    if (freqLeftEar <= 0 || freqRightEar <= 0 || !audioContext) return; 

    binauralOscillatorLeft = audioContext.createOscillator();
    binauralOscillatorLeft.type = 'sine';
    binauralOscillatorLeft.frequency.value = freqLeftEar;
    
    binauralOscillatorRight = audioContext.createOscillator();
    binauralOscillatorRight.type = 'sine';
    binauralOscillatorRight.frequency.value = freqRightEar;

    const gainLeft = audioContext.createGain();
    const gainRight = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);
    binauralMasterGain = audioContext.createGain();
    binauralOscillatorLeft.connect(gainLeft).connect(merger, 0, 0);
    binauralOscillatorRight.connect(gainRight).connect(merger, 0, 1);
    merger.connect(binauralMasterGain).connect(masterGainNode);
    binauralMasterGain.gain.setValueAtTime(currentBinauralVolume, audioContext.currentTime);
    binauralOscillatorLeft.start(audioContext.currentTime);
    binauralOscillatorRight.start(audioContext.currentTime);
    binauralBeatFrequencyDisplay.textContent = `BB: ${binauralBeatFreq.toFixed(1)} Hz`;
}

function stopBinauralBeats() {
    if (binauralOscillatorLeft) {
        binauralOscillatorLeft.stop();
        binauralOscillatorLeft.disconnect();
        binauralOscillatorLeft = null;
    }
    if (binauralOscillatorRight) {
        binauralOscillatorRight.stop();
        binauralOscillatorRight.disconnect();
    }
    if(binauralBeatFrequencyDisplay) binauralBeatFrequencyDisplay.textContent = `BB: -- Hz`;
}

function startIsochronicTones() {
    initAudioContext();
    stopIsochronicTones();
    if (!audioContext) return;
    isochronicOscillator = audioContext.createOscillator();
    isochronicOscillator.type = 'sine';
    isochronicOscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    isochronicEnvelopeGain = audioContext.createGain();
    isochronicEnvelopeGain.gain.setValueAtTime(0, audioContext.currentTime);
    isochronicPanner = audioContext.createStereoPanner();
    isochronicMasterGain = audioContext.createGain();
    isochronicOscillator.connect(isochronicEnvelopeGain);
    isochronicEnvelopeGain.connect(isochronicPanner);
    isochronicPanner.connect(isochronicMasterGain);
    isochronicMasterGain.connect(masterGainNode);
    isochronicOscillator.start();
}

function stopIsochronicTones() {
    if (isochronicOscillator) {
        isochronicOscillator.stop();
        isochronicOscillator.disconnect();
        isochronicOscillator = null;
    }
}

function startAlternophony() {
    initAudioContext();
    if (alternophonyIsPlaying) return;
    if (!audioContext) return;

    alternophonyNoiseNode = audioContext.createBufferSource();
    alternophonyNoiseNode.buffer = createNoiseBuffer(audioContext, 'white');
    alternophonyNoiseNode.loop = true;

    alternophonyEnvelopeGain = audioContext.createGain();
    alternophonyEnvelopeGain.gain.setValueAtTime(0, audioContext.currentTime);

    alternophonyPannerNode = audioContext.createStereoPanner();
    
    alternophonyMasterGain = audioContext.createGain();
    alternophonyMasterGain.gain.value = currentAlternophonyVolume;

    alternophonyNoiseNode.connect(alternophonyEnvelopeGain);
    alternophonyEnvelopeGain.connect(alternophonyPannerNode);
    alternophonyPannerNode.connect(alternophonyMasterGain);
    alternophonyMasterGain.connect(masterGainNode);
    
    alternophonyNoiseNode.start();
    alternophonyIsPlaying = true;
    if (alternophonyToggleButton) alternophonyToggleButton.classList.add('active');
}

function stopAlternophony() {
    if(alternophonyNoiseNode) {
        alternophonyNoiseNode.stop();
        alternophonyNoiseNode.disconnect();
        alternophonyNoiseNode = null;
    }
    alternophonyIsPlaying = false;
    if (alternophonyToggleButton) alternophonyToggleButton.classList.remove('active');
}

function playSound(panDirection) {
    const now = audioContext.currentTime;
    const soundDuration = 1 / BLINK_FREQUENCY_HZ;

    if (isochronicOscillator && (currentAudioMode === 'isochronen' || currentAudioMode === 'both')) {
        let panValue = 0;
        if (panDirection === 'left') {
            panValue = -1;
        } else if (panDirection === 'right') {
            panValue = 1;
        }
        
        if (currentBlinkMode === 'crossed') {
            panValue = -panValue;
        }
        
        isochronicPanner.pan.setValueAtTime(panValue, now);
        isochronicMasterGain.gain.setValueAtTime(currentIsochronenVolume, now);
        isochronicEnvelopeGain.gain.cancelScheduledValues(now);
        isochronicEnvelopeGain.gain.setValueAtTime(0, now);
        isochronicEnvelopeGain.gain.linearRampToValueAtTime(1.0, now + 0.01);
        isochronicEnvelopeGain.gain.linearRampToValueAtTime(0, now + soundDuration);
    }
    
    if (alternophonyIsPlaying) {
        if (panDirection === 'center') {
            alternophonyPannerNode.pan.setValueAtTime(0, now);
        } else {
            const startPan = panDirection === 'left' ? -1 : 1;
            const endPan = panDirection === 'left' ? 1 : -1;
            
            alternophonyPannerNode.pan.cancelScheduledValues(now);
            alternophonyPannerNode.pan.setValueAtTime(startPan, now);
            alternophonyPannerNode.pan.linearRampToValueAtTime(endPan, now + soundDuration);
        }

        alternophonyEnvelopeGain.gain.cancelScheduledValues(now);
        alternophonyEnvelopeGain.gain.setValueAtTime(0, now);
        alternophonyEnvelopeGain.gain.linearRampToValueAtTime(1.0, now + soundDuration);
    }
}

function createNoiseBuffer(audioCtx, type) {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    if (type === 'brown') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
    } else {
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }
    return buffer;
}

function startWaves() {
    if (waveIsPlaying) return;
    initAudioContext();
    if (!audioContext) return;
    waveRumbleNode = audioContext.createBufferSource();
    waveRumbleNode.buffer = createNoiseBuffer(audioContext, 'brown');
    waveRumbleNode.loop = true;
    const rumbleModulationGain = audioContext.createGain();
    rumbleModulationGain.gain.value = 0.6; 
    waveHissNode = audioContext.createBufferSource();
    waveHissNode.buffer = createNoiseBuffer(audioContext, 'white');
    waveHissNode.loop = true;
    const hissFilter = audioContext.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = 5000;
    hissFilter.Q.value = 1;
    const hissModulationGain = audioContext.createGain();
    hissModulationGain.gain.value = 0.4;
    waveLfoNode = audioContext.createOscillator();
    waveLfoNode.frequency.value = 0.15;
    const lfoGain = audioContext.createGain();
    lfoGain.gain.value = 1;
    waveMetaLfoNode = audioContext.createOscillator();
    waveMetaLfoNode.frequency.value = 0.03;
    const metaLfoGain = audioContext.createGain();
    metaLfoGain.gain.value = 0.05;
    waveMasterVolume = audioContext.createGain();
    waveMasterVolume.gain.value = parseFloat(ambianceVolumeSlider.value) / 100;
    waveRumbleNode.connect(rumbleModulationGain).connect(waveMasterVolume);
    waveHissNode.connect(hissFilter).connect(hissModulationGain).connect(waveMasterVolume);
    waveMasterVolume.connect(masterGainNode);
    waveLfoNode.connect(lfoGain);
    lfoGain.connect(rumbleModulationGain.gain);
    lfoGain.connect(hissModulationGain.gain);
    waveMetaLfoNode.connect(metaLfoGain).connect(waveLfoNode.frequency);
    waveRumbleNode.start();
    waveHissNode.start();
    waveLfoNode.start();
    waveMetaLfoNode.start();
    waveIsPlaying = true;
}

function stopWaves() {
    if (!waveIsPlaying) return;
    if (waveRumbleNode) waveRumbleNode.stop();
    if (waveHissNode) waveHissNode.stop();
    if (waveLfoNode) waveLfoNode.stop();
    if (waveMetaLfoNode) waveMetaLfoNode.stop();
    waveIsPlaying = false;
}

function startCrackles() {
    if (crackleIsPlaying) return;
    initAudioContext();
    if (!audioContext) return;
    if (!crackleNoiseBuffer) crackleNoiseBuffer = createNoiseBuffer(audioContext, 'white');
    crackleVolumeNode = audioContext.createGain();
    crackleVolumeNode.connect(masterGainNode);
    updateCrackleVolume();
    function scheduleCrackle() {
        const source = audioContext.createBufferSource();
        source.buffer = crackleNoiseBuffer;
        source.playbackRate.value = 0.5 + Math.random() * 1.0; 
        const envelope = audioContext.createGain();
        envelope.connect(crackleVolumeNode);
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000 + (Math.random() * 3000);
        source.connect(filter).connect(envelope);
        source.start();
        const now = audioContext.currentTime;
        const attackTime = 0.005;
        const decayTime = 0.4 + Math.random() * 0.6; 
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1, now + attackTime);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + attackTime + decayTime);
        source.stop(now + attackTime + decayTime + 0.1);
        const randomDelay = 150 + Math.random() * 500;
        crackleTimeoutId = setTimeout(scheduleCrackle, randomDelay);
    }
    scheduleCrackle();
    crackleIsPlaying = true;
    crackleToggleButton.classList.add('active');
}

function stopCrackles() {
    if (!crackleIsPlaying) return;
    clearTimeout(crackleTimeoutId);
    crackleTimeoutId = null;
    if (crackleVolumeNode) {
        crackleVolumeNode.disconnect();
        crackleVolumeNode = null;
    }
    crackleIsPlaying = false;
    crackleToggleButton.classList.remove('active');
}

function updateCrackleVolume() {
    if (crackleVolumeNode && audioContext) {
        const newVolume = parseFloat(crackleVolumeSlider.value) / 100;
        crackleVolumeNode.gain.setTargetAtTime(newVolume, audioContext.currentTime, 0.01);
    }
}

// --- VISUALS ---
function getProportionalFlashDuration(minDuty, maxDuty) {
    const minFreq = 0.2;
    const maxFreq = 20.0;
    
    // Assure-toi de ne pas diviser par zéro si minFreq === maxFreq
    if (maxFreq === minFreq) {
        return (1000 / BLINK_FREQUENCY_HZ) * minDuty;
    }
    
    const progress = Math.max(0, Math.min(1, (BLINK_FREQUENCY_HZ - minFreq) / (maxFreq - minFreq)));
    const dutyCycle = minDuty - (progress * (minDuty - maxDuty));
    
    return (1000 / BLINK_FREQUENCY_HZ) * dutyCycle;
}

function updateVisuals(isBlinking) {
    if (currentVisualMode === 'circle') {
        leftCanvas.style.display = 'none';
        rightCanvas.style.display = 'none';
        drawCircleVisual(isBlinking);
    } else {
        clearCircleVisuals();
        leftCanvas.style.display = 'block';
        rightCanvas.style.display = 'block';
        
        let shouldAnimateNow = false;
        if (currentBlinkMode === 'alternating' || currentBlinkMode === 'crossed') {
            const flashDuration = getProportionalFlashDuration(0.9, 0.5); // 90% -> 50%
            shouldAnimateNow = (performance.now() - lastBlinkTime < flashDuration);
        } else { // synchro
            const flashDuration = getProportionalFlashDuration(0.5, 0.2); // 50% -> 20%
            shouldAnimateNow = (performance.now() - lastBlinkTime < flashDuration);
        }
        animateCanvasVisuals(shouldAnimateNow);
    }
}

function clearCircleVisuals() {
    document.querySelectorAll('.visual-circle').forEach(c => c.remove());
}

function drawCircleVisual(isBlinking) {
    if (currentBlinkMode === 'alternating' || currentBlinkMode === 'crossed') {
        const flashDuration = getProportionalFlashDuration(0.9, 0.5);
        if (isBlinking) {
            clearCircleVisuals();
            const targetPanel = isLeftLight ? leftPanel : rightPanel;
            targetPanel.appendChild(createSizedCircle(targetPanel));
        } else if (performance.now() - lastBlinkTime > flashDuration) {
             clearCircleVisuals();
        }
    } else { // synchro
        const flashDuration = getProportionalFlashDuration(0.5, 0.2);
        if (isBlinking) {
            clearCircleVisuals();
            leftPanel.appendChild(createSizedCircle(leftPanel));
            rightPanel.appendChild(createSizedCircle(rightPanel));
        } else if (performance.now() - lastBlinkTime > flashDuration) {
            clearCircleVisuals();
        }
    }
}

function createSizedCircle(panel) {
    const circle = document.createElement('div');
    circle.className = 'circle visual-circle';
    circle.style.backgroundColor = colorPicker.value;
    const diameter = Math.min(panel.clientWidth, panel.clientHeight) * 0.85;
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    return circle;
}

function animateCanvasVisuals(shouldDraw) {
    const time = performance.now() / 1000; 

    if (!shouldDraw) {
        leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        return;
    }
    
    const drawOnPanel = (ctx, panel) => {
        const width = panel.clientWidth;
        const height = panel.clientHeight;
        if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
            ctx.canvas.width = width;
            ctx.canvas.height = height;
        }

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        ctx.fillStyle = colorPicker.value;
        ctx.strokeStyle = colorPicker.value;

        switch (currentVisualMode) {
            case 'circleOfCircles': drawCircleOfCircles(ctx, centerX, centerY, time); break;
            case 'tunnel': drawTunnel(ctx, centerX, centerY, time); break;
            case 'mandala': drawMandala(ctx, centerX, centerY, time); break;
            case 'fractal': drawFractal(ctx, centerX, centerY, time); break;
        }
    };
    
    if (currentBlinkMode === 'alternating' || currentBlinkMode === 'crossed') {
        if (isLeftLight) {
            drawOnPanel(leftCtx, leftCanvas);
            rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
        } else {
            drawOnPanel(rightCtx, rightCanvas);
            leftCtx.clearRect(0, 0, leftCanvas.width, leftCanvas.height);
        }
    } else { // synchro
        drawOnPanel(leftCtx, leftCanvas);
        drawOnPanel(rightCtx, rightCanvas);
    }
}


// Drawing functions for canvas visuals
function drawCircleOfCircles(ctx, cx, cy, time) {
    const numCircles = 12;
    const mainRadius = Math.min(cx, cy) * 0.6;
    const smallRadius = mainRadius / 5;
    for (let i = 0; i < numCircles; i++) {
        const angle = (i / numCircles) * 2 * Math.PI + time;
        const x = cx + mainRadius * Math.cos(angle);
        const y = cy + mainRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, smallRadius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawTunnel(ctx, cx, cy, time) {
    const numRects = 10;
    const maxDim = Math.max(cx, cy);
    ctx.lineWidth = 2;
    for (let i = 0; i < numRects; i++) {
        const size = (maxDim * 2) * ((i - (time * 2 % 1) + 1) / numRects);
        ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    }
}

function drawMandala(ctx, cx, cy, time) {
    const numLines = 18;
    const radius = Math.min(cx, cy) * 0.8;
    ctx.lineWidth = 2;
    for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * 2 * Math.PI;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius, 0);
        ctx.arc(radius / 2, 0, radius / 2 * Math.abs(Math.sin(time + angle)), 0, Math.PI);
        ctx.stroke();
        ctx.restore();
    }
}

function drawFractal(ctx, cx, cy, time) {
    ctx.lineWidth = 1;
    function drawBranch(x, y, len, angle, depth) {
        if (depth === 0) return;
        ctx.beginPath();
        ctx.moveTo(x, y);
        const newX = x + len * Math.cos(angle);
        const newY = y + len * Math.sin(angle);
        ctx.lineTo(newX, newY);
        ctx.stroke();
        drawBranch(newX, newY, len * 0.8, angle - 0.5 + Math.sin(time/2)/2, depth - 1);
        drawBranch(newX, newY, len * 0.8, angle + 0.5 + Math.cos(time/2)/2, depth - 1);
    }
    drawBranch(cx, cy * 1.4, Math.min(cx, cy) / 4, -Math.PI / 2, 7);
}

function updateFrequencyDisplays() {
    if (frequencyDisplayOverlay) {
        if (currentSession !== 'eeg') {
            frequencyDisplayOverlay.textContent = `${BLINK_FREQUENCY_HZ.toFixed(1)} Hz`;
        } else {
            frequencyDisplayOverlay.textContent = "EEG";
        }
    }
    blinkFrequencyInput.value = BLINK_FREQUENCY_HZ.toFixed(1);
    blinkRateSlider.value = BLINK_FREQUENCY_HZ;
    binauralBeatFrequencyDisplay.textContent = `BB: ${getSynchronizedBinauralBeatFrequency().toFixed(1)} Hz`;
    synchronizeMusicLoop();
}

function validateAndSetFrequency(inputElement, sliderElement, isBlinkFreq) {
    let newValue = parseFloat(inputElement.value);
    const minVal = parseFloat(inputElement.min);
    const maxVal = parseFloat(inputElement.max);
    if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
        newValue = parseFloat(sliderElement.value);
        if (isNaN(newValue) || newValue < minVal || newValue > maxVal) newValue = minVal;
        inputElement.value = isBlinkFreq ? newValue.toFixed(1) : newValue;
    }
    if (isBlinkFreq) {
        BLINK_FREQUENCY_HZ = newValue;
    } else {
        currentCarrierFrequency = newValue;
    }
    sliderElement.value = newValue;
    updateFrequencyDisplays();
}

function runSession(sessionKey, step = 0) {
    clearTimeout(sessionTimeoutId);
    clearInterval(rampIntervalId);

    const sessionSteps = sessions[sessionKey];
    if (!sessionSteps || sessionSteps.length === 0 || step >= sessionSteps.length) {
        if(visualTimeoutId) startButton.click();
        return;
    }

    const currentStep = sessionSteps[step];
    const { startFreq, endFreq, duration, blinkMode } = currentStep;

    if (blinkMode && blinkMode !== currentBlinkMode) {
        currentBlinkMode = blinkMode;
        const radioToSelect = document.querySelector(`input[name="blinkMode"][value="${blinkMode}"]`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        }
    }
    
    let stepStartTime = Date.now();
    
    rampIntervalId = setInterval(() => {
        const elapsedTime = (Date.now() - stepStartTime) / 1000;
        const progress = Math.min(elapsedTime / duration, 1);
        BLINK_FREQUENCY_HZ = startFreq + (endFreq - startFreq) * progress;
        updateFrequencyDisplays();
    }, 100);

    if ((currentAudioMode === 'binaural' || currentAudioMode === 'both') && binauralOscillatorLeft && binauralOscillatorRight) {
        const now = audioContext.currentTime;
        const endBeat = endFreq * currentBBMultiplier;
        binauralOscillatorLeft.frequency.linearRampToValueAtTime(currentCarrierFrequency - (endBeat / 2), now + duration);
        binauralOscillatorRight.frequency.linearRampToValueAtTime(currentCarrierFrequency + (endBeat / 2), now + duration);
    }

    sessionTimeoutId = setTimeout(() => {
        runSession(sessionKey, step + 1);
    }, duration * 1000);
}

function createSessionGraph(sessionData, sessionName) {
    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    if (!sessionData || sessionData.length === 0) return document.createElement('div');

    let totalDuration = 0;
    let maxFreq = 0;
    sessionData.forEach(d => {
        totalDuration += d.duration;
        maxFreq = Math.max(maxFreq, d.startFreq, d.endFreq);
    });
    maxFreq = Math.ceil(maxFreq / 5) * 5;

    const xScale = (t) => (t / totalDuration) * width;
    const yScale = (f) => height - (f / maxFreq) * height;

    const getSymbol = (mode, x, y) => {
        switch (mode) {
            case 'synchro':
                return `<rect class="graph-symbol" x="${x - 3}" y="${y - 3}" width="6" height="6"></rect>`;
            case 'crossed':
                return `<path class="graph-symbol cross" d="M ${x - 3} ${y - 3} L ${x + 3} ${y + 3} M ${x - 3} ${y + 3} L ${x + 3} ${y - 3}"></path>`;
            case 'alternating':
            default:
                return `<circle class="graph-symbol" cx="${x}" cy="${y}" r="3.5"></circle>`;
        }
    };
    
    let pathPoints = [];
    let symbolsHtml = '';
    let currentTime = 0;

    pathPoints.push({ x: xScale(0), y: yScale(sessionData[0].startFreq) });
    
    sessionData.forEach(segment => {
        symbolsHtml += getSymbol(segment.blinkMode, xScale(currentTime), yScale(segment.startFreq));
        
        currentTime += segment.duration;
        pathPoints.push({ x: xScale(currentTime), y: yScale(segment.endFreq) });
    });

    const pathData = "M " + pathPoints.map(p => `${p.x} ${p.y}`).join(" L ");

    let yAxisHtml = '';
    let xAxisInterval = 60;
    if (totalDuration > 1200) { 
        xAxisInterval = 180;
    } else if (totalDuration > 600) { 
        xAxisInterval = 120;
    }
    
    for(let i = 0; i <= maxFreq; i += 5) {
        if (i > 0) yAxisHtml += `<line class="graph-gridline" x1="0" x2="${width}" y1="${yScale(i)}" y2="${yScale(i)}"></line>`;
        yAxisHtml += `<text class="graph-text" x="-5" y="${yScale(i)}" dy="3" text-anchor="end">${i} Hz</text>`;
    }

    let xAxisHtml = '';
    for(let i = 0; i <= totalDuration; i += xAxisInterval) {
        xAxisHtml += `<text class="graph-text" x="${xScale(i)}" y="${height + 15}" text-anchor="middle">${i}s</text>`;
    }

    const legendY = height + 45;
    const legendHtml = `
        <g class="graph-legend" transform="translate(0, ${legendY})">
            ${getSymbol('alternating', 15, 0)} <text class="graph-text" x="25" y="0" dy="4">Alterné</text>
            ${getSymbol('synchro', 110, 0)} <text class="graph-text" x="120" y="0" dy="4">Synchro</text>
            ${getSymbol('crossed', 205, 0)} <text class="graph-text" x="215" y="0" dy="4">Croisé</text>
        </g>
    `;

    const svg = `
        <svg viewBox="0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}">
            <g transform="translate(${margin.left},${margin.top})">
                <line class="graph-axis" x1="0" y1="0" x2="0" y2="${height}"></line>
                <line class="graph-axis" x1="0" y1="${height}" x2="${width}" y2="${height}"></line>
                <text class="graph-axis-label" transform="rotate(-90)" y="-30" x="${-height/2}" text-anchor="middle">Fréquence (Hz)</text>
                <text class="graph-axis-label" y="${height + 30}" x="${width/2}" text-anchor="middle">Temps (s)</text>
                ${yAxisHtml}
                ${xAxisHtml}
                <path class="graph-path" d="${pathData}"></path>
                ${symbolsHtml}
                ${legendHtml}
            </g>
        </svg>
    `;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'session-graph-wrapper';
    const title = document.createElement('h4');
    const optionName = document.querySelector(`#session-select option[value=${sessionName}]`);
    title.setAttribute('data-en', optionName ? optionName.dataset.en : sessionName);
    title.setAttribute('data-fr', optionName ? optionName.dataset.fr : sessionName);
    wrapper.appendChild(title);
    wrapper.innerHTML += svg;
    return wrapper;
}

function generateAllSessionGraphs() {
    const container = document.getElementById('session-graphs-container');
    container.innerHTML = '';
    
    for (const key in sessions) {
        if (Object.hasOwnProperty.call(sessions, key) && key !== 'eeg' && sessions[key].length > 0) {
            const graphElement = createSessionGraph(sessions[key], key);
            container.appendChild(graphElement);
        }
    }
    setLanguage(currentLanguage);
}


function openCustomSessionModal(sessionKey) {
    currentlyEditingSession = sessionKey;
    const sessionData = sessions[sessionKey];
    customSessionTableBody.innerHTML = ''; 

    for (let i = 0; i < 6; i++) {
        const segment = sessionData[i] || { startFreq: 0, endFreq: 0, duration: 0, blinkMode: 'alternating' };
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td><input type="number" step="0.1" min="0" max="40" value="${segment.startFreq}" required></td>
            <td><input type="number" step="0.1" min="0" max="40" value="${segment.endFreq}" required></td>
            <td><input type="number" step="1" min="0" value="${segment.duration}" required></td>
            <td>
                <select>
                    <option value="alternating" ${segment.blinkMode === 'alternating' ? 'selected' : ''}>Alterné</option>
                    <option value="synchro" ${segment.blinkMode === 'synchro' ? 'selected' : ''}>Synchro</option>
                    <option value="crossed" ${segment.blinkMode === 'crossed' ? 'selected' : ''}>Croisé</option>
                </select>
            </td>
        `;
        customSessionTableBody.appendChild(row);
    }
    customSessionModal.style.display = 'flex';
}

function saveCustomSession() {
    const newSessionData = [];
    const rows = customSessionTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        const startFreq = parseFloat(inputs[0].value);
        const endFreq = parseFloat(inputs[1].value);
        const duration = parseInt(inputs[2].value, 10);
        const blinkMode = inputs[3].value;

        if (duration > 0) {
            newSessionData.push({ startFreq, endFreq, duration, blinkMode });
        }
    });

    sessions[currentlyEditingSession] = newSessionData;
    localStorage.setItem(currentlyEditingSession, JSON.stringify(newSessionData));
    
    customSessionModal.style.display = 'none';
}

function loadCustomSessions() {
    const user1Data = localStorage.getItem('user1');
    const user2Data = localStorage.getItem('user2');

    if (user1Data) {
        sessions.user1 = JSON.parse(user1Data);
    }
    if (user2Data) {
        sessions.user2 = JSON.parse(user2Data);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // DOM Assignments
    appContainer = document.getElementById('app-container');
    leftPanel = document.getElementById('left-panel');
    rightPanel = document.getElementById('right-panel');
    startButton = document.getElementById('startButton');
    colorPicker = document.getElementById('colorPicker');
    carrierFrequencySlider = document.getElementById('carrierFrequencySlider');
    carrierFrequencyInput = document.getElementById('carrierFrequencyInputDisplay');
    blinkRateSlider = document.getElementById('blinkRateSlider');
    blinkFrequencyInput = document.getElementById('blinkFrequencyInputDisplay');
    audioModeRadios = document.querySelectorAll('input[name="audioMode"]');
    bbMultiplierRadios = document.querySelectorAll('input[name="bbMultiplier"]');
    binauralVolumeSlider = document.getElementById('binauralVolumeSlider');
    isochronenVolumeSlider = document.getElementById('isochronenVolumeSlider');
    alternophonyVolumeSlider = document.getElementById('alternophony-volume-slider');
    binauralBeatFrequencyDisplay = document.getElementById('binauralBeatFrequencyDisplay');
    warningButton = document.getElementById('warningButton');
    warningModal = document.getElementById('warningModal');
    understoodButton = document.getElementById('understoodButton');
    helpButton = document.getElementById('helpButton');
    helpModal = document.getElementById('helpModal');
    flagFr = document.getElementById('flag-fr');
    flagEn = document.getElementById('flag-en');
    visualPanelsWrapper = document.getElementById('visual-panels-wrapper');
    immersiveExitButton = document.getElementById('immersive-exit-button');
    crackleToggleButton = document.getElementById('crackle-toggle-button');
    crackleVolumeSlider = document.getElementById('crackle-volume-slider');
    alternophonyToggleButton = document.getElementById('alternophony-toggle-button');
    sessionSelect = document.getElementById('session-select');
    frequencyDisplayOverlay = document.getElementById('frequency-display-overlay');
    blinkModeRadios = document.querySelectorAll('input[name="blinkMode"]');
    set432hzButton = document.getElementById('set432hzButton');
    musicLoopSelect = document.getElementById('music-loop-select');
    musicLoopVolumeSlider = document.getElementById('music-loop-volume-slider');
    musicToggleButton = document.getElementById('music-toggle-button');
    sessionHelpButton = document.getElementById('sessionHelpButton');
    sessionGraphModal = document.getElementById('sessionGraphModal');
    aboutButton = document.getElementById('aboutButton');
    aboutModal = document.getElementById('aboutModal');
    customSessionModal = document.getElementById('customSessionModal');
    customSessionForm = document.getElementById('customSessionForm');
    customSessionTableBody = document.querySelector('#customSessionTable tbody');
    saveCustomSessionButton = document.getElementById('saveCustomSessionButton');
    cancelCustomSessionButton = document.getElementById('cancelCustomSessionButton');
    editSessionButton = document.getElementById('editSessionButton');
    visualModeSelect = document.getElementById('visualModeSelect');
    leftCanvas = document.getElementById('left-canvas');
    rightCanvas = document.getElementById('right-canvas');
    leftCtx = leftCanvas.getContext('2d');
    rightCtx = rightCanvas.getContext('2d');
    
    // Assignations DOM pour le système d'ambiance
    ambianceSelect = document.getElementById('ambiance-select');
    ambianceToggleButton = document.getElementById('ambiance-toggle-button');
    ambianceVolumeSlider = document.getElementById('ambiance-volume-slider');

    const warningCloseButton = warningModal.querySelector('.close-button');
    const helpCloseButton = helpModal.querySelector('.close-button');
    const sessionGraphModalCloseButton = sessionGraphModal.querySelector('.close-button');
    const aboutModalCloseButton = aboutModal.querySelector('.close-button');
    const customSessionModalCloseButton = customSessionModal.querySelector('.close-button');

    const fileAmbianceSources = {
        forest: new Audio('foret.mp3'),
        fireplace: new Audio('feu.mp3'),
        birds: new Audio('oiseaux.mp3')
    };
    Object.values(fileAmbianceSources).forEach(audio => audio.loop = true);

    // Variable Initialization
    BLINK_FREQUENCY_HZ = parseFloat(blinkRateSlider.value);
    currentCarrierFrequency = parseFloat(carrierFrequencyInput.value);
    currentBBMultiplier = parseFloat(document.querySelector('input[name="bbMultiplier"]:checked').value);
    currentAudioMode = document.querySelector('input[name="audioMode"]:checked').value;
    currentBinauralVolume = parseFloat(binauralVolumeSlider.value) / 100;
    currentIsochronenVolume = parseFloat(isochronenVolumeSlider.value) / 100;
    currentAlternophonyVolume = parseFloat(alternophonyVolumeSlider.value) / 100;
    currentBlinkMode = document.querySelector('input[name="blinkMode"]:checked').value;
    musicLoopAudio.volume = parseFloat(musicLoopVolumeSlider.value) / 100;
    
    // Initial Setup
    loadCustomSessions();
    validateAndSetFrequency(carrierFrequencySlider, carrierFrequencyInput, false);
    validateAndSetFrequency(blinkRateSlider, blinkFrequencyInput, true);
    setLanguage(currentLanguage);
    if (warningModal) warningModal.style.display = 'flex';

    // --- Main Animation Loop ---
    function animationLoop(timestamp) {
        if (!visualTimeoutId) return; 

        const interval = 1000 / BLINK_FREQUENCY_HZ;
        const isBlinkingThisFrame = (timestamp - lastBlinkTime >= interval);

        if (isBlinkingThisFrame) {
            lastBlinkTime = performance.now();
            playSound(isLeftLight ? 'left' : 'right');
            isLeftLight = !isLeftLight;
        }

        updateVisuals(isBlinkingThisFrame);
        
        visualTimeoutId = requestAnimationFrame(animationLoop);
    }
    
    // Event Listeners
    startButton.addEventListener('click', () => {
        initAudioContext();
        
        if (visualTimeoutId) {
            cancelAnimationFrame(visualTimeoutId);
            visualTimeoutId = null;
            clearTimeout(sessionTimeoutId);
            clearInterval(rampIntervalId);
            sessionTimeoutId = null;
            rampIntervalId = null;
            isLeftLight = false;
            
            clearCircleVisuals();
            leftCtx.clearRect(0,0,leftCanvas.width, leftCanvas.height);
            rightCtx.clearRect(0,0,rightCanvas.width, rightCanvas.height);

            stopBinauralBeats();
            stopIsochronicTones();
            stopAlternophony();
            stopCrackles();
            if(musicLoopAudio) musicLoopAudio.pause();
            if (currentAmbiance) currentAmbiance.pause();
            disconnectEEG();
            
            appContainer.classList.remove('stimulation-active');

            // Re-enable all controls
            blinkRateSlider.disabled = false;
            blinkFrequencyInput.disabled = false;
            sessionSelect.disabled = false;
            blinkModeRadios.forEach(radio => radio.disabled = false);
            carrierFrequencySlider.disabled = false;
            carrierFrequencyInput.disabled = false;
            binauralVolumeSlider.disabled = false;
            isochronenVolumeSlider.disabled = false;
            alternophonyVolumeSlider.disabled = false;


        } else {
            appContainer.classList.add('stimulation-active');
            currentSession = sessionSelect.value;
            
            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') startBinauralBeats();
            if (currentAudioMode === 'isochronen' || currentAudioMode === 'both') startIsochronicTones();
            if (currentAudioMode === 'alternophony') startAlternophony();
            
            lastBlinkTime = performance.now();
            visualTimeoutId = requestAnimationFrame(animationLoop);
            
            if (currentSession === 'manual') {
                validateAndSetFrequency(blinkRateSlider, blinkFrequencyInput, true);
            } else if (currentSession === 'eeg') {
                connectEEG();
                blinkRateSlider.disabled = true;
                blinkFrequencyInput.disabled = true;
                blinkModeRadios.forEach(radio => radio.disabled = true);
                carrierFrequencySlider.disabled = true;
                carrierFrequencyInput.disabled = true;
                binauralVolumeSlider.disabled = true;
                isochronenVolumeSlider.disabled = true;
                alternophonyVolumeSlider.disabled = true;
            } else {
                sessionSelect.disabled = true;
                blinkRateSlider.disabled = true;
                blinkFrequencyInput.disabled = true;
                blinkModeRadios.forEach(radio => radio.disabled = true);
                runSession(currentSession);
            }
        }
        setLanguage(currentLanguage);
    });

    sessionSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        editSessionButton.style.display = (selectedValue === 'user1' || selectedValue === 'user2') ? 'block' : 'none';
        
        if (selectedValue === 'user1' || selectedValue === 'user2') {
            openCustomSessionModal(selectedValue);
        } else if (selectedValue !== 'eeg' && eegSocket) {
            disconnectEEG();
        }
    });

    editSessionButton.addEventListener('click', () => {
        const selectedValue = sessionSelect.value;
        if (selectedValue === 'user1' || selectedValue === 'user2') {
            openCustomSessionModal(selectedValue);
        }
    });

    customSessionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCustomSession();
    });

    cancelCustomSessionButton.addEventListener('click', () => {
        customSessionModal.style.display = 'none';
    });

    customSessionModalCloseButton.addEventListener('click', () => {
        customSessionModal.style.display = 'none';
    });

    const handleFrequencyValidation = (isBlink) => {
        if (isBlink) {
            validateAndSetFrequency(blinkRateSlider, blinkFrequencyInput, true);
        } else {
            validateAndSetFrequency(carrierFrequencySlider, carrierFrequencyInput, false);
        }
        if (visualTimeoutId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) startBinauralBeats();
    };

    carrierFrequencySlider.addEventListener('input', () => { carrierFrequencyInput.value = carrierFrequencySlider.value; handleFrequencyValidation(false); });
    carrierFrequencyInput.addEventListener('change', () => handleFrequencyValidation(false));
    carrierFrequencyInput.addEventListener('keydown', e => { if (e.key === 'Enter') { handleFrequencyValidation(false); e.target.blur(); } });

    if (set432hzButton) {
        set432hzButton.addEventListener('click', () => {
            carrierFrequencyInput.value = 432;
            carrierFrequencyInput.dispatchEvent(new Event('change'));
        });
    }

    visualModeSelect.addEventListener('change', (e) => {
        currentVisualMode = e.target.value; 
    });

    blinkRateSlider.addEventListener('input', () => { blinkRateSlider.value = blinkRateSlider.value; handleFrequencyValidation(true); });
    blinkFrequencyInput.addEventListener('change', () => handleFrequencyValidation(true));
    blinkRateSlider.addEventListener('keydown', e => { if (e.key === 'Enter') { handleFrequencyValidation(true); e.target.blur(); } });

    audioModeRadios.forEach(radio => radio.addEventListener('change', e => {
        currentAudioMode = e.target.value;
        if (visualTimeoutId) {
            stopBinauralBeats();
            stopIsochronicTones();
            stopAlternophony();

            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') startBinauralBeats();
            if (currentAudioMode === 'isochronen' || currentAudioMode === 'both') startIsochronicTones();
            if (currentAudioMode === 'alternophony') startAlternophony();
        }
    }));

    bbMultiplierRadios.forEach(radio => radio.addEventListener('change', e => {
        currentBBMultiplier = parseFloat(e.target.value);
        updateFrequencyDisplays();
        if (visualTimeoutId && (currentAudioMode === 'binaural' || currentAudioMode === 'both')) startBinauralBeats();
    }));

    binauralVolumeSlider.addEventListener('input', e => {
        currentBinauralVolume = parseFloat(e.target.value) / 100;
        if (binauralMasterGain && audioContext) binauralMasterGain.gain.setValueAtTime(currentBinauralVolume, audioContext.currentTime);
    });
    isochronenVolumeSlider.addEventListener('input', e => {
        currentIsochronenVolume = parseFloat(e.target.value) / 100;
    });
    alternophonyVolumeSlider.addEventListener('input', (e) => {
        currentAlternophonyVolume = parseFloat(e.target.value) / 100;
        if (alternophonyMasterGain && audioContext) {
            alternophonyMasterGain.gain.setTargetAtTime(currentAlternophonyVolume, audioContext.currentTime, 0.01);
        }
    });

    // Écouteurs pour l'ASMR (indépendant)
    crackleToggleButton.addEventListener('click', () => {
        if (crackleIsPlaying) {
            stopCrackles();
        } else {
            startCrackles();
        }
    });
    crackleVolumeSlider.addEventListener('input', updateCrackleVolume);
    
    // Logique pour le système d'ambiance hybride
    const ambianceControllers = {
        waves: { play: startWaves, pause: stopWaves, setVolume: (vol) => { if (waveMasterVolume) waveMasterVolume.gain.setValueAtTime(vol, audioContext.currentTime, 0.01) } },
        forest: { audio: fileAmbianceSources.forest, play() { this.audio.play() }, pause() { this.audio.pause() }, setVolume(vol) { this.audio.volume = vol } },
        fireplace: { audio: fileAmbianceSources.fireplace, play() { this.audio.play() }, pause() { this.audio.pause() }, setVolume(vol) { this.audio.volume = vol } },
        birds: { audio: fileAmbianceSources.birds, play() { this.audio.play() }, pause() { this.audio.pause() }, setVolume(vol) { this.audio.volume = vol } },
    };

    ambianceSelect.addEventListener('change', (e) => {
        if (currentAmbiance) {
            currentAmbiance.pause();
        }
        
        const selectedKey = e.target.value;
        currentAmbiance = ambianceControllers[selectedKey] || null;
        
        if (currentAmbiance) {
            const currentVolume = parseFloat(ambianceVolumeSlider.value) / 100;
            currentAmbiance.setVolume(currentVolume);
            currentAmbiance.play();
            ambianceIsPlaying = true;
            ambianceToggleButton.classList.add('active');
        } else {
            ambianceIsPlaying = false;
            ambianceToggleButton.classList.remove('active');
        }
    });

    ambianceToggleButton.addEventListener('click', () => {
        if (!currentAmbiance) return;
        ambianceIsPlaying = !ambianceIsPlaying;
        if (ambianceIsPlaying) {
            currentAmbiance.play();
            ambianceToggleButton.classList.add('active');
        } else {
            currentAmbiance.pause();
            ambianceToggleButton.classList.remove('active');
        }
    });

    ambianceVolumeSlider.addEventListener('input', (e) => {
        const newVolume = parseFloat(e.target.value) / 100;
        if (currentAmbiance) {
            currentAmbiance.setVolume(newVolume);
        }
    });

    alternophonyToggleButton.addEventListener('click', () => {
        if (alternophonyIsPlaying) {
            stopAlternophony();
        } else {
            startAlternophony();
        }
    });
    
    // Logique pour la boucle musicale
    musicLoopSelect.addEventListener('change', (e) => {
        const track = e.target.value;
        musicLoopAudio.pause();
        musicToggleButton.classList.remove('active');
        musicIsPlaying = false;

        if (track === 'none') {
            musicLoopAudio.src = '';
        } else {
            initAudioContext();
            musicLoopAudio.src = track;
        }
    });

    musicToggleButton.addEventListener('click', () => {
        if (!musicLoopAudio.src || musicLoopAudio.src === '') return;

        musicIsPlaying = !musicIsPlaying;
        if(musicIsPlaying) {
            synchronizeMusicLoop();
            musicLoopAudio.play();
            musicToggleButton.classList.add('active');
        } else {
            musicLoopAudio.pause();
            musicToggleButton.classList.remove('active');
        }
    });

    musicLoopVolumeSlider.addEventListener('input', (e) => {
        musicLoopAudio.volume = parseFloat(e.target.value) / 100;
    });

    warningButton.addEventListener('click', () => {
        warningModal.style.display = 'flex';
        if (visualTimeoutId) startButton.click();
    });
    warningCloseButton.addEventListener('click', () => warningModal.style.display = 'none');
    understoodButton.addEventListener('click', () => warningModal.style.display = 'none');
    
    helpButton.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });
    helpCloseButton.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
    
    sessionHelpButton.addEventListener('click', () => {
        generateAllSessionGraphs();
        sessionGraphModal.style.display = 'flex';
    });
    sessionGraphModalCloseButton.addEventListener('click', () => {
        sessionGraphModal.style.display = 'none';
    });

    aboutButton.addEventListener('click', () => {
        aboutModal.style.display = 'flex';
    });
    aboutModalCloseButton.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });

    window.addEventListener('click', e => { 
        if (e.target == warningModal) warningModal.style.display = 'none';
        if (e.target == helpModal) helpModal.style.display = 'none';
        if (e.target == sessionGraphModal) sessionGraphModal.style.display = 'none';
        if (e.target == aboutModal) aboutModal.style.display = 'none';
        if (e.target == customSessionModal) customSessionModal.style.display = 'none';
    });

    flagFr.addEventListener('click', () => setLanguage('fr'));
    flagEn.addEventListener('click', () => setLanguage('en'));
    
    blinkModeRadios.forEach(radio => radio.addEventListener('change', e => {
        currentBlinkMode = e.target.value;
    }));

    // --- IMMERSIVE MODE LOGIC ---
    visualPanelsWrapper.addEventListener('click', (e) => {
        if (e.target.id === 'immersive-exit-button' || immersiveExitButton.contains(e.target)) return;
        appContainer.classList.add('immersive-mode');
    });
    immersiveExitButton.addEventListener('click', (e) => {
        e.stopPropagation();
        appContainer.classList.remove('immersive-mode');
    });
});