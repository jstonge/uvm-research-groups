<script>
    import { useDuckDB } from '$lib/db/useDuckDB.svelte.js';
    import * as Plot from '@observablehq/plot';
    
    import MD from '$lib/components/MarkdownRenderer.svelte';
    import ScrollingTable from '$lib/components/ScrollingTable.svelte';
    import ObservablePlot from '$lib/components/ObservablePlot.svelte';
    import MyRange from '$lib/components/MyRange.svelte';
    import MySelect from '$lib/components/MySelect.svelte';

    const duckDB = useDuckDB('data', '/data.csv');

    // State variables
    let rawData = $state([]);
    let countData = $state([]);
    let selected = $state("");

    // When wrangling with duckdb-wasm, we need to do it async.
    $effect(async () => {
        if (!duckDB.loading && duckDB.query) {
            rawData = await duckDB.query(`SELECT * EXCLUDE (notes, first_pub_year) FROM data`);
        }
    });
  
    // When wrangling with duckdb-wasm, we need to do it async.
    $effect(async () => {
        if (!duckDB.loading && duckDB.query) {
            countData = await duckDB.query(
                `
                SELECT *
                FROM (
                    SELECT COUNT(*) AS n, has_research_group, host_dept
                    FROM data
                    WHERE has_research_group IS NOT NULL
                    GROUP BY has_research_group, host_dept
                ) AS grouped
                ORDER BY n DESC
                LIMIT ?
                `, [topN]
            );
        }
    });
  
    // Use $derived.by for function-based derived state
    let wrangledData = $derived.by(() => {
        if (!selected || !rawData.length) return [];
        return rawData.filter(d => d.host_dept === selected);
    })

    const departments = $derived(Array.from(new Set(rawData.map(d => d.host_dept))).sort());
    let topN = $state(20);

     

  
  $inspect(selected);

</script>

<MD text={`
# Exploring UVM research groups

This is an example of a sveltekit app that uses 
- [DuckDB-wasm](https://www.npmjs.com/package/@duckdb/duckdb-wasm) for efficient in-browser data wrangling.
- [ex-markdown](https://github.com/ssssota/svelte-exmarkdown) as markdown renderer.
- [ObservablePlot](https://observablehq.com/plot/) for quick data visualizations.
- [LayerCake](https://layercake.graphics/) for tailored data visualizations. 
- [Bits-UI](https://bits-ui.com/) with [Tailwind 4](https://tailwindcss.com/) for other components.

We weight the pros and cons of such setup compared to using something like [Observable framework](https://github.com/observablehq/framework). See README on github to get the setup up and running.

## Count Data

We start by looking at some count data of departments represented in the dataset
`}/>

<MyRange min={5} max={31} label="Top N" bind:value={topN}/>

<ObservablePlot 
  options={{
    marginLeft: 50,
    marginRight: 10,
    marginBottom: 120,
    width: 1000,
    y: { label: "Count", grid: true },
    x: { 
        label: "Department", 
        axis:null
    },
    fx: { 
        tickRotate: 45, 
        label: null,
        tickFormat: d => d.length > 25 ? d.slice(0, 25) + "..." : d
     },
    color: {scheme: "spectral", legend: true, type: "categorical"},
    marks: [
      Plot.barY(countData, {
        y: 'n', 
        x: 'has_research_group', 
        fill: 'has_research_group',
        fx: 'host_dept',
        tip: true,
        sort: {x: null, color: null, fx: {value: "-y", reduce: "sum"}}
      })
    ]
  }}
/>

<MD text={`
## Filtered data

Here we filter some data based on host department.
`}/>

<MySelect options={departments} bind:value={selected}/>


<ScrollingTable data={wrangledData} initialRows={12} maxHeight="400px" />

<MD text={`
---
# Appendix

Here is the raw data
`}/>

<ScrollingTable data={rawData} initialRows={12} maxHeight="400px" />

<style>
  :global(body) {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
    font-family: system-ui, sans-serif;
  }
</style>