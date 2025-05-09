/**
 * A minimal DuckDB client for browser environments that safely handles initialization errors.
 * 
 * This version uses dynamic imports to avoid WebAssembly initialization issues and
 * safely falls back to a no-op client when DuckDB can't be initialized.
 */

// NoOp client for when DuckDB isn't available
class DuckDBNoopClient {
  constructor() {
    console.warn('Using DuckDB NoOp client - database functionality is not available');
  }
  
  async query() { return []; }
  async sql() { return []; }
  async registerTable() {}
  async close() {}
  
  static async of() {
    return new DuckDBNoopClient();
  }
}

// Main client - will be lazily initialized
let DuckDBClient;

// Storage for singleton instances
let db = null;
let initPromise = null;

/**
 * Creates and returns a DuckDB client instance
 * Safely handles initialization errors
 */
export async function createDuckDBClient(sources = {}) {
  // Always return the NoOp client during SSR
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return new DuckDBNoopClient();
  }

  // Return existing instance if available
  if (db) return db;
  
  // Wait for initialization if in progress
  if (initPromise) return initPromise;
  
  // Start the initialization process
  initPromise = (async () => {
    try {
      console.log('Initializing DuckDB...');
      
      // Dynamically import DuckDB to avoid issues during SSR
      const duckdb = await import('@duckdb/duckdb-wasm');
      
      // Try to load the WASM modules
      try {
        // Import the WASM and worker URLs
        const wasmUrl = (await import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url')).default;
        const workerUrl = (await import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url')).default;
        
        // Create the bundle
        const DUCKDB_BUNDLES = {
          mvp: {
            mainModule: wasmUrl,
            mainWorker: workerUrl,
          }
        };
        
        // Select the bundle
        const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);
        
        // Create worker and database
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
        const duckdbInstance = new duckdb.AsyncDuckDB(logger, worker);
        
        // Initialize the WASM module
        await duckdbInstance.instantiate(bundle.mainModule);
        
        // Create a simple client class
        DuckDBClient = class {
          constructor(dbInstance) {
            this._db = dbInstance;
            this._conn = null;
          }
          
          /**
           * Get a database connection
           */
          async getConnection() {
            if (!this._conn) {
              this._conn = await this._db.connect();
            }
            return this._conn;
          }
          
          /**
           * Run a SQL query
           */
          async query(sql, params = []) {
            const conn = await this.getConnection();
            try {
              let result;
              if (params.length > 0) {
                const stmt = await conn.prepare(sql);
                result = await stmt.query(...params);
              } else {
                result = await conn.query(sql);
              }
              
              // Convert BigInt to Number
              return result.toArray().map(row => {
                const obj = {};
                for (const key in row) {
                  if (typeof row[key] === 'bigint') {
                    obj[key] = Number(row[key]);
                  } else {
                    obj[key] = row[key];
                  }
                }
                return obj;
              });
            } catch (err) {
              console.error(`Query error: ${sql}`, err);
              throw err;
            }
          }
          
          /**
           * SQL template tag function
           */
          async sql(strings, ...params) {
            const query = strings.join('?');
            return this.query(query, params);
          }
          
          /**
           * Register a table from a data source
           */
          async registerTable(name, source) {
            if (!source || !source.path) {
              console.warn(`Invalid source for ${name}`);
              return;
            }
            
            try {
              const response = await fetch(source.path);
              if (!response.ok) {
                throw new Error(`Failed to load ${source.path}: ${response.statusText}`);
              }
              
              const text = await response.text();
              await this._db.registerFileText(`${name}.csv`, text);
              
              const conn = await this.getConnection();
              await conn.query(`CREATE TABLE ${name} AS SELECT * FROM read_csv_auto('${name}.csv')`);
              
              console.log(`Registered table ${name} from ${source.path}`);
            } catch (err) {
              console.error(`Failed to register table ${name}:`, err);
              throw err;
            }
          }
          
          /**
           * Close the database connection
           */
          async close() {
            if (this._conn) {
              await this._conn.close();
              this._conn = null;
            }
          }
          
          /**
           * Create a new client with optional data sources
           */
          static async of(sources = {}) {
            const client = new DuckDBClient(duckdbInstance);
            
            // Register all sources
            for (const [name, source] of Object.entries(sources)) {
              await client.registerTable(name, source);
            }
            
            return client;
          }
        };
        
        // Create a client instance
        const client = await DuckDBClient.of(sources);
        db = client;
        
        console.log('DuckDB initialized successfully');
        return client;
      } catch (e) {
        console.error('Error initializing DuckDB WASM:', e);
        throw e;
      }
    } catch (err) {
      console.error('Failed to initialize DuckDB:', err);
      
      // Reset the promise and return the NoOp client on error
      initPromise = null;
      return new DuckDBNoopClient();
    }
  })();
  
  return initPromise;
}

/**
 * Helper function to create a simple file attachment object
 */
export function FileAttachment(path) {
  return { path };
}