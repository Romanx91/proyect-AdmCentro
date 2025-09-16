import React, { useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import Box from '../../components/Box'
import EditIcon from '../../components/icons/EditIcon'
import DeleteIcon from '../../components/icons/DeleteIcon'
import DeleteModal from '../../components/DeleteModal'
import Loading from '../../components/Loading'
import http from '../../api/axios'
import CreateModal from '../../components/CreateModal'
import CustomInput from '../../components/CustomInput'
import { useForm } from '../../hooks/useForm'
import RequestError from '../../components/RequestError'
import { useConfig } from '../../hooks/useConfig'
import { IConfig } from '../../interfaces/Iconfig'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import RefreshData from '../../components/RefreshData'
import BoxContainerPage from '../../components/BoxContainerPage'

const Configurations = () => {

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [show, setShow] = useState(false)
    const [errors, setErrors] = useState<any>()
    const [editMode, setEditMode] = useState(false)
    const currentConfig = useRef<IConfig | null>()
    const [savingOrUpdating, setSavingOrUpdating] = useState(false)
    const { key, value, values, handleInputChange, reset, updateAll } = useForm({ key: '', value: '' })
    const { showAndHideModal } = useShowAndHideModal()
    const { data, isError, isLoading, error, isFetching, refetch } = useConfig()

    const edit = (data: IConfig) => {
        updateAll({ key: data.key, value: data.value })
        setShowCreateModal(true)
        setEditMode(true)
        currentConfig.current = data
    }

    const ConfirmDestroy = (data: IConfig) => {
        setShow(!show)
        currentConfig.current = data
    }

    const destroy = async (id: number) => {
        try {
            setSavingOrUpdating(true)
            const res = await http.delete('/config/' + id)
            if (res.data.ok) {
                data?.data && (data.data! = data?.data.filter((z) => z.id !== id))
                setShow(false)
                showAndHideModal('Borrado', res.data.message)
            } else {
                showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
            }
        } catch (error: any) {
            if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
        } finally {
            setSavingOrUpdating(false)
        }
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { error, ok } = validateForm(values)
        setErrors(error)
        if (!ok) return false
        if (editMode) {
            try {
                setSavingOrUpdating(true)
                const res = await http.put(`/config/${currentConfig.current?.id}`, values)
                if (res.data.ok) {
                    data?.data &&
                        (data.data = data?.data.map((z) => {
                            if (z.id === currentConfig.current?.id) {
                                z.key = values.key
                                z.value = values.value
                            }
                            return z
                        }))
                    reset()
                    setShowCreateModal(false)
                    showAndHideModal('Editado', res.data.message)
                } else {
                    showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
                }
            } catch (error: any) {
                if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
            } finally {
                setSavingOrUpdating(false)
            }
        } else {
            try {
                setSavingOrUpdating(true)
                const res = await http.post('/config', values)
                if (res.data.ok) {
                    data?.data.unshift(res.data.data)
                    reset()
                    setShowCreateModal(false)
                    showAndHideModal('Guardado', res.data.message)
                } else {
                    showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
                }
            } catch (error: any) {
                if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
            } finally {
                setSavingOrUpdating(false)
            }
        }
    }

    const closeCreateModal = () => {
        reset()
        setShowCreateModal(false)
        setErrors({})
    }

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className='flex gap-x-3 items-center justify-center'>
                <EditIcon action={() => edit(rowData)} />
                {/* <DeleteIcon action={() => ConfirmDestroy(rowData)} /> */}
            </div>
        )
    }
    const openCreateOrEditModel = () => {
        setShowCreateModal(true)
        setEditMode(false)
        currentConfig.current = null
    }
    if (isLoading) return <Loading />
    if (isError) return <RequestError error={error} />

    return (
        <BoxContainerPage>
            <HeaderData action={openCreateOrEditModel} text='Info general' />
            {data.data.length > 0 ? (
                <Box className='!p-0 !overflow-hidden !border-none sm:mx-0   sm:w-[500px] mb-4 '>
                    <DataTable
                        size='small'
                        emptyMessage='Aún no hay infos general'
                        className='!overflow-hidden   !border-none'
                        value={data?.data}
                        dataKey='id'
                        responsiveLayout='scroll'
                    // paginator
                    // rows={10}
                    // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
                    // currentPageReportTemplate='{first} al {last} de {totalRecords}'
                    // paginatorLeft={<RefreshData action={refetch} />}
                    >
                        <Column
                            field='key'
                            header='Nombre'
                            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                        />
                        <Column
                            field='value'
                            header='Valor'
                            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                        />
                        <Column
                            body={actionBodyTemplate}
                            headerClassName='!border-none dark:!bg-gray-800'
                            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                            exportable={false}
                            style={{ width: 90 }}
                        />
                    </DataTable>
                </Box>
            ) : (<EmptyData text='Aún no hay infos general ' />
            )}

            {isFetching && (<Loading h={40} w={40} />)}

            <DeleteModal
                show={show}
                savingOrUpdating={savingOrUpdating}
                setShow={setShow}
                destroy={() => destroy(currentConfig.current?.id!)}
                text={`${currentConfig.current?.key}`}
            />

            <CreateModal
                show={showCreateModal}
                closeModal={closeCreateModal}
                overlayClick={false}
                className='max-w-[400px] sm:w-[370px] w-[fit]'
                titleText={`${editMode ? 'Editar' : 'Crear'}  info general`}
            >
                <form onSubmit={handleSave} >
                    <CustomInput
                        placeholder='Email,teléfono,etc'
                        initialValue={key}
                        disabled={editMode}
                        onChange={(value) => handleInputChange(value, 'key')}
                        maxLength={50}
                        label='Clave'
                        required
                        hasError={errors?.key}
                        errorText='La clave es obligatoria.'
                    />
                    <CustomInput
                        placeholder='example@gmail.com'
                        initialValue={value}
                        onChange={(value) => handleInputChange(value, 'value')}
                        maxLength={255}
                        label='Valor'
                        required
                        hasError={errors?.value}
                        errorText='El valor es obligatorio.'
                    />

                    <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />

                </form>
            </CreateModal>
        </BoxContainerPage >
    )
}

export default Configurations
