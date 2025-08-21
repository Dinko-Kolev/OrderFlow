import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Save, Calendar, Clock, Users, MapPin, Phone, Mail, Edit } from 'lucide-react';

export default function EditReservationModal({ isOpen, onClose, onSubmit, reservation, tables }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    reservation_date: '',
    reservation_time: '',
    number_of_guests: '',
    table_id: '',
    special_requests: '',
    status: ''
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        customer_name: reservation.customer_name || '',
        customer_email: reservation.customer_email || '',
        customer_phone: reservation.customer_phone || '',
        reservation_date: reservation.reservation_date || '',
        reservation_time: reservation.reservation_time || '',
        number_of_guests: reservation.number_of_guests || '',
        table_id: reservation.table_id?.toString() || '',
        special_requests: reservation.special_requests || '',
        status: reservation.status || 'confirmed'
      });
    }
  }, [reservation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen || !reservation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-green-600" />
            Edit Reservation
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleChange('customer_email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange('customer_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="number_of_guests">Number of Guests *</Label>
                <Input
                  id="number_of_guests"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.number_of_guests}
                  onChange={(e) => handleChange('number_of_guests', e.target.value)}
                  placeholder="4"
                  required
                />
              </div>
            </div>

            {/* Reservation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reservation_date">Date *</Label>
                <Input
                  id="reservation_date"
                  type="date"
                  value={formData.reservation_date}
                  onChange={(e) => handleChange('reservation_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reservation_time">Time *</Label>
                <Input
                  id="reservation_time"
                  type="time"
                  value={formData.reservation_time}
                  onChange={(e) => handleChange('reservation_time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="table_id">Table *</Label>
                <Select
                  value={formData.table_id}
                  onValueChange={(value) => handleChange('table_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.table_name} - Capacity: {table.capacity} - {table.is_available ? 'Available' : 'Occupied'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="seated">Seated</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="special_requests">Special Requests</Label>
              <Input
                id="special_requests"
                value={formData.special_requests}
                onChange={(e) => handleChange('special_requests', e.target.value)}
                placeholder="Any special requirements or notes..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Update Reservation
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
