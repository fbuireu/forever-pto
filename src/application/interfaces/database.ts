export interface QueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Database {
  query<T = unknown>(sql: string, args?: unknown[]): Promise<QueryResult<T[]>>;
  execute(sql: string, args?: unknown[]): Promise<QueryResult<void>>;
  batch<T = unknown>(
    statements: Array<{ sql: string; args?: unknown[] }>
  ): Promise<QueryResult<T[]>>;
}
