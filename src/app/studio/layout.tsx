/**
 * This layout completely overrides the root layout for all /studio routes.
 * It renders the Studio as a fully standalone page with no website chrome
 * (no Header, Footer, CartDrawer, or WhatsApp button).
 */
export const metadata = {
  title: 'SILA Collective — Studio',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, height: '100%' }}>
        {children}
      </body>
    </html>
  )
}
