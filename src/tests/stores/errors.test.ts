import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'

import { errors, resetErrors, addErrors } from '../../lib/stores/errors'

const mockErrors = {
	required: {
		instancePath: '',
		schemaPath: '#/required',
		keyword: 'required',
		params: {
			missingProperty: 'invoiceNumber'
		},
		message: "must have required property 'invoiceNumber'"
	},
	type: {
		instancePath: '/customers/0/addresses',
		schemaPath: '#/properties/customers/items/properties/addresses/type',
		keyword: 'type',
		params: {
			type: 'array'
		},
		message: 'must be array'
	},
	unique: {
		instancePath: '/customers',
		schemaPath: '#/properties/customers/uniqueItems',
		keyword: 'uniqueItems',
		params: {
			i: 1,
			j: 0
		},
		message: 'must NOT have duplicate items (items ## 0 and 1 are identical)'
	},
	arrayMinItems: {
		instancePath: '/customers',
		schemaPath: '#/properties/customers/minItems',
		keyword: 'minItems',
		params: {
			limit: 2
		},
		message: 'must NOT have fewer than 2 items'
	},
	pattern: {
		instancePath: '/customers/0/email',
		schemaPath: '#/properties/customers/items/properties/email/pattern',
		keyword: 'pattern',
		params: {
			pattern: '^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$'
		},
		message: 'must match pattern "^\\w+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$"'
	}
}

describe('ERRORS STORE', () => {
	it('should initialize with an empty array', () => {
		resetErrors()

		expect(get(errors)).toEqual([])
	})

	it('should update the store with an array of errors', () => {
		resetErrors()

		addErrors([mockErrors.required, mockErrors.type])

		expect(get(errors).length).toBe(2)
	})

	it('should convert paths properly', () => {
		resetErrors()

		addErrors([
			mockErrors.type,
			mockErrors.arrayMinItems,
			mockErrors.pattern,
			mockErrors.unique,
			mockErrors.required
		])

		// simple ones:
		expect(get(errors)[0].path).to.equal('customers.0.addresses', 'type error')
		expect(get(errors)[1].path).to.equal('customers', 'arrayMinItems error')
		expect(get(errors)[2].path).to.equal('customers.0.email', 'pattern error')

		// complicated ones:
		expect(get(errors)[3].path).to.equal('customers.1', 'uniqueness error')
		expect(get(errors)[4].path).to.equal('invoiceNumber', 'required error')
	})
})
