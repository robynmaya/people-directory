/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { PersonRecord } from 'types'
import { searchPeople } from '../../lib/database'

type ResponseData = {
	results: PersonRecord[]
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<ResponseData>
) {
	try {
		const { query } = req
		const searchParam = (query.search as string) || ''
		const departmentParam = (query.department as string) || ''
		const avatarParam = (query.avatar as string) || ''

		// Sr. candidate TODO: Perform DB query and return the result ✅

		// Query the db by name using the searchPeople service
		let results = searchPeople(searchParam)

		// Filter by department if provided
		if (departmentParam) {
			results = results.filter((person) =>
				person.department?.name
					?.toLowerCase()
					.includes(departmentParam.toLowerCase())
			)
		}

		// Filter by avatar presence if provided
		if (avatarParam === 'required') {
			results = results.filter((person) => person.avatar?.url)
		}

		res.status(200).json({ results })
	} catch (error) {
		console.error('API Error:', error)
		res.status(500).json({ results: [] })
	}
}
