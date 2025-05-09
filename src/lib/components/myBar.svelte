<script>
     import { LayerCake, Svg } from 'layercake';
    import { scaleBand } from 'd3-scale';
    import Bar from '$lib/components/layercake/Bar.svelte';
    import AxisX from '$lib/components/layercake/AxisX.svelte';
    import AxisY from '$lib/components/layercake/AxisY.svelte';
    let { data, xKey, yKey } = $props();
    
</script>

<div class="chart-container">
    <LayerCake
        padding={{ bottom: 20, left: 35 }}
        x={xKey}
        y={yKey}
        yScale={scaleBand().paddingInner(0.05)}
        xDomain={[0, null]}
        {data}
    >
    <Svg>
      <AxisX tickMarks baseline snapLabels />
      <AxisY tickMarks gridlines={false} />
      <Bar />
    </Svg>
        
    </LayerCake>
</div>

<style>
  .chart-container {
    width: 80%;
    margin-left: 15rem;
    height: 250px;
  }
</style>