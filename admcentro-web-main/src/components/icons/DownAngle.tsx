import React from 'react'
import { BiChevronDown } from 'react-icons/bi'
interface Props {
	color?: string
	size?: number
}
const DownAngle = ({ size = 25, color = localStorage.theme === 'dark' ? 'gray' : 'SecondaryColor' }: Props) => {
	return (
		<BiChevronDown
			title='Deslizar para abajo'
			size={size}
			color={color}
		/>
	)
}

export default DownAngle
