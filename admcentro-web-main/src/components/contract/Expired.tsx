import React from 'react'
import { Page, Text, View, Document, StyleSheet, PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import Box from '../Box'

const Expired = ({ data, days }: { data: any; days: number }) => {
	return (
		// <Document>
		// 	<Page size='A4'>
		<div className=' mx-auto  dark:text-slate-400'>
			<h2 className='my-4 text-2xl font-semibold leading-tight'>
				<Text>
					Contratos a Vencer <br /> <span className='text-sm'> en los próximos {days} días </span>
				</Text>
			</h2>
			<Box className='!p-0 !m-0'>
				<div className='overflow-x-auto'>
					<table className='w-full p-6 text-sm text-left whitespace-nowrap'>
						<thead className=' rounded-lg  overflow-hidden'>
							<tr className='bg-gray-200 dark:bg-gray-700'>
								<th className='p-3'>Vence el</th>
								<th className='p-3'>Resta</th>
								<th className='p-3'>Contrato</th>
								<th className='p-3'>Propiedad</th>
								<th className='p-3'>Propietario</th>
								<th className='p-3'>Inquilino</th>
								<th className='p-3'>Monto Alq.</th>
								<th className='p-3'>Alq. Neto</th>
								<th className='p-3'>Observaciones</th>
							</tr>
						</thead>
						<tbody className=''>
							{data.map((c: any) => (
								<tr key={c.id}>
									<td className='px-3 py-2'>{c.endDate}</td>
									<td className='px-3 py-2'>{9}</td>
									<td className='px-3 py-2'>{c.id}</td>
									<td className='px-3 py-2'>
										{c.Property.street} {c.Property.number} {c.Property.dept} - {c.Property.floor}
									</td>
									<td className='px-3 py-2'> {c.Property.Owner?.fullName}</td>
									<td className='px-3 py-2'> {c.Client.fullName}</td>
									<td className='px-3 py-2'>{c.amount}</td>
									<td className='px-3 py-2'>{c.amount}</td>
									<td
										className='px-3 py-2'
										title={c.description}
									>
										{c.description.slice(0, 20) || '--'} {c.description.length > 20 ? '...' : ''}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Box>
		</div>
		// 	</Page>
		// </Document>
	)
}

export default Expired
