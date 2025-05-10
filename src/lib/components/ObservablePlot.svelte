<script>
  import * as Plot from '@observablehq/plot';
  
  let { options } = $props();
  let container = $state();
  
  $effect(() => {
    if (!container || !options) return;
    
    container.innerHTML = '';
    const chart = Plot.plot(options);
    container.append(chart);
  });
</script>

<div bind:this={container}></div>