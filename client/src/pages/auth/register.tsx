import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authManager, useAuth } from "@/lib/auth";
import { SPORTS_ACTIVITIES, SKILL_LEVELS, USER_TYPES, PROFILE_VISIBILITY } from "@/lib/constants";
import OtpModal from "@/components/auth/otp-modal";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { PlacesSearch } from "@/components/ui/places-search";
import { ActivityAutocomplete } from "@/components/ui/activity-autocomplete";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { ArrowLeft, Plus, X, Phone, UserPlus, MapPin, Loader2 } from "lucide-react";
import { enablePendingLikeProcessing } from "@/lib/pendingActions";

interface Activity {
  activityName: string;
  skillLevel: string;
  isPrimary: boolean;
  coachingExperienceYears?: number;
  certifications?: string;
}

export default function Register() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [step, setStep] = useState<'phone' | 'details'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  
  // Location detection hook
  const { 
    location: geoLocation, 
    isLoading: locationLoading, 
    error: locationError, 
    requestLocation, 
    hasPermission 
  } = useGeoLocation();

  // Get user type from URL params - default to coach if coming from "Join as Coach"
  const urlParams = new URLSearchParams(window.location.search);
  const defaultUserType = urlParams.get('type') || 'player';

  // Form state for user details
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userType: defaultUserType,
    dateOfBirth: "",
    workplace: "",
    bio: "",
    locationCoordinates: "",
    locationName: "",
    city: "",
    societyArea: "",
    termsAccepted: false
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Update userType when URL changes or component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userTypeFromUrl = urlParams.get('type') || 'player';
    
    if (userTypeFromUrl !== formData.userType) {
      setFormData(prev => ({
        ...prev,
        userType: userTypeFromUrl
      }));
    }
  }, [location]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  // Auto-fill city when location is detected
  useEffect(() => {
    if (geoLocation && geoLocation.city) {
      setFormData(prev => ({
        ...prev,
        city: geoLocation.city,
        locationCoordinates: `${geoLocation.latitude},${geoLocation.longitude}`,
        locationName: geoLocation.formatted_address
      }));
    }
  }, [geoLocation]);

  // Phone number validation
  const validatePhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '').length === 10;
  };

  // Handle OTP sending
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authManager.sendOTP(phoneNumber);
      
      if (result.success) {
        setShowOtpModal(true);
        toast({
          title: "OTP Sent",
          description: "Please check your phone for the verification code."
        });
      } else {
        toast({
          title: "Failed to Send OTP",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async (otp: string) => {
    const otpResult = await authManager.verifyOTP(phoneNumber, otp);
    
    if (!otpResult.success) {
      toast({
        title: "Verification Failed",
        description: otpResult.message,
        variant: "destructive"
      });
      return;
    }

    if (!otpResult.requiresRegistration) {
      // User already exists, enable pending like processing and redirect to home
      enablePendingLikeProcessing();
      navigate("/");
      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in to StapuBox."
      });
      return;
    }

    // OTP verified successfully, proceed to details step
    setOtpVerified(true);
    setStep('details');
    setShowOtpModal(false);
    toast({
      title: "Phone Verified",
      description: "Please complete your profile information."
    });
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Profile picture handling functions
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

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview("");
  };

  const uploadProfilePicture = async (userId: number): Promise<string | null> => {
    if (!profilePicture) return null;

    try {
      setUploadingPicture(true);
      
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const response = await fetch('/api/users/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const result = await response.json();
      return result.profilePhotoUrl;
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. You can add it later.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingPicture(false);
    }
  };

  // Activity management functions
  const addActivity = () => {
    const newActivity: Activity = {
      activityName: "",
      skillLevel: "",
      isPrimary: activities.length < 2,
      ...(formData.userType === 'coach' && {
        coachingExperienceYears: 0,
        certifications: ""
      })
    };
    setActivities([...activities, newActivity]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    const updated = activities.map((activity, i) => {
      if (i === index) {
        return { ...activity, [field]: value };
      }
      return activity;
    });
    setActivities(updated);
  };

  // Form validation for details step
  const validateDetailsForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.workplace) newErrors.workplace = "Workplace is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.termsAccepted) newErrors.terms = "You must accept the terms and conditions";

    if (activities.length === 0) {
      newErrors.activities = "At least one activity is required";
    } else {
      activities.forEach((activity, index) => {
        if (!activity.activityName) {
          newErrors[`activity_${index}_name`] = "Activity name is required";
        }
        if (!activity.skillLevel) {
          newErrors[`activity_${index}_skill`] = "Skill level is required";
        }
      });
    }

    const primaryActivities = activities.filter(a => a.isPrimary);
    if (formData.userType === 'player' && primaryActivities.length === 0) {
      newErrors.primaryActivity = "At least one primary activity is required for players";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration completion
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDetailsForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const age = calculateAge(formData.dateOfBirth);
      const registrationData = {
        ...formData,
        phoneNumber,
        age,
        activities
      };

      const registerResult = await authManager.register(registrationData);
      
      if (registerResult.success && registerResult.user) {
        // Upload profile picture if selected
        if (profilePicture) {
          const profilePictureUrl = await uploadProfilePicture(registerResult.user.id);
          if (profilePictureUrl) {
            console.log("Profile picture uploaded successfully:", profilePictureUrl);
          }
        }

        // Check if there's a pending interest to show appropriate message
        const pendingInterest = localStorage.getItem("pendingInterest");
        
        // Enable pending like processing for new users
        enablePendingLikeProcessing();
        
        // Check for pending like action to redirect to appropriate page
        const pendingLike = localStorage.getItem('stapubox_pending_like');
        if (pendingLike) {
          try {
            const parsed = JSON.parse(pendingLike);
            if (parsed.returnUrl) {
              const url = new URL(parsed.returnUrl);
              if (url.pathname.includes('/feed')) {
                navigate("/feed");
              } else {
                navigate("/");
              }
            } else {
              navigate("/");
            }
          } catch {
            navigate("/");
          }
        } else {
          navigate("/");
        }
        
        if (pendingInterest) {
          // The pending interest hook will automatically send the interest
          // We'll let the hook handle the success message
          toast({
            title: "Registration Successful",
            description: "Welcome to StapuBox! Processing your interest..."
          });
        } else {
          toast({
            title: "Registration Successful",
            description: "Welcome to StapuBox!"
          });
        }
      } else {
        toast({
          title: "Registration Failed",
          description: registerResult.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home - Top Left */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 'phone' ? 'Welcome to StapuBox' : 'Complete Your Profile'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'phone' 
                ? "Verify your phone number to get started" 
                : "Complete your profile to start connecting"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'phone' ? (
              // Phone Verification Step
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-50 to-blue-50 rounded-full flex items-center justify-center">
                    <Phone className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Verify Your Phone Number
                  </h3>
                  <p className="text-gray-600">
                    We'll send you a verification code to confirm your identity
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit phone number"
                      className="rounded-l-none"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full player-theme text-white"
                  disabled={isLoading || !validatePhoneNumber(phoneNumber)}
                >
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            ) : (
              // Profile Details Step
              <form onSubmit={handleCompleteRegistration} className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-50 to-blue-50 rounded-full flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Complete Your Profile
                  </h3>
                  <p className="text-gray-600">
                    Phone verified: +91 {phoneNumber}
                  </p>
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

                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label>Profile Picture (Optional)</Label>
                  <div className="flex flex-col items-center space-y-4">
                    {profilePicturePreview ? (
                      <div className="relative">
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          onClick={removeProfilePicture}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center space-y-2">
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="profilePicture"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {profilePicture ? "Change Photo" : "Upload Photo"}
                      </Label>
                      <p className="text-xs text-gray-500 text-center">
                        JPEG, PNG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
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
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className={errors.dateOfBirth ? "border-red-500" : ""}
                    />
                    {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workplace">Company/Workplace *</Label>
                    <Input
                      id="workplace"
                      value={formData.workplace}
                      onChange={(e) => setFormData({...formData, workplace: e.target.value})}
                      className={errors.workplace ? "border-red-500" : ""}
                    />
                    {errors.workplace && <p className="text-sm text-red-500">{errors.workplace}</p>}
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="city">City *</Label>
                      {!geoLocation && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={requestLocation}
                          disabled={locationLoading}
                          className="text-xs"
                        >
                          {locationLoading ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <MapPin className="w-3 h-3 mr-1" />
                          )}
                          Auto-detect
                        </Button>
                      )}
                    </div>
                    <CityAutocomplete
                      value={formData.city}
                      onChange={(value, coordinates) => {
                        setFormData(prev => ({
                          ...prev,
                          city: value,
                          locationCoordinates: coordinates || prev.locationCoordinates,
                          locationName: value
                        }));
                      }}
                      placeholder="Enter your city"
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {locationError && (
                      <p className="text-xs text-orange-600">{locationError}</p>
                    )}
                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="society">Society/Area</Label>
                    <PlacesSearch
                      value={formData.societyArea}
                      onChange={(value, placeDetails) => {
                        setFormData(prev => ({
                          ...prev,
                          societyArea: value,
                          // Store additional location details if needed
                          locationName: placeDetails?.formatted_address || prev.locationName
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
                      disabled={activities.length >= (formData.userType === 'player' ? 5 : 2)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>

                  {activities.map((activity, index) => (
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
                            value={activity.activityName}
                            onChange={(value) => updateActivity(index, 'activityName', value)}
                            placeholder="Search or enter activity..."
                            className={errors[`activity_${index}_name`] ? "border-red-500" : ""}
                          />
                          {errors[`activity_${index}_name`] && (
                            <p className="text-sm text-red-500">{errors[`activity_${index}_name`]}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Skill Level</Label>
                          <Select
                            value={activity.skillLevel}
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
                          checked={activity.isPrimary}
                          onCheckedChange={(checked) => updateActivity(index, 'isPrimary', checked)}
                        />
                        <Label htmlFor={`primary-${index}`} className="text-sm">
                          Primary activity
                        </Label>
                      </div>

                      {formData.userType === 'coach' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-2">
                            <Label>Experience (Years)</Label>
                            <Input
                              type="number"
                              value={activity.coachingExperienceYears || ''}
                              onChange={(e) => updateActivity(index, 'coachingExperienceYears', parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Certifications</Label>
                            <Input
                              value={activity.certifications || ''}
                              onChange={(e) => updateActivity(index, 'certifications', e.target.value)}
                              placeholder="e.g., Level 1 Coach"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}

                  {activities.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 mb-4">No activities added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addActivity}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Activity
                      </Button>
                    </div>
                  )}

                  {errors.activities && <p className="text-sm text-red-500">{errors.activities}</p>}
                  {errors.primaryActivity && <p className="text-sm text-red-500">{errors.primaryActivity}</p>}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>



                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAccepted}
                    onCheckedChange={(checked) => setFormData({...formData, termsAccepted: !!checked})}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      Terms of Service
                    </a>
                    {" "}and{" "}
                    <a 
                      href="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </a>
                     *
                  </Label>
                </div>
                {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}

                <Button 
                  type="submit" 
                  className="w-full player-theme text-white"
                  disabled={isLoading || uploadingPicture}
                >
                  {uploadingPicture ? "Uploading Photo..." : isLoading ? "Creating Account..." : "Complete Registration"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* OTP Modal */}
        <OtpModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleOtpVerify}
          phoneNumber={phoneNumber}
          title="Verify Phone Number"
          description="Enter the 6-digit code sent to your phone"
        />
      </div>
    </div>
  );
}