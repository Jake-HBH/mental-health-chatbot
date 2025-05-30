# Mental Health Chatbot

Een chatbot die gebruikers helpt met mentale gezondheid door middel van contextuele antwoorden en tekst-naar-spraak-functionaliteit. Deze chatbot is sarcastisch en heeft humor. Het gebruikt als context een aantal artikelen van het NHS.uk.

## Installatiehandleiding

Volg de onderstaande stappen om de applicatie lokaal te installeren en uit te voeren.

### Vereisten

- **Node.js**: Versie 18 of hoger
- **npm**: Versie 8 of hoger
- **Een ElevenLabs API-sleutel**: Voor tekst-naar-spraak-functionaliteit
- **Een OpenAI API-sleutel**: Voor het gebruik van Azure OpenAI-services

### Stappen

1. **Repository Klonen**
   Clone de repository naar je lokale machine:
   ```bash
   git clone <repository-url>
   cd mental-health-chatbot

2. Server Dependencies Installeren
Ga naar de SERVER map en installeer de benodigde dependencies:

cd SERVER
npm install

3. Client Dependencies
De client (CLIENT map) gebruikt geen extra dependencies, omdat het een eenvoudige HTML/CSS/JavaScript-applicatie is.

4. .env Bestand Configureren
Maak een .env bestand in de SERVER map en voeg de volgende variabelen toe:

AZURE_OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_API_INSTANCE_NAME=cmgt-ai
AZURE_OPENAI_API_KEY=<jouw_openai_api_sleutel>
AZURE_OPENAI_API_DEPLOYMENT_NAME=deploy-gpt-35-turbo
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME=deploy-text-embedding-ada
ELEVENLABS_API_KEY=<jouw_elevenlabs_api_sleutel>
WEATHER_API_KEY=<jouw_openweathermap_api_sleutel>

5. Vector Store Genereren
Voordat je de server start, moet je de vector store genereren. Voer het volgende commando uit in de SERVER map:

node embeddings.js

Dit maakt een mentalhealthDb map aan met de benodigde bestanden.

6. Server Starten
Start de server met het volgende commando:

npm run dev

De server draait standaard op http://localhost:3000.

7. Client Openen
Open de index.html in een browser om de chatbot te gebruiken.

Functionaliteiten
Chatbot: Beantwoordt vragen met behulp van OpenAI-modellen en contextuele informatie uit een vector store.
Tekst-naar-spraak: Gebruikt ElevenLabs API om antwoorden voor te lezen.
Tools: Ondersteunt functies zoals een "coin flip" tool voor beslissingen.
Mogelijke Problemen en Oplossingen
1. Probleem: 500 Internal Server Error bij /speak
Oorzaak: De ElevenLabs API-sleutel is ongeldig of ontbreekt.

Oplossing:

Controleer of de ELEVENLABS_API_KEY correct is ingesteld in het .env bestand.
Zorg ervoor dat je de server opnieuw start na het bijwerken van het .env bestand:

npm run dev

2. Probleem: 400 Bad Request bij /speak
Oorzaak: De text parameter ontbreekt in de aanvraag.

Oplossing:

Controleer of de client de text parameter correct verzendt in de POST-aanvraag:

body: JSON.stringify({ text: "Hallo wereld!" })

3. Probleem: Vector Store Niet Gevonden
Oorzaak: De vector store (mentalhealthDb) is niet gegenereerd.

Oplossing:

Voer het volgende commando uit in de SERVER map om de vector store te genereren:

node embeddings.js

4.  Probleem: Invalid API Key bij OpenAI of ElevenLabs
Oorzaak: De API-sleutel is ongeldig of verlopen.

Oplossing:

Controleer of de API-sleutels correct zijn ingesteld in het .env bestand.
Vraag nieuwe API-sleutels aan indien nodig.
5. Probleem: Geen Antwoord van de Chatbot
Oorzaak: De server kan geen verbinding maken met de OpenAI API.

Oplossing:

Controleer je internetverbinding.
Controleer of de OpenAI API-sleutel correct is ingesteld in het .env bestand.

Scripts
npm run dev: Start de server.
npm run embed: Genereert de vector store.
npm run health: Voert de healthquestion.js uit voor testen.

Licentie
Dit project is gelicentieerd onder de ISC-licentie.
