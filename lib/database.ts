import Database from 'better-sqlite3'
import { PersonRecord, DepartmentNode } from '../types'

/**
 * Data Access Layer
 * Separates database logic from Frontend
 */

// one connection all functions
let dbConnection: Database | null = null

function getDatabase() {
	if (!dbConnection) {
		dbConnection = new Database('hashicorp.sqlite')
	}
	return dbConnection
}

function transformRowToPerson(row: any): PersonRecord | null {
	if (!row.id) {
		return null
	}

	const person: PersonRecord = {
		id: String(row.id),
	}

	// only add fields if they exist and are not empty
	if (row.name && String(row.name).trim()) {
		person.name = String(row.name).trim()
	}

	if (row.title && String(row.title).trim()) {
		person.title = String(row.title).trim()
	}

	if (row.avatar_url && String(row.avatar_url).trim()) {
		person.avatar = { url: String(row.avatar_url).trim() }
	}

	if (row.dept_name && String(row.dept_name).trim()) {
		person.department = {
			id: String(row.dept_id),
			name: String(row.dept_name).trim(),
		}
	}

	return person
}
/**
 * Get all people from the database
 */

export function getAllPeople(): PersonRecord[] {
	const db = getDatabase()

	const rows = db
		.prepare(
			`
		SELECT 
			p.id, p.name, p.title, p.avatar_url,
			d.id as dept_id, d.name as dept_name
		FROM people p
		LEFT JOIN departments d ON p.department_id = d.id
		ORDER BY p.name
	`
		)
		.all()

	return rows.map(transformRowToPerson).filter(Boolean) as PersonRecord[]
}

/**
 * Get all departments from the database
 */

export function getAllDepartments(): DepartmentNode[] {
	const db = getDatabase()

	const rows = db
		.prepare(
			`
		SELECT
			id, name, parent_id
		FROM departments
		ORDER BY name
	`
		)
		.all()

	return rows.map((row: any) => ({
		id: String(row.id),
		name: String(row.name),
		parent: row.parent_id ? { id: String(row.parent_id), name: '' } : null,
	}))
}

/**
 * Search people by name (requirement doesn't say by title or other person attributes)
 */

export function searchPeople(searchTerm: string): PersonRecord[] {
	const db = getDatabase()
	if (!searchTerm.trim()) {
		return []
	}
	const rows = db
		.prepare(
			`
		SELECT
			p.id, p.name, p.title, p.avatar_url,
			d.id as dept_id, d.name as dept_name
		FROM people p
		LEFT JOIN departments d ON p.department_id = d.id
		WHERE p.name LIKE ?
		ORDER BY p.name
		LIMIT 100
	`
		)
		.all(`%${searchTerm}%`)

	return rows.map(transformRowToPerson).filter(Boolean) as PersonRecord[]
}
