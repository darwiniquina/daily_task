<script setup lang="ts">
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

interface Props {
    text?: string
}

const props = defineProps<Props>()
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <slot />
            </TooltipTrigger>

            <TooltipContent v-if="text">
                <p>{{ text }}</p>
            </TooltipContent>

            <slot name="content" v-else />
        </Tooltip>
    </TooltipProvider>
</template>
