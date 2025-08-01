import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Download, Calendar, DollarSign, Package } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const mockOrders = [
    {
      id: 'ORD001',
      patientName: 'John Doe',
      patientEmail: 'john.doe@email.com',
      patientPhone: '9876543210',
      testType: 'Blood Test',
      testDetails: 'Complete Blood Count, Blood Sugar, Cholesterol',
      amount: 1200,
      status: 'Completed',
      orderDate: '2024-01-15',
      completionDate: '2024-01-16',
      paymentStatus: 'Paid',
      paymentMethod: 'Online',
      labTechnician: 'Dr. Sarah Wilson',
      notes: 'Patient requested fasting blood test'
    },
    {
      id: 'ORD002',
      patientName: 'Jane Smith',
      patientEmail: 'jane.smith@email.com',
      patientPhone: '9876543211',
      testType: 'Heart Checkup',
      testDetails: 'ECG, Echo, Stress Test',
      amount: 2500,
      status: 'Pending',
      orderDate: '2024-01-14',
      completionDate: null,
      paymentStatus: 'Paid',
      paymentMethod: 'Cash',
      labTechnician: 'Dr. Mike Johnson',
      notes: 'Scheduled for tomorrow morning'
    },
    {
      id: 'ORD003',
      patientName: 'Mike Johnson',
      patientEmail: 'mike.johnson@email.com',
      patientPhone: '9876543212',
      testType: 'Liver Function',
      testDetails: 'Liver Function Test, Bilirubin, ALT, AST',
      amount: 1800,
      status: 'In Progress',
      orderDate: '2024-01-13',
      completionDate: null,
      paymentStatus: 'Paid',
      paymentMethod: 'Online',
      labTechnician: 'Dr. David Brown',
      notes: 'Patient has history of liver issues'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = orders.filter(order =>
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.testType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus,
            completionDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : order.completionDate
          }
        : order
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const calculateTotalRevenue = () => {
    return filteredOrders.reduce((total, order) => total + order.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-2">Track and manage all laboratory orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{calculateTotalRevenue().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredOrders.filter(o => o.status === 'Pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredOrders.filter(o => 
                  o.status === 'Completed' && 
                  o.completionDate === new Date().toISOString().split('T')[0]
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders by ID, patient name, or test type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.patientName}</div>
                      <div className="text-sm text-gray-500">{order.patientPhone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.testType}</div>
                      <div className="text-sm text-gray-500">{order.testDetails}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{order.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(order.status)}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(order)}
                        className="text-orange-600 hover:text-orange-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderModal = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Order Details - {order.id}</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{order.patientName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{order.patientEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{order.patientPhone}</p>
              </div>
            </div>
          </div>

          {/* Test Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Test Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Test Type</label>
                <p className="mt-1 text-sm text-gray-900">{order.testType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Test Details</label>
                <p className="mt-1 text-sm text-gray-900">{order.testDetails}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lab Technician</label>
                <p className="mt-1 text-sm text-gray-900">{order.labTechnician}</p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Order Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {order.completionDate ? new Date(order.completionDate).toLocaleDateString() : 'Not completed'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="mt-1 text-sm text-gray-900">₹{order.amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Payment Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                <p className="mt-1 text-sm text-gray-900">{order.paymentStatus}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900">{order.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Notes</h4>
              <p className="text-sm text-gray-900">{order.notes}</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-orange-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-600 flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orders; 