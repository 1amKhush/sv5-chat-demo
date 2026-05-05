<script lang="ts">
	import ChatBubble from './ChatBubble.svelte';
	import ChatInput from './ChatInput.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { browser } from '$app/environment';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import { getOpenAIService, type ChatMessage } from '$lib/services/openai';

	interface Message {
		id: number;
		text: string;
		sender: 'user' | 'assistant';
		timestamp: Date;
	}

	let {
		title = 'Chat Interface',
		subtitle = 'Demo chat using Svelte 5 and ShadCN',
		initialMessages = [] as Message[]
	} = $props();

	let messages = $state<Message[]>(
		initialMessages.length > 0
			? initialMessages
			: [
					{
						id: 1,
						text: 'Hello! Welcome to our chat interface. How can I help you today?',
						sender: 'assistant',
						timestamp: new Date()
					}
				]
	);
	let isLoading = $state(false);
	let viewportRef = $state<HTMLElement | null>(null);
	let streamingMessage = $state('');
	let error = $state<string | null>(null);

	$effect(() => {
		if (!browser) return;
		// This effect runs whenever messages or isLoading changes
		messages;
		isLoading;
		streamingMessage;

		// Wait for DOM update, then scroll to bottom
		setTimeout(() => {
			scrollToBottom();
		}, 0);
	});

	async function handleSendMessage(text: string) {
		// Clear any previous errors
		error = null;

		// Add user message
		const userMessage: Message = {
			id: messages.length + 1,
			text: text,
			sender: 'user',
			timestamp: new Date()
		};
		messages = [...messages, userMessage];

		// Get OpenAI service
		const openAIService = getOpenAIService();
		console.log('OpenAI service status:', {
			isConfigured: openAIService?.isConfigured(),
			hasService: !!openAIService
		});

		if (!openAIService || !openAIService.isConfigured()) {
			error = 'OpenAI service not configured. Please set your API key and base URL in the configuration.';
			return;
		}

		// Convert messages to OpenAI format
		const chatMessages: ChatMessage[] = messages.map(msg => ({
			role: msg.sender === 'user' ? 'user' : 'assistant',
			content: msg.text
		}));

		// Add system message for better context
		chatMessages.unshift({
			role: 'system',
			content: 'You are a helpful AI assistant. Provide clear and concise responses.'
		});

		// Start streaming response
		isLoading = true;
		streamingMessage = '';

		try {
			let fullResponse = '';
			console.log('Starting OpenAI streaming request...');
			
			await openAIService.sendMessage(chatMessages, (chunk) => {
				fullResponse += chunk;
				streamingMessage = fullResponse;
				console.log('Received chunk, current length:', fullResponse.length);
			});

			// Add the complete assistant message
			const assistantMessage: Message = {
				id: messages.length + 2,
				text: fullResponse,
				sender: 'assistant',
				timestamp: new Date()
			};
			
			console.log('Streaming completed, final message length:', fullResponse.length);
			messages = [...messages, assistantMessage];
			streamingMessage = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
			console.error('OpenAI API error in Chat component:', err);
		} finally {
			isLoading = false;
		}
	}

	function scrollToBottom() {
		if (viewportRef) {
			viewportRef.scroll({
				top: viewportRef.scrollHeight,
				behavior: 'smooth' // Optional for smooth scrolling
			});
		}
	}
</script>

<Card class="flex h-full max-h-[calc(100vh-2rem)] flex-1 flex-col">
	<CardHeader>
		<CardTitle class="text-2xl font-bold">{title}</CardTitle>
		<p class="text-sm text-muted-foreground">{subtitle}</p>
	</CardHeader>
	<CardContent class="flex min-h-0 flex-1 flex-col p-0">
		<div class="flex-1 overflow-hidden">
			<ScrollArea class="h-full" bind:viewportRef>
				<div class="space-y-4 p-4">
					{#each messages as message}
						<ChatBubble {message} />
					{/each}
					{#if streamingMessage}
						<ChatBubble
							message={{
								id: messages.length + 1,
								text: streamingMessage,
								sender: 'assistant',
								timestamp: new Date()
							}}
						/>
					{/if}
					{#if isLoading && !streamingMessage}
						<ChatBubble
							message={{
								id: messages.length + 1,
								text: '',
								sender: 'assistant',
								timestamp: new Date()
							}}
							isLoading={true}
						/>
					{/if}
				</div>
			</ScrollArea>
		</div>

		<div class="border-t p-4">
			{#if error}
				<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
					{error}
				</div>
			{/if}
			<ChatInput onSend={handleSendMessage} {isLoading} />
		</div>
	</CardContent>
</Card>
