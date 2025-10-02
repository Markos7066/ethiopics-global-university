"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Ethiopian flag colors
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
}

// Public Header Component
function PublicHeader({ onNavigate, darkMode, setDarkMode }) {
  const [showRoleModal, setShowRoleModal] = useState(false)

  const handleGetStarted = () => {
    setShowRoleModal(true)
  }

  const handleRoleSelection = (role) => {
    setShowRoleModal(false)
    onNavigate("signup", { role })
  }

  return (
    <>
      <header className="bg-card/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate("home")}>
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
                }}
              >
                <span className="text-white text-xs font-bold">🎓</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xs sm:text-sm md:text-lg font-bold text-foreground leading-tight">
                  Ethiopics Global
                </h1>
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">University</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => onNavigate("home")}>
                Home
              </Button>
              <Button variant="ghost" onClick={() => onNavigate("tutors")}>
                Find Tutors
              </Button>
              <Button variant="ghost" onClick={() => onNavigate("about")}>
                About
              </Button>
              <Button variant="ghost" onClick={() => onNavigate("contact")}>
                Contact
              </Button>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent"
              >
                <span className="text-base sm:text-lg">{darkMode ? "☀️" : "🌙"}</span>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate("login")} className="border-2 font-medium">
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => setShowRoleModal(true)}
                className="text-white font-medium hidden sm:inline-flex"
                style={{ backgroundColor: ethiopianColors.green }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-center mb-4">Join Ethiopics Global University</h3>
            <p className="text-muted-foreground text-center mb-6">Choose how you'd like to get started:</p>

            <div className="space-y-3">
              <Button
                onClick={() => handleRoleSelection("student")}
                className="w-full h-12 text-white font-semibold"
                style={{ backgroundColor: ethiopianColors.green }}
              >
                <span className="mr-2">🎓</span>
                Learn Ethiopian Languages
              </Button>

              <Button
                onClick={() => handleRoleSelection("tutor")}
                className="w-full h-12 text-white font-semibold"
                style={{ backgroundColor: ethiopianColors.red }}
              >
                <span className="mr-2">👨‍🏫</span>
                Teach Ethiopian Languages
              </Button>
            </div>

            <Button variant="ghost" onClick={() => setShowRoleModal(false)} className="w-full mt-4">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export function LandingPage({
  onNavigate,
  darkMode,
  setDarkMode,
  tutors,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedGender,
  setSelectedGender,
}) {
  const languages = ["all", "Amharic", "Afaan Oromo", "Tigrigna", "Afar", "Somali", "Agewegna", "Guragigna"]
  const genders = ["all", "Male", "Female"]
  const handleGetStarted = () => {
    // Handle get started logic here
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader onNavigate={onNavigate} darkMode={darkMode} setDarkMode={setDarkMode} />

      {/* Hero Section with Video */}
      <section className="relative py-12 sm:py-20 lg:py-24 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="space-y-4">
                <Badge
                  className="px-3 py-1 font-medium"
                  style={{ backgroundColor: `${ethiopianColors.yellow}20`, color: ethiopianColors.red }}
                >
                  🇪🇹 Connect with Your Ethiopian Heritage
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                  Learn Ethiopian Languages with
                  <span className="block" style={{ color: ethiopianColors.green }}>
                    Expert Native Tutors
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Master Amharic, Afaan Oromo, Tigrigna, and 5+ other Ethiopian languages with personalized 1-on-1
                  lessons from verified native speakers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="h-12 px-8 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ backgroundColor: ethiopianColors.green }}
                >
                  Start Learning Today
                  <span className="ml-2">→</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate("tutors")}
                  className="h-12 px-8 border-2 font-semibold"
                  style={{ borderColor: ethiopianColors.red, color: ethiopianColors.red }}
                >
                  <span className="mr-2">▶️</span>
                  Browse Tutors
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="text-center">
                  <div className="font-bold text-2xl" style={{ color: ethiopianColors.green }}>
                    50+
                  </div>
                  <div className="text-sm text-muted-foreground">Expert Tutors</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl" style={{ color: ethiopianColors.yellow }}>
                    8+
                  </div>
                  <div className="text-sm text-muted-foreground">Languages</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl" style={{ color: ethiopianColors.red }}>
                    1000+
                  </div>
                  <div className="text-sm text-muted-foreground">Happy Students</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-100 to-yellow-100 dark:from-green-950/20 dark:to-yellow-950/20">
                <img
                  src="/13-year-old-ethiopian-girl-with-laptop-learning-la.jpg"
                  alt="13-year-old Ethiopian girl learning languages online with laptop"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 dark:bg-black/90 rounded-full p-4 shadow-lg">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-2xl">▶️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gradient-to-r from-green-50 via-yellow-50 to-red-50 dark:from-green-950/10 dark:via-yellow-950/10 dark:to-red-950/10">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Ethiopian Languages We Teach</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the rich linguistic heritage of Ethiopia through our comprehensive language programs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { name: "Amharic", flag: "🇪🇹", description: "Official language" },
              { name: "Afaan Oromo", flag: "🌾", description: "Largest ethnic group" },
              { name: "Tigrigna", flag: "⛰️", description: "Northern regions" },
              { name: "Afar", flag: "🏜️", description: "Eastern lowlands" },
              { name: "Somali", flag: "🐪", description: "Southeastern regions" },
              { name: "Agewegna", flag: "🌊", description: "Central highlands" },
              { name: "Guragigna", flag: "🌿", description: "Southern regions" },
              { name: "Others", flag: "🗣️", description: "Regional languages" },
            ].map((language, index) => (
              <Card
                key={language.name}
                className="group p-6 text-center hover:shadow-xl transition-all duration-300 border-2 cursor-pointer transform hover:-translate-y-1"
                style={{
                  borderColor:
                    index % 3 === 0
                      ? ethiopianColors.green
                      : index % 3 === 1
                        ? ethiopianColors.yellow
                        : ethiopianColors.red,
                  backgroundColor:
                    index % 3 === 0
                      ? `${ethiopianColors.green}08`
                      : index % 3 === 1
                        ? `${ethiopianColors.yellow}08`
                        : `${ethiopianColors.red}08`,
                }}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {language.flag}
                </div>
                <h3
                  className="font-bold text-base sm:text-lg mb-2"
                  style={{
                    color:
                      index % 3 === 0
                        ? ethiopianColors.green
                        : index % 3 === 1
                          ? ethiopianColors.yellow
                          : ethiopianColors.red,
                  }}
                >
                  {language.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">{language.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutors Preview */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Meet Our Expert Tutors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn from certified native speakers with years of teaching experience
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-card p-4 sm:p-6 rounded-xl shadow-lg border mb-8 sm:mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <Input
                  placeholder="Search tutors or languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11"
                />
              </div>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang === "all" ? "All Languages" : lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender === "all" ? "Any Gender" : gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tutors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tutors.slice(0, 6).map((tutor) => (
              <Card key={tutor.id} className="hover:shadow-lg transition-all duration-200 border-2 border-muted/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={tutor.profileImage || "/placeholder.svg"} alt={tutor.name} />
                      <AvatarFallback>
                        {tutor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{tutor.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <span style={{ color: ethiopianColors.yellow }}>⭐</span>
                          <span className="text-sm ml-1">{tutor.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({tutor.reviews})</span>
                        {tutor.verified && <span style={{ color: ethiopianColors.green }}>✅</span>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {tutor.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{tutor.bio}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold" style={{ color: ethiopianColors.green }}>
                        {tutor.hourlyRate}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => onNavigate("signup")}
                        className="text-white"
                        style={{ backgroundColor: ethiopianColors.green }}
                      >
                        Book Lesson
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" onClick={() => onNavigate("tutors")} className="border-2 font-semibold">
              View All Tutors
              <span className="ml-2">→</span>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional educators and technology experts dedicated to your language learning success
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tutors.slice(0, 5).map((member) => (
              <Card
                key={member.id}
                className="hover:shadow-lg transition-all duration-200 border-2 border-muted/50 overflow-hidden"
              >
                <div className="relative">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={member.profileImage || "/placeholder.svg"}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{member.name}</h3>
                      <p className="text-sm font-medium" style={{ color: ethiopianColors.red }}>
                        {member.role}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
                    <div className="flex flex-wrap gap-1">
                      {member.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center space-x-2">
                        <span style={{ color: ethiopianColors.yellow }}>⭐</span>
                        <span className="text-sm font-medium">{member.rating}</span>
                        <span className="text-xs text-muted-foreground">({member.reviews})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-transparent"
                        style={{ borderColor: ethiopianColors.green, color: ethiopianColors.green }}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Why Choose Ethiopics Global University?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The most trusted platform for learning Ethiopian languages
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center p-6 border-2 border-muted/50">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${ethiopianColors.green}15` }}
              >
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="font-semibold mb-2">Native Speaker Tutors</h3>
              <p className="text-sm text-muted-foreground">
                Learn from verified native speakers with authentic pronunciation and cultural insights
              </p>
            </Card>

            <Card className="text-center p-6 border-2 border-muted/50">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${ethiopianColors.yellow}15` }}
              >
                <span className="text-2xl">🗣️</span>
              </div>
              <h3 className="font-semibold mb-2">8 Ethiopian Languages</h3>
              <p className="text-sm text-muted-foreground">
                Master Amharic, Afaan Oromo, Tigrigna, Somali, and more major Ethiopian languages
              </p>
            </Card>

            <Card className="text-center p-6 border-2 border-muted/50">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${ethiopianColors.red}15` }}
              >
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold mb-2">Global Community</h3>
              <p className="text-sm text-muted-foreground">
                Connect with Ethiopian diaspora worldwide and preserve cultural heritage
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">What Our Students Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <span className="text-4xl mb-4 block" style={{ color: ethiopianColors.green }}>
                💬
              </span>
              <p className="text-sm mb-4">
                "Learning Amharic with Dr. Almaz has been incredible. Her cultural insights make every lesson meaningful
                and engaging."
              </p>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">John Smith</div>
                  <div className="text-xs text-muted-foreground">Washington DC</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <span className="text-4xl mb-4 block" style={{ color: ethiopianColors.yellow }}>
                💬
              </span>
              <p className="text-sm mb-4">
                "The flexibility and quality of instruction is outstanding. I can finally communicate with my Ethiopian
                colleagues!"
              </p>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">Sarah Johnson</div>
                  <div className="text-xs text-muted-foreground">Toronto</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <span className="text-4xl mb-4 block" style={{ color: ethiopianColors.red }}>
                💬
              </span>
              <p className="text-sm mb-4">
                "Professional, patient, and passionate teachers. Ethiopics Global University exceeded all my
                expectations."
              </p>
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>MW</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">Mike Wilson</div>
                  <div className="text-xs text-muted-foreground">London</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ethiopianColors.green}15, ${ethiopianColors.yellow}15, ${ethiopianColors.red}15)`,
            }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of students learning Ethiopian languages with expert native speakers at Ethiopics Global
                University
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="h-12 px-8 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ backgroundColor: ethiopianColors.green }}
                >
                  Start Learning Now
                  <span className="ml-2">🎓</span>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate("tutors")}
                  className="h-12 px-8 border-2 font-semibold"
                  style={{ borderColor: ethiopianColors.red, color: ethiopianColors.red }}
                >
                  Browse Tutors
                </Button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div className="w-full h-full rounded-full" style={{ backgroundColor: ethiopianColors.yellow }}></div>
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
              <div className="w-full h-full rounded-full" style={{ backgroundColor: ethiopianColors.red }}></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
