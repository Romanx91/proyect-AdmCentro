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
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { useProperties } from '../../hooks/useProperties'
import CustomTextArea from '../../components/CustomTextArea'
import { useContracts } from '../../hooks/useContracts'
import { useClients } from '../../hooks/useClients'
import AddGuarantee from '../../components/icons/AddGuarantee'
import SeeIcon from '../../components/icons/SeeIcon'
import { Contract, IHistorialPrice } from '../../interfaces/Icontracts'
import { useNavigate } from 'react-router-dom'
import { TbReportMoney } from 'react-icons/tb'
import CloseOnClick from '../../components/CloseOnClick'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import { validateForm } from '../../helpers/form'
import { diferenceBetweentwoDatesInYears, diffenceBetweenDates, formatDateDDMMYYYY } from '../../helpers/date'
import BoxContainerPage from '../../components/BoxContainerPage'
import DropDownIcon from '../../components/DropDownIcon'
import { formatPrice } from '../../helpers/numbers'
import { BsInfo } from 'react-icons/bs'
import { FiAlertCircle } from 'react-icons/fi'

export interface Iassurance {
  fullName: string
  email: string
  phone: string
  cuit: string
  address: string
  obs: string
  ContractId: number | null
  id: number
}
const Contracts = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddGuaranteeModal, setShowAddGuaranteeModal] = useState(false)
  const [showAddEventualityModal, setShowAddEventualityModal] = useState(false)
  const [show, setShow] = useState(false)
  const [assurances, setAssurances] = useState<Iassurance[]>([])
  const [assuranceItem, setAssuranceItem] = useState<Iassurance>({
    fullName: '',
    email: '',
    address: '',
    obs: '',
    phone: '',
    cuit: '',
    ContractId: 0,
    id: 0
  })
  const [editing, setEditing] = useState(false)
  const [addGaranteeBox, setAddGaranteeBox] = useState(false)
  const { showAndHideModal } = useShowAndHideModal()
  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const [showFinishContractModal, setShowFinishContractModal] = useState(false)
  const { values, handleInputChange, reset, updateAll } = useForm({
    ClientId: 0,
    PropertyId: 0,
    startDate: '',
    endDate: '',
    description: '',
    deposit: 0,
    booking: 0,
    amount: 0,
    admFeesPorc: 2,
    currency: 'ARS',
    paymentType: 'Fijo',
    adjustmentMonth: 12
  })
  const {
    ClientId,
    admFeesPorc,
    currency,
    PropertyId,
    startDate,
    endDate,
    adjustmentMonth,
    paymentType,
    description,
    deposit,
    booking,
    amount
  } = values
  const {
    values: Gvalues,
    handleInputChange: GhandleInputChange,
    reset: Greset,
    updateAll: GupdateAll
  } = useForm({
    fullName: '',
    email: '',
    phone: '',
    cuit: '',
    address: '',
    obs: '',
    ContractId: 0,
    id: 0
  })
  const { values: FCvalues, motive, handleInputChange: FChandleInputChange, reset: FCreset } = useForm({ motive: '' })

  const { fullName, email, phone, cuit, address, obs } = Gvalues

  const {
    clientAmount,
    ownerAmount,
    description: descEvent,
    expiredDate,
    values: Evalues,
    handleInputChange: EhandleInputChange,
    reset: Ereset
  } = useForm({
    ContractId: 0,
    clientAmount: 0.0,
    ownerAmount: 0.0,
    expiredDate: new Date().toISOString().slice(0, 10),
    description: ''
  })

  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [errors, setErrors] = useState<any>()
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'Client.fullName': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'PropertyType.description': { value: null, matchMode: FilterMatchMode.CONTAINS }
  })
  const navigate = useNavigate()
  const currentContract = useRef<Contract | null>()

  const { data, isError, isLoading, error, isFetching, refetch } = useContracts('?state=EN CURSO')
  const clientQuery = useClients()
  const propertyQuery = useProperties('state=Libre')

  const edit = (data: Contract) => {
    updateAll({ ...data })
    setAssurances(data.Assurances)
    setShowCreateModal(true)
    setEditMode(true)
    currentContract.current = data
  }
  const ConfirmDestroy = (data: Contract) => {
    setShow(!show)
    currentContract.current = data
  }
  const showAddGuarantee = (data: Contract) => {
    setShowAddGuaranteeModal(true)
    currentContract.current = data
    GhandleInputChange(data.id, 'ContractId')
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm({ ...values }, ['description', 'booking', 'deposit', 'motive'])
    setErrors(error)
    if (!ok) return false
    if (editMode) {
      try {
        setSavingOrUpdating(true)
        const res = await http.put(`/contracts/${currentContract.current?.id}`, { ...values })
        if (res.data.ok) {
          refetch()
          setAssurances([])
          setAddGaranteeBox(false)
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
        // remove the id attributes from assurances
        let newAssurances = assurances.map((a) => {
          // @ts-expect-error
          delete a.id
          return a
        })
        //
        const res = await http.post('/contracts', { ...values, assurances: newAssurances || [] })
        if (res.data.ok) {
          refetch()
          setAssurances([])
          setAddGaranteeBox(false)
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
      const res = await http.delete('/contracts/' + id)
      if (res.data.ok) {
        data?.data && (data.data! = data?.data.filter((z: any) => z.id !== id))
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
  // const destroyGuarantee = async (id: number) => {
  // 	try {
  // 		setSavingOrUpdating(true)
  // 		const res = await http.delete('/assurances/' + id)
  // 		if (res.data.ok) {
  // 			data?.data && (data.data! = data?.data.filter((z: any) => z.id !== id))
  // 			setShow(false)
  // 			showAndHideModal('Borrado', res.data.message)
  // 		} else {
  // 			showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
  // 		}
  // 	} catch (error: any) {
  // 		if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
  // 	} finally {
  // 		setSavingOrUpdating(false)
  // 	}
  // }
  const handleAddGuarantee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm({ ...Gvalues }, ['obs'])
    setErrors(error)
    if (!ok) return false
    try {
      setSavingOrUpdating(true)
      const res = await http.post('/assurances', Gvalues)
      if (res.data.ok) {
        Greset()
        refetch()
        setShowAddGuaranteeModal(false)
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
  const closeCreateModal = () => {
    reset()
    setShowCreateModal(false)
    setAddGaranteeBox(false)
    setErrors({})
  }
  const closeGuaranteeModal = () => {
    Greset()
    setShowAddGuaranteeModal(false)
    setErrors({})
  }
  const closeAddEventualitiesModal = () => {
    Ereset()
    setShowAddEventualityModal(false)
    setErrors({})
  }
  const onGlobalFilterChange = (val: any) => {
    const value = val
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const openModalAddEvent = (data: Contract) => {
    Ereset()
    currentContract.current = data
    EhandleInputChange(data.id, 'ContractId')
    setShowAddEventualityModal(true)
  }

  const finishContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setSavingOrUpdating(true)
      const res = await http.put(`/contracts/${currentContract.current?.id}/finish`, { motive: motive })
      if (res.data.ok) {
        refetch()
        closeFinishContractModal()
        showAndHideModal('Finalizado', res.data.message)
      } else {
        showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
      }
    } catch (error: any) {
      if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
    } finally {
      setSavingOrUpdating(false)
    }
  }

  const openFinishContractModal = (data: Contract) => {
    currentContract.current = data
    setShowFinishContractModal(true)
  }

  const closeFinishContractModal = () => {
    currentContract.current = null
    setShowFinishContractModal(false)
    FCreset()
  }

  const actionBodyTemplate = (rowData: Contract) => {
    return (
      <div className='flex gap-x-3 items-center justify-start'>
        {/* <SeeIcon action={() => navigate(`/contracts/${rowData.id}/${rowData.uuid}`)} /> */}
        {rowData.state !== 'Finalizado' && (
          <>
            <AddGuarantee q={rowData.Assurances.length} action={() => showAddGuarantee(rowData)} />
            <EditIcon action={() => edit(rowData)} />
            {/* <DeleteIcon action={() => ConfirmDestroy(rowData)} /> */}
          </>
        )}
        {/* <TbReportMoney size={25} title='Agregar Eventualidad' onClick={() => openModalAddEvent(rowData)} /> */}
        <button className='text-red-400 border border-red-500 px-2 rounded-full py-1' onClick={() => openFinishContractModal(rowData)}>
          {' '}
          Finalizar{' '}
        </button>
        {/* {
					(diffenceBetweenDates(rowData.endDate, new Date().toISOString().slice(0, 10)) >= 0 && rowData.state !== 'Finalizado') && (
					)
				} */}
      </div>
    )
  }

  const addAssurance = () => {
    const { error, ok } = validateForm({ ...assuranceItem }, ['obs', 'ContractId'])
    setErrors(error)
    if (!ok) return false
    let v: Iassurance[] | null = assurances
    if (assurances.find((a) => a.id === assuranceItem.id)) {
      v = assurances.filter((a) => a.id !== assuranceItem.id)
      setAssurances(v)
    }
    setAssurances([...v, { ...assuranceItem, id: Date.now() }])
    setAssuranceItem({
      fullName: '',
      email: '',
      address: '',
      obs: '',
      phone: '',
      cuit: '',
      ContractId: 0,
      id: 0
    })
    setEditing(false)
  }
  const removeAssurance = (item: Iassurance) => {
    setAssurances(assurances.filter((a) => a.id !== item.id))
  }
  const handleAddEventualities = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm({ ...Evalues })
    setErrors(error)
    if (!ok) return false
    try {
      setSavingOrUpdating(true)
      const res = await http.post('/eventualities', Evalues)
      if (res.data.ok) {
        Ereset()
        setShowAddEventualityModal(false)
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
  const openCreateOrEditModel = () => {
    propertyQuery.refetch()
    setEditMode(false)
    currentContract.current = null
    setShowCreateModal(true)
  }
  const contractExpired = (endDate: string) => diffenceBetweenDates(endDate, new Date().toISOString()) >= 0

  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage>
      <HeaderData action={openCreateOrEditModel} text='Contratos' />
      {data?.data?.length > 0 ? (
        <>
          <CustomInput
            onChange={(val) => onGlobalFilterChange(val)}
            className=' w-auto mx-2 sm:mx-0 sm:w-96'
            initialValue={globalFilterValue}
            placeholder='Buscar contrato'
            type='search'
          />
          <Box className='!p-0 !overflow-hidden !border-none sm:mx-0   mb-4 '>
            <DataTable
              size='small'
              emptyMessage='Aún no hay contrato'
              className='!overflow-hidden   !border-none '
              rowClassName={() => 'group-hover:!bg-gray-100 group  dark:group-hover:!bg-gray-800'}
              value={data?.data}
              filters={filters}
              globalFilterFields={['Property.street', 'Client.fullName']}
              // paginator
              // rows='10'
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={refetch} />}
              dataKey='id'
              responsiveLayout='scroll'
            >
              <Column
                field='Property.street'
                body={(data) => (
                  <span className={`${contractExpired(data.endDate) ? 'text-red-400' : ''}`}>
                    {data.Property.street} {data.Property.number} {data.Property.floor} {data.Property.dept}
                  </span>
                )}
                header='Propiedad'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='Property.folderNumber'
                header='Carpeta'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='Client.fullName'
                body={(data) => (
                  <span className={`${contractExpired(data.endDate) ? 'text-red-400' : ''}`}>
                    {data.Client.fullName} <span className='text-sm'> ({data.Client.cuit}) </span>
                  </span>
                )}
                header='Inquilino'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='startDate'
                header='Fecha inicio'
                body={(data) => (
                  <span className={`${contractExpired(data.endDate) ? 'text-red-400' : ''}`}> {formatDateDDMMYYYY(data.startDate)}</span>
                )}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='endDate'
                header='Fecha fin'
                body={(data) => (
                  <span className={`${contractExpired(data.endDate) ? 'text-red-400' : ''}`}>{formatDateDDMMYYYY(data.endDate)}</span>
                )}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='state'
                header='Estado'
                sortable
                body={(data) => (
                  <div className={`flex flex-col items-center `}>
                    <span
                      className={`${
                        data.state === 'En curso' && !contractExpired(data.endDate) ? 'text-green-500' : 'text-red-400 line-through'
                      }`}
                    >
                      {data.state}
                    </span>
                    {contractExpired(data.endDate) && (
                      <div
                        className='flex items-center justify-center gap-1 text-xs text-red-400'
                        title={`Vencido hace ${diffenceBetweenDates(data.endDate, new Date().toISOString())} días`}
                      >
                        <FiAlertCircle className='' />
                        <span>Vencido</span>
                      </div>
                    )}
                  </div>
                )}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />

              <Column
                header='Año'
                body={(data: Contract) => (
                  <span
                    className={`${
                      diferenceBetweentwoDatesInYears(data.startDate, new Date().toISOString().slice(0, 10)) === 3 &&
                      'text-yellow-500 font-bold'
                    }`}
                  >
                    {diferenceBetweentwoDatesInYears(data.startDate, new Date().toISOString().slice(0, 10)) || 1}
                  </span>
                )}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='adjustmentMonth'
                header='Ajuste'
                // body={(data) => <span>{formatDateDDMMYYYY(data.endDate)}</span>}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />

              <Column
                header='Monto Actual'
                body={(data: Contract) => {
                  return (
                    <div>
                      {data.currency}{' '}
                      {formatPrice(
                        data.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[data.PriceHistorials?.length - 1]
                          ?.amount
                      )}
                    </div>
                  )
                }}
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
        <EmptyData text='Aún no hay contrato' />
      )}

      {isFetching && <Loading h={40} w={40} />}

      <DeleteModal
        show={show}
        savingOrUpdating={savingOrUpdating}
        setShow={setShow}
        destroy={() => destroy(currentContract.current?.id!)}
        text={`${currentContract.current?.Client?.fullName} de la calle ${currentContract.current?.Property.street} ${currentContract.current?.Property.number}  ${currentContract.current?.Property.floor} ${currentContract.current?.Property.dept}`}
      />

      {/* Create modal */}
      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        className='shadow-none border-0 max-w-[800px]'
        titleText={`${editMode ? 'Editar' : 'Crear'} contrato `}
        // overlayBackground={localStorage.theme === 'light' ? 'rgb(227 227 227)' : 'rgb(15 23 42)'}
      >
        <CloseOnClick action={closeCreateModal} />
        <form onSubmit={handleSave}>
          <FieldsetGroup>
            <fieldset className=''>
              <label htmlFor='ClientId'>Inquilino</label>
              <Dropdown
                value={ClientId}
                onChange={(e) => handleInputChange(e.value, 'ClientId')}
                options={clientQuery.data?.data}
                optionLabel='fullName'
                filterPlaceholder='Busca  inquilino...'
                dropdownIcon={() => <DropDownIcon />}
                filter
                optionValue='id'
                showClear
                placeholder='Elije un inquilino'
                valueTemplate={(data, props) =>
                  !data ? (
                    props.placeholder
                  ) : (
                    <span>
                      {data.fullName} - {data.cuit}
                    </span>
                  )
                }
                itemTemplate={(data) => (
                  <span>
                    {data.fullName} - {data.cuit}
                  </span>
                )}
                className='h-[42px] items-center !border-gray-200 dark:!border-gray-700 shadow dark:bg-slate-900 dark:!text-slate-400 '
              />
              {ClientId > 0 && (
                <span className='text-blue-500 dark:text-blue-400 text-sm'>
                  Email : {clientQuery.data?.data.find((client) => client.id === ClientId)?.email} | Tel :{' '}
                  {clientQuery.data?.data.find((client) => client.id === ClientId)?.phone}
                </span>
              )}
              {errors?.ClientId && <FormError text='El inquilino es obligatorio.' />}
            </fieldset>

            {editMode ? (
              <CustomInput
                disabled={true}
                initialValue={
                  currentContract.current?.Property.street +
                  ' ' +
                  currentContract.current?.Property.number +
                  ' ' +
                  currentContract.current?.Property.floor +
                  ' ' +
                  currentContract.current?.Property.dept +
                  ' '
                }
                onChange={(val) => {}}
                label='Propiedad'
                placeholder=''
              />
            ) : (
              <fieldset className=''>
                <label htmlFor='PropertyId'>Propiedad</label>
                <Dropdown
                  value={PropertyId}
                  onChange={(e) => handleInputChange(e.value, 'PropertyId')}
                  options={propertyQuery.data?.data}
                  optionLabel='street'
                  showClear
                  dropdownIcon={() => <DropDownIcon />}
                  filterPlaceholder='Busca propiedad'
                  optionValue='id'
                  filterBy='street,number,dept,floor'
                  placeholder='Elije una propiedad'
                  filter
                  valueTemplate={(data, props) =>
                    !data ? (
                      props.placeholder
                    ) : (
                      <span>
                        {data.street} {data.number} {data.floor}-{data.dept}
                      </span>
                    )
                  }
                  itemTemplate={(data) => (
                    <span>
                      {' '}
                      {data.street} {data.number} {data.floor}-{data.dept}{' '}
                    </span>
                  )}
                  className='h-[42px] items-center !border-gray-200 shadow'
                />
                {PropertyId > 0 && (
                  <span className='text-blue-600 dark:text-blue-400 text-sm '>
                    Propietario : {propertyQuery.data?.data.find((p) => p.id === PropertyId)?.Owner?.fullName}
                  </span>
                )}
                {errors?.PropertyId && <FormError text='La propiedad es obligatoria.' />}
              </fieldset>
            )}
          </FieldsetGroup>
          <FieldsetGroup>
            <FieldsetGroup className='w-full sm:w-[50%]'>
              <CustomInput
                placeholder='2'
                type='date'
                initialValue={startDate || ''}
                onChange={(value) => handleInputChange(value, 'startDate')}
                required
                label='Fecha inicio'
                hasError={errors?.startDate}
                errorText='La fecha de inicio es obligatoria.'
              />
              <CustomInput
                placeholder=''
                type='date'
                initialValue={endDate || ''}
                onChange={(value) => handleInputChange(value, 'endDate')}
                required
                label='Fecha fin'
                hasError={errors?.endDate}
                errorText='La fecha  fin es obligatoria.'
              />
            </FieldsetGroup>
            <FieldsetGroup className='w-full sm:w-[50%]'>
              <CustomInput
                placeholder='46000.00'
                type='number'
                disabled={editMode}
                initialValue={amount || ''}
                onChange={(value) => handleInputChange(value, 'amount')}
                label='Valor contrato'
                required
                hasError={errors?.amount}
                errorText='El valor del contrato es obligatorio.'
              />
              <CustomInput
                placeholder='500.00'
                type='number'
                initialValue={deposit || ''}
                onChange={(value) => handleInputChange(value, 'deposit')}
                optional
                label='Depósito'
              />
            </FieldsetGroup>
          </FieldsetGroup>
          <FieldsetGroup>
            <FieldsetGroup className='w-full sm:w-[50%]'>
              <CustomInput
                placeholder='1000.99'
                type='number'
                label='Reserva'
                initialValue={booking || ''}
                optional
                onChange={(value) => handleInputChange(value, 'booking')}
              />
            </FieldsetGroup>
            <FieldsetGroup className='w-full sm:w-[50%]'>
              <CustomInput
                placeholder='2'
                type='number'
                label='% G. gestión'
                initialValue={admFeesPorc}
                onChange={(value) => handleInputChange(value, 'admFeesPorc')}
              />
              <fieldset>
                <label htmlFor='ClientId'>Moneda</label>
                <Dropdown
                  value={currency}
                  onChange={(e) => handleInputChange(e.value, 'currency')}
                  options={['ARS', 'USD']}
                  // optionLabel='Moneda'
                  dropdownIcon={() => <DropDownIcon />}
                  placeholder='Elije una moneda'
                  className='h-[42px] items-center !border-gray-200 shadow'
                />
              </fieldset>
            </FieldsetGroup>
          </FieldsetGroup>
          <FieldsetGroup className='w-full'>
            <fieldset>
              <label htmlFor='ClientId'>Ajuste</label>
              <Dropdown
                value={adjustmentMonth}
                onChange={(e) => handleInputChange(e.value, 'adjustmentMonth')}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                // optionLabel='Moneda'
                dropdownIcon={() => <DropDownIcon />}
                placeholder='Elije una opcion'
                className='h-[42px] items-center !border-gray-200 shadow'
              />
            </fieldset>
            <fieldset>
              <label htmlFor='ClientId'>Pago transferencia</label>
              <Dropdown
                value={paymentType}
                onChange={(e) => handleInputChange(e.value, 'paymentType')}
                options={['Fijo', 'Porcentual']}
                // optionLabel='Moneda'
                dropdownIcon={() => <DropDownIcon />}
                placeholder='Elije una opcion'
                className='h-[42px] items-center !border-gray-200 shadow'
              />
            </fieldset>
          </FieldsetGroup>
          <FieldsetGroup className='!flex-col !gap-0'>
            <CustomTextArea
              placeholder='Escribe una descripción para ese contrato...'
              initialValue={description || ''}
              onChange={(value) => handleInputChange(value, 'description')}
              label='Descripción'
              maxLength={255}
              optional
            />
            <div className='items-end self-end'>{description.length}/255</div>
          </FieldsetGroup>

          {assurances?.length > 0 && editMode && (
            <div className='mt-4'>
              <h1 className='title-form'>Garantes</h1>
              <div className='list-guarantees-to-add flex gap-x-2 flex-col sm:flex-row flex-wrap gap-y-3'>
                {assurances?.map((as, index) => (
                  <div className='relative text-sm' key={index}>
                    {/* <div
												className='absolute bg-white hover:opacity-75 dark:bg-slate-700 right-4 top-6 cursor-pointer w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-800'
											>
												<EditIcon action={() => ConfirmDestroy(as)} />
											</div>
											<div
												className='absolute bg-white hover:opacity-75 dark:bg-slate-700 right-4 top-[70px] cursor-pointer w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-800'
											>
												<DeleteIcon action={() => removeAssurance(as)} />
											</div> */}
                    <div>
                      <Box className=' w-full sm:w-[300px] dark:!bg-gray-900'>
                        <h1>
                          <span className='font-bold'> ID : </span> {as.id}
                        </h1>
                        <h1>
                          <span className='font-bold'> Nombre Completo : </span> {as.fullName}
                        </h1>
                        <h1>
                          <span className='font-bold'> Email : </span>
                          {as.email}
                        </h1>
                        <h1>
                          <span className='font-bold'> CUIT : </span>
                          {as.cuit}
                        </h1>
                        <h1>
                          <span className='font-bold'> Celular : </span>
                          {as.phone}
                        </h1>
                        <h1>
                          <span className='font-bold'> Dirección : </span>
                          {as.address}
                        </h1>
                        <h1>
                          <span className='font-bold'> Observación : </span>
                          {as.obs}
                        </h1>
                      </Box>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!editMode && (
            <>
              <div className='my-4 flex items-center gap-x-4  '>
                <label htmlFor='showGaranteeModel' className='title-form'>
                  Agregar garante(s)
                </label>
                <input
                  type='checkbox'
                  checked={addGaranteeBox}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddGaranteeBox(e.target.checked)}
                  name='showGaranteeModel'
                  className='h-[20px] w-[20px] '
                  id='showGaranteeModel'
                />
              </div>
              {addGaranteeBox && (
                <div className=''>
                  <div className='list-guarantees-to-add flex gap-x-2 flex-col sm:flex-row flex-wrap gap-y-3'>
                    {assurances?.map((as, index) => (
                      <div className='relative text-sm' key={index}>
                        <CloseOnClick action={() => removeAssurance(as)} />
                        <div
                          className='cursor-pointer'
                          onClick={() => {
                            setAssuranceItem(as)
                            setEditing(true)
                          }}
                        >
                          <Box className=' w-full sm:w-[300px] dark:!bg-gray-900'>
                            <h1>
                              <span className='font-bold'> ID : </span> {as.id}
                            </h1>
                            <h1>
                              <span className='font-bold'> Nombre Completo : </span> {as.fullName}
                            </h1>
                            <h1>
                              <span className='font-bold'> Email : </span>
                              {as.email}
                            </h1>
                            <h1>
                              <span className='font-bold'> CUIT : </span>
                              {as.cuit}
                            </h1>
                            <h1>
                              <span className='font-bold'> Celular : </span>
                              {as.phone}
                            </h1>
                            <h1>
                              <span className='font-bold'> Dirección : </span>
                              {as.address}
                            </h1>
                            <h1>
                              <span className='font-bold'> Observación : </span>
                              {as.obs}
                            </h1>
                          </Box>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='guarantees mb-12'>
                    <FieldsetGroup>
                      <FieldsetGroup className=' w-full sm:w-[50%]'>
                        <fieldset className=''>
                          <label htmlFor='fullname'>Nombre Completo </label>
                          <input
                            className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                            placeholder='Juan Jose'
                            value={assuranceItem?.fullName || ''}
                            onChange={(e) => setAssuranceItem((prev: any) => ({ ...prev, fullName: e.target.value }))}
                          />
                          {errors?.fullName && <FormError text='El nombre es obligatorio.' />}
                        </fieldset>
                      </FieldsetGroup>
                      <FieldsetGroup className='w-full sm:w-[50%]'>
                        <fieldset className=''>
                          <label htmlFor='cuit'>Cuit/Cuil </label>
                          <input
                            placeholder='20-01010101-0'
                            className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                            value={assuranceItem?.cuit || ''}
                            onChange={(e) => setAssuranceItem((prev: any) => ({ ...prev, cuit: e.target.value }))}
                          />
                          {errors?.cuit && <FormError text='El cuit es obligatorio.' />}
                        </fieldset>
                        <fieldset className=''>
                          <label htmlFor='phone'>Teléfono </label>
                          <input
                            placeholder='3417207882'
                            className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                            value={assuranceItem?.phone || ''}
                            onChange={(e) => setAssuranceItem((prev: any) => ({ ...prev, phone: e.target.value }))}
                          />
                          {errors?.phone && <FormError text='El teléfono es obligatorio.' />}
                        </fieldset>
                      </FieldsetGroup>
                    </FieldsetGroup>

                    <FieldsetGroup>
                      <fieldset className=''>
                        <label htmlFor='email'>Email </label>
                        <input
                          placeholder='ejemplo@gmail.com'
                          className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                          value={assuranceItem?.email || ''}
                          type='text'
                          onChange={(e) => setAssuranceItem((prev: any) => ({ ...prev, email: e.target.value }))}
                        />
                        {errors?.email && <FormError text='El correo es obligatorio y debe ser válido.' />}
                      </fieldset>
                      <fieldset className=''>
                        <label htmlFor='address'>Dirección</label>
                        <input
                          placeholder='Sarmiento 190'
                          className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                          value={assuranceItem?.address || ''}
                          onChange={(e) => setAssuranceItem((prev: any) => ({ ...prev, address: e.target.value }))}
                        />
                        {errors?.address && <FormError text='La dirección es obligatoria.' />}
                      </fieldset>
                    </FieldsetGroup>
                    <fieldset className=''>
                      <label htmlFor='obs'>
                        Observación <span className='text-xs opacity-50'>(opcional)</span>{' '}
                      </label>
                      <textarea
                        placeholder='Escribe una observación ...'
                        className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                        value={assuranceItem?.obs || ''}
                        maxLength={255}
                        onChange={(e) => setAssuranceItem((prev: any) => ({ ...prev, obs: e.target.value }))}
                      />
                      <div className='items-end self-end'>{assuranceItem.obs.length}/255</div>
                    </fieldset>
                    <section className='my-4 flex flex-col sm:flex-row gap-4'>
                      <button
                        type='button'
                        onClick={addAssurance}
                        className='btn bg-gray-300 dark:bg-slate-900 text-slate-700 dark:!text-slate-400 dark:hover:text-slate-400  '
                      >
                        {!editing ? 'Agregar garante' : 'Guardar garante'}
                      </button>
                      {editing && (
                        <button
                          className='btn sec !bg-transparent bg-gray-200 dark:text-slate-400 dark:hover:text-slate-400  dark:!border dark:!border-slate-600'
                          type='button'
                          onClick={() => {
                            setEditing(false)
                            setAssuranceItem({
                              fullName: '',
                              email: '',
                              address: '',
                              obs: '',
                              phone: '',
                              cuit: '',
                              ContractId: 0,
                              id: 0
                            })
                          }}
                        >
                          Salir de la edición
                        </button>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </>
          )}
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
        </form>
      </CreateModal>

      {/* Guarantee modal  */}
      <CreateModal
        show={showAddGuaranteeModal}
        closeModal={closeGuaranteeModal}
        overlayClick={false}
        titleText='Agregar  garante'
        className='shadow-none border-0'
      >
        <CloseOnClick action={closeGuaranteeModal} />
        <form onSubmit={handleAddGuarantee}>
          <FieldsetGroup>
            <CustomInput
              disabled={true}
              initialValue={
                currentContract.current?.Client.fullName +
                ' - ' +
                currentContract.current?.Client.cuit +
                '  | ' +
                currentContract.current?.Property.street +
                ' ' +
                currentContract.current?.Property.number +
                ' '
              }
              onChange={(val) => {}}
              label='Contrato'
              placeholder=''
            />
          </FieldsetGroup>
          <FieldsetGroup>
            <CustomInput
              placeholder='Juan Jose'
              initialValue={fullName || ''}
              onChange={(value) => GhandleInputChange(value, 'fullName')}
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
              onChange={(value) => GhandleInputChange(value, 'email')}
              maxLength={150}
              label='Email'
              required
              hasError={errors?.email}
              errorText='El correo es obligatorio.'
            />
          </FieldsetGroup>
          <FieldsetGroup>
            <CustomInput
              placeholder='20-20202020-0'
              initialValue={cuit || ''}
              onChange={(value) => GhandleInputChange(value, 'cuit')}
              maxLength={15}
              label='Cuit/Cuil'
              required
              hasError={errors?.cuit}
              errorText='El cuit/cuil es obligatorio.'
            />
            <CustomInput
              placeholder='3412002020'
              initialValue={phone || ''}
              onChange={(value) => GhandleInputChange(value, 'phone')}
              maxLength={20}
              label='Teléfono'
              required
              hasError={errors?.phone}
              errorText='El teléfono es obligatorio.'
            />
          </FieldsetGroup>
          <FieldsetGroup>
            <CustomInput
              placeholder='Sarmiento 1247'
              initialValue={address || ''}
              onChange={(value) => GhandleInputChange(value, 'address')}
              maxLength={100}
              label='Dirección'
              required
              hasError={errors?.address}
              errorText='La dirección es obligatoria.'
            />
          </FieldsetGroup>
          <div className='flex flex-col'>
            <CustomTextArea
              placeholder='Escribe una observación o nota de algo...'
              initialValue={obs || ''}
              onChange={(value) => GhandleInputChange(value, 'obs')}
              optional
              maxLength={255}
              label='Observación'
            />
            <div className='items-end self-end'>{Gvalues.obs.length}/255</div>
          </div>
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeGuaranteeModal} />
        </form>
      </CreateModal>

      {/* modal eventuality */}
      <CreateModal
        show={showAddEventualityModal}
        closeModal={closeAddEventualitiesModal}
        overlayClick={false}
        titleText='Agregar  eventualidad'
        className='shadow-none border-0 max-w-[500px]'
      >
        <CloseOnClick action={closeAddEventualitiesModal} />
        <form onSubmit={handleAddEventualities}>
          <FieldsetGroup>
            <CustomInput
              disabled={true}
              initialValue={
                currentContract.current?.Client.fullName +
                ' - ' +
                currentContract.current?.Client.cuit +
                '  | ' +
                currentContract.current?.Property.street +
                ' ' +
                currentContract.current?.Property.number +
                ' '
              }
              onChange={(val) => {}}
              label='Contrato'
              placeholder=''
            />
          </FieldsetGroup>
          <FieldsetGroup>
            <CustomInput
              placeholder='202.99'
              type='number'
              initialValue={clientAmount || ''}
              onChange={(value) => EhandleInputChange(value, 'clientAmount')}
              label='Monto Inquilino'
              required
              hasError={errors?.clientAmount}
              errorText='El monto del cliente es obligatorio.'
            />
            <CustomInput
              placeholder='120.99'
              type='number'
              initialValue={ownerAmount || ''}
              onChange={(value) => EhandleInputChange(value, 'ownerAmount')}
              label='Monto propietario'
              required
              hasError={errors?.ownerAmount}
              errorText='El monto del propietario es obligatorio.'
            />
          </FieldsetGroup>
          <CustomInput
            placeholder=''
            initialValue={expiredDate || ''}
            type='date'
            onChange={(value) => EhandleInputChange(value, 'expiredDate')}
            label='Fecha Vencimiento'
            required
            hasError={errors?.expiredDate}
            errorText='La fecha de vencimiento es obligatorio.'
          />
          <CustomTextArea
            placeholder='Escribe una breve descripción ...'
            initialValue={descEvent || ''}
            onChange={(value) => EhandleInputChange(value, 'description')}
            maxLength={255}
            label='Descripción'
            required
            hasError={errors?.descEvent}
            errorText='La descripción es obligatoria.'
          />
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeAddEventualitiesModal} />
        </form>
      </CreateModal>

      <CreateModal
        show={showFinishContractModal}
        closeModal={closeFinishContractModal}
        overlayClick={false}
        titleText='Finalizar contrato'
        className='shadow-none border-0 max-w-[500px]'
      >
        <CloseOnClick action={closeFinishContractModal} />
        <form onSubmit={finishContract}>
          <div className='flex flex-col mt-3'>
            <span className='font-bold'>Contrato</span>

            <label htmlFor='contractInfo' className='border font-normal  p-2'>
              {currentContract.current?.Client.fullName +
                ' - ' +
                currentContract.current?.Client.cuit +
                '  | ' +
                currentContract.current?.Property.street +
                ' ' +
                currentContract.current?.Property.number +
                ' ' +
                currentContract.current?.Property.floor +
                ' ' +
                currentContract.current?.Property.dept}
            </label>
          </div>
          <FieldsetGroup>
            <CustomTextArea
              placeholder='Escribe una breve descripción ...'
              initialValue={motive || ''}
              onChange={(value) => FChandleInputChange(value, 'motive')}
              maxLength={255}
              label='Motivo de finalización'
            />
          </FieldsetGroup>
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeFinishContractModal} />
        </form>
      </CreateModal>
    </BoxContainerPage>
  )
}

export default Contracts

// TODO:  ContractDetails
