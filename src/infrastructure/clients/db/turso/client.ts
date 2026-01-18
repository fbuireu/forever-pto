import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { connect, type Connection } from '@tursodatabase/serverless';
import { type InValue } from '@tursodatabase/serverless/compat';

export interface QueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TursoConfig {
  url: string;
  authToken: string;
}

export class TursoClient {
  private readonly config: TursoConfig;
  private logger = getBetterStackInstance();

  constructor(config: TursoConfig) {
    this.config = config;
  }

  private createConnection(): Connection {
    return connect({
      url: this.config.url,
      authToken: this.config.authToken,
    });
  }

  async query<T = unknown>(sql: string, args?: InValue[]): Promise<QueryResult<T[]>> {
    try {
      const connection = this.createConnection();
      const statement = connection.prepare(sql);
      const rows = await statement.all(args ?? []);

      return {
        success: true,
        data: rows as T[],
      };
    } catch (error) {
      this.logger.logError('Turso query failed', error, {
        sql: sql.slice(0, 100),
        hasArgs: !!args,
        argsLength: args?.length,
      });
      return this.handleError<T[]>(error);
    }
  }

  async execute(sql: string, args?: InValue[]): Promise<QueryResult<void>> {
    try {
      const connection = this.createConnection();
      const statement = connection.prepare(sql);
      await statement.run(args ?? []);

      return { success: true };
    } catch (error) {
      this.logger.logError('Turso execute failed', error, {
        sql: sql.slice(0, 100),
        hasArgs: !!args,
        argsLength: args?.length,
      });
      return this.handleError<void>(error);
    }
  }

  async batch<T = unknown>(statements: Array<{ sql: string; args?: InValue[] }>): Promise<QueryResult<T[]>> {
    try {
      const connection = this.createConnection();
      const queries = statements.map((statement) => statement.sql);
      await connection.batch(queries);

      return {
        success: true,
        data: [] as T[],
      };
    } catch (error) {
      this.logger.logError('Turso batch query failed', error, {
        statementCount: statements.length,
        firstSql: statements[0]?.sql.slice(0, 100),
      });
      return this.handleError<T[]>(error);
    }
  }

  private handleError<T>(error: unknown): QueryResult<T> {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected database error occurred. Please try again.',
    };
  }
}

let tursoClientInstance: TursoClient | null = null;

export const getTursoClientInstance = (): TursoClient => {
  if (tursoClientInstance) {
    return tursoClientInstance;
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined');
  }

  tursoClientInstance = new TursoClient({ url, authToken });
  return tursoClientInstance;
};
