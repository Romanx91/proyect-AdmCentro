import React, { useContext, useState } from 'react'
import { DelayAlertToHide } from '../helpers/variableAndConstantes'
import { AuthContext } from '../context/authContext'

const useShowAndHideModal = () => {
    const { showAlert, hideAlert } = useContext(AuthContext)
    const [to, setTo] = useState<any>()

    const showAndHideModal = (
        title: string,
        message: string,
        color: string = 'green',
        delay: number = DelayAlertToHide
    ) => {

        clearTimeout(to)
        showAlert({ title, message, color, show: true })
        setTo(setTimeout(hideAlert, delay))
    }
    return { showAndHideModal }
}

export default useShowAndHideModal