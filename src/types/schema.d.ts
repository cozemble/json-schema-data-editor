declare interface JSONSchema {
	// Core
	$schema?: string;
	$id?: string;
	$ref?: string;
	$defs?: Record<string, JSONSchema>;
	$comment?: string;
	$vocabulary?: Record<string, boolean>;
	$dynamicRef?: string;
	$dynamicAnchor?: string;
	$anchor?: string;
	//

	// Applicator
	allOf?: JSONSchema[];
	anyOf?: JSONSchema[];
	oneOf?: JSONSchema[];
	then?: JSONSchema;
	if?: JSONSchema;
	else?: JSONSchema;
	not?: JSONSchema;
	properties?: Record<string, JSONSchema>;
	additionalProperties?: JSONSchema;
	patternProperties?: Record<string, JSONSchema>;
	dependentSchemas?: Record<string, JSONSchema>;
	propertyNames?: JSONSchema;
	items?: JSONSchema;
	prefixItems?: JSONSchema[];
	contains?: JSONSchema;
	//

	// Validation
	type?: 'string' | 'number' | 'object' | 'array' | 'boolean' | 'null';
	enum?: any[];
	const?: any;
	pattern?: string;
	minLength?: number;
	maxLength?: number;
	exclusiveMaximum?: number;
	multipleOf?: number;
	exclusiveMinimum?: number;
	maximum?: number;
	minimum?: number;
	dependentRequired?: Record<string, string[]>;
	maxProperties?: number;
	minProperties?: number;
	required?: string[];
	maxItems?: number;
	minItems?: number;
	maxContains?: number;
	minContains?: number;
	uniqueItems?: boolean;
	//

	// Meta-Data
	title?: string;
	description?: string;
	default?: any;
	writeOnly?: boolean;
	readOnly?: boolean;
	examples?: any[];
	deprecated?: boolean;
	//

	// Format
	format?: string;
	//

	// Unevaluated
	unevaluatedProperties?: JSONSchema;
	unevaluatedItems?: JSONSchema;
	//

	// Content
	contentSchema?: JSONSchema;
	contentMediaType?: string;
	contentEncoding?: string;
	//
}
