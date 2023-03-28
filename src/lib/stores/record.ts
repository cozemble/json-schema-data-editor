import type { Writable } from 'svelte/store'

import { writable, get } from 'svelte/store'
import _ from 'lodash'

const HISTORY_THRESHOLD = 1000

export const record: Writable<ObjectValue> = writable({})

export const editValue = (path: Path | SimplePath, value: any) => {
	const recordValue = _.cloneDeep(get(record))

	const previous = _.get(recordValue, path)

	if (_.isEqual(previous, value)) return

	_.set(recordValue, path, value)

	handleHistory(typeof path === 'string' ? path : path.join(), previous, value)

	record.set(recordValue)
}

// * HISTORY

export const history: Writable<HistoryEntry[]> = writable([])
export const historyIndex: Writable<number> = writable(0)

const addToHistory = (path: SimplePath, previous: AnyValue, current: AnyValue) => {
	const historyValue = _.cloneDeep(get(history))
	const historyIndexValue = get(historyIndex)

	// if the history index is not at the end, remove the rest of the history because it is no longer valid
	if (historyIndexValue > 0) history.set(_.cloneDeep(historyValue.slice(0, historyIndexValue)))

	history.set([
		...historyValue,
		_.cloneDeep({
			path,
			timestamp: Date.now(),
			previous,
			current
		})
	])

	historyIndex.set(historyValue.length)
}

const handleHistory = (path: SimplePath, previous: AnyValue, current: AnyValue): void => {
	if (previous === current) return

	const historyValue = _.cloneDeep(get(history))
	const lastHistoryEntry = _.cloneDeep(_.last(historyValue))

	// if there is no last history entry, add a new one
	if (!lastHistoryEntry) return addToHistory(path, previous, current)

	// if the last history entry is not for the same path, add a new one
	if (lastHistoryEntry.path !== path) return addToHistory(path, previous, current)

	// if the last history entry is for the same path, check if it was less than a second ago
	const now = Date.now()
	const timeDifference = now - lastHistoryEntry.timestamp

	if (timeDifference < HISTORY_THRESHOLD) {
		// update last history entry
		lastHistoryEntry.current = current

		history.set(_.cloneDeep([...historyValue.slice(0, -1), lastHistoryEntry]))

		return
	}

	addToHistory(path, previous, current)
}
