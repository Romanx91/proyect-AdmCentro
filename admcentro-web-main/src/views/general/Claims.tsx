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
import { useForm } from '../../hooks/useForm'
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import { useClaims } from '../../hooks/useClaims'
import { IClaim } from '../../interfaces/Iclaims'
import CustmTextArea from '../../components/CustomTextArea'
import { Dropdown } from 'primereact/dropdown'
import { useProperties } from '../../hooks/useProperties'
import AddComment from '../../components/icons/AddComment'
import { formatDate, formatDateDDMMYYYY } from '../../helpers/date'
import CloseOnClick from '../../components/CloseOnClick'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import FieldsetGroup from '../../components/FieldsetGroup'
import DropDownIcon from '../../components/DropDownIcon'

const Claims = () => {
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [showAddCommentModal, setShowAddCommentModal] = useState(false)
	const [showCommentsModal, setShowCommentsModal] = useState(false)
	const [show, setShow] = useState(false)
	const { description, PropertyId, state, details, values, handleInputChange, reset, updateAll } = useForm({
		description: '',
		state: '',
		details: [],
		PropertyId: 0,
	})
	const { comment, values: Cvalues, handleInputChange: ChandleInputChange, reset: Creset } = useForm({ comment: '' })
	const [errors, setErrors] = useState<any>()
	const [editMode, setEditMode] = useState(false)

	const currentClaim = useRef<IClaim | null>()
	const { showAndHideModal } = useShowAndHideModal()
	const [savingOrUpdating, setSavingOrUpdating] = useState(false)
	const { data, isError, isLoading, error, refetch, isFetching } = useClaims()
	const propertyQuery = useProperties()

	const edit = (data: IClaim) => {
		// @ts-expect-error
		updateAll({ ...data, details: data.details })
		setShowCreateModal(true)
		setEditMode(true)
		currentClaim.current = data
	}

	const ConfirmDestroy = (data: IClaim) => {
		setShow(!show)
		currentClaim.current = data
	}

	const destroy = async (id: number) => {
		try {
			setSavingOrUpdating(true)
			const res = await http.delete('/claims/' + id)
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

	const verifyFormAddComment = () => {
		let ok = true
		let error: any = {}
		if (!comment.trim().length) {
			ok = false
			error.comment = true
		}
		setErrors(error)
		return ok
	}

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const { error, ok } = validateForm({ ...values }, ['state', 'details'])
		setErrors(error)
		if (!ok) return false
		if (editMode) {
			try {
				setSavingOrUpdating(true)
				const res = await http.put(`/claims/${currentClaim.current?.id}`, { ...values })
				if (res.data.ok) {
					data?.data &&
						(data.data = data?.data.map((z) => {
							if (z.id === currentClaim.current?.id) {
								// @ts-expect-error
								z = { ...values, Property: propertyQuery.data?.data.find((p) => p.id === PropertyId) }
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
				const res = await http.post('/claims', { ...values })
				if (res.data.ok) {
					data?.data.unshift({ ...res.data.data, Property: propertyQuery.data?.data.find((p) => p.id === PropertyId) })
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
	const closeAddCommentModal = () => {
		Creset()
		setShowAddCommentModal(false)
		setErrors({})
	}
	const handleAddComment = (data: IClaim) => {
		currentClaim.current = data
		setShowAddCommentModal(true)
	}
	const showComments = (data: IClaim) => {
		currentClaim.current = data
		setShowCommentsModal(true)
	}
	const handleAddCommentForm = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (verifyFormAddComment()) {
			try {
				setSavingOrUpdating(true)
				const res = await http.put('/claims/' + currentClaim.current?.id, { details: [...currentClaim.current?.details!, { comment, date: new Date() }] })
				if (res.data.ok) {
					data?.data &&
						(data.data = data?.data.map((z) => {
							if (z.id === currentClaim.current?.id) {
								// @ts-expect-error
								z.details = [...currentClaim.current?.details!, { comment, date: new Date() }]
							}
							return z
						}))
					closeAddCommentModal()
					showAndHideModal('Agregado', res.data.message)
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
	const deleteClaimComment = async (date: string) => {
		try {
			setSavingOrUpdating(true)
			let dtls = currentClaim.current?.details.filter(c => c.date !== date)
			const res = await http.put('/claims/' + currentClaim.current?.id, { details: dtls })
			if (res.data.ok) {
				data?.data &&
					(data.data = data?.data.map((z) => {
						if (z.id === currentClaim.current?.id) {
							// @ts-expect-error
							z.details = dtls
						}
						return z
					}))
				// closeAddCommentModal()
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

	const actionBodyTemplate = (rowData: IClaim) => {
		return (
			<div className='flex gap-x-3 items-center justify-end'>
				{rowData.state === 'Abierto' && <AddComment action={() => handleAddComment(rowData)} />}
				<EditIcon action={() => edit(rowData)} />
				<DeleteIcon action={() => ConfirmDestroy(rowData)} />
			</div>
		)
	}

	const openCreateOrEditModel = () => {
		setEditMode(false)
		currentClaim.current = null
		setShowCreateModal(true)
	}

	if (isLoading) return <Loading />
	if (isError) return <RequestError error={error} />

	return (
		<div className='container m-auto  flexsm:mx-0  flex-col justify-center sm:justify-center'>
			<HeaderData action={openCreateOrEditModel} text='Reclamos' />
			{data.data.length > 0 ? (
				<>
					<Box className='!p-0 !overflow-hidden !border-none sm:mx-0    mb-4 '>
						<DataTable
							size='small'
							emptyMessage='Aún no hay reclamo'
							className='!overflow-hidden   !border-none'
							value={data?.data}
							// paginator
							// rows={10}
							// paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
							// currentPageReportTemplate='{first} al {last} de {totalRecords}'
							// paginatorLeft={<RefreshData action={refetch} />}
							dataKey='id'
							responsiveLayout='scroll'
						>
							<Column
								field='Property.street'
								sortable
								body={(data) => (
									<span>
										{data.Property?.street} {data.Property?.number} {data.Property?.floor}-{data.Property?.dept}
									</span>
								)}
								header='Propiedad'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='description'
								header='Descripción'
								body={(data) => (
									<span title={data.description}>
										{data.description.slice(0, 60)} {data.description.length > 60 ? '...' : ''}
									</span>
								)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='state'
								header='Estado'
								sortable
								body={(data) => (
									<span className={`font-bold ${data.state === 'Abierto' ? 'text-green-500' : 'text-red-400'}`}>
										{data.state}{' '}
									</span>
								)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='date'
								header='Fecha Inicio'
								body={(data) => <span>{formatDateDDMMYYYY(data.createdAt)}</span>}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='details.length'
								header='Comentarios'
								sortable
								body={(data) => (<button disabled={data.details.length === 0} onClick={() => showComments(data)} className=' border-brand border rounded-full shadow px-2  py-1 text-brand'> Ver ({data.details.length}) </button>)}
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
				</>
			) : (
				<EmptyData text='Aún no hay reclamo' />
			)}

			{isFetching && (<Loading h={40} w={40} />)}

			<DeleteModal
				show={show}
				savingOrUpdating={savingOrUpdating}
				setShow={setShow}
				destroy={() => destroy(currentClaim.current?.id!)}
				text={`${currentClaim.current?.description}`}
			/>
			<CreateModal
				show={showCreateModal}
				closeModal={closeCreateModal}
				overlayClick={false}
				className='max-w-[700px] w-fit sm:w-[600px]'
				titleText={`${editMode ? 'Editar' : 'Iniciar'}  reclamo`}
			>
				<form onSubmit={handleSave}				>
					<FieldsetGroup>
						<fieldset className=''>
							<label htmlFor='PropertyId'>Propiedad</label>
							<Dropdown
								value={PropertyId}
								onChange={(e) => handleInputChange(e.value, 'PropertyId')}
								options={propertyQuery.data?.data}
								optionLabel='street'
								dropdownIcon={() => <DropDownIcon />}
								disabled={editMode}
								showClear
								filterPlaceholder='Busca propiedad'
								optionValue='id'
								filterBy='street,number,dept,floor'
								placeholder='elije una propiedad'
								filter
								valueTemplate={(data, props) => {
									if (!data) return props.placeholder
									return (
										<span>
											{data.street} {data.number} {data.floor}-{data.dept}
										</span>
									)
								}}

								itemTemplate={(data) => (<span> {data.street} {data.number} {data.floor}-{data.dept} </span>)}
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
							{PropertyId !== 0 && (
								<span className='text-blue-600 dark:text-blue-400 text-sm ' >
									Propietario :  {propertyQuery.data?.data.find((p) => p.id === PropertyId)?.Owner?.fullName}
								</span>
							)}
							{errors?.PropertyId && <FormError text='La propiedad es obligatoria.' />}
						</fieldset>
						{editMode && (
							<fieldset className='w-full sm:w-[30%]'>
								<label htmlFor="state">Estado</label>
								<Dropdown
									value={state}
									onChange={(e) => handleInputChange(e.value, 'state')}
									options={['Abierto', 'Cerrado']}
									placeholder='elije un estado'
									className='h-[42px] items-center !border-gray-200 shadow'
								/>
								{errors?.state && <FormError text='El estado es obligatorio.' />}
							</fieldset>
						)}
					</FieldsetGroup>
					<CustmTextArea
						placeholder='Escribe una descripción...'
						initialValue={description}
						onChange={(value) => handleInputChange(value, 'description')}
						maxLength={255}
						className='h-24'
						label='Descripción'
						required
						hasError={errors?.description}
						errorText='La descripción es obligatoria.'
					/>
					<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />

				</form>
			</CreateModal>
			<CreateModal
				show={showAddCommentModal}
				closeModal={closeAddCommentModal}
				overlayClick={false}
				className='max-w-[700px] w-fit sm:w-[600px]'
				titleText={`${editMode ? 'Editar' : 'Agregar'}  comentario`}
			>
				<form onSubmit={handleAddCommentForm}				>
					<fieldset>
						<label htmlFor='PropertyId'>Reclamo : #{currentClaim.current?.id}</label>
						<span className='border border-gray-300 dark:border-slate-500  p-2'> {currentClaim.current?.description} </span>
					</fieldset>
					<CustmTextArea
						placeholder='Escribe un comentario...'
						initialValue={comment}
						className="min-h-[150px]"
						onChange={(value) => ChandleInputChange(value, 'comment')}
						label='Comentario'
						required
						hasError={errors?.comment}
						errorText='El comentario es obligatorio.'
					/>
					<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeAddCommentModal} />

				</form>
			</CreateModal>
			<CreateModal
				show={showCommentsModal}
				closeModal={() => setShowCommentsModal(false)}
				overlayClick={false}
				className='max-w-[700px] w-fit sm:w-[600px]'
				titleText='Comentarios'
			>
				<CloseOnClick action={() => setShowCommentsModal(false)} />
				<div className="">
					<fieldset className='border border-gray-300 dark:border-slate-500 p-2 text-sm'>
						<label htmlFor='PropertyId'>Reclamo : #{currentClaim.current?.id}</label>
						<span className=''> {currentClaim.current?.description} </span>
					</fieldset>
					{
						currentClaim.current?.details?.length === 0 ? <div className='text-center text-gray-400 my-6'>No hay comentarios</div> : (
							<div className="comments flex flex-col gap-y-2  max-h-[420px] my-4 overflow-y-auto">
								{
									currentClaim.current?.details?.map((comment) => (
										<div className="comment bg-gray-200 p-2 pb-5 relative group hover:bg-gray-100 cursor-pointer dark:bg-slate-700" key={comment.date}>
											<div dangerouslySetInnerHTML={{ __html: comment.comment!.replaceAll('\n', '<br />')! }} />
											<div className='absolute bottom-[2px] right-1 text-xs'> {formatDate(comment.date)} </div>
											<button
												disabled={savingOrUpdating}
												title='Doble click para eliminar'
												onClick={() => {
													document.querySelectorAll('.showAlertDelete')?.forEach((item) => {
														item.classList.toggle('hidden')
														// item.addEventListener('click', () => {
														// })
													})
												}}
												onDoubleClick={() => { deleteClaimComment(comment.date) }}
												className='absolute top-[2px] right-1 text-xs hidden bg-red-100   dark:bg-gray-800 p-2 rounded-full shadow-lg group-hover:flex'>
												<DeleteIcon action={() => { }} />
												<span className='showAlertDelete absolute top-2 shadow rounded hidden  right-10 bg-gray-200 p-1 w-40 text-xs'>Doble click para eliminar</span>
											</button>
										</div>
									))
								}
							</div>
						)
					}
				</div>
			</CreateModal>
		</div>
	)
}

export default Claims
