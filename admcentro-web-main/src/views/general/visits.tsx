import React, { useRef, useState } from 'react'
import { DataTable, DataTableExpandedRows } from 'primereact/datatable'
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
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import { useVisits } from '../../hooks/useVisits'
import { IVisit } from '../../interfaces/IvisitsResponse'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown } from 'primereact/dropdown'
import { useProperties } from '../../hooks/useProperties'
import { formatDate, formatDateForInput } from '../../helpers/date'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import RefreshData from '../../components/RefreshData'
import HeaderData from '../../components/HeaderData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import { validateForm } from '../../helpers/form'
import { FilterMatchMode } from 'primereact/api'
import CustomTextArea from '../../components/CustomTextArea'
import { UUID } from '../../helpers/general'
interface IVisitor {
	id: string
	fullName: string
	phone: string
	email: string
}

const Visits = () => {
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [show, setShow] = useState(false)
	const [savingOrUpdating, setSavingOrUpdating] = useState(false)
	const { date, phone, description, fullName, PropertyId, values, handleInputChange, reset, updateAll } = useForm({
		date: '',
		phone: '',
		description: '',
		fullName: '',
		PropertyId: null as number | null,
	})
	const { email: Xemail, fullName: XfullName, phone: Xphone, values: Vvalues, handleInputChange: VhandleInputChange, reset: Vreset } = useForm({

		phone: '',
		fullName: '',
		email: ''

	})
	const [globalFilterValue, setGlobalFilterValue] = useState('')
	const [errors, setErrors] = useState<any>()
	const [editMode, setEditMode] = useState(false)
	const currentVisit = useRef<IVisit | null>()
	const [addVisitor, setAddVisitor] = useState(false)
	const [addingNewVisitor, setAddingNewVisitor] = useState(false)
	const [otherVistors, setOtherVistors] = useState<IVisitor[]>([])

	const { showAndHideModal } = useShowAndHideModal()
	const { data, isError, isLoading, error, isFetching, refetch } = useVisits()
	const propertyQuery = useProperties()
	const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>()

	const [filters, setFilters] = useState({
		global: { value: null, matchMode: FilterMatchMode.CONTAINS },
		fullName: { value: null, matchMode: FilterMatchMode.CONTAINS },
		phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
		'Property.street': { value: null, matchMode: FilterMatchMode.CONTAINS },
	})

	const onGlobalFilterChange = (val: any) => {
		const value = val
		let _filters = { ...filters }
		_filters['global'].value = value
		setFilters(_filters)
		setGlobalFilterValue(value)
	}

	const edit = (data: IVisit) => {
		updateAll({ ...data, date: formatDateForInput(data.date), PropertyId: data.Property.id })
		setOtherVistors(data.participants!)
		setShowCreateModal(true)
		setEditMode(true)
		currentVisit.current = data
	}

	const ConfirmDestroy = (data: IVisit) => {
		setShow(!show)
		currentVisit.current = data
	}

	const destroy = async (id: number) => {
		try {
			setSavingOrUpdating(true)
			const res = await http.delete('/visits/' + id)
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
		const { error, ok } = validateForm({ ...values }, ['description', 'fullName', 'phone'])
		setErrors(error)
		if (!ok || otherVistors.length === 0) return false
		if (editMode) {
			try {
				setSavingOrUpdating(true)
				const res = await http.put(`/visits/${currentVisit.current?.id}`, {
					...values,
					participants: otherVistors,
				})
				if (res.data.ok) {
					data?.data &&
						(data.data = data?.data.map((z: any) => {
							if (z.id === currentVisit.current?.id) {
								z = { ...values, participants: otherVistors, Property: propertyQuery.data?.data.find((p) => p.id === PropertyId) } // eslint-disable-line no-use-before-define
							}
							return z
						}))
					reset()
					setOtherVistors([])
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
				const res = await http.post('/visits', { ...values, participants: otherVistors })
				if (res.data.ok) {
					data?.data.unshift({ ...res.data.data, Property: propertyQuery.data?.data.find((p) => p.id === PropertyId) })
					reset()
					setOtherVistors([])
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

	const closeAddVisitor = () => {
		Vreset()
		setAddVisitor(false)
	}

	const handleAddNewVistor = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const { error, ok } = validateForm({ ...Vvalues })
		if (!ok) return false
		setAddingNewVisitor(true)
		setOtherVistors([...otherVistors, { ...Vvalues, id: UUID() }])
		setAddingNewVisitor(false)
		closeAddVisitor()
	}
	const deleteVisitor = (vis: any) => setOtherVistors(otherVistors.filter((v) => v.id !== vis.id))

	const actionBodyTemplate = (rowData: any) => {
		return (
			<div className='flex gap-x-3 items-center justify-center'>
				<EditIcon action={() => edit(rowData)} />
				<DeleteIcon action={() => ConfirmDestroy(rowData)} />
			</div>
		)
	}
	const openCreateOrEditModel = () => {
		setEditMode(false)
		currentVisit.current = null
		setShowCreateModal(true)
	}
	// @ts-expect-error
	const allowExpansion = (rowData: IVisit) => rowData?.participants?.length > 0 || false

	const rowExpansionTemplate = (data: IVisit) => {
		return (
			<div className='p-3'>
				{/* <h2 className='text-lg font-semibold'></h2> */}
				<DataTable
					size='small'
					dataKey='id'
					className='!overflow-hidden   !border-none'
					responsiveLayout='scroll'
					value={data.participants}>
					<Column
						field='fullName'
						body={(data) => <span>{data.fullName} </span>}
						header='Nombre'
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
						sortable
					></Column>
					<Column
						field='phone'
						body={(data) => <span>{data.phone} </span>}
						header='Celular'
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
					></Column>
					<Column
						field='email'
						body={(data) => <span>{data.email} </span>}
						header='Email'
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
					></Column>
				</DataTable>
			</div>

		)

	}

	if (isLoading) return <Loading />
	if (isError) return <RequestError error={error} />

	return (
		<div className='container m-auto  flex sm:mx-0  flex-col justify-center sm:justify-center'>
			<HeaderData action={openCreateOrEditModel} text='Visitas' />
			{data.data.length > 0 ? (
				<>
					<CustomInput
						onChange={(val) => onGlobalFilterChange(val)}
						className=' w-auto mx-2 sm:mx-0 sm:w-96'
						initialValue={globalFilterValue}
						placeholder='Buscar vista por nombre, teléfono o dirección'
						type='search'
					/>
					<Box className='!p-0 !overflow-hidden !border-none sm:mx-0   mb-4'>
						<DataTable
							size='small'
							emptyMessage='Aún no hay visita'
							className='!overflow-hidden   !border-none'
							value={data?.data}
							filters={filters}
							globalFilterFields={['fullName', 'phone', 'Property.street']}
							dataKey='id'
							expandedRows={expandedRows}
							rowExpansionTemplate={rowExpansionTemplate}
							onRowToggle={(e: any) => setExpandedRows(e.data)}
							// paginator
							// rows={10}
							// paginatorLeft={<RefreshData action={refetch} />}
							// paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
							// currentPageReportTemplate='{first} al {last} de {totalRecords}'
							responsiveLayout='scroll'
						>
							<Column
								expander={allowExpansion}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className={`dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 `}
								style={{ width: '0.5rem' }}
							/>
							<Column
								header='Dirección'
								body={(data) => (
									<span>
										{data.Property?.street} {data.Property?.number} {data.Property?.floor}-{data.Property?.dept}
									</span>
								)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>

							<Column
								field='date'
								header='Fecha Inicio'
								body={(data) => <span>{formatDate(data.date)}</span>}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='participants.length'
								header='Cant. Visitores'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 !text-center'
							/>


							<Column
								field='description'
								header='Nota'
								body={(data) => (
									<span title={data.description}>
										{data.description.slice(0, 60)} {data.description.length > 60 ? '...' : ''}
									</span>
								)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600'
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
				<EmptyData text='Aún no hay visita ' />
			)}

			{isFetching && (<Loading h={40} w={40} />)}

			<DeleteModal
				show={show}
				savingOrUpdating={savingOrUpdating}
				setShow={setShow}
				destroy={() => destroy(currentVisit.current?.id!)}
				text={`${currentVisit.current?.fullName}`}
			/>


			<CreateModal
				show={addVisitor}
				closeModal={closeAddVisitor}
				overlayClick={false}
				className=''
				titleText={`Agregar persona`}
			>
				<form action="" onSubmit={handleAddNewVistor}>
					<div>
						<CustomInput
							placeholder='Juan jose'
							initialValue={XfullName}
							onChange={(value) => VhandleInputChange(value, 'fullName')}
							maxLength={100}
							label='Nombre Completo'
							name=''
							required
						/>
						<CustomInput
							placeholder='3410101010'
							initialValue={Xphone}
							onChange={(value) => VhandleInputChange(value, 'phone')}
							maxLength={20}
							label='Télefono'
							required
						/>
						<CustomInput
							placeholder='example@gmail.com'
							initialValue={Xemail}
							onChange={(value) => VhandleInputChange(value, 'email')}
							maxLength={100}
							label='Email'
							required
						/>
					</div>
					<FormActionBtns savingOrUpdating={addingNewVisitor} onClose={closeAddVisitor} />
				</form>

			</CreateModal>

			<CreateModal
				show={showCreateModal}
				closeModal={closeCreateModal}
				overlayClick={false}
				className='sm:min-w-[350px] max-w-2xl'
				titleText={`${editMode ? 'Editar' : 'Agendar'}   visita`}
			>
				<form onSubmit={handleSave} 				>

					<fieldset className=''>
						<label htmlFor='PropertyId'>Propiedad</label>
						<Dropdown
							value={PropertyId}
							onChange={(e) => handleInputChange(e.value, 'PropertyId')}
							options={propertyQuery.data?.data}
							optionLabel='street'
							showClear
							filterPlaceholder='Busca propiedad'
							optionValue='id'
							filterBy='street,number,dept,floor'
							placeholder='elije una propiedad'
							// required
							filter
							valueTemplate={(data, props) => {
								if (!data) return props.placeholder
								return (
									<span>
										{/* {data.PropertyType.description} */}
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

					<FieldsetGroup>
						{/* <CustomInput
							placeholder='Juan jose'
							initialValue={fullName}
							onChange={(value) => handleInputChange(value, 'fullName')}
							maxLength={100}
							label='Nombre Completo'
							name=''
							required
							hasError={errors?.fullName}
							errorText='El nombre es obligatorio.'
						/>
						<CustomInput
							placeholder='3410101010'
							initialValue={phone}
							onChange={(value) => handleInputChange(value, 'phone')}
							maxLength={20}
							label='Télefono'
							required
							hasError={errors?.phone}
							errorText='El télefono es obligatorio.'
						/> */}
						{/* <CustomInput
							placeholder='example@gmail.com'
							initialValue={email}
							onChange={(value) => handleInputChange(value, 'email')}
							maxLength={100}
							label='Email'
							required
							hasError={errors?.email}
							errorText='El email es obligatorio.'
						/> */}
					</FieldsetGroup>
					{
						otherVistors.length > 0 && (
							<div className="flex flex-col gap-y-4 mt-4   relative">
								{
									otherVistors?.map((vis: IVisitor) => (
										<div className='relative' key={vis.id}>
											<div className="absolute top-1 right-1">
												<DeleteIcon action={() => deleteVisitor(vis)} />
											</div>
											<div className="flex items-center !border !border-gray-300 justify-between  shadow  dark:!border-slate-600 p-1 px-2 ">
												<div title={vis.fullName} className='w-[220px] truncate '>{vis.fullName}</div>
												<div className='w-[220px] '>{vis.phone}</div>
												<div className='w-[220px] '>{vis.email}</div>
											</div>
										</div>

									))
								}
							</div>
						)
					}
					<div className="add-more-visitors w-full grid items-center  hover:border-brand2 mt-2 border border-gray-400 bg-transparent  border-dashed ">
						<button type='button' className='btn !bg-transparent dark:text-slate-400 hover:!text-blue-400 ' onClick={() => setAddVisitor(true)}>Agregar</button>
					</div>


					<FieldsetGroup>
						<CustomInput
							placeholder='Fecha visita'
							type='datetime-local'
							initialValue={date}
							onChange={(value) => handleInputChange(value, 'date')}
							label='Fecha'
							required
							hasError={errors?.date}
							errorText='La fecha es obligatoria.'
						/>
					</FieldsetGroup>
					<div className="flex flex-col justify-between">

						<CustomTextArea
							placeholder='Puede llegar tarde el inquilino'
							initialValue={description}
							onChange={(value) => handleInputChange(value, 'description')}
							label='Nota'
							maxLength={255}
							optional
						/>
						<div className='items-end self-end'>{description.length}/255</div>
					</div>
					<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
				</form>
			</CreateModal>
		</div>
	)
}

export default Visits
