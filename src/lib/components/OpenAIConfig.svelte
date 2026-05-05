<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Settings } from 'lucide-svelte';
	import { testConnection } from '$lib/services/llm';

	let {
		baseURL = $bindable('https://api.openai.com'),
		apiKey = $bindable(''),
		model = $bindable('gpt-4o'),
		onSave = () => {}
	} = $props();

	let isOpen = $state(false);
	let tempBaseURL = $state(baseURL);
	let tempAPIKey = $state(apiKey);
	let tempModel = $state(model);
	let testResult = $state('');
	let isTesting = $state(false);
	let saveNotice = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	async function handleSave() {
		baseURL = tempBaseURL;
		apiKey = tempAPIKey;
		model = tempModel;
		onSave();
		saveNotice = true;
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		saveTimeout = setTimeout(() => {
			saveNotice = false;
			isOpen = false;
		}, 1200);
	}

	function handleCancel() {
		tempBaseURL = baseURL;
		tempAPIKey = apiKey;
		tempModel = model;
		saveNotice = false;
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		isOpen = false;
	}

	async function handleTestConnection() {
		isTesting = true;
		testResult = 'Testing connection...';
		
		try {
			const result = await testConnection({
				baseURL: tempBaseURL,
				apiKey: tempAPIKey,
				model: tempModel
			});
			testResult = result.ok
				? 'Connection successful.'
				: `Connection failed: ${result.error ?? 'Unknown error'}`;
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
					<label for="model" class="text-sm font-medium">Model</label>
					<Input
						id="model"
						type="text"
						placeholder="gpt-4o"
						bind:value={tempModel}
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
					<div class="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground">
						{testResult}
					</div>
				{/if}
				<div class="flex gap-2">
					<Button onclick={handleSave} class="flex-1">Save</Button>
					<Button onclick={handleCancel} variant="outline" class="flex-1">
						Cancel
					</Button>
				</div>
				{#if saveNotice}
					<p class="text-xs text-muted-foreground">Saved</p>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>