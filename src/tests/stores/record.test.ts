import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'

import {
	record,
	editValue,
	history,
	historyIndex,
	undo,
	redo,
	validate,
	handleSubmit
} from '../../lib/stores/record'
import { modelStore } from '../../lib/stores/model'
import { errors } from '../../lib/stores/errors'

const mockModel: CozJSONSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string'
		},
		age: {
			type: 'number',
			minimum: 18,
			maximum: 99
		},
		family: {
			type: 'object',
			properties: {
				father: {
					type: 'string'
				},
				mother: {
					type: 'string'
				},
				children: {
					type: 'array',
					items: {
						type: 'string'
					},
					minItems: 1,
					maxItems: 3
				}
			}
		}
	},
	required: ['name', 'age', 'family']
}

const mockRecord = {
	name: 'John Doe',
	age: 42,
	family: {
		father: 'John Doe Sr.',
		mother: 'Jane Doe',
		children: ['John Doe Jr.', 'Jane Doe Jr.']
	}
}

const mockSubmitSuccessful: RecordSubmitFunction = async (record) => {
	return {
		success: true,
		message: 'Record saved successfully'
	}
}

const mockSubmitFailed: RecordSubmitFunction = async (record) => {
	return {
		success: false,
		message: 'Record failed to save'
	}
}

const mockSubmitFailedWithErrors: RecordSubmitFunction = async (record) => {
	return {
		success: false,
		message: 'Record failed to save',
		errors: [
			{
				instancePath: '',
				schemaPath: '#/required',
				keyword: 'required',
				params: { missingProperty: 'name' },
				message: "must have required property 'name'"
			}
		]
	}
}

const reset = () => {
	modelStore.set(mockModel)
	history.set([])
	historyIndex.set(0)
	record.set(mockRecord)
}

describe('RECORD STORE', () => {
	describe('# EDIT VALUE', () => {
		it('should be writable', () => {
			record.set(mockRecord)
			expect(record).toBeTruthy()
		})

		it('should be possible to get a value', () => {
			record.set(mockRecord)
			expect(get(record).name).toBe('John Doe')
		})

		it('should be possible to edit a value', () => {
			record.set(mockRecord)
			editValue('name', 'Jane Doe')
			expect(get(record).name).toBe('Jane Doe')
		})

		it('should be possible to edit a nested value', () => {
			record.set(mockRecord)
			editValue('family.father', 'Brad Doe Sr.')
			expect(get(record)?.family?.father).toBe('Brad Doe Sr.')
		})

		it('should be possible to edit a nested value in an array', () => {
			record.set(mockRecord)
			editValue(['family', 'children', 0], 'Brad Doe Jr.')
			expect(get(record)?.family?.children[0]).toBe('Brad Doe Jr.')
		})

		it('should be possible to edit a nested value in an array with a simple path', () => {
			record.set(mockRecord)
			editValue('family.children.0', 'Brad Doe Jr.')
			expect(get(record)?.family?.children[0]).toBe('Brad Doe Jr.')
		})

		it('should be possible to edit a nested object', () => {
			record.set(mockRecord)
			editValue('family', {
				father: 'Brad Doe Sr.',
				mother: 'Jane Doe',
				children: ['Brad Doe Jr.', 'Jane Doe Jr.']
			})
			expect(get(record)?.family?.father).toBe('Brad Doe Sr.')
		})
	})

	describe('# HISTORY', () => {
		describe('- SHOULD KEEP HISTORY', () => {
			it('should initialize a history store and index store correctly', () => {
				reset()

				expect(history).toBeTruthy()
				expect(historyIndex).toBeTruthy()
				expect(get(history).length).to.equal(0, 'should have no history entries')
				expect(get(historyIndex)).to.equal(0, 'should have an index of 0')
			})

			it('should update the last entry in the history store and not create new entry when a value is edited in less than a second ago', async () => {
				reset()

				editValue('name', 'Mike Doe')

				await new Promise<void>((resolve) =>
					setTimeout(() => {
						editValue('name', 'James Doe')
						resolve()
					}, 500)
				)
				expect(get(history).length).to.equal(1, 'should have one history entry')
				expect(get(history)[0].current).to.equal('James Doe', 'should have the last value')
				expect(get(history)[0].path).to.equal('name', 'should have the last edit path')
				expect(get(history)[0].previous).to.equal(
					mockRecord.name,
					'previous value should be the initial value'
				)
			})

			it('should create a new history entry on value edit if the previous edit for the value was over 1 second ago', async () => {
				reset()

				record.set(mockRecord)
				editValue('name', 'Mike Doe')

				await new Promise<void>((resolve) =>
					setTimeout(() => {
						editValue('name', 'James Doe')
						resolve()
					}, 1100)
				)

				expect(get(history).length).to.equal(2, 'should have two history entries')
				expect(get(history)[0].current).to.equal('Mike Doe', 'should have the first value')
				expect(get(history)[1].current).to.equal('James Doe', 'should have the last value')
			})

			it("should create new history with 1 second intervals even if no value edit gap hasn't exceeded 1 second", async () => {
				reset()

				const mockValues = ['Mike Doe', 'James Doe', 'Jack Doe']

				editValue('name', mockValues[0])

				setTimeout(() => {
					editValue('name', mockValues[1])
				}, 500)

				await new Promise<void>((resolve) =>
					setTimeout(() => {
						editValue('name', mockValues[2])
						resolve()
					}, 1100)
				)

				const log = get(history)
				expect(log.length).to.equal(2, 'should have two history entries')
				expect(log[0].current).to.equal(mockValues[1], '1st log should have the 1st value')
				expect(log[1].current).to.equal(mockValues[2], '2nd log should have the last value')
			})

			it('should create a new history entry on edit of a different value then the previous edit', () => {
				reset()

				record.set(mockRecord)
				editValue('name', 'Mike Doe')
				editValue('age', 43)

				const logs = get(history)
				expect(logs.length).to.equal(2, 'should have two history entries')
				expect(logs[0].path).to.equal('name', 'should have the first edit path')
				expect(logs[1].path).to.equal('age', 'should have the last edit path')
				expect(logs[0].current).to.equal('Mike Doe', 'should have the first value')
				expect(logs[1].current).to.equal(43, 'should have the last value')
			})
		})

		describe('- SHOULD UNDO & REDO', () => {
			it('should not undo if no history', () => {
				reset()

				undo()

				expect(get(record)).to.equal(mockRecord, 'should not have undone anything')
			})

			it('should not redo if no history', () => {
				reset()

				redo()

				expect(get(record)).to.equal(mockRecord, 'should not have redone anything')
			})

			it('should undo the last edit', () => {
				reset()

				editValue('name', 'Mike Doe')
				editValue('age', 43)

				expect(get(historyIndex)).to.equal(1, 'should have an index of 1')

				undo()

				expect(get(record).name).to.equal(
					'Mike Doe',
					'no undo should have been done with the first edit'
				)
				expect(get(record).age).to.equal(mockRecord.age, 'should have undone the last edit')
			})

			it('should undo if the same property is edited multiple times', async () => {
				reset()

				editValue('name', 'Mike Doe')

				await new Promise<void>((resolve) =>
					setTimeout(() => {
						editValue('name', 'James Doe')
						resolve()
					}, 1100)
				)

				expect(get(history)[1].current).to.equal('James Doe', 'should have the last value')

				undo()

				expect(get(record).name).to.equal('Mike Doe', 'should have undone the last edit')
			})

			it('should redo the last undo', () => {
				reset()

				editValue('name', 'Mike Doe')
				editValue('age', 43)

				undo()

				expect(get(record).age).to.equal(
					mockRecord.age,
					'should have undone the last edit before redo'
				)

				redo()

				expect(get(record).name).to.equal(
					'Mike Doe',
					'no undo should have been done with the first edit'
				)
				expect(get(record).age).to.equal(43, 'should have redone the last edit')
			})

			it('should undo multiple edits', () => {
				reset()

				editValue('name', 'Mike Doe')
				editValue('age', 43)
				editValue('family.father', 'Brad Doe Sr.')

				undo()
				undo()

				expect(get(record).name).to.equal(
					'Mike Doe',
					'no undo should have been done with the first edit'
				)
				expect(get(record).age).to.equal(mockRecord.age, 'should have undone the second edit')
				expect(get(record)?.family?.father).to.equal(
					mockRecord.family.father,
					'should have undone the last edit'
				)
			})

			it('should redo multiple edits', () => {
				reset()

				editValue('name', 'Mike Doe')
				editValue('age', 43)
				editValue('family.father', 'Brad Doe Sr.')

				undo()
				undo()

				expect(get(record).age).to.equal(
					mockRecord.age,
					'should have undone the second edit before redo'
				)
				expect(get(record)?.family?.father).to.equal(
					mockRecord.family.father,
					'should have undone the last edit before redo'
				)

				redo()
				redo()

				expect(get(record).name).to.equal(
					'Mike Doe',
					'no undo should have been done with the first edit'
				)
				expect(get(record).age).to.equal(43, 'should have redone the second edit')
				expect(get(record)?.family?.father).to.equal(
					'Brad Doe Sr.',
					'should have redone the last edit'
				)
			})

			it('should cut off undone history after edit if undo was called', () => {
				reset()

				editValue('name', 'Mike Doe')
				editValue('age', 43)
				editValue('family.father', 'Brad Doe Sr.')

				undo()
				undo()
				editValue('family.mother', 'July Doe')

				expect(get(history).length).to.equal(2, 'should have removed 2 history entries and added 1')

				expect(get(history)[0].current).to.equal('Mike Doe', 'should be the first edit')
				expect(get(history)[1].current).to.equal(
					'July Doe',
					'should be the last edit after undo actions'
				)
			})
		})
	})

	describe('# SUBMIT', () => {
		it('should not validate invalid record', () => {
			reset()

			editValue('name', undefined)

			const isValid = validate()
			expect(isValid).to.equal(false, 'should not be valid')
			expect(get(errors).length).to.equal(1, 'should have 1 error')
		})

		it('should validate valid record', () => {
			reset()

			const isValid = validate()
			expect(isValid).to.equal(true, 'should be valid')
			expect(get(errors).length).to.equal(0, 'should have 0 errors')
		})

		it('should not submit invalid record', async () => {
			reset()

			editValue('name', undefined)

			const submitSuccess = await handleSubmit(mockSubmitSuccessful)

			expect(submitSuccess).to.equal(false, 'should return false')
			expect(get(errors).length).to.equal(1, 'should have 1 error')
		})

		it('should submit valid record', async () => {
			reset()

			const submitSuccess = await handleSubmit(mockSubmitSuccessful)

			expect(submitSuccess).to.equal(true, 'should return true')
			expect(get(errors).length).to.equal(0, 'should have 0 errors')
		})

		it('should submit but if backend fails, should not be successful', async () => {
			reset()

			const submitSuccess = await handleSubmit(mockSubmitFailed)

			expect(submitSuccess).to.equal(false, 'should return false')
		})

		it('should save errors from backend', async () => {
			reset()

			const submitSuccess = await handleSubmit(mockSubmitFailedWithErrors)

			expect(submitSuccess).to.equal(false, 'should return false')
			expect(get(errors).length).to.equal(1, 'should have 1 error')
		})
	})
})
