/********************************************
 * HOMEFACE V5 — FULL CONNECTED EDITION
 * Blink • Sleeping • Mouth Movement • Voice • Supabase Memory
 ********************************************/

// 🔑 KEYS
const OPENAI_KEY = "YOUR_OPENAI_KEY_HERE";
const SUPABASE_URL = "https://irhgsqxzjkwkwhwhtvvo.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaGdzcXh6amt3a3dod2h0dHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTQ0NjUsImV4cCI6MjA4MDA5MDQ2NX0.k0X1UvWIGLMFaWlu2ml34ptqT-CwsT-2djJekJOGEDs";

// Create client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// UI elements
const face = document.getElementById("homeface-img");
const chatBox = document.getElementById("chat-box");
const inputBox = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

/********************************************
 * BLINKING
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
    const interval = setInterval(() => {
        face.src = blinkFrames[i];
        i++;
        if (i >= blinkFrames.length) {
            clearInterval(interval);
            blinking = false;
        }
    }, 80);
}

function autoBlinkLoop() {
    setTimeout(() => {
        playBlink();
        autoBlinkLoop();
    }, Math.random() * 3000 + 2500);
}
autoBlinkLoop();

/********************************************
 * SLEEP MODE
 ********************************************/
let idleTimer;
let sleeping = false;
let sleepLoopInterval;

const sleepIntro = "homeface-sleeping1.png";
const sleepLoopFrames = ["homeface-sleeping2.png", "homeface-sleeping3.png", "homeface-sleeping4.png"];

function resetIdleTimer() {
    if (sleeping) wakeUp();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startSleeping, 30000);
}

function startSleeping() {
    sleeping = true;
    face.src = sleepIntro;

    setTimeout(() => {
        let index = 0;
        sleepLoopInterval = setInterval(() => {
            face.src = sleepLoopFrames[index];
            index = (index + 1) % sleepLoopFrames.length;
        }, 800);
    }, 800);
}

function wakeUp() {
    clearInterval(sleepLoopInterval);
    sleeping = false;
    face.src = "homeface-eyesopen2.png";
}

/********************************************
 * TALKING MOUTH
 ********************************************/
const mouthFrames = [
    "homeface-mouth-closed.png",
    "homeface-midmouth2.png",
    "homeface-mouth-open.png",
    "homeface-midmouth2.png",
];

let talking = false;
let talkingInterval;

function startMouthAnimation() {
    if (talking) return;
    talking = true;

    let i = 0;
    talkingInterval = setInterval(() => {
        face.src = mouthFrames[i];
        i = (i + 1) % mouthFrames.length;
    }, 120);
}

function stopMouthAnimation() {
    talking = false;
    clearInterval(talkingInterval);
    face.src = "homeface-eyesopen2.png";
}

/********************************************
 * TEXT TO SPEECH
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

        const arrayBuffer = await response.arrayBuffer();
        const audio = new Audio(URL.createObjectURL(new Blob([arrayBuffer])));
        audio.onplay = startMouthAnimation;
        audio.onended = stopMouthAnimation;
        audio.play();
    } catch (err) {
        console.error("TTS error:", err);
    }
}

/********************************************
 * SUPABASE MEMORY
 ********************************************/
async function loadMemory() {
    const { data, error } = await supabaseClient.from("memory").select("content");

    if (error) {
        console.error("Memory load error:", error);
        return "";
    }

    return data.map(x => x.content).join("\n");
}

async function saveMemory(userMessage, aiReply) {
    const text = `User: ${userMessage}\nHomeface: ${aiReply}`;

    const { error } = await supabaseClient.from("memory").insert({ content: text });

    if (error) {
        console.error("Memory save error:", error);
    }
}

/********************************************
 * CHAT / AI RESPONSE
 ********************************************/
function addMessage(sender, text) {
    chatBox.innerHTML += `<p><strong>${sender}:</strong> ${text}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

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
                    { role: "system", content: "You are Homeface, a friendly emotional AI." },
                    { role: "system", content: "Here is your memory:\n" + memory },
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
        addMessage("Homeface", "Error connecting to AI.");
        console.error(err);
    }
}

/********************************************
 * EVENT LISTENERS
 ********************************************/
sendBtn.addEventListener("click", sendMessage);
inputBox.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

document.addEventListener("mousemove", resetIdleTimer);
document.addEventListener("mousedown", resetIdleTimer);
document.addEventListener("touchstart", resetIdleTimer);
document.addEventListener("keydown", resetIdleTimer);

resetIdleTimer();
