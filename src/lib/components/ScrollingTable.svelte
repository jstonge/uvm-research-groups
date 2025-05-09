<script lang="ts">
  /**
   * A table component with infinite scrolling and fixed column alignment
   */
  
  import { onMount } from 'svelte';
  
  // Props
  let {
    data = [],                // Array of objects to display in the table
    headers = [],             // Column headers
    initialRows = 20,         // Initial number of rows to display
    scrollStep = 10,          // Number of rows to add when scrolling
    maxHeight = '70vh',       // Maximum height of the table container
    striped = true,           // Whether to apply striped styling
    bordered = true,          // Whether to add borders
    hoverable = true,         // Whether rows highlight on hover
    sortable = true,          // Whether columns can be sorted
    columnWidths = [],        // Optional fixed widths for columns
    class: className = ""     // Additional CSS classes
  } = $props();
  
  // Reactive state
  let visibleRows = $state(initialRows);
  let sortField = $state<string | null>(null);
  let sortDirection = $state<'asc' | 'desc'>('asc');
  let tableContainer = $state<HTMLElement | null>(null);
  
  // Calculated values
  let sortedData = $derived(getSortedData());
  let visibleData = $derived(sortedData.slice(0, visibleRows));
  let columns = $derived(data.length > 0 ? Object.keys(data[0]) : []);
  let tableHeaders = $derived(headers.length > 0 ? headers : columns);
  
  // Generate column width styles
  function getColumnStyle(index) {
    if (columnWidths && columnWidths[index]) {
      return `width: ${columnWidths[index]};`;
    }
    return ``;
  }
  
  // Event handlers
  function toggleSort(field: string) {
    if (!sortable) return;
    
    if (sortField === field) {
      // If already sorting by this field, toggle direction
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New sort field, default to ascending
      sortField = field;
      sortDirection = 'asc';
    }
  }
  
  function handleScroll(event: Event) {
    if (!tableContainer) return;
    
    const { scrollTop, scrollHeight, clientHeight } = tableContainer;
    
    // Check if we're near the bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      // Don't exceed data length
      if (visibleRows < data.length) {
        visibleRows = Math.min(visibleRows + scrollStep, data.length);
      }
    }
  }
  
  // Helper functions
  function formatCell(row: any, columnIndex: number): string {
    const columnKey = columns[columnIndex];
    const value = row[columnKey];
    
    // Format based on value type
    if (value === null || value === undefined) {
      return '';
    } else if (typeof value === 'number' && !Number.isInteger(value)) {
      return value.toFixed(2);
    } else if (columnKey === 'research_url' && value) {
      return `<a href="${value}" target="_blank" rel="noopener noreferrer">View</a>`;
    } else {
      return String(value);
    }
  }
  
  function getSortedData(): any[] {
    if (!sortField || !sortable || data.length === 0) {
      return [...data];
    }
    
    return [...data].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Handle null/undefined values
      if (valueA === null || valueA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (valueB === null || valueB === undefined) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare based on type
      if (typeof valueA === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return sortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }
    });
  }
  
  // Set up the scroll event listener when the component mounts
  $effect(() => {
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      return () => {
        tableContainer.removeEventListener('scroll', handleScroll);
      };
    }
  });
  
  // Reset visible rows when data changes
  $effect(() => {
    data;
    visibleRows = initialRows;
  });
</script>

<div class="scrolling-table-wrapper {className}">
  {#if data.length === 0}
    <div class="no-data">No data available</div>
  {:else}
    <div class="table-container" bind:this={tableContainer} style="max-height: {maxHeight};">
      <table class:striped class:bordered class:hoverable>
        <thead>
          <tr>
            {#each tableHeaders as header, index}
              <th 
                class:sortable={sortable}
                class:sorted={sortField === columns[index]}
                class:asc={sortField === columns[index] && sortDirection === 'asc'}
                class:desc={sortField === columns[index] && sortDirection === 'desc'}
                onclick={() => toggleSort(columns[index])}
                style={getColumnStyle(index)}
              >
                {header}
                {#if sortable}
                  <span class="sort-indicator">
                    {#if sortField === columns[index]}
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    {/if}
                  </span>
                {/if}
              </th>
            {/each}
          </tr>
        </thead>
        
        <tbody>
          {#each visibleData as row, rowIdx}
            <tr>
              {#each columns as column, colIdx}
                {@const formatted = formatCell(row, colIdx)}
                <td style={getColumnStyle(colIdx)}>
                  {#if formatted.startsWith('<a ')}
                    {@html formatted}
                  {:else}
                    {formatted}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
          
          {#if visibleRows < data.length}
            <tr class="loading-row">
              <td colspan={columns.length}>
                <div class="loading-indicator">
                  Loading more rows...
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    
    <div class="table-info">
      Showing {visibleRows} of {data.length} rows
    </div>
  {/if}
</div>

<style>
  .scrolling-table-wrapper {
    margin: 1rem 0;
    width: 100%;
  }
  
  .table-container {
    width: 100%;
    overflow-y: auto;
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    table-layout: fixed;
  }
  
  thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: #f8f9fa;
  }
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  th {
    background-color: #f8f9fa;
    font-weight: bold;
  }
  
  /* Style variations */
  .striped tbody tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  .bordered th, .bordered td {
    border: 1px solid #e5e7eb;
  }
  
  .hoverable tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  /* Sortable columns */
  .sortable {
    cursor: pointer;
    position: relative;
    user-select: none;
  }
  
  .sortable:hover {
    background-color: #e9ecef;
  }
  
  .sort-indicator {
    display: inline-block;
    margin-left: 0.25rem;
  }
  
  /* Table info */
  .table-info {
    margin-top: 0.5rem;
    text-align: right;
    color: #6c757d;
    font-size: 0.875rem;
  }
  
  /* Loading indicator */
  .loading-row {
    background-color: #f9fafb !important;
  }
  
  .loading-indicator {
    text-align: center;
    padding: 0.5rem;
    color: #6c757d;
    font-style: italic;
  }
  
  .no-data {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    background-color: #f8f9fa;
    border-radius: 0.25rem;
    border: 1px solid #e5e7eb;
  }
</style>