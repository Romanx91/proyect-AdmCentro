import React from 'react'
import { RiCloseLine } from 'react-icons/ri'
import { SecondaryColor } from '../../helpers/variableAndConstantes';
interface Props {
  color?: string;
  size?: number;
  action?: any
}
const CloseIcon = ({ size = 25, color = localStorage.theme === 'dark' ? '#ce93d8' : SecondaryColor, action }: Props) => {
  return (
    <RiCloseLine title='Cerrar ventana' size={size} color={color} onClick={action} />
  )
}

export default CloseIcon