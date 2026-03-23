import useStore from '../../store'

export default function Toast() {
  const message = useStore((s) => s.toastMessage)

  if (!message) return null

  return (
    <div id="toast" className="show">
      {message}
    </div>
  )
}
