/** To calculate the value of a field */
declare type Formula = {
	/** list of fields that the formula depends on, on global scope */
	deps: SimplePath[]

	/**
	 * @param record The whole record
	 * @param path The path to this field in the data
	 * @returns The calculated value for the field
	 */
	exec: (record: any, path: Path) => Promise<AnyValue>
}

declare interface JSONSchemaCozembleConfigs {
	formula?: Formula
}

/** JSON Schema but cozemble specific configs are merged in place */
declare type CozJSONSchema = JSONSchema & {
	coz?: JSONSchemaCozembleConfigs
	properties?: Record<string, CozJSONSchema>
	items?: CozJSONSchema
}
