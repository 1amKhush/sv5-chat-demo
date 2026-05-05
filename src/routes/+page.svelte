<script lang="ts">
	import Chat from '$lib/components/Chat.svelte';
	import OpenAIConfig from '$lib/components/OpenAIConfig.svelte';
	import { getOpenAIService, resetOpenAIService } from '$lib/services/llm';

	// Configuration state
	let baseURL = $state('https://api.openai.com');
	let apiKey = $state('');

	// Load configuration from localStorage on mount
	import { onMount } from 'svelte';
	onMount(() => {
		const savedBaseURL = localStorage.getItem('openai-base-url');
		const savedAPIKey = localStorage.getItem('openai-api-key');
		
		if (savedBaseURL) baseURL = savedBaseURL;
		if (savedAPIKey) apiKey = savedAPIKey;
		
		// Initialize OpenAI service if we have credentials
		if (baseURL && apiKey) {
			getOpenAIService({ baseURL, apiKey });
		}
	});

	function handleConfigSave() {
		// Save to localStorage
		localStorage.setItem('openai-base-url', baseURL);
		localStorage.setItem('openai-api-key', apiKey);
		
		// Reset and reinitialize service
		resetOpenAIService();
		getOpenAIService({ baseURL, apiKey });
	}
</script>

<div class="container mx-auto flex h-screen max-w-4xl flex-col overflow-hidden p-4">
	<OpenAIConfig bind:baseURL bind:apiKey onSave={handleConfigSave} />
	<Chat title="OpenAI Chat" subtitle="Powered by OpenAI GPT-4" />
</div>
