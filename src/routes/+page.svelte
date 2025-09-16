<script lang="ts">
	import Chat from '$lib/components/Chat.svelte';

	interface Message {
		id: number;
		text: string;
		sender: 'user' | 'bot';
		timestamp: Date;
	}

	// Optional: Provide initial messages
	const initialMessages: Message[] = [
		{
			id: 1,
			text: 'Hello! Welcome to our chat interface. How can I help you today?',
			sender: 'bot',
			timestamp: new Date()
		},
		{
			id: 2,
			text: 'Hi there! I have a question about Svelte 5.',
			sender: 'user',
			timestamp: new Date()
		}
	];
</script>

<div class="container mx-auto flex h-screen max-w-4xl flex-col overflow-hidden p-4">
	<Chat title="Chat Interface" subtitle="Demo chat using Svelte 5 and ShadCN" {initialMessages} />
</div>
