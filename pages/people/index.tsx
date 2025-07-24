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
	const [peopleResults, setPeopleResults] = useState<PersonRecord[] | null>(
		null
	)
	const [searchingName, setSearchingName] = useState('')
	const [hideNoPicture, setHideNoPicture] = useState(false)
	const [filteredDepartments, setFilteredDepartments] = useState([]) //  hierarchical path, last is selected dept
	const [isInitialized, setIsInitialized] = useState(false)

	// Initialize state from URL on page load in case bookmarked
	useEffect(() => {
		if (!router.isReady) {
			return
		}
		const { search, department, hasImage } = router.query
		const hasAnyFilters = search || department || hasImage

		// If no URL filters, show all people immediately
		if (!hasAnyFilters) {
			setPeopleResults(allPeople)
		}

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
		if (hasImage === 'required') {
			setHideNoPicture(true)
		}

		setIsInitialized(true)
	}, [router.isReady, router.query])

	useEffect(() => {
		if (!router.isReady || !isInitialized) {
			return
		}

		// If no filters at all, show all people from getStaticProps
		if (!searchingName && filteredDepartments.length === 0 && !hideNoPicture) {
			setPeopleResults(allPeople)
			// Update URL to clear any previous params
			router.replace('/people', undefined, { shallow: true })
			return
		}

		// Function to fetch and update people via API when filtering
		const fetchPeople = async () => {
			/* Flow:
			 * 1. Build params with URL-friendly parameters (search, hasImage, department name)
			 * 2. Update URL first with clean user-facing parameters
			 * 3. Then add API-specific departmentIds to same params instance
			 * 4. Pass the combined params in the API call
			 */
			const params = new URLSearchParams()

			if (searchingName) {
				params.set('search', searchingName)
			}

			if (hideNoPicture) {
				params.set('hasImage', 'required')
			}

			if (filteredDepartments.length > 0) {
				const selectedDept = filteredDepartments.at(-1)
				params.set('department', selectedDept.name)
			}

			// Sr. candidate TODO: Update URL based on search and department filters ✅
			// URL shows search, department, hasImage
			const urlPath = `/people?${params}`
			router.replace(urlPath, undefined, { shallow: true })

			if (filteredDepartments.length > 0) {
				const selectedDept = filteredDepartments.at(-1)
				// Contains the selected department AND all its downward children/descendants
				// This is for inclusive filtering - show people from the selected dept AND all teams under it
				const childDepartments = findChildrenDepartments(
					departmentTree,
					selectedDept.id
				)
				const departmentIds = childDepartments.map((dept) => dept.id).join(',')
				params.set('departmentIds', departmentIds)
			}

			try {
				const response = await fetch(`/api/hashicorp?${params}`) // send combined params, but API doesn't need dept, only dept ids
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
	}, [
		// filteredDepartments is an array and compared by reference, effect should depend on the actual selected department string
		filteredDepartments.length > 0 ? filteredDepartments.at(-1)?.id : null,
		searchingName,
		router.isReady,
		allPeople,
		hideNoPicture,
		isInitialized,
	])

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
					hideNoPicture={hideNoPicture}
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
							// Full hierarchical path from root down to selected department for breadcrumb
							// eg select QA, gives array: [RootDept, ParentDept, QA]
							setFilteredDepartments(
								findDepartments(departmentTree, departmentFilter.id)
							)
						}}
						departmentTree={departmentTree}
					/>
				</aside>
				<ul>
					{peopleResults !== null && peopleResults.length === 0 ? (
						<div>
							<span>No results found.</span>
						</div>
					) : (
						peopleResults?.map((person: PersonRecord) => {
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
						})
					)}
				</ul>
			</div>
		</main>
	)
}

PeoplePage.layout = BaseLayout
