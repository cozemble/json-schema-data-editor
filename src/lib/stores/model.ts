import type { Writable } from 'svelte/store'

import { writable } from 'svelte/store'

export const modelStore: Writable<CozJSONSchema> = writable({})
