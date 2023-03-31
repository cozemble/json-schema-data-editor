/** The path to the field in the data */
declare type Path = (string | number)[]
declare type SimplePath = string

/** History log entry */
declare interface HistoryEntry {
	/** The path to the field in the data */
	path: SimplePath
	/** To track the time of the change */
	timestamp: number

	/** The value of the field before the change */
	previous: any
	/** The value of the field after the change */
	current: any
}

declare type RecordSubmitFunction = (record: any) => Promise<{
	success: boolean
	message: string
	errors?: import('ajv').ErrorObject[]
}>
