const express = require('express');
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all fees (admin managed only)
router.get('/', auth, async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('studentId', 'name rollNumber class')
      .populate('addedBy', 'email')
      .populate('updatedBy', 'email')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      message: `Found ${fees.length} fee records`,
      count: fees.length,
      data: fees
    });
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ 
      message: 'Failed to fetch fees', 
      error: error.message 
    });
  }
});

// Add fee (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const feeData = {
      ...req.body,
      addedBy: req.admin.id
    };
    
    // Convert DD-MM-YYYY to proper Date format
    if (feeData.dueDate && typeof feeData.dueDate === 'string') {
      const [day, month, year] = feeData.dueDate.split('-');
      feeData.dueDate = new Date(year, month - 1, day);
    }
    if (feeData.paidDate && typeof feeData.paidDate === 'string') {
      const [day, month, year] = feeData.paidDate.split('-');
      feeData.paidDate = new Date(year, month - 1, day);
    }
    
    const fee = new Fee(feeData);
    await fee.save();
    await fee.populate(['studentId', 'addedBy'], 'name rollNumber email');
    res.status(201).json({
      message: `Fee '${fee.feeType}' added successfully for ${fee.studentId.name}`,
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Failed to add fee', 
      error: error.message 
    });
  }
});

// Get due fees (admin view)
router.get('/due', auth, async (req, res) => {
  try {
    const dueFees = await Fee.find({ 
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lte: new Date() }
    })
    .populate('studentId', 'name rollNumber email phone')
    .populate('addedBy', 'email');
    res.json(dueFees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming fees (admin view)
router.get('/upcoming', auth, async (req, res) => {
  try {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingFees = await Fee.find({
      status: 'pending',
      dueDate: { $gte: new Date(), $lte: nextWeek }
    })
    .populate('studentId', 'name rollNumber email phone')
    .populate('addedBy', 'email');
    res.json(upcomingFees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark fee as paid (admin only)
router.put('/:id/pay', auth, async (req, res) => {
  try {
    // console.log('Mark as paid request:', { 
    //   feeId: req.params.id, 
    //   adminId: req.admin?.id,
    //   body: req.body
    // });
    
    // Validate admin
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({ 
        message: 'Admin authentication required',
        error: 'Invalid admin token'
      });
    }
    
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: 'Invalid fee ID format',
        feeId: req.params.id
      });
    }
    
    const existingFee = await Fee.findById(req.params.id);
    if (!existingFee) {
      return res.status(404).json({ 
        message: 'Fee record not found for payment',
        feeId: req.params.id
      });
    }
    
    if (existingFee.status === 'paid') {
      return res.status(400).json({ 
        message: 'Fee is already marked as paid',
        feeId: req.params.id
      });
    }
    
    const requestBody = req.body || {};
    const updateData = {
      status: 'paid', 
      paidDate: new Date(),
      paidAmount: requestBody.paidAmount || existingFee.amount,
      paymentMethod: requestBody.paymentMethod || 'Cash',
      updatedBy: req.admin.id,
      updatedAt: new Date()
    };
    
    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('studentId', 'name rollNumber')
    .populate('updatedBy', 'email');
    
    if (!fee) {
      return res.status(404).json({ 
        message: 'Fee not found after update',
        feeId: req.params.id
      });
    }
    
    const paidAmount = updateData.paidAmount || existingFee.amount;
    const studentName = fee.studentId?.name || 'Student';
    
    res.json({
      message: `Payment of ₹${paidAmount} received successfully for ${studentName}`,
      success: true,
      data: fee
    });
  } catch (error) {
    // console.error('Error marking fee as paid:', error);
    res.status(500).json({ 
      message: 'Failed to process payment', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update fee (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert DD-MM-YYYY to proper Date format
    if (updateData.dueDate && typeof updateData.dueDate === 'string') {
      const [day, month, year] = updateData.dueDate.split('-');
      updateData.dueDate = new Date(year, month - 1, day);
    }
    if (updateData.paidDate && typeof updateData.paidDate === 'string') {
      const [day, month, year] = updateData.paidDate.split('-');
      updateData.paidDate = new Date(year, month - 1, day);
    }
    
    const fee = await Fee.findByIdAndUpdate(
      req.params.id,
      { 
        ...updateData,
        updatedBy: req.admin.id,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('studentId', 'name rollNumber')
    .populate('addedBy', 'email')
    .populate('updatedBy', 'email');
    
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    res.json({
      message: `Fee updated successfully for ${fee.studentId.name}`,
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Failed to update fee',
      error: error.message 
    });
  }
});

// Get single fee by ID (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('studentId', 'name rollNumber class phone email')
      .populate('addedBy', 'email')
      .populate('updatedBy', 'email');
    
    if (!fee) {
      return res.status(404).json({ 
        message: 'Fee record not found',
        feeId: req.params.id
      });
    }
    
    res.json({
      message: 'Fee details retrieved successfully',
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch fee details', 
      error: error.message 
    });
  }
});

// Get fee details for receipt (admin only)
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('studentId', 'name rollNumber class phone email')
      .populate('addedBy', 'email')
      .populate('updatedBy', 'email');
    
    if (!fee) {
      return res.status(404).json({ 
        message: 'Fee record not found for receipt generation',
        feeId: req.params.id
      });
    }
    
    res.json({
      message: 'Fee receipt data retrieved successfully',
      success: true,
      data: {
        fee,
        student: fee.studentId,
        receiptNumber: `FMS-${fee._id.toString().slice(-6).toUpperCase()}`,
        generatedAt: new Date(),
        generatedBy: req.admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate receipt data', 
      error: error.message 
    });
  }
});

// Delete fee (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('studentId', 'name');
    if (!fee) {
      return res.status(404).json({ 
        message: 'Fee record not found for deletion',
        feeId: req.params.id
      });
    }
    
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ 
      message: `Fee record deleted successfully for ${fee.studentId?.name || 'Unknown Student'}`,
      success: true,
      deletedFee: {
        id: fee._id,
        feeType: fee.feeType,
        amount: fee.amount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete fee', 
      error: error.message 
    });
  }
});

module.exports = router;