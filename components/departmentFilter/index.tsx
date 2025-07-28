/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { useState } from 'react'
import s from './style.module.css'
import Image from 'next/image'

import xIcon from './img/xIcon.svg'
import { Department, DepartmentRecord, DepartmentTree } from 'types'

export interface DepartmentFilterProps {
	filteredDepartmentIds: string[]
	clearFiltersHandler: () => void
	selectFilterHandler: ({ id, name }: Department) => void
	departmentTree: DepartmentTree
}

export default function DepartmentFilter({
	filteredDepartmentIds,
	clearFiltersHandler,
	selectFilterHandler,
	departmentTree,
}: DepartmentFilterProps): React.ReactElement {
	return (
		<div className={s.container}>
			<h2 className={s.title}>Filter By Department</h2>
			<button
				className={`${s.clearFilterButton} ${
					filteredDepartmentIds.length === 0 ? s.notVisible : ''
				}`}
				type="button"
				onClick={clearFiltersHandler}
			>
				<Image
					priority
					width={12}
					height={12}
					src={xIcon}
					alt="Clear filters"
					className={s.searchIcon}
				/>
				Clear Filters
			</button>
			<div className={s.departmentFilterTreeContainer}>
				<DepartmentFilterTree
					departmentTree={departmentTree}
					filteredDepartmentIds={filteredDepartmentIds}
					selectFilterHandler={selectFilterHandler}
				/>
			</div>
		</div>
	)
}

export interface DepartmentTreeProps {
	departmentTree: DepartmentTree
	filteredDepartmentIds: string[]
	selectFilterHandler: ({ id, name }: Department) => void
}

const DepartmentFilterTree = ({
	departmentTree,
	filteredDepartmentIds,
	selectFilterHandler,
}: DepartmentTreeProps) => {
	const [departmentChildrenOpen, setDepartmentChildrenOpen] = useState(
		departmentTree.reduce(
			(acc: Record<string, boolean>, department: DepartmentRecord) => {
				if (department.children.length > 0) {
					acc[department.id] = false
				}

				return acc
			},
			{}
		)
	)

	return (
		<ul
			className={s.departmentFilterTreeList}
			role="tree"
			aria-label="Department filter tree"
		>
			{departmentTree.map((department: DepartmentRecord) => {
				const isSelected = filteredDepartmentIds.includes(department.id)

				return (
					<li
						key={department.id}
						className={s.departmentItem}
						role="treeitem"
						aria-expanded={
							department.children.length > 0
								? departmentChildrenOpen[department.id]
								: undefined
						}
					>
						<div className={s.departmentRow}>
							{department.children.length > 0 && (
								<button
									aria-expanded={departmentChildrenOpen[department.id]}
									aria-label={`${
										departmentChildrenOpen[department.id]
											? 'Collapse'
											: 'Expand'
									} ${department.name} subdepartments`}
									className={`${s.departmentFilterTreeToggleCaret} ${
										departmentChildrenOpen[department.id] ? s.caretIconOpen : ''
									}`}
									onClick={() => {
										setDepartmentChildrenOpen({
											...departmentChildrenOpen,
											[department.id]: !departmentChildrenOpen[department.id],
										})
									}}
								/>
							)}
							<button
								onClick={() => {
									selectFilterHandler({
										id: department.id,
										name: department.name,
									})
								}}
								aria-pressed={isSelected}
								aria-label={`${
									isSelected ? 'Remove filter for' : 'Filter by'
								} ${department.name} department`}
								className={s.departmentFilterTreeText}
							>
								{department.name}
							</button>
						</div>

						{departmentChildrenOpen[department.id] && (
							<div className={s.notRoot}>
								{department.children && (
									<DepartmentFilterTree
										departmentTree={department.children}
										filteredDepartmentIds={filteredDepartmentIds}
										selectFilterHandler={selectFilterHandler}
									/>
								)}
							</div>
						)}
					</li>
				)
			})}
		</ul>
	)
}
