import mysql from 'mysql2/promise';

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'mysqlserverless.cluster-cautknyafblq.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: '35nPQH!ut;anvcA',
  database: 'GPT_experiment',
  waitForConnections: true,
  connectionLimit: 100000, // 连接池中保持的最大连接
  queueLimit: 0,
  idleTimeout:60000
});

export default pool;
