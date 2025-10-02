"use client"
import { useAppContext } from "@/context/appContext"; // Updated path
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

const ethiopianColors = {
  green: "#009639",
  yellow: "#FFCD00",
  red: "#DA020E",
}

export function BookingModal({ booking, onClose, onBookingComplete }) {
  const { state, dispatch } = useAppContext()
  const { bookingData } = state

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  // Calculate total hours per month and total cost
  const totalHoursPerMonth = bookingData.daysPerWeek * bookingData.hoursPerDay * 4 // Assuming 4 weeks per month
  const totalCost = totalHoursPerMonth * booking.tutorHourlyRate

  const handleDayToggle = (day) => {
    const newDays = bookingData.selectedDays.includes(day)
      ? bookingData.selectedDays.filter((d) => d !== day)
      : [...bookingData.selectedDays, day]

    // Ensure selected days don't exceed days per week
    if (newDays.length > bookingData.daysPerWeek) {
      return
    }

    dispatch({
      type: "UPDATE_BOOKING_DATA",
      payload: { selectedDays: newDays },
    })
  }

  const handleBooking = () => {
    if (bookingData.selectedDays.length !== bookingData.daysPerWeek) {
      alert(`Please select exactly ${bookingData.daysPerWeek} day(s)`)
      return
    }

    const bookingDetails = {
      daysPerWeek: bookingData.daysPerWeek,
      hoursPerDay: bookingData.hoursPerDay,
      selectedDays: bookingData.selectedDays,
      totalHoursPerMonth,
      totalCost,
    }

    onBookingComplete(bookingDetails)
  }

  const updateDaysPerWeek = (days) => {
    dispatch({
      type: "UPDATE_BOOKING_DATA",
      payload: {
        daysPerWeek: days,
        selectedDays:
          bookingData.selectedDays.length > days ? bookingData.selectedDays.slice(0, days) : bookingData.selectedDays,
      },
    })
  }

  const updateHoursPerDay = (hours) => {
    dispatch({
      type: "UPDATE_BOOKING_DATA",
      payload: { hoursPerDay: hours },
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Book Lesson with {booking.tutorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Language:</strong> {booking.language}
                </p>
                <p>
                  <strong>Lesson Type:</strong> {booking.lessonType}
                </p>
                <p>
                  <strong>Hourly Rate:</strong> ${booking.tutorHourlyRate}/hour
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="daysPerWeek" className="text-sm">
                Days per week
              </Label>
              <Input
                id="daysPerWeek"
                type="number"
                min="1"
                max="7"
                value={bookingData.daysPerWeek}
                onChange={(e) => {
                  const days = Math.max(1, Math.min(7, Number.parseInt(e.target.value) || 1))
                  updateDaysPerWeek(days)
                }}
                className="mt-1 h-10 sm:h-11"
              />
            </div>

            <div>
              <Label htmlFor="hoursPerDay" className="text-sm">
                Hours per day
              </Label>
              <Input
                id="hoursPerDay"
                type="number"
                min="1"
                max="8"
                value={bookingData.hoursPerDay}
                onChange={(e) => updateHoursPerDay(Math.max(1, Math.min(8, Number.parseInt(e.target.value) || 1)))}
                className="mt-1 h-10 sm:h-11"
              />
            </div>

            <div>
              <Label className="text-sm">
                Select specific days ({bookingData.selectedDays.length}/{bookingData.daysPerWeek} selected)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={day}
                      checked={bookingData.selectedDays.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                      disabled={
                        !bookingData.selectedDays.includes(day) &&
                        bookingData.selectedDays.length >= bookingData.daysPerWeek
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor={day} className="text-xs sm:text-sm cursor-pointer flex-1">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Card style={{ backgroundColor: `${ethiopianColors.green}10` }}>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm space-y-1">
                  <p>
                    <strong>Total hours per month:</strong> {totalHoursPerMonth} hours
                  </p>
                  <p className="text-base sm:text-lg font-bold" style={{ color: ethiopianColors.green }}>
                    <strong>Total cost:</strong> ${totalCost}/month
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent h-10 sm:h-11">
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              className="flex-1 text-white h-10 sm:h-11"
              style={{ backgroundColor: ethiopianColors.green }}
              disabled={bookingData.selectedDays.length !== bookingData.daysPerWeek}
            >
              Book Lesson
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
