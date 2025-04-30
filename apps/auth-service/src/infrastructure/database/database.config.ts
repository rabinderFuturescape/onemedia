import { Pool } from 'pg';
import { LoggerService } from '../logging/logger.service';

/**
 * Configure and create a PostgreSQL connection pool
 * @param logger Logger service
 * @returns Configured connection pool
 */
export function createConnectionPool(logger: LoggerService): Pool {
  // Parse connection string to get database details
  const connectionString = process.env.DATABASE_URL;
  
  // Default pool configuration
  const poolConfig = {
    connectionString,
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '5000', 10),
  };
  
  logger.log(`Creating database connection pool with min=${poolConfig.min}, max=${poolConfig.max}`, 'DatabaseConfig');
  
  // Create the connection pool
  const pool = new Pool(poolConfig);
  
  // Set up event listeners
  pool.on('connect', (client) => {
    logger.debug('New database connection established', 'DatabaseConfig');
  });
  
  pool.on('error', (err, client) => {
    logger.error(`Unexpected database error on idle client: ${err.message}`, err.stack, 'DatabaseConfig');
  });
  
  pool.on('acquire', (client) => {
    logger.debug('Database connection acquired from pool', 'DatabaseConfig');
  });
  
  pool.on('remove', (client) => {
    logger.debug('Database connection removed from pool', 'DatabaseConfig');
  });
  
  return pool;
}
