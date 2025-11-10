import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Upload, Link, Trash2, FileText, HelpCircle, Download } from "lucide-react";
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

interface Topic {
  name: string;
  resourceType?: 'file' | 'url';
  resourcePath?: string;
  fileName?: string;
}

const ModuleManager = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    estimatedDuration: 30,
    testConfig: {
      passCriteriaMCQ: 90,
      passCriteriaCoding: 100,
      questionsToDisplay: 5
    }
  });
  const [topics, setTopics] = useState<Topic[]>([{ name: "", link: "" }]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionType, setQuestionType] = useState<'MCQ' | 'Coding'>('MCQ');
  const [questionData, setQuestionData] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctAnswer: "",
    explanation: "",
    difficulty: "medium",
    topic: ""
  });
  const [codingData, setCodingData] = useState({
    problemStatement: "",
    sampleTestCases: [{ input: "", output: "" }],
    hiddenTestCases: [{ input: "", output: "" }],
    constraints: "",
    allowedLanguages: [] as string[],
    difficulty: "medium",
    topic: ""
  });
  const [moduleQuestions, setModuleQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    try {
      const response = await axiosInstance.get(`/api/admin/modules/courses/${courseId}/modules`);
      setModules(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch modules",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Module title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const moduleData = {
        title: formData.title,
        description: formData.description,
        estimatedDuration: formData.estimatedDuration,
        passCriteriaMCQ: formData.testConfig.passCriteriaMCQ,
        passCriteriaCoding: formData.testConfig.passCriteriaCoding,
        questionsToDisplay: formData.testConfig.questionsToDisplay,
        topics: JSON.stringify(topics.filter(t => t.name.trim()))
      };

      if (editingModule) {
        await axiosInstance.put(`/api/admin/modules/${editingModule.id}`, moduleData);
        toast({
          title: "Success",
          description: "Module updated successfully",
        });
      } else {
        await axiosInstance.post(`/api/admin/modules/courses/${courseId}/modules`, moduleData);
        toast({
          title: "✅ Module and test configuration saved successfully!",
          description: "You can now add questions to this module",
        });
        
        // Navigate to question management for the new module
        const response = await axiosInstance.get(`/api/admin/modules/courses/${courseId}/modules`);
        const newModule = response.data[response.data.length - 1]; // Get the latest module
        setSelectedModule(newModule);
        fetchModuleQuestions(newModule.id);
      }
      
      setShowForm(false);
      setEditingModule(null);
      setFormData({
        title: "",
        description: "",
        estimatedDuration: 30,
        testConfig: {
          passCriteriaMCQ: 90,
          passCriteriaCoding: 100,
          questionsToDisplay: 5
        }
      });
      setTopics([{ name: "" }]);
      fetchModules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || `Failed to ${editingModule ? 'update' : 'create'} module`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: any) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || "",
      estimatedDuration: module.estimatedDuration || 30,
      testConfig: {
        passCriteriaMCQ: module.passCriteriaMCQ || 90,
        passCriteriaCoding: module.passCriteriaCoding || 100,
        questionsToDisplay: module.questionsToDisplay || 5
      }
    });
    const moduleTopics = typeof module.topics === 'string' ? JSON.parse(module.topics) : module.topics || [];
    setTopics(moduleTopics.length > 0 ? moduleTopics.map(t => ({ name: t.name || t, link: t.link || "" })) : [{ name: "", link: "" }]);
    setShowForm(true);
  };

  const addTopic = () => {
    setTopics([...topics, { name: "", link: "" }]);
  };

  const updateTopic = (index: number, field: string, value: string) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], [field]: value };
    setTopics(updated);
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const uploadResource = async (moduleId: number, topicName: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topicName', topicName);
    formData.append('resourceType', 'file');

    try {
      await axiosInstance.post(`/api/admin/modules/${moduleId}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({
        title: "Success",
        description: "Resource uploaded successfully",
      });
      fetchModules();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload resource",
        variant: "destructive",
      });
    }
  };

  const uploadQuestions = async (moduleId: number, file: File) => {
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
      if (selectedModule?.id === moduleId) {
        fetchModuleQuestions(moduleId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to upload questions",
        variant: "destructive",
      });
    }
  };

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedModule || !questionData.question || !questionData.option1 || !questionData.option2 || !questionData.correctAnswer) {
      toast({
        title: "Validation Error",
        description: "Question, first two options, and correct answer are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await axiosInstance.post(`/api/admin/modules/${selectedModule.id}/questions`, questionData);
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      setShowQuestionForm(false);
      setQuestionData({
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: "",
        explanation: "",
        difficulty: "medium",
        topic: ""
      });
      fetchModuleQuestions(selectedModule.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create question",
        variant: "destructive",
      });
    }
  };

  const fetchModuleQuestions = async (moduleId: number) => {
    try {
      const response = await axiosInstance.get(`/api/admin/modules/${moduleId}/questions`);
      setModuleQuestions(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    }
  };

  const handleModuleSelect = (module: any) => {
    setSelectedModule(module);
    fetchModuleQuestions(module.id);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">Module Management</h1>
                <p className="text-purple-100 text-lg">
                  Create modules, add topics, upload resources, and manage questions
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Module
            </Button>
          </div>
        </div>

        {/* Module Form */}
        {showForm && (
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-purple-700 text-xl flex items-center gap-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    {editingModule ? (
                      <FileText className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  {editingModule ? 'Edit Module' : 'Create New Module'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Module Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Module 1 - Introduction to C"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description / Objective</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Learning goals for this module"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Topics & Links</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addTopic}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Topic
                    </Button>
                  </div>
                  
                  {topics.map((topic, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={topic.name}
                          onChange={(e) => updateTopic(index, 'name', e.target.value)}
                          placeholder="Topic name (e.g., Variables, Operators)"
                          className="flex-1"
                        />
                        {topics.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTopic(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-gray-400" />
                        <Input
                          value={topic.link}
                          onChange={(e) => updateTopic(index, 'link', e.target.value)}
                          placeholder="Optional: Resource link (e.g., https://example.com/tutorial)"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Test Configuration Section */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Test Configuration for this Module
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="passCriteriaMCQ">Pass Criteria – MCQ (%)</Label>
                      <Input
                        id="passCriteriaMCQ"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.testConfig.passCriteriaMCQ}
                        onChange={(e) => setFormData({
                          ...formData,
                          testConfig: {
                            ...formData.testConfig,
                            passCriteriaMCQ: parseInt(e.target.value) || 90
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passCriteriaCoding">Pass Criteria – Coding (%)</Label>
                      <Input
                        id="passCriteriaCoding"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.testConfig.passCriteriaCoding}
                        onChange={(e) => setFormData({
                          ...formData,
                          testConfig: {
                            ...formData.testConfig,
                            passCriteriaCoding: parseInt(e.target.value) || 100
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="questionsToDisplay">Questions to Display</Label>
                      <Input
                        id="questionsToDisplay"
                        type="number"
                        min="1"
                        value={formData.testConfig.questionsToDisplay}
                        onChange={(e) => setFormData({
                          ...formData,
                          testConfig: {
                            ...formData.testConfig,
                            questionsToDisplay: parseInt(e.target.value) || 5
                          }
                        })}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-purple-600">
                    Tests can include both MCQ and Coding questions. Criteria and question limits are configurable per module.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (editingModule ? "Updating..." : "Creating...") : (editingModule ? "Update Module" : "Save Module")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingModule(null);
                      setFormData({
                        title: "",
                        description: "",
                        estimatedDuration: 30,
                        testConfig: {
                          passCriteriaMCQ: 90,
                          passCriteriaCoding: 100,
                          questionsToDisplay: 5
                        }
                      });
                      setTopics([{ name: "", link: "" }]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Modules List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modules */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-purple-700">Course Modules</h2>
              <Badge variant="outline" className="ml-auto">{modules.length} modules</Badge>
            </div>
            {modules.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No modules yet</h3>
                  <p className="text-gray-500 mb-4">Create your first module to get started</p>
                  <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Module
                  </Button>
                </CardContent>
              </Card>
            ) : (
              modules.map((module) => (
                <Card 
                  key={module.id} 
                  className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    selectedModule?.id === module.id 
                      ? "ring-2 ring-purple-500 shadow-lg bg-purple-50" 
                      : "hover:border-purple-300"
                  }`}
                  onClick={() => handleModuleSelect(module)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedModule?.id === module.id ? "bg-purple-200" : "bg-gray-100"
                        }`}>
                          <BookOpen className={`w-5 h-5 ${
                            selectedModule?.id === module.id ? "text-purple-600" : "text-gray-600"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {module.title}
                            {module.isPublished && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                ✓ Published
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 font-normal mt-1">
                            {(typeof module.topics === 'string' ? JSON.parse(module.topics) : module.topics || []).length} topics
                          </p>
                        </div>
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditModule(module);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Edit
                        </Button>
                        {selectedModule?.id === module.id && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  
                  {module.topics && (
                    <div className="space-y-4">
                      <Label>Topics & Resources:</Label>
                      <div className="flex flex-wrap gap-2">
                        {(typeof module.topics === 'string' ? JSON.parse(module.topics) : module.topics || []).map((topic: any, index: number) => {
                          const topicName = topic.name || topic;
                          const topicLink = topic.link;
                          return (
                            <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                              <span className="text-sm">{topicName}</span>
                              {topicLink && (
                                <a
                                  href={topicLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Open resource link"
                                >
                                  <Link className="w-4 h-4" />
                                </a>
                              )}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadResource(module.id, topicName, file);
                                }}
                                className="hidden"
                                id={`file-${module.id}-${index}`}
                              />
                              <label
                                htmlFor={`file-${module.id}-${index}`}
                                className="cursor-pointer text-purple-600 hover:text-purple-700"
                                title="Upload resource"
                              >
                                <Upload className="w-4 h-4" />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3 mt-4">
                    <div className="text-xs text-gray-500 mb-1">Test Configuration:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        MCQ Pass: {module.passCriteriaMCQ}%
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Coding Pass: {module.passCriteriaCoding}%
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        Questions: {module.questionsToDisplay}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                        Duration: {module.estimatedDuration}min
                      </div>
                    </div>
                  </div>
                </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Question Management Panel */}
          {selectedModule ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-purple-700">Question Management</h2>
                      <p className="text-sm text-purple-600">Managing: {selectedModule.title}</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                    {moduleQuestions.length} questions
                  </Badge>
                </div>
                
                {/* Test Configuration Summary */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-sm flex flex-wrap justify-between items-center mb-3">
                  <span className="text-blue-700">🔹 MCQ Pass: {selectedModule.passCriteriaMCQ}%</span>
                  <span className="text-green-700">🟢 Coding Pass: {selectedModule.passCriteriaCoding}%</span>
                  <span className="text-purple-700">🟣 Questions to Display: {selectedModule.questionsToDisplay}</span>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  Tests can include both MCQ and Coding questions. Criteria and question limits are configurable per module.
                </div>
              </div>

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
                  {/* Question Type Selector */}
                  <div className="flex items-center gap-4 mb-4">
                    <Label className="font-semibold text-gray-700">Question Type:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={questionType === 'MCQ' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setQuestionType('MCQ')}
                        className={questionType === 'MCQ' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        MCQ Questions
                      </Button>
                      <Button
                        variant={questionType === 'Coding' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setQuestionType('Coding')}
                        className={questionType === 'Coding' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        Coding Questions
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      onClick={() => setShowQuestionForm(true)}
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
                          if (file) uploadQuestions(selectedModule.id, file);
                        }}
                        className="hidden"
                        id={`questions-upload-${selectedModule.id}`}
                      />
                      <label
                        htmlFor={`questions-upload-${selectedModule.id}`}
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
                  <CardTitle className="text-lg">Questions ({moduleQuestions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {moduleQuestions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No questions added yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {moduleQuestions.map((q, index) => (
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
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Select a Module to Manage</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Choose a module from the left panel to start managing questions, resources, and tests
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span className="w-2 h-2 bg-purple-300 rounded-full"></span>
                <span>Click on any module card to get started</span>
                <span className="w-2 h-2 bg-purple-300 rounded-full"></span>
              </div>
            </div>
          )}
        </div>

        {/* Question Form Modal */}
        {showQuestionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      questionType === 'MCQ' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {questionType === 'MCQ' ? (
                        <HelpCircle className={`w-5 h-5 ${
                          questionType === 'MCQ' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <FileText className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    Add New {questionType} Question
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuestionForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {questionType === 'MCQ' ? (
                <form onSubmit={createQuestion} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question *</Label>
                    <Textarea
                      id="question"
                      value={questionData.question}
                      onChange={(e) => setQuestionData({...questionData, question: e.target.value})}
                      placeholder="Enter your question here"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="option1">Option A *</Label>
                      <Input
                        id="option1"
                        value={questionData.option1}
                        onChange={(e) => setQuestionData({...questionData, option1: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option2">Option B *</Label>
                      <Input
                        id="option2"
                        value={questionData.option2}
                        onChange={(e) => setQuestionData({...questionData, option2: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option3">Option C</Label>
                      <Input
                        id="option3"
                        value={questionData.option3}
                        onChange={(e) => setQuestionData({...questionData, option3: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option4">Option D</Label>
                      <Input
                        id="option4"
                        value={questionData.option4}
                        onChange={(e) => setQuestionData({...questionData, option4: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="correctAnswer">Correct Answer *</Label>
                      <Select value={questionData.correctAnswer} onValueChange={(value) => setQuestionData({...questionData, correctAnswer: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                          <SelectItem value="C">C</SelectItem>
                          <SelectItem value="D">D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select value={questionData.difficulty} onValueChange={(value) => setQuestionData({...questionData, difficulty: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        value={questionData.topic}
                        onChange={(e) => setQuestionData({...questionData, topic: e.target.value})}
                        placeholder="e.g., Variables, Loops"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explanation (Optional)</Label>
                    <Textarea
                      id="explanation"
                      value={questionData.explanation}
                      onChange={(e) => setQuestionData({...questionData, explanation: e.target.value})}
                      placeholder="Explain why this is the correct answer"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      Add MCQ Question
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuestionForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="problemStatement">Problem Statement *</Label>
                      <Textarea
                        id="problemStatement"
                        value={codingData.problemStatement}
                        onChange={(e) => setCodingData({...codingData, problemStatement: e.target.value})}
                        placeholder="Describe the coding problem here..."
                        rows={6}
                        required
                      />
                    </div>

                    {/* Sample Test Cases */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Sample Test Cases *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCodingData({
                              ...codingData,
                              sampleTestCases: [...codingData.sampleTestCases, { input: "", output: "" }]
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Sample Case
                        </Button>
                      </div>
                      {codingData.sampleTestCases.map((testCase, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="font-medium">Sample Test Case {index + 1}</Label>
                            {codingData.sampleTestCases.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCodingData({
                                    ...codingData,
                                    sampleTestCases: codingData.sampleTestCases.filter((_, i) => i !== index)
                                  });
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Input</Label>
                              <Textarea
                                value={testCase.input}
                                onChange={(e) => {
                                  const updated = [...codingData.sampleTestCases];
                                  updated[index].input = e.target.value;
                                  setCodingData({...codingData, sampleTestCases: updated});
                                }}
                                placeholder="5\n1 2 3 4 5"
                                rows={3}
                                className="font-mono text-sm"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Expected Output</Label>
                              <Textarea
                                value={testCase.output}
                                onChange={(e) => {
                                  const updated = [...codingData.sampleTestCases];
                                  updated[index].output = e.target.value;
                                  setCodingData({...codingData, sampleTestCases: updated});
                                }}
                                placeholder="15"
                                rows={3}
                                className="font-mono text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hidden Test Cases */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Hidden Test Cases</Label>
                          <p className="text-sm text-gray-600">These test cases will be used for evaluation but not shown to students</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCodingData({
                              ...codingData,
                              hiddenTestCases: [...codingData.hiddenTestCases, { input: "", output: "" }]
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Hidden Case
                        </Button>
                      </div>
                      {codingData.hiddenTestCases.map((testCase, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="font-medium text-red-800">Hidden Test Case {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCodingData({
                                  ...codingData,
                                  hiddenTestCases: codingData.hiddenTestCases.filter((_, i) => i !== index)
                                });
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Input</Label>
                              <Textarea
                                value={testCase.input}
                                onChange={(e) => {
                                  const updated = [...codingData.hiddenTestCases];
                                  updated[index].input = e.target.value;
                                  setCodingData({...codingData, hiddenTestCases: updated});
                                }}
                                placeholder="10\n1 2 3 4 5 6 7 8 9 10"
                                rows={3}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Expected Output</Label>
                              <Textarea
                                value={testCase.output}
                                onChange={(e) => {
                                  const updated = [...codingData.hiddenTestCases];
                                  updated[index].output = e.target.value;
                                  setCodingData({...codingData, hiddenTestCases: updated});
                                }}
                                placeholder="55"
                                rows={3}
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>Allowed Programming Languages *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Java', 'Python', 'C++', 'C'].map((lang) => (
                          <div key={lang} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                            <input
                              type="checkbox"
                              id={`lang-${lang}`}
                              checked={codingData.allowedLanguages.includes(lang)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCodingData({...codingData, allowedLanguages: [...codingData.allowedLanguages, lang]});
                                } else {
                                  setCodingData({...codingData, allowedLanguages: codingData.allowedLanguages.filter(l => l !== lang)});
                                }
                              }}
                              className="rounded border-gray-300 text-green-600"
                            />
                            <label htmlFor={`lang-${lang}`} className="text-sm cursor-pointer font-medium">
                              {lang}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="constraints">Constraints</Label>
                        <Textarea
                          id="constraints"
                          value={codingData.constraints}
                          onChange={(e) => setCodingData({...codingData, constraints: e.target.value})}
                          placeholder="1 ≤ n ≤ 10^5\nTime limit: 2 seconds"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codingDifficulty">Difficulty</Label>
                        <Select value={codingData.difficulty} onValueChange={(value) => setCodingData({...codingData, difficulty: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codingTopic">Topic</Label>
                        <Input
                          id="codingTopic"
                          value={codingData.topic}
                          onChange={(e) => setCodingData({...codingData, topic: e.target.value})}
                          placeholder="e.g., Arrays, Sorting"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          if (!codingData.problemStatement || codingData.allowedLanguages.length === 0) {
                            toast({
                              title: "Validation Error",
                              description: "Please fill in problem statement and select at least one programming language",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const hasValidSampleCase = codingData.sampleTestCases.some(tc => tc.input.trim() && tc.output.trim());
                          if (!hasValidSampleCase) {
                            toast({
                              title: "Validation Error",
                              description: "Please add at least one complete sample test case",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Handle coding question creation here
                          toast({
                            title: "Success",
                            description: "Coding question created successfully",
                          });
                          setShowQuestionForm(false);
                          setCodingData({
                            problemStatement: "",
                            sampleTestCases: [{ input: "", output: "" }],
                            hiddenTestCases: [{ input: "", output: "" }],
                            constraints: "",
                            allowedLanguages: [],
                            difficulty: "medium",
                            topic: ""
                          });
                        }}
                      >
                        Add Coding Question
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowQuestionForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ModuleManager;