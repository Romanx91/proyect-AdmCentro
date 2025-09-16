import React from 'react'
import { Button } from 'primereact/button'

const RefreshData = ({ action }: { action: any }) => {
    return (
        <Button
            onClick={() => action()}
            type='button'
            title='Refrescar datos'
            className='dark:!text-brand'
            icon='pi pi-refresh'
            text
        />
    )
}

export default RefreshData