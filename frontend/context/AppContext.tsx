// frontend/context/appContext.tsx
"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import axios from "axios"

// Types
interface User {
  id?: number
  fullName?: string
  email: string
  phone?: string
  telegram?: string
  role: "student" | "tutor" | "admin"
  [key: string]: any
}

interface Tutor {
  id: number
  name: string
  gender: string
  bio: string
  languages: string[]
  rating: number
  reviews: number
  verified: boolean
  approved: boolean
  profileImage: string
  hourlyRate: string
  responseTime: string
  completedSessions: number
  education: string
  experience: string
  specialties: string[]
  availability: string[]
  phone: string
  email: string
  cvUploaded: boolean
  cvUrl: string
  joinDate: string
  role: string
  completedLessons: number
  [key: string]: any
}

interface Student {
  id: number
  name: string
  email: string
  phone: string
  telegram: string
  joinDate: string
  lessonsCompleted: number
  preferredLanguage: string
  location: string
  occupation: string
  learningGoals: string
  currentLevel: string
  weeklyHours: number
  profileImage: string
  [key: string]: any
}

interface Booking {
  id: number
  tutorId: number
  tutorName: string
  status: string
  date: string
  language: string
  lessonType: string
  paymentAmount: number
  paymentMethod: string
  chapaTransactionId: string
  paymentProof: string
  studentName?: string
  [key: string]: any
}

interface Notification {
  id: number
  type: string
  message: string
  time: string
  read: boolean
  [key: string]: any
}

interface Feedback {
  id: number
  studentId: number
  studentName: string
  tutorId: number
  tutorName: string
  rating: number
  comment: string
  date: string
  lesson: string
  helpful: number
  verified: boolean
  [key: string]: any
}

interface PaymentVerification {
  id: number
  bookingId: number
  studentName: string
  tutorName: string
  amount: number
  paymentMethod: string
  chapaTransactionId: string
  screenshotUrl: string
  uploadDate: string
  status: string
  [key: string]: any
}

// App State Interface
interface AppState {
  // User & Auth
  currentUser: User | null
  userRole: string

  // Navigation
  currentPage: string
  signupRole: string | null

  // UI State
  darkMode: boolean
  mobileMenuOpen: boolean
  showScrollTop: boolean
  selectedProfile: any
  profileType: string
  showPaymentModal: boolean
  currentBooking: any

  // Search & Filters
  searchQuery: string
  selectedLanguage: string
  selectedGender: string

  contactForm: {
    name: string
    email: string
    subject: string
    message: string
  }

  profileModal: {
    isEditing: boolean
    editData: any
    selectedLanguage: string
    selectedLessonType: string
  }

  bookingData: {
    daysPerWeek: number
    hoursPerDay: number
    selectedDays: string[]
  }

  // Data
  tutors: Tutor[]
  students: Student[]
  bookings: Booking[]
  notifications: Notification[]
  feedbacks: Feedback[]
  paymentVerifications: PaymentVerification[]
  pendingTutors: Tutor[]
}

// Action Types
type AppAction =
  | { type: "SET_USER"; payload: { user: User | null; role: string } }
  | { type: "SET_PAGE"; payload: { page: string; signupRole?: string | null } }
  | {
      type: "SET_UI_STATE"
      payload: Partial<
        Pick<
          AppState,
          | "darkMode"
          | "mobileMenuOpen"
          | "showScrollTop"
          | "selectedProfile"
          | "profileType"
          | "showPaymentModal"
          | "currentBooking"
        >
      >
    }
  | {
      type: "SET_SEARCH_FILTERS"
      payload: Partial<Pick<AppState, "searchQuery" | "selectedLanguage" | "selectedGender">>
    }
  | { type: "UPDATE_CONTACT_FORM"; payload: Partial<AppState["contactForm"]> }
  | { type: "RESET_CONTACT_FORM" }
  | { type: "SET_PROFILE_EDITING"; payload: boolean; editData?: any }
  | { type: "UPDATE_PROFILE_MODAL"; payload: Partial<AppState["profileModal"]> }
  | { type: "UPDATE_BOOKING_DATA"; payload: Partial<AppState["bookingData"]> }
  | { type: "RESET_BOOKING_DATA" }
  | { type: "SET_TUTORS"; payload: Tutor[] }
  | { type: "SET_STUDENTS"; payload: Student[] }
  | { type: "SET_BOOKINGS"; payload: Booking[] }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "SET_FEEDBACKS"; payload: Feedback[] }
  | { type: "SET_PAYMENT_VERIFICATIONS"; payload: PaymentVerification[] }
  | { type: "SET_PENDING_TUTORS"; payload: Tutor[] }
  | { type: "UPDATE_TUTOR"; payload: Tutor }
  | { type: "UPDATE_STUDENT"; payload: Student }
  | { type: "UPDATE_BOOKING"; payload: { id: number; updates: Partial<Booking> } }
  | { type: "ADD_BOOKING"; payload: Booking }
  | { type: "ADD_FEEDBACK"; payload: Feedback }
  | { type: "ADD_TUTOR"; payload: Tutor }
  | { type: "ADD_STUDENT"; payload: Student }
  | { type: "MARK_NOTIFICATION_READ"; payload: number }
  | { type: "VERIFY_TUTOR"; payload: number }
  | { type: "APPROVE_TUTOR"; payload: number }
  | { type: "APPROVE_TUTOR_CV"; payload: number }
  | { type: "REJECT_TUTOR_CV"; payload: number }
  | { type: "VERIFY_PAYMENT"; payload: { id: number; status: string } }

// Initial State
const initialState: AppState = {
  // User & Auth
  currentUser: null,
  userRole: "",

  // Navigation
  currentPage: "home",
  signupRole: null,

  // UI State
  darkMode: false,
  mobileMenuOpen: false,
  showScrollTop: false,
  selectedProfile: null,
  profileType: "",
  showPaymentModal: false,
  currentBooking: null,

  // Search & Filters
  searchQuery: "",
  selectedLanguage: "all",
  selectedGender: "all",

  contactForm: {
    name: "",
    email: "",
    subject: "",
    message: "",
  },

  profileModal: {
    isEditing: false,
    editData: null,
    selectedLanguage: "",
    selectedLessonType: "",
  },

  bookingData: {
    daysPerWeek: 1,
    hoursPerDay: 1,
    selectedDays: [],
  },

  // Data
  tutors: [],
  students: [],
  bookings: [],
  notifications: [],
  feedbacks: [],
  paymentVerifications: [],
  pendingTutors: [],
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        currentUser: action.payload.user,
        userRole: action.payload.role,
      }

    case "SET_PAGE":
      return {
        ...state,
        currentPage: action.payload.page,
        signupRole: action.payload.signupRole ?? state.signupRole,
      }

    case "SET_UI_STATE":
      return {
        ...state,
        ...action.payload,
      }

    case "SET_SEARCH_FILTERS":
      return {
        ...state,
        ...action.payload,
      }

    case "SET_TUTORS":
      return {
        ...state,
        tutors: action.payload,
      }

    case "SET_STUDENTS":
      return {
        ...state,
        students: action.payload,
      }

    case "SET_BOOKINGS":
      return {
        ...state,
        bookings: action.payload,
      }

    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
      }

    case "SET_FEEDBACKS":
      return {
        ...state,
        feedbacks: action.payload,
      }

    case "SET_PAYMENT_VERIFICATIONS":
      return {
        ...state,
        paymentVerifications: action.payload,
      }

    case "SET_PENDING_TUTORS":
      return {
        ...state,
        pendingTutors: action.payload,
      }

    case "UPDATE_TUTOR":
      return {
        ...state,
        tutors: state.tutors.map((tutor) => (tutor.id === action.payload.id ? action.payload : tutor)),
      }

    case "UPDATE_STUDENT":
      return {
        ...state,
        students: state.students.map((student) => (student.id === action.payload.id ? action.payload : student)),
      }

    case "UPDATE_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id ? { ...booking, ...action.payload.updates } : booking,
        ),
      }

    case "ADD_BOOKING":
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
      }

    case "ADD_FEEDBACK":
      return {
        ...state,
        feedbacks: [...state.feedbacks, action.payload],
      }

    case "ADD_TUTOR":
      return {
        ...state,
        tutors: [...state.tutors, action.payload],
      }

    case "ADD_STUDENT":
      return {
        ...state,
        students: [...state.students, action.payload],
      }

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload ? { ...notif, read: true } : notif,
        ),
      }

    case "VERIFY_TUTOR":
      return {
        ...state,
        tutors: state.tutors.map((tutor) => (tutor.id === action.payload ? { ...tutor, verified: true } : tutor)),
      }

    case "APPROVE_TUTOR":
      return {
        ...state,
        tutors: state.tutors.map((tutor) =>
          tutor.id === action.payload ? { ...tutor, approved: true, verified: true } : tutor,
        ),
      }

    case "APPROVE_TUTOR_CV":
      const pendingTutor = state.pendingTutors.find((t) => t.id === action.payload)
      if (pendingTutor) {
        const approvedTutor = {
          ...pendingTutor,
          approved: true,
          verified: true,
          rating: 4.5,
          reviews: 0,
          completedLessons: 0,
        }
        return {
          ...state,
          tutors: [...state.tutors, approvedTutor],
          pendingTutors: state.pendingTutors.filter((t) => t.id !== action.payload),
        }
      }
      return state

    case "REJECT_TUTOR_CV":
      return {
        ...state,
        pendingTutors: state.pendingTutors.filter((t) => t.id !== action.payload),
      }

    case "VERIFY_PAYMENT":
      return {
        ...state,
        paymentVerifications: state.paymentVerifications.map((verification) =>
          verification.id === action.payload.id ? { ...verification, status: action.payload.status } : verification,
        ),
      }

    case "UPDATE_CONTACT_FORM":
      return {
        ...state,
        contactForm: {
          ...state.contactForm,
          ...action.payload,
        },
      }

    case "RESET_CONTACT_FORM":
      return {
        ...state,
        contactForm: {
          name: "",
          email: "",
          subject: "",
          message: "",
        },
      }

    case "SET_PROFILE_EDITING":
      return {
        ...state,
        profileModal: {
          ...state.profileModal,
          isEditing: action.payload,
          editData: action.editData || state.profileModal.editData,
        },
      }

    case "UPDATE_PROFILE_MODAL":
      return {
        ...state,
        profileModal: {
          ...state.profileModal,
          ...action.payload,
        },
      }

    case "UPDATE_BOOKING_DATA":
      return {
        ...state,
        bookingData: {
          ...state.bookingData,
          ...action.payload,
        },
      }

    case "RESET_BOOKING_DATA":
      return {
        ...state,
        bookingData: {
          daysPerWeek: 1,
          hoursPerDay: 1,
          selectedDays: [],
        },
      }

    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider Component
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Fetch initial data from backend
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      if (token) {
        try {
          // Fetch current user
          const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          dispatch({
            type: "SET_USER",
            payload: { user: userResponse.data.user, role: userResponse.data.user.role },
          })

          // Fetch tutors
          const tutorsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/teachers`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          dispatch({ type: "SET_TUTORS", payload: tutorsResponse.data.data })

          // Fetch students (admin only)
          if (userResponse.data.user.role === "admin") {
            const studentsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/students`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            dispatch({ type: "SET_STUDENTS", payload: studentsResponse.data.students })
          }

          // Fetch bookings
          const bookingsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          dispatch({ type: "SET_BOOKINGS", payload: bookingsResponse.data })

          // Fetch notifications
          const notificationsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          dispatch({ type: "SET_NOTIFICATIONS", payload: notificationsResponse.data })

          // Fetch feedbacks
          const feedbacksResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/feedbacks`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          dispatch({ type: "SET_FEEDBACKS", payload: feedbacksResponse.data })

          // Fetch payment verifications (admin only)
          if (userResponse.data.user.role === "admin") {
            const paymentVerificationsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/payment-verifications`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            dispatch({ type: "SET_PAYMENT_VERIFICATIONS", payload: paymentVerificationsResponse.data })
          }

          // Fetch pending tutors (admin only)
          if (userResponse.data.user.role === "admin") {
            const pendingTutorsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/pending-teachers`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            dispatch({ type: "SET_PENDING_TUTORS", payload: pendingTutorsResponse.data })
          }
        } catch (error) {
          console.error("Failed to fetch initial data:", error)
          dispatch({ type: "SET_USER", payload: { user: null, role: "" } })
          localStorage.removeItem("token")
          sessionStorage.removeItem("token")
        }
      }
    }

    fetchInitialData()
  }, [])

  // Dark mode effect
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [state.darkMode])

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      dispatch({
        type: "SET_UI_STATE",
        payload: { showScrollTop: window.scrollY > 300 },
      })
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

// Action creators for common operations
export const appActions = {
  login: (user: User, role: string) => ({
    type: "SET_USER" as const,
    payload: { user, role },
  }),

  logout: () => ({
    type: "SET_USER" as const,
    payload: { user: null, role: "" },
  }),

  navigateTo: (page: string, signupRole?: string | null) => ({
    type: "SET_PAGE" as const,
    payload: { page, signupRole },
  }),

  setDarkMode: (darkMode: boolean) => ({
    type: "SET_UI_STATE" as const,
    payload: { darkMode },
  }),

  setMobileMenu: (mobileMenuOpen: boolean) => ({
    type: "SET_UI_STATE" as const,
    payload: { mobileMenuOpen },
  }),

  setSearchQuery: (searchQuery: string) => ({
    type: "SET_SEARCH_FILTERS" as const,
    payload: { searchQuery },
  }),

  setLanguageFilter: (selectedLanguage: string) => ({
    type: "SET_SEARCH_FILTERS" as const,
    payload: { selectedLanguage },
  }),

  setGenderFilter: (selectedGender: string) => ({
    type: "SET_SEARCH_FILTERS" as const,
    payload: { selectedGender },
  }),

  showPaymentModal: (currentBooking: any) => ({
    type: "SET_UI_STATE" as const,
    payload: { showPaymentModal: true, currentBooking },
  }),

  hidePaymentModal: () => ({
    type: "SET_UI_STATE" as const,
    payload: { showPaymentModal: false, currentBooking: null },
  }),

  showProfile: (selectedProfile: any, profileType: string) => ({
    type: "SET_UI_STATE" as const,
    payload: { selectedProfile, profileType },
  }),

  hideProfile: () => ({
    type: "SET_UI_STATE" as const,
    payload: { selectedProfile: null, profileType: "" },
  }),

  updateContactForm: (updates: Partial<AppState["contactForm"]>) => ({
    type: "UPDATE_CONTACT_FORM" as const,
    payload: updates,
  }),

  resetContactForm: () => ({
    type: "RESET_CONTACT_FORM" as const,
  }),

  setProfileEditing: (isEditing: boolean, editData?: any) => ({
    type: "SET_PROFILE_EDITING" as const,
    payload: isEditing,
    editData,
  }),

  updateProfileModal: (updates: Partial<AppState["profileModal"]>) => ({
    type: "UPDATE_PROFILE_MODAL" as const,
    payload: updates,
  }),

  updateBookingData: (updates: Partial<AppState["bookingData"]>) => ({
    type: "UPDATE_BOOKING_DATA" as const,
    payload: updates,
  }),

  resetBookingData: () => ({
    type: "RESET_BOOKING_DATA" as const,
  }),
}