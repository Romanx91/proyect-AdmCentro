import React from 'react'
import { Column } from 'primereact/column'

const Row = (
    { field, header, body = undefined, className = 'dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 ' }
        :
        { field: string, header: string, body?: any, className?: string }
) => {
    return (
        <Column
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className={className}
            header={header}
            field={field}
            body={body}
        />
    )
}

export default Row