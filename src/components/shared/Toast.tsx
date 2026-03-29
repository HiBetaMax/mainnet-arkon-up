import { useEffect, useState } from 'react'
import useStore from '../../store'

export default function Toast() {
  const message = useStore((s) => s.toastMessage)
  const [visible, setVisible] = useState(false)
  const [currentMsg, setCurrentMsg] = useState('')

  useEffect(() => {
    if (message) {
      setCurrentMsg(message)
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [message])

  if (!currentMsg) return null

  const isError = /fail|error|denied|missing|invalid|insufficient/i.test(currentMsg)
  const isSuccess = /copied|sent|success|saved|done|confirmed/i.test(currentMsg)

  return (
    <div className={`push-notif${visible ? ' show' : ''}`}>
      <div className="push-notif-bar" />
      <div className="push-notif-content">
        <div className={`push-notif-icon${isError ? ' error' : isSuccess ? ' success' : ''}`}>
          {isError ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : isSuccess ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="16 9 10.5 15 8 12.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>
        <div className="push-notif-body">
          <div className="push-notif-app">ArkON</div>
          <div className="push-notif-msg">{currentMsg}</div>
        </div>
        <div className="push-notif-time">now</div>
      </div>
    </div>
  )
}
