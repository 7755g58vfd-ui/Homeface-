/********************************************
 * HOMEFACE V5 — FULL CONNECTED EDITION
 * Blink • Voice • Chat • Supabase Memory
 * Sleeping Mode • Mouth Animation
 ********************************************/

// INSERT KEYS (Leave blank—Vercel injects these automatically)
const OPENAI_KEY = "";
const SUPABASE_URL = "";
const SUPABASE_ANON = "";

// SUPABASE CLIENT
const supabaseClient = supabase.createClient(
    SUPABASE_URL || window.env?.SUPABASE_URL,
    SUPABASE_ANON || window.env?.SUPABASE_ANON
);

// UI ELEMENTS
const face = document.getElementById("homeface-img");
const chatBox = document.getElementById("chat-box");
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");

/********************************************
 * BLINKING SYSTEM
 ********************************************/
const blinkFrames = [
    "homeface-eyesopen2.png",
    "homeface-halfblink2.png",
    "homeface-eyesclosed2.png",
    "homeface-halfblink2.png",
    "homeface-eyesopen2.png"
];

let blinking = false;

function playBlink() {
    if (blinking) return;
    blinking = true;

    let i = 0;
    const blinkTimer = setInterval(() => {
        face.src = blinkFrames[i];
        i++;
        if (i >= blinkFrames.length) {
            clearInterval(blinkTimer);
            blinking = false;
        }
    }, 80);
}

function autoBlinkLoop() {
    const delay = Math.random() * 2500 + 2000;
    setTimeout(() => {
        playBlink();
        autoBlinkLoop();
    }, delay);
}

autoBlinkLoop();

/********************************************
 * SLEEPING SYSTEM — FINAL V5
 ********************************************/

const sleepIntro = "homeface-sleeping1.png"; // transition frame
const sleepLoopFrames = [
    "homeface-sleeping2.png",
    "homeface-sleeping3.png",
    "homeface-sleeping4.png"
];

let idleTimer = null;
let sleeping = false;
let sleepLoopInterval = null;

// How long before sleep (ms)
const SLEEP_DELAY = 30000; // Change to 8000 for testing

function resetIdleTimer() {
    if (sleeping) wakeUp();

    clearTimeout(idleTimer);
    idleTimer = setTimeout(startSleeping, SLEEP_DELAY);
}

function startSleeping() {
    sleeping = true;

    // Transition frame
    face.src = sleepIntro;

    // After 1 second, start cycle
    setTimeout(startSleepLoop, 1000);
}

function startSleepLoop() {
    let i = 0;

    sleepLoopInterval = setInterval(() => {
        face.src = sleepLoopFrames[i];
        i = (i + 1) % sleepLoopFrames.length;
    }, 900);
}

function wakeUp() {
    sleeping = false;

    clearInterval(sleepLoopInterval);

    // Wake transition
    face.src = sleepIntro;

    // Return to eyes open
    setTimeout(() => {
        face.src = "homeface-eyesopen2.png";
    }, 400);
}

// Real interactions reset sleep timer
["touchstart", "touchend", "mousedown", "keydown"].forEach(event => {
    document.addEventListener(event, resetIdleTimer);
});

// Start timer
resetIdleTimer();

/********************************************
 * MOUTH ANIMATION
 ********************************************/

const mouthFrames = [
    "homeface-mouth-closed.png",
    "homeface-midmouth2.png",
    "homeface-mouth-open.png",
    "homeface-midmouth2.png"
];

let talkingInterval = null;
let isTalking = false;

function startMouthAnimation() {
    if (isTalking) return;
    isTalking = true;

    let i = 0;
    talkingInterval = setInterval(() => {
        face.src = mouthFrames[i];
        i = (i + 1) % mouthFrames.length;
    }, 120);
}

function stopMouthAnimation() {
    clearInterval(talkingInterval);
    isTalking = false;
    face.src = "homeface-eyesopen2.png";
}

/********************************************
 * TEXT-TO-SPEECH
 ********************************************/
async function speakText(text) {
    try {
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY || window.env?.OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-tts",
                voice: "alloy",
                input: text
            })
        });

        const audioData = await response.arrayBuffer();
        const audio = new Audio(URL.createObjectURL(new Blob([audioData])));

        audio.onplay = startMouthAnimation;
        audio.onended = stopMouthAnimation;

        audio.play();
    } catch (err) {
        console.error("Voice error:", err);
    }
}

/********************************************
 * MEMORY (SUPABASE)
 ********************************************/
async function loadMemory() {
    const { data, error } = await supabaseClient
        .from("memory")
        .select("key, value")
        .order("id", { ascending: true });

    if (error) return "";

    return data
        .map(row => `User: ${row.key}\nHomeface: ${row.value}`)
        .join("\n");
}

async function saveMemory(userMessage, aiReply) {
    await supabaseClient
        .from("memory")
        .insert({ key: userMessage, value: aiReply });
}

/********************************************
 * MAIN SEND MESSAGE
 ********************************************/
async function sendMessage() {
    const message = inputBox.value.trim();
    if (!message) return;

    addMessage("You", message);
    inputBox.value = "";

    const memory = await loadMemory();

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_KEY || window.env?.OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-chat",
                messages: [
                    { role: "system", content: "You are Homeface, a friendly, warm character with emotional memory." },
                    { role: "system", content: "Here is your memory so far:\n" + memory },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "(No response)";

        addMessage("Homeface", reply);
        speakText(reply);
        saveMemory(message, reply);

    } catch (err) {
        console.error("AI error:", err);
        addMessage("Homeface", "Error connecting to AI.");
    }
}

/********************************************
 * CHAT DISPLAY
 ********************************************/
function addMessage(sender, text) {
    chatBox.innerHTML += `<p><strong>${sender}:</strong> ${text}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

/********************************************
 * EVENT LISTENERS
 ********************************************/
sendBtn.addEventListener("click", sendMessage);
inputBox.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
