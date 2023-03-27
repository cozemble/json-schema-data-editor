import type { Writable } from 'svelte/store'

import { writable, get } from 'svelte/store'
import _ from 'lodash'

export const record: Writable<ObjectValue> = writable({})

export const editValue = (path: Path | SimplePath, value: any) => {
	const recordValue = _.cloneDeep(get(record))

	_.set(recordValue, path, value)

	record.set(recordValue)
}
