import { TextLoader } from "langchain/document_loaders/fs/text"
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({ temperature: 1 });

let vectorStore

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

async function loadHealthScript(){
    const loader = new TextLoader("./public/health.txt")
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 250, chunkOverlap: 50 });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`I created ${splitDocs.length} text chunks!`);
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectorStore.save("mentalhealthDb")
    console.log("Vector store created!");
}

async function askQuestion(prompt){
    const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
    console.log(relevantDocs[0].pageContent);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");
    console.log(context);
    //chat
    const response = await model.invoke([
        [ "system", "You will get a context and a question. Use only the context to answer the question" ],
        [ "user", `The context is: ${context}, the question is ${prompt}` ]
    ]);
    console.log("-----------------------------------")
    console.log(response.content);
}

await loadHealthScript()
await askQuestion("What causes pshycotic depression?")

// const vectorTest = await embeddings.embedQuery("I am sending a test");
// console.log(vectorTest);