const express = require('express');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const auth = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Total students count
    const totalStudents = await Student.countDocuments();
    
    // Total fees count
    const totalFees = await Fee.countDocuments();
    
    // Pending fees count
    const pendingFees = await Fee.countDocuments({ status: 'pending' });
    
    // Overdue fees count
    const overdueFees = await Fee.countDocuments({ 
      status: 'pending',
      dueDate: { $lt: new Date() }
    });
    
    // Paid fees count
    const paidFees = await Fee.countDocuments({ status: 'paid' });
    
    // Total amount collected
    const totalAmountResult = await Fee.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmountCollected = totalAmountResult[0]?.total || 0;
    
    // Pending amount
    const pendingAmountResult = await Fee.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingAmount = pendingAmountResult[0]?.total || 0;

    res.json({
      success: true,
      totalStudents,
      totalFees,
      pendingFees,
      overdueFees,
      paidFees,
      totalAmountCollected,
      pendingAmount
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;