import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { get } from 'svelte/store'

import { record, editValue } from '../../lib/stores/record'

const mockRecord = {
	name: 'John Doe',
	age: 42,
	family: {
		father: 'John Doe Sr.',
		mother: 'Jane Doe',
		children: ['John Doe Jr.', 'Jane Doe Jr.']
	}
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
})
