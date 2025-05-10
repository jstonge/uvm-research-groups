

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

We start by looking at total counts of profs with research groups. One nice thing with using ObservablePlot over layerCake is that we can use some aggregation functions like count and sum on the fly 
`}/>

<ObservablePlot 
  options={{
    width: 300,
    height: 200,
    y: {grid: true},
    marks: [
      Plot.barY(rawData, Plot.groupX({y: "count"}, {x: "has_research_group", sort: {y: "-y"}}))
    ]
  }}
/>

<MD text={`then we can look at the counts by department. Here this is a good example of how useful it is to have the ability to use duckdb in the notebook. The aggregation function to do that plot is not that simple (aka we want departments that appear in the top 10 by total count (regardless of has_research_group)`}/>

<MyRange min={5} max={31} label="Top N" bind:value={topN}/>

<ObservablePlot 
  options={{
    marginRight: 10,
    marginBottom: 120,
    width: 1000,
    height: 300,
    y: { label: "Count", grid: true },
    x: { 
        label: "Department", 
        axis:null,
    },
    fx: { 
        tickRotate: 45, 
        label: null,
        tickFormat: d => d.length > 25 ? d.slice(0, 25) + "..." : d
     },
    color: {
      legend: true, 
      type: "categorical",
      domain: [0, 1], 
      range: ["#e04050", "#40e0d0"] // Customize these colors as needed
    },
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
    let departments = $derived(Array.from(new Set(rawData.map(d => d.host_dept))).sort());
    let topN = $state(20);
    

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
                -- Step 1: Find the top 10 departments by total count
                WITH dept_totals AS (
                    SELECT host_dept, COUNT(*) AS total_n
                    FROM data
                    WHERE has_research_group IS NOT NULL
                    GROUP BY host_dept
                    ORDER BY total_n DESC
                    LIMIT ?
                )

                -- Step 2: Return counts for has_research_group = 0 and 1 for those departments
                SELECT COUNT(*) AS n, has_research_group, d.host_dept
                FROM data d
                JOIN dept_totals t ON d.host_dept = t.host_dept
                WHERE d.has_research_group IS NOT NULL
                GROUP BY d.has_research_group, d.host_dept
                ORDER BY d.host_dept, d.has_research_group;
                `, [topN]
            );
        }
    });
  
    // Use $derived.by for function-based derived state
    let wrangledData = $derived.by(() => {
        if (!selected || !rawData.length) return [];
        return rawData.filter(d => d.host_dept === selected);
    })

</script>


<style>
  :global(body) {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
    font-family: system-ui, sans-serif;
  }
</style>