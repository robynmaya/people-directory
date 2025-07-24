/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import React, { useState, useEffect } from 'react'
import { GetStaticPropsResult } from 'next'
import { useRouter } from 'next/router'
import { PersonRecord, DepartmentNode, DepartmentTree, Department } from 'types'
import BaseLayout from '../../layouts/base'
import { getAllPeople, getAllDepartments } from 'lib/database'

import {
	filterPeople,
	findDepartments,
	departmentRecordsToDepartmentTree,
	findChildrenDepartments,
	findDepartmentByName,
} from '../../utilities'

import Profile from 'components/profile'
import Search from 'components/search'
import DepartmentFilter from 'components/departmentFilter'

interface Props {
	allPeople: PersonRecord[]
	departmentTree: DepartmentTree
}

export async function getStaticProps(): Promise<GetStaticPropsResult<Props>> {
	// Sr. candidate TODO: Load data from DB ✅

	const data = {
		allPeople: getAllPeople(),
		allDepartments: getAllDepartments(),
	}

	return {
		props: {
			allPeople: data.allPeople,
			departmentTree: departmentRecordsToDepartmentTree(data.allDepartments),
		},
	}
}

export default function PeoplePage({
	allPeople,
	departmentTree,
}: Props): React.ReactElement {
	const router = useRouter()
	const [searchingName, setSearchingName] = useState('')
	const [hideNoPicture, setHideNoPicture] = useState(false)
	const [filteredDepartments, setFilteredDepartments] = useState([]) //  hierarchical path, last is selected dept

	// Initialize state from URL on page load in case bookmarked
	// As per requirement, avatar is not in URL
	useEffect(() => {
		if (!router.isReady) {
			return
		}
		const { search, department } = router.query

		// Set initial state from URL query
		if (search) {
			setSearchingName(search as string)
		}
		if (department) {
			// Department query param is always a single string because selection only allows 1 department
			// findDepartments gives the full hierarchical path from root to selected department
			// Returns array where index represents tree depth: [root, level2, level3, ...]
			// e.g., ["Engineering", "Backend", "API Team"] for nested selection
			const foundDepartment = findDepartmentByName(
				departmentTree,
				department as string
			)
			if (foundDepartment) {
				const departmentPath = findDepartments(
					departmentTree,
					foundDepartment.id
				)
				setFilteredDepartments(departmentPath)
			}
		}
	}, [router.isReady, router.query])

	// TODO - Separate useEffect to debounce:
	// Fetch new search result when any of searchingName, hideNoPicture, filteredDepartments states change
	// Update URL

	const peopleFiltered = filterPeople(
		allPeople,
		searchingName,
		hideNoPicture,
		findChildrenDepartments(
			departmentTree,
			filteredDepartments[filteredDepartments.length - 1]?.id || []
		)
	)

	const filteredDepartmentIds = filteredDepartments.reduce(
		(acc: string[], department: DepartmentNode) => [...acc, department.id],
		[]
	)

	// Sr. candidate TODO: Update URL based on search and department filters

	return (
		<main className="g-grid-container">
			<div>
				<div>
					<h1>HashiCorp Humans</h1>
					<span>Find a HashiCorp human</span>
				</div>
				<Search
					onInputChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						setSearchingName(e.target.value)
						/**
						 * Sr. candidate TODO: Hit the API to search for people
						 * You can use the following URL to hit the API
						 * /api/hashicorp?search=...
						 */
					}}
					onProfileChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setHideNoPicture(e.target.checked)
					}
				/>
			</div>
			<div>
				<aside>
					<DepartmentFilter
						filteredDepartmentIds={filteredDepartmentIds}
						clearFiltersHandler={() => {
							setFilteredDepartments([])
						}}
						selectFilterHandler={(departmentFilter: Department) => {
							const totalDepartmentFilter = findDepartments(
								departmentTree,
								departmentFilter.id
							)
							setFilteredDepartments(totalDepartmentFilter)
						}}
						departmentTree={departmentTree}
					/>
				</aside>
				<ul>
					{peopleFiltered.length === 0 && (
						<div>
							<span>No results found.</span>
						</div>
					)}
					{peopleFiltered.map((person: PersonRecord) => {
						return (
							<li key={person.id}>
								<Profile
									imgUrl={person.avatar?.url}
									name={person.name}
									title={person.title}
									department={person.department?.name}
								/>
							</li>
						)
					})}
				</ul>
			</div>
		</main>
	)
}

PeoplePage.layout = BaseLayout
