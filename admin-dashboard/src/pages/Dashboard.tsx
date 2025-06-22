/**
 * Dashboard Page
 * Main dashboard with key metrics and recent activity
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  BookOnline,
  People,
  AttachMoney,
  FlightTakeoff,
  Hotel,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

interface BookingSummary {
  id: string;
  type: 'flight' | 'hotel';
  customerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulated data for now
      setMetrics([
        {
          title: 'Total Bookings',
          value: '1,234',
          change: '+12%',
          icon: <BookOnline />,
          color: '#1976d2',
        },
        {
          title: 'Total Revenue',
          value: 'AED 456,789',
          change: '+23%',
          icon: <AttachMoney />,
          color: '#4caf50',
        },
        {
          title: 'Active Users',
          value: '5,678',
          change: '+8%',
          icon: <People />,
          color: '#ff9800',
        },
        {
          title: 'Conversion Rate',
          value: '3.4%',
          change: '+0.5%',
          icon: <TrendingUp />,
          color: '#9c27b0',
        },
      ]);

      setRecentBookings([
        {
          id: '1',
          type: 'flight',
          customerName: 'John Doe',
          amount: 1250,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'hotel',
          customerName: 'Jane Smith',
          amount: 850,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          type: 'flight',
          customerName: 'Bob Johnson',
          amount: 2100,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        },
      ]);

      setChartData([
        { name: 'Mon', bookings: 45, revenue: 12000 },
        { name: 'Tue', bookings: 52, revenue: 15000 },
        { name: 'Wed', bookings: 48, revenue: 13500 },
        { name: 'Thu', bookings: 61, revenue: 18000 },
        { name: 'Fri', bookings: 72, revenue: 22000 },
        { name: 'Sat', bookings: 85, revenue: 28000 },
        { name: 'Sun', bookings: 78, revenue: 25000 },
      ]);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {/* Metric Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {metrics.map((metric, index) => (
          <Box key={index} sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: metric.color,
                      color: 'white',
                      p: 1,
                      borderRadius: 1,
                      mr: 2,
                    }}
                  >
                    {metric.icon}
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    {metric.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {metric.value}
                </Typography>
                {metric.change && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: metric.change.startsWith('+') ? 'success.main' : 'error.main',
                      mt: 1,
                    }}
                  >
                    {metric.change} from last month
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.67% - 12px)' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Weekly Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#8884d8"
                  name="Bookings"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  name="Revenue (AED)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.33% - 12px)' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Booking Types
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Flights', value: 234 },
                  { name: 'Hotels', value: 187 },
                  { name: 'Packages', value: 89 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>

      {/* Recent Bookings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Bookings
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    {booking.type === 'flight' ? (
                      <FlightTakeoff color="action" />
                    ) : (
                      <Hotel color="action" />
                    )}
                  </TableCell>
                  <TableCell>{booking.customerName}</TableCell>
                  <TableCell>{formatCurrency(booking.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(booking.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}