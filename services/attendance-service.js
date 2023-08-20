const Attendance = require('../models/attendance-model');

class AttendanceService{
    markAttendance = async data => Attendance.create(data);
    findAttendance = async (data) => Attendance.findOne(data);
    findAllAttendance = async (data) => Attendance.find(data);
}

module.exports = new AttendanceService();