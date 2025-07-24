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
	const [peopleResults, setPeopleResults] = useState<PersonRecord[]>(allPeople)
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

	useEffect(() => {
		if (!router.isReady) {
			return
		}

		// If no search or department filters, show all people from getStaticProps
		if (!searchingName && filteredDepartments.length === 0) {
			setPeopleResults(allPeople)
			// Update URL to clear any previous params
			router.replace('/people', undefined, { shallow: true })
			return
		}

		// Function to fetch and update people via API when filtering
		const fetchPeople = async () => {
			// Build query params
			const queryParams = new URLSearchParams() // for URL (human-readable)
			const apiParams = new URLSearchParams()

			// Add same search params to both URL and API
			if (searchingName) {
				queryParams.set('search', searchingName)
				apiParams.set('search', searchingName)
			}

			// Add different department params to URL and API
			if (filteredDepartments.length > 0) {
				const selectedDept = filteredDepartments.at(-1)

				// URL gets human-readable department name
				queryParams.set('department', selectedDept.name)

				// API gets department hierarchy IDs for proper filtering
				const childDepartments = findChildrenDepartments(
					departmentTree,
					selectedDept.id
				)
				const departmentIds = childDepartments.map((dept) => dept.id).join(',')
				apiParams.set('departmentIds', departmentIds)
			}

			// Sr. candidate TODO: Update URL based on search and department filters ✅
			// Second param is optional route masking, no need
			// Shallow set to true to prevent full page reload
			router.replace(`/people?${queryParams}`, undefined, { shallow: true })

			try {
				const response = await fetch(`/api/hashicorp?${apiParams}`)
				const data = await response.json()
				setPeopleResults(data.results)
			} catch (error) {
				console.error('Failed to fetch people:', error)
				setPeopleResults([])
			}
		}

		// Debounce API calls for user input
		const timeoutId = setTimeout(fetchPeople, 500)
		return () => clearTimeout(timeoutId)
	}, [searchingName, filteredDepartments, router.isReady, allPeople])

	// Apply client-side avatar filter to API results
	const displayedPeople = hideNoPicture
		? peopleResults.filter((person) => person.avatar?.url)
		: peopleResults

	const filteredDepartmentIds = filteredDepartments.reduce(
		(acc: string[], department: DepartmentNode) => [...acc, department.id],
		[]
	)

	return (
		<main className="g-grid-container">
			<div>
				<div>
					<h1>HashiCorp Humans</h1>
					<span>Find a HashiCorp human</span>
				</div>
				<Search
					value={searchingName}
					onInputChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						setSearchingName(e.target.value)
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
					{displayedPeople.length === 0 && (
						<div>
							<span>No results found.</span>
						</div>
					)}
					{displayedPeople.map((person: PersonRecord) => {
						return (
							<li key={person.id}>
								<Profile
									imgUrl={person.avatar?.url}
									name={person.name}
									title={person.title || 'No title'}
									department={person.department?.name || 'No department'}
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
