import OpenAI, { APIError } from 'openai';
import type { LLMConfig, Message } from '$lib/types';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

const DEFAULT_MODEL = 'gpt-4o';

type LLMConfigInput = Omit<LLMConfig, 'model'> & { model?: string };

function normalizeBaseURL(raw: string): string {
	let url = raw.trim();
	if (url.endsWith('/chat/completions')) {
		url = url.slice(0, -17);
	}
	return url.replace(/\/+$/, '');
}

function toConfig(config: LLMConfigInput): LLMConfig {
	return {
		baseURL: normalizeBaseURL(config.baseURL),
		apiKey: config.apiKey,
		model: config.model?.trim() || DEFAULT_MODEL
	};
}

function toChatMessages(messages: Array<Message | ChatMessage>): ChatMessage[] {
	return messages.map((message) => ({
		role: message.role,
		content: message.content
	}));
}

function mapAPIError(error: unknown): Error {
	if (error instanceof APIError) {
		switch (error.status) {
			case 401:
				return new Error('Invalid API key.');
			case 404:
				return new Error('Model not found or invalid endpoint.');
			case 429:
				return new Error('Rate limit exceeded. Try again later.');
			default:
				return new Error(`API error (${error.status}): ${error.message}`);
		}
	}

	if (error instanceof Error) {
		return new Error(`API error: ${error.message}`);
	}

	return new Error('An unknown error occurred while communicating with the API.');
}

export class LLMService {
	private client: OpenAI | null = null;
	private config: LLMConfig | null = null;

	constructor(config: LLMConfigInput) {
		this.updateConfig(config);
	}

	updateConfig(config: LLMConfigInput) {
		this.config = toConfig(config);
		this.client = new OpenAI({
			apiKey: this.config.apiKey,
			baseURL: this.config.baseURL,
			dangerouslyAllowBrowser: true
		});
	}

	isConfigured(): boolean {
		return this.client !== null && this.config !== null && this.config.apiKey.trim() !== '';
	}

	async sendMessage(
		messages: Array<Message | ChatMessage>,
		model: string,
		onChunk?: (chunk: string) => void,
		signal?: AbortSignal
	): Promise<string>;
	async sendMessage(
		messages: Array<Message | ChatMessage>,
		onChunk?: (chunk: string) => void,
		signal?: AbortSignal
	): Promise<string>;
	async sendMessage(
		messages: Array<Message | ChatMessage>,
		modelOrOnChunk?: string | ((chunk: string) => void),
		onChunkOrSignal?: ((chunk: string) => void) | AbortSignal,
		signal?: AbortSignal
	): Promise<string> {
		if (!this.client || !this.isConfigured()) {
			throw new Error('LLM client not configured. Please set base URL and API key.');
		}

		let model = this.config?.model || DEFAULT_MODEL;
		let onChunk: ((chunk: string) => void) | undefined;
		let abortSignal: AbortSignal | undefined;

		if (typeof modelOrOnChunk === 'string') {
			model = modelOrOnChunk.trim() || model;
			if (typeof onChunkOrSignal === 'function') {
				onChunk = onChunkOrSignal;
			} else if (onChunkOrSignal && typeof onChunkOrSignal === 'object' && 'aborted' in onChunkOrSignal) {
				abortSignal = onChunkOrSignal;
			}
			if (signal) {
				abortSignal = signal;
			}
		} else {
			if (typeof modelOrOnChunk === 'function') {
				onChunk = modelOrOnChunk;
			}
			if (onChunkOrSignal && typeof onChunkOrSignal === 'object' && 'aborted' in onChunkOrSignal) {
				abortSignal = onChunkOrSignal;
			}
		}

		const apiMessages = toChatMessages(messages);

		try {
			if (onChunk) {
				const stream = await this.client.chat.completions.create(
					{
						model,
						messages: apiMessages,
						stream: true,
						max_tokens: 4096,
						temperature: 0.7
					},
					{ signal: abortSignal }
				);

				let fullResponse = '';

				for await (const chunk of stream) {
					const content = chunk.choices[0]?.delta?.content || '';
					if (content) {
						fullResponse += content;
						onChunk(content);
					}
				}

				return fullResponse;
			}

			const response = await this.client.chat.completions.create(
				{
					model,
					messages: apiMessages,
					stream: false,
					max_tokens: 4096,
					temperature: 0.7
				},
				{ signal: abortSignal }
			);

			return response.choices[0]?.message?.content || '';
		} catch (error) {
			throw mapAPIError(error);
		}
	}
}

export async function testConnection(
	config: LLMConfigInput
): Promise<{ ok: boolean; error?: string }> {
	const safeConfig = toConfig(config);
	const testClient = new OpenAI({
		apiKey: safeConfig.apiKey,
		baseURL: safeConfig.baseURL,
		dangerouslyAllowBrowser: true
	});

	try {
		const models = await testClient.models.list();
		const modelExists = models.data.some((m) => m.id === safeConfig.model);
		if (!modelExists && models.data.length > 0) {
			return { ok: false, error: `Model "${safeConfig.model}" not found on provider.` };
		}
		return { ok: true };
	} catch (error) {
		return { ok: false, error: mapAPIError(error).message };
	}
}

let openAIService: LLMService | null = null;

export function getOpenAIService(config?: LLMConfigInput): LLMService | null {
	if (!openAIService && config) {
		openAIService = new LLMService(config);
	} else if (openAIService && config) {
		openAIService.updateConfig(config);
	}
	return openAIService;
}

export function resetOpenAIService(): void {
	openAIService = null;
}
