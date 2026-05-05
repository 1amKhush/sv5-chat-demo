<script lang="ts">
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	let { message, isLoading = false }: { message: Message; isLoading?: boolean } = $props();

	const renderedHTML = $derived(
		message.role === 'assistant' ? DOMPurify.sanitize(marked.parse(message.content)) : ''
	);

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((word) => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="flex items-end gap-2 {message.role === 'user' ? 'flex-row-reverse' : ''}">
	<Avatar class="h-8 w-8 flex-shrink-0">
		{#if message.role === 'user'}
			<AvatarFallback class="bg-primary text-primary-foreground">
				{getInitials('You')}
			</AvatarFallback>
		{:else}
			<AvatarFallback class="bg-secondary text-secondary-foreground">
				{getInitials('Assistant')}
			</AvatarFallback>
		{/if}
	</Avatar>

	<div class="flex flex-col {message.role === 'user' ? 'items-end' : 'items-start'}">
		<div class="mb-1 flex items-center gap-2">
			<span class="text-sm font-semibold">
				{message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'}
			</span>
			<span class="text-xs text-muted-foreground">
				{formatTime(message.timestamp)}
			</span>
		</div>

		{#if isLoading}
			<div class="max-w-[80%] rounded-lg bg-muted px-3 py-2">
				<div class="flex space-x-1">
					<div class="h-2 w-2 animate-bounce rounded-full bg-current"></div>
					<div
						class="h-2 w-2 animate-bounce rounded-full bg-current"
						style="animation-delay: 0.1s"
					></div>
					<div
						class="h-2 w-2 animate-bounce rounded-full bg-current"
						style="animation-delay: 0.2s"
					></div>
				</div>
			</div>
		{:else}
			<div
				class="max-w-[80%] rounded-lg px-3 py-2 break-words"
				class:bg-primary={message.role === 'user'}
				class:text-primary-foreground={message.role === 'user'}
				class:bg-muted={message.role !== 'user'}
				class:text-foreground={message.role !== 'user'}
			>
				{#if message.role === 'assistant'}
					<div class="prose prose-sm max-w-none dark:prose-invert">
						{@html renderedHTML}
					</div>
				{:else}
					{message.content}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(-25%);
			animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
		}
		50% {
			transform: none;
			animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
		}
	}

	.animate-bounce {
		animation: bounce 1s infinite;
	}
</style>
