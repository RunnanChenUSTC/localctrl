import mysql from 'mysql2/promise';

const config: mysql.ConnectionOptions = {
  host: 'mysqlserverless.cluster-cautknyafblq.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: '35nPQH!ut;anvcA',
  database: 'GPT_experiment',
  connectTimeout: 10000,
};

// 每个请求新建连接，用完立即关闭。
// Serverless 实例冻结时不会留下空闲连接占用数据库。
async function withConnection<T>(fn: (connection: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection(config);
  try {
    return await fn(connection);
  } finally {
    await connection.end().catch(() => connection.destroy());
  }
}

// 单条查询的便捷写法，返回值形状与 pool.execute 一致。
async function execute<T>(sql: string, values: any[] = []): Promise<[T]> {
  return withConnection(async (connection) => {
    const [result] = await connection.execute(sql, values);
    return [result] as unknown as [T];
  });
}

const db = { execute, withConnection };

export default db;
