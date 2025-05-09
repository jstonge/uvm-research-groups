<script>
    import { useDuckDB } from '$lib/db/useDuckDB.svelte.js';
    import MD from '$lib/components/MarkdownRenderer.svelte';
    import BarChart from './myBar.svelte';
    import ScrollingTable from '$lib/components/ScrollingTable.svelte';

    const duckDB = useDuckDB('data', '/data.csv');

    // State variables
    let rawData = $state([]);
    let countData = $state([]);
    let wrangledData = $state([]);
    let selected = $state('');

    $effect(async () => {
    
        if (!duckDB.loading && duckDB.query) {
        
            rawData = await duckDB.query(
                `SELECT * FROM data`
            );
            
            countData = await duckDB.query(
                `
                SELECT *
                FROM (
                    SELECT COUNT(*) AS n, has_research_group, host_dept
                    FROM data
                    WHERE has_research_group IS NOT NULL
                    GROUP BY has_research_group, host_dept
                ) AS grouped
                WHERE has_research_group = 1
                ORDER BY n DESC
                LIMIT 5
                `
            );
        }
    });
  
    // Second effect that depends on selected department
    $effect(async () => {
        if (!duckDB.loading && duckDB.query && selected) {
            wrangledData = await duckDB.query(
                `SELECT * FROM data WHERE host_dept = ?`,
                [selected]
            );
        }
    });
    
    $inspect(selected)
</script>


<MD text={`
# Hello Markdown

This is an example of a sveltekit app that uses DuckDB to query a CSV file, ex-markdown as markdown renderer, and LayerCake for data visualization.

## Count Data

We start by looking at some count data
`}/>

<BarChart data={countData} yKey={'host_dept'} xKey={'n'}/>

<MD text={`Here is the corresponding table`}/>

<ScrollingTable data={countData} initialRows={12} maxHeight="400px" />

<MD text={`
## Filtered data

Here we filter some data based on host department.
`}/>

<select bind:value={selected}>
    {#each new Set(rawData.map(d => d.host_dept)) as dept}
            <option value={dept}>{dept}</option>
    {/each}
</select>

<ScrollingTable data={wrangledData} initialRows={12} maxHeight="400px" />

<MD text={`## Raw Data`}/>

<ScrollingTable data={rawData} initialRows={12} maxHeight="400px" />

<style>
  :global(body) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    font-family: system-ui, sans-serif;
  }
</style>