import type { Writable } from 'svelte/store'

import { writable } from 'svelte/store'

export const errors: Writable<ErrorObject[]> = writable([])

export const resetErrors = () => errors.set([])

/** Convert the error object from Ajv to a more usable format */
const adaptError = (error: AjvErrorObject): ErrorObject => {
	const errorType = error.keyword
	let path = error.instancePath.replaceAll('/', '.')

	// error cases that needs special handling:

	// display uniqueness error for only the second item in the array
	if (errorType === 'uniqueItems') path = path + '.' + error.params.i

	// display required error for the missing property itself
	if (errorType === 'required') path = path + '.' + error.params.missingProperty

	// remove . from start of path
	if (path.startsWith('.')) path = path.slice(1)

	return {
		...error,
		path
	}
}

/** Add errors to the store with handling for special cases */
export const addErrors = (newErrors: AjvErrorObject[]) => {
	errors.update((errors) => [...errors, ...newErrors.map(adaptError)])
}
