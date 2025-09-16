import React from 'react'
import { CiEdit } from 'react-icons/ci'
import { PrimaryColor, SecondaryColor } from '../../helpers/variableAndConstantes';


interface Props {
  color?: string;
  size?: number;
  action?: any
}
const EditIcon = ({ size = 25, color, action }: Props) => {
  return (
    <CiEdit title='Editar' size={size} color={color} onClick={action} />
  )
}

export default EditIcon