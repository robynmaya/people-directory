/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import s from './style.module.css'

export interface SearchProps {
	value: string
	hideNoPicture: boolean
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Search({
	value,
	hideNoPicture,
	onInputChange,
	onProfileChange,
}: SearchProps) {
	return (
		<div className={s.searchContainer}>
			<div className={s.inputContainer}>
				<input
					id="people-search"
					type="text"
					placeholder="Search people by name"
					value={value}
					onChange={onInputChange}
					aria-label="Search people by name"
					className={s.searchInput}
					autoComplete="off"
				/>
			</div>
			<div className={s.checkboxContainer}>
				<label htmlFor="hide-no-picture" className={s.checkboxLabel}>
					<input
						id="hide-no-picture"
						type="checkbox"
						checked={hideNoPicture}
						onChange={onProfileChange}
						className={s.checkbox}
					/>
					Hide people missing a profile image
				</label>
			</div>
		</div>
	)
}
