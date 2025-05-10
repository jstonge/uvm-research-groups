<script>
    import { useDuckDB } from '$lib/db/useDuckDB.svelte.js';
    import MD from '$lib/components/MarkdownRenderer.svelte';
    import ScrollingTable from '$lib/components/ScrollingTable.svelte';
    import * as Plot from '@observablehq/plot';
    import ObservablePlot from '$lib/components/ObservablePlot.svelte';

    const duckDB = useDuckDB('data', '/data.csv');

    // State variables
    let rawData = $state([]);
    let countData = $state([]);
    let selected = $state('');

    // When wrangling with duckdb-wasm, we need to do it async.
    $effect(async () => {
        if (!duckDB.loading && duckDB.query) {
            rawData = await duckDB.query(`SELECT * FROM data`);
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
                LIMIT 10
                `
            );
        }
    });
  
    // Use $derived.by for function-based derived state
    let wrangledData = $derived.by(() => {
        if (!selected || !rawData.length) return [];
        return rawData.filter(d => d.host_dept === selected);
    });
</script>

<MD text={`
# Hello Markdown

This is an example of a sveltekit app that uses DuckDB to query a CSV file, ex-markdown as markdown renderer, and LayerCake for data visualization. But we gain a few things, such as sorting and aggregating on the fly while plotting. 

## Count Data

We start by looking at some count data
`}/>

<MD text={`Here is the corresponding bar chart in Observable Plot. The code is a bit clunky.`}/>

<ObservablePlot 
  options={{
    marginLeft: 300,
    width: 600,
    x: { label: "Count", grid: true },
    y: { label: "Department" },
    marks: [
      Plot.barX(countData, {
        x: 'n', 
        y: 'host_dept', 
        fill: 'steelblue',
        sort: {y: '-x'}
      })
    ]
  }}
/>

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