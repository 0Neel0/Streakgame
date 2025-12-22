const router = require('express').Router();
const clanController = require('../controllers/clan.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All clan routes require authentication
router.use(verifyToken);

// Create a new clan
router.post('/create', clanController.createClan);

// Get user's clans
router.get('/user/all', clanController.getUserClans);

// Get clan details by ID
router.get('/:id', clanController.getClan);

// Join a clan
router.post('/:id/join', clanController.joinClan);

// Leave a clan
router.post('/:id/leave', clanController.leaveClan);

// Remove a member from clan (admin only)
// Remove a member from clan (admin only)
router.delete('/:id/member/:memberId', clanController.removeMember);

// Squad Check-in (admin only)
router.post('/:id/checkin', clanController.squadCheckIn);

// Update clan details (admin only)
router.put('/:id', clanController.updateClan);

// Send announcement (admin only)
router.post('/:id/announce', clanController.sendAnnouncement);

// Transfer ownership (admin only)
router.post('/:id/transfer', clanController.transferOwnership);

// Delete a clan (admin only)
router.delete('/:id', clanController.deleteClan);

// Invite a user to clan (admin only)
router.post('/:id/invite', clanController.inviteMember);

// Get pending clan invites
router.get('/user/invites', clanController.getUserInvites);

// Accept invite
router.post('/:id/accept-invite', clanController.acceptInvite);

// Reject invite
router.post('/:id/reject-invite', clanController.rejectInvite);

// Clan XP Transfer
router.post('/:id/transfer-xp', clanController.transferClanXP);

// Clan Chat - Get Messages
router.get('/:id/messages', clanController.getClanMessages);

// Clan Chat - Send Message
router.post('/:id/messages', clanController.sendClanMessage);

module.exports = router;
