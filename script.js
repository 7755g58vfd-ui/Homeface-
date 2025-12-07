/********************************************
 * HOMEFACE V5 — FULL CONNECTED EDITION
 * Blink • Voice • Chat • Supabase Memory
 * Sleeping Mode • Mouth Animation
 ********************************************/

// INSERT KEYS
const OPENAI_KEY = "add api here";
const SUPABASE_URL = "https://irhgsqxzjkwkwhwhtvvo.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaGdzcXh6amt3a3dod2h0dHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTQ0NjUsImV4cCI6MjA4MDA5MDQ2NX0.k0X1UvWIGLMFaWlu2ml34ptqT-CwsT-2djJekJOGEDs";

// SUPABASE CLIENT
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// UI ELEMENTS
const face = document.getElementById("homeface-img");
const chatBox = document.getElementById("chat-box");
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

/********************************************
 * BLINKING SYSTEM
 ********************************************/

// NEW FRAMESET using latest PNGs
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
    const blinkInterval = setInterval(() => {
        face.src = blinkFrames[i];
        i++;
        if (i >= blinkFrames.length) {
            clearInterval(blinkInterval);
            blinking = false;
        }
    }, 80);
}

function autoBlinkLoop() {
    const delay = Math.random() * 2500 + 2000; // 2–4.5 sec
    setTimeout(() => {
        playBlink();
        autoBlinkLoop();
    }, delay);
}

autoBlinkLoop();

/********************************************
 * SLEEPING SYSTEM
 ********************************************/

// Correct PNGs
const sleepIntro = "homeface-sleeping1.png";
const sleepLoopFrames = [
    "homeface-sleeping2.png",
    "homeface-sleeping3.png",
    "homeface-sleeping4.png"
];

let idleTimer;
let sleeping = false;
let sleepLoopInterval;

function resetIdleTimer() {
    if (sleeping) wakeUp();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startSleeping, 30000); // 30 sec idle
}

function startSleeping() {
    sleeping = true;
    face.src = sleepIntro;

    setTimeout(startSleepLoop, 1000);
}

function startSleepLoop() {
    let i = 0;
    sleepLoopInterval = setInterval(() => {
        face.src = sleepLoopFrames[i];
        i = (i + 1) % sleepLoopFrames.length;
    }, 800);
}

function wakeUp() {
    clearInterval(sleepLoopInterval);
    sleeping = false;

    // Wake-up animation → then eyes open
    face.src = sleepIntro;
    setTimeout(() => {
        face.src = "homeface-eyesopen2.png"; // Correct default
    }, 500);
}

/********************************************
 * MOUTH ANIMATION SYSTEM (talking)
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

    // Return to default awake face
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
                "Authorization": `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini-tts",
                voice: "alloy",
                input: text
            })
        });

        const audioData = await response.arrayBuffer();
        const url = URL.createObjectURL(new Blob([audioData], { type: "audio/mpeg" }));
        const audio = new Audio(url);

        audio.onplay = startMouthAnimation;
        audio.onended = stopMouthAnimation;

        audio.play();
    } catch (err) {
        console.error("Voice error:", err);
    }
}

/********************************************
 * MEMORY FUNCTIONS — SUPABASE
 ********************************************/
async function loadMemory() {
    const { data, error } = await supabaseClient
        .from("memory")
        .select("key, value")
        .order("id", { ascending: true });

    if (error) {
        console.error("Memory load error:", error);
        return "";
    }

    return data
        .map(row => `User: ${row.key}\nHomeface: ${row.value}`)
        .join("\n");
}

async function saveMemory(userMessage, aiReply) {
    const { error } = await supabaseClient
        .from("memory")
        .insert({
            key: userMessage,
            value: aiReply
        });

    if (error) console.error("Memory save error:", error);
}

/********************************************
 * MAIN SEND MESSAGE FUNCTION
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
                "Authorization": `Bearer ${OPENAI_KEY}`
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
 * CHAT BOX OUTPUT
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

// Idle sleep triggers
document.addEventListener("mousemove", resetIdleTimer);
document.addEventListener("mousedown", resetIdleTimer);
document.addEventListener("touchstart", resetIdleTimer);
document.addEventListener("keydown", resetIdleTimer);

// Start idle timer
resetIdleTimer();
