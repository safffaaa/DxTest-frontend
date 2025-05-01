import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Users, Award, Clock, Book, CheckCircle, XCircle, List } from 'lucide-react';
import instance from '../utils/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFrame, setTimeFrame] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResponses, setQuizResponses] = useState([]);
  const [questionAnalytics, setQuestionAnalytics] = useState([]);
  const [opinionResponses, setOpinionResponses] = useState([]);
  const [hookUsageData, setHookUsageData] = useState([]);

  // Fetch quiz responses when component mounts
  useEffect(() => {
    const fetchQuizResponses = async () => {
      try {
        setLoading(true);
        const response = await instance.get('/api/quiz-responses');
        setQuizResponses(response.data.responses);
        
        // Process data for analytics
        processAnalyticsData(response.data.responses);
      } catch (error) {
        console.error('Error fetching quiz responses:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResponses();
  }, []);

  // Process analytics data from quiz responses
  const processAnalyticsData = (responses) => {
    // Process question analytics
    const questionStats = responses.reduce((acc, response) => {
      response.answers.forEach(answer => {
        if (answer.type === 'single-choice') {
          const questionId = answer.questionId;
          if (!acc[questionId]) {
            acc[questionId] = {
              correctAnswers: 0,
              incorrectAnswers: 0,
              total: 0
            };
          }
          if (answer.correct) {
            acc[questionId].correctAnswers++;
          } else {
            acc[questionId].incorrectAnswers++;
          }
          acc[questionId].total++;
        }
      });
      return acc;
    }, {});

    setQuestionAnalytics(Object.entries(questionStats).map(([id, stats]) => ({
      id: parseInt(id),
      question: responses[0].answers.find(a => a.questionId === parseInt(id))?.question || '',
      correctAnswers: stats.correctAnswers,
      incorrectAnswers: stats.incorrectAnswers
    })));

    // Process opinion responses
    const opinions = responses
      .filter(response => response.answers.some(a => a.type === 'opinion'))
      .map(response => ({
        id: response._id,
        name: response.name,
        response: response.answers.find(a => a.type === 'opinion')?.answer || ''
      }));
    setOpinionResponses(opinions);

    // Process hook usage data
    const hookStats = responses.reduce((acc, response) => {
      const hookAnswer = response.answers.find(a => a.type === 'multiple-select');
      if (hookAnswer) {
        hookAnswer.answer.forEach(hook => {
          acc[hook] = (acc[hook] || 0) + 1;
        });
      }
      return acc;
    }, {});

    setHookUsageData(Object.entries(hookStats).map(([name, count]) => ({
      name,
      count
    })));
  };

  // Filter data based on timeframe
  const filterDataByTimeFrame = (data) => {
    if (timeFrame === 'all') return data;
    
    const today = new Date();
    let startDate = new Date();
    
    if (timeFrame === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeFrame === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (timeFrame === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    }
    
    return data.filter(item => new Date(item.createdAt) >= startDate);
  };

  const filteredUserData = filterDataByTimeFrame(quizResponses);
  
  // Calculate stats
  const totalUsers = filteredUserData.length;
  const averageScore = totalUsers > 0 
    ? (filteredUserData.reduce((sum, user) => sum + user.score, 0) / totalUsers).toFixed(1) 
    : 0;
  const passRate = totalUsers > 0 
    ? Math.round((filteredUserData.filter(user => user.score >= 1).length / totalUsers) * 100) 
    : 0;

  const pieData = [
    { name: 'Passed', value: filteredUserData.filter(user => user.score >= 1).length },
    { name: 'Failed', value: filteredUserData.filter(user => user.score < 1).length }
  ];
  
  const COLORS = ['#4CAF50', '#FF5252'];

  // Date-based completion data
  const completionsByDate = filteredUserData.reduce((acc, user) => {
    const date = new Date(user.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 1;
    } else {
      acc[date]++;
    }
    return acc;
  }, {});

  const completionData = Object.keys(completionsByDate).map(date => ({
    date,
    completions: completionsByDate[date]
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-[24px] font-[400] text-gray-800">React Knowledge Quiz Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitor quiz performance and participant data</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="bg-gray-100 rounded-lg p-1 inline-flex">
              <button 
                onClick={() => setTimeFrame('today')} 
                className={`px-3 py-1 rounded-md text-sm font-medium ${timeFrame === 'today' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setTimeFrame('week')} 
                className={`px-3 py-1 rounded-md text-sm font-medium ${timeFrame === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                This Week
              </button>
              <button 
                onClick={() => setTimeFrame('month')} 
                className={`px-3 py-1 rounded-md text-sm font-medium ${timeFrame === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                This Month
              </button>
              <button 
                onClick={() => setTimeFrame('all')} 
                className={`px-3 py-1 rounded-md text-sm font-medium ${timeFrame === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Participants</p>
              <p className="text-2xl font-semibold text-gray-800">{totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Award size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Average Score</p>
              <p className="text-2xl font-semibold text-gray-800">{averageScore} / 1</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <CheckCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pass Rate</p>
              <p className="text-2xl font-semibold text-gray-800">{passRate}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Latest Completion</p>
              <p className="text-2xl font-semibold text-gray-800">Today</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 border-b">
          <nav className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-4 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('participants')} 
              className={`px-4 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'participants' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Participants
            </button>
            <button 
              onClick={() => setActiveTab('questions')} 
              className={`px-4 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'questions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Question Analysis
            </button>
            <button 
              onClick={() => setActiveTab('opinions')} 
              className={`px-4 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'opinions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Opinion Responses
            </button>
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Quiz Performance Overview</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pass/Fail Distribution */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-4">Pass/Fail Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} participants`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Completions Over Time */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-4">Completions by Date</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={completionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completions" name="Completions" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Most Selected React Hooks */}
              <div className="bg-gray-50 p-6 rounded-lg lg:col-span-2">
                <h3 className="text-md font-medium text-gray-700 mb-4">Most Selected React Hooks</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hookUsageData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Times Selected" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'participants' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Quiz Participants</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUserData.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.mobile}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.score} / 1</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.score >= 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.score >= 1 ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredUserData.length}</span> participants
              </div>
              <div className="flex-1 flex justify-end">
                <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Previous
                  </a>
                  <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    1
                  </a>
                  <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Next
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'questions' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Question Analysis</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {questionAnalytics.map((q) => (
                <div key={q.id} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-md font-medium text-gray-700 mb-4">{q.question}</h3>
                  
                  {q.correctAnswers !== undefined && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          <span className="text-sm font-medium">Correct Answers</span>
                        </div>
                        <span className="text-sm font-medium">{q.correctAnswers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(q.correctAnswers / (q.correctAnswers + q.incorrectAnswers)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {q.incorrectAnswers !== undefined && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <XCircle size={16} className="text-red-500 mr-2" />
                          <span className="text-sm font-medium">Incorrect Answers</span>
                        </div>
                        <span className="text-sm font-medium">{q.incorrectAnswers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(q.incorrectAnswers / (q.correctAnswers + q.incorrectAnswers)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'opinions' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Opinion Responses: React Hooks Experience</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {opinionResponses.map((response) => (
                <div key={response.id} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {response.name.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{response.name}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{response.response}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Book className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Analysis Summary</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>Most participants have positive experiences with React hooks, with many citing useState and useEffect as their most commonly used hooks. There's a correlation between those who extensively use hooks and better scores on the React knowledge quiz.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>React Quiz Dashboard • Updated {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
};

export default Dashboard;