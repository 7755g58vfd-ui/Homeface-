/********************************************
 * HOMEFACE V5 — CLEAN FINAL EDITION
 * Blink • Look • Pray • Talk • Sleep • Local Memory
 ********************************************/


// UI ELEMENTS
const face = document.getElementById("homeface-img");
const chatBox = document.getElementById("chat-box");
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

/********************************************
 * LOCAL MEMORY ENGINE
 ********************************************/
function loadMemory() {
    return {
        prefs: JSON.parse(localStorage.getItem("hf_prefs")) || { voice: "nova" },
        chat: JSON.parse(localStorage.getItem("hf_chat")) || []
    };
}

let HF = loadMemory();

function saveChat(role, content) {
    HF.chat.push({ role, content });
    if (HF.chat.length > 20) HF.chat.shift();
    localStorage.setItem("hf_chat", JSON.stringify(HF.chat));
}

/********************************************
 * FRAMES
 ********************************************/
const blinkFrames = [
    "homeface-eyesopen2.png",
    "homeface-halfblink2.png",
    "homeface-eyesclosed2.png",
    "homeface-halfblink2.png",
    "homeface-eyesopen2.png"
];

const lookLeftFrame = "homeface-lookleft.png";
const lookRightFrame = "homeface-lookright.png";

const prayFrames = [
    "homeface-pray1.png",
    "homeface-pray2.png",
    "homeface-pray3.png",
    "homeface-pray4.png"
];

const mouthFrames = [
    "homeface-mouth-open.png",
    "homeface-midmouth2.png"
];

const sleepFrames = [
    "homeface-sleeping2.png",
    "homeface-sleeping3.png",
    "homeface-sleeping4.png"
];

/********************************************
 * STATE FLAGS
 ********************************************/
let blinking = false;
let praying = false;
let talking = false;
let sleeping = false;
let idleRunning = false;
let sleepTimer = null;

/********************************************
 * ASYNC HELPERS
 ********************************************/
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitWhileTalking() {
    return new Promise(resolve => {
        const check = setInterval(() => {
            if (!talking && !sleeping) {
                clearInterval(check);
                resolve();
            }
        }, 50);
    });
}

function playBlinkAsync() {
    return new Promise(resolve => {
        if (sleeping) return resolve();
        blinking = true;
        let i = 0;

        const interval = setInterval(() => {
            face.src = blinkFrames[i++];
            if (i >= blinkFrames.length) {
                clearInterval(interval);
                blinking = false;
                resolve();
            }
        }, 80);
    });
}

function playPrayAsync() {
    return new Promise(resolve => {
        if (sleeping) return resolve();
        praying = true;
        let i = 0;

        const interval = setInterval(() => {
            face.src = prayFrames[i++];
            if (i >= 3) {
                clearInterval(interval);
                face.src = prayFrames[3];
                setTimeout(() => {
                    praying = false;
                    resolve();
                }, 800);
            }
        }, 180);
    });
}

/********************************************
 * IDLE LOOP
 ********************************************/
async function idleLoop() {
    if (idleRunning || sleeping) return;
    idleRunning = true;

    while (!sleeping) {

        if (talking) {
            await waitWhileTalking();
            continue;
        }

        await playBlinkAsync();

        if (talking) continue;
        face.src = lookLeftFrame;
        await wait(800);

        if (talking) continue;
        face.src = lookRightFrame;
        await wait(800);

        if (talking) continue;
        await playBlinkAsync();

        if (talking) continue;
        await playPrayAsync();

        await wait(2000);
    }

    idleRunning = false;
}

/********************************************
 * TALKING (MOUTH)
 ********************************************/
function startTalking() {
    if (talking || sleeping) return;
    talking = true;

    let i = 0;
    const interval = setInterval(() => {
        if (!talking) {
            clearInterval(interval);
            face.src = blinkFrames[0];
            return;
        }
        face.src = mouthFrames[i++ % mouthFrames.length];
    }, 120);
}

function stopTalking() {
    talking = false;
}

/********************************************
 * SLEEP
 ********************************************/
function startSleeping() {
    if (sleeping) return;
    sleeping = true;
    talking = false;
    idleRunning = false;

    let i = 0;
    const interval = setInterval(() => {
        if (!sleeping) {
            clearInterval(interval);
            face.src = blinkFrames[0];
            return;
        }
        face.src = sleepFrames[i++ % sleepFrames.length];
    }, 350);
}

function stopSleeping() {
    sleeping = false;
}

/********************************************
 * TIMERS
 ********************************************/
function resetSleepTimer() {
    stopSleeping();
    talking = false;
    praying = false;
    blinking = false;
    idleRunning = false;

    clearTimeout(sleepTimer);
    idleLoop();

    sleepTimer = setTimeout(startSleeping, 60000);
}

inputBox.addEventListener("input", resetSleepTimer);
sendBtn.addEventListener("click", resetSleepTimer);

/********************************************
 * VOICE
 ********************************************/
async function speakText(text) {
    console.log("🔊 speakText called");

    const audio = new Audio(
        "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
    );

    audio.onplay = () => console.log("▶️ audio started");
    audio.onerror = e => console.error("❌ audio error", e);

    await audio.play();
}

/********************************************
 * SEND MESSAGE
 ********************************************/
async function sendMessage() {
    stopSleeping();
    resetSleepTimer();

    const text = inputBox.value.trim();
    if (!text) return;

    addMessage("You", text);
    saveChat("user", text);
    inputBox.value = "";

    startTalking();

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "API error");
        }

        const reply = data.reply || "No response";

        addMessage("Homeface", reply);
        saveChat("assistant", reply);

        await speakText(reply);
        stopTalking();

    } catch (err) {
        console.error(err);
        stopTalking();
        addMessage("Homeface", "Error connecting to AI.");
    }
}

/********************************************
 * CHAT UI
 ********************************************/
function addMessage(sender, text) {
    chatBox.innerHTML += `<p><strong>${sender}:</strong> ${text}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
inputBox.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

/********************************************
 * START
 ********************************************/
resetSleepTimer();
idleLoop();
