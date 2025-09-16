import React, { useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import Box from '../../components/Box'
import EditIcon from '../../components/icons/EditIcon'
import DeleteIcon from '../../components/icons/DeleteIcon'
import DeleteModal from '../../components/DeleteModal'
import Loading from '../../components/Loading'
import { useZones } from '../../hooks/useZones'
import { Izone } from '../../interfaces/Izones'
import http from '../../api/axios'
import CreateModal from '../../components/CreateModal'
import CustomInput from '../../components/CustomInput'
import { useForm } from '../../hooks/useForm'
import RequestError from '../../components/RequestError'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import RefreshData from '../../components/RefreshData'
import HeaderData from '../../components/HeaderData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import BoxContainerPage from '../../components/BoxContainerPage'

const AllZones = () => {

	const [showCreateModal, setShowCreateModal] = useState(false)
	const [show, setShow] = useState<boolean>(false)
	const [errors, setErrors] = useState<any>({})
	const [editMode, setEditMode] = useState(false)
	const [savingOrUpdating, setSavingOrUpdating] = useState(false)
	const currentZone = useRef<Izone | null>()

	const { data, isError, isLoading, error, isFetching, refetch } = useZones()
	const { name, values, handleInputChange, reset } = useForm({ name: '' })
	const { showAndHideModal } = useShowAndHideModal()

	const edit = (data: Izone) => {
		handleInputChange(data.name, 'name')
		currentZone.current = data
		setShowCreateModal(true)
		setEditMode(true)
	}

	const ConfirmDestroy = (data: Izone) => {
		setShow(!show)
		currentZone.current = data
	}

	const destroy = async (id: number) => {
		setSavingOrUpdating(true)
		try {
			const res = await http.delete('/zones/' + id)
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
				const res = await http.put(`/zones/${currentZone.current?.id}`, values)
				if (res.data.ok) {
					data?.data &&
						(data.data = data?.data.map((z) => {
							if (z.id === currentZone.current?.id) {
								z.name = values.name
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

				const res = await http.post('/zones', values)
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

	const openCreateOrEditModel = () => {
		setEditMode(false)
		currentZone.current = null
		setShowCreateModal(true)
	}

	const actionBodyTemplate = (rowData: Izone) => {
		return (
			<div className='flex gap-x-3 items-center justify-center'>
				<EditIcon action={() => edit(rowData)} />
				<DeleteIcon action={() => ConfirmDestroy(rowData)} />
			</div>
		)
	}

	if (isLoading) return <Loading />

	if (isError) return <RequestError error={error} />

	return (
		<BoxContainerPage >
			<HeaderData action={openCreateOrEditModel} text='Zonas' />
			{data.data.length > 0 ? (
				<Box className='!p-0 !overflow-hidden !border-none  sm:mx-0  sm:w-[500px] mb-4 '>
					<DataTable
						size='small'
						emptyMessage='Aún no hay zona'
						className='!overflow-hidden   !border-none'
						value={data?.data}
						dataKey='id'
						// paginator
						// rows={10}
						// paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
						// currentPageReportTemplate='{first} al {last} de {totalRecords}'
						// paginatorLeft={<RefreshData action={refetch} />}
						responsiveLayout='scroll'
					>
						<Column field='name' header='Nombre' headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400' className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 ' />
						<Column body={actionBodyTemplate} headerClassName='!border-none dark:!bg-gray-800' className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600' exportable={false} style={{ width: 90 }} />
					</DataTable>
				</Box>
			) : (
				<EmptyData text='Aún no hay zona' />
			)}

			{isFetching && (<Loading h={40} w={40} />)}

			<DeleteModal
				show={show}
				savingOrUpdating={savingOrUpdating}
				setShow={setShow}
				destroy={() => destroy(currentZone.current?.id!)}
				text={`La zona ${currentZone.current?.name}`}
			/>

			<CreateModal
				show={showCreateModal}
				closeModal={closeCreateModal}
				overlayClick={false}
				className='max-w-[500px]  sm:w-[380px]'
				titleText={`${editMode ? 'Editar' : 'Crear'} zona`}
			>
				<form onSubmit={handleSave} >
					<CustomInput
						placeholder='Sur,Este,Norte'
						initialValue={name}
						onChange={(value) => handleInputChange(value, 'name')}
						maxLength={50}
						label='Nombre'
						required
						minLength={1}
						hasError={errors?.name}
						errorText='El nombre es obligatorio.'
					/>
					<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
				</form>
			</CreateModal>
		</BoxContainerPage>
	)
}

export default AllZones
