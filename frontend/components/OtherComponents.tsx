"use client"

import { useAppContext } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  Search,
  Users,
  CheckCircle,
  Phone,
  Globe,
  Languages,
  MapPin,
  GraduationCap,
  Mail,
  UserCheck,
  Edit,
  Sun,
  Moon,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp,
  Send,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"

// Ethiopian flag colors
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
}

// Public Header Component
function PublicHeader({ onNavigate, darkMode, setDarkMode, currentPage }) {
  return (
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
              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
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
            <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate("login")} className="border-2 font-medium">
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => onNavigate("signup")}
              className="text-white font-medium hidden sm:inline-flex"
              style={{ backgroundColor: ethiopianColors.green }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Notification Panel Component
export function NotificationPanel({ notifications, onMarkAsRead }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Notifications</h3>
        <Button variant="ghost" size="sm" className="text-xs">
          Mark all read
        </Button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {notifications.slice(0, 5).map((notif) => (
          <div
            key={notif.id}
            className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
              notif.read ? "bg-muted/30" : "bg-accent"
            }`}
            onClick={() => onMarkAsRead(notif.id)}
          >
            <div className="flex items-start space-x-2">
              <div
                className="w-2 h-2 rounded-full mt-2"
                style={{
                  backgroundColor: notif.read ? "transparent" : ethiopianColors.green,
                }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {notifications.length > 5 && (
        <div className="text-center pt-2 border-t">
          <Button variant="ghost" size="sm" className="text-xs">
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )
}

export function DetailedProfileModal({
  profile,
  profileType,
  onClose,
  onVerifyTutor,
  onApproveTutor,
  onUpdateProfile,
  onBookLesson,
}) {
  const { state, dispatch } = useAppContext()
  const { profileModal } = state

  const saveChanges = () => {
    onUpdateProfile(profileModal.editData)
    dispatch({ type: "SET_PROFILE_EDITING", payload: false })
  }

  const handleBooking = () => {
    if (!profileModal.selectedLanguage || !profileModal.selectedLessonType) {
      toast.error("Please select language and lesson type")
      return
    }
    onBookLesson(profile.id, profileModal.selectedLanguage, profileModal.selectedLessonType)
    onClose()
  }

  const toggleEditing = () => {
    dispatch({
      type: "SET_PROFILE_EDITING",
      payload: !profileModal.isEditing,
      editData: profile,
    })
  }

  const updateSelectedLanguage = (language) => {
    dispatch({ type: "UPDATE_PROFILE_MODAL", payload: { selectedLanguage: language } })
  }

  const updateSelectedLessonType = (lessonType) => {
    dispatch({ type: "UPDATE_PROFILE_MODAL", payload: { selectedLessonType: lessonType } })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{profileType === "tutor" ? "Tutor Profile" : "Student Profile"}</span>
            <div className="flex items-center space-x-2">
              {profileType === "tutor" && !profileModal.isEditing && onBookLesson && (
                <Button
                  size="sm"
                  className="text-white"
                  style={{ backgroundColor: ethiopianColors.green }}
                  onClick={() => {
                    if (profile.languages?.length > 0) {
                      updateSelectedLanguage(profile.languages[0])
                      updateSelectedLessonType("Conversational")
                    }
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Lesson
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={toggleEditing}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Header */}
            <div className="text-center space-y-4">
              <Avatar className="h-32 w-32 mx-auto">
                <AvatarImage src={profile.profileImage || "/placeholder.svg"} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  {profileType === "tutor" && (
                    <>
                      {profile.verified && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: ethiopianColors.green, color: ethiopianColors.green }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {profile.approved && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: ethiopianColors.yellow, color: ethiopianColors.red }}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {profileType === "tutor" && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4" style={{ color: ethiopianColors.yellow }} fill="currentColor" />
                      <span className="text-sm font-medium">
                        {profile.rating} ({profile.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hourly Rate</span>
                    <span className="text-sm font-semibold" style={{ color: ethiopianColors.green }}>
                      {profile.hourlyRate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sessions</span>
                    <span className="text-sm">{profile.completedSessions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="text-sm">~2 hours</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-muted-foreground">Phone</label>
                  <p className="text-sm">{profile.phone || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Telegram</label>
                  <p className="text-sm">{profile.telegram || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Location</label>
                  <p className="text-sm">{profile.address || profile.location || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Join Date</label>
                  <p className="text-sm">{profile.joinDate}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            {profileType === "tutor" ? (
              <>
                {/* Teaching Information */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Teaching Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Languages Taught</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profile.languages?.map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-sm">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Specialties</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profile.specialties?.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-sm">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Experience</label>
                        <p className="text-sm">{profile.experience || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Education</label>
                        <p className="text-sm">{profile.education || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Gender</label>
                        <p className="text-sm">{profile.gender || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Professional Bio */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Professional Bio</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio || "No bio provided"}</p>
                </Card>

                {/* Availability & Booking */}
                {onBookLesson && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Book a Lesson</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Select Language</label>
                        <Select value={profileModal.selectedLanguage} onValueChange={updateSelectedLanguage}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose language" />
                          </SelectTrigger>
                          <SelectContent>
                            {profile.languages?.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Lesson Type</label>
                        <Select value={profileModal.selectedLessonType} onValueChange={updateSelectedLessonType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose lesson type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Conversational">Conversational</SelectItem>
                            <SelectItem value="Grammar">Grammar</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Cultural">Cultural Studies</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Lesson Rate</p>
                          <p className="text-xs text-muted-foreground">60 minutes session</p>
                        </div>
                        <p className="text-lg font-bold" style={{ color: ethiopianColors.green }}>
                          {profile.hourlyRate}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleBooking}
                      className="w-full mt-4 text-white"
                      style={{ backgroundColor: ethiopianColors.green }}
                      disabled={!profileModal.selectedLanguage || !profileModal.selectedLessonType}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book This Lesson
                    </Button>
                  </Card>
                )}
              </>
            ) : (
              <>
                {/* Learning Information */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Learning Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Preferred Language</label>
                        <p className="text-sm">{profile.preferredLanguage}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Current Level</label>
                        <p className="text-sm">{profile.currentLevel}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Lessons Completed</label>
                        <p className="text-sm">{profile.lessonsCompleted}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Weekly Hours</label>
                        <p className="text-sm">{profile.weeklyHours} hours/week</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Learning Goals */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Learning Goals</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {profile.learningGoals || "No learning goals specified"}
                  </p>
                </Card>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// About Page Component
export function AboutPage({ onNavigate, darkMode, setDarkMode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader onNavigate={onNavigate} darkMode={darkMode} setDarkMode={setDarkMode} currentPage="about" />

      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg"
              style={{
                background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
              }}
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">About Ethiopics Global University</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Preserving Ethiopian heritage through language education, connecting diaspora communities worldwide with
              their cultural roots.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="p-8 border-2 border-muted/50">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold" style={{ color: ethiopianColors.green }}>
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To bridge the gap between Ethiopian diaspora communities and their linguistic heritage by providing
                accessible, high-quality language education from certified native speakers. We believe that language is
                the key to cultural identity and community connection.
              </p>
            </div>
          </Card>

          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Professional educators and technology experts dedicated to your language learning success
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dr. Nega Debela - Founder */}
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-200 border-2 border-muted/50 lg:col-span-3 md:col-span-2">
                <div className="flex flex-col md:flex-row items-center md:text-left text-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="relative">
                    <Avatar
                      className="h-24 w-24 mx-auto md:mx-0 border-4"
                      style={{ borderColor: ethiopianColors.green }}
                    >
                      <AvatarImage src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&crop=face" />
                      <AvatarFallback className="text-lg font-bold">ND</AvatarFallback>
                    </Avatar>
                    <Badge
                      className="absolute -top-2 -right-2 text-xs font-medium"
                      style={{ backgroundColor: ethiopianColors.red, color: "white" }}
                    >
                      60 years
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Dr. Nega Debela</h3>
                    <p className="text-sm font-semibold mb-2" style={{ color: ethiopianColors.green }}>
                      Founder and Head of Curriculum
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ethiopian linguistics expert with 30+ years of experience in language education and cultural
                      preservation. PhD in Ethiopian Languages from Addis Ababa University.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                      <Badge variant="secondary" className="text-xs">
                        Amharic
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Afaan Oromo
                      </Badge>
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
              </Card>

              {/* Tigist Birhan - Instructional Technologist */}
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-200 border-2 border-muted/50">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 mx-auto border-2" style={{ borderColor: ethiopianColors.yellow }}>
                    <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face" />
                    <AvatarFallback className="text-lg font-bold">TB</AvatarFallback>
                  </Avatar>
                  <Badge
                    className="absolute -top-1 -right-1 text-xs font-medium"
                    style={{ backgroundColor: ethiopianColors.yellow, color: "black" }}
                  >
                    24 years
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-1">Tigist Birhan</h3>
                <p className="text-sm font-semibold mb-2" style={{ color: ethiopianColors.red }}>
                  Instructional Technologist
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Specializing in digital learning platforms and educational technology for Ethiopian language
                  instruction.
                </p>
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Amharic
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Tigrigna
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-transparent"
                  style={{ borderColor: ethiopianColors.yellow, color: ethiopianColors.red }}
                >
                  View Profile
                </Button>
              </Card>

              {/* Eyueal Shawe - Content Creator Manager */}
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-200 border-2 border-muted/50">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 mx-auto border-2" style={{ borderColor: ethiopianColors.red }}>
                    <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" />
                    <AvatarFallback className="text-lg font-bold">ES</AvatarFallback>
                  </Avatar>
                  <Badge
                    className="absolute -top-1 -right-1 text-xs font-medium"
                    style={{ backgroundColor: ethiopianColors.green, color: "white" }}
                  >
                    23 years
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-1">Eyueal Shawe</h3>
                <p className="text-sm font-semibold mb-2" style={{ color: ethiopianColors.green }}>
                  Content Creator Manager
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Responsible for developing engaging educational materials and multimedia content for Ethiopian
                  language learning.
                </p>
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Amharic
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Afaan Oromo
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-transparent"
                  style={{ borderColor: ethiopianColors.red, color: ethiopianColors.red }}
                >
                  View Profile
                </Button>
              </Card>

              {/* Markos Teshome - Tutor Relations Manager */}
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-200 border-2 border-muted/50">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 mx-auto border-2" style={{ borderColor: ethiopianColors.green }}>
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" />
                    <AvatarFallback className="text-lg font-bold">MT</AvatarFallback>
                  </Avatar>
                  <Badge
                    className="absolute -top-1 -right-1 text-xs font-medium"
                    style={{ backgroundColor: ethiopianColors.red, color: "white" }}
                  >
                    25 years
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-1">Markos Teshome</h3>
                <p className="text-sm font-semibold mb-2" style={{ color: ethiopianColors.yellow }}>
                  Tutor Relations Manager
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Coordinating between students and tutors to ensure quality educational experiences and smooth
                  communication.
                </p>
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Amharic
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Tigrigna
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-transparent"
                  style={{ borderColor: ethiopianColors.yellow, color: ethiopianColors.red }}
                >
                  View Profile
                </Button>
              </Card>

              {/* Samuel Worku - Student Success Manager */}
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-200 border-2 border-muted/50">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 mx-auto border-2" style={{ borderColor: ethiopianColors.yellow }}>
                    <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" />
                    <AvatarFallback className="text-lg font-bold">SW</AvatarFallback>
                  </Avatar>
                  <Badge
                    className="absolute -top-1 -right-1 text-xs font-medium"
                    style={{ backgroundColor: ethiopianColors.green, color: "white" }}
                  >
                    22 years
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-1">Samuel Worku</h3>
                <p className="text-sm font-semibold mb-2" style={{ color: ethiopianColors.red }}>
                  Student Success Manager
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Dedicated to helping students achieve their language learning goals through personalized support and
                  guidance.
                </p>
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Amharic
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Somali
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs bg-transparent"
                  style={{ borderColor: ethiopianColors.green, color: ethiopianColors.green }}
                >
                  View Profile
                </Button>
              </Card>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${ethiopianColors.green}15` }}
              >
                <Languages className="h-6 w-6" style={{ color: ethiopianColors.green }} />
              </div>
              <h3 className="text-2xl font-bold">8+</h3>
              <p className="text-sm text-muted-foreground">Ethiopian Languages</p>
            </Card>
            <Card className="p-6 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${ethiopianColors.yellow}15` }}
              >
                <Users className="h-6 w-6" style={{ color: ethiopianColors.red }} />
              </div>
              <h3 className="text-2xl font-bold">50+</h3>
              <p className="text-sm text-muted-foreground">Expert Tutors</p>
            </Card>
            <Card className="p-6 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${ethiopianColors.red}15` }}
              >
                <Globe className="h-6 w-6" style={{ color: ethiopianColors.red }} />
              </div>
              <h3 className="text-2xl font-bold">1000+</h3>
              <p className="text-sm text-muted-foreground">Students Worldwide</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Contact Page Component
export function ContactPage({ onNavigate, darkMode, setDarkMode }) {
  const { state, dispatch } = useAppContext()
  const { contactForm } = state

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success("Message sent successfully! We'll get back to you soon.")
    dispatch({
      type: "RESET_CONTACT_FORM",
    })
  }

  const updateFormData = (field, value) => {
    dispatch({
      type: "UPDATE_CONTACT_FORM",
      payload: { [field]: value },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader onNavigate={onNavigate} darkMode={darkMode} setDarkMode={setDarkMode} currentPage="contact" />

      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              Get in touch with our team. We're here to help you on your Ethiopian language learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      placeholder="Your full name"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <Input
                    value={contactForm.subject}
                    onChange={(e) => updateFormData("subject", e.target.value)}
                    placeholder="What's this about?"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message *</label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => updateFormData("message", e.target.value)}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                    className="mt-1 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full text-white" style={{ backgroundColor: ethiopianColors.green }}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Dr. Nega Education Center</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4" style={{ color: ethiopianColors.green }} />
                    <span>info@ethiopicsglobal.edu</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4" style={{ color: ethiopianColors.yellow }} />
                    <span>+251-911-000000</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4" style={{ color: ethiopianColors.red }} />
                    <span>Addis Ababa, Ethiopia</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  <Button variant="outline" size="sm">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Office Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Public Tutors Page Component
export function PublicTutorsPage({
  tutors,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedGender,
  setSelectedGender,
  onBooking,
  onNavigate,
  darkMode,
  setDarkMode,
  currentUser,
}) {
  const languages = ["all", "Amharic", "Afaan Oromo", "Tigrigna", "Somali", "Afar", "Guragigna"]
  const genders = ["all", "Male", "Female"]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader onNavigate={onNavigate} darkMode={darkMode} setDarkMode={setDarkMode} currentPage="tutors" />

      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Find Your Perfect Tutor</h1>
          <p className="text-lg text-muted-foreground">Connect with verified Ethiopian language experts</p>
        </div>

        {/* Search and Filter */}
        <Card className="p-4 sm:p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 sm:col-span-2">
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
        </Card>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor) => (
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
                        <Star className="h-3 w-3" style={{ color: ethiopianColors.yellow }} fill="currentColor" />
                        <span className="text-sm ml-1">{tutor.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({tutor.reviews})</span>
                      {tutor.verified && <CheckCircle className="h-3 w-3" style={{ color: ethiopianColors.green }} />}
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
                      onClick={() =>
                        currentUser ? onBooking(tutor.id, tutor.languages[0], "Conversational") : onNavigate("login")
                      }
                      className="text-white"
                      style={{ backgroundColor: ethiopianColors.green }}
                    >
                      {currentUser ? "Book Lesson" : "Sign In to Book"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tutors.length === 0 && (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No tutors found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </Card>
        )}
      </div>
    </div>
  )
}

// Footer Component
export function Footer({ darkMode, onNavigate, showScrollTop, scrollToTop }) {
  return (
    <>
      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
                  }}
                >
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Ethiopics Global</h3>
                  <p className="text-xs text-muted-foreground">University</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting Ethiopian diaspora with their linguistic heritage through expert tutoring.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4" style={{ color: ethiopianColors.green }} />
                  <span>drnegaeducationcenter@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4" style={{ color: ethiopianColors.red }} />
                  <span>Columbus, Ohio</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:shadow-md transition-all duration-200 bg-transparent"
                  style={{ borderColor: ethiopianColors.green }}
                >
                  <Facebook className="h-4 w-4" style={{ color: ethiopianColors.green }} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:shadow-md transition-all duration-200 bg-transparent"
                  style={{ borderColor: ethiopianColors.yellow }}
                >
                  <Twitter className="h-4 w-4" style={{ color: ethiopianColors.red }} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:shadow-md transition-all duration-200 bg-transparent"
                  style={{ borderColor: ethiopianColors.red }}
                >
                  <Instagram className="h-4 w-4" style={{ color: ethiopianColors.red }} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:shadow-md transition-all duration-200 bg-transparent"
                  style={{ borderColor: ethiopianColors.green }}
                >
                  <Linkedin className="h-4 w-4" style={{ color: ethiopianColors.green }} />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("home")}
                  className="p-0 h-auto justify-start hover:text-green-600 transition-colors"
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("tutors")}
                  className="p-0 h-auto justify-start hover:text-green-600 transition-colors"
                >
                  Find Tutors
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("about")}
                  className="p-0 h-auto justify-start hover:text-green-600 transition-colors"
                >
                  About Us
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("contact")}
                  className="p-0 h-auto justify-start hover:text-green-600 transition-colors"
                >
                  Contact
                </Button>
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <h4 className="font-semibold">Languages</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Amharic</p>
                <p>Afaan Oromo</p>
                <p>Tigrigna</p>
                <p>Somali</p>
                <p>Afar</p>
                <p>Agewegna</p>
                <p>Guragigna</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold">Dr. Nega Education Center</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3" />
                  <span>drnegaeducationcenter@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>+1-614-000-0000</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>Columbus, Ohio, USA</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6 sm:my-8" />

          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2025 Ethiopics Global University. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs">
                Privacy Policy
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs">
                Terms of Service
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="sm"
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg z-50 hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: ethiopianColors.green }}
          title="Back to top"
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </Button>
      )}
    </>
  )
}

export default { NotificationPanel, DetailedProfileModal, AboutPage, ContactPage, PublicTutorsPage, Footer }
