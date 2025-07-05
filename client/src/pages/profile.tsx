import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth, authManager } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, SPORTS_ACTIVITIES, SKILL_LEVELS, USER_TYPES, PROFILE_VISIBILITY } from "@/lib/constants";
import { Edit, Save, X, Trash2, MapPin, Building, Calendar, Phone, Mail, Plus } from "lucide-react";
import { ActivityAutocomplete } from "@/components/ui/activity-autocomplete";
import { getPrimaryActivityIcons } from "@/lib/sportIcons";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { PlacesSearch } from "@/components/ui/places-search";

export default function Profile() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: [API_ENDPOINTS.USERS.PROFILE],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.USERS.PROFILE, {
        headers: authManager.getAuthHeaders(),
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", API_ENDPOINTS.USERS.PROFILE, data);
    },
    onSuccess: async () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
      setIsEditing(false);
      
      // Invalidate all relevant caches for real-time updates across the app
      await Promise.all([
        // Profile page cache
        queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] }),
        // Home page search results cache (with all filter combinations)
        queryClient.invalidateQueries({ queryKey: ["/api/users/search"] }),
        // Filter options cache
        queryClient.invalidateQueries({ queryKey: ["/api/users/filter-options"] }),
        // Specific user profile cache
        queryClient.invalidateQueries({ queryKey: ["/api/users", profileData?.user?.id] }),
        // Search page cache
        queryClient.invalidateQueries({ queryKey: ["search"] }),
        // Interests cache
        queryClient.invalidateQueries({ queryKey: ["/api/interests"] })
      ]);
      
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    }
  });



  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/users/profile-picture', {
        method: 'POST',
        headers: authManager.getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully."
      });
      
      // Clear the selected file and preview
      setProfilePicture(null);
      setProfilePicturePreview("");
      
      // Clear the file input
      const fileInput = document.getElementById('profilePictureEdit') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive"
      });
    }
  });

  // Profile picture delete mutation
  const deleteProfilePictureMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/users/profile-picture', {
        method: 'DELETE',
        headers: authManager.getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed successfully."
      });
      
      // Clear any selected file and preview
      setProfilePicture(null);
      setProfilePicturePreview("");
      
      // Clear the file input
      const fileInput = document.getElementById('profilePictureEdit') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove profile picture",
        variant: "destructive"
      });
    }
  });

  // Handle profile picture selection
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setProfilePicture(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfilePicture = () => {
    if (profilePicture) {
      uploadProfilePictureMutation.mutate(profilePicture);
    }
  };

  const handleEdit = () => {
    const user = profileData.user;
    const activities = profileData.activities || [];
    
    // Calculate date of birth from age
    const calculateDateOfBirth = (age: number) => {
      const today = new Date();
      const birthYear = today.getFullYear() - age;
      return `${birthYear}-01-01`; // Default to January 1st
    };

    setFormData({
      ...user,
      dateOfBirth: user.age ? calculateDateOfBirth(user.age) : '',
      activities: activities,
      // Ensure required fields have default values
      locationCoordinates: user.locationCoordinates || '',
      locationName: user.locationName || user.city || ''
    });
    setIsEditing(true);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSave = () => {
    const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : formData.age;
    const updateData = {
      ...formData,
      age,
      activities: formData.activities || []
    };
    updateProfileMutation.mutate(updateData);
  };

  const addActivity = () => {
    const newActivity = {
      activityName: '',
      skillLevel: '',
      isPrimary: false,
      ...(formData.userType === 'coach' && {
        coachingExperienceYears: 0,
        certifications: ""
      })
    };
    setFormData({
      ...formData,
      activities: [...(formData.activities || []), newActivity]
    });
  };

  const removeActivity = (index: number) => {
    const activities = formData.activities || [];
    setFormData({
      ...formData,
      activities: activities.filter((_: any, i: number) => i !== index)
    });
  };

  const updateActivity = (index: number, field: string, value: any) => {
    const activities = [...(formData.activities || [])];
    activities[index] = { ...activities[index], [field]: value };
    setFormData({ ...formData, activities });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profile = profileData?.user;
  const activities = profileData?.activities || [];

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <p className="text-red-600">Failed to load profile</p>
            <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  // Get primary activity icons for background
  const primaryActivityIcons = getPrimaryActivityIcons(profile.activities || []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden">
          {/* Activity-based Background - Top portion */}
          {primaryActivityIcons.length > 0 && (
            <div className="absolute top-6 right-6 flex space-x-4 pointer-events-none">
              {primaryActivityIcons.map((activityIcon, index) => (
                <div
                  key={index}
                  className="text-gray-400 select-none"
                  style={{
                    fontSize: index === 0 ? '3rem' : '2.5rem',
                    fontFamily: 'Arial, sans-serif',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: 0.25
                  }}
                >
                  {activityIcon.icon}
                </div>
              ))}
            </div>
          )}
          
          <CardHeader className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-200 relative flex-shrink-0">
                  {profile.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-gray-400">
                      {profile.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile.name}
                    </h1>
                    <Badge 
                      variant="outline" 
                      className={profile.userType === 'player' ? 'border-blue-600 text-blue-600' : 'border-red-600 text-red-600'}
                    >
                      {profile.userType}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="w-4 h-4" />
                      <span>{profile.workplace}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{profile.age} years old</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {!isEditing && (
                  <Button onClick={handleEdit} variant="outline" className="w-full sm:w-auto">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {isEditing ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                {/* Profile Picture Management */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Profile Picture</Label>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-200 relative flex-shrink-0">
                        {(profilePicturePreview || profile.profilePhotoUrl) ? (
                          <img
                            src={profilePicturePreview || profile.profilePhotoUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-400">
                            {profile.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-3">
                      <input
                        type="file"
                        id="profilePictureEdit"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      
                      {/* Show different button states based on current state */}
                      {!profilePicture && !profile.profilePhotoUrl && (
                        <Label
                          htmlFor="profilePictureEdit"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Upload Photo
                        </Label>
                      )}

                      {!profilePicture && profile.profilePhotoUrl && (
                        <div className="flex space-x-2">
                          <Label
                            htmlFor="profilePictureEdit"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Change
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProfilePictureMutation.mutate()}
                            disabled={deleteProfilePictureMutation.isPending}
                          >
                            {deleteProfilePictureMutation.isPending ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      )}

                      {profilePicture && (
                        <Button
                          type="button"
                          onClick={handleUploadProfilePicture}
                          disabled={uploadProfilePictureMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                        >
                          {uploadProfilePictureMutation.isPending ? "Uploading..." : "Upload"}
                        </Button>
                      )}
                      
                      <div className="text-xs text-gray-500 text-center space-y-1">
                        <p>JPEG, PNG up to 5MB</p>
                        <p className="text-blue-600">📷 Ideal size: 400x400 pixels for best quality</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label>I am a:</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {USER_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={formData.userType === type.value ? "default" : "outline"}
                        className={`p-4 h-auto ${
                          formData.userType === type.value 
                            ? type.value === 'player' ? 'player-theme' : 'coach-theme'
                            : ''
                        }`}
                        onClick={() => setFormData({...formData, userType: type.value})}
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workplace">Company/Workplace *</Label>
                    <Input
                      id="workplace"
                      value={formData.workplace || ''}
                      onChange={(e) => setFormData({...formData, workplace: e.target.value})}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <CityAutocomplete
                      value={formData.city || ''}
                      onChange={(value, coordinates) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          city: value,
                          locationCoordinates: coordinates || prev.locationCoordinates || '',
                          locationName: value
                        }));
                      }}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="society">Society/Area</Label>
                    <PlacesSearch
                      value={formData.societyArea || ''}
                      onChange={(value, placeDetails) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          societyArea: value,
                          locationName: placeDetails?.formatted_address || prev.locationName || prev.city || ''
                        }));
                      }}
                      placeholder="Search for your society/area"
                      types={["establishment"]}
                    />
                  </div>
                </div>

                {/* Activities */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sports/Activities *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addActivity}
                      disabled={(formData.activities || []).length >= (formData.userType === 'player' ? 5 : 2)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>

                  {(formData.activities || []).map((activity: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Activity {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Sport/Activity</Label>
                          <ActivityAutocomplete
                            value={activity.activityName || ''}
                            onChange={(value) => updateActivity(index, 'activityName', value)}
                            placeholder="Search or enter activity..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Skill Level</Label>
                          <Select
                            value={activity.skillLevel || ''}
                            onValueChange={(value) => updateActivity(index, 'skillLevel', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {SKILL_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`primary-${index}`}
                          checked={activity.isPrimary || false}
                          onCheckedChange={(checked) => updateActivity(index, 'isPrimary', checked)}
                        />
                        <Label htmlFor={`primary-${index}`} className="text-sm">
                          Primary activity
                        </Label>
                      </div>
                    </Card>
                  ))}

                  {(!formData.activities || formData.activities.length === 0) && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>No activities added yet</p>
                      <p className="text-sm">Click "Add Activity" to get started</p>
                    </div>
                  )}
                </div>

                {/* Coach Bio */}
                {formData.userType === 'coach' && (
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      placeholder="Tell us about your coaching experience..."
                    />
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className={formData.userType === 'player' ? 'player-theme' : 'coach-theme'}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" onClick={handleCancel} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{profile.phoneNumber}</span>
                      </div>
                      {profile.email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{profile.city}{profile.societyArea && `, ${profile.societyArea}`}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Account Status</Label>
                        <Badge variant="outline" className="ml-2 border-green-600 text-green-600">
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {profile.userType === 'coach' ? 'Coaching Expertise' : 'Sports Activities'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activities.map((activity: any, index: number) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border-2 ${
                            activity.isPrimary 
                              ? profile.userType === 'player' 
                                ? 'border-blue-200 bg-blue-50' 
                                : 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {activity.activityName}
                            </h3>
                            {activity.isPrimary && (
                              <Badge 
                                variant="outline"
                                className={profile.userType === 'player' ? 'border-blue-600 text-blue-600' : 'border-red-600 text-red-600'}
                              >
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Skill Level: <span className="font-medium">
                              {SKILL_LEVELS.find(s => s.value === activity.skillLevel)?.label}
                            </span>
                          </p>
                          {profile.userType === 'coach' && activity.coachingExperienceYears && (
                            <p className="text-sm text-gray-600 mb-2">
                              Experience: <span className="font-medium">
                                {activity.coachingExperienceYears} years
                              </span>
                            </p>
                          )}
                          {activity.certifications && (
                            <p className="text-sm text-gray-600">
                              Certifications: <span className="font-medium">
                                {activity.certifications}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bio for coaches */}
                {profile.userType === 'coach' && profile.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About Me</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Account Management */}
                <Card className="border-gray-200">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600 text-center">
                      If you want to delete or deactivate your profile, please reach us at{" "}
                      <a 
                        href="mailto:info@stapubox.com" 
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        info@stapubox.com
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
