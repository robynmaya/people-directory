/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { describe, test, expect } from '@jest/globals'
import {
	findDepartments,
	findChildrenDepartments,
	buildChildren,
	findDepartmentByName,
} from '../utilities/index'
import { DepartmentTree, DepartmentNode } from 'types'

describe('buildChildren', () => {
	test('should return an empty object when given an empty list', () => {
		const result = buildChildren([])
		expect(result).toEqual({})
	})

	test('should build a record with children empty arrays for each department', () => {
		const departments: DepartmentNode[] = [
			{ id: '1', name: 'Engineering', parent: null },
			{ id: '2', name: 'Marketing', parent: null },
		]

		const result = buildChildren(departments)

		expect(result).toEqual({
			'1': { children: [], id: '1', name: 'Engineering', parent: null },
			'2': { children: [], id: '2', name: 'Marketing', parent: null },
		})
	})
})

describe('findDepartments', () => {
	const departmentTree: DepartmentTree = [
		{
			id: '1',
			name: 'Engineering',
			parent: null,
			children: [
				{
					id: '2',
					name: 'Software',
					children: [],
					parent: null,
				},
				{
					id: '3',
					name: 'Hardware',
					children: [],
					parent: null,
				},
			],
		},
		{
			id: '4',
			name: 'Marketing',
			children: [],
			parent: null,
		},
	]

	test('should find the department by id', () => {
		const result = findDepartments(departmentTree, '2')
		expect(result).toEqual([
			{ id: '1', name: 'Engineering' },
			{ id: '2', name: 'Software' },
		])
	})

	test('should return an empty array if the department is not found', () => {
		const result = findDepartments(departmentTree, '5')
		expect(result).toEqual([])
	})

	test('should find the department and its parents', () => {
		const result = findDepartments(departmentTree, '3')
		expect(result).toEqual([
			{ id: '1', name: 'Engineering' },
			{ id: '3', name: 'Hardware' },
		])
	})

	test('should return the root department if it matches the id', () => {
		const result = findDepartments(departmentTree, '1')
		expect(result).toEqual([{ id: '1', name: 'Engineering' }])
	})

	test('should handle an empty department tree', () => {
		const result = findDepartments([], '1')
		expect(result).toEqual([])
	})
})

describe('findChildrenDepartments', () => {
	const departmentTree: DepartmentTree = [
		{
			id: '1',
			name: 'Engineering',
			parent: null,
			children: [
				{
					id: '2',
					name: 'Software',
					parent: { id: '1', name: 'Engineering' },
					children: [
						{
							id: '5',
							name: 'Frontend',
							parent: { id: '2', name: 'Software' },
							children: [],
						},
						{
							id: '6',
							name: 'Backend',
							parent: { id: '2', name: 'Software' },
							children: [],
						},
					],
				},
				{
					id: '3',
					name: 'Hardware',
					parent: { id: '1', name: 'Engineering' },
					children: [],
				},
			],
		},
		{
			id: '4',
			name: 'Marketing',
			parent: null,
			children: [],
		},
	]

	test('should find the department and its children by id', () => {
		const result = findChildrenDepartments(departmentTree, '2')
		expect(result).toEqual([
			{ id: '2', name: 'Software' },
			{ id: '5', name: 'Frontend' },
			{ id: '6', name: 'Backend' },
		])
	})

	test('should return an empty array if the department is not found', () => {
		const result = findChildrenDepartments(departmentTree, '7')
		expect(result).toEqual([])
	})

	test('should find the department and all its descendants', () => {
		const result = findChildrenDepartments(departmentTree, '1')
		expect(result).toEqual([
			{ id: '1', name: 'Engineering' },
			{ id: '2', name: 'Software' },
			{ id: '5', name: 'Frontend' },
			{ id: '6', name: 'Backend' },
			{ id: '3', name: 'Hardware' },
		])
	})

	test('should return the root department if it matches the id', () => {
		const result = findChildrenDepartments(departmentTree, '4')
		expect(result).toEqual([{ id: '4', name: 'Marketing' }])
	})

	test('should handle an empty department tree', () => {
		const result = findChildrenDepartments([], '1')
		expect(result).toEqual([])
	})
})

describe('findDepartmentByName', () => {
	const departmentTree: DepartmentTree = [
		{
			id: '1',
			name: 'Engineering',
			parent: null,
			children: [
				{
					id: '2',
					name: 'Software',
					parent: { id: '1', name: 'Engineering' },
					children: [
						{
							id: '5',
							name: 'Frontend',
							parent: { id: '2', name: 'Software' },
							children: [],
						},
						{
							id: '6',
							name: 'Backend',
							parent: { id: '2', name: 'Software' },
							children: [],
						},
					],
				},
				{
					id: '3',
					name: 'Hardware',
					parent: { id: '1', name: 'Engineering' },
					children: [],
				},
			],
		},
		{
			id: '4',
			name: 'Marketing',
			parent: null,
			children: [],
		},
	]

	test('should find department by exact name match', () => {
		const result = findDepartmentByName(departmentTree, 'Engineering')
		expect(result).toEqual({ id: '1', name: 'Engineering' })
	})

	test('should find department by name case-insensitive', () => {
		const result = findDepartmentByName(departmentTree, 'engineering')
		expect(result).toEqual({ id: '1', name: 'Engineering' })
	})

	test('should find department by name with different case', () => {
		const result = findDepartmentByName(departmentTree, 'MARKETING')
		expect(result).toEqual({ id: '4', name: 'Marketing' })
	})

	test('should find nested department by name', () => {
		const result = findDepartmentByName(departmentTree, 'Software')
		expect(result).toEqual({ id: '2', name: 'Software' })
	})

	test('should find deeply nested department by name', () => {
		const result = findDepartmentByName(departmentTree, 'Frontend')
		expect(result).toEqual({ id: '5', name: 'Frontend' })
	})

	test('should return null if department is not found', () => {
		const result = findDepartmentByName(departmentTree, 'NonExistent')
		expect(result).toBeNull()
	})

	test('should handle empty department tree', () => {
		const result = findDepartmentByName([], 'Engineering')
		expect(result).toBeNull()
	})

	test('should handle partial name matches correctly', () => {
		// Should not match partial names
		const result = findDepartmentByName(departmentTree, 'Engine')
		expect(result).toBeNull()
	})
})
