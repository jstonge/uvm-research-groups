// $lib/db/useDuckDB.svelte.js
import { browser } from '$app/environment';
import { base } from '$app/paths'; // Import the base path from SvelteKit

/**
 * Hook to use a DuckDB table in a component
 */
export function useDuckDB(tableName, sourcePath) {
  let data = $state([]);
  let loading = $state(true);
  let error = $state(null);
  let db = $state(null);
  
  // Load table data
  async function loadData() {
    if (!browser) return;
    
    console.log('Starting to load data...');
    loading = true;
    error = null;
    
    try {
      // Import DuckDB client
      const { createDuckDBClient, FileAttachment } = await import('../duckdb-client');
      
      // Create the full path with the base path included
      const fullPath = sourcePath.startsWith('/') 
        ? `${base}${sourcePath}`  // Add base path to absolute paths
        : sourcePath;             // Leave relative paths as is
      
      console.log('Creating DuckDB client with path:', fullPath);
      
      // Create client with source
      const client = await createDuckDBClient({
        [tableName]: FileAttachment(fullPath)
      });
      
      db = client;
      console.log('Client created, querying data...');
      
      // Query data
      const result = await client.query(`SELECT * FROM ${tableName}`);
      console.log(`Loaded ${result.length} records from ${tableName}`);
      
      // Update state - make sure to use a new array to trigger reactivity
      data = [...result];
      loading = false;
    } catch (err) {
      console.error('Error loading data:', err);
      error = err.message || 'Failed to load data';
      loading = false;
    }
  }
  
  // Load data when in browser
  $effect(() => {
    if (browser) {
      console.log('Effect triggered, loading data...');
      loadData();
    }
  });
  
  // Return table data and controls
  return {
    get data() { return data; },
    get loading() { return loading; },
    get error() { return error; },
    reload: loadData,
    
    // Custom query on this database
    async query(sql, params = []) {
      if (!browser || !db) return [];
      
      try {
        return await db.query(sql, params);
      } catch (err) {
        console.error('Query error:', err);
        error = err.message || 'Query failed';
        return [];
      }
    }
  };
}

// Export the FileAttachment helper from the original module
export function FileAttachment(path) {
  return { path };
}