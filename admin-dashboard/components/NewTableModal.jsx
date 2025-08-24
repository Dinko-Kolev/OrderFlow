import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Save, MapPin, Users, Building2 } from 'lucide-react';

export default function NewTableModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    table_name: '',
    table_number: '',
    capacity: '',
    location: '',
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔍 NewTableModal submitting form data:', formData);
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    console.log('🔍 NewTableModal handleChange:', field, value, 'Previous state:', formData);
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      console.log('🔍 NewTableModal new state:', newState);
      return newState;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            New Table
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="table_name">Table Name *</Label>
                <Input
                  id="table_name"
                  value={formData.table_name}
                  onChange={(e) => handleChange('table_name', e.target.value)}
                  placeholder="Window Table"
                  required
                />
              </div>
              <div>
                <Label htmlFor="table_number">Table Number *</Label>
                <Input
                  id="table_number"
                  type="number"
                  value={formData.table_number}
                  onChange={(e) => handleChange('table_number', e.target.value)}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  placeholder="4"
                  min="1"
                  max="20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Area">Main Area</SelectItem>
                    <SelectItem value="Window">Window</SelectItem>
                    <SelectItem value="Patio">Patio</SelectItem>
                    <SelectItem value="Bar">Bar</SelectItem>
                    <SelectItem value="Private Room">Private Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="is_active">Table Status</Label>
              <Select
                key={`status-${formData.is_active}`}
                value={formData.is_active ? "true" : "false"}
                defaultValue={formData.is_active ? "true" : "false"}
                onValueChange={(value) => {
                  console.log('🔍 Select onValueChange:', value, typeof value);
                  handleChange('is_active', value === 'true');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active (Available for Reservations)</SelectItem>
                  <SelectItem value="false">Inactive (Not Available for Reservations)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Active tables can receive reservations. Inactive tables are temporarily removed from the reservation system.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Current value: {formData.is_active ? "Active" : "Inactive"} (Debug: {formData.is_active.toString()})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Create Table
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
