"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Star,
  Users,
  CheckCircle,
  Calendar,
  GraduationCap,
  MessageCircle,
  ThumbsUp,
  Phone,
  X,
  Check,
  Shield,
  User,
  Save,
  Edit,
  Search,
  Plus,
  Eye,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

// Ethiopian flag colors
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
}

// Student Dashboard Component
export function StudentDashboard({
  tutors,
  searchQuery,
  setSearchQuery,
  selectedLanguage,
  setSelectedLanguage,
  selectedGender,
  setSelectedGender,
  bookings,
  onBooking,
  onSubmitFeedback,
  currentUser,
  onViewProfile,
  feedbacks,
}) {
  const [activeTab, setActiveTab] = useState("find-tutors")
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ tutorId: null, rating: 5, comment: "", lesson: "" })
  const [viewMode, setViewMode] = useState("grid") // Added grid/list view toggle
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.fullName?.split(" ")[0] || "",
    lastName: currentUser?.fullName?.split(" ").slice(1).join(" ") || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    telegramUsername: currentUser?.telegramUsername || "",
  })
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintData, setComplaintData] = useState({ bookingId: null, subject: "", message: "" })

  const languages = ["all", "Amharic", "Afaan Oromo", "Tigrigna", "Somali", "Afar", "Guragigna"]
  const genders = ["all", "Male", "Female"]

  const filteredAndSortedTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.languages.some((lang) => lang.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tutor.bio.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLanguage = selectedLanguage === "all" || tutor.languages.includes(selectedLanguage)
    const matchesGender = selectedGender === "all" || tutor.gender === selectedGender

    return matchesSearch && matchesLanguage && matchesGender
  })

  const sampleFeedbacks = [
    {
      id: "demo1",
      tutorName: "Meron Tadesse",
      tutorId: "tutor1",
      studentName: currentUser?.fullName || currentUser?.email,
      rating: 5,
      comment:
        "Excellent Amharic lessons! Meron is very patient and explains grammar concepts clearly. I've improved significantly in just 2 months.",
      lesson: "Conversational Amharic",
      date: "2024-01-15",
      helpful: 12,
      verified: true,
    },
    {
      id: "demo2",
      tutorName: "Dawit Bekele",
      tutorId: "tutor2",
      studentName: currentUser?.fullName || currentUser?.email,
      rating: 4,
      comment:
        "Great Afaan Oromo instructor. The cultural context he provides makes learning much more engaging and meaningful.",
      lesson: "Oromo Cultural Studies",
      date: "2024-01-10",
      helpful: 8,
      verified: true,
    },
    {
      id: "demo3",
      tutorName: "Hanan Ahmed",
      tutorId: "tutor3",
      studentName: currentUser?.fullName || currentUser?.email,
      rating: 5,
      comment:
        "Outstanding Tigrigna lessons with focus on practical conversation. Hanan's teaching style is very effective.",
      lesson: "Tigrigna Conversation",
      date: "2024-01-05",
      helpful: 15,
      verified: true,
    },
  ]

  const allFeedbacks = [
    ...sampleFeedbacks,
    ...feedbacks.filter((f) => f.studentName === (currentUser?.fullName || currentUser?.email)),
  ]

  const submitFeedback = () => {
    if (!feedbackData.comment || !feedbackData.lesson) {
      toast.error("Please fill in all feedback fields")
      return
    }
    onSubmitFeedback(feedbackData.tutorId, feedbackData.rating, feedbackData.comment, feedbackData.lesson)
    setShowFeedbackModal(false)
    setFeedbackData({ tutorId: null, rating: 5, comment: "", lesson: "" })
  }

  const submitComplaint = () => {
    if (!complaintData.subject || !complaintData.message) {
      toast.error("Please fill in all complaint fields")
      return
    }
    // Simulate sending complaint to admin
    toast.success("Complaint submitted successfully! Our support team will contact you within 24 hours.")
    setShowComplaintModal(false)
    setComplaintData({ bookingId: null, subject: "", message: "" })
  }

  const updateProfile = () => {
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      toast.error("Please fill in required fields (First Name, Last Name and Email)")
      return
    }
    // Here you would typically call an API to update the user profile
    toast.success("Profile updated successfully!")
    setIsEditingProfile(false)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-950/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-200">
              Welcome back, {currentUser?.fullName?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-green-600 dark:text-green-300 mt-1">Continue your Ethiopian language learning journey</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {bookings.filter((b) => b.status === "confirmed").length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-300">Active Lessons</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="find-tutors">Find Tutors</TabsTrigger>
          <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="my-feedback">My Reviews</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Find Tutors Tab */}
        <TabsContent value="find-tutors" className="space-y-6">
          {/* Search and Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Perfect Ethiopian Language Tutor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, language, or expertise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-full md:w-48">
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
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender === "all" ? "All" : gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                >
                  {viewMode === "grid" ? "☰" : "⊞"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tutors Grid/List */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredAndSortedTutors.map((tutor) => (
              <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={tutor.profileImage || "/placeholder.svg"} alt={tutor.name} />
                      <AvatarFallback>
                        {tutor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{tutor.name}</h3>
                        {tutor.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{tutor.rating}</span>
                        <span className="text-muted-foreground text-sm">({tutor.reviews} reviews)</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tutor.languages.map((lang) => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tutor.bio}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">{tutor.hourlyRate}</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => onViewProfile(tutor, "tutor")}>
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onBooking(tutor.id, tutor.languages[0], "Conversational")}
                            style={{ backgroundColor: ethiopianColors.green }}
                            className="text-white hover:opacity-90"
                          >
                            Book Lesson
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndSortedTutors.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tutors found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Bookings Tab */}
        <TabsContent value="my-bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Lesson Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{booking.tutorName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {booking.language} - {booking.lessonType}
                          </p>
                        </div>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "pending_payment"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {booking.date}
                        </div>
                        <div className="flex gap-2">
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setFeedbackData({
                                  tutorId: booking.tutorId,
                                  rating: 5,
                                  comment: "",
                                  lesson: booking.lessonType,
                                })
                                setShowFeedbackModal(true)
                              }}
                            >
                              Leave Review
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setComplaintData({ bookingId: booking.id, subject: "", message: "" })
                              setShowComplaintModal(true)
                            }}
                          >
                            Report Issue
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">Book your first lesson to get started!</p>
                  <Button onClick={() => setActiveTab("find-tutors")}>Find Tutors</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Feedback Tab */}
        <TabsContent value="my-feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                My Reviews & Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{feedback.tutorName}</h4>
                        <p className="text-sm text-muted-foreground">{feedback.lesson}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm mb-3">{feedback.comment}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{feedback.date}</span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{feedback.helpful} helpful</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telegram">Telegram Username</Label>
                      <Input
                        id="telegram"
                        value={profileData.telegramUsername}
                        onChange={(e) => setProfileData({ ...profileData, telegramUsername: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        updateProfile()
                        setIsEditingProfile(false)
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={currentUser?.profileImage || "/placeholder.svg"} alt="Profile" />
                        <AvatarFallback className="text-lg">
                          {(currentUser?.fullName || currentUser?.email || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{currentUser?.fullName || currentUser?.email}</h3>
                        <p className="text-muted-foreground">Student</p>
                      </div>
                    </div>
                    <Button onClick={() => setIsEditingProfile(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p>{currentUser?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p>{currentUser?.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Telegram</Label>
                      <p>{currentUser?.telegramUsername || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                      <p>January 2025</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>Share your experience with this tutor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= feedbackData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="lesson">Lesson Type</Label>
              <Input
                id="lesson"
                value={feedbackData.lesson}
                onChange={(e) => setFeedbackData({ ...feedbackData, lesson: e.target.value })}
                placeholder="e.g., Conversational Amharic"
              />
            </div>
            <div>
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={feedbackData.comment}
                onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  submitFeedback()
                  setShowFeedbackModal(false)
                  setFeedbackData({ tutorId: null, rating: 5, comment: "", lesson: "" })
                }}
              >
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Modal */}
      <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>Let us know about any problems you experienced</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={complaintData.subject}
                onChange={(e) => setComplaintData({ ...complaintData, subject: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            <div>
              <Label htmlFor="message">Details</Label>
              <Textarea
                id="message"
                value={complaintData.message}
                onChange={(e) => setComplaintData({ ...complaintData, message: e.target.value })}
                placeholder="Please provide more details about the issue..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  submitComplaint()
                  setShowComplaintModal(false)
                  setComplaintData({ bookingId: null, subject: "", message: "" })
                }}
              >
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowComplaintModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Tutor Dashboard Component
export function TutorDashboard({
  bookings,
  onConfirmBooking,
  feedbacks,
  currentUser,
  onViewProfile,
  tutors,
  setTutors,
}) {
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedProfile, setEditedProfile] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showProgressModal, setShowProgressModal] = useState(false)

  const currentTutor = tutors.find(
    (tutor) => tutor.name === currentUser?.fullName || tutor.email === currentUser?.email,
  )

  const demoTutorProfile = {
    name: "Dr. Alemayehu Tadesse",
    email: "alemayehu.tadesse@ethiopianlanguages.com",
    phone: "+251-911-123456",
    role: "Senior Ethiopian Language Instructor & Cultural Expert",
    bio: "Passionate educator with over 10 years of experience teaching Ethiopian languages and cultural studies. Specialized in Amharic, Afaan Oromo, and Tigrigna instruction for international students.",
    fullBio:
      "Dr. Alemayehu Tadesse is a distinguished Ethiopian language educator with a PhD in Ethiopian Languages from Addis Ababa University. With over a decade of teaching experience, he has helped hundreds of international students master Ethiopian languages while gaining deep cultural understanding. His innovative teaching methods combine traditional pedagogical approaches with modern technology to create engaging and effective learning experiences.",
    rating: 4.9,
    reviews: 127,
    responseTime: "2 hours",
    completedSessions: 1250,
    languages: ["Amharic", "Afaan Oromo", "Tigrigna", "English"],
    specialties: ["Cultural Studies", "Conversational Practice", "Academic Writing", "Business Communication"],
    verified: true,
    approved: true,
    profileImage: "/professional-ethiopian-tutor.jpg",
    personalInfo: {
      nationality: "Ethiopian",
      address: "Addis Ababa, Ethiopia",
      dateOfBirth: "1985-03-15",
      emergencyContact: "+251-911-654321",
    },
    timezone: "EAT (UTC+3)",
    professionalSkills: ["Language Instruction", "Cultural Education", "Curriculum Development", "Online Teaching"],
    certifications: ["TESOL Certification", "Ethiopian Language Teaching Certificate", "Cultural Studies Diploma"],
    workExperience: [
      { position: "Senior Language Instructor", company: "Ethiopics Global University", duration: "2020-Present" },
      { position: "Cultural Consultant", company: "Ethiopian Heritage Foundation", duration: "2018-2020" },
    ],
    educationDetails: [
      { degree: "PhD in Ethiopian Languages", institution: "Addis Ababa University", year: "2018" },
      { degree: "MA in Linguistics", institution: "Addis Ababa University", year: "2014" },
    ],
    socialMedia: { linkedin: "linkedin.com/in/alemayehu-tadesse", twitter: "@alemayehu_et", facebook: "" },
    hobbies: ["Traditional Music", "Ethiopian Cuisine", "Cultural Research", "Community Service"],
    preferredCommunication: "email",
  }

  // Use demo profile if no current tutor found
  const tutorProfile = currentTutor || demoTutorProfile

  const demoBookings = [
    {
      id: 1,
      studentName: "Sarah Johnson",
      date: "2025-01-20",
      time: "2:00 PM",
      language: "Amharic",
      lessonType: "Conversational",
      status: "confirmed",
      duration: "60 minutes",
      studentLevel: "Intermediate",
    },
    {
      id: 2,
      studentName: "Michael Chen",
      date: "2025-01-22",
      time: "10:00 AM",
      language: "Afaan Oromo",
      lessonType: "Business",
      status: "pending_confirmation",
      duration: "90 minutes",
      studentLevel: "Beginner",
    },
    {
      id: 3,
      studentName: "Emma Wilson",
      date: "2025-01-25",
      time: "4:00 PM",
      language: "Tigrigna",
      lessonType: "Academic",
      status: "confirmed",
      duration: "60 minutes",
      studentLevel: "Advanced",
    },
  ]

  const demoStudents = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@demo.com",
      joinDate: "2024-12-15",
      lessonsCompleted: 12,
      currentLevel: "Intermediate",
      preferredLanguage: "Amharic",
      location: "Toronto, Canada",
      profileImage: "/canadian-software-engineer-learning-ethiopian-language.jpg",
      progressData: {
        totalLessons: 20,
        completedLessons: 12,
        currentStreak: 5,
        averageScore: 85,
        strengths: ["Pronunciation", "Cultural Understanding"],
        areasForImprovement: ["Grammar", "Writing"],
        recentLessons: [
          { date: "2025-01-18", topic: "Amharic Greetings", score: 90, duration: "60 min" },
          { date: "2025-01-15", topic: "Family Vocabulary", score: 88, duration: "60 min" },
          { date: "2025-01-12", topic: "Numbers and Time", score: 82, duration: "45 min" },
          { date: "2025-01-10", topic: "Food and Dining", score: 85, duration: "60 min" },
        ],
        skillProgress: {
          speaking: 75,
          listening: 80,
          reading: 70,
          writing: 65,
          grammar: 68,
          vocabulary: 85,
        },
      },
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael@demo.com",
      joinDate: "2025-01-05",
      lessonsCompleted: 3,
      currentLevel: "Beginner",
      preferredLanguage: "Afaan Oromo",
      location: "Sydney, Australia",
      profileImage: "/placeholder.svg?height=300&width=300",
      progressData: {
        totalLessons: 10,
        completedLessons: 3,
        currentStreak: 2,
        averageScore: 78,
        strengths: ["Enthusiasm", "Pronunciation"],
        areasForImprovement: ["Vocabulary", "Grammar"],
        recentLessons: [
          { date: "2025-01-17", topic: "Basic Oromo Phrases", score: 80, duration: "45 min" },
          { date: "2025-01-14", topic: "Alphabet and Sounds", score: 75, duration: "60 min" },
          { date: "2025-01-11", topic: "Introduction to Oromo", score: 78, duration: "30 min" },
        ],
        skillProgress: {
          speaking: 60,
          listening: 65,
          reading: 45,
          writing: 40,
          grammar: 50,
          vocabulary: 55,
        },
      },
    },
    {
      id: 3,
      name: "Emma Wilson",
      email: "emma@demo.com",
      joinDate: "2024-11-20",
      lessonsCompleted: 18,
      currentLevel: "Advanced",
      preferredLanguage: "Tigrigna",
      location: "London, UK",
      profileImage: "/placeholder.svg?height=300&width=300",
      progressData: {
        totalLessons: 25,
        completedLessons: 18,
        currentStreak: 8,
        averageScore: 92,
        strengths: ["Grammar", "Reading Comprehension", "Cultural Knowledge"],
        areasForImprovement: ["Conversational Speed", "Idioms"],
        recentLessons: [
          { date: "2025-01-19", topic: "Tigrigna Literature", score: 95, duration: "90 min" },
          { date: "2025-01-16", topic: "Advanced Grammar", score: 90, duration: "75 min" },
          { date: "2025-01-13", topic: "Business Tigrigna", score: 88, duration: "60 min" },
          { date: "2025-01-11", topic: "Poetry Analysis", score: 96, duration: "90 min" },
        ],
        skillProgress: {
          speaking: 88,
          listening: 92,
          reading: 95,
          writing: 90,
          grammar: 94,
          vocabulary: 91,
        },
      },
    },
  ]

  const demoReviews = [
    {
      id: 1,
      studentName: "Sarah Johnson",
      rating: 5,
      comment: "Excellent teacher! Very patient and knowledgeable about Ethiopian culture. Highly recommend!",
      date: "2025-01-15",
      lesson: "Amharic Conversation Practice",
    },
    {
      id: 2,
      studentName: "Michael Chen",
      rating: 4,
      comment: "Great lessons on Oromo traditions. Learning a lot about the language and culture.",
      date: "2025-01-10",
      lesson: "Afaan Oromo Basics",
    },
    {
      id: 3,
      studentName: "Emma Wilson",
      rating: 5,
      comment: "Outstanding instruction in Tigrigna literature. Very professional and engaging.",
      date: "2025-01-08",
      lesson: "Tigrigna Poetry Analysis",
    },
  ]

  const handleEditProfile = () => {
    setEditedProfile({
      ...tutorProfile,
      // Add additional detailed fields
      fullBio: tutorProfile.fullBio || tutorProfile.bio || "",
      personalStatement:
        tutorProfile.personalStatement ||
        "Passionate about teaching Ethiopian languages and preserving cultural heritage through education.",
      teachingPhilosophy:
        tutorProfile.teachingPhilosophy ||
        "I believe in creating an immersive learning environment that combines language instruction with cultural understanding.",
      achievements: tutorProfile.achievements || [
        "Outstanding Teacher Award 2024",
        "Cultural Ambassador Recognition",
        "Published Research in Ethiopian Linguistics",
      ],
      certifications: tutorProfile.certifications || [
        "TESOL Certification",
        "Ethiopian Language Teaching Certificate",
        "Cultural Studies Diploma",
      ],
      workExperience: tutorProfile.workExperience || [
        { position: "Senior Language Instructor", company: "Ethiopics Global University", duration: "2020-Present" },
        { position: "Cultural Consultant", company: "Ethiopian Heritage Foundation", duration: "2018-2020" },
      ],
      educationDetails: tutorProfile.educationDetails || [
        { degree: "PhD in Ethiopian Languages", institution: "Addis Ababa University", year: "2018" },
        { degree: "MA in Linguistics", institution: "Addis Ababa University", year: "2014" },
      ],
      socialMedia: tutorProfile.socialMedia || { linkedin: "", twitter: "", facebook: "" },
      personalInfo: tutorProfile.personalInfo || {
        dateOfBirth: "",
        nationality: "Ethiopian",
        address: "Addis Ababa, Ethiopia",
        emergencyContact: "",
      },
      professionalSkills: tutorProfile.professionalSkills || [
        "Language Instruction",
        "Cultural Education",
        "Curriculum Development",
        "Online Teaching",
      ],
      hobbies: tutorProfile.hobbies || [
        "Traditional Music",
        "Ethiopian Cuisine",
        "Cultural Research",
        "Community Service",
      ],
      timezone: tutorProfile.timezone || "EAT (UTC+3)",
      preferredCommunication: tutorProfile.preferredCommunication || "email",
    })
    setIsEditingProfile(true)
  }

  const handleSaveProfile = () => {
    const updatedTutors = tutors.map((tutor) =>
      tutor.name === currentUser?.fullName || tutor.email === currentUser?.email
        ? { ...tutor, ...editedProfile }
        : tutor,
    )
    setTutors(updatedTutors)
    setIsEditingProfile(false)
    setEditedProfile(null)
    toast.success("Profile updated successfully!")
  }

  const handleCancelEdit = () => {
    setIsEditingProfile(false)
    setEditedProfile(null)
  }

  const handleViewProgress = (student) => {
    setSelectedStudent(student)
    setShowProgressModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              Welcome, {currentUser?.fullName?.split(" ")[0] || "Tutor"}!
            </h1>
            <p className="text-blue-600 dark:text-blue-300 mt-1">Manage your lessons and connect with students</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {bookings.filter((b) => b.status === "confirmed").length}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-300">Active Students</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tutor Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={tutorProfile.profileImage || "/placeholder.svg"} alt={tutorProfile.name} />
                    <AvatarFallback>
                      {tutorProfile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{tutorProfile.name}</h3>
                    <p className="text-muted-foreground">{tutorProfile.role}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{tutorProfile.rating}</span>
                        <span className="text-muted-foreground">({tutorProfile.reviews} reviews)</span>
                      </div>
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                  <Button onClick={() => setIsEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                {/* Languages & Specialties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {tutorProfile.languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {tutorProfile.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h4 className="font-semibold mb-3">About Me</h4>
                  <p className="text-muted-foreground leading-relaxed">{tutorProfile.fullBio || tutorProfile.bio}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{tutorProfile.completedSessions}</div>
                      <div className="text-sm text-muted-foreground">Completed Sessions</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{tutorProfile.responseTime}</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{tutorProfile.reviews}</div>
                      <div className="text-sm text-muted-foreground">Student Reviews</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lesson Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{booking.studentName || "Student"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {booking.language} - {booking.lessonType}
                          </p>
                        </div>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "pending_confirmation"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {booking.date}
                        </div>
                        <div className="flex gap-2">
                          {booking.status === "pending_confirmation" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => onConfirmBooking(booking.id, true)}
                                style={{ backgroundColor: ethiopianColors.green }}
                                className="text-white hover:opacity-90"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => onConfirmBooking(booking.id, false)}>
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground">Students will book lessons with you soon!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                <p className="text-muted-foreground">Once students book lessons, they'll appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Student Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{feedback.studentName}</h4>
                          <p className="text-sm text-muted-foreground">{feedback.lesson}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm mb-3">{feedback.comment}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{feedback.date}</span>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{feedback.helpful} helpful</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">Student reviews will appear here after completed lessons</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Admin Dashboard Component
export function AdminDashboard({
  tutors,
  students,
  bookings,
  paymentVerifications,
  feedbacks,
  pendingTutors = [], // Added for CV approval system
  onVerifyTutor,
  onApproveTutor,
  onVerifyPayment,
  onViewProfile,
  onApproveTutorCV, // Added for CV approval system
  onRejectTutorCV, // Added for CV approval system
}) {
  const [activeTab, setActiveTab] = useState("overview")
  const [editingTutor, setEditingTutor] = useState(null)
  const [editingStudent, setEditingStudent] = useState(null)
  const [showAddTutorModal, setShowAddTutorModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ tutorId: null, rating: 5, comment: "", lesson: "" })
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintData, setComplaintData] = useState({ bookingId: null, subject: "", message: "" })
  const [managedTutors, setManagedTutors] = useState(tutors)
  const [managedStudents, setManagedStudents] = useState(students)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "new_registration",
      title: "New Student Registration",
      message: "Sarah Johnson has registered for Amharic lessons",
      timestamp: "2 minutes ago",
      read: false,
      priority: "medium",
    },
    {
      id: 2,
      type: "payment_received",
      title: "Payment Received",
      message: "Payment of $45 received from Michael Chen",
      timestamp: "15 minutes ago",
      read: false,
      priority: "low",
    },
    {
      id: 3,
      type: "complaint_filed",
      title: "New Complaint Filed",
      message: "Technical issue reported by Emma Wilson",
      timestamp: "1 hour ago",
      read: true,
      priority: "high",
    },
    {
      id: 4,
      type: "tutor_application",
      title: "New Tutor Application",
      message: "CV submitted by Alemayehu Tadesse for review",
      timestamp: "3 hours ago",
      read: false,
      priority: "medium",
    },
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  const [complaints, setComplaints] = useState([
    {
      id: 1,
      type: "technical_issue",
      from: "Sarah Johnson",
      subject: "Audio problems during Amharic lesson",
      message:
        "I experienced constant audio cutting during my lesson with Tutor Alemayehu. The session was disrupted multiple times and I couldn't follow the pronunciation exercises properly.",
      timestamp: "2 hours ago",
      status: "pending",
      priority: "high",
      tutorInvolved: "Alemayehu Tadesse",
    },
    {
      id: 2,
      type: "tutor_behavior",
      from: "Michael Chen",
      subject: "Tutor was late for scheduled lesson",
      message:
        "My tutor was 15 minutes late for our scheduled Tigrigna lesson without any prior notice. This affected my learning schedule.",
      timestamp: "1 day ago",
      status: "resolved",
      priority: "medium",
      tutorInvolved: "Bereket Haile",
    },
    {
      id: 3,
      type: "payment_issue",
      from: "Emma Wilson",
      subject: "Payment processed but lesson not confirmed",
      message:
        "I made the payment for my Afaan Oromo lesson 3 days ago, but the lesson status still shows as pending payment.",
      timestamp: "3 days ago",
      status: "investigating",
      priority: "high",
      tutorInvolved: "Almaz Bekele",
    },
  ])

  const [tutorSearchTerm, setTutorSearchTerm] = useState("")
  const [studentSearchTerm, setStudentSearchTerm] = useState("")

  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedComplaintContact, setSelectedComplaintContact] = useState(null)

  // Demo contact data for complaints
  const contactDetails = {
    1: {
      student: { name: "Sarah Johnson", phone: "+251-911-234567", telegram: "@sarah_johnson_et" },
      tutor: { name: "Alemayehu Tadesse", phone: "+251-912-345678", telegram: "@alemayehu_tutor" },
    },
    2: {
      student: { name: "Michael Chen", phone: "+251-913-456789", telegram: "@michael_chen_et" },
      tutor: { name: "Bereket Haile", phone: "+251-914-567890", telegram: "@bereket_haile_tutor" },
    },
    3: {
      student: { name: "Emma Wilson", phone: "+251-915-678901", telegram: "@emma_wilson_et" },
      tutor: { name: "Almaz Bekele", phone: "+251-916-789012", telegram: "@almaz_bekele_tutor" },
    },
  }

  const handleContactClick = (complaintId) => {
    setSelectedComplaintContact(contactDetails[complaintId])
    setShowContactModal(true)
  }

  const handleDeleteTutor = (tutorId) => {
    setManagedTutors((prev) => prev.filter((tutor) => tutor.id !== tutorId))
    toast.success(`Tutor deleted successfully from the platform.`)
  }

  const handleDeleteStudent = (studentId) => {
    setManagedStudents((prev) => prev.filter((student) => student.id !== studentId))
    toast.success(`Student account deleted successfully.`)
  }

  const handleEditTutor = (tutor) => {
    setEditingTutor(tutor)
    setShowAddTutorModal(true)
  }

  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setShowAddStudentModal(true)
  }

  const handleSaveTutor = (updatedTutor) => {
    if (editingTutor) {
      setManagedTutors((prev) => prev.map((tutor) => (tutor.id === updatedTutor.id ? updatedTutor : tutor)))
      toast.success(`Tutor profile updated successfully.`)
    } else {
      const newTutor = { ...updatedTutor, id: Date.now() }
      setManagedTutors((prev) => [...prev, newTutor])
      toast.success(`New tutor added successfully.`)
    }
    setEditingTutor(null)
    setShowAddTutorModal(false)
  }

  const handleSaveStudent = (updatedStudent) => {
    if (editingStudent) {
      setManagedStudents((prev) => prev.map((student) => (student.id === updatedStudent.id ? updatedStudent : student)))
      toast.success(`Student profile updated successfully.`)
    } else {
      const newStudent = { ...updatedStudent, id: Date.now() }
      setManagedStudents((prev) => [...prev, newStudent])
      toast.success(`New student added successfully.`)
    }
    setEditingStudent(null)
    setShowAddStudentModal(false)
  }

  const handleComplaintStatusChange = (complaintId, newStatus) => {
    setComplaints((prev) =>
      prev.map((complaint) => (complaint.id === complaintId ? { ...complaint, status: newStatus } : complaint)),
    )

    // Add notification for status change
    const complaint = complaints.find((c) => c.id === complaintId)
    if (complaint) {
      const newNotification = {
        id: Date.now(),
        type: "complaint_update",
        title: "Complaint Status Updated",
        message: `Complaint from ${complaint.from} has been marked as ${newStatus}`,
        timestamp: "Just now",
        read: false,
        priority: "medium",
      }
      setNotifications((prev) => [newNotification, ...prev])
    }

    toast.success(`Complaint status updated to ${newStatus}.`)
  }

  const handleAssignComplaint = (complaintId, assignee) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === complaintId ? { ...complaint, assignedTo: assignee, status: "investigating" } : complaint,
      ),
    )
    toast.success(`Complaint assigned to ${assignee}.`)
  }

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const deleteNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }

  const submitFeedback = () => {
    if (!feedbackData.comment || !feedbackData.lesson) {
      toast.error("Please fill in all feedback fields")
      return
    }
    // onSubmitFeedback(feedbackData.tutorId, feedbackData.rating, feedbackData.comment, feedbackData.lesson)
    setShowFeedbackModal(false)
    setFeedbackData({ tutorId: null, rating: 5, comment: "", lesson: "" })
    toast.success("Feedback submitted successfully!")
  }

  const submitComplaint = () => {
    if (!complaintData.subject || !complaintData.message) {
      toast.error("Please fill in all complaint fields")
      return
    }
    // Simulate sending complaint to admin
    toast.success("Complaint submitted successfully! Our support team will contact you within 24 hours.")
    setShowComplaintModal(false)
    setComplaintData({ bookingId: null, subject: "", message: "" })
  }

  const pendingComplaints = complaints.filter((c) => c.status === "pending").length
  const unreadNotifications = notifications.filter((n) => !n.read).length

  const filteredTutors = managedTutors.filter(
    (tutor) =>
      tutor.name.toLowerCase().includes(tutorSearchTerm.toLowerCase()) ||
      tutor.email.toLowerCase().includes(tutorSearchTerm.toLowerCase()) ||
      tutor.languages.some((lang) => lang.toLowerCase().includes(tutorSearchTerm.toLowerCase())),
  )

  const filteredStudents = managedStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.location.toLowerCase().includes(studentSearchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-800 dark:text-purple-200">Admin Dashboard</h1>
            <p className="text-purple-600 dark:text-purple-300 mt-1">Manage platform operations and user activities</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{tutors.length}</div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Tutors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{students.length}</div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{bookings.length}</div>
              <div className="text-sm text-purple-600 dark:text-purple-300">Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tutors</p>
                    <p className="text-2xl font-bold">{tutors.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                    <p className="text-2xl font-bold">{bookings.filter((b) => b.status === "confirmed").length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                    <p className="text-2xl font-bold">{pendingTutors.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        notification.priority === "high"
                          ? "bg-red-500"
                          : notification.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tutors Tab */}
        <TabsContent value="tutors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tutor Management</span>
                <Button onClick={() => setShowAddTutorModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tutor
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search tutors..."
                  value={tutorSearchTerm}
                  onChange={(e) => setTutorSearchTerm(e.target.value)}
                />
                <div className="space-y-4">
                  {tutors
                    .filter(
                      (tutor) =>
                        tutor.name.toLowerCase().includes(tutorSearchTerm.toLowerCase()) ||
                        tutor.email.toLowerCase().includes(tutorSearchTerm.toLowerCase()),
                    )
                    .map((tutor) => (
                      <div key={tutor.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={tutor.profileImage || "/placeholder.svg"} />
                              <AvatarFallback>
                                {tutor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{tutor.name}</h4>
                              <p className="text-sm text-muted-foreground">{tutor.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {tutor.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                {tutor.approved && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onViewProfile(tutor, "tutor")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!tutor.verified && (
                              <Button
                                size="sm"
                                onClick={() => onVerifyTutor(tutor.id)}
                                style={{ backgroundColor: ethiopianColors.green }}
                                className="text-white hover:opacity-90"
                              >
                                Verify
                              </Button>
                            )}
                            {!tutor.approved && tutor.verified && (
                              <Button
                                size="sm"
                                onClick={() => onApproveTutor(tutor.id)}
                                style={{ backgroundColor: ethiopianColors.yellow, color: "#000" }}
                                className="hover:opacity-90"
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Tutor Applications */}
          {pendingTutors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Tutor Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTutors.map((tutor) => (
                    <div key={tutor.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={tutor.profileImage || "/placeholder.svg"} />
                            <AvatarFallback>
                              {tutor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{tutor.name}</h4>
                            <p className="text-sm text-muted-foreground">{tutor.email}</p>
                            <p className="text-sm text-muted-foreground">Applied: {tutor.joinDate}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onViewProfile(tutor, "tutor")}>
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onApproveTutorCV(tutor.id)}
                            style={{ backgroundColor: ethiopianColors.green }}
                            className="text-white hover:opacity-90"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onRejectTutorCV(tutor.id)}>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Student Management</span>
                <Button onClick={() => setShowAddStudentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search students..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                />
                <div className="space-y-4">
                  {students
                    .filter(
                      (student) =>
                        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        student.email.toLowerCase().includes(studentSearchTerm.toLowerCase()),
                    )
                    .map((student) => (
                      <div key={student.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={student.profileImage || "/placeholder.svg"} />
                              <AvatarFallback>
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.lessonsCompleted} lessons completed
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onViewProfile(student, "student")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {booking.studentName || "Student"} → {booking.tutorName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.language} - {booking.lessonType}
                        </p>
                        <p className="text-sm text-muted-foreground">Date: {booking.date}</p>
                      </div>
                      <Badge
                        variant={
                          booking.status === "confirmed"
                            ? "default"
                            : booking.status === "pending_confirmation"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentVerifications.map((verification) => (
                  <div key={verification.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {verification.studentName} → {verification.tutorName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Amount: ${verification.amount} via {verification.paymentMethod}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Transaction ID: {verification.chapaTransactionId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            verification.status === "verified"
                              ? "default"
                              : verification.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {verification.status}
                        </Badge>
                        {verification.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onVerifyPayment(verification.id, "verified")}
                              style={{ backgroundColor: ethiopianColors.green }}
                              className="text-white hover:opacity-90"
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onVerifyPayment(verification.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Complaints & Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{complaint.subject}</h4>
                        <p className="text-sm text-muted-foreground">From: {complaint.from}</p>
                        <p className="text-sm text-muted-foreground">Tutor: {complaint.tutorInvolved}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            complaint.status === "resolved"
                              ? "default"
                              : complaint.status === "investigating"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {complaint.status}
                        </Badge>
                        <Badge
                          variant={
                            complaint.priority === "high"
                              ? "destructive"
                              : complaint.priority === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {complaint.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{complaint.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{complaint.timestamp}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleContactClick(complaint.id)}>
                          Contact User
                        </Button>
                        <Button size="sm" variant="outline">
                          Contact Tutor
                        </Button>
                        {complaint.status === "pending" && (
                          <Button
                            size="sm"
                            style={{ backgroundColor: ethiopianColors.green }}
                            className="text-white hover:opacity-90"
                            onClick={() => handleComplaintStatusChange(complaint.id, "resolved")}
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>Share your experience with this tutor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= feedbackData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="lesson">Lesson Type</Label>
              <Input
                id="lesson"
                value={feedbackData.lesson}
                onChange={(e) => setFeedbackData({ ...feedbackData, lesson: e.target.value })}
                placeholder="e.g., Conversational Amharic"
              />
            </div>
            <div>
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={feedbackData.comment}
                onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  submitFeedback()
                  setShowFeedbackModal(false)
                  setFeedbackData({ tutorId: null, rating: 5, comment: "", lesson: "" })
                }}
              >
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Modal */}
      <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>Let us know about any problems you experienced</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={complaintData.subject}
                onChange={(e) => setComplaintData({ ...complaintData, subject: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            <div>
              <Label htmlFor="message">Details</Label>
              <Textarea
                id="message"
                value={complaintData.message}
                onChange={(e) => setComplaintData({ ...complaintData, message: e.target.value })}
                placeholder="Please provide more details about the issue..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  submitComplaint()
                  setShowComplaintModal(false)
                  setComplaintData({ bookingId: null, subject: "", message: "" })
                }}
              >
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowComplaintModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
          </DialogHeader>
          {selectedComplaintContact && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Student Contact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedComplaintContact.student.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedComplaintContact.student.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedComplaintContact.student.telegram}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Tutor Contact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedComplaintContact.tutor.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedComplaintContact.tutor.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedComplaintContact.tutor.telegram}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default { StudentDashboard, TutorDashboard, AdminDashboard }
