/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { PersonRecord } from 'types'
import { searchPeople, getAllPeople } from '../../lib/database'

type ResponseData = {
	results: PersonRecord[]
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<ResponseData>
) {
	try {
		const { query } = req // apiParams
		const searchedNameParam = (query.search as string) || ''
		const departmentIdsParam = (query.departmentIds as string) || ''
		const avatarParam = (query.avatar as string) || ''

		// Sr. candidate TODO: Perform DB query and return the result ✅

		// Get people based on search term
		let results: PersonRecord[]
		if (searchedNameParam) {
			results = searchPeople(searchedNameParam)
		} else {
			// No name searched, get all people (for department-only filtering)
			results = getAllPeople()
		}

		if (avatarParam === 'required') {
			results = results.filter((person) => person.avatar?.url)
		}

		// Show matched people in selected department AND all its sub-departments
		if (departmentIdsParam) {
			const allowedDepartmentIds = departmentIdsParam.split(',')
			results = results.filter((person) =>
				allowedDepartmentIds.includes(person.department?.id || '')
			)
		}
		res.status(200).json({ results })
	} catch (error) {
		console.error('API Error:', error)
		res.status(500).json({ results: [] })
	}
}
