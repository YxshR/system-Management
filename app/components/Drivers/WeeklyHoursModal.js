'use client';

import { useState } from 'react';
import Button from '../UI/Button';

const WeeklyHoursModal = ({ isOpen, onClose, driver }) => {
  if (!isOpen || !driver) return null;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const weeklyHours = driver.pastWeekHours || [];
  const totalWeekHours = weeklyHours.reduce((sum, hours) => sum + hours, 0);
  const averageDailyHours = totalWeekHours / 7;
  const maxDayHours = Math.max(...weeklyHours);
  const minDayHours = Math.min(...weeklyHours);

  const getHourColor = (hours) => {
    if (hours === 0) return 'bg-gray-100 text-gray-500';
    if (hours <= 4) return 'bg-green-100 text-green-800';
    if (hours <= 6) return 'bg-blue-100 text-blue-800';
    if (hours <= 8) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getBarHeight = (hours) => {
    const maxHeight = 100;
    const percentage = maxDayHours > 0 ? (hours / maxDayHours) * 100 : 0;
    return Math.max(percentage * (maxHeight / 100), 4);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-900">
              Weekly Hours - {driver.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Past 7 days work schedule and statistics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalWeekHours}h</div>
            <div className="text-sm text-blue-800">Total Hours</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{averageDailyHours.toFixed(1)}h</div>
            <div className="text-sm text-green-800">Daily Average</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{maxDayHours}h</div>
            <div className="text-sm text-orange-800">Peak Day</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{driver.shiftHours}h</div>
            <div className="text-sm text-purple-800">Daily Limit</div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Hours Breakdown</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-end justify-between space-x-2 h-32">
              {weeklyHours.map((hours, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-2">
                    <div
                      className={`w-8 rounded-t transition-all duration-300 ${getHourColor(hours)} flex items-end justify-center text-xs font-medium`}
                      style={{ height: `${getBarHeight(hours)}px` }}
                    >
                      {hours > 0 && <span className="mb-1">{hours}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">{dayAbbr[index]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Breakdown</h4>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Worked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    vs Daily Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {days.map((day, index) => {
                  const hours = weeklyHours[index] || 0;
                  const percentage = driver.shiftHours > 0 ? (hours / driver.shiftHours) * 100 : 0;
                  const isOvertime = hours > driver.shiftHours;
                  const isUnderworked = hours < driver.shiftHours * 0.5;
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-medium">{hours}h</span>
                          {hours > 0 && (
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  isOvertime ? 'bg-red-500' : 
                                  percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {percentage.toFixed(0)}% of {driver.shiftHours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          hours === 0 ? 'bg-gray-100 text-gray-800' :
                          isOvertime ? 'bg-red-100 text-red-800' :
                          isUnderworked ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {hours === 0 ? 'Off Day' :
                           isOvertime ? 'Overtime' :
                           isUnderworked ? 'Light Day' :
                           'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Performance Insights</h5>
          <div className="text-sm text-blue-800 space-y-1">
            {totalWeekHours > driver.shiftHours * 7 && (
              <p>• Driver worked {(totalWeekHours - driver.shiftHours * 7).toFixed(1)} hours overtime this week</p>
            )}
            {totalWeekHours < driver.shiftHours * 5 && (
              <p>• Driver worked below expected hours this week</p>
            )}
            {weeklyHours.filter(h => h === 0).length > 2 && (
              <p>• Driver had {weeklyHours.filter(h => h === 0).length} off days this week</p>
            )}
            {maxDayHours > driver.shiftHours * 1.5 && (
              <p>• Peak workday exceeded 150% of daily limit</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="primary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyHoursModal;