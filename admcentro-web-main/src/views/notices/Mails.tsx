import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import Loading from '../../components/Loading'
import RequestError from '../../components/RequestError'
import HeaderData from '../../components/HeaderData'
import BoxContainerPage from '../../components/BoxContainerPage'
import CheckIcon from '../../components/icons/CheckIcon'
import { formatDate } from '../../helpers/date'
import { IAssurance } from '../../interfaces/IAssurance'
import { IPerson } from '../../interfaces/Iowners'
import { useMailNotice } from '../../hooks/useMailsNotice'
import Box from '../../components/Box'

export interface ImailJob {
  id: number
  motive: string
  status: boolean
  ClientId: number
  AssuranceId: number | null
  createdAt: string
  updatedAt: string
  Client: IPerson
  Assurance: IAssurance
}

const MailsNotice = () => {
  const { data, isError, isLoading, error, isFetching, refetch, } = useMailNotice()

  return (
    <BoxContainerPage>
      <HeaderData text='Mails de avisos' showBtn={false} />

      {isError && <RequestError error={error} />}
      {(isFetching || isLoading) && <Loading w={40} h={40} />}

      {data !== undefined && (
        <Box className='!p-0 !overflow-hidden !border-none  sm:mx-0  sm:w-[650px] mb-4 '>
          <DataTable
            size='small'
            emptyMessage='Aún no hay mails de avisos registrados'
            // className='w-full sm:min-w-[600px]'
            value={data.data}
            className='!overflow-hidden   !border-none '
            rowHover
            loading={isFetching || isLoading}
            dataKey='id'
            responsiveLayout='scroll'

          >
            <Column field='id' header='ID'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            />
            <Column
              field='Person.email'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              body={(data: ImailJob) => (
                <div className='flex flex-col'>
                  <span>{data.AssuranceId ? data.Assurance.fullName : data.Client.fullName}</span>
                  <span className='text-brand text-sm'>{data.AssuranceId ? data.Assurance.email : data.Client.email}</span>
                </div>
              )}
              header='Persona'
            />
            <Column field='motive' header='Motivo'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 w-20'
            />


            <Column
              field='status'
              header='Estado'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              body={(data: ImailJob) => (
                <span
                  className='tooltip left'
                  data-tooltip={data.status ? 'Se mandó con éxito el mail' : 'Hubo un error al mandar el email'}
                >
                  {/* @ts-ignore  */}
                  <CheckIcon color={data.status ? '#689f38' : '#d97171'} />
                </span>
              )}
            />
            <Column
              field='createdAt'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              header='Fecha'
              body={(data: ImailJob) => <> {formatDate(data.createdAt)} </>}
            />
          </DataTable>
          {/* <TableFooter
            refetch={refetch}
            action={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage || isFetching}
            hasNextPage={hasNextPage}
          /> */}
        </Box>
      )}
    </BoxContainerPage>
  )
}

export default MailsNotice
