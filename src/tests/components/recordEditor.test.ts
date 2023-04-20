import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'

import RecordEditor from '../../lib/components/RecordEditor.svelte'

// * Features expected to be implemented:

// *1- Create any form from a JSON schema
// 	 a- Render inputs for simple types
// 	 b- Render inputs for objects with nested properties
// 	 c- Render inputs for arrays
//   d- Allow for custom input components
//   e- All the above should be possible to nest at any level

// *2- Handle formula fields (fields that are calculated from other fields)
//   a- as a simple type
//   b- as a simple type in an object that is an array item and the formula needs a value from this array item
//   c- ? as an object type
//   d- ? as an array type

// *3- Accept a record to populate the form for editing

// *4- Allow the user undo & redo changes

// *5- Do validation on the form
// 	 a- Validate the form on submit
// 	 b- Validate the form on input change after submit for invalid fields
//   c- Get validation from onSubmit function given to the component
//   d- Display validation errors on the inputs

// *6- Accept a callback when the form is submitted

// *7- Accept a callback when the form is cancelled

//

const mockModel: CozJSONSchema = {
	type: 'object',
	title: 'Adult Person',
	properties: {
		// * simple type field
		name: {
			type: 'string',
			title: 'Name'
		},
		// * custom component field for simple type
		dateOfBirth: {
			type: 'string',
			title: 'Date of birth'
			// TODO add a custom component
		},
		// * formula field as a simple type
		age: {
			type: 'number',
			title: 'Age',
			coz: {
				formula: {
					deps: ['dateOfBirth'],
					exec: async (record) => {
						const dob = new Date(record.dateOfBirth)
						const now = new Date()
						return now.getFullYear() - dob.getFullYear()
					}
				}
			}
		},
		// * object type field
		parents: {
			type: 'object',
			title: 'Parents',
			properties: {
				mother: {
					type: 'string',
					title: 'Mother'
				},
				father: {
					type: 'string',
					title: 'Father'
				}
			}
		},
		// * array type field
		children: {
			type: 'array',
			title: 'Children',
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						title: 'Name'
					},
					dayOfBirth: {
						type: 'string',
						title: 'Date of birth'
					},
					// * formula field as a simple type in an object that is an array item and the formula needs a value from this array item
					age: {
						type: 'number',
						title: 'Age',
						coz: {
							formula: {
								deps: ['children'],
								exec: async (record, path) => {
									const dob = new Date(record.children[path[1]].dayOfBirth)
									const now = new Date()
									return now.getFullYear() - dob.getFullYear()
								}
							}
						}
					}
				}
			}
		}

		// ? TODO formula field as an object type
		// ? TODO formula field as an array type

		// TODO custom component field for object type
		// TODO custom component field for object type but looks like a simple type
		// TODO custom component field for array type
		// TODO custom component field for array type but looks like a simple type
	}
}

const record = {
	name: 'John Doe',
	dateOfBirth: '1990-01-01',
	age: 30,
	parents: {
		mother: 'Jane Doe',
		father: 'John Doe'
	},
	children: [
		{
			name: 'Jane Doe',
			dayOfBirth: '2010-01-01',
			age: 10
		},
		{
			name: 'John Doe',
			dayOfBirth: '2012-01-01',
			age: 8
		}
	]
}

const onSubmitSuccess: RecordSubmitFunction = async (record) => ({
	success: true,
	message: 'Record saved successfully'
})

const onSubmitError: RecordSubmitFunction = async (record) => ({
	success: false,
	message: 'Record could not be saved'
})

const onSubmitErrorWithErrors: RecordSubmitFunction = async (record) => ({
	success: false,
	message: 'Record could not be saved',
	errors: [
		{
			instancePath: '',
			schemaPath: '#/required',
			keyword: 'required',
			params: { missingProperty: 'name' },
			message: "must have required property 'name'"
		}
	]
})

const onCancel = () => console.log('cancelled')

// TODO create a mock record for the model

describe('RECORD EDITOR', () => {
	// TODO test that the form renders correctly
	// TODO test that the form handles custom input components correctly
	describe('# RENDERING', () => {
		it('should render an empty form for the given model', () => {
			render(RecordEditor, { model: mockModel, onSubmit: onSubmitSuccess, onCancel })
			expect(screen.getByText('Name')).to.exist
			expect(screen.getByText('Date of birth')).to.exist
			expect(screen.getByText('Age')).to.exist
			expect(screen.getByText('Parents')).to.exist
			expect(screen.getByText('Children')).to.exist
		})
	})

	// TODO test that the form handles formula fields correctly
	// describe('# FORMULA FIELDS', () => {
	// })
	// TODO test that the form allows undo / redo
	// describe('# UNDO / REDO', () => {
	// })
	// TODO test that the form validates and displays errors correctly
	// describe('# VALIDATION', () => {
	// })
	// TODO test that the form submits correctly
	// describe('# SUBMISSION', () => {
	// })
})
