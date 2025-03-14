import axios from 'axios';
import type { Message, ModelParams } from '../store';

const API_BASE_URL = 'http://localhost:11434';

const ollamaApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GenerateRequest {
  model: string;
  prompt?: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  images?: string[];
  options?: ModelParams;
  messages?: Message[];
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  context: number[];
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
  prompt_eval_count?: number;
}

export interface ModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model?: string;
    format: string;
    family: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

// 获取可用模型列表
export async function getModels(): Promise<string[]> {
  try {
    const response = await ollamaApi.get('/api/tags');
    return response.data.models.map((model: ModelInfo) => model.name);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    return [];
  }
}

// 生成对话响应（流式）
export async function generateChatStream(
  request: {
    model: string;
    messages: { role: string; content: string; images?: string[] }[];
    stream?: boolean;
    options?: ModelParams;
    onUpdate?: (content: string) => void;
  }
): Promise<string> {
  const { model, messages, stream = true, options = {}, onUpdate = () => {} } = request;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        options,
        keep_alive: -1, // 保持模型加载
        raw: true, // 添加raw参数，确保保留特殊标签如<think>
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status} (${response.statusText})`;
      
      try {
        // Try to parse the error as JSON
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage += ` - ${errorJson.error}`;
        } else {
          errorMessage += ` - ${errorText}`;
        }
      } catch (e) {
        // If not valid JSON, just append the text
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let result = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      try {
        // 处理JSON行
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              result += data.message.content;
              onUpdate(data.message.content);
            }
          } catch (e) {
            // 如果不是有效的JSON，直接传递内容
            result += line;
            onUpdate(line);
          }
        }
      } catch (e) {
        // 如果解析失败，直接传递原始块
        result += chunk;
        onUpdate(chunk);
      }
    }

    return result;
  } catch (error) {
    console.error('Error generating chat stream:', error);
    throw error;
  }
}

// 生成对话响应（非流式）
export async function generateChat(
  model: string,
  messages: Message[],
  systemPrompt: string = '',
  params: ModelParams = {}
): Promise<string> {
  try {
    // 转换消息格式为ollama API格式
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      images: msg.images
    }));

    const response = await ollamaApi.post('/api/chat', {
      model,
      messages: ollamaMessages,
      stream: false,
      options: params,
      system: systemPrompt,
    });

    return response.data.message.content;
  } catch (error) {
    console.error('生成对话失败:', error);
    throw error;
  }
}

// 检查ollama服务是否可用
export async function checkOllamaService(): Promise<{ success: boolean; error?: string }> {
  try {
    await ollamaApi.get('/api/version');
    return { success: true };
  } catch (error) {
    console.error('Ollama服务不可用:', error);
    let errorMessage = 'Unknown error';
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `HTTP Error: ${error.response.status} (${error.response.statusText})`;
        if (error.response.data && typeof error.response.data === 'object') {
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from Ollama service. Please check if Ollama is running.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}