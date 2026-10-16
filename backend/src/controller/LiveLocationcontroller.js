const { updateEmployeeLocation, getCurrentEmployeeLocation, getEmployeeLocationHistory } = require('../models/LiveLocationmodel');

const UpdateEmployeeLocation = (req, res) => {
    try {
        const { employee_id, latitude, longitude } = req.body;
        if (!employee_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                message: 'Employee ID, latitude and longitude are required',
                success: false
            });
        }
        updateEmployeeLocation(
            employee_id,
            latitude,
            longitude,
            (err, result) => {
                if (err) {
                    console.log('Something went wrong', err);
                    return res.status(500).json({
                        message: 'Something went wrong',
                        success: false
                    });
                }
                return res.status(201).json({
                    message: 'Employee location updated successfully',
                    success: true,
                    location: {
                        id: result.insertId,
                        employee_id,
                        latitude,
                        longitude
                    }
                });
            }
        );
    } catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetCurrentEmployeeLocation = (req, res) => {
    try {

        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: 'Employee ID is required',
                success: false
            });
        }

     getCurrentEmployeeLocation(userId, (err, result) => {

            if (err) {
                console.log('Something went wrong', err);

                return res.status(500).json({
                    message: 'Something went wrong',
                    success: false
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: 'Employee location not found',
                    success: false
                });
            }

            return res.status(200).json({
                message: 'Employee current location fetched successfully',
                success: true,
                location: result[0]
            });
        });

    } catch (err) {

        console.log('Internal server error', err);

        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};

const GetEmployeeLocationHistory = (req, res) => {
    try {

        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: 'Employee ID is required',
                success: false
            });
        }

        getEmployeeLocationHistory(userId, (err, result) => {

            if (err) {
                console.log('Something went wrong', err);

                return res.status(500).json({
                    message: 'Something went wrong',
                    success: false
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: 'Employee location history not found',
                    success: false
                });
            }

            return res.status(200).json({
                message: 'Employee location history fetched successfully',
                success: true,
                history: result
            });
        });

    } catch (err) {

        console.log('Internal server error', err);

        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};
module.exports = {UpdateEmployeeLocation,GetCurrentEmployeeLocation,GetEmployeeLocationHistory};