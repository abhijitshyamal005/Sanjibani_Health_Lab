import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  // Mock data
  const monthlyData = [
    { month: 'Jan', revenue: 45000, orders: 45, patients: 38, tests: 52 },
    { month: 'Feb', revenue: 52000, orders: 52, patients: 45, tests: 58 },
    { month: 'Mar', revenue: 48000, orders: 48, patients: 42, tests: 55 },
    { month: 'Apr', revenue: 61000, orders: 61, patients: 55, tests: 68 },
    { month: 'May', revenue: 55000, orders: 55, patients: 48, tests: 62 },
    { month: 'Jun', revenue: 67000, orders: 67, patients: 60, tests: 75 },
    { month: 'Jul', revenue: 72000, orders: 72, patients: 65, tests: 80 },
    { month: 'Aug', revenue: 68000, orders: 68, patients: 62, tests: 76 },
    { month: 'Sep', revenue: 75000, orders: 75, patients: 68, tests: 83 },
    { month: 'Oct', revenue: 82000, orders: 82, patients: 75, tests: 90 },
    { month: 'Nov', revenue: 78000, orders: 78, patients: 72, tests: 87 },
    { month: 'Dec', revenue: 85000, orders: 85, patients: 78, tests: 95 }
  ];

  const weeklyData = [
    { week: 'Week 1', revenue: 12000, orders: 12, patients: 10 },
    { week: 'Week 2', revenue: 15000, orders: 15, patients: 13 },
    { week: 'Week 3', revenue: 18000, orders: 18, patients: 16 },
    { week: 'Week 4', revenue: 22000, orders: 22, patients: 20 }
  ];

  const testTypeData = [
    { name: 'Blood Test', value: 35, color: '#f97316' },
    { name: 'Heart Checkup', value: 25, color: '#EF4444' },
    { name: 'Liver Function', value: 20, color: '#22c55e' },
    { name: 'Kidney Test', value: 15, color: '#f97316' },
    { name: 'Full Body', value: 5, color: '#22c55e' }
  ];

  const ageGroupData = [
    { ageGroup: '18-25', count: 15, percentage: 15 },
    { ageGroup: '26-35', count: 28, percentage: 28 },
    { ageGroup: '36-45', count: 32, percentage: 32 },
    { ageGroup: '46-55', count: 18, percentage: 18 },
    { ageGroup: '55+', count: 7, percentage: 7 }
  ];

  const genderData = [
    { gender: 'Male', count: 55, percentage: 55 },
    { gender: 'Female', count: 45, percentage: 45 }
  ];

  const topTests = [
    { name: 'Complete Blood Count', count: 45, revenue: 54000 },
    { name: 'Blood Sugar Test', count: 38, revenue: 45600 },
    { name: 'Cholesterol Test', count: 32, revenue: 38400 },
    { name: 'ECG', count: 28, revenue: 70000 },
    { name: 'Liver Function Test', count: 25, revenue: 45000 }
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getData = () => {
    return timeRange === 'month' ? monthlyData : weeklyData;
  };

  const calculateGrowth = () => {
    const data = getData();
    if (data.length < 2) return { revenue: 0, orders: 0, patients: 0 };
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    return {
      revenue: ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1),
      orders: ((current.orders - previous.orders) / previous.orders * 100).toFixed(1),
      patients: ((current.patients - previous.patients) / previous.patients * 100).toFixed(1)
    };
  };

  const growth = calculateGrowth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into your laboratory performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Growth Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
              <p className="text-2xl font-bold text-gray-900">{growth.revenue}%</p>
            </div>
            <div className={`p-2 rounded-lg ${parseFloat(growth.revenue) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {parseFloat(growth.revenue) >= 0 ? (
                <TrendingUp className={`h-6 w-6 ${parseFloat(growth.revenue) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Growth</p>
              <p className="text-2xl font-bold text-gray-900">{growth.orders}%</p>
            </div>
            <div className={`p-2 rounded-lg ${parseFloat(growth.orders) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {parseFloat(growth.orders) >= 0 ? (
                <TrendingUp className={`h-6 w-6 ${parseFloat(growth.orders) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients Growth</p>
              <p className="text-2xl font-bold text-gray-900">{growth.patients}%</p>
            </div>
            <div className={`p-2 rounded-lg ${parseFloat(growth.patients) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {parseFloat(growth.patients) >= 0 ? (
                <TrendingUp className={`h-6 w-6 ${parseFloat(growth.patients) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeRange === 'month' ? 'month' : 'week'} />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeRange === 'month' ? 'month' : 'week'} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Test Types Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Types Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={testTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {testTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Group Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Group Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Patients']} />
              <Bar dataKey="count" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={genderData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="gender" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Patients']} />
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Tests */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Tests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topTests.map((test, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{test.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {test.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{test.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${(test.count / 45) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {((test.count / 45) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 