export interface Message {
	id: string;
	content: string;
	role: 'user' | 'assistant' | 'system';
	timestamp: Date;
}

export interface LLMConfig {
	baseURL: string;
	apiKey: string;
	model: string;
}
