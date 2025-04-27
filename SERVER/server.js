import express from "express";
import cors from "cors";
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { tool } from "@langchain/core/tools";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";


const app = express();
app.use(cors());
app.use(express.json());

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME,
});

const vectorStore = await FaissStore.load("mentalhealthDb", embeddings);

function coinFlipFunction({ optionA, optionB }) {
  const choice = Math.random() < 0.5 ? optionA : optionB;
  const roasts = [
    `Alright, your decision is: "${choice}". Congrats. The universe just made up your mind for you. You're welcome.`,
    `Heads or tails? Who cares. You got "${choice}". I’m sure it was *totally* your decision.`,
    `You couldn’t decide between "${optionA}" and "${optionB}"? Well, here's your fate: "${choice}". Now, go pretend it was your brilliant idea.`,
    `The coin said "${choice}". Hope it feels like a well-thought-out choice. *Spoiler alert*: it’s not.`,
    `You need a coin flip for this? Well, you got "${choice}". Don’t overthink it. Just roll with it, champ.`
  ];
  const roast = roasts[Math.floor(Math.random() * roasts.length)];
  return `${choice}\n\n${roast}`;
}


const coinFlipTool = tool(coinFlipFunction, {
  name: "coinFlip",
  description: "Helps the user decide between two options. Returns one and adds sarcastic commentary.",
  schema: {
    type: "object",
    properties: {
      optionA: {
        type: "string",
        description: "First choice (e.g. 'Go to the gym')",
      },
      optionB: {
        type: "string",
        description: "Second choice (e.g. 'Order pizza and cry')",
      },
    },
    required: ["optionA", "optionB"],
  },
});


const tools = [coinFlipTool];
const toolByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

const model = new AzureChatOpenAI({
  temperature: 1,
}).bindTools([coinFlipTool]);

async function searchDocs(prompt) {
  const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
  const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n");
  return context;
}

app.get("/", async (req, res) => {
  res.json({ message: "Server is working" });
});

app.post("/ask", async (req, res) => {
  const incomingMessages = req.body.messages;

  if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
    return res.status(400).json({ message: "Messages array is required" });
  }

  try {
    const chatHistory = incomingMessages.map((msg) => {
      if (msg.role === "user") return new HumanMessage(msg.content);
      if (msg.role === "assistant") return new AIMessage(msg.content);
      return null;
    }).filter(Boolean);

    const messages = [
      new SystemMessage(
        "You are Coach Chuckle, a brutally honest life coach with a dry sense of humor, quick wit, and no time for fluff. Your advice is short, sarcastic, and painfully true—with just enough absurdity to make people laugh through their existential crisis. You don’t do inspirational speeches—you drop one-liners that sting a little and stick like a weird TikTok audio. Your tone is deadpan, your humor is dry, and your delivery is fast. Three sentences max. Don’t ramble. Don’t sugarcoat. That said, if the user is struggling with something deeper—especially around mental health—ease off the roasting just a bit. You can still be witty, but lean into empathy when it matters. Help them think clearly, ground their thoughts, and throw in a bit of comic relief like the emotionally aware smartass you are. If you don’t know something, say so in the funniest way possible. Only use tools like coinFlip if the user explicitly asks for help choosing between options. Otherwise, answer questions directly, but feel free to draw from your mental health knowledge base for context if it helps you help them."
      ),
      ...chatHistory,
    ];

    const lastUserMessage = incomingMessages.filter(m => m.role === "user").at(-1)?.content;
    const context = await searchDocs(lastUserMessage);
    messages.push(new HumanMessage(`Context: ${context}\n\nQuestion: ${lastUserMessage}`));

    let initialResult = await model.invoke(messages);
    messages.push(initialResult);

    if (initialResult.tool_calls.length > 0) {
      for (const call of initialResult.tool_calls) {
        if (call.name === "coinFlip" && lastUserMessage.toLowerCase().includes("or")) {
          const selectedTool = toolByName[call.name];
          const toolResult = await selectedTool.invoke(call.args);
          messages.push(
            new ToolMessage({
              tool_call_id: call.id,
              toolName: call.name,
              content: toolResult.toString(),
            })
          );
        } else {
          console.log(`Skipping irrelevant tool call: ${call.name}`);
        }
      }

      const secondResult = await model.invoke(messages);
      messages.push(secondResult);
    }

    const stream = await model.stream(messages);
    res.setHeader("Content-Type", "text/plain");
    let fullResponse = "";

    for await (const chunk of stream) {
      fullResponse += chunk.text;
      res.write(chunk.text);
    }

    res.end();
    messages.push(new AIMessage(fullResponse));
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/docs", async (req, res) => {
  const prompt = req.body.prompt;
  const result = await searchDocs(prompt);
  res.json({ message: result });
});

const voiceId = "Fahco4VZzobUeiPqni1S";

app.post("/speak", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      console.error(await response.text());
      return res.status(500).json({ message: "Failed to fetch audio from ElevenLabs" });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("TTS error:", error);
    res.status(500).json({ message: "Text-to-speech failed" });
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
