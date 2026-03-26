export default function SdkLoading() {
  return (
    <div id="sdk-loading">
      <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" id="sdk-loading-icon" style={{ width: 64, height: 64 }}>
        <rect width="88" height="88" rx="24" fill="rgba(255,255,255,0.12)" />
        <rect x="16" y="28" width="56" height="34" rx="6" fill="white" fillOpacity="0.9" />
        <rect x="26" y="18" width="10" height="12" rx="3" fill="white" fillOpacity="0.65" />
        <rect x="52" y="18" width="10" height="12" rx="3" fill="white" fillOpacity="0.65" />
        <circle cx="33" cy="44" r="5" fill="#0e3a8a" />
        <circle cx="55" cy="44" r="5" fill="#0e3a8a" />
        <rect x="40" y="52" width="8" height="5" rx="2" fill="#0e3a8a" />
        <rect x="8" y="44" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
        <rect x="72" y="44" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
      </svg>
      <div id="sdk-loading-text" style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Connecting to Ark\u2026</div>
      <div id="sdk-loading-bar" style={{ width: 180, height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
        <div id="sdk-loading-fill" style={{ width: '0%', height: '100%', background: '#fff', borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}
