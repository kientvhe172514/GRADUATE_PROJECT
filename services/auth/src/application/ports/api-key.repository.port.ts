export interface ApiKeyRepositoryPort {
  findAll(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ apiKeys: any[]; total: number }>;
  findById(id: number): Promise<any | null>;
  findByKey(key: string): Promise<any | null>;
  create(apiKeyData: any): Promise<any>;
  update(id: number, apiKeyData: any): Promise<any>;
  delete(id: number): Promise<void>;
  regenerate(id: number, newKey: string): Promise<any>;
  rotate(id: number, newKey: string): Promise<any>;
  getUsageStats(id: number): Promise<any>;
  incrementUsage(apiKeyId: number): Promise<void>;
}
