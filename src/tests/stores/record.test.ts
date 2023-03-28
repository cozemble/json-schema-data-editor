import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { get } from 'svelte/store'

import { record, editValue, history, historyIndex } from '../../lib/stores/record'

const mockRecord = {
	name: 'John Doe',
	age: 42,
	family: {
		father: 'John Doe Sr.',
		mother: 'Jane Doe',
		children: ['John Doe Jr.', 'Jane Doe Jr.']
	}
}

const reset = () => {
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
	})
})
