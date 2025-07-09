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

// Audio nodes
let binauralOscillatorLeft = null;
let binauralOscillatorRight = null;
let binauralMasterGain = null;
let isochronicOscillator = null;
let isochronicEnvelopeGain = null;
let isochronicPanner = null;
let isochronicMasterGain = null;
let waveIsPlaying = false;
let waveRumbleNode = null;
let waveHissNode = null;
let waveMasterVolume = null;
let waveLfoNode = null;
let waveMetaLfoNode = null;
let crackleIsPlaying = false;
let crackleTimeoutId = null;
let crackleNoiseBuffer = null;
let crackleVolumeNode = null;
let alternophonyIsPlaying = false;
let alternophonyNoiseNode = null;
let alternophonyEnvelopeGain = null;
let alternophonyPannerNode = null;
let alternophonyMasterGain = null;


const SOUND_DURATION_S = 0.02;

const sessions = {
    deepRelaxation: [ 
        { startFreq: 10, endFreq: 8, duration: 60 },
        { startFreq: 8,  endFreq: 6, duration: 60 },
        { startFreq: 6,  endFreq: 4, duration: 60 },
        { startFreq: 4,  endFreq: 4, duration: 120 }
    ],
    concentration: [ 
        { startFreq: 8,  endFreq: 10, duration: 60 },
        { startFreq: 10, endFreq: 12, duration: 60 },
        { startFreq: 12, endFreq: 15, duration: 120 },
        { startFreq: 15, endFreq: 15, duration: 60 }
    ],
    sleep: [
        { startFreq: 8, endFreq: 5, duration: 120 },
        { startFreq: 5, endFreq: 3, duration: 120 },
        { startFreq: 3, endFreq: 1, duration: 180 },
        { startFreq: 1, endFreq: 1, duration: 180 }
    ],
    meditation: [
        { startFreq: 10, endFreq: 7, duration: 120 },
        { startFreq: 7,  endFreq: 5, duration: 180 },
        { startFreq: 5,  endFreq: 5, duration: 300 }
    ]
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
let waveToggleButton, waveVolumeSlider;
let crackleToggleButton, crackleVolumeSlider;
let alternophonyToggleButton;
let sessionSelect;
let blinkModeRadios;


// --- Global Functions ---

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-en]').forEach(element => {
        const text = element.getAttribute(lang === 'en' ? 'data-en' : 'data-fr');
        if (!text) return;
        if (element.id === 'startButton') {
            element.textContent = visualTimeoutId ? (lang === 'en' ? 'Stop' : 'Arrêter') : text;
        } else if (element.tagName === 'LI' || element.tagName === 'P' || element.tagName === 'H2' || element.tagName === 'SPAN' || element.tagName === 'OPTION') {
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
    if (alternophonyIsPlaying) return; // Already playing
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
        
        isochronicPanner.pan.setValueAtTime(panValue, now);
        isochronicMasterGain.gain.setValueAtTime(currentIsochronenVolume, now);
        isochronicEnvelopeGain.gain.cancelScheduledValues(now);
        isochronicEnvelopeGain.gain.setValueAtTime(0, now);
        isochronicEnvelopeGain.gain.linearRampToValueAtTime(1.0, now + 0.01);
        isochronicEnvelopeGain.gain.linearRampToValueAtTime(0, now + soundDuration);
    }
    
    if (alternophonyIsPlaying) {
        // Handle the panning sweep
        if (panDirection === 'center') {
            alternophonyPannerNode.pan.setValueAtTime(0, now);
        } else {
            // Invert the sweep direction
            const startPan = panDirection === 'left' ? -1 : 1; // Start on the SAME side as the flash
            const endPan = panDirection === 'left' ? 1 : -1;   // End on the OPPOSITE side of the flash
            
            alternophonyPannerNode.pan.cancelScheduledValues(now);
            alternophonyPannerNode.pan.setValueAtTime(startPan, now);
            alternophonyPannerNode.pan.linearRampToValueAtTime(endPan, now + soundDuration);
        }

        // Create an envelope with increasing intensity throughout the sweep.
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
    waveMasterVolume.gain.value = parseFloat(waveVolumeSlider.value) / 100;
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
    waveToggleButton.classList.add('active');
}

function stopWaves() {
    if (!waveIsPlaying) return;
    if (waveRumbleNode) waveRumbleNode.stop();
    if (waveHissNode) waveHissNode.stop();
    if (waveLfoNode) waveLfoNode.stop();
    if (waveMetaLfoNode) waveMetaLfoNode.stop();
    waveIsPlaying = false;
    waveToggleButton.classList.remove('active');
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


function updateVisuals() {
    const circle = document.createElement('div');
    circle.className = 'circle';
    circle.style.backgroundColor = colorPicker.value;
    leftPanel.innerHTML = '';
    rightPanel.innerHTML = '';

    if (currentBlinkMode === 'alternating') {
        if (isLeftLight) {
            leftPanel.appendChild(circle);
        } else {
            rightPanel.appendChild(circle.cloneNode(true));
        }
        playSound(isLeftLight ? 'left' : 'right');
        isLeftLight = !isLeftLight;
    } else if (currentBlinkMode === 'synchro') {
        leftPanel.appendChild(circle);
        rightPanel.appendChild(circle.cloneNode(true));
        playSound('center');
        setTimeout(() => {
            leftPanel.innerHTML = '';
            rightPanel.innerHTML = '';
        }, 50);
    } else if (currentBlinkMode === 'crossed') {
        if (isLeftLight) {
            leftPanel.appendChild(circle);
            playSound('right');
        } else {
            rightPanel.appendChild(circle.cloneNode(true));
            playSound('left');
        }
        isLeftLight = !isLeftLight;
    }
}

function updateFrequencyDisplays() {
    if (frequencyDisplayOverlay) {
        frequencyDisplayOverlay.textContent = `${BLINK_FREQUENCY_HZ.toFixed(1)} Hz`;
    }
    blinkFrequencyInput.value = BLINK_FREQUENCY_HZ.toFixed(1);
    blinkRateSlider.value = BLINK_FREQUENCY_HZ;
    binauralBeatFrequencyDisplay.textContent = `BB: ${getSynchronizedBinauralBeatFrequency().toFixed(1)} Hz`;
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
    if (!sessionSteps || step >= sessionSteps.length) {
        if(visualTimeoutId) startButton.click();
        return;
    }

    const currentStep = sessionSteps[step];
    const { startFreq, endFreq, duration } = currentStep;
    
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
    waveToggleButton = document.getElementById('wave-toggle-button');
    waveVolumeSlider = document.getElementById('wave-volume-slider');
    crackleToggleButton = document.getElementById('crackle-toggle-button');
    crackleVolumeSlider = document.getElementById('crackle-volume-slider');
    alternophonyToggleButton = document.getElementById('alternophony-toggle-button');
    sessionSelect = document.getElementById('session-select');
    frequencyDisplayOverlay = document.getElementById('frequency-display-overlay');
    blinkModeRadios = document.querySelectorAll('input[name="blinkMode"]');

    
    const warningCloseButton = warningModal.querySelector('.close-button');
    const helpCloseButton = helpModal.querySelector('.close-button');

    // Variable Initialization
    BLINK_FREQUENCY_HZ = parseFloat(blinkRateSlider.value);
    currentCarrierFrequency = parseFloat(carrierFrequencyInput.value);
    currentBBMultiplier = parseFloat(document.querySelector('input[name="bbMultiplier"]:checked').value);
    currentAudioMode = document.querySelector('input[name="audioMode"]:checked').value;
    currentBinauralVolume = parseFloat(binauralVolumeSlider.value) / 100;
    currentIsochronenVolume = parseFloat(isochronenVolumeSlider.value) / 100;
    currentAlternophonyVolume = parseFloat(alternophonyVolumeSlider.value) / 100;
    currentBlinkMode = document.querySelector('input[name="blinkMode"]:checked').value;

    // Initial Setup
    validateAndSetFrequency(carrierFrequencySlider, carrierFrequencyInput, false);
    validateAndSetFrequency(blinkRateSlider, blinkFrequencyInput, true);
    setLanguage(currentLanguage);
    if (warningModal) warningModal.style.display = 'flex';

    // Event Listeners
    startButton.addEventListener('click', () => {
        initAudioContext();
        
        if (visualTimeoutId) {
            clearTimeout(visualTimeoutId);
            clearTimeout(sessionTimeoutId);
            clearInterval(rampIntervalId);
            visualTimeoutId = null;
            sessionTimeoutId = null;
            rampIntervalId = null;
            isLeftLight = false;

            leftPanel.innerHTML = '';
            rightPanel.innerHTML = '';
            stopBinauralBeats();
            stopIsochronicTones();
            stopAlternophony();
            stopWaves();
            stopCrackles();
            
            appContainer.classList.remove('stimulation-active');

            blinkRateSlider.disabled = false;
            blinkFrequencyInput.disabled = false;
            sessionSelect.disabled = false;

        } else {
            appContainer.classList.add('stimulation-active');
            currentSession = sessionSelect.value;
            
            if (currentAudioMode === 'binaural' || currentAudioMode === 'both') startBinauralBeats();
            if (currentAudioMode === 'isochronen' || currentAudioMode === 'both') startIsochronicTones();
            if (currentAudioMode === 'alternophony') startAlternophony();
            
            function blinkLoop() {
                updateVisuals();
                visualTimeoutId = setTimeout(blinkLoop, 1000 / BLINK_FREQUENCY_HZ);
            }
            
            if (currentSession === 'manual') {
                validateAndSetFrequency(blinkRateSlider, blinkFrequencyInput, true);
            } else {
                sessionSelect.disabled = true;
                blinkRateSlider.disabled = true;
                blinkFrequencyInput.disabled = true;
                runSession(currentSession);
            }
            blinkLoop();
        }
        setLanguage(currentLanguage);
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


    waveToggleButton.addEventListener('click', () => {
        if (waveIsPlaying) {
            stopWaves();
        } else {
            startWaves();
        }
    });

    waveVolumeSlider.addEventListener('input', (e) => {
        if (waveMasterVolume && audioContext) {
            const newVolume = parseFloat(e.target.value) / 100;
            waveMasterVolume.gain.setTargetAtTime(newVolume, audioContext.currentTime, 0.01);
        }
    });

    crackleToggleButton.addEventListener('click', () => {
        if (crackleIsPlaying) {
            stopCrackles();
        } else {
            startCrackles();
        }
    });

    crackleVolumeSlider.addEventListener('input', updateCrackleVolume);

    alternophonyToggleButton.addEventListener('click', () => {
        if (alternophonyIsPlaying) {
            stopAlternophony();
        } else {
            startAlternophony();
        }
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
    
    window.addEventListener('click', e => { 
        if (e.target == warningModal) warningModal.style.display = 'none';
        if (e.target == helpModal) helpModal.style.display = 'none';
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