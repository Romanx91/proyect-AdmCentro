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
import CustmTextArea from '../../components/CustomTextArea'
import { Dropdown } from 'primereact/dropdown'
import { useProperties } from '../../hooks/useProperties'
import { formatDate, formatDateDDMMYYYY } from '../../helpers/date'
import CloseOnClick from '../../components/CloseOnClick'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import FieldsetGroup from '../../components/FieldsetGroup'
import { IBudget } from '../../interfaces/Ibudget'
import { useBudgets } from '../../hooks/useBudgets'
import { BsCamera } from 'react-icons/bs'
import { Image } from 'primereact/image'
import DropDownIcon from '../../components/DropDownIcon'

type IBelongToBudget = 'Propietario' | 'Inquilino' | ''

const Budgets = () => {
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [show, setShow] = useState(false)
	const { description, PropertyId, category, type, photo, values, belongsTo, state, approved, charged, handleInputChange, reset, updateAll } = useForm({
		description: '',
		category: '',
		type: '',
		state: 'En curso',
		approved: false,
		charged: false,
		belongsTo: '' as IBelongToBudget,
		photo: '',
		PropertyId: null,
	})
	const [errors, setErrors] = useState<any>()
	const [editMode, setEditMode] = useState(false)
	const currentBudget = useRef<IBudget | null>()
	const { showAndHideModal } = useShowAndHideModal()
	const [savingOrUpdating, setSavingOrUpdating] = useState(false)
	const { data, isError, isLoading, error, refetch, isFetching } = useBudgets()
	const propertyQuery = useProperties()

	const edit = (data: IBudget) => {
		// @ts-expect-error
		updateAll({ ...data })
		setShowCreateModal(true)
		setEditMode(true)
		currentBudget.current = data
	}

	const ConfirmDestroy = (data: IBudget) => {
		setShow(!show)
		currentBudget.current = data
	}

	const destroy = async (id: number) => {
		try {
			setSavingOrUpdating(true)
			const res = await http.delete('/budgets/' + id)
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
		const { error, ok } = validateForm({ ...values }, ['photo', 'charged', 'approved'])
		setErrors(error)
		if (!ok) return false
		if (editMode) {
			try {
				setSavingOrUpdating(true)
				const res = await http.put(`/budgets/${currentBudget.current?.id}`, { ...values })
				if (res.data.ok) {
					data?.data &&
						(data.data = data?.data.map((z) => {
							if (z.id === currentBudget.current?.id) {
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
				const res = await http.post('/budgets', { ...values })
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

	const actionBodyTemplate = (rowData: IBudget) => {
		return (
			<div className='flex gap-x-3 items-center justify-end'>
				<EditIcon action={() => edit(rowData)} />
				<DeleteIcon action={() => ConfirmDestroy(rowData)} />
			</div>
		)
	}

	const openCreateOrEditModel = () => {
		setEditMode(false)
		currentBudget.current = null
		setShowCreateModal(true)
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files![0]
		if (file && file.size > 3145728) {
			showAndHideModal('Error', 'La imagen no debe pesar mas de 3 MB', 'red')
			e.target.files = null
			return false
		}

		if (file) {
			const reader = new FileReader()
			reader.onload = (e) => {
				// @ts-expect-error
				updateAll({ ...values, photo: e.target.result })
				// @ts-expect-error
				document.querySelector('#img_preview')?.setAttribute('src', e.target.result)
			}
			reader.readAsDataURL(file)
		}
	}

	if (isLoading) return <Loading />
	if (isError) return <RequestError error={error} />

	return (
		<div className='container m-auto  flex sm:mx-0  flex-col justify-center sm:justify-center'>
			<HeaderData action={openCreateOrEditModel} text='Presupuestos' />
			{data.data.length > 0 ? (
				<>
					<Box className='!p-0 !overflow-hidden !border-none sm:mx-0    mb-4 '>
						<DataTable
							size='small'
							emptyMessage='Aún no hay presupuesto'
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
								field='type'
								header='Tipo'
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='category'
								header='Categoria'
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='state'
								header='Estado'
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='belongsTo'
								header='Pertenece a'
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='approved'
								header='Aprobado'
								body={(data) => <span>{data.approved ? 'Si' : 'No'}</span>}
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='charged'
								header='Cobrado'
								body={(data) => <span>{data.charged ? 'Si' : 'No'}</span>}
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='description'
								header='Descripción'
								body={(data) => (
									<span title={data.description}>
										{data.description}
									</span>
								)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 truncate dark:!border-slate-600 '
								style={{ maxWidth: 250 }}
							/>
							<Column
								field='photo'
								header='Foto'
								body={(data) => (data.photo ? <Image src={data.photo} alt="Image" width="70" className='shadow' preview /> : '')}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400 '
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600  '
								style={{ maxWidth: 70 }}

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
				<EmptyData text='Aún no hay presupuesto' />
			)}

			{isFetching && (<Loading h={40} w={40} />)}

			<DeleteModal
				show={show}
				savingOrUpdating={savingOrUpdating}
				setShow={setShow}
				destroy={() => destroy(currentBudget.current?.id!)}
				text={`${currentBudget.current?.description}`}
			/>
			<CreateModal
				show={showCreateModal}
				closeModal={closeCreateModal}
				overlayClick={false}
				className='max-w-[700px] w-fit sm:w-[600px]'
				titleText={`${editMode ? 'Editar' : 'Armar'}  presupuesto`}
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
							{PropertyId !== null && (
								<span className='text-blue-600 dark:text-blue-400 text-sm ' >
									Propietario :  {propertyQuery.data?.data.find((p) => p.id === PropertyId)?.Owner?.fullName}
								</span>
							)}
							{errors?.PropertyId && <FormError text='La propiedad es obligatoria.' />}
						</fieldset>

					</FieldsetGroup>
					<FieldsetGroup>
						<fieldset className='w-full'>
							<label htmlFor="type">Tipo</label>
							<Dropdown
								value={type}
								onChange={(e) => handleInputChange(e.value, 'type')}
								dropdownIcon={() => <DropDownIcon />}
								options={['Factura', 'Recibo', 'Presupuesto', 'Expensas extraordinarias']}
								placeholder='elije un tipo'
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
							{errors?.type && <FormError text='El tipo es obligatorio.' />}
						</fieldset>
						<fieldset className='w-full'>
							<label htmlFor="category">Categoría</label>
							<Dropdown
								value={category}
								onChange={(e) => handleInputChange(e.value, 'category')}
								dropdownIcon={() => <DropDownIcon />}
								options={['Plomeria', 'Gasista', 'Electricista', 'Pintura', 'Albañileria', 'Materiales']}
								placeholder='elije una categoría'
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
							{errors?.category && <FormError text='La categoría es obligatorio.' />}
						</fieldset>

					</FieldsetGroup>
					<FieldsetGroup>
						<fieldset className='w-full'>
							<label htmlFor="type">Estado</label>
							<Dropdown
								value={state}
								onChange={(e) => handleInputChange(e.value, 'state')}
								dropdownIcon={() => <DropDownIcon />}
								options={['En curso', 'Visto', 'Aprobado', 'Rechazado']}
								placeholder='elije un tipo'
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
							{errors?.state && <FormError text='El estado es obligatorio.' />}
						</fieldset>
						<fieldset className='w-full'>
							<label htmlFor="category">Pertenece a</label>
							<Dropdown
								value={belongsTo}
								onChange={(e) => handleInputChange(e.value, 'belongsTo')}
								dropdownIcon={() => <DropDownIcon />}
								options={['Propietario', 'Inquilino']}
								placeholder='elije una categoría'
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
							{errors?.belongsTo && <FormError text='Este campo es obligatorio.' />}
						</fieldset>
					</FieldsetGroup>


					<FieldsetGroup>
						<fieldset className='w-full'>
							<label htmlFor="approved">Aprobado</label>
							<Dropdown
								value={approved}
								optionLabel='label'
								optionValue='value'
								onChange={(e) => handleInputChange(e.value, 'approved')}
								dropdownIcon={() => <DropDownIcon />}
								options={[{ label: 'Si', value: true }, { label: 'No', value: false }]}
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
						</fieldset>
						<fieldset className='w-full'>
							<label htmlFor="approved"> Cobrado </label>
							<Dropdown
								value={charged}
								optionLabel='label'
								optionValue='value'
								onChange={(e) => handleInputChange(e.value, 'charged')}
								dropdownIcon={() => <DropDownIcon />}
								options={[{ label: 'Si', value: true }, { label: 'No', value: false }]}
								className='h-[42px] items-center !border-gray-200 shadow'
							/>
						</fieldset>
					</FieldsetGroup>
					<div className="flex flex-col">
						<CustmTextArea
							placeholder='Escribe una descripción...'
							initialValue={description}
							onChange={(value) => handleInputChange(value, 'description')}
							minLength={5}
							maxLength={255}
							className='h-24'
							label='Descripción'
							required
							hasError={errors?.description}
							errorText='La descripción es obligatoria.'
						/>
						<div className='self-end'>{description.length}/255</div>
					</div>
					<input
						type='file'
						accept="image/*"
						className='hidden'
						// ref={inputFileRef}
						onChange={handleFileChange}
						id='photoBudget'
					/>
					{
						!photo && (
							<label htmlFor="photoBudget" className='flex items-center gap-4 justify-center my-4 cursor-pointer border-2 duration-700 hover:border-brand2  dark:hover:border-brand2 hover:translate-y-1  border-gray-300 dark:border-slate-700 border-dashed p-2 text-center shadow hover:shadow-md'>
								<span> {photo ? 'Cambiar photo' : 'Cargar photo '}  </span>
								<BsCamera size={30} />
							</label>
						)
					}

					<div className="photo-box relative">
						<img src={photo} alt="" id='img_preview' className='my-4' />
						{(photo && !editMode) && (<CloseOnClick action={() => { handleInputChange('', 'photo') }} />)}
					</div>

					<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />

				</form>
			</CreateModal>

		</div>
	)
}

export default Budgets
