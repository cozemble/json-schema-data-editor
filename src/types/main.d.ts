/** The path to the field in the data */
declare type Path = string[]
declare type SimplePath = string

/** History log entry */
declare interface HistoryEntry {
	/** The path to the field in the data */
	path: SimplePath
	/** To track the time of the change */
	timestamp: number

	/** The value of the field before the change */
	previous: AnyValue
	/** The value of the field after the change */
	current: AnyValue
}
