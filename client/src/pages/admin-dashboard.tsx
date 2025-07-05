import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Edit, Trash, Plus, Shield, Users, FileText, MessageSquare, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  email: string;
  name: string;
  loginTime: string;
}

interface TableData {
  name: string;
  data: any[];
  columns: string[];
}

const AUTHORIZED_EMAILS = [
  'ankiteshiiita@gmail.com',
  'nakumar987@gmail.com', 
  'shubhamraj01@gmail.com'
];

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [showLogin, setShowLogin] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
      setShowLogin(true);
    }
  }, []);

  // Check if user is authenticated admin
  const { data: authData } = useQuery({
    queryKey: ['/api/admin/auth'],
    enabled: !isAuthenticated && !showLogin,
    retry: false
  });

  useEffect(() => {
    if (authData && authData.email && AUTHORIZED_EMAILS.includes(authData.email)) {
      setAdminUser(authData);
      setIsAuthenticated(true);
      setShowLogin(false);
    }
  }, [authData]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/admin/auth/login', { email, password });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.user) {
        setAdminUser(data.user);
        setIsAuthenticated(true);
        setShowLogin(false);
        toast({
          title: "Success",
          description: "Successfully logged in to admin dashboard",
        });
        // Remove login parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('login');
        window.history.replaceState({}, '', url.toString());
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to authenticate",
        variant: "destructive"
      });
    }
  });

  const handleLogin = () => {
    if (selectedEmail && password) {
      loginMutation.mutate({ email: selectedEmail, password });
    }
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/logout', undefined);
      return await response.json();
    },
    onSuccess: () => {
      setAdminUser(null);
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "Successfully logged out from admin dashboard",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout Error",
        description: "There was an issue logging out",
        variant: "destructive"
      });
    }
  });

  // Fetch all table data
  const { data: tablesData, isLoading } = useQuery({
    queryKey: ['/api/admin/tables'],
    enabled: isAuthenticated
  });



  const downloadCSV = (tableName: string, data: any[]) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Complete",
      description: `${tableName} data exported successfully`
    });
  };

  const deleteRecord = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: number }) => {
      const response = await apiRequest('DELETE', `/api/admin/tables/${table}/${id}`, undefined);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tables'] });
      toast({
        title: "Record Deleted",
        description: "Record has been successfully deleted"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-orange-600 mb-4" />
            <CardTitle className="text-2xl">StapuBox Admin</CardTitle>
            <p className="text-gray-600">Secure access for authorized administrators</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select authorized email" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTHORIZED_EMAILS.map(email => (
                      <SelectItem key={email} value={email}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={handleLogin}
                disabled={!selectedEmail || !password || loginMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              <p>Password: <span className="font-mono">batman</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const tables = tablesData || {};
  const currentTableData = tables[selectedTable] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">StapuBox Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {adminUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last login: {new Date().toLocaleDateString()}
              </span>
              <Button 
                variant="outline" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{tables.users?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interests</p>
                  <p className="text-2xl font-bold text-gray-900">{tables.interests?.length || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{(tables.career_applications?.length || 0) + (tables.investor_inquiries?.length || 0)}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Feed Items</p>
                  <p className="text-2xl font-bold text-gray-900">{tables.feed_items?.length || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Tables */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Database Management</CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => downloadCSV(selectedTable, currentTableData)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!currentTableData.length}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTable} onValueChange={setSelectedTable}>
              <TabsList className="grid grid-cols-8 mb-6">
                {Object.keys(tables).map(tableName => (
                  <TabsTrigger key={tableName} value={tableName} className="text-xs">
                    {tableName.replace(/_/g, ' ').toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(tables).map(([tableName, data]) => (
                <TabsContent key={tableName} value={tableName}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold capitalize">
                        {tableName.replace(/_/g, ' ')} ({Array.isArray(data) ? data.length : 0} records)
                      </h3>
                    </div>

                    {Array.isArray(data) && data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(data[0]).map(column => (
                                <TableHead key={column} className="font-semibold">
                                  {column.replace(/_/g, ' ').toUpperCase()}
                                </TableHead>
                              ))}
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.map((row, index) => (
                              <TableRow key={index}>
                                {Object.entries(row).map(([column, value]) => (
                                  <TableCell key={column} className="max-w-xs truncate">
                                    {value instanceof Date ? value.toLocaleDateString() : 
                                     typeof value === 'object' ? JSON.stringify(value) : 
                                     String(value)}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // Edit functionality would go here
                                        toast({
                                          title: "Edit Feature",
                                          description: "Edit functionality coming soon"
                                        });
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => deleteRecord.mutate({ table: tableName, id: row.id })}
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No data available in this table</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}