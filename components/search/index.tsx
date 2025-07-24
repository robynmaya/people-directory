/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

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
		<>
			<input
				type="text"
				placeholder="Search people by name"
				value={value}
				onChange={onInputChange}
			/>

			<div>
				<input
					type="checkbox"
					checked={hideNoPicture}
					onChange={onProfileChange}
				/>
				<div>Hide people missing a profile image</div>
			</div>
		</>
	)
}
