import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Provincial Bills Tracker | Modern Legislative Monitoring",
  description: "Track and monitor provincial bills across Canada with real-time updates, intelligent analysis, and beautiful visualizations.",
  keywords: ["provincial bills", "Canada", "legislation", "government", "politics", "tracking"],
  authors: [{ name: "Provincial Tracker Team" }],
  openGraph: {
    title: "Provincial Bills Tracker",
    description: "Modern legislative monitoring for Canadian provinces",
    type: "website",
    locale: "en_CA",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Provincial Bills Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Provincial Bills Tracker",
    description: "Modern legislative monitoring for Canadian provinces",
    images: ["/og-image.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-background">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-600/5" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_85%)]" />
            </div>
            
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}