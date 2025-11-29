// -------------------
// Homeface JS (Safe)
// -------------------

async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value.trim();
    if (!message) return;

    const replyBox = document.getElementById("replyBox");
    replyBox.innerHTML += `<div style="color:yellow;"><b>You:</b> ${message}</div>`;
    input.value = "";

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: message
            })
        });

        const data = await response.json();
        const reply = data.output_text || "No reply received.";

        replyBox.innerHTML += `<div><b>Homeface:</b> ${reply}</div>`;
    } catch (err) {
        replyBox.innerHTML += `<div><b>Homeface:</b> Error connecting to AI.</div>`;
    }
}

// Attach button event
document.getElementById("sendButton").addEventListener("click", sendMessage);
