"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import axios from "axios"
import { useAppContext } from "@/context/appContext"
import { useRouter } from "next/navigation"

// Ethiopian flag colors
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
}

export function EnhancedSignUpPage({ darkMode }) {
  const { dispatch, state } = useAppContext()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: state.signupRole || "student",
    phone: "",
    telegram: "",
    address: "",
    gender: "",
    bio: "",
    title: "",
    languages: [],
    hourlyRate: "",
    experience: "",
    education: "",
    specialties: [],
    cvFile: null,
    profilePicture: null,
    certificates: [],
    preferredLanguages: [],
  })
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [availableLanguages] = useState([
    "Amharic",
    "Afaan Oromo",
    "Tigrigna",
    "Afar",
    "Somali",
    "Agewegna",
    "Guragigna",
  ])
  const [availableSpecialties] = useState([
    "Business Communication",
    "Academic Writing",
    "Conversational",
    "Literature",
    "Cultural Studies",
    "Translation",
    "Children's Education",
    "Adult Learning",
  ])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (formData.role === "tutor") {
      if (
        !formData.phone ||
        !formData.telegram ||
        !formData.gender ||
        !formData.bio ||
        formData.languages.length === 0 ||
        !formData.hourlyRate ||
        !formData.title
      ) {
        toast.error("Please complete all required tutor fields")
        setLoading(false)
        return
      }
      if (!formData.cvFile) {
        toast.error("Please upload your CV")
        setLoading(false)
        return
      }
      if (!formData.profilePicture) {
        toast.error("Please upload a profile picture")
        setLoading(false)
        return
      }
    }

    if (formData.role === "student") {
      if (!formData.phone || !formData.telegram || !formData.address || !formData.gender || formData.preferredLanguages.length === 0) {
        toast.error("Please complete all required student fields")
        setLoading(false)
        return
      }
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("firstname", formData.firstName)
      formDataToSend.append("lastname", formData.lastName)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("role", formData.role)
      formDataToSend.append("phone", formData.phone)
      formDataToSend.append("telegram", formData.telegram)
      formDataToSend.append("gender", formData.gender)

      if (formData.role === "student") {
        formDataToSend.append("address", formData.address)
        formDataToSend.append("preferredLanguages", JSON.stringify(formData.preferredLanguages))
      }

      if (formData.role === "tutor") {
        formDataToSend.append("bio", formData.bio)
        formDataToSend.append("title", formData.title)
        formDataToSend.append("language", JSON.stringify(formData.languages))
        formDataToSend.append("hourlyRate", formData.hourlyRate.replace("$/hour", ""))
        formDataToSend.append("description", formData.bio) // Map bio to description
        formDataToSend.append("experience", formData.experience)
        formDataToSend.append("education", formData.education)
        formDataToSend.append("specialties", JSON.stringify(formData.specialties))
        if (formData.cvFile) formDataToSend.append("cv", formData.cvFile)
        if (formData.profilePicture) formDataToSend.append("photo", formData.profilePicture)
        formData.certificates.forEach((cert, index) => {
          formDataToSend.append(`certificates[${index}]`, cert)
        })
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      const { token, user } = response.data
      localStorage.setItem("token", token) // Store token
      dispatch({
        type: "SET_USER",
        payload: { user, role: user.role },
      })

      // Add to context based on role
      if (user.role === "tutor") {
        dispatch({ type: "ADD_TUTOR", payload: { ...user, approved: false, verified: false } })
      } else if (user.role === "student") {
        dispatch({ type: "ADD_STUDENT", payload: user })
      }

      toast.success(
        user.role === "tutor"
          ? "Registration successful! Your account is pending admin approval."
          : "Registration successful!"
      )

      // Redirect based on role
      if (user.role === "student") {
        router.push("/student-dashboard")
      } else if (user.role === "tutor") {
        router.push("/tutor-dashboard")
      } else if (user.role === "admin") {
        router.push("/admin-dashboard")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleLanguage = (language) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }))
  }

  const toggleSpecialty = (specialty) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }))
  }

  const togglePreferredLanguage = (language) => {
    setFormData((prev) => ({
      ...prev,
      preferredLanguages: prev.preferredLanguages.includes(language)
        ? prev.preferredLanguages.filter((l) => l !== language)
        : [...prev.preferredLanguages, language],
    }))
  }

  const nextStep = () => {
    if (step === 1) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        toast.error("Please fill in all required fields")
        return
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
    }
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const handleFileUpload = (field, file) => {
    if (field === "cvFile" && file && file.size > 2 * 1024 * 1024) {
      toast.error("CV file must be less than 2MB")
      return
    }
    if (field === "profilePicture" && file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
      if (!allowedTypes.includes(file.type)) {
        toast.error("Profile picture must be in JPG, JPEG, or PNG format")
        return
      }
    }
    setFormData((prev) => ({ ...prev, [field]: file }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "home" } })}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(45deg, ${ethiopianColors.green}, ${ethiopianColors.yellow}, ${ethiopianColors.red})`,
              }}
            >
              <span className="text-white text-sm font-bold">🎓</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-foreground leading-tight">Ethiopics Global</h1>
              <span className="text-xs text-muted-foreground leading-tight">University</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "SET_UI_STATE", payload: { darkMode: !darkMode } })}
          >
            {darkMode ? "☀️" : "🌙"}
          </Button>
        </div>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Ethiopics Global University</CardTitle>
          <p className="text-muted-foreground">
            {formData.role === "student"
              ? "Start your Ethiopian language learning journey"
              : "Share your expertise as a tutor"}
          </p>

          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${i <= step ? "bg-green-500" : "bg-gray-300"}`}
                style={{ backgroundColor: i <= step ? ethiopianColors.green : undefined }}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">I want to</Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Learn Ethiopian Languages</SelectItem>
                      <SelectItem value="tutor">Teach Ethiopian Languages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="text-white font-semibold"
                    style={{ backgroundColor: ethiopianColors.green }}
                  >
                    Next Step →
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram Username *</Label>
                  <Input
                    id="telegram"
                    placeholder="@yourusername"
                    value={formData.telegram}
                    onChange={(e) => handleChange("telegram", e.target.value)}
                    required
                  />
                </div>

                {formData.role === "student" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Contact Address *</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "tutor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio/Description *</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about your teaching experience, background, and what makes you a great tutor..."
                        value={formData.bio}
                        onChange={(e) => handleChange("bio", e.target.value)}
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Professional Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Language Instructor"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profilePicture">Profile Picture * (JPG, JPEG, PNG)</Label>
                      <Input
                        id="profilePicture"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload("profilePicture", e.target.files[0])}
                        required
                      />
                      {formData.profilePicture && (
                        <p className="text-sm text-green-600">✓ {formData.profilePicture.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvFile">Upload CV * (Less than 2MB)</Label>
                      <Input
                        id="cvFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload("cvFile", e.target.files[0])}
                        required
                      />
                      {formData.cvFile && <p className="text-sm text-green-600">✓ {formData.cvFile.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificates">Upload Certificates (Optional)</Label>
                      <Input
                        id="certificates"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        multiple
                        onChange={(e) => handleChange("certificates", Array.from(e.target.files))}
                      />
                      {formData.certificates.length > 0 && (
                        <p className="text-sm text-green-600">
                          ✓ {formData.certificates.length} certificate(s) selected
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    ← Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="text-white font-semibold"
                    style={{ backgroundColor: ethiopianColors.green }}
                  >
                    Next Step →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {formData.role === "tutor" ? (
                  <>
                    <h3 className="text-lg font-semibold">Teaching Information</h3>

                    <div className="space-y-2">
                      <Label>Languages You Teach *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableLanguages.map((language) => (
                          <div key={language} className="flex items-center space-x-2">
                            <Checkbox
                              id={language}
                              checked={formData.languages.includes(language)}
                              onCheckedChange={() => toggleLanguage(language)}
                            />
                            <Label htmlFor={language} className="text-sm">
                              {language}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.languages.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.languages.map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate (USD) *</Label>
                        <Select
                          value={formData.hourlyRate}
                          onValueChange={(value) => handleChange("hourlyRate", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="$5/hour">$5/hour</SelectItem>
                            <SelectItem value="$6/hour">$6/hour</SelectItem>
                            <SelectItem value="$7/hour">$7/hour</SelectItem>
                            <SelectItem value="$8/hour">$8/hour</SelectItem>
                            <SelectItem value="$9/hour">$9/hour</SelectItem>
                            <SelectItem value="$10/hour">$10/hour</SelectItem>
                            <SelectItem value="$12/hour">$12/hour</SelectItem>
                            <SelectItem value="$15/hour">$15/hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Select
                          value={formData.experience}
                          onValueChange={(value) => handleChange("experience", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-2 years">1-2 years</SelectItem>
                            <SelectItem value="3-5 years">3-5 years</SelectItem>
                            <SelectItem value="6-10 years">6-10 years</SelectItem>
                            <SelectItem value="10+ years">10+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">Education Background</Label>
                      <Input
                        id="education"
                        placeholder="e.g., BA in Ethiopian Languages, Addis Ababa University"
                        value={formData.education}
                        onChange={(e) => handleChange("education", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Teaching Specialties (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableSpecialties.map((specialty) => (
                          <div key={specialty} className="flex items-center space-x-2">
                            <Checkbox
                              id={specialty}
                              checked={formData.specialties.includes(specialty)}
                              onCheckedChange={() => toggleSpecialty(specialty)}
                            />
                            <Label htmlFor={specialty} className="text-sm">
                              {specialty}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Learning Preferences</h3>

                    <div className="space-y-2">
                      <Label>Preferred Languages to Learn *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableLanguages.map((language) => (
                          <div key={language} className="flex items-center space-x-2">
                            <Checkbox
                              id={`pref-${language}`}
                              checked={formData.preferredLanguages.includes(language)}
                              onCheckedChange={() => togglePreferredLanguage(language)}
                            />
                            <Label htmlFor={`pref-${language}`} className="text-sm">
                              {language}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.preferredLanguages.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.preferredLanguages.map((lang) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-center py-8">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${ethiopianColors.green}15` }}
                      >
                        <span className="text-3xl">🎓</span>
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Welcome to Your Learning Journey!</h4>
                      <p className="text-muted-foreground">
                        You're all set to start learning Ethiopian languages with our expert tutors.
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    ← Previous
                  </Button>
                  <Button
                    type="submit"
                    className="text-white font-semibold"
                    style={{ backgroundColor: ethiopianColors.green }}
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto h-auto font-semibold"
                style={{ color: ethiopianColors.green }}
                onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "login" } })}
              >
                Sign in here
              </Button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "SET_PAGE", payload: { page: "home" } })}
              className="text-sm"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedSignUpPage