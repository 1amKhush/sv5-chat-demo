<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Send, Square } from 'lucide-svelte';

	let {
		onSend,
		onCancel,
		isLoading = false
	}: {
		onSend: (message: string) => void;
		onCancel?: () => void;
		isLoading?: boolean;
	} = $props();

	let inputValue = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (isLoading || !inputValue.trim()) return;

		onSend(inputValue);
		inputValue = '';
		if (textareaRef) {
			textareaRef.style.height = 'auto';
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(event);
		}
	}

	function handleInput(event: Event) {
		const target = event.currentTarget as HTMLTextAreaElement;
		target.style.height = 'auto';
		target.style.height = `${target.scrollHeight}px`;
	}
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
	<textarea
		bind:this={textareaRef}
		bind:value={inputValue}
		placeholder="Type your message..."
		rows="1"
		class="flex-1 resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
		style="max-height: 150px"
		disabled={isLoading}
		onkeydown={handleKeyDown}
		oninput={handleInput}
	></textarea>
	{#if isLoading}
		<Button type="button" size="icon" variant="destructive" onclick={onCancel}>
			<Square class="h-4 w-4" />
		</Button>
	{:else}
		<Button type="submit" size="icon" disabled={!inputValue.trim()}>
			<Send class="h-4 w-4" />
		</Button>
	{/if}
</form>
