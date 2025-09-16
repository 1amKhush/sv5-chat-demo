<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Send } from 'lucide-svelte';

	let { onSend, isLoading = false }: { onSend: (message: string) => void; isLoading?: boolean } =
		$props();

	let inputValue = $state('');

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (!inputValue.trim()) return;

		onSend(inputValue);
		inputValue = '';
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit(event);
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex gap-2">
	<Input
		type="text"
		placeholder="Type your message..."
		bind:value={inputValue}
		onkeypress={handleKeyPress}
		class="flex-1"
		disabled={isLoading}
	/>
	<Button type="submit" size="icon" disabled={isLoading}>
		<Send class="h-4 w-4" />
	</Button>
</form>
