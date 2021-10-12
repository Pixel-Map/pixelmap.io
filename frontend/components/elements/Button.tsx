export default function Button({link, target, disabled, children}) {
  return (
    <a 
      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ${disabled ? 'pointer-events-none' : ''}`} 
      target={`${target}`} 
      href={`${link}`}
    >
      {children}
    </a>
  )
}