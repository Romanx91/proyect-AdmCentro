import React, { useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Box from '../../components/Box';
import EditIcon from '../../components/icons/EditIcon';
import DeleteIcon from '../../components/icons/DeleteIcon';
import DeleteModal from '../../components/DeleteModal';
import Loading from '../../components/Loading';
import http from '../../api/axios';
import CreateModal from '../../components/CreateModal';
import { useForm } from '../../hooks/useForm';
import RequestError from '../../components/RequestError';
import { IpropertyType } from '../../interfaces/IPropertyType';
import { usePropertyTypes } from '../../hooks/usePropertyTypes';
import useShowAndHideModal from '../../hooks/useShowAndHideModal';
import { validateForm } from '../../helpers/form';
import HeaderData from '../../components/HeaderData';
import { EmptyData } from '../../components/EmptyData';
import RefreshData from '../../components/RefreshData';
import FormActionBtns from '../../components/FormActionBtns';
import CustomTextArea from '../../components/CustomTextArea';
import BoxContainerPage from '../../components/BoxContainerPage';

const AllPropertyTypes = () => {

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [editMode, setEditMode] = useState(false)
  const currentPropertyType = useRef<IpropertyType | null>();
  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const { description, values, handleInputChange, reset } = useForm({ description: '' })
  const { data, isError, isLoading, error, isFetching, refetch } = usePropertyTypes()
  const { showAndHideModal } = useShowAndHideModal()

  const edit = (data: IpropertyType) => {
    handleInputChange(data.description, 'description');
    setShowCreateModal(true)
    setEditMode(true)
    currentPropertyType.current = data;
  };

  const ConfirmDestroy = (data: IpropertyType) => {
    setShow(!show);
    currentPropertyType.current = data;
  };

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true)
      const res = await http.delete('/propertytypes/' + id);
      if (res.data.ok) {
        data?.data && (data.data! = data?.data.filter(z => z.id !== id));
        setShow(false);
        showAndHideModal('Borrado', res.data.message)
      } else {
        showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
      }
    } catch (error: any) {
      if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
    } finally {
      setSavingOrUpdating(false)
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm(values)
    setErrors(error)
    if (!ok) return false
    if (editMode) {
      try {
        setSavingOrUpdating(true)
        const res = await http.put(`/propertytypes/${currentPropertyType.current?.id}`, values);
        if (res.data.ok) {
          data?.data && (data.data = data?.data.map(z => {
            if (z.id === currentPropertyType.current?.id) {
              z.description = values.description
            }
            return z;
          }))
          reset();
          setShowCreateModal(false);
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
        const res = await http.post('/propertytypes', values);
        if (res.data.ok) {
          data?.data.unshift(res.data.data)
          reset();
          setShowCreateModal(false);
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
    reset();
    setShowCreateModal(false);
    setErrors({})
  }

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className='flex gap-x-3 items-center justify-center'>
        <EditIcon action={() => edit(rowData)} />
        <DeleteIcon action={() => ConfirmDestroy(rowData)} />
      </div>
    );
  };

  const openCreateOrEditModel = () => {
    setShowCreateModal(true)
    setEditMode(false)
    currentPropertyType.current = null;
  }

  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage >
      <HeaderData action={openCreateOrEditModel} text='Tipos de propiedades' />
      {
        data.data.length > 0 ? (
          <Box className='!p-0 !overflow-hidden !border-none  sm:mx-0  sm:w-[500px] mb-4 '>
            <DataTable
              size='small'
              emptyMessage='Aún no hay tipo de propiedad'
              className='!overflow-hidden !border-none'
              value={data?.data}
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginator 
              // rows={10}               
              // paginatorLeft={<RefreshData action={refetch} />} 
              dataKey='id'
              responsiveLayout='scroll'>

              <Column field='description' header='Descripción' headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400' className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 ' />
              <Column body={actionBodyTemplate} headerClassName='!border-none dark:!bg-gray-800' className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 ' exportable={false} style={{ width: 90 }} />
            </DataTable>
          </Box>
        ) : (<EmptyData text='Aún no hay tipo de propiedad' />)
      }

      {isFetching && (<Loading h={40} w={40} />)}

      <DeleteModal
        show={show}
        savingOrUpdating={savingOrUpdating}
        setShow={setShow}
        destroy={() => destroy(currentPropertyType.current?.id!)}
        text={`${currentPropertyType.current?.description}`}
      />

      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        className='max-w-[500px] sm:w-[480px] '
        titleText={`${editMode ? 'Editar' : 'Crear'} tipo de propiedad`}
      >
        <form onSubmit={handleSave}>
          <CustomTextArea
            placeholder='Casa 2 dormitorios,Depto'
            initialValue={description}
            onChange={(value) => handleInputChange(value, 'description')}
            maxLength={255}
            label='Descripción'
            required
            minLength={1}
            hasError={errors?.description}
            errorText='La descripción es obligatoria.'
          />
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
        </form>
      </CreateModal>
    </BoxContainerPage>
  );
};

export default AllPropertyTypes;
