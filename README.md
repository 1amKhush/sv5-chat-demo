# sv5-chat-demo

Bring-your-own-key (BYOT) chat UI built with SvelteKit 2 + Svelte 5. It connects directly to any OpenAI-compatible API from the browser.

## Features

- BYOT configuration for base URL, API key, and model
- Streaming responses with cancel support
- Markdown rendering for assistant replies
- Settings persisted in localStorage

## Getting started

```sh
npm install
npm run dev
```

Open the app and click the settings icon to configure your provider.

## Configuration

Set these fields in the settings panel:

- Base URL
- API key
- Model

Example OpenAI-compatible base URLs:

- OpenAI: https://api.openai.com/v1
- Groq: https://api.groq.com/openai/v1
- Ollama: http://localhost:11434/v1
- LM Studio: http://localhost:1234/v1

Notes:

- Model names are provider-specific (for example, `gpt-4o` on OpenAI).
- Keys are stored in localStorage in your browser.
- The OpenAI SDK runs in the browser, so self-hosted providers must allow CORS.

## Scripts

- npm run dev
- npm run build
- npm run preview
