import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Edit, Building, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminLayout from "@/components/AdminLayout";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

// API instance with token authentication
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interfaces
interface Venue {
  id: number;
  name: string;
  block: string;
  maxSeats: number;
  ipRange?: string;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

// Default form data
const defaultVenueData: Partial<Venue> = {
  name: "",
  block: "",
  maxSeats: 30,
};

const defaultSlotData: Partial<Slot> = {
  date: new Date().toISOString().split('T')[0],
  startTime: "09:00",
  endTime: "10:00",
  venueId: 0,
  slotFor: "Internal",
  residence: "Hosteller",
  gender: "All",
  allowBooking: "Yes",
  maxSeats: 30,
  seatsLeft: 30,
  createdBy: "Admin",
};

const SlotBooking = () => {
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Venue form state
  const [venueForm, setVenueForm] = useState<Partial<Venue>>(defaultVenueData);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  
  // Slot form state
  const [slotForm, setSlotForm] = useState<Partial<Slot>>(defaultSlotData);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [slotDate, setSlotDate] = useState<Date | undefined>(new Date());

  // Load data on component mount
  useEffect(() => {
    fetchVenues();
    fetchSlots();
  }, []);

  // API calls
  const fetchVenues = async () => {
    try {
      const response = await axiosInstance.get('/api/venues');
      setVenues(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch venues",
        variant: "destructive",
      });
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await axiosInstance.get('/api/slots');
      setSlots(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch slots",
        variant: "destructive",
      });
    }
  };

  // Venue handlers
  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueForm.name || !venueForm.block || !venueForm.maxSeats) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingVenue) {
        await axiosInstance.put(`/api/venues/${editingVenue.id}`, venueForm);
        toast({ title: "Success", description: "Venue updated successfully" });
      } else {
        await axiosInstance.post('/api/venues', venueForm);
        toast({ title: "Success", description: "Venue created successfully" });
      }
      setVenueForm(defaultVenueData);
      setEditingVenue(null);
      fetchVenues();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save venue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setVenueForm(venue);
    setEditingVenue(venue);
  };

  const handleDeleteVenue = async (id: number) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;
    
    try {
      await axiosInstance.delete(`/api/venues/${id}`);
      toast({ title: "Success", description: "Venue deleted successfully" });
      fetchVenues();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete venue",
        variant: "destructive",
      });
    }
  };

  // Slot handlers
  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotDate || !slotForm.startTime || !slotForm.endTime || !slotForm.venueId) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const slotData = {
      ...slotForm,
      date: slotDate.toISOString().split('T')[0],
    };

    setLoading(true);
    try {
      if (editingSlot) {
        await axiosInstance.put(`/api/slots/${editingSlot.id}`, slotData);
        toast({ title: "Success", description: "Slot updated successfully" });
      } else {
        await axiosInstance.post('/api/slots', slotData);
        toast({ title: "Success", description: "Slot created successfully" });
      }
      setSlotForm(defaultSlotData);
      setSlotDate(new Date());
      setEditingSlot(null);
      fetchSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save slot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = (slot: Slot) => {
    setSlotForm(slot);
    setSlotDate(new Date(slot.date));
    setEditingSlot(slot);
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    
    try {
      await axiosInstance.delete(`/api/slots/${id}`);
      toast({ title: "Success", description: "Slot deleted successfully" });
      fetchSlots();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete slot",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Slot Booking Management</h1>
            <p className="text-muted-foreground">
              Manage venues and create assessment slots
            </p>
          </div>
        </div>

        <Tabs defaultValue="slot" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="slot" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Create Slot
            </TabsTrigger>
            <TabsTrigger value="venue" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Venue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="slot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">
                  {editingSlot ? 'Edit Slot' : 'Create New Slot'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSlotSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Slot Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !slotDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {slotDate ? format(slotDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={slotDate}
                            onSelect={setSlotDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue *</Label>
                      <Select
                        value={slotForm.venueId?.toString() || ''}
                        onValueChange={(value) => setSlotForm({...slotForm, venueId: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {venues.map((venue) => (
                            <SelectItem key={venue.id} value={venue.id.toString()}>
                              {venue.name} - {venue.block}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={slotForm.startTime || ''}
                        onChange={(e) => setSlotForm({...slotForm, startTime: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={slotForm.endTime || ''}
                        onChange={(e) => setSlotForm({...slotForm, endTime: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slot For *</Label>
                      <Select
                        value={slotForm.slotFor || ''}
                        onValueChange={(value) => setSlotForm({...slotForm, slotFor: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Internal">Internal</SelectItem>
                          <SelectItem value="External">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Slot Residence *</Label>
                      <Select
                        value={slotForm.residence || ''}
                        onValueChange={(value) => setSlotForm({...slotForm, residence: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hosteller">Hosteller</SelectItem>
                          <SelectItem value="Day Scholar">Day Scholar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select
                        value={slotForm.gender || ''}
                        onValueChange={(value) => setSlotForm({...slotForm, gender: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="All">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Allow Booking *</Label>
                      <Select
                        value={slotForm.allowBooking || ''}
                        onValueChange={(value) => setSlotForm({...slotForm, allowBooking: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? 'Saving...' : editingSlot ? 'Update Slot' : 'Create Slot'}
                    </Button>
                    {editingSlot && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setSlotForm(defaultSlotData);
                          setSlotDate(new Date());
                          setEditingSlot(null);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Slots</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Slot For</TableHead>
                      <TableHead>Residence</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell>{format(new Date(slot.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{slot.startTime} - {slot.endTime}</TableCell>
                        <TableCell>{slot.venue?.name} - {slot.venue?.block}</TableCell>
                        <TableCell>{slot.slotFor}</TableCell>
                        <TableCell>{slot.residence}</TableCell>
                        <TableCell>{slot.gender}</TableCell>
                        <TableCell>{slot.seatsLeft}/{slot.maxSeats}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            slot.allowBooking === 'Yes' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {slot.allowBooking}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSlot(slot)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {slots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No slots found</p>
                    <p className="text-sm">Create your first slot using the form above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="venue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">
                  {editingVenue ? 'Edit Venue' : 'Add New Venue'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVenueSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venueName">Venue Name *</Label>
                      <Input
                        id="venueName"
                        value={venueForm.name || ''}
                        onChange={(e) => setVenueForm({...venueForm, name: e.target.value})}
                        placeholder="Enter venue name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venueBlock">Venue Block *</Label>
                      <Input
                        id="venueBlock"
                        value={venueForm.block || ''}
                        onChange={(e) => setVenueForm({...venueForm, block: e.target.value})}
                        placeholder="Enter venue block"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSeats">Max Seats *</Label>
                      <Input
                        id="maxSeats"
                        type="number"
                        min="1"
                        value={venueForm.maxSeats || ''}
                        onChange={(e) => setVenueForm({...venueForm, maxSeats: parseInt(e.target.value) || 0})}
                        placeholder="Enter max seats"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slotMaxSeats">Slot Max Seats</Label>
                      <Input
                        id="slotMaxSeats"
                        type="number"
                        min="1"
                        value={slotForm.maxSeats || ''}
                        onChange={(e) => setSlotForm({...slotForm, maxSeats: parseInt(e.target.value) || 0})}
                        placeholder="Override venue max seats (optional)"
                      />
                    </div>

                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? 'Saving...' : editingVenue ? 'Update Venue' : 'Add Venue'}
                    </Button>
                    {editingVenue && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setVenueForm(defaultVenueData);
                          setEditingVenue(null);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Venues</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Max Seats</TableHead>

                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell>{venue.block}</TableCell>
                        <TableCell>{venue.maxSeats}</TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVenue(venue)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVenue(venue.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {venues.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No venues found</p>
                    <p className="text-sm">Create your first venue using the form above</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SlotBooking;