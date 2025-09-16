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
import RequestError from '../../components/RequestError'
import FieldsetGroup from '../../components/FieldsetGroup'
import { IPerson } from '../../interfaces/Iowners'
import { useOwners } from '../../hooks/useOwners'
import { Dropdown } from 'primereact/dropdown'
import { provinces } from '../../api/provinces'
import { FilterMatchMode } from 'primereact/api'
import CloseOnClick from '../../components/CloseOnClick'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import CustomTextArea from '../../components/CustomTextArea'
import FormActionBtns from '../../components/FormActionBtns'
import HeaderData from '../../components/HeaderData'
import BoxContainerPage from '../../components/BoxContainerPage'

const Owners = () => {
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [show, setShow] = useState(false)
	const [savingOrUpdating, setSavingOrUpdating] = useState(false)
	const { values, handleInputChange, reset, updateAll } = useForm({
		fullName: '',
		email: '',
		phone: '',
		fixedPhone: '',
		cuit: '',
		province: '',
		city: '',
		address: '',
		codePostal: '',
		obs: '',
		commision: 0,
	})
	const { fullName, email, phone, cuit, province, city, address, codePostal, obs, fixedPhone, commision } = values
	const [globalFilterValue, setGlobalFilterValue] = useState('')
	const [errors, setErrors] = useState<any>()
	const [editMode, setEditMode] = useState(false)
	const [cities, setCities] = useState([])
	const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>()

	const [filters, setFilters] = useState({
		global: { value: null, matchMode: FilterMatchMode.CONTAINS },
		fullName: { value: null, matchMode: FilterMatchMode.CONTAINS },
		cuit: { value: null, matchMode: FilterMatchMode.CONTAINS },
	})

	const currentOwner = useRef<IPerson | null>()
	const { showAndHideModal } = useShowAndHideModal()
	const { data, isError, isLoading, error, isFetching, refetch } = useOwners()

	const edit = (data: IPerson) => {
		// @ts-ignore
		updateAll({ ...data })
		getCitiesByProvinces(data.province)
		setShowCreateModal(true)
		setEditMode(true)
		currentOwner.current = data
	}

	const ConfirmDestroy = (data: IPerson) => {
		setShow(!show)
		currentOwner.current = data
	}



	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		const { error, ok } = validateForm({ ...values }, ['obs', 'fixedPhone', 'codePostal', 'city', 'province'])
		setErrors(error)
		if (!ok) return false
		if (editMode) {
			try {
				setSavingOrUpdating(true)
				const res = await http.put(`/owners/${currentOwner.current?.id}`, values)
				if (res.data.ok) {
					data?.data &&
						(data.data = data?.data.map((z) => {
							if (z.id === currentOwner.current?.id) {
								z = {
									fullName: values.fullName,
									email: values.email,
									phone: values.phone,
									cuit: values.cuit,
									province: values.province,
									city: values.city,
									address: values.address,
									codePostal: values.codePostal,
									fixedPhone: values.fixedPhone,
									commision: values.commision,
									obs: values.obs,
									id: currentOwner.current.id,
									createdAt: currentOwner.current.createdAt,
									updatedAt: currentOwner.current.updatedAt,
								}
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
				const res = await http.post('/owners', values)
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

	const destroy = async (id: number) => {
		try {
			setSavingOrUpdating(true)
			const res = await http.delete('/owners/' + id)
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
	const closeCreateModal = () => {
		reset()
		setShowCreateModal(false)
		setErrors({})
	}
	const onGlobalFilterChange = (val: any) => {
		const value = val
		let _filters = { ...filters }
		_filters['global'].value = value
		setFilters(_filters)
		setGlobalFilterValue(value)
	}
	const actionBodyTemplate = (rowData: any) => {
		return (
			<div className='flex gap-x-3 items-center justify-center'>
				<EditIcon action={() => edit(rowData)} />
				<DeleteIcon action={() => ConfirmDestroy(rowData)} />
			</div>
		)
	}

	const getCitiesByProvinces = async (prov: string) => {
		const resp = await fetch(
			`https://apis.datos.gob.ar/georef/api/localidades?provincia=${prov}&campos=nombre&max=1000`
		)
		const c = await resp.json()
		setCities(c.localidades)
	}

	const rowExpansionTemplate = (data: IPerson) => {
		return (
			<div className='p-3'>
				<h5>Propiedades de {data.fullName}</h5>
				<DataTable
					size='small'
					dataKey='id'
					className='!overflow-hidden   !border-none'
					responsiveLayout='scroll'
					value={data.Properties}>
					<Column
						field='PropertyType.description'
						header='Tipo Propiedad'
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
						sortable
					></Column>
					<Column
						header='Dirección'
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
						body={(data) => (
							<span>
								{data.street} {data.number} {data.floor}-{data.dept}
							</span>
						)}
						sortable
					></Column>
					<Column
						header='Estado'
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
						body={(data) => (
							<span className={`font-bold ${data.state === 'Libre' ? 'text-green-500' : 'text-red-500'}`}>
								{data.state}{' '}
							</span>
						)}
					></Column>
					<Column
						headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
						className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
						field='isFor'
						header='Para'
					></Column>
				</DataTable>
			</div>
		)
	}
	// @ts-expect-error
	const allowExpansion = (rowData: IPerson) => rowData.Properties?.length > 0


	const openCreateOrEditModel = () => {
		setEditMode(false)
		currentOwner.current = null
		setShowCreateModal(true)
	}
	if (isLoading) return <Loading />
	if (isError) return <RequestError error={error} />

	return (
		<BoxContainerPage >

			<HeaderData action={openCreateOrEditModel} text='Propietarios' />
			{data.data?.length > 0 ? (
				<>
					<CustomInput
						onChange={(val) => onGlobalFilterChange(val)}
						className=' w-auto mx-2 sm:mx-0 sm:w-96'
						initialValue={globalFilterValue}
						placeholder='Buscar propietario'
						type='search'
					/>
					<Box className={`!p-0 !overflow-hidden !border-none sm:mx-0   mb-4 `}>
						<DataTable
							expandedRows={expandedRows}
							onRowToggle={(e: any) => setExpandedRows(e.data)}
							rowExpansionTemplate={rowExpansionTemplate}
							size='small'
							emptyMessage='Aún no hay propietario'
							className='!overflow-hidden !border-none'
							value={data?.data}
							filters={filters}
							globalFilterFields={['fullName', 'cuit']}
							// rows={10}
							// paginator
							// paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
							// currentPageReportTemplate='{first} al {last} de {totalRecords}'
							// paginatorLeft={<RefreshData action={refetch} />}
							dataKey='id'
							responsiveLayout='scroll'
						>
							<Column
								expander={allowExpansion}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								style={{ width: '0.5rem' }}
							/>
							<Column
								field='fullName'
								header='Nombre'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='cuit'
								header='Cuit/Cuil'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='email'
								header='Correo'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='phone'
								header='Celular'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='address'
								body={(data) => (
									<span>
										{data.city || '-'}, {data.address}
									</span>
								)}
								header='Dirección'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='commision'
								header='Comisión'
								body={(data) => (<span> {data.commision}% </span>)}
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
				<EmptyData text='Aún no hay propietario ' />
			)}

			{isFetching && (<Loading h={40} w={40} />)}

			<DeleteModal
				show={show}
				savingOrUpdating={savingOrUpdating}
				setShow={setShow}
				destroy={() => destroy(currentOwner.current?.id!)}
				text={`${currentOwner.current?.fullName} | ${currentOwner.current?.cuit}`}
			/>

			<CreateModal
				show={showCreateModal}
				className='max-w-[750px]'
				closeModal={closeCreateModal}
				titleText={`${editMode ? 'Editar' : 'Crear'} propietario`}
			>
				<form
					onSubmit={handleSave}
					className={`${savingOrUpdating && 'disabled-all'}`}
				>
					<CloseOnClick action={closeCreateModal} />
					<FieldsetGroup>
						<CustomInput
							placeholder='Juan Jose'
							initialValue={fullName || ''}
							onChange={(value) => handleInputChange(value, 'fullName')}
							maxLength={100}
							label='Nombre Completo'
							required
							hasError={errors?.fullName}
							errorText='El nombre es obligatorio.'
						/>
						<CustomInput
							placeholder='example@gmail.com'
							initialValue={email || ''}
							type='email'
							onChange={(value) => handleInputChange(value, 'email')}
							maxLength={255}
							label='Email'
							required
							hasError={errors?.email}
							errorText='El correo es obligatorio.'
						/>
					</FieldsetGroup>

					<FieldsetGroup>
						<FieldsetGroup className='w-full sm:w-[50%]'>
							<CustomInput
								placeholder='20909239120'
								initialValue={cuit || ''}
								onChange={(value) => handleInputChange(value, 'cuit')}
								maxLength={255}
								label='Cuit/Cuil'
								required
								hasError={errors?.cuit}
								errorText='El cuit/cuil es obligatorio.'
							/>
							<CustomInput
								placeholder='10'
								type='number'
								initialValue={commision || ''}
								onChange={(value) => handleInputChange(value, 'commision')}
								label='%Comision'
								max={100}
								min={0}
								required
								hasError={errors?.commision}
								errorText='La comision es obligatoria.'
							/>
						</FieldsetGroup>

						<FieldsetGroup className='w-full sm:w-[50%]'>
							<CustomInput
								placeholder='3417207882'
								initialValue={phone || ''}
								onChange={(value) => handleInputChange(value, 'phone')}
								maxLength={20}
								label='Teléfono'
								required
								hasError={errors?.phone}
								errorText='El teléfono es obligatorio.'
							/>
							<CustomInput
								placeholder='3417207882'
								initialValue={fixedPhone || ''}
								onChange={(value) => handleInputChange(value, 'fixedPhone')}
								maxLength={20}
								label='Tel. fijo'
								optional
							/>
						</FieldsetGroup>
					</FieldsetGroup>

					<FieldsetGroup>
						<fieldset className=''>
							<label htmlFor='province'>
								Provincia <span className='text-xs opacity-50'>(opcional)</span>{' '}
							</label>
							<Dropdown
								value={province}
								onChange={(e) => {
									handleInputChange(e.value, 'province')
									getCitiesByProvinces(e.value)
								}}
								filterPlaceholder='santa fe'
								options={provinces}
								optionValue='nombre'
								optionLabel='nombre'
								placeholder='elije una provincia'
								filter
								className='h-[42px] items-center'
							/>
						</fieldset>
						<fieldset className=''>
							<label htmlFor='city'>
								Ciudad <span className='text-xs opacity-50'>(opcional)</span>{' '}
							</label>
							<Dropdown
								value={city}
								onChange={(e) => handleInputChange(e.value, 'city')}
								options={cities}
								filterPlaceholder='rosario'
								optionLabel='nombre'
								optionValue='nombre'
								placeholder='elije una ciudad'
								filter
								className='h-[42px] items-center'
							/>
						</fieldset>
					</FieldsetGroup>

					<FieldsetGroup>
						<CustomInput
							placeholder='Sarmiento 1247'
							initialValue={address || ''}
							onChange={(value) => handleInputChange(value, 'address')}
							maxLength={100}
							label='Dirección'
							required
							hasError={errors?.address}
							errorText='La dirección es obligatoria.'
						/>

						<CustomInput
							placeholder='2000'
							initialValue={codePostal || ''}
							onChange={(value) => handleInputChange(value, 'codePostal')}
							label='Código Postal'
							optional
						/>
					</FieldsetGroup>
					<CustomTextArea
						placeholder='escribe una observación o nota de algo...'
						initialValue={obs || ''}
						onChange={(value) => handleInputChange(value, 'obs')}
						label='Observación'
						optional
						className='h-16'
					/>
					<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
				</form>
			</CreateModal>
		</BoxContainerPage>

	)
}

export default Owners
