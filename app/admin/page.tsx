'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContactSubmission } from '@/lib/supabase';
import { Loader2, Trash2, Edit, Eye, RefreshCw, Mail, Phone, Building, Globe } from 'lucide-react';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<ContactSubmission>>({});
  const [totalCount, setTotalCount] = useState(0);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filter,
        limit: '50',
        offset: '0'
      });

      const response = await fetch(`/api/admin/submissions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions);
        setTotalCount(data.total);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const handleView = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setEditData({
      status: submission.status,
      priority: submission.priority,
      notes: submission.notes
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const getStatusBadge = (status?: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getPriorityBadge = (priority?: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Contact Form Submissions</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Manage and track all contact form submissions
                </CardDescription>
              </div>
              <Button onClick={fetchSubmissions} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center mb-6">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({totalCount})</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-sm text-muted-foreground">
                  Total: {totalCount} submissions
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No submissions found
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{submission.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(submission.status)}`}>
                              {submission.status || 'new'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(submission.priority)}`}>
                              {submission.priority || 'normal'}
                            </span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {submission.email}
                            </div>
                            {submission.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {submission.phone}
                              </div>
                            )}
                            {submission.company && (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {submission.company}
                              </div>
                            )}
                            {submission.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <a href={submission.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {submission.website}
                                </a>
                              </div>
                            )}
                          </div>

                          {submission.service_type && (
                            <div className="text-sm mb-2">
                              <span className="font-medium">Service: </span>
                              {submission.service_type}
                            </div>
                          )}
                          
                          <p className="text-sm line-clamp-2">{submission.message}</p>
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            Submitted: {new Date(submission.created_at!).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button 
                            onClick={() => handleView(submission)} 
                            variant="outline" 
                            size="icon"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleEdit(submission)} 
                            variant="outline" 
                            size="icon"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleDelete(submission.id!)} 
                            variant="outline" 
                            size="icon"
                            className="text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission?.created_at && new Date(selectedSubmission.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-lg">{selectedSubmission.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <p>{selectedSubmission.email}</p>
              </div>
              {selectedSubmission.phone && (
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <p>{selectedSubmission.phone}</p>
                </div>
              )}
              {selectedSubmission.company && (
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <p>{selectedSubmission.company}</p>
                </div>
              )}
              {selectedSubmission.website && (
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <p>
                    <a href={selectedSubmission.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedSubmission.website}
                    </a>
                  </p>
                </div>
              )}
              {selectedSubmission.service_type && (
                <div>
                  <label className="text-sm font-medium">Service Type</label>
                  <p>{selectedSubmission.service_type}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Message</label>
                <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="capitalize">{selectedSubmission.status || 'new'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <p className="capitalize">{selectedSubmission.priority || 'normal'}</p>
                </div>
              </div>
              {selectedSubmission.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="whitespace-pre-wrap">{selectedSubmission.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
            <DialogDescription>
              Update status, priority, or add notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={editData.status} 
                onValueChange={(value) => setEditData({ ...editData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select 
                value={editData.priority} 
                onValueChange={(value) => setEditData({ ...editData, priority: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Notes</label>
              <Textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={4}
                placeholder="Add internal notes..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
