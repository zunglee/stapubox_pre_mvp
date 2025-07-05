import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import PageHeader from "@/components/layout/page-header";
import { Target, Eye, Users, Briefcase, TrendingUp, Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Shield, Newspaper, Trophy } from "lucide-react";

export default function About() {
  const { toast } = useToast();
  
  const [careerForm, setCareerForm] = useState({
    name: "",
    email: "",
    phone: "",
    resumeUrl: "",
    contributionArea: ""
  });

  const [investorForm, setInvestorForm] = useState({
    name: "",
    businessEmail: "",
    phone: ""
  });

  const careerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", API_ENDPOINTS.APPLICATIONS.CAREER, data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Thank you for your interest! We'll be in touch soon."
      });
      setCareerForm({
        name: "",
        email: "",
        phone: "",
        resumeUrl: "",
        contributionArea: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive"
      });
    }
  });

  const investorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", API_ENDPOINTS.APPLICATIONS.INVESTOR, data);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Submitted",
        description: "Thank you for your interest! We'll send you our investor deck soon."
      });
      setInvestorForm({
        name: "",
        businessEmail: "",
        phone: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit inquiry",
        variant: "destructive"
      });
    }
  });

  const handleCareerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerForm.name || !careerForm.email || !careerForm.phone || !careerForm.contributionArea) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    careerMutation.mutate(careerForm);
  };

  const handleInvestorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorForm.name || !investorForm.businessEmail || !investorForm.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    investorMutation.mutate(investorForm);
  };

  const contributionAreas = [
    "Engineering & Development",
    "Product Management",
    "Design & UX",
    "Marketing & Growth",
    "Sales & Business Development",
    "Operations & Strategy",
    "Customer Success",
    "Data & Analytics",
    "HR & People Operations",
    "Finance & Legal"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About StapuBox</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Building India's first sports networking platform to connect players and coaches
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs defaultValue="mission" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mission">Vision & Mission</TabsTrigger>
            <TabsTrigger value="careers">Careers</TabsTrigger>
            <TabsTrigger value="investors">Investors</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="mission" className="mt-8">
            <div className="space-y-12">
              {/* Vision & Mission */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-red-600 rounded-full">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-2xl">Our Vision</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      To build a better connected world through sports, games and activities — by bringing people together and making participation effortless, inclusive, and joyful.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-blue-600 rounded-full">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-2xl">Our Mission</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      To make it effortless and fun for people to discover sports, games, and activities, connect with like-minded individuals, access mentors and venues, and share their journey, turning every moment into a source of real-world connection and lasting motivation.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Why Choose StapuBox Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center mb-8">Why Choose StapuBox?</CardTitle>
                  <p className="text-gray-600 text-center">
                    Discover the features that make StapuBox the perfect platform for sports networking.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Location-Based Matching</h3>
                      <p className="text-gray-600">Find players and coaches in your vicinity with GPS-based location services.</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Skill Level Matching</h3>
                      <p className="text-gray-600">Connect with players at your skill level for balanced and enjoyable games.</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Interest System</h3>
                      <p className="text-gray-600">Safe and secure way to express interest and connect with mutual consent.</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Players & Coaches</h3>
                      <p className="text-gray-600">Connect with both playing partners and professional coaches in one platform.</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Newspaper className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Sports Feed</h3>
                      <p className="text-gray-600">Stay updated with latest sports news and engage with the community.</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Platform</h3>
                      <p className="text-gray-600">OTP-based authentication and privacy controls ensure your safety.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Values */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center mb-8">Our Core Values</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Community First</h3>
                      <p className="text-gray-600">
                        Building genuine connections and fostering a supportive sports community.
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Inclusivity</h3>
                      <p className="text-gray-600">
                        Welcoming all skill levels and backgrounds to participate in sports.
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Growth</h3>
                      <p className="text-gray-600">
                        Helping every member improve their skills and achieve their sporting goals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span>info@stapubox.com</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span>India</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-4">Follow Us</h4>
                      <div className="flex space-x-4">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                          <Facebook className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                          <Twitter className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                          <Instagram className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                          <Linkedin className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="careers" className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-full">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Join Our Mission</CardTitle>
                </div>
                <p className="text-gray-600">
                  Help us build the future of sports networking in India. We're looking for passionate 
                  individuals who share our vision.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCareerSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="career-name">Full Name *</Label>
                      <Input
                        id="career-name"
                        value={careerForm.name}
                        onChange={(e) => setCareerForm({...careerForm, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="career-email">Email *</Label>
                      <Input
                        id="career-email"
                        type="email"
                        value={careerForm.email}
                        onChange={(e) => setCareerForm({...careerForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="career-phone">Phone Number *</Label>
                      <Input
                        id="career-phone"
                        type="tel"
                        value={careerForm.phone}
                        onChange={(e) => setCareerForm({...careerForm, phone: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="career-area">Contribution Area *</Label>
                      <Select
                        value={careerForm.contributionArea}
                        onValueChange={(value) => setCareerForm({...careerForm, contributionArea: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your area of expertise" />
                        </SelectTrigger>
                        <SelectContent>
                          {contributionAreas.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="career-resume">Resume URL</Label>
                    <Input
                      id="career-resume"
                      type="url"
                      placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                      value={careerForm.resumeUrl}
                      onChange={(e) => setCareerForm({...careerForm, resumeUrl: e.target.value})}
                    />
                    <p className="text-sm text-gray-500">
                      Please upload your resume to a cloud service and share the public link
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full player-theme"
                    disabled={careerMutation.isPending}
                  >
                    {careerMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investors" className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-green-600 rounded-full">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Investor Relations</CardTitle>
                </div>
                <p className="text-gray-600">
                  Interested in investing in the future of sports networking? 
                  Request our investor deck and learn about the opportunity.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvestorSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investor-name">Full Name *</Label>
                      <Input
                        id="investor-name"
                        value={investorForm.name}
                        onChange={(e) => setInvestorForm({...investorForm, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="investor-email">Business Email *</Label>
                      <Input
                        id="investor-email"
                        type="email"
                        value={investorForm.businessEmail}
                        onChange={(e) => setInvestorForm({...investorForm, businessEmail: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investor-phone">Phone Number *</Label>
                    <Input
                      id="investor-phone"
                      type="tel"
                      value={investorForm.phone}
                      onChange={(e) => setInvestorForm({...investorForm, phone: e.target.value})}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={investorMutation.isPending}
                  >
                    {investorMutation.isPending ? "Submitting..." : "Request Investor Deck"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="mt-8">
            <div className="space-y-8">
              <Card id="terms">
                <CardHeader>
                  <CardTitle className="text-2xl">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <h3>1. Acceptance of Terms</h3>
                  <p>
                    By accessing and using StapuBox, you accept and agree to be bound by the terms 
                    and provision of this agreement.
                  </p>
                  
                  <h3>2. User Responsibilities</h3>
                  <p>
                    Users are responsible for maintaining the confidentiality of their account 
                    information and for all activities under their account.
                  </p>
                  
                  <h3>3. Platform Usage</h3>
                  <p>
                    StapuBox is intended for sports networking purposes. Users must not use the 
                    platform for any illegal or unauthorized purpose.
                  </p>
                  
                  <h3>4. Privacy & Data</h3>
                  <p>
                    We respect your privacy and handle your data according to our Privacy Policy. 
                    Contact details are only shared upon mutual interest acceptance.
                  </p>
                  
                  <h3>5. Limitation of Liability</h3>
                  <p>
                    StapuBox acts as a platform to connect users. We are not responsible for the 
                    conduct of users or any interactions that occur outside the platform.
                  </p>
                </CardContent>
              </Card>

              <Card id="privacy">
                <CardHeader>
                  <CardTitle className="text-2xl">Privacy Policy</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <h3>Information We Collect</h3>
                  <p>
                    We collect information you provide directly to us, such as when you create an 
                    account, update your profile, or contact us for support.
                  </p>
                  
                  <h3>How We Use Your Information</h3>
                  <p>
                    We use the information we collect to provide, maintain, and improve our services, 
                    including to facilitate connections between users.
                  </p>
                  
                  <h3>Information Sharing</h3>
                  <p>
                    We only share your contact information with other users when there is mutual 
                    interest acceptance. We do not sell your personal information to third parties.
                  </p>
                  
                  <h3>Data Security</h3>
                  <p>
                    We implement appropriate security measures to protect your personal information 
                    against unauthorized access, alteration, disclosure, or destruction.
                  </p>
                  
                  <h3>Contact Us</h3>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us at 
                    info@stapubox.com.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
