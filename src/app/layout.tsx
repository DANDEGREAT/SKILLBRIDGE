import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SkillBridge',
  description: 'Find verified technicians near you in Nigeria.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
        <style>{`* { box-sizing: border-box; } body { font-family: sans-serif; margin: 0; padding: 0; }`}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
