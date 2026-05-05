<script lang="ts">
	import ChatBubble from './ChatBubble.svelte';
	import ChatInput from './ChatInput.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { browser } from '$app/environment';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';
	import { getOpenAIService } from '$lib/services/llm';
	import type { Message } from '$lib/types';

	let {
		title = 'Chat Interface',
		subtitle = 'Demo chat using Svelte 5 and ShadCN',
		initialMessages = [] as Message[],
		model = 'gpt-4o'
	} = $props();

	let messages = $state<Message[]>(initialMessages);
	let isLoading = $state(false);
	let viewportRef = $state<HTMLElement | null>(null);
	let streamingMessage = $state('');
	let error = $state<string | null>(null);
	let abortController = $state<AbortController | null>(null);

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
		if (!text.trim()) return;
		error = null;

		const userMessage: Message = {
			id: crypto.randomUUID(),
			content: text,
			role: 'user',
			timestamp: new Date()
		};
		messages = [...messages, userMessage];

		const openAIService = getOpenAIService();
		if (!openAIService || !openAIService.isConfigured()) {
			error =
				'OpenAI service not configured. Please set your API key and base URL in the configuration.';
			return;
		}

		const controller = new AbortController();
		abortController = controller;
		isLoading = true;
		streamingMessage = '';

		try {
			let fullResponse = '';
			const systemMessage: Message = {
				id: crypto.randomUUID(),
				content: 'You are a helpful AI assistant. Provide clear and concise responses.',
				role: 'system',
				timestamp: new Date()
			};
			const apiMessages = [systemMessage, ...messages];

			await openAIService.sendMessage(
				apiMessages,
				model,
				(chunk) => {
					fullResponse += chunk;
					streamingMessage = fullResponse;
				},
				controller.signal
			);

			if (fullResponse) {
				const assistantMessage: Message = {
					id: crypto.randomUUID(),
					content: fullResponse,
					role: 'assistant',
					timestamp: new Date()
				};
				messages = [...messages, assistantMessage];
			}
		} catch (err) {
			if (controller.signal.aborted) {
				if (streamingMessage) {
					const partialMessage: Message = {
						id: crypto.randomUUID(),
						content: streamingMessage,
						role: 'assistant',
						timestamp: new Date()
					};
					messages = [...messages, partialMessage];
				}
			} else {
				error = err instanceof Error ? err.message : 'An unknown error occurred';
			}
		} finally {
			isLoading = false;
			streamingMessage = '';
			abortController = null;
		}
	}

	function handleCancel() {
		abortController?.abort();
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
					{#if messages.length === 0 && !streamingMessage}
						<div class="flex h-full items-center justify-center text-muted-foreground">
							<p>Send a message to start chatting.</p>
						</div>
					{:else}
						{#each messages as message}
							<ChatBubble {message} />
						{/each}
						{#if streamingMessage}
							<ChatBubble
								message={{
									id: 'streaming',
									content: streamingMessage,
									role: 'assistant',
									timestamp: new Date()
								}}
							/>
						{/if}
						{#if isLoading && !streamingMessage}
							<ChatBubble
								message={{
									id: 'loading',
									content: '',
									role: 'assistant',
									timestamp: new Date()
								}}
								isLoading={true}
							/>
						{/if}
					{/if}
				</div>
			</ScrollArea>
		</div>

		<div class="border-t p-4">
			{#if error}
				<div class="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}
			<ChatInput onSend={handleSendMessage} onCancel={handleCancel} {isLoading} />
		</div>
	</CardContent>
</Card>
