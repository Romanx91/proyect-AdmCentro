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
import { useContracts } from '../../hooks/useContracts'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import CustomTextArea from '../../components/CustomTextArea'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import CloseOnClick from '../../components/CloseOnClick'
import FormActionBtns from '../../components/FormActionBtns'
import { useGuarantors } from '../../hooks/useGuarantors'
import { IAssurance } from '../../interfaces/IAssurance'
import BoxContainerPage from '../../components/BoxContainerPage'

const Guarantors = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [show, setShow] = useState(false)
  const { fullName, email, phone, cuit, address, obs, ContractId, values, handleInputChange, reset, updateAll } = useForm({
    fullName: '',
    email: '',
    phone: '',
    cuit: '',
    address: '',
    obs: '',
    ContractId: 0,
  })
  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const [errors, setErrors] = useState<any>()
  const [editMode, setEditMode] = useState(false)
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fullName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    cuit: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
    address: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'Contract.Property.street': { value: null, matchMode: FilterMatchMode.CONTAINS },
  })
  const currentGuarantor = useRef<IAssurance | null>()
  const { showAndHideModal } = useShowAndHideModal()
  const { data, isError, isLoading, error, isFetching, refetch } = useGuarantors()
  const contractQuery = useContracts('?state=En curso')

  const edit = (data: IAssurance) => {
    updateAll({ ...data })
    setShowCreateModal(true)
    setEditMode(true)
    currentGuarantor.current = data
  }

  const ConfirmDestroy = (data: IAssurance) => {
    setShow(!show)
    currentGuarantor.current = data
  }

  const onGlobalFilterChange = (val: any) => {
    const value = val
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true)
      const res = await http.delete('/assurances/' + id)
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
    const { error, ok } = validateForm({ ...values }, ['obs'])
    setErrors(error)
    if (!ok) return false
    if (editMode) {
      try {
        setSavingOrUpdating(true)
        const res = await http.put(`/assurances/${currentGuarantor.current?.id}`, { ...values })
        if (res.data.ok) {
          // refetch()
          data?.data &&
            (data.data = data?.data.map((z) => {
              if (z.id === currentGuarantor.current?.id) {
                // @ts-expect-error
                z = { ...values, Contract: contractQuery.data?.data.find((x) => x.id === values.ContractId) }
                // eslint-disable-line no-use-before-define
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
        const res = await http.post('/assurances', { ...values })
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

  const closeCreateModal = () => {
    reset()
    setShowCreateModal(false)
    setErrors({})
  }

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
    currentGuarantor.current = null
    setShowCreateModal(true)
  }

  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage>
      <HeaderData action={openCreateOrEditModel} text='Garantes' />
      {data.data.length > 0 ? (
        <>
          <CustomInput
            onChange={(val) => onGlobalFilterChange(val)}
            className=' w-auto mx-2 sm:mx-0 sm:w-96'
            initialValue={globalFilterValue}
            placeholder='Buscar garante'
            type='search'
          />
          <Box className='!p-0 !overflow-hidden !border-none sm:mx-0  mb-4 '>
            <DataTable
              size='small'
              emptyMessage='Aún no hay garante'
              className='!overflow-hidden   !border-none'
              value={data?.data}
              filters={filters}
              globalFilterFields={['Contract.Property.street', 'email', 'fullName', 'Contract.Property.number', 'cuit', 'phone', 'address']}
              // paginator
              // rows={10}
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={refetch} />}
              dataKey='id'
              responsiveLayout='scroll'
            >
              <Column
                field='ContractId'
                body={(data) => (
                  <span>
                    {contractQuery.data?.data.find((x) => x.id === data.ContractId)?.Property?.street}{' '}
                    {contractQuery.data?.data.find((x) => x.id === data.ContractId)?.Property?.number}{' '}
                    {contractQuery.data?.data.find((x) => x.id === data.ContractId)?.Property?.floor} {''}
                    {contractQuery.data?.data.find((x) => x.id === data.ContractId)?.Property?.dept}
                  </span>
                )}
                header='Contrato'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='fullName'
                sortable
                header='Nombre Completo'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='email'
                sortable
                header='Email'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='cuit'
                sortable
                header='CUIT/CUIL'
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
                header='Dirección'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='obs'
                header='Observaciones'
                body={(data) => (
                  <span className='truncate' title={data.obs}>
                    {data.obs.slice(0, 30)} {data.obs.length > 30 && '...'}
                  </span>
                )}
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
        <EmptyData text='Aún no hay garante' />
      )}

      {isFetching && <Loading h={40} w={40} />}

      <DeleteModal
        savingOrUpdating={savingOrUpdating}
        show={show}
        setShow={setShow}
        destroy={() => destroy(currentGuarantor.current?.id!)}
        text={`${currentGuarantor.current?.fullName} con email : ${currentGuarantor.current?.email}`}
      />

      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        titleText='Agregar  garante'
        className='shadow-none border-0 max-w-[500px]'
      >
        <CloseOnClick action={closeCreateModal} />
        <form onSubmit={handleSave}>
          <FieldsetGroup>
            <fieldset className=''>
              <label htmlFor='ContractId'>Contrato </label>
              <Dropdown
                value={ContractId}
                onChange={(e) => handleInputChange(e.value, 'ContractId')}
                options={contractQuery.data?.data}
                optionLabel='street'
                showClear
                // disabled={editMode}
                valueTemplate={(data, props) =>
                  !data ? (
                    props.placeholder
                  ) : (
                    <span>
                      {' '}
                      {data.Client.fullName} | {data.Property.street} {data.Property.number} {data.Property.floor}-{data.Property.dept}{' '}
                    </span>
                  )
                }
                itemTemplate={(data) => (
                  <span>
                    {' '}
                    {data.Client.fullName} | {data.Property.street} {data.Property.number} {data.Property.floor}-{data.Property.dept}{' '}
                  </span>
                )}
                filterBy='Client.fullName,Property.street,Property.number,Property.floor,Property.dept'
                optionValue='id'
                placeholder='elije contrato'
                filter
                filterPlaceholder='Busca contrato'
                className='h-[42px] items-center !border-gray-200 shadow '
              />
              {errors?.ContractId && <FormError text='El contrato es obligatorio.' />}
            </fieldset>
          </FieldsetGroup>
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
              onChange={(value) => handleInputChange(value, 'cuit')}
              maxLength={15}
              label='Cuit/Cuil'
              required
              hasError={errors?.cuit}
              errorText='El cuit/cuil es obligatorio.'
            />
            <CustomInput
              placeholder='3412002020'
              initialValue={phone || ''}
              onChange={(value) => handleInputChange(value, 'phone')}
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
              onChange={(value) => handleInputChange(value, 'address')}
              maxLength={100}
              label='Dirección'
              required
              hasError={errors?.address}
              errorText='La dirección es obligatoria.'
            />
          </FieldsetGroup>
          <div className='flex flex-col justify-between'>
            <CustomTextArea
              placeholder='Escribe una observación o nota de algo...'
              initialValue={obs || ''}
              onChange={(value) => handleInputChange(value, 'obs')}
              optional
              maxLength={255}
              label='Observación'
            />
            <div className='items-end self-end'>{obs.length}/255</div>
          </div>
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
        </form>
      </CreateModal>
    </BoxContainerPage>
  )
}

export default Guarantors
