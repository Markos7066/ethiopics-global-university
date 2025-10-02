// frontend/app/page.tsx
"use client";
import { AppProvider } from "@/context/appContext"; // Import AppProvider to wrap the app
import { useAppContext, appActions } from "@/context/appContext"; // Updated path
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Import components
import { BookingModal } from "@/components/BookingModal";
import { EnhancedSignUpPage } from "@/components/EnhancedSignUpPage";
import { LandingPage } from "@/components/LandingPage";
import { LoginPage } from "@/components/LoginPage";
import { StudentDashboard, TutorDashboard, AdminDashboard } from "@/components/Dashboards";
import {
  NotificationPanel,
  DetailedProfileModal,
  AboutPage,
  ContactPage,
  PublicTutorsPage,
  Footer,
} from "@/components/OtherComponents";

// Ethiopian flag colors - Professional vibrant palette
const ethiopianColors = {
  green: "#009639",
  yellow: "#FFDE00",
  red: "#DA020E",
  greenDark: "#006627",
  yellowDark: "#E6C700",
  redDark: "#B8010C",
};

// Define the AppContent component to use the context
function AppContent() {
  const { state, dispatch } = useAppContext();
  const {
    currentUser,
    userRole,
    currentPage,
    searchQuery,
    selectedLanguage,
    selectedGender,
    bookings,
    tutors,
    students,
    paymentVerifications,
    feedbacks,
    darkMode,
    notifications,
    mobileMenuOpen,
    showScrollTop,
    selectedProfile,
    profileType,
    showPaymentModal,
    currentBooking,
    pendingTutors,
    signupRole,
  } = state;

  // Handle Login
  const handleLogin = (formData) => {
    dispatch(appActions.login(formData, formData.role));
    dispatch(appActions.navigateTo("dashboard"));
    toast.success("Welcome to Ethiopics Global University!");
  };

  // Handle Sign Up
  const handleSignUp = (formData) => {
    if (formData.role === "student") {
      const newStudent = {
        id: Date.now(),
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || "",
        telegram: formData.telegram || "",
        joinDate: new Date().toISOString().split("T")[0],
        lessonsCompleted: 0,
        preferredLanguage: "Not specified",
        location: formData.address || "Not specified",
        occupation: "Not specified",
        learningGoals: "Connect with Ethiopian heritage",
        currentLevel: "Beginner",
        weeklyHours: 2,
        profileImage: "/american-software-engineer-learning-ethiopian-lang.jpg",
      };
      dispatch({ type: "ADD_STUDENT", payload: newStudent });
    } else if (formData.role === "tutor") {
      const newTutor = {
        id: Date.now(),
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone || "",
        gender: formData.gender || "Not specified",
        bio: formData.bio || "Ethiopian language instructor",
        languages: formData.languages || ["Amharic"],
        hourlyRate: formData.hourlyRate || "$6/hour",
        verified: false,
        approved: false,
        cvUploaded: false,
        cvUrl: "",
        profileImage: "/60-year-old-ethiopian-professor-with-glasses-and-t.jpg",
        joinDate: new Date().toISOString().split("T")[0],
        rating: 0,
        reviews: 0,
        completedSessions: 0,
        responseTime: "24 hours",
        education: "",
        experience: "",
        specialties: [],
        availability: [],
        role: "Tutor",
        completedLessons: 0,
      };
      dispatch({ type: "ADD_TUTOR", payload: newTutor });
    }

    dispatch(appActions.login(formData, formData.role));
    dispatch(appActions.navigateTo("dashboard"));
    toast.success("Account created successfully!");
  };

  // Handle Logout
  const handleLogout = () => {
    dispatch(appActions.logout());
    dispatch(appActions.navigateTo("home"));
    dispatch(appActions.setMobileMenu(false));
    toast.success("Logged out successfully");
  };

  // Navigate Function
  const navigateTo = (page, options = {}) => {
    if (page === "signup" && options.role) {
      dispatch(appActions.navigateTo("signup", options.role));
    } else {
      dispatch(appActions.navigateTo(page));
    }
  };

  // Handle Booking
  const handleBooking = (tutorId, language, lessonType, requiresAuth = true) => {
    if (requiresAuth && !currentUser) {
      navigateTo("login");
      toast.error("Please sign in to book a lesson");
      return;
    }

    const tutor = tutors.find((t) => t.id === tutorId);
    if (!tutor || !tutor.approved) {
      toast.error("Tutor not available for booking");
      return;
    }

    const bookingData = {
      tutorId,
      tutorName: tutor?.name,
      tutorHourlyRate: Number.parseInt(tutor?.hourlyRate.replace("$", "").replace("/hour", "")),
      language,
      lessonType,
      studentName: currentUser?.fullName || currentUser?.email,
    };
    dispatch(appActions.showPaymentModal(bookingData));
  };

  // Process Booking
  const processBooking = (bookingDetails) => {
    const newBooking = {
      id: Date.now(),
      tutorId: currentBooking.tutorId,
      tutorName: currentBooking.tutorName,
      status: "pending_confirmation",
      date: new Date().toISOString().split("T")[0],
      language: currentBooking.language,
      lessonType: currentBooking.lessonType,
      studentName: currentUser?.fullName || currentUser?.email,
      ...bookingDetails,
      bookingDate: new Date().toISOString(),
      generalState: "active",
      paymentAmount: currentBooking.tutorHourlyRate,
      paymentMethod: "Chapa",
      chapaTransactionId: "",
      paymentProof: "",
    };

    dispatch({ type: "ADD_BOOKING", payload: newBooking });
    dispatch(appActions.hidePaymentModal());
    toast.success("Booked successfully!");
  };

  // Confirm Booking
  const confirmBooking = (bookingId) => {
    dispatch({ type: "UPDATE_BOOKING", payload: { id: bookingId, updates: { status: "confirmed" } } });
    toast.success("Booking confirmed by teacher!");
  };

  // Complete Payment
  const completePayment = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      const chapaUrl = `https://checkout.chapa.co/checkout/payment/${booking.id}?amount=${booking.totalCost}&currency=ETB&email=${currentUser.email}&first_name=${currentUser.fullName}&tx_ref=${booking.id}`;
      window.open(chapaUrl, "_blank");

      setTimeout(() => {
        dispatch({
          type: "UPDATE_BOOKING",
          payload: { id: bookingId, updates: { status: "payment_verified_confirmed" } },
        });
        toast.success("Payment verified and confirmed!");
      }, 3000);
    }
  };

  // Handle Complaint
  const handleComplaint = (bookingId) => {
    toast.info("Complaint submitted. Our support team will contact you soon.");
  };

  // Update Booking Status
  const updateBookingStatus = (bookingId, status) => {
    dispatch({ type: "UPDATE_BOOKING", payload: { id: bookingId, updates: { status } } });
    toast.success(`Booking ${status.replace("_", " ")}!`);
  };

  // Confirm Tutor Booking
  const confirmTutorBooking = (bookingId, confirmed) => {
    const status = confirmed ? "confirmed" : "rejected";
    updateBookingStatus(bookingId, status);
  };

  // Verify Tutor
  const verifyTutor = (tutorId) => {
    dispatch({ type: "VERIFY_TUTOR", payload: tutorId });
    toast.success("Tutor verified successfully!");
  };

  // Approve Tutor
  const approveTutor = (tutorId) => {
    dispatch({ type: "APPROVE_TUTOR", payload: tutorId });
    toast.success("Tutor approved and can now accept bookings!");
  };

  // Approve Tutor CV
  const approveTutorCV = (tutorId) => {
    const pendingTutor = pendingTutors.find((t) => t.id === tutorId);
    if (pendingTutor) {
      dispatch({ type: "APPROVE_TUTOR_CV", payload: tutorId });
      toast.success(`${pendingTutor.name} has been approved and added to the platform!`);
    }
  };

  // Reject Tutor CV
  const rejectTutorCV = (tutorId) => {
    const pendingTutor = pendingTutors.find((t) => t.id === tutorId);
    if (pendingTutor) {
      dispatch({ type: "REJECT_TUTOR_CV", payload: tutorId });
      toast.success(`${pendingTutor.name}'s application has been rejected.`);
    }
  };

  // Verify Payment
  const verifyPayment = (verificationId, status) => {
    dispatch({ type: "VERIFY_PAYMENT", payload: { id: verificationId, status } });

    if (status === "verified") {
      const verification = paymentVerifications.find((v) => v.id === verificationId);
      if (verification) {
        updateBookingStatus(verification.bookingId, "payment_verified");
      }
    }

    toast.success(`Payment ${status}!`);
  };

  // Mark Notification as Read
  const markNotificationAsRead = (notificationId) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
  };

  // Submit Feedback
  const submitFeedback = (tutorId, rating, comment, lesson) => {
    const tutor = tutors.find((t) => t.id === tutorId);
    const newFeedback = {
      id: Date.now(),
      studentId: currentUser?.id || Date.now(),
      studentName: currentUser?.fullName || currentUser?.email,
      tutorId,
      tutorName: tutor?.name,
      rating,
      comment,
      lesson,
      date: new Date().toISOString().split("T")[0],
      helpful: 0,
      verified: true,
    };
    dispatch({ type: "ADD_FEEDBACK", payload: newFeedback });

    const tutorFeedbacks = [...feedbacks, newFeedback].filter((f) => f.tutorId === tutorId);
    const averageRating = tutorFeedbacks.reduce((sum, f) => sum + f.rating, 0) / tutorFeedbacks.length;

    const updatedTutor = {
      ...tutor,
      rating: Math.round(averageRating * 10) / 10,
      reviews: tutorFeedbacks.length,
    };
    dispatch({ type: "UPDATE_TUTOR", payload: updatedTutor });

    toast.success("Thank you for your feedback!");
  };

  // Filter Tutors
  const filteredTutors = tutors.filter((tutor) => {
    if (userRole !== "admin" && userRole !== "tutor" && !tutor.approved) {
      return false;
    }

    const matchesSearch =
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.languages.some((lang) => lang.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage =
      !selectedLanguage || selectedLanguage === "all" || tutor.languages.includes(selectedLanguage);
    const matchesGender = !selectedGender || selectedGender === "all" || tutor.gender === selectedGender;

    return matchesSearch && matchesLanguage && matchesGender;
  });

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProfile = (profile, type) => {
    dispatch(appActions.showProfile(profile, type));
  };

  const closeProfile = () => {
    dispatch(appActions.hideProfile());
  };

  // Render different pages based on state
  if (currentPage === "home" && !currentUser) {
    return (
      <LandingPage
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={(mode) => dispatch(appActions.setDarkMode(mode))}
        tutors={filteredTutors}
        searchQuery={searchQuery}
        setSearchQuery={(query) => dispatch(appActions.setSearchQuery(query))}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={(lang) => dispatch(appActions.setLanguageFilter(lang))}
        selectedGender={selectedGender}
        setSelectedGender={(gender) => dispatch(appActions.setGenderFilter(gender))}
      />
    );
  }

  if (currentPage === "about") {
    return (
      <AboutPage
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={(mode) => dispatch(appActions.setDarkMode(mode))}
      />
    );
  }

  if (currentPage === "contact") {
    return (
      <ContactPage
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={(mode) => dispatch(appActions.setDarkMode(mode))}
      />
    );
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={(mode) => dispatch(appActions.setDarkMode(mode))}
      />
    );
  }

  if (currentPage === "signup") {
    return (
      <EnhancedSignUpPage
        onSignUp={handleSignUp}
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={(mode) => dispatch(appActions.setDarkMode(mode))}
        initialRole={signupRole}
      />
    );
  }

  if (currentPage === "tutors") {
    return (
      <PublicTutorsPage
        tutors={filteredTutors}
        searchQuery={searchQuery}
        setSearchQuery={(query) => dispatch(appActions.setSearchQuery(query))}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={(lang) => dispatch(appActions.setLanguageFilter(lang))}
        selectedGender={selectedGender}
        setSelectedGender={(gender) => dispatch(appActions.setGenderFilter(gender))}
        onBooking={handleBooking}
        onNavigate={navigateTo}
        darkMode={darkMode}
        setDarkMode={(mode) => dispatch(appActions.setDarkMode(mode))}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header - Mobile First */}
      <header className="bg-card/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigateTo("home")}
            >
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
                  Ethiopics Global University
                </h1>
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">University</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(appActions.setDarkMode(!darkMode))}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-accent"
              >
                <span className="text-lg">{darkMode ? "☀️" : "🌙"}</span>
                <span className="text-sm font-medium">{darkMode ? "Light" : "Dark"}</span>
              </Button>

              <Popover>
                <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 relative">
                  🔔
                  {unreadNotifications > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-xs p-0 flex items-center justify-center"
                      style={{ backgroundColor: ethiopianColors.red }}
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <NotificationPanel notifications={notifications} onMarkAsRead={markNotificationAsRead} />
                </PopoverContent>
              </Popover>

              <span className="text-sm text-muted-foreground">
                Welcome, {currentUser?.fullName || currentUser?.email}
              </span>
              <Badge variant="outline" style={{ borderColor: ethiopianColors.green, color: ethiopianColors.green }}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                🚪
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={(open) => dispatch(appActions.setMobileMenu(open))}>
                <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  ☰
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{darkMode ? "☀️" : "🌙"}</span>
                        <span className="text-sm font-medium">Dark Mode</span>
                      </div>
                      <Switch
                        checked={darkMode}
                        onCheckedChange={(checked) => dispatch(appActions.setDarkMode(checked))}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Notifications ({unreadNotifications} unread)</p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {notifications.slice(0, 3).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2 rounded text-xs ${notif.read ? "bg-muted" : "bg-accent"}`}
                          >
                            <p className="line-clamp-2">{notif.message}</p>
                            <p className="text-muted-foreground mt-1">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm">Welcome, {currentUser?.fullName || currentUser?.email}</p>
                      <Badge
                        variant="outline"
                        style={{ borderColor: ethiopianColors.green, color: ethiopianColors.green }}
                      >
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </Badge>
                    </div>
                    <Button onClick={handleLogout} className="w-full mt-6 bg-transparent" variant="outline">
                      🚪 Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {userRole === "student" && (
          <StudentDashboard
            tutors={filteredTutors}
            searchQuery={searchQuery}
            setSearchQuery={(query) => dispatch(appActions.setSearchQuery(query))}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={(lang) => dispatch(appActions.setLanguageFilter(lang))}
            selectedGender={selectedGender}
            setSelectedGender={(gender) => dispatch(appActions.setGenderFilter(gender))}
            bookings={bookings}
            onBooking={handleBooking}
            onSubmitFeedback={submitFeedback}
            currentUser={currentUser}
            onViewProfile={openProfile}
            feedbacks={feedbacks}
          />
        )}

        {userRole === "tutor" && (
          <TutorDashboard
            bookings={bookings.filter((booking) =>
              tutors.find(
                (t) => t.id === booking.tutorId && (t.name === currentUser?.fullName || t.name === currentUser?.email),
              ),
            )}
            onConfirmBooking={confirmTutorBooking}
            feedbacks={feedbacks.filter((f) =>
              tutors.find(
                (t) => t.id === f.tutorId && (t.name === currentUser?.fullName || t.name === currentUser?.email),
              ),
            )}
            currentUser={currentUser}
            onViewProfile={openProfile}
            tutors={tutors}
            setTutors={(updatedTutors) => dispatch({ type: "SET_TUTORS", payload: updatedTutors })}
          />
        )}

        {userRole === "admin" && (
          <AdminDashboard
            tutors={tutors}
            students={students}
            bookings={bookings}
            paymentVerifications={paymentVerifications}
            feedbacks={feedbacks}
            pendingTutors={pendingTutors}
            onVerifyTutor={verifyTutor}
            onApproveTutor={approveTutor}
            onVerifyPayment={verifyPayment}
            onViewProfile={openProfile}
            onApproveTutorCV={approveTutorCV}
            onRejectTutorCV={rejectTutorCV}
          />
        )}
      </main>

      <Footer
        darkMode={darkMode}
        onNavigate={navigateTo}
        showScrollTop={showScrollTop}
        scrollToTop={scrollToTop}
      />

      {/* Enhanced Payment Modal */}
      {showPaymentModal && currentBooking && (
        <BookingModal
          booking={currentBooking}
          onClose={() => dispatch(appActions.hidePaymentModal())}
          onBookingComplete={processBooking}
        />
      )}

      {/* Detailed Profile Modal */}
      {selectedProfile && (
        <DetailedProfileModal
          profile={selectedProfile}
          profileType={profileType}
          onClose={closeProfile}
          onVerifyTutor={verifyTutor}
          onApproveTutor={approveTutor}
          onUpdateProfile={(updatedProfile) => {
            if (profileType === "tutor") {
              dispatch({ type: "UPDATE_TUTOR", payload: updatedProfile });
            } else if (profileType === "student") {
              dispatch({ type: "UPDATE_STUDENT", payload: updatedProfile });
            }
            toast.success("Profile updated successfully!");
          }}
        />
      )}
    </div>
  );
}

// Export the page wrapped with AppProvider
export default function Page() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}