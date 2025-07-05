import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown, Users, Newspaper, Info, LogIn, UserPlus, Trophy } from "lucide-react";
import { useAuth, authManager } from "@/lib/auth";
import { usePendingInterests } from "@/hooks/usePendingInterests";
import { Badge } from "@/components/ui/badge";
import stapuBoxLogo from "@assets/StapuBox_1751010772761.png";

export default function Header() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user, sessionToken } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pendingCount } = usePendingInterests();
  
  // Check if user is in registration flow (has session but not fully authenticated)
  const isInRegistration = sessionToken && !isAuthenticated;

  const handleLogout = async () => {
    await authManager.logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navigationItems = [
    { href: "/about", label: "About Us", icon: Info },
  ];

  const authenticatedNavigationItems = [
    { href: "/", label: "Home Page", icon: Users },
    { href: "/interests", label: "Interests", icon: Users },
    { href: "/feed", label: "StapuBuzz", icon: Newspaper },
    { href: "/profile", label: "My Profile", icon: Users },
    { href: "/about", label: "About Us", icon: Info },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src={stapuBoxLogo} 
              alt="StapuBox Logo" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {(isAuthenticated ? authenticatedNavigationItems : navigationItems).map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`text-gray-600 hover:text-gray-900 font-medium transition-colors relative flex items-center space-x-2 ${
                  location === item.href ? 'text-blue-600' : ''
                }`}
              >
                {item.href === "/feed" ? (
                  <>
                    <Newspaper className="w-4 h-4" />
                    <span>StapuBuzz</span>
                  </>
                ) : (
                  <span>{item.label}</span>
                )}
                {/* Show notification badge for Interests if there are pending interests */}
                {item.href === "/interests" && isAuthenticated && pendingCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            ))}

            {/* Authentication Section */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/register")}
                  className="player-theme"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profilePhotoUrl} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* StapuBuzz Logo for mobile - only show when authenticated */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/feed")}
                className="text-[#E17827] hover:bg-orange-50 flex items-center space-x-1"
              >
                <Newspaper className="w-4 h-4" />
                <span className="text-sm font-medium">StapuBuzz</span>
              </Button>
            )}
            {!isAuthenticated && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate("/register")}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 px-3 py-1.5 text-sm font-normal"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </Button>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col space-y-4 mt-8">
                  {(isAuthenticated ? authenticatedNavigationItems : navigationItems).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 py-2 transition-colors relative ${
                        location === item.href 
                          ? 'text-blue-600 font-medium' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {/* Show notification badge for Interests if there are pending interests */}
                      {item.href === "/interests" && isAuthenticated && pendingCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full px-1 ml-auto">
                          {pendingCount}
                        </Badge>
                      )}
                    </Link>
                  ))}

                  {!isAuthenticated && !isInRegistration ? (
                    <div className="pt-4 border-t space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          navigate("/login");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                      <Button
                        className="w-full player-theme"
                        onClick={() => {
                          navigate("/register");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </div>
                  ) : isInRegistration ? (
                    <div className="pt-4 border-t space-y-2">
                      <div className="p-2 text-sm text-gray-600">
                        Completing Registration...
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center space-x-3 p-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user?.profilePhotoUrl} />
                          <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.userType}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
