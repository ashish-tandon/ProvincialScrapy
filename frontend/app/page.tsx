"use client"

import { motion } from "framer-motion"
import { ArrowRight, BarChart3, Bell, FileText, MapPin, Search, Shield, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="h-8 w-8 text-primary" />
            </motion.div>
            <span className="text-xl font-bold">Provincial Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="gradient" className="mb-4">
                <Sparkles className="mr-1 h-3 w-3" />
                Powered by AI
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-5xl font-bold tracking-tight lg:text-7xl"
            >
              Track Provincial Bills
              <span className="block gradient-text">Like Never Before</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground"
            >
              Monitor legislative changes across Canadian provinces with real-time updates, 
              intelligent analysis, and beautiful visualizations. Stay informed on what matters most.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button size="xl" variant="gradient" className="group" asChild>
                <Link href="/dashboard">
                  Start Tracking
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-10 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute right-10 bottom-20 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 lg:text-4xl">
              Everything You Need to Stay Informed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make legislative tracking effortless and insightful
            </p>
          </motion.div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-4 lg:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of Canadians staying informed about provincial legislation
            </p>
            <Button size="xl" variant="gradient" className="group" asChild>
              <Link href="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Find bills and legislation with our AI-powered search engine that understands context and intent.",
  },
  {
    icon: Bell,
    title: "Real-time Alerts",
    description: "Get instant notifications when bills you're tracking are updated or move through the legislative process.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visualize legislative trends and patterns with interactive charts and comprehensive reports.",
  },
  {
    icon: MapPin,
    title: "Multi-Province Support",
    description: "Track bills across all Canadian provinces from a single, unified platform.",
  },
  {
    icon: Users,
    title: "Politician Profiles",
    description: "View detailed profiles of politicians including their voting history and sponsored bills.",
  },
  {
    icon: FileText,
    title: "Document Analysis",
    description: "AI-powered summaries and analysis of complex legislative documents.",
  },
]

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "50K+", label: "Bills Tracked" },
  { value: "99.9%", label: "Uptime" },
]

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
    </div>
  )
}