import type { Writable } from 'svelte/store'
import type { ErrorObject } from 'ajv'

import { writable } from 'svelte/store'

export const errors: Writable<ErrorObject[]> = writable([])
