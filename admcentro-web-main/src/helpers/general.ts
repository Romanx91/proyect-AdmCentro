// @ts-expect-error
import html2pdf from 'html2pdf.js'
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

export const validateMail = (mail: string): boolean => {
  return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(mail)
}

export const menuItems = [
  {
    to: null,
    title: 'Informes',
    subLink: [
      { to: 'eventualities', title: 'Eventualidades' },
      { to: 'contract-debts-clients', title: 'Deudas x inqulinos' },
      { to: 'contract-debts-owners', title: 'Deudas x  propietario' },
      { to: 'contracts-expired', title: 'Vto de contratos' },
      { to: 'contract-price-historial', title: 'Ajustes % contratos' },
      { to: 'client-expenses', title: 'Impuestos inquilinos' },
      { to: 'owner-expenses', title: 'Impuestos propietario' }
    ]
  },

  {
    to: null,
    title: 'Consultas',
    subLink: [
      { to: 'properties/Venta', title: 'Deptos en venta' },
      { to: 'properties/Alquiler', title: 'Deptos en Alquiler' },
      { to: 'visits', title: 'Visitas' },
      { to: 'claims', title: 'Reclamos' },
      { to: 'budgets', title: 'Presupuestos' },
      { to: 'mails-notice', title: 'Avisos' }
    ]
  },
  {
    to: null,
    title: 'Pagos',
    subLink: [
      { to: 'client-payment', title: 'Cobro a inquilino' },
      { to: 'owner-payment', title: 'Pago a propietario' }
      // { to: 'properties', title: 'Lista conceptos' },
      // { to: 'revert-payment', title: 'Revertir cobro' },
    ]
  },

  {
    to: 'clients',
    title: 'Inquilinos',
    subLink: []
  },
  {
    to: 'owners',
    title: 'Propietarios',
    subLink: []
  },
  {
    to: null,
    title: 'Contratos',
    subLink: [
      { to: 'contracts', title: 'Vigentes' },
      { to: 'done-contracts', title: 'Finalizados' },
      { to: 'pending-contracts', title: 'Pendientes' }
    ]
  },
  {
    to: null,
    title: 'ABM',
    subLink: [
      { to: 'zones', title: 'Zonas' },
      { to: 'payment-methods', title: 'Tipo de pago' },
      { to: 'property-types', title: 'Tipo de propiedades' },
      { to: 'properties', title: 'Propiedades' },
      { to: 'configurations', title: 'Infos general' },
      { to: 'guarantors', title: 'Garantes' }
    ]
  }
]

export const UUID = () => {
  let d = Date.now()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now() // use high-precision timer if available
  }
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return uuid
}

export const handleDownloadPdf = async (id: string, filename: string) => {
  // setLoadingPdf(true)
  var element = document.getElementById(id)
  var opt = {
    margin: [0.4, 0.4],
    filename,
    image: { type: 'png', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  }
  try {
    await html2pdf().from(element).set(opt).save()
  } catch (error) {
    console.log('error')
  } finally {
    //   setLoadingPdf(false)
    //   closePrintPdfModal()
  }
}
