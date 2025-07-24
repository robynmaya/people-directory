/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

export interface SearchProps {
	value: string
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Search({
	value,
	onInputChange,
	onProfileChange,
}: SearchProps) {
	return (
		<>
			<input
				type="text"
				placeholder="Search people by name"
				value={value}
				onChange={onInputChange}
			/>

			<div>
				<input type="button" onChange={onProfileChange} />
				<div>Hide people missing a profile image</div>
			</div>
		</>
	)
}
