import useStore from '../../store'

export default function Toast() {
  const message = useStore((s) => s.toastMessage)

  return (
    <div id="toast" className={message ? 'show' : ''}>
      {message || ''}
    </div>
  )
}
