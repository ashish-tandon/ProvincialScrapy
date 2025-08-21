import { motion } from "framer-motion"
import { FileQuestion, Home, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted"
        >
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </motion.div>
        
        <h1 className="mb-2 text-6xl font-bold gradient-text">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button variant="gradient" asChild className="group">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              Browse Bills
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}