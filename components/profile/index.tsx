/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { ReactElement } from 'react'
import Image from 'next/image'
import placeholderImage from './img/placeholder.svg'
import s from './style.module.css'

export interface ProfileProps {
	imgUrl?: string
	name: string
	title?: string
	department?: string
	priority?: boolean
}

export default function Profile({
	imgUrl,
	name,
	title,
	department,
	priority = false,
}: ProfileProps): ReactElement {
	return (
		<article className={s.card}>
			{/* Priority for visible rows up to 12 cards, lazy load for rest */}
			<Image
				className={s.avatar}
				src={imgUrl ? imgUrl : placeholderImage}
				alt={imgUrl ? `headshot of ${name}` : 'placeholder headshot'}
				width={104}
				height={106}
				priority={priority}
			/>
			<h3 className={s.heading}>{name}</h3>
			{title ? <p className={s.subheading}>{title}</p> : null}
			{department ? <p className={s.department}>{department}</p> : null}
		</article>
	)
}
