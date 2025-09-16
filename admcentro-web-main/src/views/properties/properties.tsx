import React, { useEffect, useRef, useState } from 'react'
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
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import FieldsetGroup from '../../components/FieldsetGroup'
import { useOwners } from '../../hooks/useOwners'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode, } from 'primereact/api'
import { Iproperty } from '../../interfaces/Iproperties'
import { useProperties } from '../../hooks/useProperties'
import CustomTextArea from '../../components/CustomTextArea'
import { useZones } from '../../hooks/useZones'
import { usePropertyTypes } from '../../hooks/usePropertyTypes'
import CloseOnClick from '../../components/CloseOnClick'
import SeeIcon from '../../components/icons/SeeIcon'
import { useParams } from 'react-router-dom'
import { BiCopy, BiShareAlt } from 'react-icons/bi'
import { copyToClipboard } from '../../helpers/general'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import HeaderData from '../../components/HeaderData'
import BoxContainerPage from '../../components/BoxContainerPage'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import { validateForm } from '../../helpers/form'

const Properties = () => {
	const { isFor: isForParam } = useParams()

	const [showCreateModal, setShowCreateModal] = useState(false)
	const [show, setShow] = useState(false)
	const { values, handleInputChange, reset, updateAll } = useForm({
		ZoneId: 0,
		PropertyTypeId: 0,
		OwnerId: 0,
		street: '',
		number: '',
		floor: '',
		dept: '',
		isFor: '',
		description: '',
		nroPartWater: '',
		nroPartMuni: '',
		nroPartAPI: '',
		nroPartGas: '',
		folderNumber: '',
	})
	const {
		ZoneId,
		OwnerId,
		street,
		number,
		floor,
		dept,
		description,
		isFor,
		nroPartWater,
		nroPartMuni,
		nroPartAPI,
		nroPartGas,
		folderNumber,
		PropertyTypeId,
	} = values
	const currentProperty = useRef<Iproperty | null>()
	const [globalFilterValue, setGlobalFilterValue] = useState('')
	const [errors, setErrors] = useState<any>()
	const [editMode, setEditMode] = useState(false)
	const [viewMode, setViewMode] = useState(false)
	const [savingOrUpdating, setSavingOrUpdating] = useState(false)
	const [filters, setFilters] = useState({
		global: { value: null, matchMode: FilterMatchMode.CONTAINS },
		'Owner.fullName': { value: null, matchMode: FilterMatchMode.CONTAINS },
		'PropertyType.description': { value: null, matchMode: FilterMatchMode.CONTAINS },
		'Zone.name': { value: null, matchMode: FilterMatchMode.CONTAINS },
		street: { value: null, matchMode: FilterMatchMode.CONTAINS },
	})
	const { showAndHideModal } = useShowAndHideModal()

	const { data, isError, isLoading, error, isFetching, refetch } = useProperties(isForParam !== undefined ? `isFor=${isForParam}` : '')
	const zoneQuery = useZones()
	const propietyType = usePropertyTypes()
	const ownerQuery = useOwners()
	useEffect(() => {

		updateAll({ ...values, isFor: isForParam !== undefined ? isForParam : '' })
		return () => {

		}
	}, [isForParam])

	const edit = (data: Iproperty) => {
		updateAll({ ...data })
		setViewMode(false)
		setShowCreateModal(true)
		setEditMode(true)
		currentProperty.current = data
	}

	const ConfirmDestroy = (data: Iproperty) => {
		setViewMode(false)
		setShow(!show)
		currentProperty.current = data
	}

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const { error, ok } = validateForm({ ...values }, ['state', 'deletedAt', 'dept', 'floor', 'nroPartWater', 'nroPartMuni', 'nroPartAPI', 'nroPartGas', 'description'])
		setErrors(error)
		if (!ok) return false

		if (editMode) {
			try {
				setSavingOrUpdating(true)
				const res = await http.put(`/properties/${currentProperty.current?.id}`, values)
				if (res.data.ok) {
					refetch()
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
				const res = await http.post('/properties', values)
				if (res.data.ok) {
					refetch()
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
			const res = await http.delete('/properties/' + id)
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

	const ViewItem = (data: Iproperty) => {
		updateAll(data)
		setViewMode(true)
		currentProperty.current = data
		setShowCreateModal(true)
	}

	const handleShareProperty = (data: Iproperty) => {
		copyToClipboard(
			`
${'Tipo de inmueble: '} \n${data.PropertyType?.description}

${'Tipo de operacion : '} \n${data.isFor}

Descripción del inmueble \n${data.description}
`)
		showAndHideModal('Copiado', 'Se copio los datos del inmueble al portapapeles')
		currentProperty.current = data
	}

	const actionBodyTemplate = (rowData: Iproperty) => {
		return (
			<div className='flex gap-x-3 items-center justify-center'>
				{isForParam && (<BiCopy size={22} onClick={() => handleShareProperty(rowData)} />)}
				<SeeIcon action={() => ViewItem(rowData)} />
				<EditIcon action={() => edit(rowData)} />
				<DeleteIcon action={() => ConfirmDestroy(rowData)} />
			</div>
		)
	}

	const openCreateOrEditModel = () => {
		setEditMode(false)
		setViewMode(false)
		currentProperty.current = null
		setShowCreateModal(true)
	}
	if (isLoading) return <Loading />
	if (isError) return <RequestError error={error} />

	return (
		<BoxContainerPage >
			<HeaderData action={openCreateOrEditModel} text={`Propiedades ${isForParam ? ` en   ${isForParam}` : ''}`} />
			{data?.data?.length > 0 ? (
				<>
					<CustomInput
						onChange={(val) => onGlobalFilterChange(val)}
						className=' w-auto mx-2 sm:mx-0 sm:w-96'
						initialValue={globalFilterValue}
						placeholder='Buscar propiedad'
						type='search'
					/>
					<Box className='!p-0 !overflow-hidden !border-none sm:mx-0   mb-4 '>
						<DataTable
							size='small'
							emptyMessage='Aún no hay propiedad'
							className='!overflow-hidden   !border-none'
							value={data?.data}
							filters={filters}
							globalFilterFields={['PropertyType.description', 'Owner.fullName', 'Zone.name', 'street']}
							// paginator
							// rows={10}
							// paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
							// currentPageReportTemplate='{first} al {last} de {totalRecords}'
							// paginatorLeft={<RefreshData action={refetch} />}
							dataKey='id'
							responsiveLayout='scroll'
						>
							<Column
								field='PropertyType.description'
								header='Tipo Propiedad'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='Owner.fullName'
								header='Propietario'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='street'
								header='Dirección'
								body={(data) => (<span> {data.street} {data.number} {data.floor}-{data.dept} </span>)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='folderNumber'
								header='Nro. Carpeta'
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
								sortable
							/>
							<Column
								field='Zone.name'
								header='Zona'
								sortable
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='state'
								header='Estado'
								sortable
								body={(data) => (
									<span className={`font-bold ${data.state === 'Libre' ? 'text-green-500' : 'text-red-400'}`}>
										{data.state}
									</span>
								)}
								headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
								className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
							/>
							<Column
								field='isFor'
								header='Para'
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
				<EmptyData text={`Aún no hay propiedad  ${isForParam ? ` en ${isForParam}` : ''} `} />
			)}

			{isFetching && (<Loading h={40} w={40} />)}

			<DeleteModal
				show={show}
				setShow={setShow}
				savingOrUpdating={savingOrUpdating}
				destroy={() => destroy(currentProperty.current?.id!)}
				text={`${currentProperty.current?.street} ${currentProperty.current?.number} ${currentProperty.current?.floor} ${currentProperty.current?.dept} de ${currentProperty.current?.Owner?.fullName} `}
			/>

			<CreateModal
				show={showCreateModal}
				closeModal={closeCreateModal}
				overlayClick={viewMode}
				className=' max-w-[650px] sm:w-[600px] w-fit'
				titleText={`${editMode ? 'Editar' : viewMode ? ' Ver  ' : 'Crear'}  propiedad `}
			>
				<form
					onSubmit={handleSave}
					className={`${viewMode && 'disabled-all'}`}
				>
					{!viewMode && <CloseOnClick action={closeCreateModal} />}
					<FieldsetGroup>
						<FieldsetGroup className='w-full sm:w-[50%]'>
							<CustomInput
								placeholder='Sarmiento'
								initialValue={street || ''}
								onChange={(value) => handleInputChange(value, 'street')}
								maxLength={100}
								label='Calle'
								required
								hasError={errors?.street}
								errorText='La calle es obligatoria.'
							/>
							<CustomInput
								placeholder='1247'
								initialValue={number || ''}
								maxLength={5}
								onChange={(value) => handleInputChange(value, 'number')}
								label='Número'
								required
								hasError={errors?.number}
								errorText='El número es obligatorio.'
							/>

						</FieldsetGroup>
						<FieldsetGroup className='w-full sm:w-[50%]'>
							<CustomInput
								placeholder='10'
								maxLength={2}
								label='Piso'
								optional
								initialValue={floor || ''}
								onChange={(value) => handleInputChange(value, 'floor')}
							/>
							<CustomInput
								placeholder='02,B'
								label='Depto'
								optional
								maxLength={2}
								initialValue={dept || ''}
								onChange={(value) => handleInputChange(value, 'dept')}
							/>
						</FieldsetGroup>
					</FieldsetGroup>
					<FieldsetGroup>
						<FieldsetGroup className='w-full sm:w-[50%]'>
							<fieldset className=''>
								<label htmlFor='ZoneId'>Zona </label>
								<Dropdown
									value={ZoneId}
									onChange={(e) => handleInputChange(e.value, 'ZoneId')}
									options={zoneQuery.data?.data}
									optionLabel='name'
									filterPlaceholder='Busca zona'
									optionValue='id'
									placeholder='elije una zona'
									filter
									className='h-[42px] items-center w-full sm:w-[125px] !border-gray-200 shadow'
								/>
								{errors?.ZoneId && <FormError text='La zona es obligatoria.' />}
							</fieldset>
							<CustomInput
								initialValue={folderNumber ?? ''}
								onChange={(value) => handleInputChange(value, 'folderNumber')}
								placeholder='1000'
								className='h-[42px] items-center '
								maxLength={10}
								label='Nro carpeta'
								hasError={errors?.folderNumber}
								errorText='El número de carpeta es obligatorio.'
								required
							/>
						</FieldsetGroup>
						<FieldsetGroup className='w-full sm:w-[50%]'>
							<fieldset className=''>
								<label htmlFor='ZoneId'>Tipo de propiedad </label>
								<Dropdown
									value={PropertyTypeId}
									onChange={(e) => handleInputChange(e.value, 'PropertyTypeId')}
									options={propietyType.data?.data}
									optionLabel='description'
									filterPlaceholder='Busca tipo de propiedad'
									optionValue='id'
									placeholder='elije un tipo de propiedad'
									filter
									className='h-[42px] items-center !border-gray-200 shadow '
								/>
								{errors?.PropertyTypeId && <FormError text='El tipo de propiedad es obligatorio.' />}
							</fieldset>
						</FieldsetGroup>
					</FieldsetGroup>
					<FieldsetGroup>
						<FieldsetGroup className='w-full sm:w-[80%]'>
							<fieldset>
								<label htmlFor='OwnerId'>Propietario</label>
								<Dropdown
									value={OwnerId}
									onChange={(e) => handleInputChange(e.value, 'OwnerId')}
									options={ownerQuery.data?.data}
									optionLabel='fullName'
									filterBy='fullName,cuit'
									filterPlaceholder='Busca propietario por nombre o cuit'
									optionValue='id'
									placeholder='elije un propietario'
									filter
									valueTemplate={(data, props) => {
										if (!data) return props.placeholder
										return (<span> {data.fullName} | {data.cuit} </span>)
									}}
									itemTemplate={(data) => (<span> {data.fullName} | {data.cuit} </span>)}
									className='h-[42px] items-center !border-gray-200 shadow '
								/>
								{errors?.OwnerId && <FormError text='El propietario es obligatorio.' />}
							</fieldset>
						</FieldsetGroup>

						<fieldset className='w-full sm:w-[20%]'>
							<label htmlFor='isFor'>Para</label>
							<Dropdown
								value={isFor}
								onChange={(e) => handleInputChange(e.value, 'isFor')}
								options={['Alquiler', 'Venta']}
								placeholder='elije una opción'
								className='h-[42px] items-center !border-gray-200 shadow '
							/>
							{errors?.isFor && <FormError text='Este campo es obligatorio.' />}
						</fieldset>
					</FieldsetGroup>
					<FieldsetGroup>
						<CustomInput
							initialValue={nroPartMuni ?? ''}
							onChange={(value) => handleInputChange(value, 'nroPartMuni')}
							placeholder='000000000'
							label='Nro Part. TGI'
							optional
							className='h-[42px] items-cente '
						/>
						<CustomInput
							initialValue={nroPartAPI ?? ''}
							onChange={(value) => handleInputChange(value, 'nroPartAPI')}
							placeholder='000000000'
							label='Nro Part. API'
							optional
							className='h-[42px] items-cente '
						/>
					</FieldsetGroup>
					<FieldsetGroup>
						<CustomInput
							initialValue={nroPartWater ?? ''}
							onChange={(value) => handleInputChange(value, 'nroPartWater')}
							placeholder='000000000'
							label='Nro Part. Agua'
							optional
							className='h-[42px] items-center '
						/>
						<CustomInput
							initialValue={nroPartGas ?? ''}
							onChange={(value) => handleInputChange(value, 'nroPartGas')}
							placeholder='000000000'
							label='Nro Part. GAS'
							optional
							className='h-[42px] items-cente '
						/>
					</FieldsetGroup>
					<CustomTextArea
						placeholder='Escribe una descripción para esa propiedad'
						initialValue={description || ''}
						label='Descripción'
						optional
						onChange={(value) => handleInputChange(value, 'description')}
					/>
					{!viewMode && (<FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />)}
				</form>
				{viewMode && <CloseOnClick action={closeCreateModal} />}
			</CreateModal>
		</BoxContainerPage>
	)
}

export default Properties
