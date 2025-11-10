import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Settings, Eye, Users, Trash2 } from "lucide-react";
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

interface Course {
  id: number;
  name: string;
  description: string;
  tags: string;
  imageUrl?: string;
  isPublished: boolean;
  modules: Module[];
  createdAt: string;
}

interface Module {
  id: number;
  title: string;
  isPublished: boolean;
}

const CourseList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/courses');
      setCourses(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (courseId: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await axiosInstance.put(`/api/admin/courses/${courseId}`, { isPublished: newStatus });
      toast({
        title: "Success",
        description: `Course ${newStatus ? 'published' : 'unpublished'} successfully`,
      });
      fetchCourses();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"?\nThis action cannot be undone.`)) {
      try {
        await axiosInstance.delete(`/api/admin/courses/${courseId}`);
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
        fetchCourses();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2">Loading courses...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Course Management</h1>
                <p className="text-purple-100">
                  Create and manage courses for your students
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/admin/courses/create")}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first course to get started
              </p>
              <Button onClick={() => navigate("/admin/courses/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="border-2 border-purple-200 overflow-hidden">
                {/* Course Image */}
                <div className="relative h-40 bg-gradient-to-r from-purple-500 to-blue-500">
                  {course.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${course.imageUrl}`}
                      alt={course.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white opacity-80" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={course.isPublished ? "default" : "secondary"}
                      className={
                        course.isPublished
                          ? "bg-green-500 text-white"
                          : "bg-gray-500 text-white"
                      }
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg text-purple-700">
                    {course.name}
                  </CardTitle>
                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Course Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.modules?.length || 0} modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>0 students</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {course.tags && (
                      <div className="flex flex-wrap gap-1">
                        {course.tags.split(',').map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/courses/${course.id}/modules`)}
                        className="text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        ⚙ Manage
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handlePublishToggle(course.id, course.isPublished)}
                        className={`${
                          course.isPublished 
                            ? "bg-yellow-500 hover:bg-yellow-600" 
                            : "bg-green-600 hover:bg-green-700"
                        } text-white`}
                      >
                        {course.isPublished ? "Unpublish" : "✅ Publish"}
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id, course.name)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CourseList;