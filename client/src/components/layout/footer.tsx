import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Linkedin, Heart } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import stapuBoxLogo from "@assets/StapuBox_1751010772761.png";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src={stapuBoxLogo} 
                alt="StapuBox Logo" 
                className="h-8 w-auto mr-3 brightness-0 invert"
              />
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Global first sports networking platform connecting players and coaches based on location, 
              skill level, and activity preferences.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open('https://x.com/StapuBox', '_blank')}
              >
                <FaXTwitter className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open('https://www.facebook.com/people/StapuBox/61575324136037/', '_blank')}
              >
                <Facebook className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open('https://www.instagram.com/stapubox', '_blank')}
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
                onClick={() => window.open('https://www.linkedin.com/company/stapubox/', '_blank')}
              >
                <Linkedin className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/feed" className="text-gray-400 hover:text-white transition-colors">
                  Sports Feed
                </Link>
              </li>
              <li>
                <Link href="/about#careers" className="text-gray-400 hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/about#investors" className="text-gray-400 hover:text-white transition-colors">
                  Investors
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about#terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/about#privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:info@stapubox.com" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/about#help" className="text-gray-400 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 StapuBox. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-4 md:mt-0 flex items-center">
            Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> for sports enthusiasts globally
          </p>
        </div>
      </div>
    </footer>
  );
}
