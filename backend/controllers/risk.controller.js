const RiskService = require('../services/risk.service');
const User = require('../models/user.model');

exports.getRisk = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const riskAnalysis = await RiskService.calculateStreakRisk(user);

        res.status(200).json(riskAnalysis);
    } catch (error) {
        console.error('Risk calculation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
