const Attendance = require('../models/attendance-model');

class AttendanceService{
    markAttendance = async data => Attendance.create(data);
    findAttendance = async (data) => Attendance.findOne(data);
}

module.exports = new AttendanceService();