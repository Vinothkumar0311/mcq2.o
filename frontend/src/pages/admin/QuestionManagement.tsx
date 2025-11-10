import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Upload, Download, HelpCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import axios from "axios";
import { API_BASE_URL } from "@/config/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const QuestionManagement = () => {
  const { moduleId } = useParams();
  const { toast } = useToast();
  const [module, setModule] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      fetchModuleConfig();
      fetchQuestions();
    }
  }, [moduleId]);

  const fetchModuleConfig = async () => {
    try {
      const response = await axiosInstance.get(`/api/admin/modules/${moduleId}`);
      setModule(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch module configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axiosInstance.get(`/api/admin/modules/${moduleId}/questions`);
      setQuestions(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    }
  };

  const uploadQuestions = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post(`/api/admin/modules/${moduleId}/questions/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to upload questions",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Loading module...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Question Management</h1>
              <p className="text-purple-100 text-lg">
                Managing: {module?.title || 'Module'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Configuration Display */}
        {module && (
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <CardTitle className="text-purple-700 text-lg">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-sm flex flex-wrap justify-between items-center mb-3">
                <span className="text-blue-700">🔹 MCQ Pass: {module.passCriteriaMCQ}%</span>
                <span className="text-green-700">🟢 Coding Pass: {module.passCriteriaCoding}%</span>
                <span className="text-purple-700">🟣 Questions to Display: {module.questionsToDisplay}</span>
              </div>
              <div className="text-xs text-gray-600">
                Tests can include both MCQ and Coding questions. Criteria and question limits are configurable per module.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Actions */}
        <Card className="border-2 border-blue-200 shadow-md">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              Create Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                className="bg-purple-600 hover:bg-purple-700 shadow-md hover:shadow-lg transition-all duration-200 h-12"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadQuestions(file);
                  }}
                  className="hidden"
                  id="questions-upload"
                />
                <label
                  htmlFor="questions-upload"
                  className="inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 h-12 w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Excel Upload
                </label>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  const templateUrl = `${API_BASE_URL}/api/template/download`;
                  window.open(templateUrl, '_blank');
                }}
                className="border-2 border-blue-300 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-200 h-12"
              >
                <Download className="w-4 h-4 mr-2" />
                Question Template
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 mb-2">Quick Guide:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      Manual entry for single questions
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Excel upload for bulk import
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Download template first
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      Switch between MCQ and Coding
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Questions ({questions.length})</CardTitle>
              <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                {questions.length} questions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No questions added yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {questions.map((q, index) => (
                  <div key={q.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{index + 1}. {q.question}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                          <div>A) {q.option1}</div>
                          <div>B) {q.option2}</div>
                          {q.option3 && <div>C) {q.option3}</div>}
                          {q.option4 && <div>D) {q.option4}</div>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Answer: {q.correctAnswer}</Badge>
                          <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                          {q.topic && <Badge variant="outline" className="text-xs">{q.topic}</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QuestionManagement;