const conversationHistory = [];

const BACKEND_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://your-render-url.onrender.com";

async function speakMessage(text) {
    try {
        const response = await fetch(`${BACKEND_URL}/speak`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch audio from server");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (error) {
        console.error("Error with TTS:", error);
    }
}

const sendButton = document.getElementById("sendButton");
const messageInput = document.getElementById("message");
const chatMessages = document.getElementById("chatMessages");

sendButton.addEventListener("click", async () => {
    const userMessage = messageInput.value.trim();
    conversationHistory.push({ role: "user", content: userMessage });

    if (!userMessage) {
        alert("Please enter a message!");
        return;
    }

    addMessageToChat("user", userMessage);

    try {
        const response = await fetch(`${BACKEND_URL}/chat-query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: conversationHistory }),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let botMessage = "";

        const aiMessageDiv = document.createElement("div");
        aiMessageDiv.className = "bot";
        chatMessages.appendChild(aiMessageDiv);

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            botMessage += chunk;
            aiMessageDiv.textContent += chunk;
        }

        console.log("Full bot response:", botMessage);
        conversationHistory.push({ role: "assistant", content: botMessage });

        if (document.getElementById("voiceToggle")?.checked) {
            speakMessage(botMessage);
        }
    } catch (error) {
        console.error("Error communicating with the server:", error);
        addMessageToChat("bot", "Sorry, something went wrong.");
    }

    messageInput.value = "";
});

function addMessageToChat(sender, message) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
