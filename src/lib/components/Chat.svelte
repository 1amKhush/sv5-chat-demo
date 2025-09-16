<script lang="ts">
	import ChatBubble from './ChatBubble.svelte';
	import ChatInput from './ChatInput.svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { browser } from '$app/environment';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';

	interface Message {
		id: number;
		text: string;
		sender: 'user' | 'bot';
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
						sender: 'bot',
						timestamp: new Date()
					}
				]
	);
	let isLoading = $state(false);
	let viewportRef = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!browser) return;
		// This effect runs whenever messages or isLoading changes
		messages;
		isLoading;

		// Wait for DOM update, then scroll to bottom
		setTimeout(() => {
			scrollToBottom();
		}, 0);
	});

	function handleSendMessage(text: string) {
		// Add user message
		const userMessage: Message = {
			id: messages.length + 1,
			text: text,
			sender: 'user',
			timestamp: new Date()
		};
		messages = [...messages, userMessage];

		// Simulate bot response
		isLoading = true;
		setTimeout(() => {
			const botMessage: Message = {
				id: messages.length + 1,
				text: 'Thanks for your message! This is a demo response.',
				sender: 'bot',
				timestamp: new Date()
			};
			messages = [...messages, botMessage];
			isLoading = false;
		}, 1000);
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
					{#if isLoading}
						<ChatBubble
							message={{
								id: messages.length + 1,
								text: '',
								sender: 'bot',
								timestamp: new Date()
							}}
							isLoading={true}
						/>
					{/if}
				</div>
			</ScrollArea>
		</div>

		<div class="border-t p-4">
			<ChatInput onSend={handleSendMessage} {isLoading} />
		</div>
	</CardContent>
</Card>
