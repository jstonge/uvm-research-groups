<script lang="ts">
  import { Slider } from "bits-ui";
  import cn from "clsx";
 
  let { value = $bindable(), min, max, label } = $props();
</script>
 
<div class="with-tailwind">
<div class="w-full md:max-w-[280px] mt-4 mb-4">
    {#if label}
         <label class="text-sm font-medium text-foreground mb-2 block">
        {label}: {value}
    </label>
  {/if}

  <Slider.Root
    type="single"
    bind:value
    min={min}
    max={max}
    class="relative flex w-full touch-none select-none items-center"
  >
    {#snippet children()}
      <span
        class="bg-dark-10 relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full"
      >
        <Slider.Range class="bg-foreground absolute h-full" />
      </span>
      <Slider.Thumb
        index={0}
        class={cn(
          "border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card focus-visible:outline-hidden block size-[25px] cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        )}
      />
    {/snippet}
  </Slider.Root>
</div>
</div>