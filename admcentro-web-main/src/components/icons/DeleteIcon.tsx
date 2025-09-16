import React from 'react'
import { AiOutlineDelete } from 'react-icons/ai'
import { PrimaryColor, SecondaryColor } from '../../helpers/variableAndConstantes';


interface Props {
  color?: string;
  size?: number;
  action?: any
}
const DeleteIcon = ({ size = 25, color = '#f96e6e', action }: Props) => {
  return (
    <AiOutlineDelete title='Eliminar' size={size} color={color} onClick={action} />
  )
}

export default DeleteIcon