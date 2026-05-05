import OpenAI from 'openai';

export interface OpenAIConfig {
	baseURL: string;
	apiKey: string;
}

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export class OpenAIService {
	private client: OpenAI | null = null;
	private config: OpenAIConfig | null = null;

	constructor(config: OpenAIConfig) {
		this.updateConfig(config);
	}

	updateConfig(config: OpenAIConfig) {
		this.config = config;
		// Ensure baseURL ends with a slash and doesn't include the endpoint path
		let baseURL = config.baseURL.trim();
		if (!baseURL.endsWith('/')) {
			baseURL += '/';
		}
		// Remove any trailing 'chat/completions' if the user included it
		if (baseURL.endsWith('chat/completions')) {
			baseURL = baseURL.slice(0, -16); // Remove 'chat/completions'
		}
		if (baseURL.endsWith('chat/completions/')) {
			baseURL = baseURL.slice(0, -17); // Remove 'chat/completions/'
		}
		
		console.log('Configured OpenAI client with baseURL:', baseURL);
		
		this.client = new OpenAI({
			apiKey: config.apiKey,
			baseURL: baseURL,
			dangerouslyAllowBrowser: true // Required for client-side usage
		});
	}

	isConfigured(): boolean {
		return this.client !== null && this.config !== null && this.config.apiKey.trim() !== '';
	}

	async sendMessage(messages: ChatMessage[], onStream?: (chunk: string) => void): Promise<string> {
		if (!this.client || !this.isConfigured()) {
			throw new Error('OpenAI client not configured. Please set base URL and API key.');
		}

		try {
			console.log('Making OpenAI API request with:', {
				model: 'gpt-5',
				messagesCount: messages.length,
				baseURL: this.config?.baseURL,
				hasApiKey: !!this.config?.apiKey,
				streaming: !!onStream
			});

			if (onStream) {
				// Try streaming first
				try {
					const stream = await this.client.chat.completions.create({
						model: 'gpt-5',
						messages: messages,
						stream: true,
						max_tokens: 1000,
						temperature: 0.7
					});

					let fullResponse = '';
					
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content || '';
						if (content) {
							fullResponse += content;
							onStream(content);
						}
					}

					console.log('OpenAI streaming API response received, length:', fullResponse.length);
					return fullResponse;
				} catch (streamError) {
					console.warn('Streaming failed, falling back to non-streaming:', streamError);
					// Fall through to non-streaming request
				}
			}

			// Non-streaming fallback
			console.log('Making non-streaming OpenAI API request');
			const response = await this.client.chat.completions.create({
				model: 'gpt-5',
				messages: messages,
				stream: false,
				max_tokens: 1000,
				temperature: 0.7
			});

			const fullResponse = response.choices[0]?.message?.content || '';
			console.log('OpenAI non-streaming API response received, length:', fullResponse.length);
			
			// Simulate streaming for UI compatibility
			if (onStream && fullResponse) {
				onStream(fullResponse);
			}
			
			return fullResponse;
		} catch (error) {
			console.error('OpenAI API error details:', error);
			
			if (error instanceof Error) {
				// Handle specific OpenAI errors
				if (error.message.includes('401')) {
					throw new Error('Invalid API key. Please check your configuration.');
				} else if (error.message.includes('404')) {
					throw new Error('Model not found or invalid base URL. Please check your configuration.');
				} else if (error.message.includes('429')) {
					throw new Error('Rate limit exceeded. Please try again later.');
				} else if (error.message.includes('500')) {
					throw new Error('Server error. Please check your base URL configuration. Make sure to include the full path like https://api.ppq.ai/');
				}
				throw new Error(`OpenAI API error: ${error.message}`);
			}
			throw new Error('An unknown error occurred while communicating with OpenAI.');
		}
	}

	async testConnection(): Promise<boolean> {
		if (!this.client || !this.isConfigured()) {
			return false;
		}

		try {
			await this.client.models.list();
			return true;
		} catch (error) {
			console.error('Connection test failed:', error);
			return false;
		}
	}

	async testDirectConnection(): Promise<string> {
		if (!this.config) {
			return 'No configuration available';
		}

		try {
			// Test direct connection to the API
			const response = await fetch(`${this.config.baseURL}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.config.apiKey}`
				},
				body: JSON.stringify({
					model: 'gpt-5',
					messages: [{ role: 'user', content: 'Hello' }],
					stream: false
				})
			});

			console.log('Direct connection test:', {
				status: response.status,
				statusText: response.statusText,
				headers: Object.fromEntries(response.headers.entries())
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Direct connection error response:', errorText);
				return `HTTP ${response.status}: ${errorText}`;
			}

			const data = await response.json();
			console.log('Direct connection success:', data);
			return `Success: ${JSON.stringify(data, null, 2)}`;
		} catch (error) {
			console.error('Direct connection test failed:', error);
			return `Error: ${error instanceof Error ? error.message : String(error)}`;
		}
	}
}

// Create a singleton instance
let openAIService: OpenAIService | null = null;

export function getOpenAIService(config?: OpenAIConfig): OpenAIService | null {
	if (!openAIService && config) {
		openAIService = new OpenAIService(config);
	} else if (openAIService && config) {
		openAIService.updateConfig(config);
	}
	return openAIService;
}

export function resetOpenAIService(): void {
	openAIService = null;
}