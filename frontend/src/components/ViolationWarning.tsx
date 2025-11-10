import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Eye, 
  X,
  Ban,
  CheckCircle
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface ViolationWarningProps {
  studentId: string;
  onEligibilityCheck?: (eligible: boolean) => void;
}

interface Violation {
  type: string;
  severity: string;
  date: string;
}

interface EligibilityResponse {
  success: boolean;
  eligible: boolean;
  blocked: boolean;
  message: string;
  warnings?: {
    count: number;
    message: string;
    violations: Violation[];
  };
  violation?: {
    type: string;
    description: string;
    reason: string;
  };
}

const ViolationWarning = ({ studentId, onEligibilityCheck }: ViolationWarningProps) => {
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, [studentId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/test-eligibility/check/${studentId}`);
      const data = await response.json();
      
      setEligibility(data);
      onEligibilityCheck?.(data.eligible);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-blue-100 text-blue-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-yellow-800">Checking eligibility...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eligibility) {
    return null;
  }

  // Student is blocked
  if (eligibility.blocked) {
    return (
      <Card className="border-red-500 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Ban className="w-5 h-5" />
            Access Blocked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="border-red-200 bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {eligibility.message}
              </AlertDescription>
            </Alert>
            
            {eligibility.violation && (
              <div className="bg-white p-3 rounded border border-red-200">
                <div className="text-sm">
                  <div className="font-medium text-red-900">Violation Details:</div>
                  <div className="mt-1 text-red-700">
                    <div>Type: {eligibility.violation.type}</div>
                    <div>Description: {eligibility.violation.description}</div>
                    {eligibility.violation.reason && (
                      <div>Reason: {eligibility.violation.reason}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-sm text-red-700">
              Please contact your administrator to resolve this issue.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Student has warnings
  if (eligibility.warnings && eligibility.warnings.count > 0) {
    return (
      <Card className="border-yellow-500 bg-yellow-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Violation Warnings ({eligibility.warnings.count})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-yellow-700 hover:text-yellow-900"
            >
              {showDetails ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="border-yellow-200 bg-yellow-100">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {eligibility.warnings.message}
              </AlertDescription>
            </Alert>
            
            {showDetails && (
              <div className="bg-white p-3 rounded border border-yellow-200">
                <div className="text-sm">
                  <div className="font-medium text-yellow-900 mb-2">Recent Violations:</div>
                  <div className="space-y-2">
                    {eligibility.warnings.violations.map((violation, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getViolationIcon(violation.type)}</span>
                          <span className="text-yellow-800">{violation.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <span className="text-xs text-yellow-600">
                            {new Date(violation.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-sm text-yellow-700">
              <strong>Important:</strong> Please follow all test guidelines to avoid further violations.
              Multiple violations may result in being blocked from taking tests.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Student is eligible with no warnings
  return (
    <Card className="border-green-500 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">You are eligible to take tests</span>
        </div>
        <div className="text-sm text-green-700 mt-1">
          No violations detected. Please continue to follow test guidelines.
        </div>
      </CardContent>
    </Card>
  );
};

export default ViolationWarning;