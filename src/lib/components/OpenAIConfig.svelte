<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Settings } from 'lucide-svelte';
	import { getOpenAIService } from '$lib/services/openai';

	let {
		baseURL = $bindable('https://api.openai.com'),
		apiKey = $bindable(''),
		onSave = () => {}
	} = $props();

	let isOpen = $state(false);
	let tempBaseURL = $state(baseURL);
	let tempAPIKey = $state(apiKey);
	let testResult = $state('');
	let isTesting = $state(false);

	async function handleSave() {
		baseURL = tempBaseURL;
		apiKey = tempAPIKey;
		onSave();
		isOpen = false;
	}

	function handleCancel() {
		tempBaseURL = baseURL;
		tempAPIKey = apiKey;
		isOpen = false;
	}

	async function handleTestConnection() {
		isTesting = true;
		testResult = 'Testing connection...';
		
		try {
			const service = getOpenAIService({ baseURL: tempBaseURL, apiKey: tempAPIKey });
			if (service) {
				const result = await service.testDirectConnection();
				testResult = result;
			} else {
				testResult = 'Failed to initialize service';
			}
		} catch (error) {
			testResult = `Test failed: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			isTesting = false;
		}
	}
</script>

<div class="relative">
	<Button
		variant="outline"
		size="icon"
		onclick={() => (isOpen = !isOpen)}
		class="fixed top-4 right-4 z-50"
	>
		<Settings class="h-4 w-4" />
	</Button>

	{#if isOpen}
		<Card class="fixed top-16 right-4 z-50 w-80">
			<CardHeader>
				<CardTitle>OpenAI Configuration</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<label for="base-url" class="text-sm font-medium">Base URL</label>
					<Input
						id="base-url"
						type="text"
						placeholder="https://api.openai.com"
						bind:value={tempBaseURL}
					/>
				</div>
				<div class="space-y-2">
					<label for="api-key" class="text-sm font-medium">API Key</label>
					<Input
						id="api-key"
						type="password"
						placeholder="sk-..."
						bind:value={tempAPIKey}
					/>
				</div>
				<div class="flex gap-2">
					<Button onclick={handleTestConnection} disabled={isTesting} variant="outline">
						{isTesting ? 'Testing...' : 'Test Connection'}
					</Button>
				</div>
				{#if testResult}
					<div class="mt-4 rounded-md bg-gray-50 p-3 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
						{testResult}
					</div>
				{/if}
				<div class="flex gap-2">
					<Button onclick={handleSave} class="flex-1">Save</Button>
					<Button onclick={handleCancel} variant="outline" class="flex-1">
						Cancel
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>