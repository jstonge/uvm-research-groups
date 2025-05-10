<script>
    
    import Markdown from 'svelte-exmarkdown';
    import { gfmPlugin } from 'svelte-exmarkdown/gfm';
    
    let { text } = $props();

    const plugins = [gfmPlugin()];

    function processContent(content) {
        if (!content) {
            return ""; // Return empty string if content is undefined or null
        }

        // Remove reference markers like [^1]
        content = content.replace(/\[\^(\d+)\]/g, '');

        // Remove leading whitespace at the beginning of each line
        return content.replace(/^[ \t]+/gm, '');
    }
</script>

<div class="prose prose-lg max-w-none dark:prose-invert">
<section class="content-section" >        
    <Markdown md={processContent(text)} {plugins} />
</section>
</div>

<style>
    .content-section {
        margin-bottom: 2rem;
        margin-top: 2rem;
    }
</style>