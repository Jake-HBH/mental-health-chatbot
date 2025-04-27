import { TextLoader } from "langchain/document_loaders/fs/text"
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({ temperature: 1 });

const embeddings = new AzureOpenAIEmbeddings({
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore = await FaissStore.load("mentalhealthDb", embeddings);

async function askQuestion(prompt){
    const relevantDocs = await vectorStore.similaritySearch(prompt, 3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    const response = await model.invoke([
        [ "system", "You will get a context and a question. Use only the context to answer the question" ],
        [ "user", `The context is: ${context}, the question is ${prompt}` ]
    ]);
    return response.content;
}
let answer = await askQuestion("What causes pshycotic depression?")
console.log(answer);

// const vectorTest = await embeddings.embedQuery("I am sending a test");
// console.log(vectorTest);