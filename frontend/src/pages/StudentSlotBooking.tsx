import { useState, useEffect } from "react";
import StudentLayout from "@/components/StudentLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

// API instance with token authentication
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Venue {
  id: number;
  name: string;
  block: string;
  maxSeats: number;
}

interface Slot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  venueId: number;
  slotFor: string;
  residence: string;
  gender: string;
  allowBooking: string;
  maxSeats: number;
  seatsLeft: number;
  createdBy: string;
  venue?: Venue;
}

const StudentSlotBooking = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlotId, setBookingSlotId] = useState<number | null>(null);

  useEffect(() => {
    fetchAvailableSlots();
    // Auto-refresh every 30 seconds to update booking status
    const interval = setInterval(fetchAvailableSlots, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      const response = await axiosInstance.get('/api/slots/available');
      setSlots(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatus = (slot: Slot) => {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    const now = new Date();
    const diffMinutes = (slotDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (slot.seatsLeft <= 0) {
      return { canBook: false, message: "Slot Full", color: "bg-red-100 text-red-800" };
    }

    if (diffMinutes > 15) {
      const bookingOpenTime = new Date(slotDateTime.getTime() - 15 * 60 * 1000);
      return {
        canBook: false,
        message: `Booking opens at ${bookingOpenTime.toLocaleTimeString('en-IN', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`,
        color: "bg-yellow-100 text-yellow-800"
      };
    }

    return { canBook: true, message: "Book Now", color: "bg-green-100 text-green-800" };
  };

  const bookSlot = async (slotId: number) => {
    setBookingSlotId(slotId);
    try {
      const studentId = localStorage.getItem('userId') || '1'; // Get from auth context
      
      await axiosInstance.post('/api/slots/book', {
        studentId: parseInt(studentId),
        slotId
      });

      toast({
        title: "Success",
        description: "✅ Slot booked successfully! Be present on time.",
      });

      // Refresh slots to update seat count
      fetchAvailableSlots();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.response?.data?.error || "Failed to book slot",
        variant: "destructive",
      });
    } finally {
      setBookingSlotId(null);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Loading available slots...</span>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Book Assessment Slot</h1>
                <p className="text-purple-100">
                  Choose your preferred time slot for assessments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-500 rounded-lg px-4 py-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-mono text-lg font-bold">
                {slots.length} Available
              </span>
            </div>
          </div>
        </div>

        {/* Available Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Available Assessment Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available slots found</p>
                <p className="text-sm">Check back later for new slots</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => {
                  const bookingStatus = getBookingStatus(slot);
                  const isBooking = bookingSlotId === slot.id;
                  
                  return (
                    <Card
                      key={slot.id}
                      className={cn(
                        "border-2 transition-all hover:shadow-md",
                        bookingStatus.canBook 
                          ? "border-green-200 hover:border-green-300" 
                          : "border-gray-200"
                      )}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Date and Time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(slot.date), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <Badge className={bookingStatus.color}>
                            {bookingStatus.message}
                          </Badge>
                        </div>

                        {/* Time Range */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-lg font-semibold">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {slot.venue?.name} - {slot.venue?.block}
                          </span>
                        </div>

                        {/* Slot Details */}
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Slot For: {slot.slotFor}</div>
                          <div>Residence: {slot.residence}</div>
                          <div>Gender: {slot.gender}</div>
                          <div>Created By: {slot.createdBy}</div>
                        </div>

                        {/* Seats Info */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>Seats: {slot.seatsLeft}/{slot.maxSeats}</span>
                          </div>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            slot.seatsLeft > 5 
                              ? "bg-green-100 text-green-800"
                              : slot.seatsLeft > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          )}>
                            {slot.seatsLeft > 0 ? `${slot.seatsLeft} left` : "Full"}
                          </span>
                        </div>

                        {/* Book Button */}
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={!bookingStatus.canBook || isBooking}
                          onClick={() => bookSlot(slot.id)}
                        >
                          {isBooking ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Booking...
                            </>
                          ) : bookingStatus.canBook ? (
                            "Book Now"
                          ) : (
                            bookingStatus.message
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2 text-blue-800">
                <p className="font-medium">📋 Booking Guidelines</p>
                <ul className="text-sm space-y-1">
                  <li>• Booking opens exactly 15 minutes before slot start time</li>
                  <li>• You cannot book the same slot twice</li>
                  <li>• Be present on time - late arrivals may not be allowed</li>
                  <li>• Slots are allocated on first-come, first-served basis</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentSlotBooking;