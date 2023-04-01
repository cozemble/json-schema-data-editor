import type { Writable } from 'svelte/store'

import { writable, get } from 'svelte/store'
import _ from 'lodash'
import Ajv from 'ajv'

import { modelStore } from './model'
import { addErrors, resetErrors } from './errors'

const HISTORY_THRESHOLD = 1000

export const record: Writable<any> = writable({})

export const history: Writable<HistoryEntry[]> = writable([])
export const historyIndex: Writable<number> = writable(0)

export const editValue = (path: Path | SimplePath, value: any): void => {
	const recordValue = _.cloneDeep(get(record))
	const previous = _.get(recordValue, path)

	if (_.isEqual(previous, value)) return // do nothing if the value is the same

	_.set(recordValue, path, value)

	record.set(recordValue)
	handleHistory(typeof path === 'string' ? path : path.join(), previous, value)
}

// # HISTORY

const addToHistory = (path: SimplePath, previous: any, current: any): void => {
	let historyValue = _.cloneDeep(get(history))
	const historyIndexValue = get(historyIndex)

	// if the history index is not at the end, remove the rest of the history because it is no longer valid
	if (historyIndexValue < historyValue.length - 1) {
		historyValue = _.cloneDeep(historyValue.slice(0, historyIndexValue + 1))
	}

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

const handleHistory = (path: SimplePath, previous: any, current: any): void => {
	if (previous === current) return // do nothing if the value is the same

	const historyValue = _.cloneDeep(get(history))
	const lastHistoryEntry = _.cloneDeep(_.last(historyValue))

	if (!lastHistoryEntry) return addToHistory(path, previous, current)

	// if the user started editing a different value, add a new history entry to keep them separated
	if (lastHistoryEntry.path !== path) return addToHistory(path, previous, current)

	// -- for the edits on the same value --
	const now = Date.now()
	const timeDifference = now - lastHistoryEntry.timestamp

	// update last history entry if the time difference is less than the threshold
	if (timeDifference < HISTORY_THRESHOLD)
		return history.set(
			_.cloneDeep([...historyValue.slice(0, -1), { ...lastHistoryEntry, current }])
		)

	// add a new history entry if the time difference is more than the threshold
	addToHistory(path, previous, current)
}

// # UNDO / REDO

export const undo = (): void => {
	const historyValue = _.cloneDeep(get(history))
	const historyEntry = _.cloneDeep(historyValue[get(historyIndex)])

	if (!historyEntry) return // if there is no history entry, do nothing

	const recordValue = _.cloneDeep(get(record))
	_.set(recordValue, historyEntry.path, historyEntry.previous)
	record.set(recordValue)

	historyIndex.set(get(historyIndex) - 1) // lower the history index to know where we are in the history
}

export const redo = (): void => {
	const historyValue = _.cloneDeep(get(history))
	const historyEntry = _.cloneDeep(historyValue[get(historyIndex) + 1])

	if (!historyEntry) return // if there is no history entry, do nothing

	const recordValue = _.cloneDeep(get(record))
	_.set(recordValue, historyEntry.path, historyEntry.current)
	record.set(recordValue)

	historyIndex.set(get(historyIndex) + 1) // raise the history index to know where we are in the history
}

// # VALIDATION & SUBMISSION

export const validate = (): boolean => {
	const recordValue = _.cloneDeep(get(record))

	const ajv = new Ajv({
		allErrors: true
	})

	// add custom keywords used in Cozemble model configurations
	ajv.addVocabulary(['coz', 'formula', 'customComponent'])

	const validate = ajv.compile(get(modelStore))
	const isValid = validate(recordValue)

	// handle errors
	if (isValid) resetErrors()
	else if (validate.errors) addErrors(validate.errors)

	return isValid
}

export const handleSubmit = async (onSubmit: RecordSubmitFunction): Promise<boolean> => {
	const recordValue = _.cloneDeep(get(record))
	const isValid = validate()

	if (!isValid) return false

	// submit with the given function
	const response = await onSubmit(recordValue)

	// handle errors coming from the server
	if (response.errors) addErrors(response.errors)

	return response.success
}
