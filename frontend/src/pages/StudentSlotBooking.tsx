import { useState, useEffect } from "react";
import StudentLayout from "@/components/StudentLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Info,
  BookOpen,
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  bookedParticipants: number;
  status: "available" | "full" | "cancelled";
}

interface BookingSlot {
  id: string;
  date: Date;
  timeSlots: TimeSlot[];
  venue: string;
  description: string;
  testType: string;
  duration: number; // in minutes
  totalCapacity: number;
  totalBooked: number;
}

interface StudentBooking {
  id: string;
  slotId: string;
  timeSlotId: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue: string;
  testType: string;
  status: "confirmed" | "cancelled" | "completed";
  bookedAt: string;
}

const StudentSlotBooking = () => {
  const { toast } = useToast();
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [myBookings, setMyBookings] = useState<StudentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch available slots and student's bookings
  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
  }, []);

  // Mock data - replace with actual API calls
  const fetchAvailableSlots = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSlots: BookingSlot[] = [
        {
          id: "1",
          date: addDays(new Date(), 1),
          timeSlots: [
            {
              id: "1-1",
              startTime: "09:00",
              endTime: "10:30",
              maxParticipants: 30,
              bookedParticipants: 15,
              status: "available"
            },
            {
              id: "1-2",
              startTime: "11:00",
              endTime: "12:30",
              maxParticipants: 30,
              bookedParticipants: 30,
              status: "full"
            },
            {
              id: "1-3",
              startTime: "14:00",
              endTime: "15:30",
              maxParticipants: 25,
              bookedParticipants: 8,
              status: "available"
            }
          ],
          venue: "Main Campus - Lab A",
          description: "Mathematics Assessment - Intermediate Level",
          testType: "Mathematics",
          duration: 90,
          totalCapacity: 85,
          totalBooked: 53
        },
        {
          id: "2",
          date: addDays(new Date(), 2),
          timeSlots: [
            {
              id: "2-1",
              startTime: "10:00",
              endTime: "11:30",
              maxParticipants: 40,
              bookedParticipants: 22,
              status: "available"
            },
            {
              id: "2-2",
              startTime: "13:00",
              endTime: "14:30",
              maxParticipants: 40,
              bookedParticipants: 40,
              status: "full"
            }
          ],
          venue: "North Campus - Computer Lab",
          description: "Science Practical Assessment",
          testType: "Science",
          duration: 90,
          totalCapacity: 80,
          totalBooked: 62
        },
        {
          id: "3",
          date: addDays(new Date(), 3),
          timeSlots: [
            {
              id: "3-1",
              startTime: "09:30",
              endTime: "11:00",
              maxParticipants: 35,
              bookedParticipants: 12,
              status: "available"
            }
          ],
          venue: "Main Campus - Lab B",
          description: "English Language Proficiency Test",
          testType: "English",
          duration: 90,
          totalCapacity: 35,
          totalBooked: 12
        }
      ];

      setAvailableSlots(mockSlots);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available slots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockBookings: StudentBooking[] = [
        {
          id: "b1",
          slotId: "1",
          timeSlotId: "1-1",
          date: addDays(new Date(), 1),
          startTime: "09:00",
          endTime: "10:30",
          venue: "Main Campus - Lab A",
          testType: "Mathematics",
          status: "confirmed",
          bookedAt: new Date().toISOString()
        },
        {
          id: "b2",
          slotId: "2",
          timeSlotId: "2-1",
          date: addDays(new Date(), 2),
          startTime: "10:00",
          endTime: "11:30",
          venue: "North Campus - Computer Lab",
          testType: "Science",
          status: "confirmed",
          bookedAt: new Date().toISOString()
        }
      ];

      setMyBookings(mockBookings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    }
  };

  const bookSlot = async (slotId: string, timeSlotId: string) => {
    setIsBooking(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const slot = availableSlots.find(s => s.id === slotId);
      const timeSlot = slot?.timeSlots.find(ts => ts.id === timeSlotId);
      
      if (!slot || !timeSlot) {
        throw new Error("Slot not found");
      }

      const newBooking: StudentBooking = {
        id: `b${Date.now()}`,
        slotId,
        timeSlotId,
        date: slot.date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        venue: slot.venue,
        testType: slot.testType,
        status: "confirmed",
        bookedAt: new Date().toISOString()
      };

      setMyBookings([...myBookings, newBooking]);
      
      // Update available slots
      setAvailableSlots(prev => 
        prev.map(s => 
          s.id === slotId 
            ? {
                ...s,
                timeSlots: s.timeSlots.map(ts =>
                  ts.id === timeSlotId
                    ? { ...ts, bookedParticipants: ts.bookedParticipants + 1 }
                    : ts
                )
              }
            : s
        )
      );

      toast({
        title: "Booking Confirmed!",
        description: `You have successfully booked the ${timeSlot.startTime} slot for ${slot.testType}`,
      });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Unable to book the selected slot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const booking = myBookings.find(b => b.id === bookingId);
      if (!booking) return;

      setMyBookings(myBookings.filter(b => b.id !== bookingId));
      
      // Update available slots
      setAvailableSlots(prev =>
        prev.map(slot =>
          slot.id === booking.slotId
            ? {
                ...slot,
                timeSlots: slot.timeSlots.map(ts =>
                  ts.id === booking.timeSlotId
                    ? { ...ts, bookedParticipants: Math.max(0, ts.bookedParticipants - 1) }
                    : ts
                )
              }
            : slot
        )
      );

      toast({
        title: "Booking Cancelled",
        description: "Your slot booking has been cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel the booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const hasExistingBooking = (slotId: string, timeSlotId: string) => {
    return myBookings.some(
      booking => 
        booking.slotId === slotId && 
        booking.timeSlotId === timeSlotId && 
        booking.status === "confirmed"
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "full":
        return "bg-red-100 text-red-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeatAvailability = (timeSlot: TimeSlot) => {
    const availableSeats = timeSlot.maxParticipants - timeSlot.bookedParticipants;
    if (availableSeats <= 0) return "Full";
    if (availableSeats <= 5) return `${availableSeats} seats left`;
    return "Available";
  };

  const filteredSlots = availableSlots.filter(slot => {
    const matchesSearch = slot.testType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTestType = testTypeFilter === "all" || slot.testType === testTypeFilter;
    const matchesDate = dateFilter === "all" || 
                       (dateFilter === "today" && format(slot.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) ||
                       (dateFilter === "week" && isBefore(slot.date, addDays(new Date(), 7)) && isAfter(slot.date, new Date()));

    return matchesSearch && matchesTestType && matchesDate;
  });

  const upcomingBookings = myBookings.filter(booking => 
    booking.status === "confirmed" && isAfter(booking.date, new Date())
  );

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Book Assessment Slot</h1>
                <p className="text-blue-100">
                  Schedule your assessments by choosing preferred time slots
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-500 rounded-lg px-4 py-2">
              <BookOpen className="w-5 h-5" />
              <span className="font-mono text-lg font-bold">
                {upcomingBookings.length} Upcoming
              </span>
            </div>
          </div>
        </div>

        {/* My Bookings Section */}
        {myBookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                My Bookings
              </CardTitle>
              <CardDescription>
                Your confirmed assessment schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {format(booking.date, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </TableCell>
                      <TableCell>{booking.testType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {booking.venue}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.status === "confirmed" && isAfter(booking.date, new Date()) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelBooking(booking.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Available Slots Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Available Assessment Slots
            </CardTitle>
            <CardDescription>
              Browse and book available time slots for your assessments
            </CardDescription>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by test type, venue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Test Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tests</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[120px]">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading available slots...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available slots found</p>
                <p className="text-sm">Try adjusting your search criteria or check back later</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSlots.map((slot) => (
                  <Card key={slot.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {slot.testType}
                            <Badge variant="outline" className="ml-2">
                              {slot.duration} mins
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <CalendarIcon className="w-4 h-4" />
                            {format(slot.date, "EEEE, MMMM do, yyyy")}
                          </CardDescription>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {slot.venue}
                          </CardDescription>
                          {slot.description && (
                            <p className="text-sm text-gray-600 mt-2">{slot.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            {slot.totalBooked}/{slot.totalCapacity} booked
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slot.timeSlots.map((timeSlot) => {
                          const isBooked = hasExistingBooking(slot.id, timeSlot.id);
                          const availableSeats = timeSlot.maxParticipants - timeSlot.bookedParticipants;
                          
                          return (
                            <Card
                              key={timeSlot.id}
                              className={cn(
                                "border-2 transition-all",
                                isBooked
                                  ? "border-green-200 bg-green-50"
                                  : timeSlot.status === "available"
                                  ? "border-gray-200 hover:border-blue-300 hover:shadow-md"
                                  : "border-gray-100 bg-gray-50"
                              )}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold">
                                      {timeSlot.startTime} - {timeSlot.endTime}
                                    </span>
                                  </div>
                                  <Badge className={getStatusColor(timeSlot.status)}>
                                    {timeSlot.status === "available" 
                                      ? getSeatAvailability(timeSlot)
                                      : timeSlot.status.charAt(0).toUpperCase() + timeSlot.status.slice(1)
                                    }
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                  <span>Capacity: {timeSlot.maxParticipants}</span>
                                  <span>Booked: {timeSlot.bookedParticipants}</span>
                                </div>

                                <Button
                                  className="w-full"
                                  disabled={
                                    isBooked ||
                                    timeSlot.status !== "available" ||
                                    availableSeats <= 0 ||
                                    isBooking
                                  }
                                  onClick={() => bookSlot(slot.id, timeSlot.id)}
                                >
                                  {isBooked ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Booked
                                    </>
                                  ) : timeSlot.status !== "available" || availableSeats <= 0 ? (
                                    "Full"
                                  ) : isBooking ? (
                                    "Booking..."
                                  ) : (
                                    "Book Slot"
                                  )}
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Alerts */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p className="font-medium">ℹ️ Booking Instructions</p>
              <p>
                • You can book one slot per assessment type<br/>
                • Slots can be cancelled up to 24 hours before the assessment<br/>
                • Arrive at the venue 15 minutes before your scheduled time<br/>
                • Bring your student ID for verification
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-2">
              <p className="font-medium">⚠️ Important Notes</p>
              <p>
                • Late arrivals may not be permitted to take the assessment<br/>
                • Cancelling multiple bookings may restrict future bookings<br/>
                • Ensure you have stable internet connection for online assessments<br/>
                • Contact support if you encounter any issues
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </StudentLayout>
  );
};

export default StudentSlotBooking;