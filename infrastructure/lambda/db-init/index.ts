import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const rdsData = new RDSDataClient({});
const secretsManager = new SecretsManagerClient({});

export const handler = async (event: any) => {
  try {
    // Get database credentials from Secrets Manager
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: process.env.DB_SECRET_NAME,
      })
    );

    const secret = JSON.parse(secretResponse.SecretString || '{}');
    const { username, password, host, port, dbname } = secret;

    // Create tables
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        is_pro BOOLEAN DEFAULT FALSE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(user_id),
        title TEXT NOT NULL,
        room_type TEXT NOT NULL,
        style TEXT NOT NULL,
        budget_range TEXT NOT NULL,
        suggestions JSONB,
        cost_estimate INTEGER,
        value_gain INTEGER,
        render_s3_key TEXT,
        original_s3_key TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Render logs table
      CREATE TABLE IF NOT EXISTS render_logs (
        log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(user_id),
        project_id UUID REFERENCES projects(project_id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_render_logs_user_id ON render_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_render_logs_project_id ON render_logs(project_id);
    `;

    // Execute SQL statements
    await rdsData.send(
      new ExecuteStatementCommand({
        secretArn: process.env.DB_SECRET_NAME,
        database: dbname,
        sql: createTablesSQL,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database schema initialized successfully' }),
    };
  } catch (error) {
    console.error('Error initializing database schema:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to initialize database schema' }),
    };
  }
}; 