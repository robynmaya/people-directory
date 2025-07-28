/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * NOTE: This script is only to be used by senior candidates
 */

import Database from 'better-sqlite3'
import { executeQuery } from '@datocms/cda-client'
import { PersonRecord, DepartmentNode } from '../types'
import { readFileSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'

// Read GraphQL query from file
const query = readFileSync(
	join(__dirname, '../pages/people/query.graphql'),
	'utf8'
)

const DATO_API_TOKEN = process.env.DATO_API_TOKEN // the Dato API token is provided in the Google Doc we shared with you

async function main() {
	// API Docs: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
	const db = new Database('hashicorp.sqlite')
	db.pragma('journal_mode = WAL')

	//Docs here: https://github.com/datocms/cda-client
	const result = await executeQuery<{
		allPeople: PersonRecord[]
		allDepartments: DepartmentNode[]
	}>(query, {
		token: DATO_API_TOKEN,
	})

	db.exec(`DROP TABLE IF EXISTS people`)
	db.exec(`DROP TABLE IF EXISTS departments`)

	db.exec(`
		CREATE TABLE departments (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			parent_id TEXT,
			FOREIGN KEY (parent_id) REFERENCES departments(id)
		);
	`)

	db.exec(`
		CREATE TABLE people (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			title TEXT,
			avatar_url TEXT,
			department_id TEXT,
			FOREIGN KEY (department_id) REFERENCES departments(id)
		);
	`)

	const insertDepartment = db.prepare(`
		INSERT OR REPLACE INTO departments (id, name, parent_id) 
		VALUES (?, ?, ?)
	`)

	// Team guarantees no orphaned references, making FK toggle safe from:
	// • Invalid department_id references in people table
	// • Invalid parent_id references in departments table
	// • Circular dependencies in department hierarchy
	// • Referential integrity violations that would break JOINs and queries
	//
	// Note: FK toggle is still NEEDED because HashiCorp's guarantee covers data validity,
	// not insertion order. SQLite checks constraints immediately, so parents must exist
	// before children, regardless of whether the references are ultimately valid.
	db.pragma('foreign_keys = OFF')

	for (const department of result.allDepartments) {
		insertDepartment.run(
			department.id,
			department.name,
			department.parent?.id || null
		)
	}

	db.pragma('foreign_keys = ON')

	// Insert people
	const insertPerson = db.prepare(`
		INSERT OR REPLACE INTO people (id, name, title, avatar_url, department_id) 
		VALUES (?, ?, ?, ?, ?)
	`)

	for (const person of result.allPeople) {
		insertPerson.run(
			person.id,
			person.name,
			person.title || null,
			person.avatar?.url || null,
			person.department?.id || null
		)
	}

	db.close()
	console.log(
		`Database created successfully with ${result.allDepartments.length} departments and ${result.allPeople.length} people`
	)
}

main()
