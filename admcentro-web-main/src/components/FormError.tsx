
const FormError = ({ text, className = '' }: { text: string, className?: string }) => {
  return (
    <div className={className}>
      <span className={`text-red-500 dark:text-red-300  p-1`}>{text}</span>
    </div>
  )
}

export default FormError