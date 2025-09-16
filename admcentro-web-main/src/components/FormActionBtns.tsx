import React from 'react'
import InlineDots from './loadings/Inlinedots'

const FormActionBtns = ({ onClose, savingOrUpdating, btnSendText }: { onClose: () => void, savingOrUpdating: boolean, btnSendText?: string }) => {
    return (
        <section className='btns-form-actions action flex items-center gap-x-3 mt-8'>
            <button
                className='btn sec !py-1'
                onClick={() => { onClose() }}
                disabled={savingOrUpdating}
                type='button'
            >
                Cancelar
            </button>
            <button
                className='btn gradient  !py-1'
                disabled={savingOrUpdating}
                type='submit'
            >
                {savingOrUpdating ? (
                    <span className='flex items-center gap-x-2'>
                        <span>{btnSendText ? 'Espere' : 'Guardando'}</span>
                        <InlineDots />
                    </span>
                ) : btnSendText ? btnSendText : 'Guardar'}
            </button>
        </section>
    )
}

export default FormActionBtns