"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  Bell, 
  FileText, 
  Filter, 
  MapPin, 
  Plus, 
  Search, 
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("all")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <Badge variant="gradient" className="hidden sm:inline-flex">
                <Activity className="mr-1 h-3 w-3" />
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              </Button>
              <Avatar>
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card hover className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    <span className="text-green-500">{stat.change}</span>
                    <span className="ml-1">from last month</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-600" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search bills, politicians, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="w-[180px] h-12">
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      <SelectItem value="ontario">Ontario</SelectItem>
                      <SelectItem value="quebec">Quebec</SelectItem>
                      <SelectItem value="bc">British Columbia</SelectItem>
                      <SelectItem value="alberta">Alberta</SelectItem>
                      <SelectItem value="manitoba">Manitoba</SelectItem>
                      <SelectItem value="saskatchewan">Saskatchewan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="h-12 w-12">
                    <Filter className="h-5 w-5" />
                  </Button>
                  <Button variant="gradient" className="h-12">
                    <Plus className="mr-2 h-5 w-5" />
                    Track New Bill
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Tabs defaultValue="bills" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="bills">Recent Bills</TabsTrigger>
              <TabsTrigger value="watching">Watching</TabsTrigger>
              <TabsTrigger value="politicians">Politicians</TabsTrigger>
            </TabsList>

            <TabsContent value="bills" className="space-y-4">
              {recentBills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card hover className="group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {bill.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {bill.province}
                            <span className="text-muted-foreground">•</span>
                            <Calendar className="h-3 w-3" />
                            {bill.date}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={bill.status === "Passed" ? "success" : bill.status === "Reading" ? "warning" : "default"}>
                            {bill.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{bill.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {bill.sponsor}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            {bill.impact} impact
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          Track Bill
                        </Button>
                      </div>
                      {bill.progress && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Legislative Progress</span>
                            <span>{bill.progress}%</span>
                          </div>
                          <Progress value={bill.progress} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="watching" className="space-y-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bills being watched</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Start tracking bills to receive updates on their progress
                  </p>
                  <Button variant="gradient">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Bills
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="politicians" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {politicians.map((politician, index) => (
                  <motion.div
                    key={politician.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card hover>
                      <CardHeader>
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={politician.avatar} alt={politician.name} />
                            <AvatarFallback>{politician.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{politician.name}</CardTitle>
                            <CardDescription>{politician.party}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Province</span>
                            <span>{politician.province}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bills Sponsored</span>
                            <span>{politician.billsSponsored}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approval</span>
                            <span className="text-green-500">{politician.approval}%</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}

const statsCards = [
  {
    title: "Total Bills Tracked",
    value: "1,247",
    change: "+12.5%",
    icon: FileText,
  },
  {
    title: "Active Provinces",
    value: "7",
    change: "+2",
    icon: MapPin,
  },
  {
    title: "Politicians Monitored",
    value: "342",
    change: "+8.2%",
    icon: Users,
  },
  {
    title: "Weekly Updates",
    value: "89",
    change: "+23.1%",
    icon: Bell,
  },
]

const recentBills = [
  {
    id: "1",
    title: "Bill C-123: Climate Action and Green Energy Transition Act",
    province: "Ontario",
    date: "Dec 15, 2023",
    status: "Reading",
    summary: "Comprehensive legislation aimed at accelerating Ontario's transition to renewable energy sources and reducing carbon emissions by 50% by 2030.",
    sponsor: "Hon. Sarah Mitchell",
    impact: "High",
    progress: 65,
  },
  {
    id: "2",
    title: "Bill A-456: Healthcare Accessibility Enhancement Act",
    province: "Alberta",
    date: "Dec 14, 2023",
    status: "Passed",
    summary: "Establishes new standards for healthcare accessibility in rural communities, including funding for mobile health units and telemedicine infrastructure.",
    sponsor: "Dr. James Chen",
    impact: "Medium",
    progress: 100,
  },
  {
    id: "3",
    title: "Bill Q-789: French Language Protection and Promotion Act",
    province: "Quebec",
    date: "Dec 13, 2023",
    status: "Committee",
    summary: "Strengthens French language requirements in the workplace and expands French language education programs across the province.",
    sponsor: "Marie-Claire Dubois",
    impact: "High",
    progress: 35,
  },
]

const politicians = [
  {
    name: "Sarah Mitchell",
    initials: "SM",
    avatar: "",
    party: "Liberal Party",
    province: "Ontario",
    billsSponsored: 12,
    approval: 68,
  },
  {
    name: "James Chen",
    initials: "JC",
    avatar: "",
    party: "Conservative Party",
    province: "Alberta",
    billsSponsored: 8,
    approval: 72,
  },
  {
    name: "Marie-Claire Dubois",
    initials: "MD",
    avatar: "",
    party: "Bloc Québécois",
    province: "Quebec",
    billsSponsored: 15,
    approval: 65,
  },
]