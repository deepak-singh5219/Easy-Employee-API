const ErrorHandler = require('../utils/error-handler');
const userService = require('../services/user-service');
const UserDto = require('../dtos/user-dto');
const mongoose = require('mongoose');
const crypto = require('crypto');
const teamService = require('../services/team-service');
const attendanceService = require('../services/attendance-service');


class UserController {

    createUser = async (req,res,next) =>
    {
        const file = req.file;
        let {name,email,password,type, address, mobile} = req.body;
        const username = 'user'+crypto.randomInt(11111111,999999999);
        console.log(req.file)
        if(!name || !email || !username || !password || !type || !address || !file || !mobile) return next(ErrorHandler.badRequest('All Fields Required'));
        type = type.toLowerCase();
        if(type==='admin')
        {
            const adminPassword = req.body.adminPassword;
            if(!adminPassword)
                return next(ErrorHandler.badRequest(`Please Enter Your Password to Add ${name} as an Admin`));
            const {_id} = req.user;
            const {password:hashPassword} = await userService.findUser({_id});
            const isPasswordValid = await userService.verifyPassword(adminPassword,hashPassword);
            if(!isPasswordValid) return next(ErrorHandler.unAuthorized('You have entered a wrong password'));
        }
        const user = {
            name,email,username,mobile,password,type,address,image:file.filename
        }
        const userResp = await userService.createUser(user);
        if(!userResp) return next(ErrorHandler.serverError('Failed To Create An Account'));
        res.json({success:true,message:'User has been Added',user:new UserDto(user)});
    }

    updateUser = async (req,res,next) =>
    {
        const file = req.file;
        const filename = file && file.filename;
        let user,id;
        console.log(req.user.type);
        if(req.user.type==='admin')
        {
            const {id} = req.params;
            let {name,username,email,password,type,status, address, mobile} = req.body;
            type = type && type.toLowerCase();
            if(!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid User Id'));
            if(type)
            {
                const dbUser = await userService.findUser({_id:id});
                if(!dbUser) return next(ErrorHandler.badRequest('No User Found'));
                if(dbUser.type!=type)
                { 
                    const {_id} = req.user;
                    if(_id===id) return next(ErrorHandler.badRequest(`You Can't Change Your Own Position`));
                    const {adminPassword} = req.body;
                    if(!adminPassword)
                        return next(ErrorHandler.badRequest(`Please Enter Your Password To Change The Type`));
                    const {password:hashPassword} = await userService.findUser({_id});
                    const isPasswordValid = await userService.verifyPassword(adminPassword,hashPassword);
                    if(!isPasswordValid) return next(ErrorHandler.unAuthorized('You have entered a wrong password'));
    
                    if((dbUser.type==='employee') && (type==='admin' || type==='leader'))
                        if(dbUser.team!=null) return next(ErrorHandler.badRequest(`Error : ${dbUser.name} is in a team.`));
    
                    if((dbUser.type==='leader') && (type==='admin' || type==='employee'))
                        if(await teamService.findTeam({leader:id})) return next(ErrorHandler.badRequest(`Error : ${dbUser.name} is leading a team.`));
                }
            }
            user = {
                name,email,status,username,mobile,password,type,address,image:filename
            }
        }
        else
        {
            id =  req.user._id;
            let {name,username,address,mobile} = req.body;
            user = {
                name,username,mobile,address,image:filename
            }
        }
        console.log(user);
        const userResp = await userService.updateUser(id,user);
        console.log(userResp);
        if(!userResp) return next(ErrorHandler.serverError('Failed To Update Account'));
        res.json({success:true,message:'Account Updated'});
    }

    getUsers = async (req,res,next) =>
    {
        const type = req.path.split('/').pop().replace('s','');
        const emps = await userService.findUsers({type});
        if(!emps || emps.length<1) return next(ErrorHandler.notFound(`No ${type.charAt(0).toUpperCase()+type.slice(1).replace(' ','')} Found`));
        const employees = emps.map((o)=> new UserDto(o));
        res.json({success:true,message:`${type.charAt(0).toUpperCase()+type.slice(1).replace(' ','')} List Found`,data:employees})
    }


    getFreeEmployees = async (req,res,next) =>
    {
        const emps = await userService.findUsers({type:'employee',team:null});
        if(!emps || emps.length<1) return next(ErrorHandler.notFound(`No Free Employee Found`));
        const employees = emps.map((o)=> new UserDto(o));
        res.json({success:true,message:'Free Employees List Found',data:employees})
    }


    getUser = async (req,res,next) =>
    {
        const {id} = req.params;
        const type = req.path.replace(id,'').replace('/','').replace('/','');
        if(!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest(`Invalid ${type.charAt(0).toUpperCase() + type.slice(1).replace(' ','')} Id`));
        const emp = await userService.findUser({_id:id,type});
        if(!emp) return next(ErrorHandler.notFound(`No ${type.charAt(0).toUpperCase() + type.slice(1).replace(' ','')} Found`));
        res.json({success:true,message:'Employee Found',data:new UserDto(emp)})
    }

    getUserNoFilter = async (req,res,next) =>
    {
        const {id} = req.params;
        if(!mongoose.Types.ObjectId.isValid(id)) return next(ErrorHandler.badRequest('Invalid User Id'));
        const emp = await userService.findUser({_id:id});
        if(!emp) return next(ErrorHandler.notFound('No User Found'));
        res.json({success:true,message:'User Found',data:new UserDto(emp)})
    }

    getLeaders = async (req,res,next) =>
    {
        const leaders = await userService.findLeaders();
        const data = leaders.map((o)=>new UserDto(o));
        res.json({success:true,message:'Leaders Found',data})
    }

    getFreeLeaders = async (req,res,next) =>
    {
        const leaders = await userService.findFreeLeaders();
        const data = leaders.map((o)=>new UserDto(o));
        res.json({success:true,message:'Free Leaders Found',data})
    }

    markEmployeeAttendance = async (req,res,next) => {
        try {
        const {employeeID} = req.body;

        // const {_id} = employee;
        const newAttendance = {
            employeeID,
            year:new Date().getFullYear(),
            month:new Date().getMonth() + 1,
            date:new Date().getDate(),
            present: true, 
        };

       const isAttendanceMarked = await attendanceService.findAttendance(newAttendance);
       if(isAttendanceMarked) return next(ErrorHandler.notAllowed('Attendance Already Marked'));

       const resp = await attendanceService.markAttendance(newAttendance);
       console.log(resp);
       if(!resp) return next(ErrorHandler.serverError('Failed to mark attendance'));

       res.json({success:true,newAttendance,message:'Attendance Marked'});
            
        } catch (error) {
            res.json({success:false,error});    
        } 
    }

    viewEmployeeAttendance = async (req,res,next) => {
        try {
            const data = req.body;
            const resp = await attendanceService.findAllAttendance(data);
            if(!resp) return next(ErrorHandler.notFound('No Attendance found'));

            res.json({success:true,data:resp});
            
        } catch (error) {
            res.json({success:false,error});
        }
    }

    applyLeaveApplication = async (req, res, next) => {
        try {
            const data = req.body;
            const { applicantID, title, type, startDate, endDate, appliedDate, period, reason } = data;
            const newLeaveApplication = {
                applicantID,
                title,
                type,
                startDate,
                endDate,
                appliedDate, 
                period, 
                reason, 
                adminResponse:"pending"
            };

            const isLeaveApplied = await userService.findLeaveApplication({applicantID,startDate,endDate,appliedDate});
            if(isLeaveApplied) return next(ErrorHandler.notAllowed('Leave Already Applied'));

            const resp = await userService.createLeaveApplication(newLeaveApplication);
            if(!resp) return next(ErrorHandler.serverError('Failed to apply leave'));

            res.json({success:true,data:resp});

        } catch (error) {
            res.json({success:false,error});   
        }
    }

    viewLeaveApplications = async (req, res, next) => {
        try {
            const data = req.body;
            const resp = await userService.findAllLeaveApplications(data);
            if(!resp) return next(ErrorHandler.notFound('No Leave Applications found'));

            res.json({success:true,data:resp});

        } catch (error) {
            res.json({success:false,error});
        }
    }

    assignEmployeeSalary = async (req, res, next) => {
        try {
            const data = req.body;
            const isSalaryAssigned = await userService.findSalary(data);
            if(isSalaryAssigned) return next(ErrorHandler.notAllowed('Salary Already Assigned'));
            const resp = await userService.assignSalary(data);
            if(!resp) return next(ErrorHandler.serverError('Failed to assign salary'));
            res.json({success:true,data:resp}); 
        } catch (error) {
            res.json({success:false,error});
        }
    }



}

module.exports = new UserController();