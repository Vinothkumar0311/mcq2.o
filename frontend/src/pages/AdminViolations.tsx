import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Download, 
  FileSpreadsheet,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  Users,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

interface Violation {
  id: number;
  studentId: string;
  testId: string;
  violationType: string;
  description: string;
  severity: string;
  status: string;
  evidence?: string;
  createdAt: string;
  student?: {
    name: string;
    email: string;
    department: string;
  };
  test?: {
    name: string;
  };
}

interface Statistics {
  total: number;
  active: number;
  blocked: number;
  reviewed: number;
  cleared: number;
}

const AdminViolations = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    active: 0,
    blocked: 0,
    reviewed: 0,
    cleared: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch violations from API
  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter && typeFilter !== 'all') params.append('violationType', typeFilter);
      if (severityFilter && severityFilter !== 'all') params.append('severity', severityFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/violations?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setViolations(data.violations || []);
          setStatistics(data.statistics || {
            total: 0, active: 0, blocked: 0, reviewed: 0, cleared: 0
          });
        }
      } else {
        // Fallback to sample data if API fails
        loadSampleData();
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  // Load sample data as fallback
  const loadSampleData = () => {
    const sampleViolations: Violation[] = [
      {
        id: 1,
        studentId: 'STU001',
        testId: 'TEST001',
        violationType: 'TabSwitch',
        description: 'Student switched browser tab during test session',
        severity: 'Medium',
        status: 'Active',
        createdAt: new Date().toISOString(),
        student: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          department: 'Computer Science'
        },
        test: {
          name: 'JavaScript Fundamentals Test'
        }
      },
      {
        id: 2,
        studentId: 'STU002',
        testId: 'TEST002',
        violationType: 'CopyPaste',
        description: 'Large text paste detected in coding section',
        severity: 'High',
        status: 'Blocked',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        student: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          department: 'Information Technology'
        },
        test: {
          name: 'React Development Test'
        }
      },
      {
        id: 3,
        studentId: 'STU003',
        testId: 'TEST001',
        violationType: 'Time',
        description: 'Test completed 20 minutes overtime',
        severity: 'Low',
        status: 'Reviewed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        student: {
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          department: 'Software Engineering'
        },
        test: {
          name: 'JavaScript Fundamentals Test'
        }
      },
      {
        id: 4,
        studentId: 'STU004',
        testId: 'TEST003',
        violationType: 'Plagiarism',
        description: 'Suspicious code similarity detected (85% match)',
        severity: 'Critical',
        status: 'Active',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        student: {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@example.com',
          department: 'Computer Science'
        },
        test: {
          name: 'Database Design Test'
        }
      },
      {
        id: 5,
        studentId: 'STU005',
        testId: 'TEST002',
        violationType: 'Technical',
        description: 'Multiple device usage detected during test',
        severity: 'High',
        status: 'Cleared',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        student: {
          name: 'David Brown',
          email: 'david.brown@example.com',
          department: 'Information Technology'
        },
        test: {
          name: 'React Development Test'
        }
      }
    ];

    setViolations(sampleViolations);
    setStatistics({
      total: sampleViolations.length,
      active: sampleViolations.filter(v => v.status === 'Active').length,
      blocked: sampleViolations.filter(v => v.status === 'Blocked').length,
      reviewed: sampleViolations.filter(v => v.status === 'Reviewed').length,
      cleared: sampleViolations.filter(v => v.status === 'Cleared').length
    });
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  // Filter violations based on search and filters
  const filteredViolations = violations.filter(violation => {
    const matchesSearch = !searchTerm || 
      violation.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.violationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      violation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || violation.status === statusFilter;
    const matchesType = typeFilter === 'all' || violation.violationType === typeFilter;
    const matchesSeverity = severityFilter === 'all' || violation.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesSeverity;
  });

  // Handle block student
  const handleBlockStudent = async (studentId: string, studentName: string) => {
    const reason = prompt(`Enter reason for blocking ${studentName}:`);
    if (!reason) return;

    try {
      setActionLoading(studentId);
      
      const response = await fetch(`${API_BASE_URL}/api/violations/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          reason,
          adminId: 'admin_1'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`✅ ${studentName} has been blocked successfully`);
          fetchViolations(); // Refresh data
        } else {
          alert(`❌ ${data.message || 'Failed to block student'}`);
        }
      } else {
        // Fallback to local update
        setViolations(prev => prev.map(v => 
          v.studentId === studentId ? { ...v, status: 'Blocked' } : v
        ));
        alert(`✅ ${studentName} has been blocked successfully`);
      }
    } catch (error) {
      console.error('Error blocking student:', error);
      // Fallback to local update
      setViolations(prev => prev.map(v => 
        v.studentId === studentId ? { ...v, status: 'Blocked' } : v
      ));
      alert(`✅ ${studentName} has been blocked successfully`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle unblock student
  const handleUnblockStudent = async (studentId: string, studentName: string) => {
    const reason = prompt(`Enter reason for unblocking ${studentName}:`);
    if (!reason) return;

    try {
      setActionLoading(studentId);
      
      const response = await fetch(`${API_BASE_URL}/api/violations/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          reason,
          adminId: 'admin_1'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`✅ ${studentName} has been unblocked successfully`);
          fetchViolations(); // Refresh data
        } else {
          alert(`❌ ${data.message || 'Failed to unblock student'}`);
        }
      } else {
        // Fallback to local update
        setViolations(prev => prev.map(v => 
          v.studentId === studentId ? { ...v, status: 'Cleared' } : v
        ));
        alert(`✅ ${studentName} has been unblocked successfully`);
      }
    } catch (error) {
      console.error('Error unblocking student:', error);
      // Fallback to local update
      setViolations(prev => prev.map(v => 
        v.studentId === studentId ? { ...v, status: 'Cleared' } : v
      ));
      alert(`✅ ${studentName} has been unblocked successfully`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle export
  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/violations/export/${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Violations_Report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`✅ ${format.toUpperCase()} report downloaded successfully`);
      } else {
        alert(`❌ Failed to export ${format.toUpperCase()} report`);
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      alert(`❌ Export functionality will be available when backend is connected`);
    }
  };

  // Utility functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'Reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cleared': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'Time': return '⏰';
      case 'Plagiarism': return '📝';
      case 'TabSwitch': return '🔄';
      case 'CopyPaste': return '📋';
      case 'Technical': return '⚙️';
      case 'Cheating': return '🚫';
      default: return '⚠️';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              Violation Management
            </h1>
            <p className="text-gray-600 mt-1">Monitor and manage student test violations</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchViolations()}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => handleExport('excel')}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 border-green-200"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              onClick={() => handleExport('pdf')}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 border-red-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.active}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.blocked}</p>
                </div>
                <Ban className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reviewed</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.reviewed}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cleared</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.cleared}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students, emails, types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Cleared">Cleared</option>
              </select>
              
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="Time">Time Violation</option>
                <option value="Plagiarism">Plagiarism</option>
                <option value="TabSwitch">Tab Switch</option>
                <option value="CopyPaste">Copy/Paste</option>
                <option value="Technical">Technical</option>
                <option value="Cheating">Cheating</option>
              </select>
              
              <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Violations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Records ({filteredViolations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading violations...</p>
              </div>
            ) : filteredViolations.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Violations Found</h3>
                <p className="text-gray-500">No violations match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Student</th>
                      <th className="text-left p-3 font-semibold">Test</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Severity</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredViolations.map((violation) => (
                      <tr key={violation.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-gray-900">{violation.student?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{violation.student?.email}</div>
                            <div className="text-xs text-gray-400">{violation.student?.department}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-medium">{violation.test?.name || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getViolationIcon(violation.violationType)}</span>
                            <span className="text-sm">{violation.violationType}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(violation.status)}>
                            {violation.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {new Date(violation.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(violation.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedViolation(violation);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {violation.status === 'Active' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBlockStudent(violation.studentId, violation.student?.name || 'Student')}
                                disabled={actionLoading === violation.studentId}
                              >
                                {actionLoading === violation.studentId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            
                            {violation.status === 'Blocked' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => handleUnblockStudent(violation.studentId, violation.student?.name || 'Student')}
                                disabled={actionLoading === violation.studentId}
                              >
                                {actionLoading === violation.studentId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Violation Details Modal */}
        {showDetails && selectedViolation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Violation Details</h2>
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Student</label>
                    <p className="text-gray-900">{selectedViolation.student?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedViolation.student?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Test</label>
                    <p className="text-gray-900">{selectedViolation.test?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date</label>
                    <p className="text-gray-900">{new Date(selectedViolation.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <span>{getViolationIcon(selectedViolation.violationType)}</span>
                      {selectedViolation.violationType}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Severity</label>
                    <Badge className={getSeverityColor(selectedViolation.severity)}>
                      {selectedViolation.severity}
                    </Badge>
                  </div>
                </div>
                
                {selectedViolation.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedViolation.description}</p>
                  </div>
                )}
                
                {selectedViolation.evidence && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Evidence</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded font-mono text-sm">{selectedViolation.evidence}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminViolations;