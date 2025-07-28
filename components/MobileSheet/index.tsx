import { ReactNode } from 'react'
import s from './style.module.css'

interface MobileSheetProps {
	isOpen: boolean
	onClose: () => void
	children: ReactNode
}

export default function MobileSheet({
	isOpen,
	onClose,
	children,
}: MobileSheetProps): React.ReactElement {
	return (
		<>
			{/* Overlay backdrop */}
			<div
				className={`${s.overlay} ${isOpen ? s.open : ''}`}
				onClick={onClose}
			/>

			{/* Sheet */}
			<div className={`${s.sheet} ${isOpen ? s.open : ''}`}>{children}</div>
		</>
	)
}
